/// <reference types="bun" />
import { describe, expect, spyOn, test } from 'bun:test';
import { type Given, type L10n, type Problem, type SkillId, fillMarks, makeRng, sameAnswer } from '../src/engine/core';
import { diagnose, diagnoseNumber, safeDiagnose } from '../src/engine/diagnose';
import { ALL_SKILLS, fixRework, kindOf, logMistake, missedRework, newState, nextProblem, reworkDue, reworkEvery, startedRework, applyAnswer } from '../src/engine/game';
import { makeProblem } from '../src/engine';
import { reworkQueue, reworkSkill, reworkTheory } from '../src/engine/mistakes';

// an independent check of every "a op b = c" claim in a text (same idea as in engine.test.ts)
const num = (s: string) => Number(s.replace(/[,\s $]/g, ''));
const evaluate = (expr: string): number => {
    const tokens = expr.replace(/\$/g, '').match(/\d[\d,]*|[×÷+−()]/g) ?? [];
    let i = 0;
    const atom = (): number => { const t = tokens[i++]; if (t === '(') { const v = sum(); i++; return v; } return num(t); };
    const prod = (): number => { let v = atom(); while (tokens[i] === '×' || tokens[i] === '÷') { const op = tokens[i++]; const r = atom(); v = op === '×' ? v * r : v / r; } return v; };
    const sum = (): number => { let v = prod(); while (tokens[i] === '+' || tokens[i] === '−') { const op = tokens[i++]; const r = prod(); v = op === '+' ? v + r : v - r; } return v; };
    return sum();
};
const joinGroups = (s: string) => s.replace(/(\d)[  ](\d{3})(?!\d)/g, '$1$2').replace(/(\d)[  ](\d{3})(?!\d)/g, '$1$2');
const EXPR = String.raw`\(?\$?\d[\d,]*\)?(?:\s*[×÷+−]\s*\(?\$?\d[\d,]*\)?)*`;
const CHAIN = new RegExp(`(${EXPR})((?:\\s*=\\s*${EXPR})+)`, 'g');
const mathOk = (text: string) => {
    for (const m of Array.from(joinGroups(text).matchAll(CHAIN))) {
        const parts = m[0].split('=').map(s => s.trim());
        if (!parts.some(p => /[×÷+−]/.test(p))) continue;
        const v = parts.map(evaluate);
        if (v.some(x => Math.abs(x - v[0]) > 1e-9)) throw new Error(`wrong math "${m[0]}" in: ${text}`);
    }
};
const clean = (l: L10n, where: string) => {
    for (const s of [l.en, l.ru]) {
        if (!s.trim() || /undefined|NaN|\[object/.test(s)) throw new Error(`${where}: broken text ${s}`);
        mathOk(s);
    }
    if (/[А-Яа-яЁё]/.test(l.en)) throw new Error(`${where}: Cyrillic in English: ${l.en}`);
};

const fake = (skill: SkillId, data: Record<string, number>): Problem => ({ id: 'x', skill, topic: 'estimation', prompt: { en: 'x', ru: 'x' }, steps: [], hint: { en: 'x', ru: 'x' }, answer: { kind: 'number', value: 0 }, data });

describe('what went wrong: her real homework mistakes', () => {
    const cases: [string, Problem, number, number, RegExp][] = [
        ['Set C 4: 7 × 40 written as 28', fake('mult-partial', { m: 7, a: 1341 }), 280, 28, /^A zero got lost: 28 instead of 280/],
        ['Set D 3: 6 × 20 written as 12', fake('mult-dist', { m: 6, a: 720 }), 120, 12, /^A zero got lost: 12 instead of 120/],
        ['Set D 5: 8 × 70 written as 640', fake('mult-dist', { m: 8, a: 371 }), 560, 640, /^Check the fact: 8 × 7 = 56, not 64 \(64 is 8 × 8\)/],
        ['Set F 10: 937 × 7 as 937 × 9', fake('mult-mental', { m: 7, a: 937 }), 6559, 8433, /^It looks like you multiplied by 9, not by 7: 937 × 9 is 8,433/],
        ['Set A 1: 8 × 60 written as 560', fake('mult-tens', { m: 8, b: 60 }), 480, 560, /^Check the fact: 8 × 6 = 48, not 56 \(56 is 8 × 7\)/],
        ['No 10: 3,546 + 1,377 written as 3,923', fake('mult-word', {}), 4923, 3923, /^Only the thousands digit is off by 1: 3 instead of 4\. That is usually a carry/],
        ['Set B 8: 6 × 8,000 written as 56,000', fake('est-product', { a: 8166, b: 6, ra: 8000 }), 48000, 56000, /^It looks like you multiplied by 7, not by 6/],
        ['No 18: 5 × 1,903 as 965', fake('mult-expr', { m: 5, a: 1903 }), 9515, 965, /^The 0 in 1,903 got lost: you found 5 × 193/],
        ['No 18: 9,505, a lost carry', fake('mult-expr', { m: 5, a: 1903 }), 9515, 9505, /^Only the tens digit is off by 1/],
        ['No 18: 9,155, swapped digits', fake('mult-expr', { m: 5, a: 1903 }), 9515, 9155, /^All the digits are right, but two of them are in the wrong order/],
        ['2 × 6,000 written as 1,200: a lost zero at the end, not inside', fake('mult-tens', { m: 2, b: 6000 }), 12000, 1200, /^A zero got lost: 1,200 instead of 12,000/],
        ['4 × 2,050 as 4 × 250: the zero inside', fake('mult-partial', { m: 4, a: 2050 }), 8200, 1000, /^The 0 in 2,050 got lost: you found 4 × 250/],
        ['618 ÷ 3 written as 26', fake('div-zero', {}), 206, 26, /^A zero in the middle is missing: 26 instead of 206/],
        ['3,449 to hundreds as 3,000', fake('round', { n: 3449, place: 100 }), 3400, 3000, /^You rounded to the nearest thousand, but the task asks for the nearest hundred/],
        ['7,962 to hundreds as 7,900', fake('round', { n: 7962, place: 100 }), 8000, 7900, /^The digit to the right is 5 or more, so this number rounds UP/],
    ];
    for (const [name, p, want, got, re] of cases) test(name, () => {
        const d = diagnoseNumber(p, want, got);
        expect(d?.en ?? '').toMatch(re);
        clean(d!, name);
        expect(d!.ru.length).toBeGreaterThan(20);
    });
    test('a right answer or an unclear one gets no diagnosis', () => {
        expect(diagnoseNumber(fake('multiply', { a: 12, b: 3 }), 36, 36)).toBeNull();
        expect(diagnoseNumber(fake('multiply', { a: 1, b: 1 }), 1234, 987)).toBeNull();
        expect(diagnoseNumber(fake('mult-word', {}), 4923, 5017)).toBeNull();
    });
});

// wrong answers of every kind a child makes, built from the right one
const mutations = (want: number): number[] => {
    const out = new Set<number>([want * 10, Math.floor(want / 10), want + 1, want - 1, want + 10, want - 10, want + 100]);
    const s = String(want);
    if (s.length >= 3) out.add(Number(s[0] + s[2] + s[1] + s.slice(3)));
    return Array.from(out).filter(x => x >= 0 && x !== want);
};

describe('what went wrong: every task type, every kind of wrong answer', () => {
    for (const skill of ALL_SKILLS) test(skill, () => {
        let named = 0;
        for (let seed = 1; seed <= 150; seed++) {
            const p = makeProblem(skill, makeRng(seed * 13 + 1));
            const a = p.answer;
            // the right answer is never diagnosed
            const right: Given = a.kind === 'number' ? { value: a.value } : a.kind === 'remainder' ? { q: a.q, r: a.r } : a.kind === 'choice' ? { choice: a.correct } : a.kind === 'multi' ? { choices: a.correct } : a.kind === 'word' ? { text: a.word } : { blanks: a.values };
            expect(sameAnswer(a, right)).toBe(true);
            expect(diagnose(p, right)).toBeNull();
            const wrongs: Given[] = a.kind === 'number' ? mutations(a.value).map(value => ({ value }))
                : a.kind === 'remainder' ? [{ q: a.q, r: Number(p.data.divisor) }, { q: a.q + 1, r: a.r }, { q: a.q, r: a.r + 1 }, ...mutations(a.q).map(q => ({ q, r: a.r }))]
                    : a.kind === 'choice' ? a.options.map((_, i) => ({ choice: i })).filter(g => g.choice !== a.correct)
                        : a.kind === 'multi' ? [{ choices: a.correct.slice(1) }, { choices: [...a.correct, a.options.findIndex((_, i) => !a.correct.includes(i))] }]
                        : a.kind === 'word' ? [{ text: a.word.slice(0, -1) }, { text: 'gravity' }, { text: 'rotation' }, { text: 'xyz' }]
                            : a.values.flatMap((v, i) => mutations(v).slice(0, 3).map(x => ({ blanks: a.values.map((y, k) => (k === i ? x : y)) })));
            for (const g of wrongs) {
                if (sameAnswer(a, g)) continue;
                const d = diagnose(p, g);
                if (!d) continue;
                named++;
                clean(d, `${p.id} ${JSON.stringify(g)}`);
                // a misread factor is only claimed when it is true
                const m = d.en.match(/multiplied by (\d), not by (\d): ([\d,]+) × \d is ([\d,]+)/);
                if (m) expect(num(m[3]) * Number(m[1])).toBe(num(m[4]));
                // a worksheet diagnosis talks about a box that is really wrong
                if (a.kind === 'fill') expect(fillMarks(a, g.blanks ?? []).some(x => !x)).toBe(true);
            }
        }
        // numeric task types get explanations for most of these mistakes
        // (text-only answers have no numbers to compare: science ideas, comparison, word-problem plans, division checks)
        if (!['motion-ideas', 'forces', 'compare', 'word-steps', 'div-check', 'sci-words'].includes(skill)) expect(named).toBeGreaterThan(50);
    });
});

describe('mistakes come back in practice', () => {
    test('how often: the longer the list, the more often, never more than every 3rd task', () => {
        expect([0, 1, 3, 4, 10, 11, 60].map(reworkEvery)).toEqual([Infinity, 5, 5, 4, 4, 3, 3]);
        let s = newState();
        expect(reworkDue(s, 0)).toBe(false);
        expect(reworkDue(s, 2)).toBe(false);
        s = { ...s, sinceRework: 4 };
        expect(reworkDue(s, 2)).toBe(true);
        expect(reworkDue(startedRework(s), 2)).toBe(false);
    });
    test('the same task wrong twice counts twice and comes first; the raw answer is kept for the diagnosis', () => {
        const rng = makeRng(4);
        let s = { ...newState(), homeworkFixed: ['all'] };
        const p1 = makeProblem('div-3d', rng), p2 = makeProblem('round', rng);
        s = logMistake(s, p1, '1', 10, { value: 1 });
        s = logMistake(s, p2, '2', 20, { value: 2 });
        s = logMistake(s, p2, '3', 30, { value: 3 });
        expect(s.mistakeLog.map(e => [e.problem.id, e.times, e.t, e.given])).toEqual([[p1.id, 1, 10, '1'], [p2.id, 2, 20, '3']]);
        const appItems = reworkQueue(['c4', 'd3', 'd8', 'd5', 'd2', 'f10', 'a1', 'q10', 'b8', 'h2', 'q17b', 'q2', 'q19', 'q7', 'q5b', 'q8', 'q15', 'p65'], s.mistakeLog);
        expect(appItems.map(r => (r.from === 'app' ? r.e.problem.id : r.m.id))).toEqual([p2.id, p1.id]);
        s = missedRework(s, appItems[1]);
        expect(s.mistakeLog.find(e => e.problem.id === p1.id)?.times).toBe(2);
        // the review page names what went wrong when the pattern is clear
        const lost = makeProblem('mult-tens', makeRng(9), 'plain');
        if (lost.answer.kind !== 'number') throw new Error('number');
        const th = reworkTheory({ from: 'app', e: { t: 1, problem: lost, given: String(lost.answer.value / 10), raw: { value: lost.answer.value / 10 } } });
        const warn = th.sections.find(x => x.kind === 'warn');
        expect(warn && 'body' in warn && Array.isArray(warn.body) ? warn.body.map(b => b.en).join(' ') : '').toMatch(/What went wrong: A zero got lost/);
    });
    test('a simulated week: mistakes come back at the planned rate and the list shrinks when she gets them right', () => {
        const rng = makeRng(77);
        let s = newState();
        let rounds = 0, normal = 0, maxGap = 0, gap = 0;
        const day = '2026-10-20';
        for (let i = 0; i < 300; i++) {
            const queue = reworkQueue(s.homeworkFixed, s.mistakeLog);
            if (queue.length && reworkDue(s, queue.length)) {
                // the same rule as the app: one round of the first mistake, then back to practice
                rounds++; maxGap = Math.max(maxGap, gap); gap = 0;
                s = startedRework(s);
                const item = queue[0];
                const kind = item.from === 'homework' ? item.m.kind : kindOf(item.e.problem);
                const p = nextProblem(s, rng, reworkSkill(item), { kind, day });
                const ok = rng() < 0.8;
                s = applyAnswer(s, p, ok, { firstTry: true, hint: false, sec: 20, day }).state;
                s = ok ? fixRework(s, item) : missedRework(s, item);
                continue;
            }
            normal++;
            // the gap only counts while mistakes are waiting
            gap = queue.length ? gap + 1 : 0;
            const p = nextProblem(s, rng, undefined, { day });
            const ok = rng() < 0.75;
            s = applyAnswer(s, p, ok, { firstTry: true, hint: false, sec: 20, day }).state;
            if (!ok) s = logMistake(s, p, 'x', i, { value: -1 });
        }
        // at most every 3rd task is an old mistake, and they never stop coming back while some wait
        expect(rounds / (rounds + normal)).toBeLessThanOrEqual(1 / 3 + 0.01);
        expect(rounds).toBeGreaterThan(60);
        expect(maxGap).toBeLessThanOrEqual(4);
        // every homework mistake got fixed along the way
        expect(s.homeworkFixed.length).toBe(18);
        const left = reworkQueue(s.homeworkFixed, s.mistakeLog).length;
        expect(left).toBeLessThan(25);
    });
});

describe('a diagnosis never breaks the review', () => {
    test('a task the diagnosis does not expect gives no diagnosis instead of a crash', () => {
        // a word task without its list of accepted spellings: diagnose itself throws on it
        const broken: Problem = { ...fake('forces', {}), answer: { kind: 'word', word: 'gravity' } as unknown as Problem['answer'] };
        expect(() => diagnose(broken, { text: 'gravaty' })).toThrow();
        const quiet = spyOn(console, 'error').mockImplementation(() => {});
        expect(safeDiagnose(broken, { text: 'gravaty' })).toBeNull();
        expect(quiet).toHaveBeenCalledTimes(1);
        quiet.mockRestore();
    });
    test('a normal task gets the same diagnosis as before', () => {
        const p: Problem = { ...fake('mult-tens', { m: 8, b: 70 }), answer: { kind: 'number', value: 560 } };
        expect(safeDiagnose(p, { value: 56 })).toEqual(diagnose(p, { value: 56 }));
        expect(safeDiagnose(p, { value: 56 })?.en).toContain('zero');
        expect(safeDiagnose(p, { value: 560 })).toBeNull();
    });
});

describe('what went wrong: the Standard Algorithm column is read as one number', () => {
    const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
    const column = (p: Problem) => p.answer as Extract<Problem['answer'], { layout: 'column' }>;
    test('69 × 7 with 6 in the hundreds box: the hundreds digit is wrong, not the ones', () => {
        const p = makeProblem('mult-standard', makeRng(1));
        expect(p.id).toBe('mult-standard:7x69');
        const a = column(p), blanks = [...a.values];
        blanks[a.digits[2].b] = 6;
        const d = diagnose(p, { blanks });
        expect(d?.en).toContain('Only the hundreds digit is wrong: 6 instead of 4');
        expect(d?.ru).toContain('сотен');
        expect(d?.en).not.toContain('ones');
    });
    test('every digit box is named by its own place; a wrong carry alone gets no guess', () => {
        let named = 0;
        for (let seed = 1; seed <= 300; seed++) {
            const p = makeProblem('mult-standard', makeRng(seed));
            const a = column(p);
            a.digits.forEach((box, k) => {
                for (const delta of [1, 2, 9]) {
                    const blanks = [...a.values];
                    blanks[box.b] = (blanks[box.b] + delta) % 10;
                    const d = diagnose(p, { blanks });
                    const m = d?.en.match(/Only the ([a-z ]+) digit/);
                    if (m) { named++; expect(m[1]).toBe(PLACE[a.digits[k].col]); }
                    if (d) clean(d, `${p.id} ${JSON.stringify(blanks)}`);
                }
            });
            a.carries.forEach(c => {
                const blanks = [...a.values];
                blanks[c.b] += 1;
                expect(diagnose(p, { blanks })).toBeNull();
            });
        }
        expect(named).toBeGreaterThan(300);
    });
    test('a number longer than the place names gets no place guess instead of a crash', () => {
        const p = fake('div-4d', {});
        expect(diagnoseNumber(p, 1234567, 2234567)).toBeNull();
        expect(diagnoseNumber(p, 123456, 223456)?.en).toContain('hundred thousands');
    });
});
