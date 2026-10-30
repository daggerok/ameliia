/// <reference lib="esnext" />
// The Progress screen for Mom and Dad: what was done today, this week or in all, which kinds of tasks she solves,
// which she gets wrong and which were never asked. Pure functions over the saved state, so tests can check them.
import { type SkillId, TOPIC_OF } from './core';
import { type GameState, type HistoryItem, type TestResult, type TheoryRead, ALL_SKILLS, addDays, dayOf, dayPlan, starsFor } from './game';
import { KINDS_OF } from './kinds';

export type Period = 'today' | 'week' | 'all';
export const PERIODS: Period[] = ['today', 'week', 'all'];
export const WEEK_DAYS = 7;

// the first day of the period, '' for all
export const periodStart = (day: string, period: Period) => (period === 'today' ? day : period === 'week' ? addDays(day, -(WEEK_DAYS - 1)) : '');
export const dayOfItem = (t: number) => dayOf(new Date(t));
export const inPeriod = (t: number, day: string, period: Period) => { const d = dayOfItem(t); return d >= periodStart(day, period) && d <= day; };
export const itemsOf = (state: GameState, day: string, period: Period): HistoryItem[] => state.history.filter(h => inPeriod(h.t, day, period));
export const testsOf = (state: GameState, day: string, period: Period): TestResult[] => state.tests.filter(x => inPeriod(x.t, day, period));
export const theoryOf = (state: GameState, day: string, period: Period): TheoryRead[] => state.theoryLog.filter(x => inPeriod(x.t, day, period));

// every theory of the app with its reads and quizzes: in the period from the log, and all time from the skill counters
export type TheoryRow = { skill: SkillId; reads: number; sec: number; early: number; passed: number; failed: number; readsAll: number; passedAll: number; failedAll: number; last: number };
export const theoryRows = (state: GameState, day: string, period: Period): TheoryRow[] => {
    const log = theoryOf(state, day, period);
    return ALL_SKILLS.map(skill => {
        const mine = log.filter(x => x.skill === skill), st = state.skills[skill];
        return {
            skill, reads: mine.length,
            sec: mine.length ? Math.round(mine.reduce((s, x) => s + x.sec, 0) / mine.length) : 0,
            early: mine.reduce((s, x) => s + x.early, 0),
            passed: mine.filter(x => x.quiz?.passed).length, failed: mine.filter(x => x.quiz && !x.quiz.passed).length,
            readsAll: st.theoryReads, passedAll: st.quizPasses, failedAll: st.quizFails,
            last: mine.length ? mine[mine.length - 1].t : 0,
        };
    }).sort((a, b) => b.last - a.last || b.readsAll - a.readsAll);
};

export const starsOf = (h: HistoryItem) => (h.ok ? (h.from === 'test' ? 1 : starsFor(h.firstTry, h.hint)) : 0);

export type Summary = { minutes: number; asked: number; right: number; wrong: number; hints: number; stars: number; days: number };
export const summarize = (state: GameState, day: string, period: Period): Summary => {
    const start = periodStart(day, period);
    const days = Object.entries(state.daily).filter(([d, s]) => d >= start && d <= day && s > 0);
    const items = itemsOf(state, day, period);
    const right = items.filter(h => h.ok).length;
    return {
        minutes: Math.round(days.reduce((s, [, sec]) => s + sec, 0) / 60),
        asked: items.length, right, wrong: items.length - right,
        hints: items.filter(h => h.hint).length,
        stars: items.reduce((s, h) => s + starsOf(h), 0),
        days: days.length,
    };
};

// one kind of task of one skill: how often it was asked in the period and how it went; need and done are today's homework plan
export type KindRow = { skill: SkillId; kind: string; asked: number; right: number; wrong: number; last: string; need: number; done: number };
export type SkillRow = { skill: SkillId; asked: number; right: number; wrong: number; kinds: KindRow[]; planned: boolean; unknown: number };

const count = (items: HistoryItem[]) => {
    const right = items.filter(h => h.ok).length;
    return { asked: items.length, right, wrong: items.length - right };
};

// every skill with its kinds, in the order of the topics; a kind never asked in the period has asked 0
export const skillRows = (state: GameState, day: string, period: Period): SkillRow[] => {
    const items = itemsOf(state, day, period);
    const plan = dayPlan(state, day);
    const todayKinds = state.dailyKinds[day] ?? {};
    return ALL_SKILLS.map(skill => {
        const mine = items.filter(h => h.skill === skill);
        const kinds = KINDS_OF(skill).map((kind): KindRow => {
            const its = mine.filter(h => h.kind === kind);
            const row = plan.find(r => r.skill === skill && r.kind === kind);
            return { skill, kind, ...count(its), last: its.length ? dayOfItem(its[its.length - 1].t) : '', need: row?.need ?? 0, done: row ? Math.min(row.need, todayKinds[`${skill}:${kind}`] ?? 0) : 0 };
        });
        return { skill, ...count(mine), kinds, planned: plan.some(r => r.skill === skill), unknown: mine.filter(h => h.kind === undefined).length };
    });
};

// the skills worth a look: in today's plan, or asked in the period; homework first, then the ones with the most mistakes
export const activeSkills = (rows: SkillRow[]): SkillRow[] =>
    rows.filter(r => r.planned || r.asked > 0).sort((a, b) => Number(b.planned) - Number(a.planned) || b.wrong - a.wrong || TOPIC_OF[a.skill].localeCompare(TOPIC_OF[b.skill]));

export type DayRow = { day: string; minutes: number; asked: number; right: number; wrong: number; tests: TestResult[] };
// one row per day of the period with any activity, newest first
export const dayRows = (state: GameState, day: string, period: Period): DayRow[] => {
    const start = periodStart(day, period);
    const days = new Set<string>();
    Object.entries(state.daily).forEach(([d, s]) => { if (s > 0) days.add(d); });
    state.history.forEach(h => days.add(dayOfItem(h.t)));
    state.tests.forEach(x => days.add(dayOfItem(x.t)));
    return Array.from(days).filter(d => d >= start && d <= day).sort().reverse().map(d => {
        const items = state.history.filter(h => dayOfItem(h.t) === d);
        return { day: d, minutes: Math.round((state.daily[d] ?? 0) / 60), ...count(items), tests: state.tests.filter(x => dayOfItem(x.t) === d) };
    });
};
