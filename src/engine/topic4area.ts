/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, fmt, int, multi, pick, pickStyle, ruPlural } from './core';
import { roundTo } from './estimation';
import { AMELIIA } from './words';

// Topic 4, Lesson 4-5 of her class (Savvas enVision "Area Models and Partial Products"),
// Additional Practice 4-5, pages 51-52, the homework of 2026-10-29 (4.NBT.B.5, 4.OA.A.3):
// - area: 14 × 19, 12 × 22, 21 × 51 on a drawn area model, fill in the four boxes and add (problems 1-3)
// - dist: 23 × 18 = (20 + 3) × (10 + 8) = (20 × 10) + (3 × 10) + (20 × 8) + (3 × 8) (Another Look)
// - product: draw an area model, use properties of operations, 10 × 18 ... 29 × 64 (problems 4-13)
// - story: 27 students, 15 math problems each (problem 14)
// - add: 12,211 people at a concert and 9,217 at a rodeo (problem 15)
// - ferry: about how much money, 82 people at $3 and 49 cars at $34 (problem 16)
// - enough: 27 students, 63 words, 1,500 index cards, enough or not (problem 17)
// - partials: select the partial products of 17 × 28 (problem 18)
// - ways: select the ways to break apart 45 × 18 with the Distributive Property (problem 19)
// Her first try of p. 51 (2026-10-29) showed where she thinks wrong, so the tasks lean on it: tens × tens whose basic fact
// ends in 0 (20 × 50 = 1,000, she wrote 100), a factor of 10 (10 × 18, she multiplied the parts by 18), and adding four
// partial products with a carry in the tens (100 + 90 + 40 + 36, she wrote 206)

export const KINDS_4_5 = ['area', 'dist', 'product', 'story', 'add', 'ferry', 'enough', 'partials', 'ways'] as const;
type Kind = (typeof KINDS_4_5)[number];

const B = (b: number): FillPart => ({ b });
const X = (f: (n: (x: number) => string) => string): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
// the same with words: an English and a Russian template, numbers written the way of each language
type Tpl = (n: (x: number) => string) => string;
const W = (en: Tpl, ru: Tpl): L10n => L(en(x => fmt(x, 'en')), ru(x => fmt(x, 'ru')));
const S = 'dist-2x2' as const;
const base = { skill: S, topic: 'estimation' as const };

const tensOf = (a: number) => Math.floor(a / 10) * 10;
const onesOf = (a: number) => a % 10;
const twoDigit = (rng: Rng, loT: number, hiT: number) => 10 * int(rng, loT, hiT) + int(rng, 1, 9);
// a pair whose tens × tens basic fact ends in 0, like 20 × 50 (2 × 5 = 10): the zero she lost on p. 51
const ZERO_TENS: [number, number][] = [[2, 5], [4, 5], [5, 6], [5, 8], [5, 2], [6, 5], [8, 5], [5, 4]];
const zeroPair = (rng: Rng, maxLeft = 9) => {
    const [x, y] = pick(rng, ZERO_TENS.filter(([p]) => p <= maxLeft));
    return { a: 10 * x + int(rng, 1, 9), b: 10 * y + int(rng, 1, 9) };
};

// the four boxes of an area model: tens × tens, ones × tens, tens × ones, ones × ones (the order of Another Look); a part of 0 drops out
const boxes = (a: number, b: number): { x: number; y: number; p: number }[] => {
    const out: { x: number; y: number; p: number }[] = [];
    for (const y of [tensOf(b), onesOf(b)]) for (const x of [tensOf(a), onesOf(a)]) if (x && y) out.push({ x, y, p: x * y });
    return out;
};

// the zero rule said out loud whenever a basic fact already ends in 0
const zeroNote = (x: number, y: number): L10n[] => {
    if (x < 10 || y < 10 || ((x / 10) * (y / 10)) % 10 !== 0) return [];
    return [L(`Careful with ${x} × ${y}: ${x / 10} × ${y / 10} = ${(x / 10) * (y / 10)}, then write the two zeros of ${x} and ${y}: ${fmt(x * y, 'en')}. The 0 of ${(x / 10) * (y / 10)} is not one of them.`,
        `Осторожно с ${x} × ${y}: ${x / 10} × ${y / 10} = ${(x / 10) * (y / 10)}, потом допиши два нуля от ${x} и ${y}: ${fmt(x * y, 'ru')}. Ноль в ${(x / 10) * (y / 10)} - не из них.`)];
};

// add the partial products in a column: the tens with their carry, said out loud
const addLine = (ps: number[], total: number): L10n => {
    const tens = ps.reduce((s, p) => s + Math.floor((p % 100) / 10), 0) + Math.floor(ps.reduce((s, p) => s + (p % 10), 0) / 10);
    return L(`Add in a column, ones under ones and tens under tens: ${ps.map(p => fmt(p, 'en')).join(' + ')} = ${fmt(total, 'en')}${tens >= 10 ? ` (the tens make ${tens} tens: write ${tens % 10}, carry ${Math.floor(tens / 10)})` : ''}.`,
        `Складывай столбиком, единицы под единицами, десятки под десятками: ${ps.map(p => fmt(p, 'ru')).join(' + ')} = ${fmt(total, 'ru')}${tens >= 10 ? ` (десятков набралось ${tens}: пишем ${tens % 10}, ${Math.floor(tens / 10)} переносим)` : ''}.`);
};
const checkLine = (a: number, b: number): L10n => {
    const ra = roundTo(a, 10), rb = roundTo(b, 10);
    return L(`Check with an estimate: ${a} × ${b} is about ${ra} × ${rb} = ${fmt(ra * rb, 'en')}, close to ${fmt(a * b, 'en')} ✓`,
        `Проверь прикидкой: ${a} × ${b} - это примерно ${ra} × ${rb} = ${fmt(ra * rb, 'ru')}, близко к ${fmt(a * b, 'ru')} ✓`);
};
const areaSteps = (a: number, b: number): L10n[] => {
    const bx = boxes(a, b);
    const split = (x: number) => (onesOf(x) ? `${tensOf(x)} + ${onesOf(x)}` : `${x}`);
    return [
        L(`Break apart by place value: ${a} = ${split(a)}, ${b} = ${split(b)}.`, `Разбей по разрядам: ${a} = ${split(a)}, ${b} = ${split(b)}.`),
        ...bx.flatMap(({ x, y, p }) => [X(n => `${x} × ${y} = ${n(p)}`), ...zeroNote(x, y)]),
        addLine(bx.map(x => x.p), a * b),
        checkLine(a, b),
    ];
};
const areaHint = (a: number, b: number): L10n => L(`Each box is the number on its side times the number on its top. Count the zeros: 20 × 50 = 1,000. Then add the boxes in a column.`,
    `Каждая клетка - число сбоку умножить на число сверху. Считай нули: 20 × 50 = 1 000. Потом сложи клетки столбиком.`);

// ---------- problems 1-3: the area model is drawn, fill in the boxes ----------

const makeArea = (rng: Rng): Problem => {
    const { a, b } = rng() < 0.5 ? zeroPair(rng, 2) : { a: twoDigit(rng, 1, 2), b: twoDigit(rng, 1, 5) };
    // rows are the parts of a, columns the parts of b
    const values = [tensOf(a) * tensOf(b), tensOf(a) * onesOf(b), onesOf(a) * tensOf(b), onesOf(a) * onesOf(b), a * b];
    return {
        ...base, id: `${S}:area:${a}:${b}`,
        prompt: L(`Use the area model to find ${a} × ${b}. ${a} is on the left (${tensOf(a)} and ${onesOf(a)}), ${b} is on top (${tensOf(b)} and ${onesOf(b)}). Fill in every box, then add.`,
            `Найди ${a} × ${b} с помощью модели площади. Слева ${a} (${tensOf(a)} и ${onesOf(a)}), сверху ${b} (${tensOf(b)} и ${onesOf(b)}). Заполни каждую клетку, потом сложи.`),
        answer: { kind: 'fill', layout: 'area', values, top: [String(tensOf(b)), String(onesOf(b))], left: [String(tensOf(a)), String(onesOf(a))], cells: [[0, 1], [2, 3]], total: 4 },
        steps: areaSteps(a, b), hint: areaHint(a, b), visual: { kind: 'area', a: b, b: a },
        data: { a, b, value: a * b, style: 'area' },
    };
};

// ---------- Another Look: the Distributive Property written as equations ----------

const makeDist = (rng: Rng): Problem => {
    const { a, b } = rng() < 0.4 ? zeroPair(rng) : { a: twoDigit(rng, 1, 6), b: twoDigit(rng, 1, 6) };
    const [at, ao, bt, bo] = [tensOf(a), onesOf(a), tensOf(b), onesOf(b)];
    const ps = [at * bt, ao * bt, at * bo, ao * bo];
    const lines: FillLine[] = [
        { parts: [`${a} × ${b} = (${at} + ${ao}) × (${bt} + ${bo})`] },
        { parts: [`= (${at} + ${ao}) × ${bt} + (${at} + ${ao}) × ${bo}`] },
        { parts: [`= (${at} × ${bt}) + (${ao} × ${bt}) + (${at} × ${bo}) + (${ao} × ${bo})`] },
        { parts: ['= ', B(0), ' + ', B(1), ' + ', B(2), ' + ', B(3)] },
        { parts: ['= ', B(4)] },
    ];
    return {
        ...base, id: `${S}:dist:${a}:${b}`,
        prompt: L(`Use the Distributive Property to find ${a} × ${b}. Break apart both factors, multiply every part of ${a} by every part of ${b}, then add.`,
            `Найди ${a} × ${b} с помощью распределительного свойства. Разбей оба множителя, умножь каждую часть ${a} на каждую часть ${b}, потом сложи.`),
        answer: { kind: 'fill', layout: 'lines', values: [...ps, a * b], lines },
        steps: [...areaSteps(a, b)],
        hint: L(`Four products: ${at} × ${bt}, ${ao} × ${bt}, ${at} × ${bo}, ${ao} × ${bo}. Each part of ${a} meets each part of ${b} once.`,
            `Четыре произведения: ${at} × ${bt}, ${ao} × ${bt}, ${at} × ${bo}, ${ao} × ${bo}. Каждая часть ${a} встречается с каждой частью ${b} один раз.`),
        visual: { kind: 'area', a: b, b: a },
        data: { a, b, value: a * b, style: 'dist' },
    };
};

// ---------- problems 4-13: draw an area model, find each product ----------

const makeProduct = (rng: Rng): Problem => {
    const r = rng();
    // a factor of 10 like 10 × 18 (she multiplied the parts of 18 by 18), a zero pair like 21 × 51, or any 2-digit pair
    const { a, b } = r < 0.2 ? { a: 10 * int(rng, 1, 3), b: twoDigit(rng, 1, 6) } : r < 0.5 ? zeroPair(rng) : { a: twoDigit(rng, 1, 9), b: twoDigit(rng, 1, 6) };
    const flip = rng() < 0.3;
    const expr = flip ? `${b} × ${a}` : `${a} × ${b}`;
    const ten = onesOf(a) === 0;
    return {
        ...base, id: `${S}:product:${a}:${b}:${flip ? 'f' : 'n'}`,
        prompt: L(`Draw an area model to find ${expr}. Use properties of operations.`, `Нарисуй модель площади и найди ${expr}. Используй свойства действий.`),
        answer: { kind: 'number', value: a * b },
        steps: [
            ...(ten ? [L(`${a} has no ones, so break apart only ${b} and keep ${a} whole: ${a} × ${b} = (${a} × ${tensOf(b)}) + (${a} × ${onesOf(b)}).`,
                `У ${a} нет единиц, значит разбиваем только ${b}, а ${a} оставляем целым: ${a} × ${b} = (${a} × ${tensOf(b)}) + (${a} × ${onesOf(b)}).`)] : []),
            ...areaSteps(a, b),
        ],
        hint: ten ? L(`Break ${b} into ${tensOf(b)} + ${onesOf(b)} and multiply each part by ${a}, not by ${b}.`, `Разбей ${b} на ${tensOf(b)} + ${onesOf(b)} и умножь каждую часть на ${a}, а не на ${b}.`) : areaHint(a, b),
        visual: { kind: 'area', a: b, b: a },
        data: { a, b, value: a * b, style: 'product' },
    };
};

// ---------- problem 14: equal groups in a story ----------

type Story = (n: number, k: number) => L10n;
const STORIES: Story[] = [
    (n, k) => L(`There are ${n} students in Ms. Langley's class. Each student is assigned ${k} different math problems. How many math problems are assigned to the whole class?`,
        `В классе миссис Лэнгли ${n} ${ruPlural(n, 'ученик', 'ученика', 'учеников')}. Каждому задали ${k} ${ruPlural(k, 'задачу', 'задачи', 'задач')} по математике. Сколько задач задали всему классу?`),
    (n, k) => L(`${AMELIIA.en}'s class has ${n} students. Each student brings ${k} pencils for the year. How many pencils is that?`,
        `В классе у ${AMELIIA.ruGen} ${n} ${ruPlural(n, 'ученик', 'ученика', 'учеников')}. Каждый приносит на год ${k} ${ruPlural(k, 'карандаш', 'карандаша', 'карандашей')}. Сколько всего карандашей?`),
    (n, k) => L(`Pip plants ${n} rows of carrots with ${k} carrots in each row. How many carrots does Pip plant?`,
        `Пип сажает ${n} ${ruPlural(n, 'ряд', 'ряда', 'рядов')} моркови, по ${k} в каждом ряду. Сколько морковок посадит Пип?`),
];

const makeStory = (rng: Rng): Problem => {
    const i = int(rng, 0, STORIES.length - 1), n = twoDigit(rng, 1, 3), k = twoDigit(rng, 1, 2), p = n * k;
    return {
        ...base, id: `${S}:story:${i}:${n}:${k}`,
        prompt: STORIES[i](n, k),
        answer: { kind: 'number', value: p },
        steps: [L(`Equal groups: ${n} groups of ${k}, so multiply ${n} × ${k}.`, `Одинаковые группы: ${n} ${ruPlural(n, 'группа', 'группы', 'групп')} по ${k}, значит умножаем ${n} × ${k}.`), ...areaSteps(n, k)],
        hint: L(`The same number for each one: multiply. ${areaHint(n, k).en}`, `Каждому одинаково: умножай. ${areaHint(n, k).ru}`),
        visual: { kind: 'area', a: k, b: n },
        data: { a: n, b: k, value: p, style: 'story' },
    };
};

// ---------- problem 15: two days at the arena ----------

const EVENTS: [L10n, L10n, L10n][] = [
    [L('An arena hosts a concert on Friday and a rodeo on Saturday', 'На арене в пятницу концерт, а в субботу родео'), L('the concert', 'на концерт'), L('the rodeo', 'на родео')],
    [L('A stadium hosts a soccer game on Friday and a fair on Saturday', 'На стадионе в пятницу футбол, а в субботу ярмарка'), L('the game', 'на футбол'), L('the fair', 'на ярмарку')],
];

const makeAdd = (rng: Rng): Problem => {
    const i = int(rng, 0, EVENTS.length - 1), [what, e1, e2] = EVENTS[i];
    const x = int(rng, 10001, 19999), y = int(rng, 5001, 9999), s = x + y;
    return {
        ...base, id: `${S}:add:${i}:${x}:${y}`,
        prompt: L(`${what.en}. If ${fmt(x, 'en')} people attend ${e1.en} and ${fmt(y, 'en')} attend ${e2.en}, how many people visit on Friday and Saturday?`,
            `${what.ru}. ${fmt(x, 'ru')} ${ruPlural(x, 'человек', 'человека', 'человек')} пришли ${e1.ru} и ${fmt(y, 'ru')} ${e2.ru}. Сколько людей пришло в пятницу и субботу вместе?`),
        answer: { kind: 'number', value: s },
        steps: [
            L('Both days together: add.', 'Оба дня вместе: складываем.'),
            L(`Write ${fmt(y, 'en')} under ${fmt(x, 'en')}, ones under ones, and add from the ones, carrying when a place makes 10 or more.`, `Запиши ${fmt(y, 'ru')} под ${fmt(x, 'ru')}, единицы под единицами, и складывай с единиц, перенося, если в разряде 10 или больше.`),
            X(n => `${n(x)} + ${n(y)} = ${n(s)}`),
            W(n => `Check: about ${n(roundTo(x, 1000))} + ${n(roundTo(y, 1000))} = ${n(roundTo(x, 1000) + roundTo(y, 1000))} ✓`, n => `Проверка: примерно ${n(roundTo(x, 1000))} + ${n(roundTo(y, 1000))} = ${n(roundTo(x, 1000) + roundTo(y, 1000))} ✓`),
        ],
        hint: L('Line up the places, ones under ones, then add from the right.', 'Выровняй разряды, единицы под единицами, и складывай справа.'),
        data: { x, y, value: s, style: 'add' },
    };
};

// ---------- problem 16: number sense, about how much money ----------

const makeFerry = (rng: Rng): Problem => {
    let people = int(rng, 51, 89), cars = int(rng, 31, 59);
    while (people % 10 === 5) people = int(rng, 51, 89);
    while (cars % 10 === 5) cars = int(rng, 31, 59);
    const pp = int(rng, 2, 5), pc = int(rng, 21, 39);
    const rp = roundTo(people, 10), rcar = roundTo(cars, 10), est = rp * pp + rcar * pc;
    const usd = (x: number) => W(n => `About $${n(x)}`, n => `Примерно $${n(x)}`);
    const right = usd(est);
    // forgot the people, added people and cars first, used the people price for the cars too
    const wrong = [usd(rcar * pc), usd((rp + rcar) * pc), usd((rp + rcar) * pp)];
    return {
        ...base, id: `${S}:ferry:${people}:${cars}:${pp}:${pc}`,
        prompt: L(`Number Sense: on one trip, ${people} people and ${cars} cars rode the ferry. The ferry costs $${pp} per person and $${pc} per car. About how much money did the ferry service collect for the one trip? Round the numbers of people and cars to the nearest ten.`,
            `Чувство числа: в один рейс на пароме плыли ${people} ${ruPlural(people, 'человек', 'человека', 'человек')} и ${cars} ${ruPlural(cars, 'машина', 'машины', 'машин')}. Паром стоит $${pp} с человека и $${pc} с машины. Примерно сколько денег собрал паром за этот рейс? Округли число людей и машин до десятков.`),
        answer: choice(rng, right, wrong),
        steps: [
            L(`"About" asks for an estimate. People and cars pay different prices: find each, then add.`, `«Примерно» - значит прикидка. Люди и машины платят по-разному: найди каждое, потом сложи.`),
            W(n => `People: ${people} is about ${rp}, ${rp} × $${pp} = $${n(rp * pp)}`, n => `Люди: ${people} - это примерно ${rp}, ${rp} × $${pp} = $${n(rp * pp)}`),
            W(n => `Cars: ${cars} is about ${rcar}, ${rcar} × $${pc} = $${n(rcar * pc)}`, n => `Машины: ${cars} - это примерно ${rcar}, ${rcar} × $${pc} = $${n(rcar * pc)}`),
            X(n => `$${n(rp * pp)} + $${n(rcar * pc)} = $${n(est)}`),
        ],
        hint: L('Two kinds of tickets: multiply each kind by its own price, then add.', 'Два вида билетов: умножь каждый на свою цену, потом сложи.'),
        data: { people, cars, pp, pc, est, style: 'ferry' },
    };
};

// ---------- problem 17: are there enough index cards? ----------

const makeEnough = (rng: Rng): Problem => {
    const s = int(rng, 21, 29), w = int(rng, 41, 69), need = s * w, enough = rng() < 0.5;
    const have = enough ? roundTo(need, 100) + (roundTo(need, 100) > need ? 0 : 100) : roundTo(need, 100) - (roundTo(need, 100) < need ? 0 : 100);
    const diff = Math.abs(have - need);
    const yes = L(`Yes: ${s} × ${w} = ${fmt(need, 'en')} cards are needed, and ${fmt(have, 'en')} is ${diff} more than that`, `Да: нужно ${s} × ${w} = ${fmt(need, 'ru')} карточек, а у него ${fmt(have, 'ru')}, на ${diff} больше`);
    const no = L(`No: ${s} × ${w} = ${fmt(need, 'en')} cards are needed, ${diff} more than ${fmt(have, 'en')}`, `Нет: нужно ${s} × ${w} = ${fmt(need, 'ru')} карточек, это на ${diff} больше, чем ${fmt(have, 'ru')}`);
    return {
        ...base, id: `${S}:enough:${s}:${w}:${have}`,
        prompt: L(`Higher Order Thinking: Mr. Buckham teaches vocabulary to a class of ${s} fourth-grade students. There are ${w} new vocabulary words. Each student writes one word and its definition on an index card. Mr. Buckham has ${fmt(have, 'en')} index cards. Does he have enough cards for all the students? Explain.`,
            `Подумай: мистер Бакхэм учит словам класс из ${s} четвероклассников. Новых слов ${w}. Каждый ученик пишет каждое слово с определением на отдельной карточке. У мистера Бакхэма ${fmt(have, 'ru')} карточек. Хватит ли их на всех учеников? Объясни.`),
        answer: choice(rng, enough ? yes : no, [enough ? L(`No: ${fmt(have, 'en')} is less than the cards needed`, `Нет: ${fmt(have, 'ru')} меньше, чем нужно`) : L(`Yes: ${fmt(have, 'en')} cards is a lot`, `Да: ${fmt(have, 'ru')} карточек - это много`),
            L(`Yes: ${s} + ${w} cards are needed`, `Да: нужно ${s} + ${w} карточек`),
            L('You cannot tell without counting the cards one by one', 'Нельзя сказать, не пересчитав карточки по одной')]),
        steps: [
            L(`Every student writes every word: ${s} students × ${w} words.`, `Каждый ученик пишет каждое слово: ${s} учеников × ${w} слов.`),
            ...areaSteps(s, w),
            enough ? L(`${fmt(need, 'en')} is less than ${fmt(have, 'en')}: enough, with ${diff} cards left over.`, `${fmt(need, 'ru')} меньше, чем ${fmt(have, 'ru')}: хватит, и ${diff} останется.`)
                : L(`${fmt(need, 'en')} is more than ${fmt(have, 'en')}: not enough, ${diff} cards short.`, `${fmt(need, 'ru')} больше, чем ${fmt(have, 'ru')}: не хватит ${diff} карточек.`),
        ],
        hint: L(`Find how many cards are needed: ${s} × ${w}. Then compare with ${fmt(have, 'en')}.`, `Найди, сколько карточек нужно: ${s} × ${w}. Потом сравни с ${fmt(have, 'ru')}.`),
        data: { s, w, need, have, enough: enough ? 1 : 0, style: 'enough' },
    };
};

// ---------- problem 18: select all the partial products ----------

const makePartials = (rng: Rng): Problem => {
    const a = twoDigit(rng, 1, 1), b = twoDigit(rng, 2, 4);
    const [at, ao, bt, bo] = [tensOf(a), onesOf(a), tensOf(b), onesOf(b)];
    const set = (xs: number[]) => X(n => xs.map(n).join('; '));
    const big = at * bt, mid1 = ao * bt, mid2 = at * bo, small = ao * bo;
    const right = [set([big, mid1, mid2, small]), set([small, mid1, mid2, big])];
    // lost zeros, extra zeros, and the sum of the parts mixed in
    const wrong = [set([big, mid1 / 10, mid2 / 10, small]), set([big * 10, mid1 * 10, mid2, small]), set([a + b, mid2, mid1 / 10, big * 10])];
    return {
        ...base, id: `${S}:partials:${a}:${b}`,
        prompt: L(`Select all of the partial products which would be used to find ${a} × ${b}.`, `Отметь все наборы частичных произведений, которые нужны, чтобы найти ${a} × ${b}.`),
        answer: multi(rng, right, wrong),
        steps: [
            L(`${a} = ${at} + ${ao}, ${b} = ${bt} + ${bo}.`, `${a} = ${at} + ${ao}, ${b} = ${bt} + ${bo}.`),
            X(n => `${at} × ${bt} = ${n(big)}, ${ao} × ${bt} = ${mid1}, ${at} × ${bo} = ${mid2}, ${ao} × ${bo} = ${small}`),
            L('The order does not matter: two sets have the same four numbers.', 'Порядок не важен: в двух наборах одни и те же четыре числа.'),
            addLine([big, mid1, mid2, small], a * b),
        ],
        hint: L(`Find the four products yourself first, then look for every set with exactly those numbers, in any order.`, `Сначала найди четыре произведения сама, потом ищи все наборы ровно с этими числами, в любом порядке.`),
        data: { a, b, style: 'partials' },
    };
};

// ---------- problem 19: select all the ways to break apart ----------

const makeWays = (rng: Rng): Problem => {
    const b = 10 * int(rng, 1, 3) + int(rng, 6, 9);
    let a = 10 * int(rng, 2, 6) + int(rng, 1, 9);
    // a × a must stay a wrong option
    while (a === b) a = 10 * int(rng, 2, 6) + int(rng, 1, 9);
    const [at, ao, bt, bo] = [tensOf(a), onesOf(a), tensOf(b), onesOf(b)], up = bt + 10;
    const right = [
        L(`${a} × (${up} − ${up - b})`, `${a} × (${up} − ${up - b})`),
        L(`(${at} × ${bt}) + (${at} × ${bo}) + (${ao} × ${bt}) + (${ao} × ${bo})`, `(${at} × ${bt}) + (${at} × ${bo}) + (${ao} × ${bt}) + (${ao} × ${bo})`),
        L(`(${at} × ${b}) + (${ao} × ${b})`, `(${at} × ${b}) + (${ao} × ${b})`),
    ];
    // only the two big pieces; tens and ones of the same factor; the parts of a multiplied by a, like 10 × 18 done as 18 × 18
    const wrong = [
        L(`(${at} × ${bt}) + (${ao} × ${bo})`, `(${at} × ${bt}) + (${ao} × ${bo})`),
        L(`(${at} × ${ao}) + (${bt} × ${bo})`, `(${at} × ${ao}) + (${bt} × ${bo})`),
        L(`(${a} × ${at}) + (${a} × ${ao})`, `(${a} × ${at}) + (${a} × ${ao})`),
    ];
    return {
        ...base, id: `${S}:ways:${a}:${b}`,
        prompt: L(`Select all of the ways you can use breaking apart and the Distributive Property to find the product of ${a} × ${b}.`,
            `Отметь все способы найти ${a} × ${b}, разбивая числа на части с помощью распределительного свойства.`),
        answer: multi(rng, right, wrong.slice(0, rng() < 0.5 ? 3 : 2)),
        steps: [
            W(n => `${b} = ${up} − ${up - b}, so ${a} × (${up} − ${up - b}) = ${n(a * up)} − ${n(a * (up - b))} = ${n(a * b)} ✓`, n => `${b} = ${up} − ${up - b}, значит ${a} × (${up} − ${up - b}) = ${n(a * up)} − ${n(a * (up - b))} = ${n(a * b)} ✓`),
            W(n => `Four boxes: ${n(at * bt)} + ${n(at * bo)} + ${n(ao * bt)} + ${n(ao * bo)} = ${n(a * b)} ✓`, n => `Четыре клетки: ${n(at * bt)} + ${n(at * bo)} + ${n(ao * bt)} + ${n(ao * bo)} = ${n(a * b)} ✓`),
            W(n => `Break only ${a}: (${at} × ${b}) + (${ao} × ${b}) = ${n(at * b)} + ${n(ao * b)} = ${n(a * b)} ✓`, n => `Разбить только ${a}: (${at} × ${b}) + (${ao} × ${b}) = ${n(at * b)} + ${n(ao * b)} = ${n(a * b)} ✓`),
            L(`(${at} × ${bt}) + (${ao} × ${bo}) forgets two boxes, and (${at} × ${ao}) + (${bt} × ${bo}) multiplies parts of the same number.`,
                `(${at} × ${bt}) + (${ao} × ${bo}) забывает две клетки, а (${at} × ${ao}) + (${bt} × ${bo}) умножает части одного и того же числа.`),
        ],
        hint: L(`A right way uses every part of ${a} with every part of ${b}, or keeps one factor whole and breaks the other.`, `Верный способ умножает каждую часть ${a} на каждую часть ${b} или оставляет один множитель целым, а другой разбивает.`),
        data: { a, b, style: 'ways' },
    };
};

export const makeTopic4Area = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_4_5, want);
    if (style === 'area') return makeArea(rng);
    if (style === 'dist') return makeDist(rng);
    if (style === 'product') return makeProduct(rng);
    if (style === 'story') return makeStory(rng);
    if (style === 'add') return makeAdd(rng);
    if (style === 'ferry') return makeFerry(rng);
    if (style === 'enough') return makeEnough(rng);
    if (style === 'partials') return makePartials(rng);
    return makeWays(rng);
};
