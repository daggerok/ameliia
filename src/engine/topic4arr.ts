/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, fmt, int, pick, pickStyle, ruPlural, shuffle } from './core';
import { roundTo } from './estimation';
import { AMELIIA } from './words';

// Topic 4, Lesson 4-4 of her class (Savvas enVision "Arrays and Partial Products"),
// Additional Practice 4-4, pages 49-50, the homework of 2026-10-28 (4.NBT.B.5: multiply two 2-digit numbers with place value,
// illustrate and explain with equations, rectangular arrays and area models):
// - array: 12 × 24 as an array cut into tens and ones, four smaller rectangles, add them (Another Look, problems 1-4: 26 × 18, 23 × 23, 19 × 27, 11 × 16)
// - hours: Barb exercises 22 hours each week, how many hours in 14 weeks (problem 5)
// - reason: Teri's partial products of 4,296 × 7, is the answer reasonable (problem 6)
// - sales: 27 boxes of neon keychains at $15 and 35 boxes of pens at $10, the total sales (problem 7)
// - missing: insert the missing partial products of 18 × 32 and 47 × 26 from a box, then add (problem 8)
// - factor: insert the missing factor, 18 × __ = 918, from a box (problem 9)

export const KINDS_4_4 = ['array', 'hours', 'reason', 'sales', 'missing', 'factor'] as const;
type Kind = (typeof KINDS_4_4)[number];

const B = (b: number): FillPart => ({ b });
const X = (f: (n: (x: number) => string) => string): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
const S = 'mult-2x2' as const;
const base = { skill: S, topic: 'estimation' as const };

const tensOf = (a: number) => Math.floor(a / 10) * 10;
const onesOf = (a: number) => a % 10;
// a 2-digit number with ones, so both factors break into two real parts
const twoDigit = (rng: Rng, lo = 11, hi = 29) => {
    let x = int(rng, lo, hi);
    while (x % 10 === 0) x = int(rng, lo, hi);
    return x;
};

// the four partial products of a × b in the order of the array: tens × tens, tens × ones, ones × tens, ones × ones
export const partials = (a: number, b: number): number[] => {
    const [at, ao, bt, bo] = [tensOf(a), onesOf(a), tensOf(b), onesOf(b)];
    return [at * bt, at * bo, ao * bt, ao * bo];
};

const partialSteps = (a: number, b: number): L10n[] => {
    const [at, ao, bt, bo] = [tensOf(a), onesOf(a), tensOf(b), onesOf(b)], ps = partials(a, b);
    return [
        L(`Break both factors into tens and ones: ${a} = ${at} + ${ao}, ${b} = ${bt} + ${bo}.`, `Разбей оба множителя на десятки и единицы: ${a} = ${at} + ${ao}, ${b} = ${bt} + ${bo}.`),
        X(n => `${at} × ${bt} = ${n(ps[0])}`),
        X(n => `${at} × ${bo} = ${n(ps[1])}`),
        X(n => `${ao} × ${bt} = ${n(ps[2])}`),
        X(n => `${ao} × ${bo} = ${n(ps[3])}`),
        L(`Add the four partial products: ${ps.map(x => fmt(x, 'en')).join(' + ')} = ${fmt(a * b, 'en')}.`,
            `Сложи четыре частичных произведения: ${ps.map(x => fmt(x, 'ru')).join(' + ')} = ${fmt(a * b, 'ru')}.`),
    ];
};
const partialHint = (a: number, b: number): L10n => L(`Cut the array into tens and ones: ${tensOf(a)} and ${onesOf(a)} on the side, ${tensOf(b)} and ${onesOf(b)} on top. Find each small rectangle, then add all four.`,
    `Разрежь массив на десятки и единицы: сбоку ${tensOf(a)} и ${onesOf(a)}, сверху ${tensOf(b)} и ${onesOf(b)}. Найди каждый маленький прямоугольник, потом сложи все четыре.`);

// ---------- Another Look and problems 1-4: an array cut into four smaller rectangles ----------

const makeArray = (rng: Rng): Problem => {
    const a = twoDigit(rng), b = twoDigit(rng), ps = partials(a, b);
    return {
        ...base, id: `${S}:array:${a}:${b}`,
        prompt: L(`Find ${a} × ${b} with an array. Cut it into tens and ones: ${a} on the left, ${b} on top. Find the squares in each of the four smaller rectangles, then add them.`,
            `Найди ${a} × ${b} с помощью массива. Разрежь его на десятки и единицы: слева ${a}, сверху ${b}. Найди число клеток в каждом из четырёх маленьких прямоугольников, потом сложи их.`),
        answer: { kind: 'fill', layout: 'area', values: [tensOf(b), onesOf(b), tensOf(a), onesOf(a), ...ps, a * b], top: [B(0), B(1)], left: [B(2), B(3)], cells: [[4, 5], [6, 7]], total: 8 },
        steps: partialSteps(a, b), hint: partialHint(a, b), visual: { kind: 'area', a: b, b: a },
        data: { a, b, value: a * b, style: 'array' },
    };
};

// ---------- problem 5: equal amounts every week ----------

type Story = { text: (x: number, w: number) => L10n; unit: (n: number) => L10n };
const STORIES: Story[] = [
    { text: (x, w) => L(`Barb exercises for ${x} hours each week. How many hours does she exercise in ${w} weeks? Use an array to help multiply.`,
        `Барб занимается спортом ${x} ${ruPlural(x, 'час', 'часа', 'часов')} каждую неделю. Сколько часов она позанимается за ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}? Помоги себе массивом.`),
        unit: n => L('hours', ruPlural(n, 'час', 'часа', 'часов')) },
    { text: (x, w) => L(`${AMELIIA.en} reads ${x} pages of Harry Potter each week. How many pages does she read in ${w} weeks? Use an array to help multiply.`,
        `${AMELIIA.ru} читает ${x} ${ruPlural(x, 'страницу', 'страницы', 'страниц')} «Гарри Поттера» каждую неделю. Сколько страниц она прочитает за ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}? Помоги себе массивом.`),
        unit: n => L('pages', ruPlural(n, 'страница', 'страницы', 'страниц')) },
    { text: (x, w) => L(`Pip the capybara eats ${x} carrots each week. How many carrots does Pip eat in ${w} weeks? Use an array to help multiply.`,
        `Капибара Пип съедает ${x} ${ruPlural(x, 'морковку', 'морковки', 'морковок')} каждую неделю. Сколько морковок Пип съест за ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}? Помоги себе массивом.`),
        unit: n => L('carrots', ruPlural(n, 'морковка', 'морковки', 'морковок')) },
];

const makeHours = (rng: Rng): Problem => {
    const i = int(rng, 0, STORIES.length - 1), x = twoDigit(rng, 12, 29), w = twoDigit(rng, 11, 19), p = x * w;
    const u = STORIES[i].unit(p);
    return {
        ...base, id: `${S}:hours:${i}:${x}:${w}`,
        prompt: STORIES[i].text(x, w),
        answer: { kind: 'number', value: p },
        steps: [L(`The same amount every week: ${w} groups of ${x}, so multiply ${w} × ${x}.`, `Каждую неделю одинаково: ${w} ${ruPlural(w, 'группа', 'группы', 'групп')} по ${x}, значит умножаем ${w} × ${x}.`),
            ...partialSteps(w, x), L(`${fmt(p, 'en')} ${u.en}.`, `${fmt(p, 'ru')} ${u.ru}.`)],
        hint: L(`Equal groups: multiply. ${partialHint(w, x).en}`, `Одинаковые группы: умножай. ${partialHint(w, x).ru}`),
        visual: { kind: 'area', a: x, b: w },
        data: { a: w, b: x, value: p, style: 'hours' },
    };
};

// ---------- problem 6: is Teri's answer reasonable? ----------

const makeReason = (rng: Rng): Problem => {
    const th = int(rng, 2, 8), h = int(rng, 1, 9), t = int(rng, 1, 9), o = int(rng, 1, 9), m = int(rng, 3, 9);
    const d = 1000 * th + 100 * h + 10 * t + o, right = [o * m, 10 * t * m, 100 * h * m, 1000 * th * m];
    // Teri's slip of the book: the thousands partial product lost a zero (4,000 × 7 written as 2,800)
    const ok = rng() < 0.4, wrote = ok ? right : [right[0], right[1], right[2], right[3] / 10];
    const total = wrote.reduce((s, x) => s + x, 0), r = roundTo(d, 1000), est = r * m;
    const who = pick(rng, [{ n: L('Teri', 'Тери'), did: 'нашла' }, { n: L('Lina', 'Лина'), did: 'нашла' }, { n: L('Pip', 'Пип'), did: 'нашёл' }]);
    const yes = L(`Yes: ${fmt(d, 'en')} is about ${fmt(r, 'en')}, and ${fmt(r, 'en')} × ${m} = ${fmt(est, 'en')} is close to ${fmt(total, 'en')}`,
        `Да: ${fmt(d, 'ru')} - это примерно ${fmt(r, 'ru')}, и ${fmt(r, 'ru')} × ${m} = ${fmt(est, 'ru')}, близко к ${fmt(total, 'ru')}`);
    const no = L(`No: ${fmt(d, 'en')} is about ${fmt(r, 'en')}, and ${fmt(r, 'en')} × ${m} = ${fmt(est, 'en')}, far from ${fmt(total, 'en')}. ${fmt(1000 * th, 'en')} × ${m} = ${fmt(right[3], 'en')}, not ${fmt(wrote[3], 'en')}`,
        `Нет: ${fmt(d, 'ru')} - это примерно ${fmt(r, 'ru')}, и ${fmt(r, 'ru')} × ${m} = ${fmt(est, 'ru')}, далеко от ${fmt(total, 'ru')}. ${fmt(1000 * th, 'ru')} × ${m} = ${fmt(right[3], 'ru')}, а не ${fmt(wrote[3], 'ru')}`);
    return {
        ...base, id: `${S}:reason:${d}:${m}:${ok ? 'y' : 'n'}`,
        prompt: L(`${who.n.en} used place value to find ${fmt(d, 'en')} × ${m}. The partial products: ${wrote.map(x => fmt(x, 'en')).join(', ')}. The answer: ${fmt(total, 'en')}. Is the answer reasonable? Explain.`,
            `${who.n.ru} ${who.did} ${fmt(d, 'ru')} × ${m} по разрядам. Частичные произведения: ${wrote.map(x => fmt(x, 'ru')).join('; ')}. Ответ: ${fmt(total, 'ru')}. Ответ разумный? Объясни.`),
        answer: choice(rng, ok ? yes : no, [ok ? L(`No: ${fmt(total, 'en')} is much too small`, `Нет: ${fmt(total, 'ru')} слишком мало`) : L(`Yes: the partial products add up to ${fmt(total, 'en')}`, `Да: частичные произведения в сумме дают ${fmt(total, 'ru')}`),
            L('Yes: every partial product ends in the right digit', 'Да: каждое частичное произведение оканчивается на нужную цифру'), L('No: you cannot multiply a 4-digit number by place value', 'Нет: четырёхзначное число нельзя умножать по разрядам')]),
        steps: [
            L(`Estimate first: ${fmt(d, 'en')} is about ${fmt(r, 'en')}, ${fmt(r, 'en')} × ${m} = ${fmt(est, 'en')}.`, `Сначала прикинь: ${fmt(d, 'ru')} - это примерно ${fmt(r, 'ru')}, ${fmt(r, 'ru')} × ${m} = ${fmt(est, 'ru')}.`),
            X(n => `${o} × ${m} = ${n(right[0])}`), X(n => `${10 * t} × ${m} = ${n(right[1])}`), X(n => `${n(100 * h)} × ${m} = ${n(right[2])}`), X(n => `${n(1000 * th)} × ${m} = ${n(right[3])}`),
            L(`${right.map(x => fmt(x, 'en')).join(' + ')} = ${fmt(d * m, 'en')}.`, `${right.map(x => fmt(x, 'ru')).join(' + ')} = ${fmt(d * m, 'ru')}.`),
            ok ? L(`The answer ${fmt(total, 'en')} is close to the estimate ${fmt(est, 'en')}: reasonable.`, `Ответ ${fmt(total, 'ru')} близок к прикидке ${fmt(est, 'ru')}: разумный.`)
                : L(`The answer ${fmt(total, 'en')} is far from the estimate ${fmt(est, 'en')}: not reasonable. A zero was lost in the thousands.`, `Ответ ${fmt(total, 'ru')} далеко от прикидки ${fmt(est, 'ru')}: не разумный. В тысячах потерялся ноль.`),
        ],
        hint: L(`Round ${fmt(d, 'en')} to the nearest thousand and multiply by ${m}. Is the answer close to that?`, `Округли ${fmt(d, 'ru')} до тысяч и умножь на ${m}. Ответ близко к этому?`),
        data: { d, m, total, est, ok: ok ? 1 : 0, style: 'reason' },
    };
};

// ---------- problem 7: total sales of two kinds of boxes ----------

type Shop = { store: L10n; items: [L10n, L10n] };
const SHOPS: Shop[] = [
    { store: L('Nolan\'s Novelties', 'магазине Нолана'), items: [L('neon keychains', 'неоновых брелоков'), L('glow-in-the-dark pens', 'светящихся ручек')] },
    { store: L('Pip\'s café', 'кафе Пипа'), items: [L('carrot cookies', 'морковного печенья'), L('cocoa cups', 'стаканчиков какао')] },
    { store: L('the school book fair', 'школьной книжной ярмарке'), items: [L('bookmarks', 'закладок'), L('stickers', 'наклеек')] },
];
const boxes = (n: number) => `${n} ${ruPlural(n, 'коробка', 'коробки', 'коробок')}`;

const makeSales = (rng: Rng): Problem => {
    const i = int(rng, 0, SHOPS.length - 1), { store, items } = SHOPS[i];
    const p1 = pick(rng, [12, 15, 18, 25]), p2 = pick(rng, [10, 20, 30]), c1 = twoDigit(rng, 12, 39), c2 = twoDigit(rng, 12, 39);
    const s1 = c1 * p1, s2 = c2 * p2, total = s1 + s2;
    return {
        ...base, id: `${S}:sales:${i}:${c1}:${p1}:${c2}:${p2}`,
        prompt: L(`Higher Order Thinking: prices at ${store.en}: ${items[0].en} $${p1} a box, ${items[1].en} $${p2} a box. ${c1} boxes of ${items[0].en} and ${c2} boxes of ${items[1].en} were sold. What were the total sales in dollars?`,
            `Подумай: цены в ${store.ru}: коробка ${items[0].ru} - $${p1}, коробка ${items[1].ru} - $${p2}. Продали ${boxes(c1)} ${items[0].ru} и ${boxes(c2)} ${items[1].ru}. Сколько долларов получил магазин всего?`),
        answer: { kind: 'number', value: total },
        steps: [
            L('Two kinds of boxes: multiply each kind, then add.', 'Два вида коробок: умножь каждый вид, потом сложи.'),
            X(n => `${c1} × $${p1} = $${n(s1)}`),
            X(n => `${c2} × $${p2} = $${n(s2)}`),
            X(n => `$${n(s1)} + $${n(s2)} = $${n(total)}`),
        ],
        hint: L(`Find the sales of each kind first: ${c1} × ${p1} and ${c2} × ${p2}. Then add.`, `Сначала найди выручку за каждый вид: ${c1} × ${p1} и ${c2} × ${p2}. Потом сложи.`),
        data: { c1, p1, c2, p2, value: total, style: 'sales' },
    };
};

// ---------- problem 8: the missing partial products ----------

// the order of the book's column: ones × ones, ones × tens, tens × ones, tens × tens of the bottom and the top factor
const columnPartials = (top: number, bot: number) => [onesOf(bot) * onesOf(top), onesOf(bot) * tensOf(top), tensOf(bot) * onesOf(top), tensOf(bot) * tensOf(top)];

const makeMissing = (rng: Rng): Problem => {
    let top = twoDigit(rng, 12, 59), bot = twoDigit(rng, 12, 49), ps = columnPartials(top, bot);
    while (new Set(ps).size < 4) { top = twoDigit(rng, 12, 59); bot = twoDigit(rng, 12, 49); ps = columnPartials(top, bot); }
    const hide = shuffle(rng, [0, 1, 2, 3]).slice(0, 2).sort((x, y) => x - y);
    const values: number[] = [];
    const lines: FillLine[] = [{ label: L('Partial products', 'Частичные произведения'), parts: [`${top} × ${bot}`] }];
    ps.forEach((x, k) => {
        if (hide.includes(k)) { values.push(x); lines.push({ parts: [k === 3 ? '+ ' : '', B(values.length - 1)] }); }
        else lines.push({ parts: [k === 3 ? '+ ' : '', { t: X(n => n(x)) }] });
    });
    values.push(top * bot);
    lines.push({ label: L('Product', 'Произведение'), parts: [B(values.length - 1)] });
    // the box: the missing ones, the given ones, and partial products with a lost or an extra zero
    const decoys = [ps[3] / 10, ps[1] * 10, ps[2] * 10].filter(x => !ps.includes(x));
    const bank = Array.from(new Set([...ps, ...decoys])).sort((x, y) => y - x);
    const [bt, bo, tt, to] = [tensOf(bot), onesOf(bot), tensOf(top), onesOf(top)];
    return {
        ...base, id: `${S}:missing:${top}:${bot}:${hide.join('')}`,
        prompt: L(`Insert the missing partial products of ${top} × ${bot} (use the box: ${bank.map(x => fmt(x, 'en')).join(', ')}). Then add to find the product.`,
            `Впиши пропущенные частичные произведения для ${top} × ${bot} (числа из рамки: ${bank.map(x => fmt(x, 'ru')).join('; ')}). Потом сложи и найди произведение.`),
        answer: { kind: 'fill', layout: 'lines', values, lines },
        steps: [
            X(n => `${bo} × ${to} = ${n(ps[0])}`), X(n => `${bo} × ${tt} = ${n(ps[1])}`), X(n => `${bt} × ${to} = ${n(ps[2])}`), X(n => `${bt} × ${tt} = ${n(ps[3])}`),
            X(n => `${ps.map(n).join(' + ')} = ${n(top * bot)}`),
        ],
        hint: L(`Multiply each part of ${bot} (${bo} and ${bt}) by each part of ${top} (${to} and ${tt}), in this order: ones × ones, ones × tens, tens × ones, tens × tens.`,
            `Умножь каждую часть ${bot} (${bo} и ${bt}) на каждую часть ${top} (${to} и ${tt}) по порядку: единицы × единицы, единицы × десятки, десятки × единицы, десятки × десятки.`),
        data: { top, bot, value: top * bot, style: 'missing' },
    };
};

// ---------- problem 9: the missing factor ----------

const makeFactor = (rng: Rng): Problem => {
    const a = twoDigit(rng, 12, 69), f = twoDigit(rng, 12, 89), p = a * f, flip = rng() < 0.3;
    // the box: the factor, a factor with the same ones digit and two near ones
    const bank = Array.from(new Set([f, f + 10 <= 99 ? f + 10 : f - 10, f + 1, f - 2, f + 20 <= 99 ? f + 20 : f - 20])).slice(0, 5).sort((x, y) => x - y);
    const eq = flip ? `__ × ${a} = ${fmt(p, 'en')}` : `${a} × __ = ${fmt(p, 'en')}`;
    const eqRu = flip ? `__ × ${a} = ${fmt(p, 'ru')}` : `${a} × __ = ${fmt(p, 'ru')}`;
    const ra = roundTo(a, 10), guess = Math.round(p / ra);
    return {
        ...base, id: `${S}:factor:${a}:${f}:${flip ? 'f' : 'n'}`,
        prompt: L(`Insert the missing factor: ${eq}. Use the box: ${bank.join(', ')}.`, `Впиши пропущенный множитель: ${eqRu}. Числа из рамки: ${bank.join('; ')}.`),
        answer: { kind: 'number', value: f },
        steps: [
            L(`Estimate: ${a} is about ${ra}, and ${fmt(p, 'en')} ÷ ${ra} is about ${guess}. Look in the box near ${guess}.`, `Прикинь: ${a} - это примерно ${ra}, а ${fmt(p, 'ru')} ÷ ${ra} - примерно ${guess}. Ищи в рамке рядом с ${guess}.`),
            L(`Check the ones: ${onesOf(a)} × ${onesOf(f)} ends in ${(onesOf(a) * onesOf(f)) % 10}, like ${fmt(p, 'en')}.`, `Проверь единицы: ${onesOf(a)} × ${onesOf(f)} оканчивается на ${(onesOf(a) * onesOf(f)) % 10}, как и ${fmt(p, 'ru')}.`),
            X(n => `${a} × ${f} = ${n(p)} ✓`),
        ],
        hint: L(`Try a number from the box: round ${a} to ${ra} and see which one gives about ${fmt(p, 'en')}. Then check the ones digit.`, `Пробуй числа из рамки: округли ${a} до ${ra} и посмотри, какое даёт примерно ${fmt(p, 'ru')}. Потом проверь последнюю цифру.`),
        data: { a, f, p, value: f, style: 'factor' },
    };
};

export const makeTopic4Arr = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_4_4, want);
    if (style === 'array') return makeArray(rng);
    if (style === 'hours') return makeHours(rng);
    if (style === 'reason') return makeReason(rng);
    if (style === 'sales') return makeSales(rng);
    if (style === 'missing') return makeMissing(rng);
    return makeFactor(rng);
};
