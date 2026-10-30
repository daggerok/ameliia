/// <reference lib="esnext" />
import { type Given, type L10n, type Lang, type Problem, type Rng, type SkillId, type Topic, L, SKILLS_OF, TOPIC_OF, TOPIC_TARGET, pick, shuffle } from './core';
import { forceKind } from './forces';
import { makeFreshProblem } from '.';
import { type LoggedMistake, type ReworkItem, reworkId } from './mistakes';
import { IDEA_KIND } from './science';
import { answerText } from './theory';
import { KINDS_4_2 } from './topic4';
import { factKey, factWeight, makeFact, makeFacts, pickFact } from './facts';
import { KINDS_4_5 } from './topic4area';
import { KINDS_4_4 } from './topic4arr';
import { KINDS_4_3 } from './topic4est';

export type SkillStat = {
    seen: number; correct: number; rightStreak: number;
    needsTheory: boolean;   // failed: theory + quiz come first
    reviewIn: number;       // > 0: comes back after that many other tasks
    reviewPending: boolean; // passed the quiz, one more task later proves it stuck
    theoryReads: number; quizPasses: number; quizFails: number;
    // spaced review: a right answer on or after the due day raises the level by one and sets the next due day
    // that many days later (1, 2, 3, 4 ... days: an arithmetic ladder); a wrong answer drops the level to 0 and makes it due today
    level: number;
    dueOn: string;          // YYYY-MM-DD of the next review, '' until the first right answer
    bumpedOn: string;       // the day the level was last raised, so the day's goal keeps the row after she did it
};

// where a task came from: free play, the homework button, the rework of a mistake or a practice test
export type HistoryFrom = 'play' | 'homework' | 'rework' | 'test';
export type HistoryItem = {
    t: number; skill: SkillId; ok: boolean; firstTry: boolean; hint: boolean; sec: number;
    // since 2026-10-26 the task itself, so Progress shows what was asked, what she wrote and the right answer (older items carry none)
    id?: string; kind?: string; from?: HistoryFrom; prompt?: L10n; given?: L10n; answer?: L10n;
};
// the log keeps this many tasks (about three weeks of practice)
export const HISTORY_MAX = 1000;
export type TestResult = { t: number; score: number; total: number; sec: number; wrong: SkillId[] };
// One opening of a theory page (owner, 2026-10-29): how long she read it before the quiz (sec, from opening to the start
// of the quiz), how long a full read takes (need), the least time asked before the quiz opens (min, random so she cannot
// learn it), how many times she pressed for the quiz too early, and the quiz that followed
export type TheoryRead = { t: number; skill: SkillId; mode: string; sec: number; need: number; min: number; early: number; quiz?: { score: number; of: number; passed: boolean } };

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
    sinceFact: number;                    // tasks since the last memory check of a multiplication fact
    factMiss: Record<string, number>;     // how much each fact ("7x8") still needs practice: +2 when wrong, -1 when right
    homeworkFixed: string[];              // ids of the homework mistakes she has already reworked
    sinceHint: number;                    // tasks answered since the last hint
    hintPause: number;                    // tasks without a hint before the next one (adapts to how she uses hints)
    skills: Record<SkillId, SkillStat>;
    recent: string[];                     // ids of recent tasks, never repeated
    history: HistoryItem[];
    tests: TestResult[];
    theoryLog: TheoryRead[];              // every theory read and its quiz, newest last (THEORY_LOG_MAX)
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

const emptyStat = (): SkillStat => ({ seen: 0, correct: 0, rightStreak: 0, needsTheory: false, reviewIn: 0, reviewPending: false, theoryReads: 0, quizPasses: 0, quizFails: 0, level: 0, dueOn: '', bumpedOn: '' });

export const newState = (): GameState => ({
    version: 1, lang: 'en', theme: 'system', sound: true,
    stars: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0,
    time: { division: 0, science: 0, estimation: 0 },
    daily: {},
    dailySkills: {},
    dailyKinds: {},
    mistakeLog: [],
    sinceRework: 0,
    sinceFact: 0,
    factMiss: {},
    homeworkFixed: [],
    sinceHint: HINT_PAUSE,
    hintPause: HINT_PAUSE,
    skills: Object.fromEntries(ALL_SKILLS.map(s => [s, emptyStat()])) as Record<SkillId, SkillStat>,
    recent: [], history: [], tests: [], theoryLog: [],
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
    s.sinceFact = s.sinceFact ?? 0;
    s.factMiss = s.factMiss ?? {};
    s.theoryLog = s.theoryLog ?? [];
    // an older build kept no right answers per day: rebuild them from the history, so today's progress is not lost
    if (!(raw as Partial<GameState>).dailySkills) for (const h of s.history) if (h.ok) countRight(s, dayOf(new Date(h.t)), h.skill, 1);
    return s;
};

// the day on the device clock (her iPad is on New York time), not in UTC
export const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (day: string, n: number) => { const [y, m, d] = day.split('-').map(Number); return dayOf(new Date(y, m - 1, d + n)); };

// a right answer on or after the due day moves the skill one step up the ladder; extra right answers before the day change nothing
const reviewRight = (st: SkillStat, day: string) => {
    if (st.dueOn && st.dueOn > day) return;
    st.level++;
    st.dueOn = addDays(day, st.level);
    st.bumpedOn = day;
};
const reviewWrong = (st: SkillStat, day: string) => { st.level = 0; st.dueOn = day; };

// old skills whose review day has come (a failed one is on its way through theory and quiz already)
export const reviewsDue = (state: GameState, day: string): SkillId[] => ALL_SKILLS.filter(s => { const st = state.skills[s]; return st.dueOn !== '' && st.dueOn <= day && !st.needsTheory; });

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
    if (p.skill === 'sci-words') return String(p.data.style);
    if (p.skill === 'est-product') return ({ t: 'tens', b: 'big', r: 'reasonable' } as Record<string, string>)[p.id.split(':')[1]] ?? 'all';
    if (['mult-tens', 'mult-mental', 'mult-expr', 'mult-word', 'mult-2x10', 'est-2x2', 'mult-2x2', 'dist-2x2', 'mult-facts'].includes(p.skill)) return String(p.data.style);
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
    ['sci-words', ['type', 'bank']],
];
export const DAILY_RIGHT = 30;

// Topic 4, Lesson 4-2 (Additional Practice 4-2, p. 45-46, homework of 2026-10-26): every kind of task on the two pages
export const LESSON_4_2_PLAN: [SkillId, string[]][] = [['mult-2x10', Array.from(KINDS_4_2)]];
// Topic 4, Lesson 4-3 (Additional Practice 4-3, p. 47-48, homework of 2026-10-27): every kind of task on the two pages
export const LESSON_4_3_PLAN: [SkillId, string[]][] = [['est-2x2', Array.from(KINDS_4_3)]];
// Topic 4, Lesson 4-4 (Additional Practice 4-4, p. 49-50, homework of 2026-10-28): every kind of task on the two pages
export const LESSON_4_4_PLAN: [SkillId, string[]][] = [['mult-2x2', Array.from(KINDS_4_4)]];
// Topic 4, Lesson 4-5 (Additional Practice 4-5, p. 51-52, homework of 2026-10-29): every kind of task on the two pages
export const LESSON_4_5_PLAN: [SkillId, string[]][] = [['dist-2x2', Array.from(KINDS_4_5)]];

// right answers per kind on each repeat day of a homework (owner, 2026-10-29: "daily goals include two right tasks done";
// the first day stays 3 per kind, the owner's choice of 2026-10-26)
export const AGAIN = 2;

// A homework: the kinds of tasks on its photos, the day it was given and the last day of its repeats (the test date
// of the settings when it has none). While a homework is current the daily goal is its plan: `first` right answers
// per kind on the day it was given, `again` on each later day, so the lesson comes back a few times in its week.
export type Homework = { id: string; title: L10n; sub: L10n; given: string; until?: string; first: number; again: number; plan: [SkillId, string[]][] };
export const HOMEWORKS: Homework[] = [
    {
        id: 'topic3', given: '2026-10-19', first: 1, again: 1, plan: PREP_PLAN,
        title: L('Test prep: Topic 3 and Science Chapter 2', 'К тесту: Topic 3 и наука, глава 2'),
        sub: L('Multiplying by 1-digit numbers, mental math, select all, word problems, forces and speed. Theory first, then tasks', 'Умножение на однозначное, устный счёт, «выбери все», задачи, силы и скорость. Сначала теория, потом задания'),
    },
    {
        id: 'lesson-4-2', given: '2026-10-26', until: '2026-10-30', first: 3, again: AGAIN, plan: LESSON_4_2_PLAN,
        title: L('Homework: Lesson 4-2, 2-digit numbers × multiples of 10', 'Домашка: урок 4-2, двузначные × круглые десятки'),
        sub: L('Arrays and area models, 50 × 15, a building of 30 floors, Greg and Marta, the dentist\'s boxes, which product is greater. Theory first, then tasks', 'Массивы и модели площади, 50 × 15, дом в 30 этажей, Грег и Марта, коробки стоматолога, какое произведение больше. Сначала теория, потом задания'),
    },
    {
        id: 'lesson-4-3', given: '2026-10-27', until: '2026-10-30', first: 3, again: AGAIN, plan: LESSON_4_3_PLAN,
        title: L('Homework: Lesson 4-3, estimate with rounding or compatible numbers', 'Домашка: урок 4-3, прикидка округлением или удобными числами'),
        sub: L('23 × 12 is about 25 × 10, estimate each product, the bathtub, gadgets in 4 weeks, Nathan\'s estimate, the tour guide\'s box. Theory first, then tasks', '23 × 12 - это примерно 25 × 10, прикидки произведений, ванна, гаджеты за 4 недели, прикидка Натана, рамка экскурсовода. Сначала теория, потом задания'),
    },
    {
        id: 'lesson-4-4', given: '2026-10-28', until: '2026-10-30', first: 3, again: AGAIN, plan: LESSON_4_4_PLAN,
        title: L('Homework: Lesson 4-4, arrays and partial products', 'Домашка: урок 4-4, массивы и частичные произведения'),
        sub: L('12 × 24 as four small rectangles, Barb\'s 14 weeks, Teri\'s answer, Nolan\'s store, missing partial products and factors. Theory first, then tasks', '12 × 24 как четыре маленьких прямоугольника, 14 недель Барб, ответ Тери, магазин Нолана, пропущенные частичные произведения и множители. Сначала теория, потом задания'),
    },
    {
        id: 'lesson-4-5', given: '2026-10-29', until: '2026-10-30', first: 3, again: AGAIN, plan: LESSON_4_5_PLAN,
        title: L('Homework: Lesson 4-5, area models and partial products', 'Домашка: урок 4-5, модели площади и частичные произведения'),
        sub: L('23 × 18 = (20 + 3) × (10 + 8), 21 × 51, 10 × 18, Ms. Langley\'s class, the ferry, Mr. Buckham\'s index cards, select all. Theory first, then tasks', '23 × 18 = (20 + 3) × (10 + 8), 21 × 51, 10 × 18, класс миссис Лэнгли, паром, карточки мистера Бакхэма, выбери все. Сначала теория, потом задания'),
    },
];
const lastDay = (h: Homework, state: GameState) => h.until ?? state.testDate;
// the homeworks whose week includes the day
export const activeHomework = (state: GameState, day: string): Homework[] => HOMEWORKS.filter(h => h.given <= day && day <= lastDay(h, state));
// the homework of the home screen button: the current one given last, else the last one given before the day, else the first
export const currentHomework = (state: GameState, day: string): Homework => {
    const active = activeHomework(state, day);
    if (active.length) return active[active.length - 1];
    const past = HOMEWORKS.filter(h => h.given <= day);
    return past.length ? past[past.length - 1] : HOMEWORKS[0];
};
export type PlanRow = { skill: SkillId; kind: string; need: number };
// the plan of a day: every kind of task of the current homeworks and the right answers it needs (the most when two homeworks share a kind)
export const dayPlan = (state: GameState, day: string): PlanRow[] => {
    const rows: PlanRow[] = [];
    for (const h of activeHomework(state, day)) for (const [skill, ks] of h.plan) for (const kind of ks) {
        const need = day === h.given ? h.first : h.again;
        const row = rows.find(r => r.skill === skill && r.kind === kind);
        if (row) row.need = Math.max(row.need, need); else rows.push({ skill, kind, need });
    }
    return rows;
};

export type GoalRow = { skill: SkillId; done: number; need: number; review?: boolean };
// homework: the day has a homework plan, so the rows are the goal; otherwise the goal is DAILY_RIGHT answers and the rows are the reviews due
export type Goal = { done: number; total: number; rows: GoalRow[]; homework: boolean };

export const dailyGoal = (state: GameState, day: string): Goal => {
    const got = state.dailySkills[day] ?? {};
    const plan = dayPlan(state, day);
    const kinds = state.dailyKinds[day] ?? {};
    const skills = Array.from(new Set(plan.map(r => r.skill)));
    const rows: GoalRow[] = skills.map(skill => {
        const mine = plan.filter(r => r.skill === skill);
        return { skill, need: mine.reduce((s, r) => s + r.need, 0), done: mine.reduce((s, r) => s + Math.min(r.need, kinds[`${skill}:${r.kind}`] ?? 0), 0) };
    });
    // one right answer for every old skill whose review day has come (done once she did it today); the homework covers its own skills
    for (const s of ALL_SKILLS) {
        const st = state.skills[s];
        if (skills.includes(s)) continue;
        if ((st.dueOn !== '' && st.dueOn <= day) || st.bumpedOn === day) rows.push({ skill: s, need: 1, done: st.bumpedOn === day ? 1 : 0, review: true });
    }
    if (plan.length) return { rows, done: rows.reduce((s, r) => s + r.done, 0), total: rows.reduce((s, r) => s + r.need, 0), homework: true };
    const all = Object.values(got).reduce((s, n) => s + (n ?? 0), 0);
    return { rows, done: Math.min(all, DAILY_RIGHT), total: DAILY_RIGHT, homework: false };
};

// the kinds of tasks of the plan she has not answered right enough times yet today (none without a current homework)
export const uncovered = (state: GameState, day: string): [SkillId, string][] => {
    const kinds = state.dailyKinds[day] ?? {};
    return dayPlan(state, day).filter(r => (kinds[`${r.skill}:${r.kind}`] ?? 0) < r.need).map(r => [r.skill, r.kind] as [SkillId, string]);
};

// the open kinds of the newest homework first (owner, 2026-10-27: the homework given today is the priority);
// an older homework of the same week comes when the newest one is covered for the day
export const uncoveredFirst = (state: GameState, day: string): [SkillId, string][] => {
    const open = uncovered(state, day);
    for (const h of activeHomework(state, day).slice().sort((x, y) => y.given.localeCompare(x.given))) {
        const mine = open.filter(([skill, kind]) => h.plan.some(([s, ks]) => s === skill && ks.includes(kind)));
        if (mine.length) return mine;
    }
    return open;
};

// the homework button picks a kind of task she has not covered yet today (the newest homework first); once all are done, any kind of the current homework
export const prepPicks = (state: GameState, day: string): [SkillId, string][] => {
    const open = uncoveredFirst(state, day);
    return open.length ? open : currentHomework(state, day).plan.flatMap(([skill, ks]) => ks.map(k => [skill, k] as [SkillId, string]));
};

// Ladders: a skill opens after 2 correct answers in the one before it (motion ideas and forces are open from the start)
export const OPEN_SCIENCE: SkillId[] = ['motion-ideas', 'forces', 'sci-words'];
export const LADDER: Record<Topic, SkillId[]> = {
    division: ['div-facts', 'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word', 'div-check'],
    science: ['speed-basic', 'speed-find', 'speed-units', 'speed-trip'],
    // Topic 3 test (2026-10-23): multiplying by multiples of 10, estimating products, the four strategies, mental math,
    // matching expressions and word problems; comparison and extra information (Lesson 3-8) stay early too
    estimation: ['round', 'mult-tens', 'est-product', 'compare', 'word-steps', 'mult-area', 'mult-partial', 'mult-dist', 'mult-standard',
        'mult-mental', 'mult-expr', 'mult-word', 'mult-2x10', 'est-2x2', 'mult-2x2', 'dist-2x2', 'est-sum', 'multiply'],
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

// In this order (owner, 2026-10-26): the new material first, a kind of the day's homework she has not covered yet;
// then a failed skill whose waiting time is over; then an old skill whose review day has come; then free practice,
// where the 50/25/25 share of the topics applies
export const nextSkill = (state: GameState, rng: Rng, day?: string): SkillId => {
    if (day) {
        const open = uncoveredFirst(state, day);
        if (open.length) return pick(rng, open)[0];
    }
    const due = ALL_SKILLS.filter(s => state.skills[s].needsTheory || (state.skills[s].reviewPending && state.skills[s].reviewIn === 0));
    if (due.length) return pick(rng, due);
    if (day) {
        const overdue = reviewsDue(state, day);
        if (overdue.length) return pick(rng, overdue);
    }
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
    const s = skill ?? nextSkill(state, rng, opts.day);
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
// A memory check of a multiplication fact every few tasks in Play and the homework (owner, 2026-10-29: "check here
// periodically, we are testing memory, it is not for paper"); a missed fact is picked more often until she gets it right
export const FACT_EVERY = 4;
export const factDue = (state: GameState) => state.sinceFact + 1 >= FACT_EVERY;
export const nextFact = (state: GameState, rng: Rng): Problem => {
    if (rng() < 0.2) return makeFacts(rng, 'ten');
    const [a, b] = pickFact(rng, (x, y) => factWeight(x, y, state.factMiss[factKey(x, y)] ?? 0), new Set(state.recent.slice(-10)));
    return makeFact(a, b);
};

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
export const applyAnswer = (prev: GameState, p: Problem, ok: boolean, opts: { firstTry: boolean; hint: boolean; sec: number; day?: string; given?: L10n; from?: HistoryFrom }): { state: GameState; stars: number } => {
    const state: GameState = structuredClone(prev);
    const st = state.skills[p.skill];
    if (st.reviewPending && st.reviewIn === 0) st.reviewPending = false;
    st.seen++;
    state.answered++;
    afterHintChoice(state, opts.hint);
    state.sinceRework++;
    state.sinceFact = p.skill === 'mult-facts' ? 0 : state.sinceFact + 1;
    if (p.skill === 'mult-facts' && p.data.style === 'fact') {
        const key = factKey(Number(p.data.a), Number(p.data.b)), m = (state.factMiss[key] ?? 0) + (ok ? -1 : 2);
        if (m > 0) state.factMiss[key] = m; else delete state.factMiss[key];
    }
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
        if (opts.day) { countRight(state, opts.day, p.skill, 1, kindOf(p)); reviewRight(st, opts.day); }
    } else {
        st.rightStreak = 0;
        // a missed memory fact is not sent to theory and a quiz: it just comes back more often (factMiss)
        st.needsTheory = p.skill !== 'mult-facts';
        state.streak = 0;
        if (opts.day) reviewWrong(st, opts.day);
    }
    state.history = [...state.history, { t: Date.now(), skill: p.skill, ok, firstTry: opts.firstTry, hint: opts.hint, sec: Math.round(opts.sec), id: p.id, kind: kindOf(p), from: opts.from ?? 'play', prompt: p.prompt, given: opts.given, answer: answerText(p) }].slice(-HISTORY_MAX);
    return { state, stars };
};

// The least reading time before the quiz opens: part of a full read (a theory she has read before goes faster), shifted
// at random so she never learns the exact number, never a couple of seconds and never more than a minute and a half
export const THEORY_LOG_MAX = 300;
export const minReadSec = (needSec: number, reads: number, r: number): number => {
    const again = reads > 1;
    return Math.round(Math.min(90, Math.max(again ? 15 : 20, needSec * (again ? 0.2 : 0.3) * (0.8 + 0.5 * r))));
};
export const logTheoryRead = (prev: GameState, read: TheoryRead): GameState => ({ ...prev, theoryLog: [...prev.theoryLog, read].slice(-THEORY_LOG_MAX) });
// the quiz result goes to the last read of that skill that has none yet
export const logQuizResult = (prev: GameState, skill: SkillId, score: number, of: number, passed: boolean): GameState => {
    const i = prev.theoryLog.map(r => r.skill === skill && !r.quiz).lastIndexOf(true);
    if (i < 0) return prev;
    return { ...prev, theoryLog: prev.theoryLog.map((r, k) => (k === i ? { ...r, quiz: { score, of, passed } } : r)) };
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

// Practice test like the ones at school: 6 division, 5 science (Chapter 2: speed, trips, velocity, forces, words),
// 5 of the Topic 3 assessment (multiples of 10, estimating, mental math, expressions, word problems),
// 1 of Lesson 4-2 (2-digit numbers by multiples of 10), 1 of Lesson 4-3 (estimating products), 1 of Lesson 4-4 (partial products), 1 of Lesson 4-5 (area models), plus 2 different multiplication strategies
export const TEST_PLAN: SkillId[] = [
    'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word',
    'speed-basic', 'speed-trip', 'motion-ideas', 'forces', 'sci-words',
    'mult-tens', 'est-product', 'mult-mental', 'mult-expr', 'mult-word', 'mult-2x10', 'est-2x2', 'mult-2x2', 'dist-2x2',
];

export const STRATEGIES: SkillId[] = ['mult-area', 'mult-dist', 'mult-partial', 'mult-standard'];

// The practice test (the same test as the end-of-the-day one) follows the new material: every kind of task of every homework
// of the week, each exactly once (owner, 2026-10-29: "the test must include all tasks, each task once"); on a day without
// homework the homeworks of the last week. Plus one task of every old skill due for a review that day, at most 5.
// Without a day: the old fixed mix of TEST_PLAN
export const TEST_REVIEWS = 5;
export type TestRow = { skill: SkillId; kind?: string };
export const testHomeworks = (state: GameState, day: string): Homework[] => {
    const active = activeHomework(state, day);
    if (active.length) return active;
    const last = currentHomework(state, day);
    return HOMEWORKS.filter(h => h.given <= day && lastDay(h, state) === lastDay(last, state));
};
export const testPlan = (state: GameState, day: string): TestRow[] => {
    const seen = new Set<string>();
    const hw: TestRow[] = testHomeworks(state, day).flatMap(h => h.plan.flatMap(([skill, ks]) => ks.map(kind => ({ skill, kind }))))
        .filter(r => (seen.has(`${r.skill}:${r.kind}`) ? false : (seen.add(`${r.skill}:${r.kind}`), true)));
    const reviews = reviewsDue(state, day).filter(s => !hw.some(k => k.skill === s)).slice(0, TEST_REVIEWS).map(skill => ({ skill }));
    return [...hw, ...reviews];
};

export const buildTest = (state: GameState, rng: Rng, day?: string): Problem[] => {
    const seen = new Set(state.recent);
    const out: Problem[] = [];
    const rows: TestRow[] = day ? testPlan(state, day) : [...TEST_PLAN, ...shuffle(rng, STRATEGIES).slice(0, 2)].map(skill => ({ skill }));
    for (const { skill, kind } of shuffle(rng, rows)) {
        const p = makeFreshProblem(skill, rng, seen, kind);
        seen.add(p.id);
        out.push(p);
    }
    return out;
};

export const applyTest = (prev: GameState, problems: Problem[], results: boolean[], sec: number, day?: string, given?: L10n[]): GameState => {
    const state = structuredClone(prev);
    if (day) problems.forEach((p, i) => { if (results[i]) { countRight(state, day, p.skill, 1, kindOf(p)); reviewRight(state.skills[p.skill], day); } });
    const wrong = problems.filter((_, i) => !results[i]).map(p => p.skill);
    problems.forEach(p => remember(state, p.id));
    // a mistake in the test sends that skill to theory and quiz next time it shows up, and back to the first step of the review ladder
    wrong.forEach(s => { state.skills[s].needsTheory = true; state.skills[s].rightStreak = 0; if (day) reviewWrong(state.skills[s], day); });
    const score = results.filter(Boolean).length;
    state.tests = [...state.tests, { t: Date.now(), score, total: problems.length, sec: Math.round(sec), wrong }].slice(-50);
    // every test answer goes to the log too, with the time of the whole test shared out
    const t = Date.now(), per = Math.round(sec / Math.max(1, problems.length));
    state.history = [...state.history, ...problems.map((p, i): HistoryItem => ({ t, skill: p.skill, ok: results[i], firstTry: true, hint: false, sec: per, id: p.id, kind: kindOf(p), from: 'test', prompt: p.prompt, given: given?.[i], answer: answerText(p) }))].slice(-HISTORY_MAX);
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
