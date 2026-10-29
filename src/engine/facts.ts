/// <reference lib="esnext" />
import { type L10n, type Problem, type Rng, L, fmt, int, pick, pickStyle } from './core';

// Memory checks (owner, 2026-10-29): the basic multiplication facts from 0 × 0 to 9 × 9 must live in her memory, not on
// paper, and she needs reminding how easy × 10 and × 100 are. They come back every few tasks in Play and in the homework,
// the facts she misses more often than the rest (see nextFact in game.ts).
// - fact: a × b with a and b from 0 to 9, answered from memory
// - ten: a number × 10, × 100 or × 1,000, with the zeros rule as a reminder

export const KINDS_FACTS = ['fact', 'ten'] as const;
type Kind = (typeof KINDS_FACTS)[number];

const S = 'mult-facts' as const;
const base = { skill: S, topic: 'estimation' as const };
const MEMORY = L('🧠 Memory check, from your head: no notepad, no paper.', '🧠 Проверка памяти, из головы: без блокнота и без бумаги.');

// the same fact either way round: 8 × 7 is stored as 7x8
export const factKey = (a: number, b: number) => `${Math.min(a, b)}x${Math.max(a, b)}`;

// one way to get the fact back when it does not come by itself; every equation here is checked by the tests
const trick = (a: number, b: number): L10n => {
    const [x, y] = [Math.min(a, b), Math.max(a, b)], p = a * b;
    if (x === 0) return L(`Anything times 0 is 0: ${y} × 0 = 0.`, `Любое число умножить на 0 - это 0: ${y} × 0 = 0.`);
    if (x === 1) return L(`Times 1 keeps the number: ${y} × 1 = ${y}.`, `Умножить на 1 - число не меняется: ${y} × 1 = ${y}.`);
    if (x === 2) return L(`Times 2 is a double: ${y} + ${y} = ${p}.`, `Умножить на 2 - это удвоить: ${y} + ${y} = ${p}.`);
    if (y === 9) return L(`Times 9: times 10, then take one ${x} away. ${x} × 10 = ${x * 10}, ${x * 10} − ${x} = ${p}. The digits of ${p} add up to 9.`,
        `На 9: умножь на 10 и отними одно ${x}. ${x} × 10 = ${x * 10}, ${x * 10} − ${x} = ${p}. Цифры ${p} в сумме дают 9.`);
    if (x === 5 || y === 5) {
        const o = x === 5 ? y : x;
        return L(`Times 5 is half of times 10: ${o} × 10 = ${o * 10}, half of it is ${p}.`, `На 5 - это половина от умножения на 10: ${o} × 10 = ${o * 10}, половина - ${p}.`);
    }
    if (x === y) return L(`A square, like a square of ${x} rows of ${x}: ${x} × ${x} = ${p}.`, `Квадрат, как квадрат из ${x} рядов по ${x}: ${x} × ${x} = ${p}.`);
    if (x === 7 && y === 8) return L('5, 6, 7, 8: 56 = 7 × 8.', '5, 6, 7, 8: 56 = 7 × 8.');
    return L(`From a fact you know: ${y - 1} × ${x} = ${(y - 1) * x}, one more ${x}: ${(y - 1) * x} + ${x} = ${p}.`, `От знакомого факта: ${y - 1} × ${x} = ${(y - 1) * x}, ещё одно ${x}: ${(y - 1) * x} + ${x} = ${p}.`);
};

export const makeFact = (a: number, b: number): Problem => ({
    ...base, id: `${S}:fact:${a}:${b}`,
    prompt: L(`${MEMORY.en} ${a} × ${b} = ?`, `${MEMORY.ru} ${a} × ${b} = ?`),
    answer: { kind: 'number', value: a * b },
    steps: [
        L(`${a} × ${b} = ${a * b}`, `${a} × ${b} = ${a * b}`),
        ...(a !== b ? [L(`${b} × ${a} is the same fact: ${b} × ${a} = ${a * b}.`, `${b} × ${a} - тот же факт: ${b} × ${a} = ${a * b}.`)] : []),
        trick(a, b),
        L('Say it out loud three times so it stays in your memory.', 'Скажи его вслух три раза, чтобы он остался в памяти.'),
    ],
    hint: trick(a, b),
    data: { a, b, value: a * b, style: 'fact' },
});

const ZEROS: Record<number, L10n> = {
    10: L('one zero', 'один ноль'),
    100: L('two zeros', 'два нуля'),
    1000: L('three zeros', 'три нуля'),
};

export const makeTen = (n: number, by: number): Problem => ({
    ...base, id: `${S}:ten:${n}:${by}`,
    prompt: L(`${MEMORY.en} ${n} × ${fmt(by, 'en')} = ? Remember the easy way: × 10 writes one zero at the end, × 100 two zeros, × 1,000 three.`,
        `${MEMORY.ru} ${n} × ${fmt(by, 'ru')} = ? Помни лёгкий способ: × 10 приписывает в конце один ноль, × 100 - два нуля, × 1 000 - три.`),
    answer: { kind: 'number', value: n * by },
    steps: [
        L(`${fmt(by, 'en')} has ${ZEROS[by].en}: write ${ZEROS[by].en} after ${n}.`, `В ${fmt(by, 'ru')} ${ZEROS[by].ru}: припиши ${ZEROS[by].ru} после ${n}.`),
        L(`${n} × ${fmt(by, 'en')} = ${fmt(n * by, 'en')}`, `${n} × ${fmt(by, 'ru')} = ${fmt(n * by, 'ru')}`),
        L('No multiplying at all, just zeros. That is why tens and hundreds make every big product easy.', 'Никакого умножения, только нули. Поэтому десятки и сотни делают любое большое произведение лёгким.'),
    ],
    hint: L(`Count the zeros of ${fmt(by, 'en')} and write them after ${n}.`, `Посчитай нули в ${fmt(by, 'ru')} и припиши их после ${n}.`),
    data: { a: n, b: by, value: n * by, style: 'ten' },
});

const makeTenRandom = (rng: Rng) => makeTen(int(rng, 2, 99), pick(rng, [10, 10, 100, 100, 1000]));

// a random fact, weighted like nextFact with no misses: 6 to 9 more often, 0 and 1 rarely
export const factWeight = (a: number, b: number, misses = 0) =>
    (a < 2 || b < 2 ? 0.3 : a <= 5 && b <= 5 ? 1 : 2) + (a >= 6 && b >= 6 ? 1 : 0) + 3 * misses;

export const pickFact = (rng: Rng, weight: (a: number, b: number) => number, skip: Set<string> = new Set()): [number, number] => {
    const all: [number, number, number][] = [];
    for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) if (!skip.has(`${S}:fact:${a}:${b}`)) all.push([a, b, weight(a, b)]);
    let r = rng() * all.reduce((s, x) => s + x[2], 0);
    for (const [a, b, w] of all) { r -= w; if (r <= 0) return [a, b]; }
    return [all[all.length - 1][0], all[all.length - 1][1]];
};

// one in five memory checks is a × 10 or × 100 reminder
export const makeFacts = (rng: Rng, want?: string): Problem => {
    const style: Kind = want ? pickStyle(rng, KINDS_FACTS, want) : rng() < 0.2 ? 'ten' : 'fact';
    if (style === 'ten') return makeTenRandom(rng);
    const [a, b] = pickFact(rng, (x, y) => factWeight(x, y));
    return makeFact(a, b);
};
