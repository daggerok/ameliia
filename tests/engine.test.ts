/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { type L10n, type Problem, type SkillId, TOPIC_OF, makeRng, sameAnswer } from '../src/engine/core';
import { longDivision, partialQuotients } from '../src/engine/division';
import { roundTo } from '../src/engine/estimation';
import { AGAIN, ALL_SKILLS, DAILY_RIGHT, FACT_EVERY, logQuizResult, logTheoryRead, minReadSec, factDue, nextFact, HOMEWORKS, PREP_PLAN, STRATEGIES, activeHomework, addDays, addPaintStars, addTime, applyAnswer, applyQuiz, applyTest, buildTest, chooseNextPainting, currentHomework, dailyGoal, dayOf, fixRework, hintOpen, kindOf, HINT_PAUSE, HINT_PAUSE_MAX, HINT_PAUSE_MIN, logMistake, newState, normalize, nextProblem, nextSkill, prepPicks, reviewsDue, testPlan, totalTime, uncovered } from '../src/engine/game';
import { KINDS_4_2 } from '../src/engine/topic4';
import { KINDS_4_5 } from '../src/engine/topic4area';
import { factKey, makeFact } from '../src/engine/facts';
import { KINDS_4_4, partials } from '../src/engine/topic4arr';
import { KINDS_4_3 } from '../src/engine/topic4est';
import { makeFreshProblem, makeProblem } from '../src/engine';
import { HOMEWORK_MISTAKES, reworkGroups, reworkNext, reworkQueue, reworkSkill, reworkTheory } from '../src/engine/mistakes';
import { buildQuiz } from '../src/engine/quiz';
import { buildTheory, chainOf, readSeconds } from '../src/engine/theory';
import { theoryRows } from '../src/engine/progress';
import { placeParts, standardRows } from '../src/engine/strategies';

const N = 1500;
const num = (s: string) => Number(s.replace(/[,\s$]/g, ''));

// ---------- an independent arithmetic checker for every "a op b = c" in the texts ----------

const evaluate = (expr: string): number | null => {
    const tokens = expr.replace(/\$/g, '').match(/\d[\d,]*|[×÷+−()]/g);
    if (!tokens) return null;
    let i = 0;
    const atom = (): number => {
        const t = tokens[i++];
        if (t === '(') { const v = sum(); i++; return v; }
        return num(t);
    };
    const prod = (): number => {
        let v = atom();
        while (tokens[i] === '×' || tokens[i] === '÷') { const op = tokens[i++]; const r = atom(); v = op === '×' ? v * r : v / r; }
        return v;
    };
    const sum = (): number => {
        let v = prod();
        while (tokens[i] === '+' || tokens[i] === '−') { const op = tokens[i++]; const r = prod(); v = op === '+' ? v + r : v - r; }
        return v;
    };
    try { return sum(); } catch { return null; }
};

// finds "12 × 3 + 4 = 40" and chains like "50 + 50 = 50 × 2 = 100"; skips "17 ÷ 5 = 3 R 2" (remainder notation) and clock times
const EXPR = String.raw`\(?\$?\d[\d,]*\)?(?:\s*[×÷+−]\s*\(?\$?\d[\d,]*\)?)*`;
const CHAIN = new RegExp(`(${EXPR})((?:\\s*=\\s*${EXPR})+)(?!\\s*(?:R|\\(остаток)|\\d|:\\d)`, 'g');
const claims = (text: string) => {
    const out: { parts: string[]; raw: string }[] = [];
    for (const m of Array.from(text.matchAll(CHAIN))) {
        const before = text.slice(Math.max(0, m.index - 1), m.index);
        if (/[\d:]/.test(before)) continue;
        const parts = m[0].split('=').map(s => s.trim());
        if (parts.length >= 2 && parts.some(p => /[×÷+−]/.test(p))) out.push({ parts, raw: m[0] });
    }
    return out;
};

// Russian groups thousands with a space (1 000), English with a comma
const joinGroups = (s: string) => { let out = s; for (let i = 0; i < 3; i++) out = out.replace(/(\d)[ \u00a0](\d{3})(?!\d)/g, '$1$2'); return out; };

const checkMath = (texts: string[], where: string) => {
    for (const t of texts.map(joinGroups)) for (const c of claims(t)) {
        const values = c.parts.map(evaluate);
        if (values.some(v => v === null || Math.abs(v - values[0]!) > 1e-9)) throw new Error(`${where}: wrong math "${c.raw}" (${values.join(' vs ')}) in: ${t}`);
    }
};

const textsOf = (p: Problem): L10n[] => [p.prompt, p.hint, ...p.steps, ...(p.answer.kind === 'choice' || p.answer.kind === 'multi' ? p.answer.options : []), ...(p.answer.kind === 'fill' && (p.answer.layout === 'lines' || p.answer.layout === 'vertical') ? p.answer.lines.flatMap(l => (l.label ? [l.label] : [])) : [])];
// "spot the mistake" tasks show a wrong claim in the question on purpose
const deliberateMistake = (p: Problem) => /^div-check:[zr]:|^est-product:r:/.test(p.id);
const rightOptions = (p: Problem): L10n[] => {
    const a = p.answer;
    return a.kind === 'choice' ? [a.options[a.correct]] : a.kind === 'multi' ? a.correct.map(i => a.options[i]) : [];
};
// wrong options of a choice question are wrong on purpose: only the right ones are checked
const mathTextsOf = (p: Problem): L10n[] => [...(deliberateMistake(p) ? [] : [p.prompt]), p.hint, ...p.steps, ...rightOptions(p)];

const checkText = (l: L10n, where: string) => {
    for (const lang of ['en', 'ru'] as const) {
        const s = l[lang];
        if (!s || !s.trim()) throw new Error(`${where}: empty ${lang}`);
        if (/undefined|NaN|\[object|null/.test(s)) throw new Error(`${where}: broken ${lang} text: ${s}`);
    }
    if (/[А-Яа-яЁё]/.test(l.en)) throw new Error(`${where}: Cyrillic in English: ${l.en}`);
    // the science words task writes the word in English on purpose (the test is in English)
    if (/sci-words/.test(where)) return;
    // Russian may keep a few English science words on purpose (velocity, acceleration, speed, iPad, R)
    const latin = (l.ru.match(/[A-Za-z]{3,}/g) ?? []).filter(w => !['velocity', 'acceleration', 'speed', 'ipad', 'compatible', 'numbers', 'estimate', 'rounding'].includes(w.toLowerCase()));
    if (latin.length) throw new Error(`${where}: English words in Russian (${latin.join(', ')}): ${l.ru}`);
};

// ---------- independent recomputation of every answer from the raw numbers ----------

const expected = (p: Problem): number | { q: number; r: number } | 'choice' => {
    const d = p.data;
    const n = (k: string) => Number(d[k]);
    switch (p.skill) {
        case 'div-facts': case 'div-2d': case 'div-3d': case 'div-zero': case 'div-4d':
            return Math.floor(n('dividend') / n('divisor'));
        case 'div-rem': return { q: Math.floor(n('dividend') / n('divisor')), r: n('dividend') % n('divisor') };
        case 'div-word': {
            const q = Math.floor(n('dividend') / n('divisor')), r = n('dividend') % n('divisor');
            return d.kind === 'up' ? (r ? q + 1 : q) : d.kind === 'down' ? q : r;
        }
        case 'speed-basic':
            if ('plane' in d) return d.ask === 'plane' ? n('distance') / n('tPlane') : d.ask === 'car' ? n('distance') / n('tCar') : n('tCar') - n('tPlane');
            if ('tTrain' in d) return d.ask === 'car' ? n('distance') / n('tCar') : d.ask === 'train' ? n('distance') / n('tTrain') : n('distance') / n('tTrain') - n('distance') / n('tCar');
            return n('distance') / n('time');
        case 'speed-find': return p.id.includes(':d:') ? n('speed') * n('time') : n('distance') / n('speed');
        case 'speed-trip': return p.answer.kind === 'choice' ? 'choice' : (p.id.includes(':leg:') ? n('value') : n('D') / n('T'));
        case 'speed-units':
            if (p.id.includes(':hm:')) return n('h') * 60 + n('m');
            if (p.id.includes(':half:')) return n('speed') / 2;
            if (p.id.includes(':per:')) return n('d') * (60 / n('mins'));
            return n('end') - n('start');
        case 'round':
            return p.id.includes('greatest') || p.id.includes('least') ? n('value') : roundTo(n('n'), n('place'));
        case 'est-sum': {
            const vals = (d.values as number[]).map(v => roundTo(v, n('place')));
            return d.subtract ? vals[0] - vals[1] : vals.reduce((a, b) => a + b, 0);
        }
        case 'est-product':
            if (p.answer.kind === 'choice') return 'choice';
            return 'rb' in d ? roundTo(n('a'), 10) * roundTo(n('b'), 10) : n('ra') * n('b');
        case 'multiply': return n('a') * n('b');
        case 'mult-area': case 'mult-dist': case 'mult-partial': case 'mult-standard': case 'compare': case 'word-steps': return 'choice';
        case 'mult-tens': return n('m') * n('b');
        // the only number task of these two: 8 × 50 with the associative property, and cups of coffee for some weeks
        case 'mult-mental': return n('x') * n('y');
        case 'mult-word': return n('x') * n('w');
        // the products, the story, and how many more minutes: value is the product of the lesson
        case 'mult-2x10': return p.answer.kind === 'number' ? n('value') : 'choice';
        // estimates by rounding each number to the nearest ten
        case 'est-2x2': return p.answer.kind === 'number' ? roundTo(n('a'), 10) * roundTo(n('b'), 10) : 'choice';
        // the story is a × b, the sales add two products, the missing factor is the product divided by the given factor
        // the product, the class story and the sum of the two days at the arena
        // a fact a × b and a number × 10, 100 or 1,000
        case 'mult-facts': return n('a') * n('b');
        case 'dist-2x2': return p.answer.kind !== 'number' ? 'choice' : p.data.style === 'add' ? n('x') + n('y') : n('a') * n('b');
        case 'mult-2x2': return p.answer.kind !== 'number' ? 'choice' : p.data.style === 'sales' ? n('c1') * n('p1') + n('c2') * n('p2') : p.data.style === 'factor' ? n('p') / n('a') : n('a') * n('b');
        default: return 'choice';
    }
};

const each = (skill: SkillId, fn: (p: Problem, seed: number) => void) => {
    for (let seed = 1; seed <= N; seed++) fn(makeProblem(skill, makeRng(seed * 7919 + skill.length)), seed);
};

describe('the math checker itself', () => {
    test('catches wrong claims and lets right ones pass', () => {
        expect(() => checkMath(['Multiply: 5 × 3 = 16.'], 'x')).toThrow();
        expect(() => checkMath(['1 000 − 400 = 700'].map(s => s), 'x')).toThrow();
        expect(() => checkMath(['50 + 50 + 50 = 50 × 3 = 160 miles'], 'x')).toThrow();
        expect(() => checkMath(['Check: 21 × 7 + 3 = 151 ✓'], 'x')).toThrow();
        expect(() => checkMath(['Divide: 18 ÷ 3 = 5.'], 'x')).toThrow();
        expect(() => checkMath(['9 × 300 = 2,701: write it'], 'x')).toThrow();
        expect(() => checkMath(['1,234 + 1 = 1,235', '9 × 300 = 2,700: write it', '1 000 − 400 = 600', '17 ÷ 5 = 3 R 2', '(60 + 20) ÷ 2 = 40', '50 + 50 = 50 × 2 = 100'], 'x')).not.toThrow();
    });
});

// ---------- an independent solver for the strategy worksheets ----------

const placesOf = (n: number) => { const out: number[] = []; let p = 1; for (let x = n; x > 0; x = Math.floor(x / 10), p *= 10) if (x % 10) out.unshift((x % 10) * p); return out; };

const expectedBlanks = (p: Problem): number[] => {
    const m = Number(p.data.m), a = Number(p.data.a), two = Number(p.data.two) === 1;
    const pa = placesOf(a), pm = two ? placesOf(m) : [m];
    if (p.skill === 'mult-area') return [...pa, ...(two ? pm : []), ...pm.flatMap(x => pa.map(y => x * y)), m * a];
    if (p.skill === 'mult-dist') return [...pa, ...pa.map(y => m * y), m * a];
    if (p.skill === 'mult-partial') return [...pm.flatMap(x => pa.map(y => x * y)), m * a];
    // standard algorithm in a column, in solving order: each answer digit from the ones place, then the carry over the next digit
    const out: number[] = [];
    const answer = String(m * a).split('').reverse().map(Number);
    const digits = String(a).split('').reverse().map(Number);
    let carry = 0;
    answer.forEach((d, i) => {
        out.push(d);
        if (i < digits.length - 1) { carry = Math.floor((m * digits[i] + carry) / 10); out.push(carry); }
    });
    return out;
};

const blankRefs = (p: Problem): number[] => {
    if (p.answer.kind !== 'fill') return [];
    if (p.answer.layout === 'column') return [...p.answer.digits, ...p.answer.carries].map(x => x.b);
    const parts = p.answer.layout === 'area'
        ? [...p.answer.top, ...p.answer.left, ...p.answer.cells.flat().map(b => ({ b })), { b: p.answer.total }]
        : p.answer.lines.flatMap(l => l.parts);
    return parts.flatMap(x => (typeof x === 'object' && 'b' in x ? [x.b] : []));
};

describe('homework topics: comparison and word problems', () => {
    test('comparison: times as much multiplies, how much more subtracts, how many times divides', () => {
        each('compare', p => {
            const b = Number(p.data.b), k = Number(p.data.k);
            if (p.answer.kind === 'fill') {
                const want = p.data.style === 'two' ? [b, k, b * k, b * k, b, b * k - b] : p.data.style === 'times' ? [b, k, b * k] : [b * k, b, k];
                expect(p.answer.values).toEqual(want);
            } else if (p.answer.kind === 'choice') {
                const right = p.answer.options[p.answer.correct].en;
                if (p.data.style === 'model') expect(right).toMatch(new RegExp(`: 1 box of ${b}; .*: ${k} boxes of ${b}$`));
                else expect(right).toBe(p.data.style === 'choose' ? `${right.split(' = ')[0]} = ${b} × ${k}` : `${right.split(' = ')[0]} = ${b * k} − ${b}`);
            }
        });
    });
    test('word problems: the right numbers belong together, the extra item is never used', () => {
        each('word-steps', p => {
            const { c1, p1, c2, p2 } = p.data as Record<string, number>;
            // both prices are written as money in both languages
            expect(p.prompt.en).toContain(`$${p1}`);
            expect(p.prompt.en).toContain(`$${p2}`);
            expect(p.prompt.ru).toContain(`$${p1}`);
            if (p.answer.kind === 'fill') {
                const v = p.answer.values;
                expect(v.slice(0, 3)).toEqual([c1, p1, c1 * p1]);
                if (p.data.style === 'one') expect(v.slice(3)).toEqual([Math.round(c1 / 100) * 100, p1, Math.round(c1 / 100) * 100 * p1]);
                if (p.data.style === 'both') expect(v.slice(3)).toEqual([c2, p2, c2 * p2, c1 * p1, c2 * p2, c1 * p1 + c2 * p2]);
                if (p.data.style === 'more') expect(v[8]).toBe(Math.abs(c1 * p1 - c2 * p2));
            } else if (p.answer.kind === 'choice') {
                const right = p.answer.options[p.answer.correct].en;
                if (p.data.style === 'need') expect(right).toBe(`${c1.toLocaleString('en-US')} and $${p1}`);
                if (p.data.style === 'reason') expect(right).toContain('is about');
                if (p.data.style === 'like') expect(right).toMatch(/^Yes: how many .* × the price of one/);
                if (p.data.style === 'meaning') expect(right).toMatch([/^how many .* were ordered$/, /^the price of /, /^how many .* were ordered$/][Number(p.data.which)]);
                if (p.data.style === 'meaning') expect(p.prompt.en.endsWith(`What does ${[c1.toLocaleString('en-US'), `$${p1}`, c2.toLocaleString('en-US')][Number(p.data.which)]} mean?`)).toBe(true);
                if (p.data.style === 'diagram') expect(right).toBe(`${p1} equal parts of ${c1.toLocaleString('en-US')}, the whole is c: multiply`);
                if (p.data.style === 'blocks') expect(right).toMatch(/^No: .* takes too long/);
                // the solution always ends with the cost of the item the question asks about
                if (['like', 'meaning', 'diagram', 'blocks'].includes(String(p.data.style))) expect(p.steps.at(-1)!.en).toContain(`$${(c1 * p1).toLocaleString('en-US')}`);
            }
        });
    });
});

describe('multiplication strategy worksheets', () => {
    for (const skill of ['mult-area', 'mult-dist', 'mult-partial', 'mult-standard'] as SkillId[]) {
        test(`${skill}: every blank is right and on the sheet once`, () => {
            let twoDigit = 0;
            each(skill, p => {
                if (p.answer.kind !== 'fill') throw new Error('fill expected');
                expect(p.answer.values).toEqual(expectedBlanks(p));
                expect(blankRefs(p).sort((x, y) => x - y)).toEqual(p.answer.values.map((_, i) => i));
                if (p.answer.layout === 'column') expect(Number(p.answer.digits.map(d => p.answer.kind === 'fill' ? p.answer.values[d.b] : 0).reverse().join(''))).toBe(Number(p.data.m) * Number(p.data.a));
                else expect(p.answer.values[p.answer.values.length - 1]).toBe(Number(p.data.m) * Number(p.data.a));
                expect(sameAnswer(p.answer, { blanks: p.answer.values })).toBe(true);
                expect(sameAnswer(p.answer, { blanks: p.answer.values.map((v, i) => (i === 0 ? v + 1 : v)) })).toBe(false);
                // 4.NBT.B.5: up to 4-digit × 1-digit, or 2-digit × 2-digit; the standard algorithm only with a 1-digit multiplier
                const m = Number(p.data.m), a = Number(p.data.a);
                if (Number(p.data.two)) { twoDigit++; expect(m).toBeLessThan(100); expect(a).toBeLessThan(100); } else { expect(m).toBeLessThan(10); expect(a).toBeLessThan(10000); }
            });
            if (skill !== 'mult-standard') expect(twoDigit).toBeGreaterThan(200);
        });
    }
    test('parts of a sum may come in any order, area boxes follow her own order', () => {
        for (let seed = 1; seed <= 300; seed++) {
            const d = makeProblem('mult-dist', makeRng(seed));
            if (d.answer.kind !== 'fill' || d.answer.layout === 'area') throw new Error('sheet');
            const n = (d.answer.values.length - 1) / 2;
            const swapped = [...d.answer.values];
            [swapped[0], swapped[n - 1]] = [swapped[n - 1], swapped[0]];
            // parts swapped together with their products are right, a product next to the wrong part is not
            const k = n;
            [swapped[k], swapped[k + n - 1]] = [swapped[k + n - 1], swapped[k]];
            expect(sameAnswer(d.answer, { blanks: swapped })).toBe(true);
            const mismatched = [...d.answer.values];
            [mismatched[0], mismatched[n - 1]] = [mismatched[n - 1], mismatched[0]];
            if (mismatched[0] !== d.answer.values[0]) expect(sameAnswer(d.answer, { blanks: mismatched })).toBe(false);
            const area = makeProblem('mult-area', makeRng(seed));
            if (area.answer.kind !== 'fill' || area.answer.layout !== 'area') throw new Error('area');
            const v = [...area.answer.values];
            const topIdx = area.answer.top.flatMap(x => (typeof x === 'object' && 'b' in x ? [x.b] : []));
            const left = area.answer.left.map(x => (typeof x === 'string' ? Number(x) : 'b' in x ? v[x.b] : 0));
            // her top in reverse order with boxes that match it is right
            const tops = topIdx.map(i => v[i]).reverse();
            topIdx.forEach((i, k) => { v[i] = tops[k]; });
            area.answer.cells.forEach((row, r) => row.forEach((b, c) => { v[b] = left[r] * tops[c]; }));
            expect(sameAnswer(area.answer, { blanks: v })).toBe(true);
            // the same reversed top with the old boxes is wrong
            const old = [...area.answer.values];
            topIdx.forEach((i, k) => { old[i] = tops[k]; });
            if (topIdx.length > 1) expect(sameAnswer(area.answer, { blanks: old })).toBe(false);
        }
    });
    test('the standard algorithm of the anchor chart: 182 × 6', () => {
        const rows = standardRows(6, 182);
        expect(rows.map(r => [r.prod, r.sum, r.write, r.carryOut])).toEqual([[12, 12, 2, 1], [48, 49, 9, 4], [6, 10, 10, 0]]);
        expect(placeParts(182)).toEqual([100, 80, 2]);
        expect(placeParts(4006)).toEqual([4000, 6]);
    });
});

describe('Topic 3 test prep and Science Chapter 2', () => {
    // an option like "(8 × 400) + (8 × 90) + (8 × 3)" or "9,515" is worth exactly its value
    const valueOf = (o: L10n) => evaluate(o.en);
    test('select all: an option is right exactly when its value is the product', () => {
        let multis = 0;
        each('mult-expr', p => {
            const a = p.answer;
            const target = Number(p.data.value);
            if (a.kind === 'multi') {
                multis++;
                a.options.forEach((o, i) => {
                    const v = p.data.style === 'partials' ? num(o.en) : valueOf(o);
                    const right = p.data.style === 'partials' ? placesOf(Number(p.data.a)).map(x => x * Number(p.data.m)).includes(v!) : v === target;
                    if (right !== a.correct.includes(i)) throw new Error(`${p.id}: option "${o.en}" = ${v} marked ${a.correct.includes(i)}`);
                });
                if (p.data.style === 'partials') expect(a.correct.length).toBe(placesOf(Number(p.data.a)).length);
                // the right picks are accepted, a missing or an extra pick is not
                expect(sameAnswer(a, { choices: a.correct })).toBe(true);
                expect(sameAnswer(a, { choices: [...a.correct].reverse() })).toBe(true);
                expect(sameAnswer(a, { choices: a.correct.slice(1) })).toBe(false);
                const extra = a.options.findIndex((_, i) => !a.correct.includes(i));
                expect(sameAnswer(a, { choices: [...a.correct, extra] })).toBe(false);
            } else if (a.kind === 'choice') {
                a.options.forEach((o, i) => {
                    const v = valueOf(o);
                    if ((v === target) !== (i === a.correct)) throw new Error(`${p.id}: option "${o.en}" = ${v}, target ${target}`);
                });
            }
        });
        expect(multis).toBeGreaterThan(500);
    });
    test('multiples of 10, 100 and 1,000', () => {
        each('mult-tens', p => {
            const m = Number(p.data.m), b = Number(p.data.b);
            expect([10, 100, 1000].some(z => b % z === 0 && b / z < 10)).toBe(true);
            if (p.answer.kind === 'fill') {
                const d = p.data.style === 'pattern' ? b / 1000 : Number(String(b).replace(/0+$/, ''));
                expect(p.answer.values).toEqual(p.data.style === 'pattern' ? [1, 10, 100, 1000].map(z => m * d * z) : [d, m * d, m * b]);
            }
            if (p.answer.kind === 'choice') expect(num(p.answer.options[p.answer.correct].en)).toBe(m * b);
        });
    });
    test('mental math: a round number close by, then the right fix', () => {
        each('mult-mental', p => {
            const { m, a, R, k, sub } = p.data as Record<string, number>;
            if (p.answer.kind === 'fill') {
                expect(R % 10).toBe(0);
                expect(Math.abs(R - a)).toBeLessThanOrEqual(3);
                expect(sub ? R - k : R + k).toBe(a);
                expect(p.answer.values).toEqual([R, k, m * R, m * k, m * a]);
            }
            if (p.answer.kind === 'choice') expect(p.answer.options[p.answer.correct].en.endsWith(`= ${(m * a).toLocaleString('en-US')}`)).toBe(true);
        });
    });
    test('word problems: every blank recomputed from the story numbers', () => {
        each('mult-word', p => {
            const d = p.data as Record<string, number>;
            const a = p.answer;
            if (a.kind === 'fill') {
                const want: Record<string, number[]> = {
                    bar: [d.n, d.v, d.n * d.v], story: [d.k, d.b, d.k * d.b], rows: [d.r, d.per, d.r * d.per],
                    area: [...placesOf(d.r), ...placesOf(d.r).map(x => x * d.per), d.r * d.per],
                    bakery: [d.c + d.f, (d.c + d.f) * d.h],
                    iced: [d.k * d.hot, d.k * d.hot * d.w, d.hot * d.w, (d.k - 1) * d.hot * d.w],
                    tickets: [d.n * Math.round(d.A / 100) * 100 + d.n * Math.round(d.C / 100) * 100, d.n * d.A, d.n * d.C, d.n * (d.A + d.C)],
                    gifts: [d.est, d.k, d.p, d.k * d.p],
                };
                expect(a.values).toEqual(want[String(p.data.style)]);
                expect(sameAnswer(a, { blanks: a.values })).toBe(true);
            }
            if (a.kind === 'choice' && p.data.style === 'bags') expect(num(a.options[a.correct].en.split(' ')[0])).toBe(d.nl * d.large + d.ns * d.small);
            if (a.kind === 'choice' && p.data.style === 'reason') {
                expect(a.options[a.correct].en.startsWith('Yes')).toBe(d.ok === 1);
                expect(d.ok === 1).toBe(d.guess === d.est);
            }
        });
    });
    test('the textbook map: the speed of every part, then of the whole trip', () => {
        let maps = 0;
        each('speed-trip', p => {
            if (!p.id.includes(':map:') || p.answer.kind !== 'fill' || p.visual?.kind !== 'trip') return;
            maps++;
            const legs = p.visual.legs, D = legs.reduce((s, l) => s + l.distance, 0), T = legs.reduce((s, l) => s + l.time, 0);
            expect(p.answer.values).toEqual([...legs.map(l => l.distance / l.time), D, T, D / T]);
            expect(Number.isInteger(D / T)).toBe(true);
        });
        expect(maps).toBeGreaterThan(200);
    });
    test('forces: the study guide answers', () => {
        const right: [RegExp, string][] = [
            [/^forces:motion:/, 'A change in position of an object'], [/^forces:force:/, 'Any push or pull'], [/^forces:grav-/, 'Gravity'],
            [/^forces:rel-/, 'Relative motion'], [/^forces:size-dir:/, 'A size and a direction'], [/^forces:tug-equal:/, 'It stays still: the forces are balanced'],
            [/^forces:moving-balanced-/, 'It keeps moving at the same speed in the same direction'], [/^forces:book:/, 'Balanced forces, so the book stays still'],
        ];
        const keys = new Set<string>();
        each('forces', p => {
            if (p.answer.kind !== 'choice') throw new Error('choice expected');
            keys.add(p.id.split(':')[1].replace(/-.*/, ''));
            const want = right.find(([re]) => re.test(p.id));
            if (want) expect(p.answer.options[p.answer.correct].en).toBe(want[1]);
            if (p.id.startsWith('forces:pp-') && /kicks|throws|pushes|presses|closes/.test(p.prompt.en)) expect(p.answer.options[p.answer.correct].en.startsWith('A push')).toBe(true);
            if (/ pulls? |opens a drawer/.test(p.prompt.en) && p.id.startsWith('forces:pp-')) expect(p.answer.options[p.answer.correct].en.startsWith('A pull')).toBe(true);
        });
        // every idea of Part I shows up
        expect(keys.size).toBeGreaterThanOrEqual(14);
    });
});

describe('Lesson 4-2 homework: 2-digit numbers times multiples of 10', () => {
    const tensOnes = (a: number) => [Math.floor(a / 10) * 10, a % 10];
    test('every blank and product is recomputed from the numbers: one factor a multiple of 10, the other 2-digit with ones', () => {
        const kinds = new Set<string>();
        each('mult-2x10', p => {
            const d = p.data as Record<string, number>, a = p.answer, style = String(p.data.style);
            kinds.add(style);
            if (['array', 'area', 'product', 'story'].includes(style)) {
                expect(d.m % 10).toBe(0);
                expect(d.m).toBeGreaterThanOrEqual(10);
                expect(d.m).toBeLessThanOrEqual(90);
                expect(d.a).toBeGreaterThanOrEqual(11);
                expect(d.a).toBeLessThanOrEqual(99);
                expect(d.a % 10).not.toBe(0);
                expect(d.value).toBe(d.m * d.a);
            }
            const [t, o] = tensOnes(d.a);
            if (style === 'array') {
                if (a.kind !== 'fill' || a.layout !== 'lines') throw new Error(`${p.id}: not a lines sheet`);
                expect(a.values).toEqual([d.m * t, d.m * o, d.m * d.a, d.m * d.a]);
            }
            if (style === 'area') {
                if (a.kind !== 'fill' || a.layout !== 'area') throw new Error(`${p.id}: not an area sheet`);
                expect(a.values).toEqual([t, o, d.m * t, d.m * o, d.m * d.a]);
                // tens and ones on top in her own order, the boxes follow
                expect(sameAnswer(a, { blanks: a.values })).toBe(true);
                expect(sameAnswer(a, { blanks: [o, t, d.m * o, d.m * t, d.m * d.a] })).toBe(true);
                expect(sameAnswer(a, { blanks: [t, o, d.m * o, d.m * t, d.m * d.a] })).toBe(false);
            }
            if (style === 'diff') {
                expect(d.x % 10).toBe(0);
                expect(d.y - d.x).toBe(d.m);
                expect([28, 30, 31]).toContain(d.days);
                expect(d.value).toBe(d.days * (d.y - d.x));
            }
            if (style === 'two') {
                if (a.kind !== 'fill' || a.layout !== 'lines') throw new Error(`${p.id}: not a lines sheet`);
                expect(a.values).toEqual([d.c1 * d.s1, d.c2 * d.s2, d.c1 * d.s1 + d.c2 * d.s2]);
                for (const [c, s] of [[d.c1, d.s1], [d.c2, d.s2]]) {
                    expect([c % 10 === 0, s % 10 === 0].filter(Boolean).length).toBe(1);
                    expect(c % 10 === 0 ? s : c).toBeLessThanOrEqual(99);
                }
            }
            if (style === 'compare') {
                if (a.kind !== 'choice') throw new Error(`${p.id}: not a choice`);
                const right = a.options[a.correct].en;
                expect(d.hi).toBeGreaterThan(d.lo);
                // without multiplying: the right option names the greater product; Miranda: yes exactly when her product is greater
                if (p.id.includes(':compare:w:')) expect(evaluate(right.split(':')[0])).toBe(d.hi);
                else expect(right.startsWith('Yes')).toBe(d.p1 > d.p2);
            }
        });
        expect(Array.from(kinds).sort()).toEqual(Array.from(KINDS_4_2).sort());
    });
    test('the homework of 2026-10-26: three right answers per kind that day, one on each repeat day until Friday, the button names it', () => {
        const s = newState();
        const n = KINDS_4_2.length;
        expect(activeHomework(s, '2026-10-25')).toEqual([]);
        expect(dailyGoal(s, '2026-10-25').total).toBe(DAILY_RIGHT);
        expect(dailyGoal(s, '2026-10-26').total).toBe(3 * n);
        // two right answers per kind on every repeat day (owner, 2026-10-29)
        expect(AGAIN).toBe(2);
        // Lesson 4-3 joins on 2026-10-27 with three per kind, then two per kind
        expect(dailyGoal(s, '2026-10-27').total).toBe(AGAIN * n + 3 * KINDS_4_3.length);
        // Lesson 4-4 joins on 2026-10-28 with three per kind, then two per kind
        expect(dailyGoal(s, '2026-10-28').total).toBe(AGAIN * (n + KINDS_4_3.length) + 3 * KINDS_4_4.length);
        // Lesson 4-5 joins on 2026-10-29 with three per kind
        expect(dailyGoal(s, '2026-10-29').total).toBe(AGAIN * (n + KINDS_4_3.length + KINDS_4_4.length) + 3 * KINDS_4_5.length);
        expect(dailyGoal(s, '2026-10-30').total).toBe(AGAIN * (n + KINDS_4_3.length + KINDS_4_4.length + KINDS_4_5.length));
        expect(dailyGoal(s, '2026-10-31').total).toBe(DAILY_RIGHT);
        expect(uncovered(s, '2026-10-31')).toEqual([]);
        expect(currentHomework(s, '2026-10-22').id).toBe('topic3');
        expect(currentHomework(s, '2026-10-24').id).toBe('topic3');
        expect(currentHomework(s, '2026-10-26').id).toBe('lesson-4-2');
        expect(currentHomework(s, '2026-10-27').id).toBe('lesson-4-3');
        expect(currentHomework(s, '2026-10-28').id).toBe('lesson-4-4');
        expect(currentHomework(s, '2026-10-29').id).toBe('lesson-4-5');
        expect(currentHomework(s, '2026-11-05').id).toBe('lesson-4-5');
        // the same kind right three times counts three times on the first day, a fourth time counts no more
        const day = '2026-10-26', rng = makeRng(11);
        const right = (st: typeof s, p: Problem, d: string) => applyAnswer(st, p, true, { firstTry: true, hint: false, sec: 5, day: d }).state;
        let g = right(s, makeProblem('mult-2x10', rng, 'story'), day);
        expect(dailyGoal(g, day).done).toBe(1);
        expect(uncovered(g, day)).toContainEqual(['mult-2x10', 'story']);
        g = right(g, makeProblem('mult-2x10', rng, 'story'), day);
        expect(dailyGoal(g, day).done).toBe(2);
        expect(uncovered(g, day)).toContainEqual(['mult-2x10', 'story']);
        g = right(g, makeProblem('mult-2x10', rng, 'story'), day);
        expect(dailyGoal(g, day).done).toBe(3);
        expect(uncovered(g, day)).not.toContainEqual(['mult-2x10', 'story']);
        g = right(g, makeProblem('mult-2x10', rng, 'story'), day);
        expect(dailyGoal(g, day).done).toBe(3);
        expect(dailyGoal(g, '2026-10-28').done).toBe(0);
        // normal play is the homework while the day's plan is open
        for (let i = 0; i < 100; i++) expect(nextSkill(s, makeRng(i + 1), day)).toBe('mult-2x10');
        // once it is covered, play goes back to the usual mix and the homework button keeps the whole lesson
        let c = s;
        for (const k of KINDS_4_2) for (let i = 0; i < 3; i++) c = right(c, makeProblem('mult-2x10', rng, k), day);
        expect(uncovered(c, day)).toEqual([]);
        expect(dailyGoal(c, day)).toMatchObject({ done: 3 * n, total: 3 * n });
        for (let i = 0; i < 100; i++) expect(nextSkill(c, makeRng(i + 1), day)).not.toBe('mult-2x10');
        expect(prepPicks(c, day).map(([, k]) => k).sort()).toEqual(Array.from(KINDS_4_2).sort());
        // the homework mode theory comes with its building blocks
        expect(chainOf('mult-2x10')).toEqual(['mult-tens', 'mult-area']);
    });
});

describe('Lesson 4-3 homework: estimate with rounding or compatible numbers', () => {
    test('every answer is recomputed: rounding to tens, compatible numbers, weeks into days, greater or less, the box', () => {
        const kinds = new Set<string>();
        each('est-2x2', p => {
            const d = p.data as Record<string, number>, a = p.answer, style = String(p.data.style);
            kinds.add(style);
            const r = (x: number) => roundTo(x, 10);
            if (['round', 'story', 'weeks'].includes(style)) {
                if (a.kind !== 'number') throw new Error(`${p.id}: not a number`);
                expect(a.value).toBe(r(d.a) * r(d.b));
                expect(d.a).toBeGreaterThanOrEqual(10);
                expect(d.a).toBeLessThanOrEqual(99);
                expect(d.b).toBeGreaterThanOrEqual(10);
                expect(d.b).toBeLessThanOrEqual(99);
                // rounding is never in doubt in the plain tasks: no ones of 5
                if (style !== 'weeks') { expect(d.a % 5).not.toBe(0); expect(d.b % 5).not.toBe(0); }
            }
            if (style === 'weeks') expect(d.b).toBe(7 * d.w);
            if (style === 'guided') {
                if (a.kind !== 'fill' || a.layout !== 'lines') throw new Error(`${p.id}: not a lines sheet`);
                expect([25, 50, 75]).toContain(d.c);
                expect(Math.abs(d.a - d.c)).toBeLessThanOrEqual(2);
                expect(a.values).toEqual([r(d.b), d.c * r(d.b)]);
                expect(sameAnswer(a, { blanks: a.values })).toBe(true);
                expect(sameAnswer(a, { blanks: [r(d.b), d.c * r(d.b) + 10] })).toBe(false);
            }
            if (style === 'ways') {
                if (a.kind !== 'multi') throw new Error(`${p.id}: not a multi`);
                const right = a.correct.map(i => evaluate(a.options[i].en.split(':')[1].split('=')[1])).sort((x, y) => x! - y!);
                expect(right).toEqual([r(d.a) * r(d.b), d.c * r(d.b)].sort((x, y) => x - y));
                expect(a.options.length).toBe(5);
                expect(new Set(a.options.map(o => o.en)).size).toBe(5);
            }
            if (style === 'box') {
                if (a.kind !== 'multi') throw new Error(`${p.id}: not a multi`);
                const right = a.correct.map(i => a.options[i].en).sort();
                expect(right).toEqual([`25 × ${r(d.b)} = ${(25 * r(d.b)).toLocaleString('en-US')}`, `${r(d.a)} × ${r(d.b)} = ${(r(d.a) * r(d.b)).toLocaleString('en-US')}`].sort());
                expect(Math.abs(d.decoy - d.b)).toBeGreaterThan(10);
            }
            if (style === 'sense') {
                if (a.kind !== 'choice') throw new Error(`${p.id}: not a choice`);
                expect(d.est).toBe(r(d.a) * r(d.b));
                const right = a.options[a.correct].en;
                expect(right.startsWith(d.est > d.exact ? 'Greater' : 'Less')).toBe(true);
                expect(d.up === 1).toBe(d.est > d.exact);
            }
            if (style === 'vocab') {
                if (a.kind !== 'word') throw new Error(`${p.id}: not a word`);
                expect(sameAnswer(a, { text: a.word.toUpperCase() })).toBe(true);
                expect(sameAnswer(a, { text: 'multiply' })).toBe(false);
            }
        });
        expect(Array.from(kinds).sort()).toEqual(Array.from(KINDS_4_3).sort());
    });
    test('the homework of 2026-10-27 comes first: three right answers per kind that day, then Lesson 4-2 of the same week', () => {
        const s = newState(), day = '2026-10-27';
        expect(activeHomework(s, day).map(h => h.id)).toEqual(['lesson-4-2', 'lesson-4-3']);
        expect(dailyGoal(s, day).total).toBe(3 * KINDS_4_3.length + AGAIN * KINDS_4_2.length);
        expect(currentHomework(s, day).id).toBe('lesson-4-3');
        for (let i = 0; i < 100; i++) expect(nextSkill(s, makeRng(i + 1), day)).toBe('est-2x2');
        expect(prepPicks(s, day).every(([skill]) => skill === 'est-2x2')).toBe(true);
        expect(prepPicks(s, day).length).toBe(KINDS_4_3.length);
        let c = s;
        const rng = makeRng(5);
        for (const k of KINDS_4_3) for (let i = 0; i < 3; i++) c = applyAnswer(c, makeProblem('est-2x2', rng, k), true, { firstTry: true, hint: false, sec: 5, day }).state;
        expect(uncovered(c, day).every(([skill]) => skill === 'mult-2x10')).toBe(true);
        for (let i = 0; i < 100; i++) expect(nextSkill(c, makeRng(i + 1), day)).toBe('mult-2x10');
        expect(prepPicks(c, day).every(([skill]) => skill === 'mult-2x10')).toBe(true);
        expect(chainOf('est-2x2')).toEqual(['round', 'mult-tens', 'est-product']);
    });
});

describe('Lesson 4-4 homework: arrays and partial products', () => {
    test('every answer is recomputed: four partial products, the story, Teri\'s check, the sales, the missing partials and factors', () => {
        const kinds = new Set<string>();
        each('mult-2x2', p => {
            const d = p.data as Record<string, number>, a = p.answer, style = String(p.data.style);
            kinds.add(style);
            if (style === 'array') {
                if (a.kind !== 'fill' || a.layout !== 'area') throw new Error(`${p.id}: not an area sheet`);
                const ps = partials(d.a, d.b);
                expect(ps.reduce((x, y) => x + y, 0)).toBe(d.a * d.b);
                expect(a.cells.flat().map(i => a.values[i])).toEqual(ps);
                expect(a.values[a.total]).toBe(d.a * d.b);
                expect(sameAnswer(a, { blanks: a.values })).toBe(true);
                // tens and ones may be written in any order on a side, a wrong box is wrong
                expect(sameAnswer(a, { blanks: a.values.map((v, i) => (i === a.cells[0][0] ? v + 10 : v)) })).toBe(false);
            }
            if (style === 'missing') {
                if (a.kind !== 'fill' || a.layout !== 'lines') throw new Error(`${p.id}: not a lines sheet`);
                expect(a.values[a.values.length - 1]).toBe(d.top * d.bot);
                expect(a.values.length).toBe(3);
                // every missing partial product is in the box of the prompt
                for (const v of a.values.slice(0, 2)) expect(p.prompt.en).toContain(v.toLocaleString('en-US'));
            }
            if (style === 'factor') {
                if (a.kind !== 'number') throw new Error(`${p.id}: not a number`);
                expect(d.a * a.value).toBe(d.p);
                expect(p.prompt.en).toContain(`${a.value}`);
            }
            if (style === 'reason') {
                if (a.kind !== 'choice') throw new Error(`${p.id}: not a choice`);
                const ok = d.total === d.d * d.m;
                expect(ok).toBe(d.ok === 1);
                expect(a.options[a.correct].en.startsWith(ok ? 'Yes' : 'No')).toBe(true);
                // an unreasonable answer is far from the estimate, a reasonable one is close
                if (ok) expect(Math.abs(d.est - d.total)).toBeLessThan(d.est / 2);
                else expect(d.total).toBeLessThan(d.est / 2);
            }
        });
        expect(Array.from(kinds).sort()).toEqual(Array.from(KINDS_4_4).sort());
    });
    test('the homework of 2026-10-28 comes first: three right answers per kind that day, then Lessons 4-3 and 4-2', () => {
        const s = newState(), day = '2026-10-28';
        expect(activeHomework(s, day).map(h => h.id)).toEqual(['lesson-4-2', 'lesson-4-3', 'lesson-4-4']);
        expect(dailyGoal(s, day).total).toBe(3 * KINDS_4_4.length + AGAIN * (KINDS_4_3.length + KINDS_4_2.length));
        expect(currentHomework(s, day).id).toBe('lesson-4-4');
        for (let i = 0; i < 100; i++) expect(nextSkill(s, makeRng(i + 1), day)).toBe('mult-2x2');
        expect(prepPicks(s, day).length).toBe(KINDS_4_4.length);
        expect(prepPicks(s, day).every(([skill]) => skill === 'mult-2x2')).toBe(true);
        let c = s;
        const rng = makeRng(7);
        for (const k of KINDS_4_4) for (let i = 0; i < 3; i++) c = applyAnswer(c, makeProblem('mult-2x2', rng, k), true, { firstTry: true, hint: false, sec: 5, day }).state;
        expect(uncovered(c, day).every(([skill]) => skill !== 'mult-2x2')).toBe(true);
        for (let i = 0; i < 100; i++) expect(nextSkill(c, makeRng(i + 1), day)).toBe('est-2x2');
        expect(chainOf('mult-2x2')).toContain('mult-area');
    });
    test('the theory is checked math with many worked examples', () => {
        for (let seed = 1; seed <= 30; seed++) {
            const t = buildTheory('mult-2x2', makeRng(seed));
            expect(t.sections.filter(x => x.kind === 'example').length).toBeGreaterThanOrEqual(6);
        }
    });
});

describe('Lesson 4-5 homework: area models and partial products', () => {
    test('every answer is recomputed: the boxes, the equations, the ferry, the index cards, select all', () => {
        const kinds = new Set<string>();
        let zeroTraps = 0, tens = 0;
        each('dist-2x2', p => {
            const d = p.data as Record<string, number>, a = p.answer, style = String(p.data.style);
            kinds.add(style);
            const t = (x: number) => Math.floor(x / 10), o = (x: number) => x % 10;
            if (style === 'area' || style === 'dist') {
                if (a.kind !== 'fill') throw new Error(`${p.id}: not a sheet`);
                expect(a.values.slice(0, 4).reduce((x, y) => x + y, 0)).toBe(d.a * d.b);
                expect(a.values[4]).toBe(d.a * d.b);
                expect(sameAnswer(a, { blanks: a.values })).toBe(true);
                // 20 × 50 written as 100 is wrong
                expect(sameAnswer(a, { blanks: a.values.map((v, i) => (i === 0 ? v / 10 : v)) })).toBe(false);
            }
            if (style === 'area') expect(a.kind === 'fill' && a.values.slice(0, 4)).toEqual([t(d.a) * t(d.b) * 100, t(d.a) * 10 * o(d.b), o(d.a) * t(d.b) * 10, o(d.a) * o(d.b)]);
            if (['area', 'dist', 'product'].includes(style) && (t(d.a) * t(d.b)) % 10 === 0 && o(d.a) > 0) zeroTraps++;
            if (style === 'product' && o(d.a) === 0) tens++;
            if (style === 'ferry') {
                if (a.kind !== 'choice') throw new Error(`${p.id}: not a choice`);
                const est = roundTo(d.people, 10) * d.pp + roundTo(d.cars, 10) * d.pc;
                expect(d.est).toBe(est);
                expect(a.options[a.correct].en).toBe(`About $${est.toLocaleString('en-US')}`);
                expect(new Set(a.options.map(x => x.en)).size).toBe(a.options.length);
            }
            if (style === 'enough') {
                if (a.kind !== 'choice') throw new Error(`${p.id}: not a choice`);
                expect(d.need).toBe(d.s * d.w);
                expect(d.have).not.toBe(d.need);
                expect(d.have % 100).toBe(0);
                expect(a.options[a.correct].en.startsWith(d.have > d.need ? 'Yes' : 'No')).toBe(true);
                expect(d.enough === 1).toBe(d.have > d.need);
            }
            if (style === 'partials') {
                if (a.kind !== 'multi') throw new Error(`${p.id}: not a multi`);
                const want = [t(d.a) * t(d.b) * 100, o(d.a) * t(d.b) * 10, t(d.a) * 10 * o(d.b), o(d.a) * o(d.b)].sort((x, y) => x - y).join();
                const nums = (s: string) => s.split(';').map(x => Number(x.replace(/,/g, '').trim())).sort((x, y) => x - y).join();
                a.options.forEach((opt, i) => expect(a.correct.includes(i)).toBe(nums(opt.en) === want));
                expect(a.correct.length).toBe(2);
            }
            if (style === 'ways') {
                if (a.kind !== 'multi') throw new Error(`${p.id}: not a multi`);
                a.options.forEach((opt, i) => expect(a.correct.includes(i)).toBe(evaluate(opt.en) === d.a * d.b));
                expect(a.correct.length).toBe(3);
            }
        });
        expect(Array.from(kinds).sort()).toEqual(Array.from(KINDS_4_5).sort());
        // the places she went wrong on p. 51 come up often: 20 × 50 style boxes and a factor of 10
        expect(zeroTraps).toBeGreaterThan(50);
        expect(tens).toBeGreaterThan(5);
    });
    test('the homework of 2026-10-29 comes first: three right answers per kind that day, then Lessons 4-4, 4-3 and 4-2', () => {
        const s = newState(), day = '2026-10-29';
        expect(activeHomework(s, day).map(h => h.id)).toEqual(['lesson-4-2', 'lesson-4-3', 'lesson-4-4', 'lesson-4-5']);
        expect(dailyGoal(s, day).total).toBe(3 * KINDS_4_5.length + AGAIN * (KINDS_4_4.length + KINDS_4_3.length + KINDS_4_2.length));
        expect(currentHomework(s, day).id).toBe('lesson-4-5');
        for (let i = 0; i < 100; i++) expect(nextSkill(s, makeRng(i + 1), day)).toBe('dist-2x2');
        expect(prepPicks(s, day).length).toBe(KINDS_4_5.length);
        let c = s;
        const rng = makeRng(7);
        for (const k of KINDS_4_5) for (let i = 0; i < 3; i++) c = applyAnswer(c, makeProblem('dist-2x2', rng, k), true, { firstTry: true, hint: false, sec: 5, day }).state;
        for (let i = 0; i < 100; i++) expect(nextSkill(c, makeRng(i + 1), day)).toBe('mult-2x2');
        expect(chainOf('dist-2x2')).toContain('mult-2x2');
    });
    test('the theory walks through her four tricky spots with worked examples', () => {
        for (let seed = 1; seed <= 30; seed++) {
            const t = buildTheory('dist-2x2', makeRng(seed));
            const titles = t.sections.flatMap(x => (x.kind === 'example' ? [x.title.en] : []));
            for (let k = 1; k <= 4; k++) expect(titles.some(x => x.startsWith(`Tricky spot ${k}`))).toBe(true);
            expect(titles.length).toBeGreaterThanOrEqual(8);
        }
    });
});

describe('theory before the quiz: a reading clock and a log for Mom and Dad', () => {
    test('the time asked before the quiz is random, never a couple of seconds, never more than 60 seconds', () => {
        for (const need of [10, 60, 120, 300, 900]) for (const reads of [1, 2, 5]) {
            const all = Array.from({ length: 50 }, (_, i) => minReadSec(need, reads, i / 50));
            for (const m of all) { expect(m).toBeGreaterThanOrEqual(reads > 1 ? 10 : 15); expect(m).toBeLessThanOrEqual(60); }
            if (need >= 120 && need <= 200) expect(new Set(all).size).toBeGreaterThan(5);
        }
        // a page read before asks for less time than the first read
        expect(minReadSec(200, 2, 0.5)).toBeLessThan(minReadSec(200, 1, 0.5));
    });
    test('every theory page takes a real read: its full read is estimated from its words', () => {
        for (const skill of ALL_SKILLS) {
            const th = buildTheory(skill, makeRng(5));
            const sec = readSeconds(th);
            expect(sec).toBeGreaterThan(20);
            // the homework theories written for her are long pages, the clock is capped at 60 seconds anyway
            expect(minReadSec(sec, 1, 0)).toBeGreaterThanOrEqual(15);
        }
        expect(readSeconds(buildTheory('dist-2x2', makeRng(1)))).toBeGreaterThan(readSeconds(buildTheory('mult-facts', makeRng(1))));
    });
    test('each read is logged with its time, early presses and the quiz that followed; every theory shows up', () => {
        let s = newState();
        s = logTheoryRead(s, { t: Date.parse('2026-10-29T15:00:00'), skill: 'dist-2x2', mode: 'due', sec: 8, need: 200, min: 45, early: 2 });
        s = logTheoryRead(s, { t: Date.parse('2026-10-29T15:05:00'), skill: 'dist-2x2', mode: 'due', sec: 70, need: 200, min: 45, early: 0 });
        s = logQuizResult(s, 'dist-2x2', 2, 3, true);
        expect(s.theoryLog[0].quiz).toBeUndefined();
        expect(s.theoryLog[1].quiz).toEqual({ score: 2, of: 3, passed: true });
        // a quiz with no read waiting changes nothing
        expect(logQuizResult(s, 'div-2d', 3, 3, true)).toBe(s);
        const rows = theoryRows(s, '2026-10-29', 'today');
        expect(rows.length).toBe(ALL_SKILLS.length);
        expect(rows[0]).toMatchObject({ skill: 'dist-2x2', reads: 2, sec: 39, early: 2, passed: 1, failed: 0 });
        expect(theoryRows(s, '2026-10-31', 'today').find(r => r.skill === 'dist-2x2')?.reads).toBe(0);
        expect(normalize({ ...newState(), theoryLog: undefined }).theoryLog).toEqual([]);
    });
});

describe('fix my mistakes: pick a topic or one mistake, or go at random', () => {
    test('groups by topic, the biggest first; a topic goes in order until it is empty; random picks any', () => {
        let s = newState();
        const rng = makeRng(2);
        for (let i = 0; i < 3; i++) s = logMistake(s, makeProblem('dist-2x2', rng, 'area'), '1', 1000 + i);
        s = logMistake(s, makeProblem('div-2d', rng), '1', 2000);
        const queue = reworkQueue(HOMEWORK_MISTAKES.map(m => m.id), s.mistakeLog);
        expect(queue.length).toBe(4);
        const groups = reworkGroups(queue);
        expect(groups.map(g => [g.skill, g.items.length])).toEqual([['dist-2x2', 3], ['div-2d', 1]]);
        expect(reworkSkill(reworkNext(queue, { skill: 'div-2d', random: false }, 0.9)!)).toBe('div-2d');
        expect(reworkNext(queue, { skill: 'dist-2x2', random: false }, 0.9)).toBe(groups[0].items[0]);
        expect(reworkNext(queue, { skill: 'mult-2x2', random: false }, 0.5)).toBeNull();
        expect(new Set([0, 0.3, 0.6, 0.99].map(r => reworkNext(queue, { random: true }, r)))).toEqual(new Set(queue));
        expect(reworkNext([], { random: true }, 0.5)).toBeNull();
    });
});

describe('memory checks: multiplication facts 0 × 0 to 9 × 9 and × 10, × 100', () => {
    test('every fact from 0 × 0 to 9 × 9 can come, with a true trick, and the hard ones come more often', () => {
        for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
            const p = makeFact(a, b);
            expect(p.answer).toEqual({ kind: 'number', value: a * b });
            checkMath([p.prompt, p.hint, ...p.steps].map(t => t.en), p.id);
            checkMath([p.prompt, p.hint, ...p.steps].map(t => t.ru), p.id);
            expect(p.prompt.en).toContain('Memory check');
        }
        const s = newState(), count: Record<string, number> = {};
        const rng = makeRng(3);
        for (let i = 0; i < 4000; i++) { const p = nextFact(s, rng); count[p.data.style === 'ten' ? 'ten' : factKey(Number(p.data.a), Number(p.data.b))] = (count[p.data.style === 'ten' ? 'ten' : factKey(Number(p.data.a), Number(p.data.b))] ?? 0) + 1; }
        expect(Object.keys(count).length).toBe(56);
        expect(count['7x8']).toBeGreaterThan(count['2x3']);
        expect(count['2x3']).toBeGreaterThan(count['0x1']);
        expect(count.ten).toBeGreaterThan(600);
    });
    test('a fact comes every 4th task; a missed fact comes back more often until she gets it right', () => {
        let s = newState();
        const day = '2026-11-02', rng = makeRng(1);
        const answer = (st: typeof s, p: Problem, ok: boolean) => applyAnswer(st, p, ok, { firstTry: true, hint: false, sec: 3, day }).state;
        expect(FACT_EVERY).toBe(4);
        for (let i = 0; i < 3; i++) { expect(factDue(s)).toBe(false); s = answer(s, makeProblem('div-2d', rng), true); }
        expect(factDue(s)).toBe(true);
        s = answer(s, makeFact(7, 8), false);
        expect(factDue(s)).toBe(false);
        expect(s.factMiss['7x8']).toBe(2);
        expect(s.skills['mult-facts'].needsTheory).toBe(false);
        const hits = (st: typeof s) => { let k = 0; const r = makeRng(9); for (let i = 0; i < 2000; i++) { const p = nextFact({ ...st, recent: [] }, r); if (p.data.style === 'fact' && factKey(Number(p.data.a), Number(p.data.b)) === '7x8') k++; } return k; };
        expect(hits(s)).toBeGreaterThan(2 * hits(newState()));
        // 8 × 7 is the same fact; two right answers clear it
        s = answer(s, makeFact(8, 7), true);
        expect(s.factMiss['7x8']).toBe(1);
        s = answer(s, makeFact(7, 8), true);
        expect(s.factMiss['7x8']).toBeUndefined();
        // the last few facts are not asked again at once
        const r2 = makeRng(4);
        const recent = { ...s, recent: ['mult-facts:fact:7:8'] };
        for (let i = 0; i < 300; i++) expect(nextFact(recent, r2).id).not.toBe('mult-facts:fact:7:8');
        // an old save without the fields gets them
        const old = normalize({ ...newState(), sinceFact: undefined, factMiss: undefined });
        expect(old.sinceFact).toBe(0);
        expect(old.factMiss).toEqual({});
    });
});

describe('spaced review: old skills come back on a ladder of 1, 2, 3, 4 ... days', () => {
    const right = (s: ReturnType<typeof newState>, skill: SkillId, day: string, ok = true, kind?: string) => applyAnswer(s, makeProblem(skill, makeRng(day.length + skill.length), kind), ok, { firstTry: true, hint: false, sec: 5, day }).state;
    test('a right answer on the due day climbs one step, a wrong answer drops to the bottom', () => {
        expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        let s = newState();
        expect(s.skills.round).toMatchObject({ level: 0, dueOn: '', bumpedOn: '' });
        s = right(s, 'round', '2026-11-02');
        expect(s.skills.round).toMatchObject({ level: 1, dueOn: '2026-11-03', bumpedOn: '2026-11-02' });
        // more right answers the same day change nothing
        s = right(s, 'round', '2026-11-02');
        expect(s.skills.round).toMatchObject({ level: 1, dueOn: '2026-11-03' });
        expect(reviewsDue(s, '2026-11-02')).toEqual([]);
        expect(reviewsDue(s, '2026-11-03')).toEqual(['round']);
        s = right(s, 'round', '2026-11-03');
        expect(s.skills.round).toMatchObject({ level: 2, dueOn: '2026-11-05' });
        // a right answer before the day is extra practice, not a step
        s = right(s, 'round', '2026-11-04');
        expect(s.skills.round).toMatchObject({ level: 2, dueOn: '2026-11-05' });
        // a late review still counts and is scheduled from that day
        s = right(s, 'round', '2026-11-07');
        expect(s.skills.round).toMatchObject({ level: 3, dueOn: '2026-11-10' });
        // wrong: theory first, back to the first step, due today
        s = right(s, 'round', '2026-11-10', false);
        expect(s.skills.round).toMatchObject({ level: 0, dueOn: '2026-11-10', needsTheory: true });
        expect(reviewsDue(s, '2026-11-10')).toEqual([]);
        s = applyQuiz(s, 'round', true, []);
        expect(reviewsDue(s, '2026-11-10')).toEqual(['round']);
        s = right(s, 'round', '2026-11-10');
        expect(s.skills.round).toMatchObject({ level: 1, dueOn: '2026-11-11' });
        // a practice test counts the same way
        let t = newState();
        const ps = [makeProblem('div-2d', makeRng(1)), makeProblem('div-3d', makeRng(2))];
        t = applyTest(t, ps, [true, false], 60, '2026-11-02');
        expect(t.skills['div-2d']).toMatchObject({ level: 1, dueOn: '2026-11-03' });
        expect(t.skills['div-3d']).toMatchObject({ level: 0, dueOn: '2026-11-02', needsTheory: true });
        // an old save without the ladder starts at the bottom, nothing is due
        const old = normalize({ ...newState(), skills: { round: { seen: 5, correct: 5 } } });
        expect(old.skills.round).toMatchObject({ seen: 5, level: 0, dueOn: '' });
        expect(reviewsDue(old, '2026-11-02')).toEqual([]);
    });
    test('play order: the homework of the day, then a failed skill, then the reviews due, then free practice', () => {
        const hwDay = '2026-10-28', free = '2026-11-02';
        let s = newState();
        s = right(s, 'div-4d', '2026-10-27');
        expect(reviewsDue(s, hwDay)).toEqual(['div-4d']);
        // the homework comes before the review that is due
        for (let i = 0; i < 50; i++) expect(nextSkill(s, makeRng(i + 1), hwDay)).toBe('mult-2x2');
        // the newest homework first, then the older ones of the same week, newest first
        let c = s;
        for (const k of KINDS_4_4) for (let j = 0; j < 3; j++) c = right(c, 'mult-2x2', hwDay, true, k);
        for (let i = 0; i < 50; i++) expect(nextSkill(c, makeRng(i + 1), hwDay)).toBe('est-2x2');
        for (const k of KINDS_4_3) for (let j = 0; j < AGAIN; j++) c = right(c, 'est-2x2', hwDay, true, k);
        for (let i = 0; i < 50; i++) expect(nextSkill(c, makeRng(i + 1), hwDay)).toBe('mult-2x10');
        // homework covered: the review, every time, until it is done
        for (const k of KINDS_4_2) for (let j = 0; j < AGAIN; j++) c = right(c, 'mult-2x10', hwDay, true, k);
        expect(uncovered(c, hwDay)).toEqual([]);
        for (let i = 0; i < 50; i++) expect(nextSkill(c, makeRng(i + 1), hwDay)).toBe('div-4d');
        c = right(c, 'div-4d', hwDay);
        expect(reviewsDue(c, hwDay)).toEqual([]);
        for (let i = 0; i < 50; i++) expect(nextSkill(c, makeRng(i + 1), hwDay)).not.toBe('div-4d');
        // a failed skill comes before the review due
        let f = right(s, 'round', hwDay, false);
        for (const k of KINDS_4_2) for (let j = 0; j < AGAIN; j++) f = right(f, 'mult-2x10', hwDay, true, k);
        for (const k of KINDS_4_3) for (let j = 0; j < AGAIN; j++) f = right(f, 'est-2x2', hwDay, true, k);
        for (const k of KINDS_4_4) for (let j = 0; j < 3; j++) f = right(f, 'mult-2x2', hwDay, true, k);
        for (let i = 0; i < 50; i++) expect(nextSkill(f, makeRng(i + 1), hwDay)).toBe('round');
        // without a day the reviews are not used (tests of the old flow)
        for (let i = 0; i < 50; i++) expect(nextSkill(s, makeRng(i + 1))).not.toBe('div-4d');
        // the day's goal: the homework rows plus one for the review; the row stays once she did it
        expect(dailyGoal(s, hwDay)).toMatchObject({ total: AGAIN * (KINDS_4_2.length + KINDS_4_3.length) + 3 * KINDS_4_4.length + 1, done: 0, homework: true });
        expect(dailyGoal(s, hwDay).rows.find(r => r.skill === 'div-4d')).toMatchObject({ need: 1, done: 0, review: true });
        const d = right(s, 'div-4d', hwDay);
        expect(dailyGoal(d, hwDay).rows.find(r => r.skill === 'div-4d')).toMatchObject({ need: 1, done: 1, review: true });
        expect(dailyGoal(d, hwDay).done).toBe(1);
        // no homework: 30 right answers, the review due shown as a row
        expect(dailyGoal(s, free)).toMatchObject({ total: DAILY_RIGHT, done: 0, homework: false });
        expect(dailyGoal(s, free).rows).toEqual([{ skill: 'div-4d', need: 1, done: 0, review: true }]);
        for (let i = 0; i < 50; i++) expect(nextSkill(s, makeRng(i + 1), free)).toBe('div-4d');
    });
});

describe('rework: homework mistakes and the mistakes she makes in the app', () => {
    test('every homework mistake has right math in its solution and a task kind to practice', () => {
        const ids = new Set<string>();
        for (const m of HOMEWORK_MISTAKES) {
            ids.add(m.id);
            [m.where, m.task, m.rule, ...m.wrote, ...m.right].forEach(x => {
                if (!x.en.trim() || !x.ru.trim()) throw new Error(`${m.id}: empty text`);
                if (/[А-Яа-яЁё]/.test(x.en)) throw new Error(`${m.id}: Cyrillic in English: ${x.en}`);
            });
            // what she wrote is wrong on purpose; the task, the right way and the rule are checked
            checkMath([m.task, m.rule, ...m.right].map(x => x.en), `mistake ${m.id}`);
            checkMath([m.task, m.rule, ...m.right].map(x => x.ru), `mistake ${m.id}`);
            const plan = PREP_PLAN.find(([k]) => k === m.skill);
            expect(plan?.[1]).toContain(m.kind);
            expect(kindOf(makeProblem(m.skill, makeRng(7), m.kind))).toBe(m.kind);
        }
        expect(ids.size).toBe(HOMEWORK_MISTAKES.length);
        expect(HOMEWORK_MISTAKES.length).toBe(18);
        // the final answers of the right way, recomputed
        const last = (id: string) => HOMEWORK_MISTAKES.find(m => m.id === id)!.right.at(-1)!.en;
        expect(last('c4')).toContain(`= ${(1341 * 7).toLocaleString('en-US')}`);
        expect(last('d3')).toContain(`= ${(720 * 6).toLocaleString('en-US')}`);
        expect(last('d8')).toContain(`= ${(4 * 1865).toLocaleString('en-US')}`);
        expect(last('d5')).toContain(`= ${(371 * 8).toLocaleString('en-US')}`);
        expect(last('d2')).toContain(`= ${(326 * 9).toLocaleString('en-US')}`);
        expect(last('f10')).toContain(`= ${(937 * 7).toLocaleString('en-US')}`);
        expect(last('p65')).toContain(`= ${(120 + 231 + 90) / 7}`);
    });
    test('a wrong answer goes to the list once, a right rework answer takes it off', () => {
        const rng = makeRng(3);
        let s = newState();
        expect(reworkQueue(s.homeworkFixed, s.mistakeLog).length).toBe(18);
        const p = makeProblem('mult-expr', rng, 'product');
        s = logMistake(s, p, '600', 1);
        s = logMistake(s, p, '601', 2);
        expect(s.mistakeLog.length).toBe(1);
        expect(s.mistakeLog[0].given).toBe('601');
        let q = reworkQueue(s.homeworkFixed, s.mistakeLog);
        // homework first, then the app
        expect(q.length).toBe(19);
        expect(q[0].from).toBe('homework');
        expect(q[18].from).toBe('app');
        s = fixRework(s, q[0]);
        s = fixRework(s, q[18]);
        q = reworkQueue(s.homeworkFixed, s.mistakeLog);
        expect(q.length).toBe(17);
        expect(s.mistakeLog).toEqual([]);
        // the list keeps the last 60
        for (let i = 0; i < 70; i++) s = logMistake(s, makeProblem('round', makeRng(i + 100)), '1', i);
        expect(s.mistakeLog.length).toBeLessThanOrEqual(60);
        // an older save gets an empty list and every homework mistake to rework
        const old = { ...newState() } as Record<string, unknown>;
        delete old.mistakeLog; delete old.homeworkFixed;
        expect(reworkQueue(normalize(old).homeworkFixed, normalize(old).mistakeLog).length).toBe(18);
    });
    test('the review page of an app mistake shows her answer and the right way with right math', () => {
        for (const skill of ALL_SKILLS) for (let seed = 1; seed <= 20; seed++) {
            const p = makeProblem(skill, makeRng(seed));
            const th = reworkTheory({ from: 'app', e: { t: 1, problem: p, given: '42' } });
            expect(th.sections.find(x => x.kind === 'warn' && 'body' in x && Array.isArray(x.body) && x.body[0].en === '42')).toBeTruthy();
            const ex = th.sections.find(x => x.kind === 'example');
            if (!ex || ex.kind !== 'example') throw new Error('example expected');
            checkMath(ex.body.map(x => x.en), `rework ${p.id}`);
            checkMath(ex.body.map(x => x.ru), `rework ${p.id}`);
        }
    });
});

describe('long division algorithm', () => {
    test('quotient and remainder match plain arithmetic for every dividend up to 9999', () => {
        for (let d = 2; d <= 9; d++) for (let n = 1; n <= 9999; n += 7) {
            const r = longDivision(n, d);
            expect([r.quotient, r.remainder]).toEqual([Math.floor(n / d), n % d]);
            const pq = partialQuotients(n, d);
            expect([pq.quotient, pq.remainder]).toEqual([Math.floor(n / d), n % d]);
            for (const s of r.steps) expect(s.rest).toBeLessThan(d);
        }
    });
    test('a zero inside the quotient gets its own step', () => {
        const r = longDivision(618, 3);
        expect(r.quotient).toBe(206);
        expect(r.steps.map(s => s.digit)).toEqual([2, 0, 6]);
    });
});

describe('every generated task is correct', () => {
    for (const skill of ALL_SKILLS) {
        test(skill, () => {
            const ids = new Set<string>();
            each(skill, (p, seed) => {
                const where = `${skill}#${seed} ${p.id}`;
                expect(p.skill).toBe(skill);
                expect(p.topic).toBe(TOPIC_OF[skill]);
                ids.add(p.id);
                textsOf(p).forEach(t => checkText(t, where));
                checkMath(mathTextsOf(p).map(t => t.en), where);
                checkMath(mathTextsOf(p).map(t => t.ru), where);
                const want = expected(p);
                if (p.answer.kind === 'number') {
                    expect(Number.isInteger(p.answer.value)).toBe(true);
                    expect(p.answer.value).toBeGreaterThanOrEqual(0);
                    expect(p.answer.value).toBe(want as number);
                } else if (p.answer.kind === 'remainder') {
                    expect({ q: p.answer.q, r: p.answer.r }).toEqual(want as { q: number; r: number });
                    expect(p.answer.r).toBeLessThan(Number(p.data.divisor));
                    expect(p.answer.r).toBeGreaterThan(0);
                } else if (p.answer.kind === 'fill') {
                    // 6 × 0 = 0 in the standard algorithm is a real blank
                    expect(p.answer.values.every(v => Number.isInteger(v) && v >= 0)).toBe(true);
                } else if (p.answer.kind === 'word') {
                    // a typed word: case, an article and a full stop do not matter, a wrong word does
                    const w = p.answer.word;
                    expect(w.trim().length).toBeGreaterThan(2);
                    expect(sameAnswer(p.answer, { text: w })).toBe(true);
                    expect(sameAnswer(p.answer, { text: ` The ${w.toUpperCase()}. ` })).toBe(true);
                    expect(sameAnswer(p.answer, { text: `${w}x` })).toBe(false);
                    expect(sameAnswer(p.answer, { text: '' })).toBe(false);
                    expect(p.prompt.en).toContain('___');
                } else if (p.answer.kind === 'multi') {
                    // select all: at least one right and one wrong option, every index on the list
                    const en = p.answer.options.map(o => o.en);
                    expect(new Set(en).size).toBe(en.length);
                    expect(p.answer.correct.length).toBeGreaterThanOrEqual(1);
                    expect(p.answer.correct.length).toBeLessThan(en.length);
                    expect(new Set(p.answer.correct).size).toBe(p.answer.correct.length);
                    p.answer.correct.forEach(i => { expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThan(en.length); });
                } else {
                    const en = p.answer.options.map(o => o.en);
                    expect(new Set(en).size).toBe(en.length);
                    expect(p.answer.options.length).toBeGreaterThanOrEqual(2);
                    expect(p.answer.correct).toBeGreaterThanOrEqual(0);
                    expect(p.answer.correct).toBeLessThan(en.length);
                }
                // task size matches the skill (4.NBT.B.6: up to four-digit dividends, one-digit divisors)
                if (TOPIC_OF[skill] === 'division') {
                    expect(Number(p.data.divisor)).toBeGreaterThanOrEqual(2);
                    expect(Number(p.data.divisor)).toBeLessThanOrEqual(9);
                    expect(Number(p.data.dividend)).toBeLessThanOrEqual(9999);
                }
                if (skill === 'div-2d') expect(Number(p.data.dividend)).toBeLessThanOrEqual(99);
                if (skill === 'div-3d') expect(String(p.data.dividend).length).toBe(3);
                if (skill === 'div-4d') expect(String(p.data.dividend).length).toBe(4);
                if (skill === 'div-zero') expect(String(p.data.quotient).slice(1)).toContain('0');
            });
            // lots of different tasks, not the same few again and again
            // the study guide sentences are a fixed list: 30 sentences, typed or from a word bank
            expect(ids.size).toBeGreaterThan(skill === 'motion-ideas' ? 8 : skill === 'sci-words' ? 50 : 60);
        });
    }
    test('the trip trap really differs from averaging the speeds', () => {
        let traps = 0;
        each('speed-trip', p => {
            if (!p.id.includes(':trap:')) return;
            traps++;
            expect(p.data.mean).not.toBe(p.data.avg);
            const right = p.answer.kind === 'choice' ? p.answer.options[p.answer.correct].en : '';
            expect(right).toContain(String(p.data.avg));
        });
        expect(traps).toBeGreaterThan(50);
    });
    test('the missing-zero check marks the right quotient as correct', () => {
        each('div-check', p => {
            if (p.answer.kind !== 'choice') throw new Error('choice expected');
            const right = p.answer.options[p.answer.correct].en;
            if (p.id.includes(':z:')) expect(num(right.replace(/\D+/g, ' ').trim().split(' ').pop() ?? '')).toBe(Number(p.data.quotient));
            if (p.id.includes(':r:')) expect(right).toContain(`R ${p.data.remainder}`);
        });
    });
    test('the reasonable-answer task says yes only for the exact product', () => {
        each('est-product', p => {
            if (p.answer.kind !== 'choice') return;
            const right = p.answer.options[p.answer.correct].en;
            expect(right.startsWith('Yes')).toBe(Number(p.data.offered) === Number(p.data.a) * Number(p.data.b));
        });
    });
});

describe('tasks are realistic', () => {
    test('every speed fits its vehicle, trips use different times per part', () => {
        const range: Record<string, Record<string, [number, number]>> = {
            '🚶': { mi: [2, 4], km: [3, 6] }, '🚲': { mi: [6, 15], km: [10, 24] }, '🚌': { mi: [20, 45], km: [30, 70] },
            '🚗': { mi: [30, 65], km: [48, 105] }, '🚆': { mi: [50, 80], km: [80, 130] }, '🚄': { mi: [75, 155], km: [120, 250] }, '✈️': { mi: [300, 600], km: [500, 950] },
        };
        for (const skill of ['speed-basic', 'speed-find', 'speed-trip'] as SkillId[]) each(skill, p => {
            if (p.visual?.kind !== 'trip') return;
            const unit = p.visual.unit;
            for (const leg of p.visual.legs) {
                const [lo, hi] = range[leg.vehicle][unit];
                if (leg.speed < lo || leg.speed > hi) throw new Error(`${p.id}: ${leg.vehicle} at ${leg.speed} ${unit}`);
                expect(leg.distance).toBe(leg.speed * leg.time);
            }
            if (skill === 'speed-trip' && !p.id.includes(':leg:')) expect(new Set(p.visual.legs.map(l => l.time)).size).toBeGreaterThan(1);
        });
        each('speed-units', p => {
            if (p.id.includes(':per:')) expect(Number(p.answer.kind === 'number' && p.answer.value)).toBeLessThanOrEqual(18);
            if (p.id.includes(':half:')) expect(Number(p.data.speed)).toBeLessThanOrEqual(60);
        });
    });
    test('division stories only use numbers that make sense for them', () => {
        const limits: [RegExp, number][] = [[/playground/, 60], [/Martin build/, 150], [/little flowers/, 120], [/saves the same amount/, 300], [/ice cream shop/, 200], [/cartwheels/, 300]];
        for (const skill of ['div-2d', 'div-3d', 'div-zero', 'div-4d'] as SkillId[]) each(skill, p => {
            for (const [re, max] of limits) if (re.test(p.prompt.en)) expect(Number(p.data.dividend)).toBeLessThanOrEqual(max);
        });
        each('div-word', p => {
            if (/van holds/.test(p.prompt.en)) expect(Number(p.data.divisor)).toBeGreaterThanOrEqual(7);
            expect(p.prompt.en).not.toMatch(/\b1 (kids|beads|books|cupcakes|strawberries)\b/);
        });
    });
});

describe('theory and quizzes', () => {
    test('theory teaches the building blocks first, from the basics up', () => {
        const blocks = (skill: SkillId) => buildTheory(skill, makeRng(1)).sections.flatMap(s => (s.kind === 'prereq' ? [s.title.en] : []));
        // average speed of a trip: divide first, then speed, then multiply for each part's distance
        expect(chainOf('speed-trip')).toEqual(['div-facts', 'div-2d', 'speed-basic', 'mult-area', 'mult-partial', 'mult-standard', 'speed-find']);
        expect(blocks('speed-trip')[0]).toBe('Building block 1: Division facts');
        for (const skill of ALL_SKILLS) {
            const chain = chainOf(skill);
            expect(chain).not.toContain(skill);
            // every block comes after the blocks it needs
            chain.forEach((s, i) => chainOf(s).forEach(n => expect(chain.indexOf(n)).toBeLessThan(i)));
            expect(blocks(skill).length).toBe(chain.length);
        }
        expect(chainOf('speed-basic')).toEqual(['div-facts', 'div-2d']);
        expect(chainOf('word-steps')).toEqual(['mult-area', 'mult-partial', 'mult-standard', 'round']);
        expect(chainOf('div-facts')).toEqual([]);
    });
    test('every theory page has correct math in both languages and changes its examples', () => {
        for (const skill of ALL_SKILLS) {
            const firstExamples = new Set<string>();
            for (let seed = 1; seed <= 150; seed++) {
                const rng = makeRng(seed);
                const failed = makeProblem(skill, rng);
                const th = buildTheory(skill, rng, failed);
                const texts: L10n[] = [th.title];
                const prompts: L10n[] = [];
                const all = th.sections.flatMap(s => (s.kind === 'prereq' ? [s, ...s.sections] : [s]));
                for (const s of all) {
                    if ('title' in s) texts.push(s.title);
                    if ('prompt' in s) prompts.push(s.prompt);
                    if (s.kind === 'prereq') continue;
                    if (Array.isArray(s.body)) texts.push(...s.body); else texts.push(s.body);
                }
                [...texts, ...prompts].forEach(t => checkText(t, `theory ${skill}#${seed}`));
                // spot-the-mistake skills quote a wrong claim in their example questions on purpose
                if (!['div-check', 'est-product'].includes(skill)) texts.push(...prompts);
                checkMath(texts.map(t => t.en), `theory ${skill}#${seed}`);
                checkMath(texts.map(t => t.ru), `theory ${skill}#${seed}`);
                const ex = th.sections.find(s => s.kind === 'example');
                if (ex && 'prompt' in ex) firstExamples.add(ex.prompt.en);
                expect(th.sections.some(s => s.kind === 'love')).toBe(true);
                expect(th.sections.some(s => s.kind === 'example' && s.title.en === 'Your task, step by step')).toBe(true);
            }
            expect(firstExamples.size).toBeGreaterThan(5);
        }
    });
    test('quizzes have 3 different questions and are different every time', () => {
        for (const skill of ALL_SKILLS) {
            const seenQuizzes = new Set<string>();
            for (let seed = 1; seed <= 200; seed++) {
                const quiz = buildQuiz(skill, makeRng(seed), new Set());
                expect(quiz.length).toBe(3);
                expect(new Set(quiz.map(q => q.id)).size).toBe(3);
                quiz.forEach(q => { textsOf(q).forEach(t => checkText(t, `quiz ${skill}`)); checkMath(mathTextsOf(q).map(t => t.en), `quiz ${skill}`); checkMath(mathTextsOf(q).map(t => t.ru), `quiz ${skill}`); });
                seenQuizzes.add(quiz.map(q => q.id).join('|'));
            }
            expect(seenQuizzes.size).toBeGreaterThan(150);
        }
    });
});

describe('game flow', () => {
    test('recent tasks never repeat', () => {
        for (const skill of ALL_SKILLS) {
            if (skill === 'motion-ideas') continue;
            const rng = makeRng(42);
            const seen = new Set<string>();
            for (let i = 0; i < 40; i++) {
                const p = makeFreshProblem(skill, rng, seen);
                expect(seen.has(p.id)).toBe(false);
                seen.add(p.id);
            }
        }
    });
    test('learning time follows 50% division, 25% motion, 25% rounding', () => {
        let s = newState();
        const rng = makeRng(7);
        for (let i = 0; i < 1500; i++) {
            const p = nextProblem(s, rng);
            const ok = rng() < 0.75;
            s = applyAnswer(s, p, ok, { firstTry: true, hint: false, sec: 30 }).state;
            if (!ok) s = applyQuiz(s, p.skill, true, []);
            s = addTime(s, p.topic, 20 + Math.floor(rng() * 40), '2026-10-21');
        }
        const total = totalTime(s);
        expect(Math.abs(s.time.division / total - 0.5)).toBeLessThan(0.05);
        expect(Math.abs(s.time.science / total - 0.25)).toBeLessThan(0.05);
        expect(Math.abs(s.time.estimation / total - 0.25)).toBeLessThan(0.05);
        // every skill was reached in the end; the memory checks come by FACT_EVERY in the app, not by the ladder
        for (const k of ALL_SKILLS) if (k !== 'mult-facts') expect(s.skills[k].seen).toBeGreaterThan(0);
    }, 20_000);
    // 1,500 tasks take 2-3 s on a laptop and over 5 s on a slow GitHub runner (two CI failures on 2026-10-28 and 2026-10-29): a longer timeout, not a smaller run
    test('a failed skill comes back after the quiz', () => {
        let s = newState();
        const rng = makeRng(3);
        const p = makeProblem('div-3d', rng);
        s = applyAnswer(s, p, false, { firstTry: true, hint: false, sec: 10 }).state;
        expect(s.skills['div-3d'].needsTheory).toBe(true);
        expect(nextSkill(s, rng)).toBe('div-3d');
        s = applyQuiz(s, 'div-3d', true, []);
        expect(s.skills['div-3d'].needsTheory).toBe(false);
        for (let i = 0; i < 3; i++) s = applyAnswer(s, makeProblem('round', rng), true, { firstTry: true, hint: false, sec: 5 }).state;
        expect(nextSkill(s, rng)).toBe('div-3d');
        s = applyAnswer(s, makeProblem('div-3d', rng), true, { firstTry: true, hint: false, sec: 5 }).state;
        expect(s.skills['div-3d'].reviewPending).toBe(false);
    });
    test('the practice test: every kind of every homework of the week exactly once, plus the reviews due', () => {
        const day = '2026-10-28', s = newState();
        const once = (t: Problem[], kinds: [SkillId, readonly string[]][]) => {
            expect(t.length).toBe(kinds.reduce((n, [, ks]) => n + ks.length, 0));
            for (const [skill, ks] of kinds) for (const k of ks) expect(t.filter(p => p.skill === skill && kindOf(p) === k).length).toBe(1);
            expect(new Set(t.map(p => p.id)).size).toBe(t.length);
        };
        // the week grows day by day: Lesson 4-2 on 2026-10-26, 4-3 joins on 2026-10-27, 4-4 on 2026-10-28, 4-5 on 2026-10-29
        once(buildTest(s, makeRng(9), '2026-10-26'), [['mult-2x10', KINDS_4_2]]);
        once(buildTest(s, makeRng(9), '2026-10-27'), [['mult-2x10', KINDS_4_2], ['est-2x2', KINDS_4_3]]);
        once(buildTest(s, makeRng(9), day), [['mult-2x10', KINDS_4_2], ['est-2x2', KINDS_4_3], ['mult-2x2', KINDS_4_4]]);
        const week: [SkillId, readonly string[]][] = [['mult-2x10', KINDS_4_2], ['est-2x2', KINDS_4_3], ['mult-2x2', KINDS_4_4], ['dist-2x2', KINDS_4_5]];
        once(buildTest(s, makeRng(9), '2026-10-29'), week);
        // a day without a homework tests the whole last week
        once(buildTest(s, makeRng(9), '2026-11-02'), week);
        // an old skill due for a review gets one task; a homework skill due is not added again
        let r = applyAnswer(s, makeProblem('div-4d', makeRng(1)), true, { firstTry: true, hint: false, sec: 5, day: '2026-10-27' }).state;
        r = applyAnswer(r, makeProblem('est-2x2', makeRng(2), 'round'), true, { firstTry: true, hint: false, sec: 5, day: '2026-10-27' }).state;
        expect(reviewsDue(r, day)).toEqual(['div-4d', 'est-2x2']);
        const t2 = buildTest(r, makeRng(9), day);
        expect(t2.length).toBe(KINDS_4_2.length + KINDS_4_3.length + KINDS_4_4.length + 1);
        expect(t2.filter(p => p.skill === 'est-2x2').length).toBe(KINDS_4_3.length);
        expect(t2.filter(p => p.skill === 'div-4d').length).toBe(1);
        expect(testPlan(r, day).length).toBe(t2.length);
    });
    test('the practice test without a day: 6 division, 5 science, 5 of Topic 3, 1 of Lesson 4-2, 1 of Lesson 4-3, 1 of Lesson 4-4, 1 of Lesson 4-5 and 2 different multiplication strategies', () => {
        const test1 = buildTest(newState(), makeRng(9));
        expect(test1.length).toBe(22);
        expect(test1.filter(p => p.skill === 'mult-2x10').length).toBe(1);
        expect(test1.filter(p => p.skill === 'est-2x2').length).toBe(1);
        expect(test1.filter(p => p.skill === 'mult-2x2').length).toBe(1);
        expect(test1.filter(p => p.skill === 'dist-2x2').length).toBe(1);
        expect(test1.filter(p => p.topic === 'division').length).toBe(6);
        expect(test1.filter(p => p.topic === 'science').length).toBe(5);
        expect(test1.some(p => p.skill === 'sci-words')).toBe(true);
        expect(test1.filter(p => p.topic === 'estimation').length).toBe(11);
        expect(test1.some(p => p.skill === 'forces')).toBe(true);
        const strategies = test1.filter(p => STRATEGIES.includes(p.skill)).map(p => p.skill);
        expect(strategies.length).toBe(2);
        expect(new Set(strategies).size).toBe(2);
    });
    test('a finished picture waits for her choice and keeps the extra stars', () => {
        const parts = () => 20;
        let s = newState();
        let r = addPaintStars(s, 38, parts, 2);
        expect(r.finished).toBe(null);
        r = addPaintStars(r.state, 3, parts, 2);
        expect(r.finished).toBe(0);
        expect(r.state.painting.choosing).toBe(true);
        expect(r.state.painting.done).toEqual([0]);
        expect(r.state.painting.filled).toBe(1);
        // stars earned while choosing are kept, nothing else finishes
        r = addPaintStars(r.state, 5, parts, 2);
        expect(r.finished).toBe(null);
        s = chooseNextPainting(r.state, 4, parts, 2);
        expect(s.painting).toEqual({ index: 4, filled: 6, done: [0], choosing: false });
    });
    test('every kind of task of every homework plan is made on request and named the same way', () => {
        const extra: Record<string, string[]> = { 'est-product': ['tens', 'reasonable'], 'motion-ideas': ['energy'], 'speed-trip': ['leg'] };
        for (const [skill, kinds] of HOMEWORKS.flatMap(h => h.plan)) {
            for (const kind of kinds) for (let seed = 1; seed <= 60; seed++) {
                const p = makeProblem(skill, makeRng(seed * 31 + kind.length), kind);
                if (kindOf(p) !== kind) throw new Error(`${skill}:${kind} asked, got ${kindOf(p)} (${p.id})`);
            }
            // whatever the generator makes on its own is a kind of the plan or a known extra
            const made = new Set<string>();
            each(skill, p => made.add(kindOf(p)));
            expect(Array.from(made).filter(k => !kinds.includes(k) && !(extra[skill] ?? []).includes(k))).toEqual([]);
            expect(kinds.every(k => made.has(k))).toBe(true);
        }
    });
    test('the daily goal is right answers: before the test one for every kind of homework task, later 30 a day', () => {
        const day = '2026-10-22', s0 = newState();
        const total = PREP_PLAN.reduce((a, [, ks]) => a + ks.length, 0);
        const g0 = dailyGoal(s0, day);
        expect(g0.total).toBe(total);
        expect(g0.done).toBe(0);
        expect(uncovered(s0, day).length).toBe(total);
        const rng = makeRng(5);
        const right = (s: typeof s0, p: Problem, d = day) => applyAnswer(s, p, true, { firstTry: true, hint: false, sec: 5, day: d }).state;
        let s = s0;
        // wrong answers and right answers on another day do not count, the same kind twice counts once
        s = applyAnswer(s, makeProblem('forces', rng, 'gravity'), false, { firstTry: true, hint: false, sec: 5, day }).state;
        s = right(s, makeProblem('forces', rng, 'gravity'), '2026-10-21');
        expect(dailyGoal(s, day).done).toBe(0);
        s = right(s, makeProblem('forces', rng, 'gravity'));
        s = right(s, makeProblem('forces', rng, 'gravity'));
        expect(dailyGoal(s, day).done).toBe(1);
        expect(uncovered(s, day)).not.toContainEqual(['forces', 'gravity']);
        // practice test answers count too
        s = applyTest(s, [makeProblem('mult-expr', rng, 'pick'), makeProblem('mult-word', rng, 'bags')], [true, false], 60, day);
        expect(s.dailyKinds[day]['mult-expr:pick']).toBe(1);
        expect(s.dailyKinds[day]['mult-word:bags']).toBeUndefined();
        // a skill of the plan in normal play gives a kind not covered yet
        for (let i = 0; i < 30; i++) expect(kindOf(nextProblem(s, rng, 'forces', { day }))).not.toBe('gravity');
        // following test prep covers the whole plan with one right answer per kind
        let tasks = 0;
        while (uncovered(s, day).length && tasks < 200) {
            const open = prepPicks(s, day);
            const [skill, kind] = open[Math.floor(rng() * open.length)];
            s = right(s, nextProblem(s, rng, skill, { kind, day }));
            tasks++;
        }
        expect(dailyGoal(s, day).done).toBe(total);
        expect(tasks).toBe(total - 2);
        // everything covered: test prep keeps going with the whole plan
        expect(prepPicks(s, day).length).toBe(total);
        // after the test day: 30 right answers of any kind (the rows are the skills due for a review)
        const after = '2026-10-24';
        expect(dailyGoal(s, after)).toMatchObject({ done: 0, total: DAILY_RIGHT, homework: false });
        expect(dailyGoal(s, after).rows.every(r => r.review)).toBe(true);
        expect(uncovered(s, after)).toEqual([]);
        for (let i = 0; i < 40; i++) s = right(s, makeProblem('round', rng), after);
        expect(dailyGoal(s, after).done).toBe(DAILY_RIGHT);
    });
    test('test prep with mistakes never repeats a task, and still covers the plan', () => {
        for (const seed of [1, 2, 3, 4, 5]) {
            const day = '2026-10-22', rng = makeRng(seed);
            let s = newState();
            const ids = new Set<string>();
            for (let i = 0; i < 120 && uncovered(s, day).length; i++) {
                const open = prepPicks(s, day);
                const [skill, kind] = open[Math.floor(rng() * open.length)];
                const p = nextProblem(s, rng, skill, { kind, day });
                if (ids.has(p.id)) throw new Error(`seed ${seed}: task ${i + 1} repeats ${p.id}`);
                ids.add(p.id);
                // every third answer is wrong: that kind stays open and comes back with a new question
                s = applyAnswer(s, p, i % 3 !== 2, { firstTry: true, hint: false, sec: 5, day }).state;
            }
            expect(uncovered(s, day)).toEqual([]);
        }
    });
    test('progress saved by an older build keeps today\'s right answers', () => {
        const t = new Date(2026, 9, 22, 21, 30).getTime();
        const old = { ...newState(), history: [{ t, skill: 'forces', ok: true, firstTry: true, hint: false, sec: 9 }, { t, skill: 'forces', ok: false, firstTry: true, hint: false, sec: 9 }, { t, skill: 'mult-expr', ok: true, firstTry: true, hint: false, sec: 9 }] } as Record<string, unknown>;
        delete old.dailySkills;
        const s = normalize(old);
        // 9:30 pm in New York is still the 22nd on the device clock
        expect(dayOf(new Date(t))).toBe('2026-10-22');
        expect(s.dailySkills['2026-10-22']).toEqual({ forces: 1, 'mult-expr': 1 });
    });
    test('hints are rare and adapt: one in three tasks at first, longer pause when she grabs every hint, shorter when she manages alone', () => {
        const rng = makeRng(2);
        let s = newState();
        const answer = (hint: boolean) => { s = applyAnswer(s, makeProblem('round', rng), true, { firstTry: true, hint, sec: 3 }).state; };
        expect(hintOpen(s)).toBe(true);
        expect(s.hintPause).toBe(HINT_PAUSE);
        // taking every hint the moment it is back: the pause grows up to the max, never more than one hint per pause + 1 tasks
        const used: boolean[] = [];
        for (let i = 0; i < 60; i++) { const h = hintOpen(s); used.push(h); answer(h); }
        expect(s.hintPause).toBe(HINT_PAUSE_MAX);
        for (let i = 0; i + 3 <= used.length; i++) expect(used.slice(i, i + 3).filter(Boolean).length).toBeLessThanOrEqual(1);
        expect(used.slice(-30).filter(Boolean).length).toBeLessThanOrEqual(30 / (HINT_PAUSE_MAX + 1));
        // no hints at all: the pause shrinks back to the min
        for (let i = 0; i < 40; i++) answer(false);
        expect(s.hintPause).toBe(HINT_PAUSE_MIN);
        expect(hintOpen(s)).toBe(true);
        // a hint right after it was used is never there
        answer(true);
        expect(hintOpen(s)).toBe(false);
        // an older save gets the hint right away with the starting pause
        const old = { ...newState() } as Record<string, unknown>;
        delete old.sinceHint; delete old.hintPause;
        expect(hintOpen(normalize(old))).toBe(true);
        expect(normalize(old).hintPause).toBe(HINT_PAUSE);
    });
    test('stars: 3 on the first try, 2 with a hint, 1 after learning', () => {
        const p = makeProblem('round', makeRng(1));
        expect(applyAnswer(newState(), p, true, { firstTry: true, hint: false, sec: 1 }).stars).toBe(3);
        expect(applyAnswer(newState(), p, true, { firstTry: true, hint: true, sec: 1 }).stars).toBe(2);
        expect(applyAnswer(newState(), p, true, { firstTry: false, hint: false, sec: 1 }).stars).toBe(1);
        expect(applyAnswer(newState(), p, false, { firstTry: true, hint: false, sec: 1 }).stars).toBe(0);
    });
});
