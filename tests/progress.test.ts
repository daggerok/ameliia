/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { type SkillId, makeRng } from '../src/engine/core';
import { ALL_SKILLS, HISTORY_MAX, HOMEWORKS, PREP_PLAN, addDays, applyAnswer, applyTest, buildTest, kindOf, newState, normalize } from '../src/engine/game';
import { KINDS_OF, LESSON_4_2_KINDS, kindName } from '../src/engine/kinds';
import { makeProblem } from '../src/engine';
import { activeSkills, dayRows, itemsOf, skillRows, summarize, testsOf } from '../src/engine/progress';
import { answerLine, answerText } from '../src/engine/theory';

const L = (en: string, ru: string) => ({ en, ru });
const DAY = '2026-10-27';
const at = (day: string, h = 12) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, h).getTime(); };

describe('kinds registry', () => {
    test('every kind of every homework plan has a name in both languages', () => {
        const plans = [...PREP_PLAN, ...HOMEWORKS.flatMap(h => h.plan)];
        for (const [skill, kinds] of plans) for (const kind of kinds) {
            expect(KINDS_OF(skill)).toContain(kind);
            const n = kindName(skill, kind);
            expect(n.en).not.toBe(kind);
            expect(n.ru).not.toBe(kind);
        }
        for (const kind of LESSON_4_2_KINDS) expect(KINDS_OF('mult-2x10')).toContain(kind);
    });
    test('every generated task falls into a registered kind of its skill', () => {
        const rng = makeRng(7);
        for (const skill of ALL_SKILLS) for (let i = 0; i < 60; i++) {
            const p = makeProblem(skill, rng);
            expect(KINDS_OF(skill)).toContain(kindOf(p));
        }
    });
});

describe('history with the task itself', () => {
    test('a play answer logs the task, her answer, the right answer, the kind and where it came from', () => {
        const p = makeProblem('mult-2x10', makeRng(3));
        const { state } = applyAnswer(newState(), p, false, { firstTry: true, hint: false, sec: 12, day: DAY, given: L('7', '7'), from: 'homework' });
        const h = state.history[0];
        expect(h.ok).toBe(false);
        expect(h.id).toBe(p.id);
        expect(h.kind).toBe(kindOf(p));
        expect(h.from).toBe('homework');
        expect(h.prompt).toEqual(p.prompt);
        expect(h.given).toEqual({ en: '7', ru: '7' });
        expect(h.answer).toEqual(answerText(p));
        expect(answerLine(p).en).toBe(`Answer: ${answerText(p).en}`);
    });
    test('without a source a task counts as play', () => {
        const p = makeProblem('div-2d', makeRng(4));
        expect(applyAnswer(newState(), p, true, { firstTry: true, hint: false, sec: 5 }).state.history[0].from).toBe('play');
    });
    test('a practice test puts every task in the log with her answers', () => {
        const s0 = newState();
        const problems = buildTest(s0, makeRng(11), DAY);
        const results = problems.map((_, i) => i % 2 === 0);
        const given = problems.map((_, i) => L(`g${i}`, `г${i}`));
        const s = applyTest(s0, problems, results, 300, DAY, given);
        expect(s.history.length).toBe(problems.length);
        s.history.forEach((h, i) => {
            expect(h.from).toBe('test');
            expect(h.ok).toBe(results[i]);
            expect(h.id).toBe(problems[i].id);
            expect(h.given).toEqual(given[i]);
            expect(h.sec).toBe(Math.round(300 / problems.length));
        });
    });
    test('the log keeps the newest HISTORY_MAX tasks', () => {
        let s = newState();
        const p = makeProblem('div-facts', makeRng(1));
        for (let i = 0; i < HISTORY_MAX + 5; i++) s = applyAnswer(s, p, true, { firstTry: true, hint: false, sec: 1 }).state;
        expect(s.history.length).toBe(HISTORY_MAX);
    });
    test('an old log without tasks still loads', () => {
        const raw = { ...newState(), history: [{ t: at(DAY), skill: 'forces', ok: true, firstTry: true, hint: false, sec: 9 }] };
        const s = normalize(raw);
        expect(s.history[0].prompt).toBeUndefined();
        expect(skillRows(s, DAY, 'today').find(r => r.skill === 'forces')?.unknown).toBe(1);
    });
});

describe('progress rollups', () => {
    const build = () => {
        const s = newState();
        const mk = (skill: SkillId, kind: string, day: string, ok: boolean, h: number, from: 'play' | 'test' = 'play', hint = false) => ({ t: at(day, h), skill, ok, firstTry: true, hint, sec: 10, id: `${skill}:${kind}:${h}`, kind, from, prompt: L('q', 'в'), given: L('1', '1'), answer: L('2', '2') });
        s.history = [
            mk('mult-2x10', 'array', addDays(DAY, -10), true, 9),
            mk('mult-2x10', 'array', addDays(DAY, -3), false, 9),
            mk('mult-2x10', 'product', addDays(DAY, -3), true, 10, 'play', true),
            mk('mult-2x10', 'array', DAY, true, 9),
            mk('mult-2x10', 'array', DAY, false, 10),
            mk('forces', 'gravity', DAY, true, 11, 'test'),
        ];
        s.daily = { [addDays(DAY, -10)]: 600, [addDays(DAY, -3)]: 300, [DAY]: 900 };
        s.dailyKinds = { [DAY]: { 'mult-2x10:array': 1 } };
        s.tests = [{ t: at(DAY, 11), score: 5, total: 8, sec: 240, wrong: ['forces'] }];
        return s;
    };
    test('today, the week and all time count different tasks and minutes', () => {
        const s = build();
        expect(summarize(s, DAY, 'today')).toEqual({ minutes: 15, asked: 3, right: 2, wrong: 1, hints: 0, stars: 4, days: 1 });
        expect(summarize(s, DAY, 'week')).toEqual({ minutes: 20, asked: 5, right: 3, wrong: 2, hints: 1, stars: 6, days: 2 });
        expect(summarize(s, DAY, 'all')).toEqual({ minutes: 30, asked: 6, right: 4, wrong: 2, hints: 1, stars: 9, days: 3 });
        expect(itemsOf(s, DAY, 'today').length).toBe(3);
        expect(testsOf(s, DAY, 'today').length).toBe(1);
        expect(testsOf(s, DAY, 'week').length).toBe(1);
    });
    test('a skill expands into its kinds: asked, right, wrong, never asked, and the homework need of the day', () => {
        const s = build();
        const rows = skillRows(s, DAY, 'today');
        const r = rows.find(x => x.skill === 'mult-2x10')!;
        expect(r.asked).toBe(2);
        expect(r.planned).toBe(true);
        const array = r.kinds.find(k => k.kind === 'array')!;
        expect(array).toMatchObject({ asked: 2, right: 1, wrong: 1, last: DAY, need: 2, done: 1 });
        const compare = r.kinds.find(k => k.kind === 'compare')!;
        expect(compare).toMatchObject({ asked: 0, right: 0, wrong: 0, last: '', need: 2, done: 0 });
        expect(r.kinds.map(k => k.kind)).toEqual(KINDS_OF('mult-2x10'));
        const week = skillRows(s, DAY, 'week').find(x => x.skill === 'mult-2x10')!;
        expect(week.kinds.find(k => k.kind === 'product')).toMatchObject({ asked: 1, right: 1, last: addDays(DAY, -3) });
    });
    test('active skills: the homework first, then the most mistakes; untouched skills are left out', () => {
        const s = build();
        const rows = activeSkills(skillRows(s, DAY, 'today'));
        expect(rows[0].skill).toBe('mult-2x10');
        expect(rows.some(r => r.skill === 'forces')).toBe(true);
        expect(rows.some(r => r.skill === 'div-facts')).toBe(false);
    });
    test('day rows: newest first, minutes, counts and the tests of that day', () => {
        const s = build();
        const rows = dayRows(s, DAY, 'week');
        expect(rows.map(r => r.day)).toEqual([DAY, addDays(DAY, -3)]);
        expect(rows[0]).toMatchObject({ minutes: 15, asked: 3, right: 2, wrong: 1 });
        expect(rows[0].tests.length).toBe(1);
        expect(dayRows(s, DAY, 'all').length).toBe(3);
    });
});
