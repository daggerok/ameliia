import { type Lang, type Problem, type Rng, type SkillId, type Topic, SKILLS_OF, TOPIC_OF, TOPIC_TARGET, pick, shuffle } from './core';
import { makeFreshProblem } from './index';

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
    skills: Record<SkillId, SkillStat>;
    recent: string[];                     // ids of recent tasks, never repeated
    history: HistoryItem[];
    tests: TestResult[];
    painting: { index: number; filled: number; done: number[] };
    chaptersRead: number[];
    lastLoveAt: number;
    testDate: string;                     // YYYY-MM-DD of the next school test, shown as a countdown
};

export const ALL_SKILLS = Object.keys(TOPIC_OF) as SkillId[];

const emptyStat = (): SkillStat => ({ seen: 0, correct: 0, rightStreak: 0, needsTheory: false, reviewIn: 0, reviewPending: false, theoryReads: 0, quizPasses: 0, quizFails: 0 });

export const newState = (): GameState => ({
    version: 1, lang: 'en', theme: 'system', sound: true,
    stars: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0,
    time: { division: 0, science: 0, estimation: 0 },
    daily: {},
    skills: Object.fromEntries(ALL_SKILLS.map(s => [s, emptyStat()])) as Record<SkillId, SkillStat>,
    recent: [], history: [], tests: [],
    painting: { index: 0, filled: 0, done: [] },
    chaptersRead: [], lastLoveAt: 0,
    testDate: '2026-10-23',
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
    return s;
};

// Ladders: a skill opens after 2 correct answers in the one before it (motion ideas are open from the start)
export const LADDER: Record<Topic, SkillId[]> = {
    division: ['div-facts', 'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word', 'div-check'],
    science: ['speed-basic', 'speed-find', 'speed-units', 'speed-trip'],
    estimation: ['round', 'est-sum', 'est-product', 'multiply'],
};

export const unlocked = (state: GameState, topic: Topic): SkillId[] => {
    const ladder = LADDER[topic];
    const open: SkillId[] = [];
    for (let i = 0; i < ladder.length; i++) {
        if (i === 0 || state.skills[ladder[i - 1]].correct >= 2 || state.skills[ladder[i]].seen > 0) open.push(ladder[i]);
        else break;
    }
    if (topic === 'science') open.push('motion-ideas');
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
    const newest = open[open.length - (topic === 'science' ? 2 : 1)];
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

export const nextProblem = (state: GameState, rng: Rng, skill?: SkillId): Problem =>
    makeFreshProblem(skill ?? nextSkill(state, rng), rng, new Set(state.recent));

const remember = (state: GameState, id: string) => {
    state.recent = [...state.recent.filter(x => x !== id), id].slice(-400);
};

export const starsFor = (firstTry: boolean, hint: boolean) => (firstTry ? (hint ? 2 : 3) : 1);

// Pure update after an answer; returns how many stars were earned
export const applyAnswer = (prev: GameState, p: Problem, ok: boolean, opts: { firstTry: boolean; hint: boolean; sec: number }): { state: GameState; stars: number } => {
    const state: GameState = structuredClone(prev);
    const st = state.skills[p.skill];
    if (st.reviewPending && st.reviewIn === 0) st.reviewPending = false;
    st.seen++;
    state.answered++;
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

// Practice test like the one at school: 12 tasks, half division, a quarter motion, a quarter rounding and estimating
export const TEST_PLAN: SkillId[] = [
    'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word',
    'speed-basic', 'speed-trip', 'motion-ideas',
    'round', 'est-product', 'multiply',
];

export const buildTest = (state: GameState, rng: Rng): Problem[] => {
    const seen = new Set(state.recent);
    const out: Problem[] = [];
    for (const s of shuffle(rng, TEST_PLAN)) {
        const p = makeFreshProblem(s, rng, seen);
        seen.add(p.id);
        out.push(p);
    }
    return out;
};

export const applyTest = (prev: GameState, problems: Problem[], results: boolean[], sec: number): GameState => {
    const state = structuredClone(prev);
    const wrong = problems.filter((_, i) => !results[i]).map(p => p.skill);
    problems.forEach(p => remember(state, p.id));
    // a mistake in the test sends that skill to theory and quiz next time it shows up
    wrong.forEach(s => { state.skills[s].needsTheory = true; state.skills[s].rightStreak = 0; });
    const score = results.filter(Boolean).length;
    state.tests = [...state.tests, { t: Date.now(), score, total: problems.length, sec: Math.round(sec), wrong }].slice(-50);
    state.stars += score;
    return state;
};

export const grade = (score: number, total: number) => {
    const p = total ? score / total : 0;
    return p >= 0.9 ? 'A' : p >= 0.8 ? 'B' : p >= 0.7 ? 'C' : p >= 0.6 ? 'D' : 'F';
};

export const skillsOf = (topic: Topic) => SKILLS_OF[topic];
