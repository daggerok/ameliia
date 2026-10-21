// Shared types and helpers of the math quest engine. Every text is produced in both languages at once,
// so switching the language never changes the numbers of the current task.

export type Lang = 'en' | 'ru';
export type L10n = { en: string; ru: string };
export type Topic = 'division' | 'science' | 'estimation';

export type SkillId =
    | 'div-facts' | 'div-2d' | 'div-3d' | 'div-zero' | 'div-4d' | 'div-rem' | 'div-word' | 'div-check'
    | 'speed-basic' | 'speed-find' | 'speed-trip' | 'speed-units' | 'motion-ideas'
    | 'round' | 'est-sum' | 'est-product' | 'multiply'
    | 'mult-area' | 'mult-dist' | 'mult-partial' | 'mult-standard';

export type Answer =
    | { kind: 'number'; value: number }
    | { kind: 'remainder'; q: number; r: number }
    | { kind: 'choice'; options: L10n[]; correct: number }
    | FillAnswer;

// A worksheet to fill in, like the strategy sheets at school: every blank is one number.
// A part of a line is plain text or a blank (its index in values).
// A part is math text, a word in both languages ({ t }), a blank ({ b }, the index in values)
// or an echo of a blank she already filled ({ echo }), so a number is never typed twice.
export type FillPart = string | { b: number } | { t: L10n } | { echo: number };
export type FillLine = { label?: L10n; parts: FillPart[]; note?: string };
// anyOrder: groups of blanks that may be written in any order (100 + 80 + 2 or 2 + 80 + 100)
export type FillAnswer =
    | { kind: 'fill'; layout: 'lines' | 'vertical'; values: number[]; lines: FillLine[]; anyOrder?: number[][] }
    | { kind: 'fill'; layout: 'area'; values: number[]; top: FillPart[]; left: FillPart[]; cells: number[][]; total: number };

const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

// Which boxes are right. Checked by meaning, not only by position: parts of a sum may come in any order,
// and the Area Model boxes are checked against her own top and left numbers.
export const fillMarks = (answer: FillAnswer, given: number[]): boolean[] => {
    const ok = answer.values.map((v, i) => given[i] === v);
    if (answer.layout === 'area') {
        const idx = (parts: FillPart[]) => parts.flatMap(p => (typeof p === 'object' && 'b' in p ? [p.b] : []));
        const topIdx = idx(answer.top), leftIdx = idx(answer.left);
        const topOk = sameSet(topIdx.map(i => given[i]), topIdx.map(i => answer.values[i]));
        const leftOk = sameSet(leftIdx.map(i => given[i]), leftIdx.map(i => answer.values[i]));
        if (topOk) topIdx.forEach(i => { ok[i] = true; });
        if (leftOk) leftIdx.forEach(i => { ok[i] = true; });
        const num = (p: FillPart) => (typeof p === 'string' ? Number(p) : 'b' in p ? given[p.b] : NaN);
        if (topOk && leftOk) answer.cells.forEach((row, r) => row.forEach((b, c) => { ok[b] = given[b] === num(answer.left[r]) * num(answer.top[c]); }));
        return ok;
    }
    for (const g of answer.anyOrder ?? []) if (sameSet(g.map(i => given[i]), g.map(i => answer.values[i]))) g.forEach(i => { ok[i] = true; });
    return ok;
};

export type Leg = { from: string; to: string; distance: number; time: number; speed: number; vehicle: string };

export type Visual =
    | { kind: 'longdiv'; dividend: number; divisor: number }
    | { kind: 'area'; a: number; b: number }
    | { kind: 'numberline'; value: number; low: number; high: number; place: number }
    | { kind: 'trip'; legs: Leg[]; unit: Unit }
    | { kind: 'groups'; total: number; groups: number; icon: string };

export type Unit = 'mi' | 'km';

export type Problem = {
    id: string;
    skill: SkillId;
    topic: Topic;
    prompt: L10n;
    answer: Answer;
    steps: L10n[];
    hint: L10n;
    visual?: Visual;
    // the raw numbers the answer was built from, read by the independent checker in tests
    data: Record<string, number | number[] | string>;
};

export type Rng = () => number;

// Mulberry32: small seeded generator so tests and self checks can replay a session
export const makeRng = (seed: number): Rng => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

export const int = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
export const shuffle = <T>(rng: Rng, items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

export const L = (en: string, ru: string): L10n => ({ en, ru });
export const join = (parts: L10n[], sep = ' '): L10n => L(parts.map(p => p.en).join(sep), parts.map(p => p.ru).join(sep));

// 1,234 in English, 1 234 in Russian (thin space would not render in every font, a plain space is used)
export const fmt = (n: number, lang: Lang) => {
    const s = String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '\u00a0');
    return n < 0 ? `-${s}` : s;
};
export const n2 = (n: number): L10n => L(fmt(n, 'en'), fmt(n, 'ru'));

// Russian noun forms: 1 час, 2 часа, 5 часов
export const ruPlural = (n: number, one: string, few: string, many: string) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
};
export const enPlural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const hours = (n: number): L10n => L(`${fmt(n, 'en')} ${enPlural(n, 'hour', 'hours')}`, `${fmt(n, 'ru')} ${ruPlural(n, 'час', 'часа', 'часов')}`);
export const minutes = (n: number): L10n => L(`${fmt(n, 'en')} ${enPlural(n, 'minute', 'minutes')}`, `${fmt(n, 'ru')} ${ruPlural(n, 'минута', 'минуты', 'минут')}`);
export const dist = (n: number, unit: Unit): L10n => unit === 'mi'
    ? L(`${fmt(n, 'en')} ${enPlural(n, 'mile', 'miles')}`, `${fmt(n, 'ru')} ${ruPlural(n, 'миля', 'мили', 'миль')}`)
    : L(`${fmt(n, 'en')} ${enPlural(n, 'kilometer', 'kilometers')}`, `${fmt(n, 'ru')} ${ruPlural(n, 'километр', 'километра', 'километров')}`);
export const speedUnit = (unit: Unit): L10n => unit === 'mi' ? L('miles per hour', 'миль в час') : L('kilometers per hour', 'километров в час');
export const speedShort = (n: number, unit: Unit): L10n => unit === 'mi'
    ? L(`${fmt(n, 'en')} mph`, `${fmt(n, 'ru')} миль/ч`)
    : L(`${fmt(n, 'en')} km/h`, `${fmt(n, 'ru')} км/ч`);

export const TOPIC_OF: Record<SkillId, Topic> = {
    'div-facts': 'division', 'div-2d': 'division', 'div-3d': 'division', 'div-zero': 'division', 'div-4d': 'division',
    'div-rem': 'division', 'div-word': 'division', 'div-check': 'division',
    'speed-basic': 'science', 'speed-find': 'science', 'speed-trip': 'science', 'speed-units': 'science', 'motion-ideas': 'science',
    'round': 'estimation', 'est-sum': 'estimation', 'est-product': 'estimation', 'multiply': 'estimation',
    'mult-area': 'estimation', 'mult-dist': 'estimation', 'mult-partial': 'estimation', 'mult-standard': 'estimation',
};

export const SKILLS_OF: Record<Topic, SkillId[]> = {
    division: ['div-facts', 'div-2d', 'div-3d', 'div-zero', 'div-4d', 'div-rem', 'div-word', 'div-check'],
    science: ['speed-basic', 'speed-find', 'speed-trip', 'speed-units', 'motion-ideas'],
    estimation: ['round', 'est-sum', 'est-product', 'multiply', 'mult-area', 'mult-dist', 'mult-partial', 'mult-standard'],
};

// share of learning time the owner asked for
export const TOPIC_TARGET: Record<Topic, number> = { division: 0.5, science: 0.25, estimation: 0.25 };

export const SKILL_NAME: Record<SkillId, L10n> = {
    'div-facts': L('Division facts', 'Таблица деления'),
    'div-2d': L('2-digit ÷ 1-digit', 'Двузначное ÷ однозначное'),
    'div-3d': L('3-digit ÷ 1-digit', 'Трёхзначное ÷ однозначное'),
    'div-zero': L('Zeros in the quotient', 'Нули в частном'),
    'div-4d': L('4-digit ÷ 1-digit', 'Четырёхзначное ÷ однозначное'),
    'div-rem': L('Division with remainders', 'Деление с остатком'),
    'div-word': L('Division word problems', 'Задачи на деление'),
    'div-check': L('Check division with multiplication', 'Проверка деления умножением'),
    'speed-basic': L('Average speed', 'Средняя скорость'),
    'speed-find': L('Distance, speed and time', 'Расстояние, скорость и время'),
    'speed-trip': L('Trips with many parts', 'Поездки из нескольких частей'),
    'speed-units': L('Hours and minutes', 'Часы и минуты'),
    'motion-ideas': L('Speed, velocity, acceleration', 'Скорость, направление, ускорение'),
    'round': L('Rounding', 'Округление'),
    'est-sum': L('Estimating sums and differences', 'Прикидка суммы и разности'),
    'est-product': L('Estimating products', 'Прикидка произведения'),
    'multiply': L('Multi-digit multiplication', 'Умножение многозначных чисел'),
    'mult-area': L('Strategy: Area Model', 'Способ: модель площади'),
    'mult-dist': L('Strategy: Distributive Property', 'Способ: распределительное свойство'),
    'mult-partial': L('Strategy: Partial Products', 'Способ: частичные произведения'),
    'mult-standard': L('Strategy: Standard Algorithm', 'Способ: умножение столбиком'),
};

export const TOPIC_NAME: Record<Topic, L10n> = {
    division: L('Division', 'Деление'),
    science: L('Motion and speed', 'Движение и скорость'),
    estimation: L('Rounding, estimating and multiplying', 'Округление, прикидка и умножение'),
};

export const TOPIC_ICON: Record<Topic, string> = { division: '🍪', science: '🚆', estimation: '🎯' };

export const tr = (text: L10n, lang: Lang) => text[lang];

// Each choice question keeps exactly one correct option: duplicates are dropped before shuffling
export const choice = (rng: Rng, correct: L10n, wrong: L10n[]): Answer => {
    const seen = new Set([correct.en]);
    const distinct = wrong.filter(w => (seen.has(w.en) ? false : (seen.add(w.en), true))).slice(0, 3);
    const options = shuffle(rng, [correct, ...distinct]);
    return { kind: 'choice', options, correct: options.indexOf(correct) };
};

export const sameAnswer = (answer: Answer, given: { value?: number; q?: number; r?: number; choice?: number; blanks?: number[] }) => {
    if (answer.kind === 'fill') return fillMarks(answer, given.blanks ?? []).every(Boolean);
    if (answer.kind === 'number') return given.value === answer.value;
    if (answer.kind === 'remainder') return given.q === answer.q && given.r === answer.r;
    return given.choice === answer.correct;
};
