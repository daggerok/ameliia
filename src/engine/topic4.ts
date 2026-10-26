/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, fmt, int, pick, pickStyle, ruPlural } from './core';
import { AMELIIA } from './words';

// Topic 4, Lesson 4-2 of her class (Savvas enVision "Use Models to Multiply 2-Digit Numbers by Multiples of 10"),
// Additional Practice 4-2, pages 45-46, the homework of 2026-10-26 (4.NBT.B.5):
// - array: 10 × 12 with place-value blocks, 10 groups of 10 and 10 groups of 2 (problem 1)
// - area: 20 × 18 as an area model, 20 groups of 10 and 20 groups of 8 (problem 2)
// - product: 50 × 15, 40 × 22, 30 × 39, 60 × 21 (problems 3-6)
// - story: a building of 30 floors of 18 feet (problem 7)
// - diff: Marta exercises 30 minutes a day and Greg 40, how many more minutes in 31 days (problem 8)
// - two: 15 boxes of 70 floss and 20 boxes of 50 toothbrushes, 30 boxes of 16 glasses and 30 boxes of 25 plates (problems 9, 10)
// - compare: which product is greater without multiplying, 45 × 10 or 50 × 10, and Miranda's 30 × 26 against 20 × 36 (problems 11, 12)

export const KINDS_4_2 = ['array', 'area', 'product', 'story', 'diff', 'two', 'compare'] as const;
type Kind = (typeof KINDS_4_2)[number];

const B = (b: number): FillPart => ({ b });
// one template in both languages: numbers are written 1,234 in English and 1 234 in Russian
const X = (f: (n: (x: number) => string) => string): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
// "20 groups of 10" / "20 групп по 10": the count is always a multiple of 10, so the Russian form never changes
const GROUPS = L('groups of', 'групп по');

const tensOf = (a: number) => Math.floor(a / 10) * 10;
const onesOf = (a: number) => a % 10;
// a 2-digit number with ones, so there are two real parts
const twoDigit = (rng: Rng, hiTens = 9) => 10 * int(rng, 1, hiTens) + int(rng, 1, 9);
const tens = (rng: Rng) => 10 * int(rng, 2, 9);

const groups = (x: number) => `${x} ${ruPlural(x, 'группа', 'группы', 'групп')}`;

// (20 groups of 10) + (20 groups of 8): 200 + 160 = 360; a round number like 30 days needs no break: 20 × 30 is 2 × 3 with the zeros
const breakSteps = (m: number, a: number): L10n[] => {
    const t = tensOf(a), o = onesOf(a);
    if (o === 0) return [
        L(`${m} × ${a}: ${m / 10} × ${a / 10} = ${(m / 10) * (a / 10)}, then write the two zeros back: ${fmt(m * a, 'en')}.`, `${m} × ${a}: ${m / 10} × ${a / 10} = ${(m / 10) * (a / 10)}, потом допиши два нуля: ${fmt(m * a, 'ru')}.`),
        L(`So, ${m} × ${a} = ${fmt(m * a, 'en')}.`, `Значит, ${m} × ${a} = ${fmt(m * a, 'ru')}.`),
    ];
    return [
        L(`${m} × ${a} means ${m} groups of ${a}: (${m} groups of ${t}) + (${m} groups of ${o}).`, `${m} × ${a} - это ${m} групп по ${a}: (${m} групп по ${t}) + (${m} групп по ${o}).`),
        X(n => `${m} × ${t} = ${n(m * t)}`),
        X(n => `${m} × ${o} = ${n(m * o)}`),
        X(n => `${n(m * t)} + ${n(m * o)} = ${n(m * a)}`),
        L(`So, ${m} × ${a} = ${fmt(m * a, 'en')}.`, `Значит, ${m} × ${a} = ${fmt(m * a, 'ru')}.`),
    ];
};
const breakHint = (m: number, a: number): L10n => {
    const t = tensOf(a), o = onesOf(a);
    return L(`Break ${a} into ${t} + ${o}. ${m} × ${t} and ${m} × ${o} are easy: use ${m / 10} × ${t / 10} and ${m / 10} × ${o}, then write the zeros back.`,
        `Разбей ${a} на ${t} + ${o}. ${m} × ${t} и ${m} × ${o} легко посчитать: возьми ${m / 10} × ${t / 10} и ${m / 10} × ${o}, потом допиши нули.`);
};

// ---------- problem 1: an array of place-value blocks ----------

const makeArray = (rng: Rng): Problem => {
    const m = pick(rng, [10, 20, 30]), a = twoDigit(rng, 4), t = tensOf(a), o = onesOf(a), p = m * a;
    const lines: FillLine[] = [
        { label: L('Use the array', 'Используй массив'), parts: [`${m} `, { t: GROUPS }, ` ${t} = `, B(0)] },
        { parts: [`${m} `, { t: GROUPS }, ` ${o} = `, B(1)] },
        { parts: [{ echo: 0 }, ' + ', { echo: 1 }, ' = ', B(2)] },
        { label: L('So', 'Значит'), parts: [`${m} × ${a} = `, B(3)] },
    ];
    return {
        id: `mult-2x10:array:${m}:${a}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: L(`Use the array to find ${m} × ${a}. Think of ${m} rows of ${a} as ${m} groups of ${t} and ${m} groups of ${o}.`,
            `Найди ${m} × ${a} с помощью массива. Представь ${m} рядов по ${a} как ${m} групп по ${t} и ${m} групп по ${o}.`),
        answer: { kind: 'fill', layout: 'lines', values: [m * t, m * o, p, p], lines },
        steps: breakSteps(m, a), hint: breakHint(m, a), visual: { kind: 'area', a, b: m },
        data: { m, a, value: p, style: 'array' },
    };
};

// ---------- problem 2: an area model with the tens and ones on top ----------

const makeAreaModel = (rng: Rng): Problem => {
    const m = tens(rng), a = twoDigit(rng), t = tensOf(a), o = onesOf(a), p = m * a;
    return {
        id: `mult-2x10:area:${m}:${a}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: L(`Use an area model to find ${m} × ${a}. Write ${a} as tens and ones on top, ${m} is on the left, fill in both boxes, then add them.`,
            `Найди ${m} × ${a} с помощью модели площади. Запиши ${a} сверху как десятки и единицы, слева стоит ${m}, заполни обе клетки и сложи их.`),
        answer: { kind: 'fill', layout: 'area', values: [t, o, m * t, m * o, p], top: [B(0), B(1)], left: [String(m)], cells: [[2, 3]], total: 4 },
        steps: breakSteps(m, a), hint: breakHint(m, a), visual: { kind: 'area', a, b: m },
        data: { m, a, value: p, style: 'area' },
    };
};

// ---------- problems 3-6: find each product ----------

const makeProduct = (rng: Rng): Problem => {
    const m = tens(rng), a = twoDigit(rng), p = m * a;
    const flip = rng() < 0.3;
    const expr = flip ? `${a} × ${m}` : `${m} × ${a}`;
    return {
        id: `mult-2x10:product:${m}:${a}:${flip ? 'f' : 'n'}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: L(`Find ${expr}. Draw an array or an area model in the notepad to help.`, `Найди ${expr}. Нарисуй в блокноте массив или модель площади, чтобы помочь себе.`),
        answer: { kind: 'number', value: p },
        steps: [...(flip ? [L(`${a} × ${m} is the same as ${m} × ${a}.`, `${a} × ${m} - то же самое, что ${m} × ${a}.`)] : []), ...breakSteps(m, a)],
        hint: breakHint(m, a), visual: { kind: 'area', a, b: m },
        data: { m, a, value: p, style: 'product' },
    };
};

// ---------- problem 7: equal groups in a story ----------

type Story = (m: number, a: number) => L10n;
const STORIES: Story[] = [
    (m, a) => L(`The height of each story of an apartment building is measured from the bottom of one floor to the bottom of the next floor. Each story has a height of ${a} feet. The building has ${m} floors. How tall is the building?`,
        `Высота этажа в доме измеряется от пола одного этажа до пола следующего. Высота каждого этажа ${a} ${ruPlural(a, 'фут', 'фута', 'футов')}. В доме ${m} этажей. Какой высоты дом?`),
    (m, a) => L(`The train to the school of magic has ${m} cars. Each car has ${a} seats. How many seats are on the train?`,
        `В поезде до школы волшебства ${m} вагонов. В каждом вагоне ${a} ${ruPlural(a, 'место', 'места', 'мест')}. Сколько всего мест в поезде?`),
    (m, a) => L(`A garden has ${m} rows of tulips with ${a} tulips in each row. How many tulips are in the garden?`,
        `В саду ${m} рядов тюльпанов, в каждом ряду ${a} ${ruPlural(a, 'тюльпан', 'тюльпана', 'тюльпанов')}. Сколько тюльпанов в саду?`),
    (m, a) => L(`${AMELIIA.en} reads ${a} pages of Harry Potter every day for ${m} days. How many pages does she read?`,
        `${AMELIIA.ru} ${m} дней подряд читает по ${a} ${ruPlural(a, 'странице', 'страницы', 'страниц')} «Гарри Поттера» в день. Сколько страниц она прочитает?`),
    (m, a) => L(`Pip packs ${m} boxes of capybara cookies with ${a} cookies in each box. How many cookies is that?`,
        `Пип пакует ${m} коробок печенья для капибар, в каждой коробке ${a} ${ruPlural(a, 'печенье', 'печенья', 'печений')}. Сколько всего печений?`),
];

const makeStory = (rng: Rng): Problem => {
    const i = int(rng, 0, STORIES.length - 1), m = tens(rng), a = twoDigit(rng), p = m * a;
    return {
        id: `mult-2x10:story:${i}:${m}:${a}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: STORIES[i](m, a),
        answer: { kind: 'number', value: p },
        steps: [L(`Equal groups: ${m} groups of ${a}, so multiply ${m} × ${a}.`, `Одинаковые группы: ${m} групп по ${a}, значит умножаем ${m} × ${a}.`), ...breakSteps(m, a)],
        hint: L(`${m} equal groups of ${a}: multiply. ${breakHint(m, a).en}`, `${m} одинаковых групп по ${a}: умножай. ${breakHint(m, a).ru}`),
        visual: { kind: 'area', a, b: m },
        data: { m, a, value: p, style: 'story' },
    };
};

// ---------- problem 8: how many more in a month ----------

// does: "Marta exercises"; base: "does Greg exercise"; doesRu: the short Russian verb of the question
type Pair = { less: L10n; more: L10n; does: L10n; base: string; doesRu: string };
const PAIRS: Pair[] = [
    { less: L('Marta', 'Марта'), more: L('Greg', 'Грег'), does: L('exercises', 'занимается спортом'), base: 'exercise', doesRu: 'занимается' },
    { less: L('Lina', 'Лина'), more: L('Pip', 'Пип'), does: L('reads', 'читает'), base: 'read', doesRu: 'читает' },
    { less: L('Martin', 'Мартин'), more: L(AMELIIA.en, AMELIIA.ru), does: L('practices the piano', 'играет на пианино'), base: 'practice', doesRu: 'играет' },
];
const MONTHS: [number, L10n][] = [[31, L('31 days', '31 день')], [30, L('30 days', '30 дней')], [28, L('28 days', '28 дней')]];

const makeDiff = (rng: Rng): Problem => {
    const i = int(rng, 0, PAIRS.length - 1), { less, more, does, base, doesRu } = PAIRS[i];
    const x = 10 * int(rng, 1, 5), d = 10 * int(rng, 1, 3), y = x + d;
    const [days, month] = pick(rng, MONTHS), p = days * d;
    return {
        id: `mult-2x10:diff:${i}:${x}:${y}:${days}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: L(`${less.en} ${does.en} ${x} minutes each day. ${more.en} ${does.en} ${y} minutes each day. How many more minutes does ${more.en} ${base} than ${less.en} in a month that has ${month.en}?`,
            `${less.ru} ${does.ru} ${x} минут каждый день. ${more.ru} ${does.ru} ${y} минут каждый день. На сколько минут больше ${doesRu} ${more.ru}, чем ${less.ru}, за месяц, в котором ${month.ru}?`),
        answer: { kind: 'number', value: p },
        steps: [
            L(`Each day ${more.en} does ${y} − ${x} = ${d} minutes more.`, `Каждый день ${more.ru} делает на ${y} − ${x} = ${d} минут больше.`),
            L(`${days} days of ${d} more minutes: ${days} × ${d}.`, `${days} дней по ${d} лишних минут: ${days} × ${d}.`),
            ...breakSteps(d, days),
            L(`Another way: ${days} × ${y} − ${days} × ${x} = ${fmt(days * y, 'en')} − ${fmt(days * x, 'en')} = ${fmt(p, 'en')}`, `Другой способ: ${days} × ${y} − ${days} × ${x} = ${fmt(days * y, 'ru')} − ${fmt(days * x, 'ru')} = ${fmt(p, 'ru')}`),
        ],
        hint: L('Find how many more minutes in ONE day first, then multiply by the days of the month.', 'Сначала найди, на сколько минут больше за ОДИН день, потом умножь на число дней в месяце.'),
        data: { m: d, a: days, x, y, days, value: p, style: 'diff' },
    };
};

// ---------- problems 9 and 10: two kinds of boxes, then the total ----------

// c: boxes, s: items in a box; one of them is a multiple of 10, the other a 2-digit number
type Two = { bigBoxes: boolean; text: (c1: number, s1: number, c2: number, s2: number) => L10n; one: L10n; other: L10n };
const TWOS: Two[] = [
    { bigBoxes: false, one: L('Floss', 'Зубная нить'), other: L('Toothbrushes', 'Зубные щётки'),
        text: (c1, s1, c2, s2) => L(`A dentist orders ${c1} boxes of floss and ${c2} boxes of toothbrushes each month. Floss is sold ${s1} to a box and toothbrushes are sold ${s2} to a box. How many items does the dentist order each month?`,
            `Стоматолог каждый месяц заказывает ${c1} ${ruPlural(c1, 'коробку', 'коробки', 'коробок')} зубной нити и ${c2} ${ruPlural(c2, 'коробку', 'коробки', 'коробок')} зубных щёток. В коробке ${s1} нитей, а щёток в коробке ${s2}. Сколько всего предметов заказывает стоматолог за месяц?`) },
    { bigBoxes: true, one: L('Glasses', 'Стаканы'), other: L('Plates', 'Тарелки'),
        text: (c1, s1, c2, s2) => L(`Mrs. Harrigan ordered ${c1} boxes of glasses for her restaurant. Each box holds ${s1} glasses. She also ordered ${c2} boxes of plates. There are ${s2} plates in each box. How many glasses and plates did Mrs. Harrigan order altogether?`,
            `Миссис Харриган заказала для ресторана ${c1} коробок стаканов, в каждой коробке ${s1} ${ruPlural(s1, 'стакан', 'стакана', 'стаканов')}. Ещё она заказала ${c2} коробок тарелок, в каждой коробке ${s2} ${ruPlural(s2, 'тарелка', 'тарелки', 'тарелок')}. Сколько всего стаканов и тарелок она заказала?`) },
    { bigBoxes: true, one: L('Pencils', 'Карандаши'), other: L('Erasers', 'Ластики'),
        text: (c1, s1, c2, s2) => L(`A school buys ${c1} packs of pencils with ${s1} pencils in each pack and ${c2} packs of erasers with ${s2} erasers in each pack. How many pencils and erasers is that altogether?`,
            `Школа покупает ${c1} упаковок карандашей, в каждой ${s1} ${ruPlural(s1, 'карандаш', 'карандаша', 'карандашей')}, и ${c2} упаковок ластиков, в каждой ${s2} ${ruPlural(s2, 'ластик', 'ластика', 'ластиков')}. Сколько всего карандашей и ластиков?`) },
];

const makeTwo = (rng: Rng): Problem => {
    const i = int(rng, 0, TWOS.length - 1), { bigBoxes, text, one, other } = TWOS[i];
    const [c1, s1, c2, s2] = bigBoxes ? [tens(rng), twoDigit(rng), tens(rng), twoDigit(rng)] : [twoDigit(rng, 3), tens(rng), twoDigit(rng, 3), tens(rng)];
    const p1 = c1 * s1, p2 = c2 * s2, p = p1 + p2;
    const lines: FillLine[] = [
        { label: one, parts: [`${c1} × ${s1} = `, B(0)] },
        { label: other, parts: [`${c2} × ${s2} = `, B(1)] },
        { label: L('Altogether', 'Всего'), parts: [{ echo: 0 }, ' + ', { echo: 1 }, ' = ', B(2)] },
    ];
    const [m1, a1] = bigBoxes ? [c1, s1] : [s1, c1], [m2, a2] = bigBoxes ? [c2, s2] : [s2, c2];
    return {
        id: `mult-2x10:two:${i}:${c1}:${s1}:${c2}:${s2}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: text(c1, s1, c2, s2),
        answer: { kind: 'fill', layout: 'lines', values: [p1, p2, p], lines },
        steps: [
            L(`${one.en}: ${c1} boxes of ${s1}.`, `${one.ru}: ${c1} ${ruPlural(c1, 'коробка', 'коробки', 'коробок')} по ${s1}.`), ...breakSteps(m1, a1).slice(1, 4),
            L(`${other.en}: ${c2} boxes of ${s2}.`, `${other.ru}: ${c2} ${ruPlural(c2, 'коробка', 'коробки', 'коробок')} по ${s2}.`), ...breakSteps(m2, a2).slice(1, 4),
            X(n => `${n(p1)} + ${n(p2)} = ${n(p)}`),
        ],
        hint: L('Two kinds of boxes: find each kind with its own multiplication, then add the two products.', 'Два вида коробок: посчитай каждый вид своим умножением, потом сложи два произведения.'),
        data: { c1, s1, c2, s2, value: p, style: 'two' },
    };
};

// ---------- problems 11 and 12: which product is greater ----------

const makeCompare = (rng: Rng): Problem => {
    if (rng() < 0.5) {
        // without multiplying: the same multiple of 10 and two different 2-digit numbers (or the other way round)
        const sameTens = rng() < 0.6;
        const m = 10 * int(rng, 2, 6), a = twoDigit(rng, 8);
        let b = a + int(rng, 1, 9);
        if (rng() < 0.5 && b + 10 < 100) b += 10;
        const m2 = m + 10 * int(rng, 1, 3);
        const [lo, hi] = sameTens ? [`${a} × ${m}`, `${b} × ${m}`] : [`${m} × ${a}`, `${m2} × ${a}`];
        const [loV, hiV] = sameTens ? [a * m, b * m] : [m * a, m2 * a];
        const why = sameTens
            ? L(`${hi}: both have groups of ${m}, and ${b} groups are more than ${a} groups`, `${hi}: в обоих группы по ${m}, а ${groups(b)} больше, чем ${groups(a)}`)
            : L(`${hi}: both have groups of ${a}, and ${m2} groups are more than ${m} groups`, `${hi}: в обоих группы по ${a}, а ${m2} групп больше, чем ${m} групп`);
        const flip = rng() < 0.5;
        const [first, second] = flip ? [hi, lo] : [lo, hi];
        return {
            id: `mult-2x10:compare:w:${sameTens ? 't' : 'm'}:${m}:${a}:${sameTens ? b : m2}:${flip ? 'f' : 'n'}`, skill: 'mult-2x10', topic: 'estimation',
            prompt: L(`Without multiplying, is the product of ${first} or ${second} greater? Explain.`, `Не умножая, скажи: какое произведение больше, ${first} или ${second}? Объясни.`),
            answer: choice(rng, why, [
                sameTens ? L(`${lo}: ${a} is a smaller number, so its product is bigger`, `${lo}: ${a} меньше, значит его произведение больше`) : L(`${lo}: ${m} is a smaller number, so its product is bigger`, `${lo}: ${m} меньше, значит его произведение больше`),
                L('They are equal: both products have the same factor', 'Они равны: у обоих произведений есть одинаковый множитель'),
                L('You cannot tell without multiplying', 'Без умножения сказать нельзя'),
            ]),
            steps: [
                sameTens
                    ? L(`${a} × ${m} is ${a} groups of ${m}, and ${b} × ${m} is ${b} groups of ${m}. More groups of the same size make a bigger product, so ${hi} is greater.`,
                        `${a} × ${m} - это ${groups(a)} по ${m}, а ${b} × ${m} - это ${groups(b)} по ${m}. Больше групп одинакового размера дают большее произведение, значит ${hi} больше.`)
                    : L(`${m} × ${a} is ${m} groups of ${a}, and ${m2} × ${a} is ${m2} groups of ${a}. More groups of the same size make a bigger product, so ${hi} is greater.`,
                        `${m} × ${a} - это ${m} групп по ${a}, а ${m2} × ${a} - это ${m2} групп по ${a}. Больше групп одинакового размера дают большее произведение, значит ${hi} больше.`),
                L(`Check: ${lo} = ${fmt(loV, 'en')} and ${hi} = ${fmt(hiV, 'en')}`, `Проверка: ${lo} = ${fmt(loV, 'ru')} и ${hi} = ${fmt(hiV, 'ru')}`),
            ],
            hint: L('Both products share a factor. Compare the other factor: more groups of the same size is more.', 'У обоих произведений есть общий множитель. Сравни другой множитель: больше групп одного размера - значит больше.'),
            data: { lo: loV, hi: hiV, style: 'compare' },
        };
    }
    // Miranda's claim: a real comparison of two different products
    const m = tens(rng), a = twoDigit(rng), k = tens(rng);
    let b = twoDigit(rng);
    for (let i = 0; i < 20 && b * k === m * a; i++) b = twoDigit(rng);
    const p1 = m * a, p2 = b * k, ok = p1 > p2;
    const yes = L(`Yes: ${m} × ${a} = ${fmt(p1, 'en')} and ${b} × ${k} = ${fmt(p2, 'en')}, and ${fmt(p1, 'en')} is greater than ${fmt(p2, 'en')}`,
        `Да: ${m} × ${a} = ${fmt(p1, 'ru')} и ${b} × ${k} = ${fmt(p2, 'ru')}, а ${fmt(p1, 'ru')} больше, чем ${fmt(p2, 'ru')}`);
    const no = L(`No: ${m} × ${a} = ${fmt(p1, 'en')} and ${b} × ${k} = ${fmt(p2, 'en')}, and ${fmt(p1, 'en')} is less than ${fmt(p2, 'en')}`,
        `Нет: ${m} × ${a} = ${fmt(p1, 'ru')} и ${b} × ${k} = ${fmt(p2, 'ru')}, а ${fmt(p1, 'ru')} меньше, чем ${fmt(p2, 'ru')}`);
    return {
        id: `mult-2x10:compare:m:${m}:${a}:${b}:${k}`, skill: 'mult-2x10', topic: 'estimation',
        prompt: L(`Miranda says ${m} × ${a} is greater than ${b} × ${k}. Is she correct? Draw a model to explain if Miranda is correct.`,
            `Миранда говорит, что ${m} × ${a} больше, чем ${b} × ${k}. Она права? Нарисуй модель, чтобы объяснить, права ли Миранда.`),
        answer: choice(rng, ok ? yes : no, [
            ok ? L(`No: ${fmt(p2, 'en')} is greater than ${fmt(p1, 'en')}`, `Нет: ${fmt(p2, 'ru')} больше, чем ${fmt(p1, 'ru')}`) : L(`Yes: ${fmt(p1, 'en')} is greater than ${fmt(p2, 'en')}`, `Да: ${fmt(p1, 'ru')} больше, чем ${fmt(p2, 'ru')}`),
            L(`They are equal: both products are ${fmt(Math.max(p1, p2), 'en')}`, `Они равны: оба произведения равны ${fmt(Math.max(p1, p2), 'ru')}`),
            L('You cannot compare them without a calculator', 'Без калькулятора их не сравнить'),
        ]),
        steps: [
            ...breakSteps(m, a).slice(1, 4), ...breakSteps(k, b).slice(1, 4),
            ok ? L(`${fmt(p1, 'en')} > ${fmt(p2, 'en')}, so Miranda is correct.`, `${fmt(p1, 'ru')} > ${fmt(p2, 'ru')}, значит Миранда права.`)
                : L(`${fmt(p1, 'en')} < ${fmt(p2, 'en')}, so Miranda is not correct.`, `${fmt(p1, 'ru')} < ${fmt(p2, 'ru')}, значит Миранда не права.`),
        ],
        hint: L('Find both products with an area model, then compare the two totals.', 'Найди оба произведения с помощью модели площади, потом сравни два итога.'),
        data: { lo: Math.min(p1, p2), hi: Math.max(p1, p2), p1, p2, style: 'compare' },
    };
};

export const makeTopic4 = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_4_2, want);
    if (style === 'array') return makeArray(rng);
    if (style === 'area') return makeAreaModel(rng);
    if (style === 'product') return makeProduct(rng);
    if (style === 'story') return makeStory(rng);
    if (style === 'diff') return makeDiff(rng);
    if (style === 'two') return makeTwo(rng);
    return makeCompare(rng);
};
