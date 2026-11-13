/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, enPlural, fmt, int, multi, pick, pickStyle, ruPlural, shuffle } from './core';

// Topic 5, Lessons 5-1 and 5-2 of her class (Savvas enVision "Mental Math: Find Quotients" and "Mental Math: Estimate
// Quotients"), Additional Practice 5-1 and 5-2, pages 57-60, one homework of 2026-11-12 made of the sheets of 2026-11-11
// and 2026-11-12 (4.NBT.B.6):
// - pattern: basic fact and place value, 25 ÷ 5, 250 ÷ 5, 2,500 ÷ 5 (5-1 problems 1-4)
// - tens: divide a multiple of 10, 100 or 1,000 mentally, 4,200 ÷ 7 (5-1 problems 5-20)
// - graph: Barry's best sellers, total sales ÷ the price of one copy (5-1 problems 21-23)
// - wrong: why 1,000 ÷ 5 = 2,000 is incorrect, which division equation is NOT correct (5-1 problems 24, 27)
// - split: $2,400 earned in equal amounts from hamburgers at $3 and hot dogs at $2 (5-1 problem 25)
// - select: select all the expressions equal to 30 (5-1 problem 26)
// - estimate: estimate a quotient with compatible numbers, 174 ÷ 9 is about 180 ÷ 9 (5-2 problems 1-20)
// - story: Franny's to-do list, about how many on each page, each hour, each present (5-2 problems 21-23, 25)
// - twostep: subtract first, then estimate: Deon's bike goal, the marbles Wayne has left (5-2 problems 25, 27)
// - enough: are 35 bags of 6 enough for 187 ears of corn (5-2 problem 26)
// - bar: the bar diagram of the animals at the vet, a = 47 + 19 + 7 + 3 (5-2 problem 24)
// Her sheets showed where she thinks wrong, so the tasks lean on it: the place value of the quotient (202 ÷ 2 about 10
// instead of 100, 180 ÷ 9 = 90 instead of 20), counting who shares (3 friends on the list, she divided by 2; 4 days
// left, she divided by 2), equal amounts (she divided all of $2,400 by $3 and by $2), select all (she stopped before
// 120 ÷ 4), enough bags (35 bags of 6 hold 210 ears, she said no), skipped problems (554 ÷ 7, 92 ÷ 3)

export const KINDS_5 = ['pattern', 'tens', 'graph', 'wrong', 'split', 'select', 'estimate', 'story', 'twostep', 'enough', 'bar'] as const;
type Kind = (typeof KINDS_5)[number];

const B = (b: number): FillPart => ({ b });
type Tpl = (n: (x: number) => string) => string;
const X = (f: Tpl): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
const W = (en: Tpl, ru: Tpl): L10n => L(en(x => fmt(x, 'en')), ru(x => fmt(x, 'ru')));
const S = 'div-mental' as const;
const base = { skill: S, topic: 'estimation' as const };

// ---------- the basic fact and place value inside a quotient ----------

// a quotient that is a basic fact with zeros: 4,200 ÷ 7 = 600 is the fact 42 ÷ 7 = 6 with 2 zeros
export const splitQuotient = (a: number, d: number) => {
    let q = a / d, k = 0;
    while (q >= 10 && q % 10 === 0) { q /= 10; k++; }
    return { fact: a / 10 ** k, q, k };
};
const PLACE: [string, string, string, string, string][] = [
    ['one', 'ones', 'единица', 'единицы', 'единиц'],
    ['ten', 'tens', 'десяток', 'десятка', 'десятков'],
    ['hundred', 'hundreds', 'сотня', 'сотни', 'сотен'],
    ['thousand', 'thousands', 'тысяча', 'тысячи', 'тысяч'],
];
const placeOf = (x: number, k: number, lang: 'en' | 'ru') => {
    const [e1, e2, r1, r2, r5] = PLACE[k];
    return lang === 'en' ? `${fmt(x, 'en')} ${enPlural(x, e1, e2)}` : `${fmt(x, 'ru')} ${ruPlural(x, r1, r2, r5)}`;
};
// the steps of a ÷ d when a ÷ d is a basic fact with zeros
const factSteps = (a: number, d: number): L10n[] => {
    const { fact, q, k } = splitQuotient(a, d), Q = a / d;
    if (k === 0) return [W(n => `Basic fact: ${n(a)} ÷ ${d} = ${n(Q)}`, n => `Табличный пример: ${n(a)} ÷ ${d} = ${n(Q)}`)];
    return [
        L(`Basic fact: ${fact} ÷ ${d} = ${q}.`, `Табличный пример: ${fact} ÷ ${d} = ${q}.`),
        L(`${fmt(a, 'en')} is ${placeOf(fact, k, 'en')}. ${placeOf(fact, k, 'en')} ÷ ${d} is ${placeOf(q, k, 'en')}: ${fmt(Q, 'en')}.`,
            `${fmt(a, 'ru')} - это ${placeOf(fact, k, 'ru')}. ${placeOf(fact, k, 'ru')} ÷ ${d} - это ${placeOf(q, k, 'ru')}: ${fmt(Q, 'ru')}.`),
        W(n => `Check by multiplying: ${n(Q)} × ${d} = ${n(a)} ✓`, n => `Проверь умножением: ${n(Q)} × ${d} = ${n(a)} ✓`),
    ];
};

// ---------- compatible numbers ----------

// the compatible number of the book: for a dividend of 10 × the divisor or more, the closest multiple of 10 × the
// divisor (174 ÷ 9 -> 180, 202 ÷ 2 -> 200); for a smaller one, the closest multiple of the divisor (35 ÷ 4 -> 36)
export const compatible = (n: number, d: number) => {
    const unit = n >= 10 * d ? 10 * d : d, c = Math.round(n / unit) * unit;
    return { c, q: c / d, unit };
};
// a dividend with exactly one closest compatible number, not divisible by the divisor, so the estimate is one number;
// big ones are 100 or more (92 ÷ 3 could be 90 ÷ 3 or 93 ÷ 3, so those are left out)
const estPair = (rng: Rng, ds: number[]): { n: number; d: number } => {
    for (;;) {
        const d = pick(rng, ds);
        if (d >= 3 && rng() < 0.15) {
            const q = int(rng, 4, 9), off = (rng() < 0.5 ? -1 : 1) * int(rng, 1, Math.ceil(d / 2) - 1 || 1);
            const n = d * q + off;
            if (Math.abs(off) * 2 < d && n % d !== 0) return { n, d };
            continue;
        }
        // the quotient she got wrong most: a hundred (202 ÷ 2) and a fact with a 2-digit dividend (180 ÷ 9)
        const q = d <= 4 && rng() < 0.25 ? 10 : int(rng, 1, 9);
        const off = (rng() < 0.5 ? -1 : 1) * int(rng, 1, Math.min(5 * d - 1, 24));
        const n = 10 * d * q + off;
        if (n >= 100 && n <= 999 && n % d !== 0 && Math.abs(off) < 5 * d) return { n, d };
    }
};
const estSteps = (n: number, d: number): L10n[] => {
    const { c, q } = compatible(n, d);
    return [
        W(x => `${x(n)} is close to ${x(c)}, and ${x(c)} ÷ ${d} uses a basic fact: ${x(c)} is a compatible number.`, x => `${x(n)} близко к ${x(c)}, а ${x(c)} ÷ ${d} - это табличный пример: ${x(c)} - удобное число.`),
        ...factSteps(c, d),
        W(x => `So ${x(n)} ÷ ${d} is about ${x(q)}.`, x => `Значит ${x(n)} ÷ ${d} - это примерно ${x(q)}.`),
    ];
};
const estHint = (n: number, d: number): L10n => {
    const { unit } = compatible(n, d);
    return unit === d
        ? L(`Find a number close to ${n} that ${d} divides exactly: think of the facts of ${d}.`, `Найди число рядом с ${n}, которое делится на ${d} без остатка: вспомни таблицу на ${d}.`)
        : L(`Count by ${unit}s (${unit}, ${2 * unit}, ${3 * unit} ...) and stop at the one closest to ${n}. Then the basic fact, and keep the zero!`,
            `Считай по ${unit} (${unit}, ${2 * unit}, ${3 * unit} ...) и остановись на числе, ближайшем к ${n}. Потом табличный пример, и не теряй ноль!`);
};
const estAsk = (n: number, d: number): L10n => compatible(n, d).unit === d
    ? L(`use a compatible number close to ${n} that ${d} divides exactly`, `возьми удобное число рядом с ${n}, которое делится на ${d} без остатка`)
    : L(`use a compatible number close to ${n} that ends in 0 and divides by ${d} with a basic fact`, `возьми удобное число рядом с ${n}, которое оканчивается на 0 и делится на ${d} по таблице`);

// ---------- 5-1 problems 1-4: a pattern of basic fact and place value ----------

const makePattern = (rng: Rng): Problem => {
    const d = int(rng, 2, 9), q = int(rng, 1, 9), f = d * q, rows = [f, f * 10, f * 100];
    const lines: FillLine[] = rows.map((a, i) => ({ parts: [`${fmt(a, 'en')} ÷ ${d} = `, B(i)] }));
    return {
        ...base, id: `${S}:pattern:${f}:${d}`,
        prompt: L(`Use basic facts and patterns to divide: ${f} ÷ ${d}, ${fmt(f * 10, 'en')} ÷ ${d}, ${fmt(f * 100, 'en')} ÷ ${d}.`,
            `Используй табличные примеры и закономерность: ${f} ÷ ${d}, ${fmt(f * 10, 'ru')} ÷ ${d}, ${fmt(f * 100, 'ru')} ÷ ${d}.`),
        answer: { kind: 'fill', layout: 'lines', values: rows.map(a => a / d), lines },
        steps: [
            L(`Basic fact: ${f} ÷ ${d} = ${q}.`, `Табличный пример: ${f} ÷ ${d} = ${q}.`),
            W(n => `${n(f * 10)} is ${f} tens: ${f} tens ÷ ${d} is ${q} tens, ${n(f * 10)} ÷ ${d} = ${n(q * 10)}.`, n => `${n(f * 10)} - это ${f} ${ruPlural(f, 'десяток', 'десятка', 'десятков')}: ${f} ${ruPlural(f, 'десяток', 'десятка', 'десятков')} ÷ ${d} - это ${q} ${ruPlural(q, 'десяток', 'десятка', 'десятков')}, ${n(f * 10)} ÷ ${d} = ${n(q * 10)}.`),
            W(n => `${n(f * 100)} is ${f} hundreds: ${n(f * 100)} ÷ ${d} = ${n(q * 100)}.`, n => `${n(f * 100)} - это ${f} ${ruPlural(f, 'сотня', 'сотни', 'сотен')}: ${n(f * 100)} ÷ ${d} = ${n(q * 100)}.`),
            L('One more zero in the dividend, one more zero in the quotient.', 'На один ноль больше в делимом - на один ноль больше в частном.'),
        ],
        hint: L(`First the basic fact ${f} ÷ ${d}. Then each next number has one more zero, and so does its quotient.`, `Сначала табличный пример ${f} ÷ ${d}. В каждом следующем числе на один ноль больше - и в ответе тоже.`),
        data: { a: f, d, style: 'pattern' },
    };
};

// ---------- 5-1 problems 5-20: divide a multiple of 10, 100 or 1,000 ----------

const tensPair = (rng: Rng) => {
    const d = int(rng, 2, 9), q = int(rng, 1, 9);
    let k = int(rng, 1, 3);
    while (k > 1 && d * q * 10 ** k > 9999) k--;
    return { a: d * q * 10 ** k, d };
};
const makeTens = (rng: Rng): Problem => {
    const { a, d } = tensPair(rng);
    return {
        ...base, id: `${S}:tens:${a}:${d}`,
        prompt: L(`Use basic facts and place value to divide mentally: ${fmt(a, 'en')} ÷ ${d}`, `Раздели в уме, используй табличный пример и разряды: ${fmt(a, 'ru')} ÷ ${d}`),
        answer: { kind: 'number', value: a / d },
        steps: factSteps(a, d),
        hint: L('Hide the zeros, find the basic fact, then give the zeros back. Check: the quotient × the divisor must make the dividend.', 'Спрячь нули, найди табличный пример, потом верни нули. Проверь: частное × делитель должно дать делимое.'),
        data: { a, d, style: 'tens' },
    };
};

// ---------- 5-1 problems 21-23: Barry's best sellers ----------

const BOOKS: L10n[] = [L('Meet Maxie', '«Знакомься, Макси»'), L('America\'s National Parks', '«Национальные парки Америки»'), L('Return of the Dinosaurs', '«Возвращение динозавров»'), L('Musa the Great', '«Муса Великий»')];
const makeGraph = (rng: Rng): Problem => {
    const prices = BOOKS.map(() => int(rng, 2, 9)), copies = BOOKS.map(() => int(rng, 2, 9) * pick(rng, [10, 10, 100]));
    const totals = prices.map((p, i) => p * copies[i]), i = int(rng, 0, BOOKS.length - 1), p = prices[i], t = totals[i];
    const list = (lang: 'en' | 'ru') => BOOKS.map((b, j) => `${b[lang]} $${fmt(totals[j], lang)}`).join(', ');
    return {
        ...base, id: `${S}:graph:${totals.join('-')}:${i}`,
        prompt: L(`Barry's best sellers, total amount in sales: ${list('en')}. Barry charged $${p} for each copy of ${BOOKS[i].en}. How many copies did Barry sell?`,
            `Лучшие книги Барри, сколько всего денег за продажи: ${list('ru')}. Барри брал $${p} за каждую книгу ${BOOKS[i].ru}. Сколько книг он продал?`),
        answer: { kind: 'number', value: copies[i] },
        steps: [
            W(n => `Find the bar of ${BOOKS[i].en}: $${n(t)}. Each copy is $${p}, so divide: $${n(t)} ÷ $${p}.`, n => `Найди столбик книги ${BOOKS[i].ru}: $${n(t)}. Каждая книга стоит $${p}, значит дели: $${n(t)} ÷ $${p}.`),
            ...factSteps(t, p),
        ],
        hint: L('The bar is all the money. All the money ÷ the price of one copy = how many copies.', 'Столбик - это все деньги. Все деньги ÷ цена одной книги = сколько книг.'),
        data: { t, p, style: 'graph' },
    };
};

// ---------- 5-1 problems 24 and 27: a wrong quotient ----------

const makeWrong = (rng: Rng): Problem => {
    if (rng() < 0.5) {
        // why is 1,000 ÷ 5 = 2,000 incorrect
        const d = int(rng, 2, 9), q = int(rng, 1, 9), a = d * q * 100, Q = a / d, said = Q * 10;
        const right = W(n => `If ${n(said)} were right, ${n(said)} × ${d} would make ${n(a)}. But ${n(said)} × ${d} = ${n(said * d)}. The quotient is ${n(Q)}`,
            n => `Если бы ${n(said)} было верно, то ${n(said)} × ${d} дало бы ${n(a)}. Но ${n(said)} × ${d} = ${n(said * d)}. Частное ${n(Q)}`);
        return {
            ...base, id: `${S}:wrong:why:${a}:${d}`,
            prompt: L(`Construct Arguments: explain why the following quotient is incorrect: ${fmt(a, 'en')} ÷ ${d} = ${fmt(said, 'en')}.`, `Докажи: объясни, почему частное неверное: ${fmt(a, 'ru')} ÷ ${d} = ${fmt(said, 'ru')}.`),
            answer: choice(rng, right, [
                W(n => `It is correct: dividing by ${d} makes ${n(a)} bigger`, n => `Оно верное: деление на ${d} делает ${n(a)} больше`),
                W(n => `It should be ${n(said * d)}, because you multiply by ${d}`, n => `Должно быть ${n(said * d)}, потому что умножают на ${d}`),
                W(n => `It should be ${n(Q * 100)}: there are not enough zeros`, n => `Должно быть ${n(Q * 100)}: не хватает нулей`),
            ]),
            steps: [
                W(n => `Check by multiplying: the quotient × ${d} must make ${n(a)}. ${n(said)} × ${d} = ${n(said * d)}, too big.`, n => `Проверь умножением: частное × ${d} должно дать ${n(a)}. ${n(said)} × ${d} = ${n(said * d)}, слишком много.`),
                ...factSteps(a, d),
                L('Dividing makes a number smaller, never bigger: the quotient is less than the dividend.', 'Деление делает число меньше, а не больше: частное меньше делимого.'),
            ],
            hint: L('Multiply the quotient by the divisor. Do you get the dividend back?', 'Умножь частное на делитель. Получилось делимое?'),
            data: { a, d, variant: 'why', style: 'wrong' },
        };
    }
    // which division equation is NOT correct
    const eqs = Array.from({ length: 4 }, () => { const d = int(rng, 2, 9), q = int(rng, 1, 9), k = int(rng, 1, 2); return { a: d * q * 10 ** k, d }; });
    const bad = int(rng, 0, 3);
    // the wrong one lost a zero of the quotient, like 4,900 ÷ 7 = 70
    eqs[bad] = (() => { const d = int(rng, 3, 9), q = int(rng, 2, 9); return { a: d * q * 100, d }; })();
    const shown = eqs.map((e, i) => (i === bad ? e.a / e.d / 10 : e.a / e.d));
    const letters = ['A', 'B', 'C', 'D'];
    const list = (lang: 'en' | 'ru') => eqs.map((e, i) => `${letters[i]}) ${fmt(e.a, lang)} ÷ ${e.d} = ${fmt(shown[i], lang)}`).join('; ');
    const options = letters.map(x => L(x, x));
    return {
        ...base, id: `${S}:wrong:which:${eqs.map(e => `${e.a}-${e.d}`).join(':')}:${bad}`,
        prompt: L(`Which division equation is NOT correct? ${list('en')}`, `Какое равенство с делением НЕВЕРНОЕ? ${list('ru')}`),
        answer: { kind: 'choice', options, correct: bad },
        steps: [
            L('Check each one by multiplying: the quotient × the divisor must make the dividend.', 'Проверь каждое умножением: частное × делитель должно дать делимое.'),
            ...eqs.map((e, i) => (i === bad
                ? W(n => `${letters[i]}: ${n(shown[i])} × ${e.d} = ${n(shown[i] * e.d)}, not ${n(e.a)} ✗. The quotient lost a zero: ${n(e.a)} ÷ ${e.d} = ${n(e.a / e.d)}.`, n => `${letters[i]}: ${n(shown[i])} × ${e.d} = ${n(shown[i] * e.d)}, а не ${n(e.a)} ✗. В частном потерян ноль: ${n(e.a)} ÷ ${e.d} = ${n(e.a / e.d)}.`)
                : X(n => `${letters[i]}: ${n(shown[i])} × ${e.d} = ${n(e.a)} ✓`))),
        ],
        hint: L('Multiply back each one. The wrong one will not give its dividend.', 'Проверь каждое обратным умножением. Неверное не даст своё делимое.'),
        data: { bad, variant: 'which', style: 'wrong' },
    };
};

// ---------- 5-1 problem 25: equal amounts from two things ----------

const FOODS: [string, string, string, string][] = [
    ['hamburgers', 'a hamburger', 'гамбургеров', 'гамбургер'],
    ['hot dogs', 'a hot dog', 'хот-догов', 'хот-дог'],
    ['tacos', 'a taco', 'тако', 'тако'],
    ['pretzels', 'a pretzel', 'кренделей', 'крендель'],
    ['cookies', 'a cookie', 'печенек', 'печенька'],
];
const makeSplit = (rng: Rng): Problem => {
    const [x, y] = shuffle(rng, FOODS).slice(0, 2);
    let a = 0, b = 0;
    while (a === b) { a = int(rng, 2, 9); b = int(rng, 2, 9); }
    const s = pick(rng, [10, 20, 50, 100, 200].filter(m => a * b * m <= 4500 && a * b * m >= 100));
    const h = a * b * s, t = 2 * h, na = h / a, nb = h / b;
    const lines: FillLine[] = [
        { label: L(`${x[0][0].toUpperCase()}${x[0].slice(1)} sold`, `Продано ${x[2]}`), parts: [B(0)] },
        { label: L(`${y[0][0].toUpperCase()}${y[0].slice(1)} sold`, `Продано ${y[2]}`), parts: [B(1)] },
    ];
    return {
        ...base, id: `${S}:split:${x[0]}:${a}:${y[0]}:${b}:${t}`,
        prompt: L(`Higher Order Thinking: the band boosters collected $${fmt(t, 'en')} from the sale of ${x[0]} and ${y[0]}. The amounts earned from ${x[0]} and ${y[0]} were equal. ${x[1][0].toUpperCase()}${x[1].slice(1)} sold for $${a}, and ${y[1]} sold for $${b}. How many of each were sold?`,
            `Подумай: родительский комитет собрал $${fmt(t, 'ru')} за продажу ${x[2]} и ${y[2]}. Выручка от ${x[2]} и от ${y[2]} одинаковая. ${x[3][0].toUpperCase()}${x[3].slice(1)} стоил $${a}, ${y[3]} - $${b}. Сколько продали тех и других?`),
        answer: { kind: 'fill', layout: 'lines', values: [na, nb], lines },
        steps: [
            W(n => `"Equal amounts" means the money is split in half first: $${n(t)} ÷ 2 = $${n(h)} from each.`, n => `«Поровну» значит сначала делим деньги пополам: $${n(t)} ÷ 2 = $${n(h)} от каждого.`),
            W(n => `${x[0][0].toUpperCase()}${x[0].slice(1)}: $${n(h)} ÷ $${a} = ${n(na)}`, n => `${x[2][0].toUpperCase()}${x[2].slice(1)}: $${n(h)} ÷ $${a} = ${n(na)}`),
            W(n => `${y[0][0].toUpperCase()}${y[0].slice(1)}: $${n(h)} ÷ $${b} = ${n(nb)}`, n => `${y[2][0].toUpperCase()}${y[2].slice(1)}: $${n(h)} ÷ $${b} = ${n(nb)}`),
            W(n => `Check: ${n(na)} × $${a} + ${n(nb)} × $${b} = $${n(t)} ✓`, n => `Проверка: ${n(na)} × $${a} + ${n(nb)} × $${b} = $${n(t)} ✓`),
        ],
        hint: L(`Not $${fmt(t, 'en')} ÷ $${a}: only half of the money came from ${x[0]}. Split the money in half first.`, `Не $${fmt(t, 'ru')} ÷ $${a}: от ${x[2]} только половина денег. Сначала раздели деньги пополам.`),
        data: { t, a, b, style: 'split' },
    };
};

// ---------- 5-1 problem 26: select all the expressions equal to a number ----------

const makeSelect = (rng: Rng): Problem => {
    const t = 10 * int(rng, 2, 9), ys = shuffle(rng, [2, 3, 4, 5, 6, 7, 8, 9]);
    const nRight = int(rng, 2, 3);
    const right = ys.slice(0, nRight).map(y => ({ x: y * t, y }));
    // wrong: the quotient is 10 times bigger, or double
    const wrong = ys.slice(nRight, 5).map((y, i) => ({ x: y * t * (i % 2 === 0 ? 10 : 2), y }));
    const expr = (e: { x: number; y: number }) => L(`${fmt(e.x, 'en')} ÷ ${e.y}`, `${fmt(e.x, 'ru')} ÷ ${e.y}`);
    const all = [...right, ...wrong];
    return {
        ...base, id: `${S}:select:${t}:${all.map(e => `${e.x}-${e.y}`).join(':')}`,
        prompt: L(`Select all the expressions that are equal to ${t}.`, `Отметь все выражения, которые равны ${t}.`),
        answer: multi(rng, right.map(expr), wrong.map(expr)),
        steps: [
            L('Check every expression, all of them: do not stop when you have found two.', 'Проверь каждое выражение, все до одного: не останавливайся, когда нашла два.'),
            ...all.map(e => X(n => `${n(e.x)} ÷ ${e.y} = ${n(e.x / e.y)} ${e.x / e.y === t ? '✓' : '✗'}`)),
        ],
        hint: L(`Multiply back: ${t} × the divisor must make the dividend. Try it for every line.`, `Проверь обратным умножением: ${t} × делитель должно дать делимое. Сделай так для каждой строчки.`),
        data: { t, style: 'select' },
    };
};

// ---------- 5-2 problems 1-20: estimate a quotient ----------

const makeEstimate = (rng: Rng): Problem => {
    const { n, d } = estPair(rng, [2, 3, 4, 5, 6, 7, 8, 9]);
    return {
        ...base, id: `${S}:estimate:${n}:${d}`,
        prompt: L(`Estimate ${n} ÷ ${d}: ${estAsk(n, d).en}.`, `Прикинь ${n} ÷ ${d}: ${estAsk(n, d).ru}.`),
        answer: { kind: 'number', value: compatible(n, d).q },
        steps: estSteps(n, d), hint: estHint(n, d),
        data: { n, d, style: 'estimate' },
    };
};

// ---------- 5-2 problems 21-23: Franny's to-do list ----------

const FRIENDS: [string, string][] = [['Kate', 'Кейт'], ['Wendy', 'Венди'], ['Tia', 'Тиа'], ['Max', 'Макс'], ['Lily', 'Лили'], ['Sam', 'Сэм']];
const makeStory = (rng: Rng): Problem => {
    const ctx = pick(rng, ['presents', 'album', 'book'] as const);
    if (ctx === 'presents') {
        const { n, d } = estPair(rng, [2, 3, 4]);
        const names = shuffle(rng, FRIENDS).slice(0, d), q = compatible(n, d).q;
        const join = (lang: 0 | 1) => `${names.slice(0, -1).map(x => x[lang]).join(', ')} ${lang ? 'и' : 'and'} ${names[d - 1][lang]}`;
        return {
            ...base, id: `${S}:story:presents:${n}:${d}`,
            prompt: L(`Franny's to-do list: buy presents for ${join(0)}. Franny wants to spend an equal amount of money on the presents for her friends. If she has $${n}, about how much money can she spend on each present?`,
                `Список дел Фрэнни: купить подарки для ${join(1)}. Фрэнни хочет потратить на подарок каждой подруге одинаково. Если у неё $${n}, сколько примерно она может потратить на каждый подарок?`),
            answer: { kind: 'number', value: q },
            steps: [
                L(`Count the friends on the list: ${names.map(x => x[0]).join(', ')}. That is ${d} presents, so divide by ${d}.`, `Сосчитай подруг в списке: ${names.map(x => x[1]).join(', ')}. Это ${d} ${ruPlural(d, 'подарок', 'подарка', 'подарков')}, значит дели на ${d}.`),
                ...estSteps(n, d),
                L(`About $${q} for each present.`, `Примерно $${q} на каждый подарок.`),
            ],
            hint: L('Count the names on the list with your finger: that is the number you divide by.', 'Сосчитай имена в списке пальцем: на это число и делишь.'),
            data: { n, d, style: 'story' },
        };
    }
    const { n, d } = estPair(rng, ctx === 'album' ? [3, 4, 5, 6] : [3, 4, 5, 6, 7]);
    const q = compatible(n, d).q;
    const prompt = ctx === 'album'
        ? L(`Franny's to-do list: put ${n} pictures in a photo album. She has ${d} pages left in the album. About how many pictures can she place on each remaining page?`,
            `Список дел Фрэнни: вклеить ${n} ${ruPlural(n, 'фотографию', 'фотографии', 'фотографий')} в альбом. В альбоме осталось ${d} ${ruPlural(d, 'страница', 'страницы', 'страниц')}. Сколько примерно фотографий она может вклеить на каждую страницу?`)
        : L(`Franny's to-do list: finish reading ${n} pages of a book. Franny plans to spend ${d} hours reading. About how many pages would she need to read each hour to finish the book?`,
            `Список дел Фрэнни: дочитать ${n} ${ruPlural(n, 'страницу', 'страницы', 'страниц')} книги. Фрэнни будет читать ${d} ${ruPlural(d, 'час', 'часа', 'часов')}. Сколько примерно страниц в час ей нужно читать, чтобы закончить книгу?`);
    return {
        ...base, id: `${S}:story:${ctx}:${n}:${d}`, prompt,
        answer: { kind: 'number', value: q },
        steps: [
            ctx === 'album' ? L(`${n} pictures shared among ${d} pages: ${n} ÷ ${d}.`, `${n} ${ruPlural(n, 'фотография', 'фотографии', 'фотографий')} на ${d} ${ruPlural(d, 'страницу', 'страницы', 'страниц')} поровну: ${n} ÷ ${d}.`) : L(`${n} pages shared among ${d} hours: ${n} ÷ ${d}.`, `${n} ${ruPlural(n, 'страница', 'страницы', 'страниц')} на ${d} ${ruPlural(d, 'час', 'часа', 'часов')} поровну: ${n} ÷ ${d}.`),
            ...estSteps(n, d),
        ],
        hint: L('"About" means estimate: change the big number to a compatible number, then use a basic fact.', '«Примерно» значит прикинь: замени большое число удобным и используй табличный пример.'),
        data: { n, d, style: 'story' },
    };
};

// ---------- 5-2 problems 25 and 27: subtract first, then estimate ----------

const makeTwoStep = (rng: Rng): Problem => {
    if (rng() < 0.5) {
        // Deon's bike goal: the miles left ÷ the days left
        const { n: r, d } = estPair(rng, [3, 4, 5, 6]);
        const done = int(rng, 100, 200), goal = done + r, q = compatible(r, d).q;
        return {
            ...base, id: `${S}:twostep:bike:${goal}:${done}:${d}`,
            prompt: L(`Deon set a goal to ride his bicycle ${goal} miles in a month. He has biked ${done} miles so far. If there are ${d} days left in the month, about how many miles should Deon ride each day to reach his goal?`,
                `Деон решил проехать на велосипеде ${goal} ${ruPlural(goal, 'милю', 'мили', 'миль')} за месяц. Пока он проехал ${done} ${ruPlural(done, 'милю', 'мили', 'миль')}. До конца месяца осталось ${d} ${ruPlural(d, 'день', 'дня', 'дней')}. Сколько примерно миль в день ему нужно проезжать, чтобы выполнить цель?`),
            answer: { kind: 'number', value: q },
            steps: [
                L(`Step 1, the miles still left: ${goal} − ${done} = ${r}.`, `Шаг 1, сколько миль осталось: ${goal} − ${done} = ${r}.`),
                L(`Step 2: ${d} days are left, so divide by ${d}, not by 2.`, `Шаг 2: осталось ${d} ${ruPlural(d, 'день', 'дня', 'дней')}, значит дели на ${d}, а не на 2.`),
                ...estSteps(r, d),
                L(`About ${q} miles each day.`, `Примерно ${q} ${ruPlural(q, 'миля', 'мили', 'миль')} в день.`),
            ],
            hint: L('Two steps: first how many miles are left (subtract), then share them among the days left (divide).', 'Два шага: сначала сколько миль осталось (вычитание), потом раздели их на оставшиеся дни (деление).'),
            data: { goal, done, d, variant: 'bike', style: 'twostep' },
        };
    }
    // Wayne's marbles: about how many each friend gets, and exactly how many are left
    const { n: give, d } = estPair(rng, [3, 4]);
    const left = 10 * int(rng, 10, 30) + pick(rng, [0, 0, int(rng, 1, 9)]), has = give + left, q = compatible(give, d).q;
    const lines: FillLine[] = [
        { label: L('About how many to each friend', 'Примерно сколько каждому другу'), parts: [B(0)] },
        { label: L('Marbles left', 'Шариков осталось'), parts: [B(1)] },
    ];
    return {
        ...base, id: `${S}:twostep:marbles:${has}:${give}:${d}`,
        prompt: L(`Wayne has ${has} marbles. He gives away ${give} of the marbles equally to ${d} friends. About how many marbles will Wayne give each friend? How many marbles does Wayne have left?`,
            `У Уэйна ${has} ${ruPlural(has, 'шарик', 'шарика', 'шариков')}. Он отдаёт ${give} ${ruPlural(give, 'шарик', 'шарика', 'шариков')} поровну ${d} друзьям. Сколько примерно шариков получит каждый друг? Сколько шариков останется у Уэйна?`),
        answer: { kind: 'fill', layout: 'lines', values: [q, left], lines },
        steps: [
            L(`Each friend: ${give} ÷ ${d}, "about" means estimate.`, `Каждому другу: ${give} ÷ ${d}, «примерно» значит прикинь.`),
            ...estSteps(give, d),
            L(`Left: subtract exactly, the marbles he gave away from the marbles he had: ${has} − ${give} = ${left}.`, `Осталось: вычти точно, сколько отдал, из того, что было: ${has} − ${give} = ${left}.`),
            L(`Check: ${left} + ${give} = ${has} ✓`, `Проверка: ${left} + ${give} = ${has} ✓`),
        ],
        hint: L('Two questions: the first says "about" (estimate), the second wants the exact number left (subtract and check by adding).', 'Два вопроса: в первом «примерно» (прикидка), во втором - точно сколько осталось (вычти и проверь сложением).'),
        data: { has, give, d, variant: 'marbles', style: 'twostep' },
    };
};

// ---------- 5-2 problem 26: are there enough bags ----------

const makeEnough = (rng: Rng): Problem => {
    const { n, d: g } = estPair(rng, [4, 5, 6, 7, 8]);
    const { c, q: est } = compatible(n, g), need = Math.ceil(n / g), enough = rng() < 0.5;
    const k = enough ? Math.max(need, est) + int(rng, 2, 6) : Math.min(need, est) - int(rng, 2, 6);
    const right = enough
        ? W(x => `Yes: ${x(n)} is about ${x(c)}, ${x(c)} ÷ ${g} = ${est} bags are needed, and ${k} bags are more. Check: ${k} × ${g} = ${x(k * g)} ears`, x => `Да: ${x(n)} - это примерно ${x(c)}, нужно ${x(c)} ÷ ${g} = ${est}, а пакетов ${k}, больше. Проверка: ${k} × ${g} = ${x(k * g)}`)
        : W(x => `No: ${x(n)} is about ${x(c)}, ${x(c)} ÷ ${g} = ${est} bags are needed, and ${k} bags are fewer. Check: ${k} × ${g} = ${x(k * g)} ears`, x => `Нет: ${x(n)} - это примерно ${x(c)}, нужно ${x(c)} ÷ ${g} = ${est}, а пакетов только ${k}, меньше. Проверка: ${k} × ${g} = ${x(k * g)}`);
    return {
        ...base, id: `${S}:enough:${n}:${g}:${k}`,
        prompt: L(`Higher Order Thinking: Tessa wants to separate ${n} ears of corn into bags of ${g} ears each. She has ${k} bags. Estimate to find whether Tessa has enough bags. Explain.`,
            `Подумай: Тесса хочет разложить ${n} ${ruPlural(n, 'початок', 'початка', 'початков')} кукурузы в пакеты по ${g}. У неё ${k} ${ruPlural(k, 'пакет', 'пакета', 'пакетов')}. Прикинь, хватит ли Тессе пакетов. Объясни.`),
        answer: choice(rng, right, [
            enough ? L(`No: ${k} bags are fewer than ${n} ears`, `Нет: ${k} ${ruPlural(k, 'пакет', 'пакета', 'пакетов')} - это меньше, чем ${n} ${ruPlural(n, 'початок', 'початка', 'початков')}`) : L(`Yes: ${k} is a lot of bags`, `Да: ${k} ${ruPlural(k, 'пакет', 'пакета', 'пакетов')} - это много`),
            enough ? L(`No: ${n} ÷ ${g} is about ${est * 10} bags`, `Нет: ${n} ÷ ${g} - это примерно ${est * 10} пакетов`) : L(`Yes: ${n} ÷ ${g} is about ${Math.max(1, Math.round(est / 10))} bags`, `Да: ${n} ÷ ${g} - это примерно ${Math.max(1, Math.round(est / 10))} пакетов`),
            L('You cannot tell without dividing exactly', 'Без точного деления не узнать'),
        ]),
        steps: [
            W(x => `How many bags are needed: ${x(n)} ÷ ${g}. Estimate: ${x(n)} is close to ${x(c)}.`, x => `Сколько нужно пакетов: ${x(n)} ÷ ${g}. Прикидка: ${x(n)} близко к ${x(c)}.`),
            ...factSteps(c, g),
            enough ? L(`About ${est} bags are needed, Tessa has ${k}: enough.`, `Нужно примерно ${est} ${ruPlural(est, 'пакет', 'пакета', 'пакетов')}, у Тессы ${k}: хватит.`) : L(`About ${est} bags are needed, Tessa has only ${k}: not enough.`, `Нужно примерно ${est} ${ruPlural(est, 'пакет', 'пакета', 'пакетов')}, у Тессы только ${k}: не хватит.`),
            W(x => `Another way to check: ${k} bags × ${g} = ${x(k * g)} ears, ${enough ? 'enough for' : 'fewer than'} ${x(n)}.`, x => `Ещё одна проверка: ${k} ${ruPlural(k, 'пакет', 'пакета', 'пакетов')} × ${g} = ${x(k * g)} початков, ${enough ? 'хватит на' : 'меньше, чем'} ${x(n)}.`),
        ],
        hint: L('Find how many bags she NEEDS (divide), then compare with the bags she HAS.', 'Найди, сколько пакетов НУЖНО (дели), потом сравни с тем, сколько ЕСТЬ.'),
        data: { n, g, k, enough: enough ? 1 : 0, style: 'enough' },
    };
};

// ---------- 5-2 problem 24: a bar diagram of a total ----------

const makeBar = (rng: Rng): Problem => {
    const v = [int(rng, 30, 69), int(rng, 11, 29), int(rng, 3, 9), int(rng, 2, 6)], total = v.reduce((s, x) => s + x, 0);
    return {
        ...base, id: `${S}:bar:${v.join('-')}`,
        prompt: L(`Model with Math: the veterinarian has seen ${v[0]} dogs, ${v[1]} cats, ${v[2]} exotic birds, and ${v[3]} horses this week. In the bar diagram the whole bar is a, the parts are the animals. Find a, the total number of animals seen this week.`,
            `Моделируй: ветеринар на этой неделе принял ${v[0]} ${ruPlural(v[0], 'собаку', 'собаки', 'собак')}, ${v[1]} ${ruPlural(v[1], 'кошку', 'кошки', 'кошек')}, ${v[2]} ${ruPlural(v[2], 'экзотическую птицу', 'экзотические птицы', 'экзотических птиц')} и ${v[3]} ${ruPlural(v[3], 'лошадь', 'лошади', 'лошадей')}. На схеме вся полоска - это a, её части - животные. Найди a, сколько всего животных.`),
        answer: { kind: 'number', value: total },
        steps: [
            L('The whole bar is all the parts together: add.', 'Вся полоска - это все части вместе: складывай.'),
            L(`${v[0]} + ${v[1]} = ${v[0] + v[1]}`, `${v[0]} + ${v[1]} = ${v[0] + v[1]}`),
            L(`${v[0] + v[1]} + ${v[2]} = ${v[0] + v[1] + v[2]}`, `${v[0] + v[1]} + ${v[2]} = ${v[0] + v[1] + v[2]}`),
            L(`${v[0] + v[1] + v[2]} + ${v[3]} = ${total}, so a = ${total}.`, `${v[0] + v[1] + v[2]} + ${v[3]} = ${total}, значит a = ${total}.`),
        ],
        hint: L('Parts make the whole: add all four numbers.', 'Части составляют целое: сложи все четыре числа.'),
        data: { total, style: 'bar' },
    };
};

export const makeTopic5 = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_5, want);
    if (style === 'pattern') return makePattern(rng);
    if (style === 'tens') return makeTens(rng);
    if (style === 'graph') return makeGraph(rng);
    if (style === 'wrong') return makeWrong(rng);
    if (style === 'split') return makeSplit(rng);
    if (style === 'select') return makeSelect(rng);
    if (style === 'estimate') return makeEstimate(rng);
    if (style === 'story') return makeStory(rng);
    if (style === 'twostep') return makeTwoStep(rng);
    if (style === 'enough') return makeEnough(rng);
    return makeBar(rng);
};
