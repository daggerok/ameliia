/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { type L10n, type Problem, type SkillId, TOPIC_OF, makeRng, sameAnswer } from '../src/engine/core';
import { longDivision, partialQuotients } from '../src/engine/division';
import { roundTo } from '../src/engine/estimation';
import { ALL_SKILLS, STRATEGIES, addPaintStars, addTime, applyAnswer, applyQuiz, buildTest, chooseNextPainting, newState, nextProblem, nextSkill, totalTime } from '../src/engine/game';
import { makeFreshProblem, makeProblem } from '../src/engine/index';
import { buildQuiz } from '../src/engine/quiz';
import { buildTheory, chainOf } from '../src/engine/theory';
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
    for (const m of text.matchAll(CHAIN)) {
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
    // Russian may keep a few English science words on purpose (velocity, acceleration, speed, iPad, R)
    const latin = (l.ru.match(/[A-Za-z]{3,}/g) ?? []).filter(w => !['velocity', 'acceleration', 'speed', 'ipad'].includes(w.toLowerCase()));
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
            expect(ids.size).toBeGreaterThan(skill === 'motion-ideas' ? 8 : 60);
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
        // every skill was reached in the end
        for (const k of ALL_SKILLS) expect(s.skills[k].seen).toBeGreaterThan(0);
    });
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
    test('the practice test: 6 division, 4 science, 5 of Topic 3 and 2 different multiplication strategies', () => {
        const test1 = buildTest(newState(), makeRng(9));
        expect(test1.length).toBe(17);
        expect(test1.filter(p => p.topic === 'division').length).toBe(6);
        expect(test1.filter(p => p.topic === 'science').length).toBe(4);
        expect(test1.filter(p => p.topic === 'estimation').length).toBe(7);
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
    test('stars: 3 on the first try, 2 with a hint, 1 after learning', () => {
        const p = makeProblem('round', makeRng(1));
        expect(applyAnswer(newState(), p, true, { firstTry: true, hint: false, sec: 1 }).stars).toBe(3);
        expect(applyAnswer(newState(), p, true, { firstTry: true, hint: true, sec: 1 }).stars).toBe(2);
        expect(applyAnswer(newState(), p, true, { firstTry: false, hint: false, sec: 1 }).stars).toBe(1);
        expect(applyAnswer(newState(), p, false, { firstTry: true, hint: false, sec: 1 }).stars).toBe(0);
    });
});
