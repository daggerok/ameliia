import { type Given, type Lang, type Problem, type Rng, type SkillId, type Topic, SKILLS_OF, TOPIC_OF, TOPIC_TARGET, pick, shuffle } from './core';
import { forceKind } from './forces';
import { makeFreshProblem } from './index';
import { type LoggedMistake, type ReworkItem, reworkId } from './mistakes';
import { IDEA_KIND } from './science';

export type SkillStat = {
    seen: number; correct: number; rightStreak: number;
    needsTheory: boolean;   // failed: theory + quiz come first
    reviewIn: number;       // > 0: comes back after that many other tasks
    reviewPending: boolean; // passed the quiz, one more task later proves it stuck
    theoryReads: number; quizPasses: number; quizFails: number;
};

export type HistoryItem = { t: number; skill: SkillId; ok: boolean; firstTry: boolean; hint: boolean; sec: number };
export type TestResult = { t: number; score: number; total: number; sec: number; wrong: SkillId[] };

export type GameState = {
    version: 1;
    lang: Lang;
    theme: 'system' | 'light' | 'dark';
    sound: boolean;
    stars: number;
    answered: number;
    correct: number;
    streak: number;
    bestStreak: number;
    time: Record<Topic, number>;          // seconds of real learning per topic
    daily: Record<string, number>;        // seconds per day (YYYY-MM-DD)
    dailySkills: Record<string, Partial<Record<SkillId, number>>>; // right answers per day and skill (tasks and practice tests)
    dailyKinds: Record<string, Record<string, number>>;            // right answers per day and kind of task, "mult-expr:partials"
    mistakeLog: LoggedMistake[];          // wrong answers in the app, waiting to be reworked
    sinceRework: number;                  // tasks since a mistake was last mixed into practice
    homeworkFixed: string[];              // ids of the homework mistakes she has already reworked
    sinceHint: number;                    // tasks answered since the last hint
    hintPause: number;                    // tasks without a hint before the next one (adapts to how she uses hints)
    skills: Record<SkillId, SkillStat>;
    recent: string[];                     // ids of recent tasks, never repeated
    history: HistoryItem[];
    tests: TestResult[];
    // filled counts stars; choosing = a picture is finished and she picks the next one
    painting: { index: number; filled: number; done: number[]; choosing: boolean };
    chaptersRead: number[];
    lastLoveAt: number;
    testDate: string;                     // YYYY-MM-DD of the next school test, shown as a countdown
    introSeen: boolean;                   // the welcome tour on a new device
    playTourSeen: boolean;                // the short tour of the task screen
    padTourSeen: boolean;                 // the tour of the notepad tools, on its first opening
};

export const ALL_SKILLS = Object.keys(TOPIC_OF) as SkillId[];

const emptyStat = (): SkillStat => ({ seen: 0, correct: 0, rightStreak: 0, needsTheory: false, reviewIn: 0, reviewPending: false, theoryReads: 0, quizPasses: 0, quizFails: 0 });

export const newState = (): GameState => ({
    version: 1, lang: 'en', theme: 'system', sound: true,
    stars: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0,
    time: { division: 0, science: 0, estimation: 0 },
    daily: {},
    dailySkills: {},
    dailyKinds: {},
    mistakeLog: [],
    sinceRework: 0,
    homeworkFixed: [],
    sinceHint: HINT_PAUSE,
    hintPause: HINT_PAUSE,
    skills: Object.fromEntries(ALL_SKILLS.map(s => [s, emptyStat()])) as Record<SkillId, SkillStat>,
    recent: [], history: [], tests: [],
    painting: { index: 0, filled: 0, done: [], choosing: false },
    chaptersRead: [], lastLoveAt: 0,
    testDate: '2026-10-23',
    introSeen: false,
    playTourSeen: false,
    padTourSeen: false,
});

// fills in anything a stored state from an older build is missing
export const normalize = (raw: unknown): GameState => {
    const base = newState();
    if (!raw || typeof raw !== 'object') return base;
    const s = { ...base, ...(raw as Partial<GameState>) };
    s.time = { ...base.time, ...(s.time ?? {}) };
    s.skills = { ...base.skills };
    const rawSkills = (raw as Partial<GameState>).skills ?? {};
    for (const k of ALL_SKILLS) s.skills[k] = { ...emptyStat(), ...(rawSkills as Record<string, SkillStat>)[k] };
    s.painting = { ...base.painting, ...(s.painting ?? {}) };
    // an older build kept no right answers per day: rebuild them from the history, so today's progress is not lost
    if (!(raw as Partial<GameState>).dailySkills) for (const h of s.history) if (h.ok) countRight(s, dayOf(new Date(h.t)), h.skill, 1);
    return s;
};

// the day on the device clock (her iPad is on New York time), not in UTC
export const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const countRight = (state: GameState, day: string, skill: SkillId, n: number, kind?: string) => {
    const d = { ...(state.dailySkills[day] ?? {}) };
    d[skill] = (d[skill] ?? 0) + n;
    state.dailySkills = { ...state.dailySkills, [day]: d };
    if (!kind) return;
    const key = `${skill}:${kind}`, k = { ...(state.dailyKinds[day] ?? {}) };
    k[key] = (k[key] ?? 0) + n;
    state.dailyKinds = { ...state.dailyKinds, [day]: k };
};

// the kind of a task inside its skill: the style of a worksheet, the study guide line of a science idea, or "all"
export const kindOf = (p: Problem): string => {
    if (p.skill === 'forces') return forceKind(p.id);
    if (p.skill === 'motion-ideas') return IDEA_KIND[Number(p.data.idea)] ?? 'all';
    if (p.skill === 'speed-trip') return p.id.split(':')[1];
    if (p.skill === 'est-product') return ({ t: 'tens', b: 'big', r: 'reasonable' } as Record<string, string>)[p.id.split(':')[1]] ?? 'all';
    if (['mult-tens', 'mult-mental', 'mult-expr', 'mult-word'].includes(p.skill)) return String(p.data.style);
    return 'all';
};

// The daily goal is a number of right answers. Up to the day of the school test it is a plan with one right answer
// for every kind of task on the homework photos for that test (2026-10-23: Topic 3 reteaching A-H and assessment 1-20,
// Science Chapter 2 study guide parts I and II, textbook p. 64-65), so a day of practice covers all of it.
export const PREP_PLAN: [SkillId, string[]][] = [
    ['mult-tens', ['plain', 'units', 'pattern', 'zero']],
    ['est-product', ['big']],
    ['mult-area', ['all']], ['mult-partial', ['all']], ['mult-dist', ['all']], ['mult-standard', ['all']],
    ['mult-mental', ['assoc', 'comp', 'story', 'how']],
    ['mult-expr', ['partials', 'expand', 'same', 'back', 'product', 'equiv', 'pick']],
    ['mult-word', ['bar', 'story', 'rows', 'area', 'bags', 'bakery', 'weeks', 'iced', 'tickets', 'reason', 'gifts']],
    ['forces', ['motion', 'reference', 'force', 'gravity', 'relative', 'kinds', 'size-direction', 'effects', 'balanced']],
    ['motion-ideas', ['speed', 'velocity', 'acceleration', 'average']],
    ['speed-basic', ['all']],
    ['speed-trip', ['map', 'total', 'trap']],
];
export const DAILY_RIGHT = 30;

export type GoalRow = { skill: SkillId; done: number; need: number };
export type Goal = { done: number; total: number; rows: GoalRow[] };

export const dailyGoal = (state: GameState, day: string): Goal => {
    const got = state.dailySkills[day] ?? {};
    if (day <= state.testDate) {
        const kinds = state.dailyKinds[day] ?? {};
        const rows = PREP_PLAN.map(([skill, ks]) => ({ skill, need: ks.length, done: ks.filter(k => kinds[`${skill}:${k}`]).length }));
        return { rows, done: rows.reduce((s, r) => s + r.done, 0), total: rows.reduce((s, r) => s + r.need, 0) };
    }
    const all = Object.values(got).reduce((s, n) => s + (n ?? 0), 0);
    return { rows: [], done: Math.min(all, DAILY_RIGHT), total: DAILY_RIGHT };
};

// the kinds of tasks of the plan she has not answered right yet today (none after the test day)
export const uncovered = (state: GameState, day: string): [SkillId, string][] => {
    if (day > state.testDate) return [];
    const kinds = state.dailyKinds[day] ?? {};
    return PREP_PLAN.flatMap(([skill, ks]) => ks.filter(k => !kinds[`${skill}:${k}`]).map(k => [skill, k] as [SkillId, string]));
};

// test prep picks a kind of task she has not covered yet today; once all are done, any kind of the plan
export const prepPicks = (state: GameState, day: string): [SkillId, string][] => {
    const open = uncovered(state, day);
    return open.length ? open : PREP_PLAN.flatMap(([skill, ks]) => ks.map(k => [skill, k] as [SkillId, string]));
};

// Ladders: a skill opens after 2 correct answers in the one before it (motion ideas and forces are open from the start)
export const OPEN_SCIENCE: SkillId[] = ['motion-ideas', 'forces'];
export const LADDER: Record<Topic, SkillId[]> = {
    division: ['div-facts', 'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word', 'div-check'],
    science: ['speed-basic', 'speed-find', 'speed-units', 'speed-trip'],
    // Topic 3 test (2026-10-23): multiplying by multiples of 10, estimating products, the four strategies, mental math,
    // matching expressions and word problems; comparison and extra information (Lesson 3-8) stay early too
    estimation: ['round', 'mult-tens', 'est-product', 'compare', 'word-steps', 'mult-area', 'mult-partial', 'mult-dist', 'mult-standard',
        'mult-mental', 'mult-expr', 'mult-word', 'est-sum', 'multiply'],
};

export const unlocked = (state: GameState, topic: Topic): SkillId[] => {
    const ladder = LADDER[topic];
    const open: SkillId[] = [];
    for (let i = 0; i < ladder.length; i++) {
        if (i === 0 || state.skills[ladder[i - 1]].correct >= 2 || state.skills[ladder[i]].seen > 0) open.push(ladder[i]);
        else break;
    }
    if (topic === 'science') open.push(...OPEN_SCIENCE);
    return open;
};

export const totalTime = (state: GameState) => state.time.division + state.time.science + state.time.estimation;

// The topic furthest below its share of learning time goes next (50% division, 25% + 25%)
export const nextTopic = (state: GameState, rng: Rng): Topic => {
    const total = totalTime(state);
    const topics = shuffle(rng, ['division', 'science', 'estimation'] as Topic[]);
    // the first minutes are balanced by the number of tasks, later by the real learning time
    const byCount = total < 300;
    const done = (t: Topic) => SKILLS_OF[t].reduce((s, k) => s + state.skills[k].seen, 0);
    const all = byCount ? topics.reduce((s, t) => s + done(t), 0) + 1 : total;
    let best = topics[0], gap = -Infinity;
    for (const t of topics) {
        const g = TOPIC_TARGET[t] * all - (byCount ? done(t) : state.time[t]);
        if (g > gap) { gap = g; best = t; }
    }
    return best;
};

export const nextSkill = (state: GameState, rng: Rng): SkillId => {
    // a failed skill comes back for review once its waiting time is over
    const due = ALL_SKILLS.filter(s => state.skills[s].needsTheory || (state.skills[s].reviewPending && state.skills[s].reviewIn === 0));
    if (due.length) return pick(rng, due);
    const topic = nextTopic(state, rng);
    const open = unlocked(state, topic);
    const newest = open[open.length - (topic === 'science' ? OPEN_SCIENCE.length + 1 : 1)];
    const weights = open.map(s => {
        const st = state.skills[s];
        const acc = st.seen ? st.correct / st.seen : 0.5;
        let w = 1 + 3 * (1 - acc);
        if (st.seen === 0) w += 2;
        if (s === newest) w += 1.5;
        if (st.rightStreak >= 4) w *= 0.5;
        return w;
    });
    let r = rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < open.length; i++) { r -= weights[i]; if (r <= 0) return open[i]; }
    return open[open.length - 1];
};

// with a day: a skill of the plan gives a kind of task not covered yet today, so any practice fills the plan;
// a kind with nothing new left (she has seen all its questions) gives way to another kind, never a repeat
export const nextProblem = (state: GameState, rng: Rng, skill?: SkillId, opts: { kind?: string; day?: string } = {}): Problem => {
    const s = skill ?? nextSkill(state, rng);
    const seen = new Set(state.recent);
    const open = opts.day ? shuffle(rng, uncovered(state, opts.day).filter(([k]) => k === s).map(([, k]) => k)) : [];
    for (const kind of [...(opts.kind ? [opts.kind] : []), ...open.filter(k => k !== opts.kind)]) {
        const p = makeFreshProblem(s, rng, seen, kind);
        if (!seen.has(p.id)) return p;
    }
    return makeFreshProblem(s, rng, seen);
};

const remember = (state: GameState, id: string) => {
    state.recent = [...state.recent.filter(x => x !== id), id].slice(-400);
};

// a wrong answer goes to the rework list once; the same task wrong again counts one more time and keeps its place;
// the list keeps the 60 newest
export const logMistake = (prev: GameState, problem: Problem, given: string, t: number, raw?: Given): GameState => {
    const old = prev.mistakeLog.find(e => e.problem.id === problem.id);
    const entry = { t: old?.t ?? t, problem, given, raw, times: (old?.times ?? 0) + 1 };
    return { ...prev, mistakeLog: [...prev.mistakeLog.filter(e => e.problem.id !== problem.id), entry].sort((a, b) => a.t - b.t).slice(-60) };
};

// Mistakes come back by themselves inside normal practice: the longer the list, the more often
// (1-3 waiting: every 5th task, 4-10: every 4th, more: every 3rd), so they never push out new topics
export const reworkEvery = (waiting: number) => (waiting <= 0 ? Infinity : waiting <= 3 ? 5 : waiting <= 10 ? 4 : 3);
export const reworkDue = (state: GameState, waiting: number) => state.sinceRework + 1 >= reworkEvery(waiting);
export const startedRework = (prev: GameState): GameState => ({ ...prev, sinceRework: 0 });

// a right answer in a rework task fixes that mistake
export const fixRework = (prev: GameState, item: ReworkItem): GameState => {
    const id = reworkId(item);
    return item.from === 'homework'
        ? { ...prev, homeworkFixed: [...prev.homeworkFixed.filter(x => x !== item.m.id), item.m.id] }
        : { ...prev, mistakeLog: prev.mistakeLog.filter(e => `app:${e.problem.id}` !== id) };
};

// Hints are rare so she learns from the theory: after a hint the next hintPause tasks have none (2 at first: one hint in three tasks).
// Taking the hint the moment it is back makes the pause longer (up to 5); doing 3 tasks on her own while it is there makes it shorter (down to 1).
export const HINT_PAUSE = 2;
export const HINT_PAUSE_MIN = 1;
export const HINT_PAUSE_MAX = 5;
export const hintOpen = (state: GameState) => state.sinceHint >= state.hintPause;

const afterHintChoice = (state: GameState, used: boolean) => {
    if (used) {
        if (state.sinceHint === state.hintPause) state.hintPause = Math.min(HINT_PAUSE_MAX, state.hintPause + 1);
        state.sinceHint = 0;
        return;
    }
    state.sinceHint++;
    // every 3 tasks she solves on her own while the hint is there shorten the pause by one; the hint stays there
    if (state.sinceHint - state.hintPause >= 3) { state.hintPause = Math.max(HINT_PAUSE_MIN, state.hintPause - 1); state.sinceHint = state.hintPause; }
};

// a wrong answer while reworking: that mistake counts one more time, so it comes back sooner
export const missedRework = (prev: GameState, item: ReworkItem): GameState => item.from === 'homework' ? prev
    : { ...prev, mistakeLog: prev.mistakeLog.map(e => (e.problem.id === item.e.problem.id ? { ...e, times: (e.times ?? 1) + 1 } : e)) };

export const starsFor = (firstTry: boolean, hint: boolean) => (firstTry ? (hint ? 2 : 3) : 1);

// Pure update after an answer; returns how many stars were earned
export const applyAnswer = (prev: GameState, p: Problem, ok: boolean, opts: { firstTry: boolean; hint: boolean; sec: number; day?: string }): { state: GameState; stars: number } => {
    const state: GameState = structuredClone(prev);
    const st = state.skills[p.skill];
    if (st.reviewPending && st.reviewIn === 0) st.reviewPending = false;
    st.seen++;
    state.answered++;
    afterHintChoice(state, opts.hint);
    state.sinceRework++;
    for (const s of ALL_SKILLS) if (state.skills[s].reviewIn > 0) state.skills[s].reviewIn--;
    remember(state, p.id);
    let stars = 0;
    if (ok) {
        st.correct++;
        st.rightStreak++;
        state.correct++;
        state.streak++;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        stars = starsFor(opts.firstTry, opts.hint);
        state.stars += stars;
        if (opts.day) countRight(state, opts.day, p.skill, 1, kindOf(p));
    } else {
        st.rightStreak = 0;
        st.needsTheory = true;
        state.streak = 0;
    }
    state.history = [...state.history, { t: Date.now(), skill: p.skill, ok, firstTry: opts.firstTry, hint: opts.hint, sec: Math.round(opts.sec) }].slice(-600);
    return { state, stars };
};

export const applyTheoryRead = (prev: GameState, skill: SkillId): GameState => {
    const state = structuredClone(prev);
    state.skills[skill].theoryReads++;
    return state;
};

export const applyQuiz = (prev: GameState, skill: SkillId, passed: boolean, ids: string[]): GameState => {
    const state = structuredClone(prev);
    const st = state.skills[skill];
    ids.forEach(id => remember(state, id));
    if (passed) {
        st.quizPasses++;
        st.needsTheory = false;
        // right after the quiz comes one fresh task of the skill, then it returns again a few tasks later
        st.reviewPending = true;
        st.reviewIn = 3;
    } else {
        st.quizFails++;
    }
    return state;
};

export const addTime = (prev: GameState, topic: Topic, sec: number, day: string): GameState => {
    const state = { ...prev, time: { ...prev.time, [topic]: prev.time[topic] + sec }, daily: { ...prev.daily, [day]: (prev.daily[day] ?? 0) + sec } };
    return state;
};

// Practice test like the ones at school: 6 division, 4 science (Chapter 2: speed, trips, velocity, forces),
// 5 of the Topic 3 assessment (multiples of 10, estimating, mental math, expressions, word problems), plus 2 different multiplication strategies
export const TEST_PLAN: SkillId[] = [
    'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word',
    'speed-basic', 'speed-trip', 'motion-ideas', 'forces',
    'mult-tens', 'est-product', 'mult-mental', 'mult-expr', 'mult-word',
];

export const STRATEGIES: SkillId[] = ['mult-area', 'mult-dist', 'mult-partial', 'mult-standard'];

export const buildTest = (state: GameState, rng: Rng): Problem[] => {
    const seen = new Set(state.recent);
    const out: Problem[] = [];
    for (const s of shuffle(rng, [...TEST_PLAN, ...shuffle(rng, STRATEGIES).slice(0, 2)])) {
        const p = makeFreshProblem(s, rng, seen);
        seen.add(p.id);
        out.push(p);
    }
    return out;
};

export const applyTest = (prev: GameState, problems: Problem[], results: boolean[], sec: number, day?: string): GameState => {
    const state = structuredClone(prev);
    if (day) problems.forEach((p, i) => { if (results[i]) countRight(state, day, p.skill, 1, kindOf(p)); });
    const wrong = problems.filter((_, i) => !results[i]).map(p => p.skill);
    problems.forEach(p => remember(state, p.id));
    // a mistake in the test sends that skill to theory and quiz next time it shows up
    wrong.forEach(s => { state.skills[s].needsTheory = true; state.skills[s].rightStreak = 0; });
    const score = results.filter(Boolean).length;
    state.tests = [...state.tests, { t: Date.now(), score, total: problems.length, sec: Math.round(sec), wrong }].slice(-50);
    state.stars += score;
    // test answers count in the Correct % too
    state.answered += problems.length;
    state.correct += score;
    return state;
};

export const grade = (score: number, total: number) => {
    const p = total ? score / total : 0;
    return p >= 0.9 ? 'A' : p >= 0.8 ? 'B' : p >= 0.7 ? 'C' : p >= 0.6 ? 'D' : 'F';
};

export const skillsOf = (topic: Topic) => SKILLS_OF[topic];

// Stars paint the current picture (perPart stars per part). A finished picture waits for her to choose the next one;
// stars earned while she chooses are kept for the next picture.
export const addPaintStars = (prev: GameState, stars: number, parts: (index: number) => number, perPart: number): { state: GameState; finished: number | null } => {
    if (!stars) return { state: prev, finished: null };
    const p = { ...prev.painting, done: [...prev.painting.done], filled: prev.painting.filled + stars };
    let finished: number | null = null;
    if (!p.choosing && p.filled >= parts(p.index) * perPart) {
        p.filled -= parts(p.index) * perPart;
        p.done.push(p.index);
        p.choosing = true;
        finished = p.index;
    }
    return { state: { ...prev, painting: p }, finished };
};

export const chooseNextPainting = (prev: GameState, index: number, parts: (index: number) => number, perPart: number): GameState => {
    const filled = Math.min(prev.painting.filled, parts(index) * perPart - 1);
    return { ...prev, painting: { ...prev.painting, index, filled, choosing: false } };
};
