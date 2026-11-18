/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, int, multi, pick, pickStyle, ruPlural, shuffle } from './core';

// Topic 5, Lesson 5-5 of her class (Savvas enVision "Use Partial Quotients to Divide"), Additional Practice 5-5,
// homework of 2026-11-17 (4.NBT.B.6):
// - ladder: 4)92 with partial quotients, the tens first, then the ones, add them (problems 1-12)
// - groups: City Clean-Up Day, 48 volunteers in groups of 3, the same ladder in a story (Another Look)
// - range: Nina's 78 treats, 3 in each bag: fewer than 10 bags, 10 to 20, 20 to 30 or more than 30 (problem 13)
// - bar: Victor's 96 laps, 8 laps make a mile: a bar diagram, write and solve the equation (problem 14)
// - compare: Georgena's 84 pictures, 4 or 6 on a page, how many more pages (problem 15)
// - equal: Ryan's 85 pennies for 4 friends, can he share them equally (problem 16)
// - combos: select all the combinations of partial quotients that find 74 ÷ 2 (problem 17)
// - missing: the Distributive Property, 95 ÷ 5 = (50 + ▢) ÷ 5, the missing number (problem 18)
// The sheet came blank, so the tricky spots are the usual slips of partial quotients: a quotient that is the last
// partial quotient only, a rest that still holds the divisor, 10 × 4 written as 400, and a remainder that is "equal"

export const KINDS_5_5 = ['ladder', 'groups', 'range', 'bar', 'compare', 'equal', 'combos', 'missing'] as const;
type Kind = (typeof KINDS_5_5)[number];

const B = (b: number): FillPart => ({ b });
const E = (echo: number): FillPart => ({ echo });
const S = 'part-quot' as const;
const base = { skill: S, topic: 'estimation' as const };

// a 2-digit dividend that the divisor divides evenly, a 2-digit quotient that is not a whole number of tens (like the
// twelve problems of the sheet: 92 ÷ 4 = 23, 57 ÷ 3 = 19, 91 ÷ 7 = 13)
const pair = (rng: Rng) => {
    for (;;) {
        const d = int(rng, 2, 9), q = int(rng, 11, Math.min(49, Math.floor(99 / d)));
        if (q % 10 === 0) continue;
        return { d, q, n: d * q };
    }
};
const tensOf = (q: number) => Math.floor(q / 10) * 10;
const enS = (d: number) => `${d}s`;

// ---------- the ladder sheet: the biggest number of tens first, then the ones, add the partial quotients ----------

const ladderLines = (n: number, d: number): FillLine[] => [
    { label: L(`Tens: the biggest number of tens of ${d} that fits in ${n}`, `Десятки: самое большое число десятков по ${d}, которое помещается в ${n}`), parts: [B(0), ` × ${d} = `, B(1)] },
    { label: L('Subtract: what is left', 'Вычти: сколько осталось'), parts: [`${n} − `, E(1), ' = ', B(2)] },
    { label: L(`Ones: how many ${enS(d)} are in what is left`, `Единицы: сколько раз по ${d} в остатке`), parts: [B(3), ` × ${d} = `, B(4)] },
    { label: L('Subtract again: nothing left', 'Вычти ещё раз: ничего не осталось'), parts: [E(2), ' − ', E(4), ' = 0'] },
    { label: L('Quotient: add the partial quotients', 'Частное: сложи частичные частные'), parts: [E(0), ' + ', E(3), ' = ', B(5)] },
];
const ladderValues = (n: number, d: number) => {
    const q = n / d, tens = tensOf(q), ones = q - tens;
    return [tens, tens * d, n - tens * d, ones, ones * d, q];
};
const ladderSteps = (n: number, d: number): L10n[] => {
    const q = n / d, tens = tensOf(q), ones = q - tens, rest = n - tens * d, big = tens + 10;
    return [
        L(`Estimate: how many ${enS(d)} are in ${n}? Try tens: ${tens} × ${d} = ${tens * d} fits, ${big} × ${d} = ${big * d} is too big. The first partial quotient is ${tens}.`,
            `Прикинь: сколько раз по ${d} в ${n}? Пробуй десятки: ${tens} × ${d} = ${tens * d} помещается, ${big} × ${d} = ${big * d} - слишком много. Первое частичное частное: ${tens}.`),
        L(`Subtract: ${n} − ${tens * d} = ${rest}.`, `Вычти: ${n} − ${tens * d} = ${rest}.`),
        L(`${rest} is less than ${tens * d}, but ${d} still fits: how many ${enS(d)} are in ${rest}? ${d} × ${ones} = ${rest}. The second partial quotient is ${ones}.`,
            `${rest} меньше, чем ${tens * d}, но ${d} ещё помещается: сколько раз по ${d} в ${rest}? ${d} × ${ones} = ${rest}. Второе частичное частное: ${ones}.`),
        L(`Subtract: ${rest} − ${rest} = 0. Nothing is left, so stop.`, `Вычти: ${rest} − ${rest} = 0. Ничего не осталось, значит стоп.`),
        L(`Add the partial quotients: ${tens} + ${ones} = ${q}. So ${n} ÷ ${d} = ${q}.`, `Сложи частичные частные: ${tens} + ${ones} = ${q}. Значит ${n} ÷ ${d} = ${q}.`),
        L(`Check: ${q} × ${d} = ${n} ✓`, `Проверка: ${q} × ${d} = ${n} ✓`),
    ];
};
const ladderHint = (d: number) => L(`Tens first: 10 × ${d}, 20 × ${d} ... the biggest that still fits. Then the ones. The quotient is the SUM of the partial quotients, not the last one.`,
    `Сначала десятки: 10 × ${d}, 20 × ${d} ... самое большое, что ещё помещается. Потом единицы. Частное - это СУММА частичных частных, а не последнее из них.`);

const makeLadder = (rng: Rng): Problem => {
    const { d, n } = pair(rng);
    return {
        ...base, id: `${S}:ladder:${n}:${d}`,
        prompt: L(`Use partial quotients to divide ${n} ÷ ${d}. Take the tens first, then the ones, then add the partial quotients.`, `Раздели ${n} ÷ ${d} частичными частными. Сначала возьми десятки, потом единицы, потом сложи частичные частные.`),
        answer: { kind: 'fill', layout: 'lines', values: ladderValues(n, d), lines: ladderLines(n, d) },
        steps: ladderSteps(n, d), hint: ladderHint(d),
        data: { n, d, style: 'ladder' },
    };
};

// ---------- Another Look: equal groups in a story ----------

type Story = { en: (n: number, d: number) => string; ru: (n: number, d: number) => string; what: L10n };
const STORIES: Story[] = [
    { en: (n, d) => `On City Clean-Up Day, ${n} people volunteered to clean up the city park. The volunteers worked in groups of ${d}. How many groups cleaned up the city park?`,
        ru: (n, d) => `В день уборки города ${n} ${ruPlural(n, 'доброволец', 'добровольца', 'добровольцев')} вышли убирать парк. Они работали группами по ${d}. Сколько групп убирало парк?`, what: L('groups', 'групп') },
    { en: (n, d) => `${n} first-year wizards came to the flying lesson. The teacher puts them in rows of ${d} brooms. How many rows are there?`,
        ru: (n, d) => `На урок полётов пришли ${n} ${ruPlural(n, 'первокурсник', 'первокурсника', 'первокурсников')}. Учитель ставит их рядами по ${d} ${ruPlural(d, 'метле', 'метлы', 'мётел')}. Сколько получится рядов?`, what: L('rows', 'рядов') },
    { en: (n, d) => `The school owlery got ${n} letters. Each owl carries ${d} letters. How many owls fly out?`,
        ru: (n, d) => `В школьную совятню принесли ${n} ${ruPlural(n, 'письмо', 'письма', 'писем')}. Каждая сова несёт по ${d} ${ruPlural(d, 'письмо', 'письма', 'писем')}. Сколько сов вылетит?`, what: L('owls', 'сов') },
    { en: (n, d) => `${n} chocolate frogs are packed ${d} to a box for the train. How many boxes are packed?`,
        ru: (n, d) => `${n} ${ruPlural(n, 'шоколадную лягушку', 'шоколадные лягушки', 'шоколадных лягушек')} раскладывают по ${d} в коробку для поезда. Сколько коробок получится?`, what: L('boxes', 'коробок') },
    { en: (n, d) => `${n} gymnasts came to the meet. They warm up in groups of ${d}. How many groups warm up?`,
        ru: (n, d) => `На соревнования приехали ${n} ${ruPlural(n, 'гимнастка', 'гимнастки', 'гимнасток')}. Они разминаются группами по ${d}. Сколько групп разминается?`, what: L('groups', 'групп') },
];

const makeGroups = (rng: Rng): Problem => {
    const { d, n, q } = pair(rng), s = pick(rng, STORIES), i = STORIES.indexOf(s);
    return {
        ...base, id: `${S}:groups:${i}:${n}:${d}`,
        prompt: L(`${s.en(n, d)} Use partial quotients: ${n} ÷ ${d}.`, `${s.ru(n, d)} Используй частичные частные: ${n} ÷ ${d}.`),
        answer: { kind: 'fill', layout: 'lines', values: ladderValues(n, d), lines: ladderLines(n, d) },
        steps: [
            L(`Equal groups of ${d} out of ${n}: that is division, ${n} ÷ ${d}.`, `Равные группы по ${d} из ${n}: это деление, ${n} ÷ ${d}.`),
            ...ladderSteps(n, d),
            L(`Answer: ${q} ${s.what.en}.`, `Ответ: ${q} ${s.what.ru}.`),
        ],
        hint: ladderHint(d),
        data: { n, d, style: 'groups' },
    };
};

// ---------- problem 13: fewer than 10, between 10 and 20, between 20 and 30, more than 30 ----------

type Fill = { en: (n: number, d: number) => string; ru: (n: number, d: number) => string; thing: L10n };
const FILLS: Fill[] = [
    { en: (n, d) => `For her party, Nina has ${n} treats in all and puts ${d} treats in each bag.`, ru: (n, d) => `Для праздника у Нины ${n} ${ruPlural(n, 'угощение', 'угощения', 'угощений')}, и она кладёт по ${d} в каждый пакет.`, thing: L('bags', 'пакетов') },
    { en: (n, d) => `Hermione has ${n} quills and puts ${d} quills in each box.`, ru: (n, d) => `У Гермионы ${n} ${ruPlural(n, 'перо', 'пера', 'перьев')}, и она кладёт по ${d} в каждую коробку.`, thing: L('boxes', 'коробок') },
    { en: (n, d) => `Hagrid has ${n} pumpkins and loads ${d} pumpkins on each cart.`, ru: (n, d) => `У Хагрида ${n} ${ruPlural(n, 'тыква', 'тыквы', 'тыкв')}, и он грузит по ${d} на каждую тележку.`, thing: L('carts', 'тележек') },
];
const BANDS: [number, number][] = [[0, 10], [10, 20], [20, 30], [30, 100]];
const bandText = (b: number, thing: L10n): L10n => (b === 0 ? L(`Fewer than 10 ${thing.en}`, `Меньше 10 ${thing.ru}`) : b === 3 ? L(`More than 30 ${thing.en}`, `Больше 30 ${thing.ru}`) : L(`Between ${BANDS[b][0]} and ${BANDS[b][1]} ${thing.en}`, `От ${BANDS[b][0]} до ${BANDS[b][1]} ${thing.ru}`));

const makeRange = (rng: Rng): Problem => {
    const d = int(rng, 2, 9), f = pick(rng, FILLS), i = FILLS.indexOf(f);
    let q: number, r: number, n: number;
    for (;;) {
        q = int(rng, 5, Math.min(49, Math.floor(99 / d))); r = int(rng, 0, d - 1); n = d * q + r;
        if (q % 10 !== 0 && n <= 99) break;
    }
    const band = q < 10 ? 0 : q < 20 ? 1 : q < 30 ? 2 : 3;
    const lo = BANDS[band][0], hi = BANDS[band][1];
    return {
        ...base, id: `${S}:range:${i}:${n}:${d}`,
        prompt: L(`Number Sense: ${f.en(n, d)} Can she fill fewer than 10 ${f.thing.en}, between 10 and 20, between 20 and 30, or more than 30 ${f.thing.en}?`,
            `Чувство числа: ${f.ru(n, d)} Получится меньше 10 ${f.thing.ru}, от 10 до 20, от 20 до 30 или больше 30 ${f.thing.ru}?`),
        answer: choice(rng, bandText(band, f.thing), [0, 1, 2, 3].filter(b => b !== band).map(b => bandText(b, f.thing))),
        steps: [
            L(`${f.thing.en.charAt(0).toUpperCase()}${f.thing.en.slice(1)} = ${n} ÷ ${d}. No need for the exact answer: use the tens.`, `${f.thing.ru} = ${n} ÷ ${d}. Точный ответ не нужен: считай десятками.`),
            L(`${d} × 10 = ${d * 10}, ${d} × 20 = ${d * 20}, ${d} × 30 = ${d * 30}.`, `${d} × 10 = ${d * 10}, ${d} × 20 = ${d * 20}, ${d} × 30 = ${d * 30}.`),
            band === 0
                ? L(`${n} is less than ${d * 10}, so fewer than 10 ${f.thing.en}.`, `${n} меньше, чем ${d * 10}, значит меньше 10 ${f.thing.ru}.`)
                : band === 3
                    ? L(`${n} is more than ${d * 30}, so more than 30 ${f.thing.en}.`, `${n} больше, чем ${d * 30}, значит больше 30 ${f.thing.ru}.`)
                    : L(`${n} is between ${d * lo} and ${d * hi}, so between ${lo} and ${hi} ${f.thing.en}.`, `${n} между ${d * lo} и ${d * hi}, значит от ${lo} до ${hi} ${f.thing.ru}.`),
            L(`Exactly: ${d} × ${q} = ${d * q}${r ? `, ${n} − ${d * q} = ${r} left over` : ''}: ${q} ${f.thing.en}, in the band ✓`, `Точно: ${d} × ${q} = ${d * q}${r ? `, ${n} − ${d * q} = ${r} в остатке` : ''}: ${q} ${f.thing.ru}, попадает ✓`),
        ],
        hint: L(`Multiply the divisor by 10, 20 and 30. Between which two products does the total land?`, `Умножь делитель на 10, 20 и 30. Между какими двумя произведениями попадает число?`),
        data: { n, d, q, band, style: 'range' },
    };
};

// ---------- problem 14: a bar diagram, write and solve the equation ----------

type BarCtx = { en: (n: number, d: number) => string; ru: (n: number, d: number) => string; letter: string; total: L10n; unit: L10n; per: L10n };
const BARS: BarCtx[] = [
    { en: (n, d) => `Eight laps of a pool is equal to one mile. Victor swam ${n} laps last week. How many miles, m, did Victor swim?`.replace('Eight', d === 8 ? 'Eight' : String(d)),
        ru: (n, d) => `${d} ${ruPlural(d, 'круг', 'круга', 'кругов')} в бассейне - это одна миля. Виктор проплыл ${n} ${ruPlural(n, 'круг', 'круга', 'кругов')} на прошлой неделе. Сколько миль, m, проплыл Виктор?`,
        letter: 'm', total: L('laps', 'кругов'), unit: L('miles', 'миль'), per: L('laps in each mile', 'кругов в одной миле') },
    { en: (n, d) => `A chapter of the spell book has ${d} pages. Ameliia read ${n} pages. How many chapters, c, did she read?`,
        ru: (n, d) => `В главе книги заклинаний ${d} ${ruPlural(d, 'страница', 'страницы', 'страниц')}. Амелия прочитала ${n} ${ruPlural(n, 'страницу', 'страницы', 'страниц')}. Сколько глав, c, она прочитала?`,
        letter: 'c', total: L('pages', 'страниц'), unit: L('chapters', 'глав'), per: L('pages in each chapter', 'страниц в одной главе') },
    { en: (n, d) => `A Quidditch team scores ${d} points with each goal. The team scored ${n} points. How many goals, g, did the team score?`,
        ru: (n, d) => `Команда по квиддичу получает ${d} ${ruPlural(d, 'очко', 'очка', 'очков')} за каждый гол. Команда набрала ${n} ${ruPlural(n, 'очко', 'очка', 'очков')}. Сколько голов, g, забила команда?`,
        letter: 'g', total: L('points', 'очков'), unit: L('goals', 'голов'), per: L('points in each goal', 'очков за один гол') },
];

const makeBar = (rng: Rng): Problem => {
    const c = pick(rng, BARS), i = BARS.indexOf(c);
    // few enough boxes for a phone screen
    let d: number, q: number;
    for (;;) { d = int(rng, 4, 9); q = int(rng, 11, Math.min(16, Math.floor(99 / d))); if (q % 10 !== 0) break; }
    const n = d * q, x = c.letter;
    const lines: FillLine[] = [
        { label: L('The equation: the whole bar ÷ one box', 'Уравнение: вся полоска ÷ одна клетка'), parts: [B(0), ' ÷ ', B(1), ` = ${x}`] },
        { label: L('Solve it with partial quotients', 'Реши частичными частными'), parts: [`${x} = `, B(2)] },
    ];
    return {
        ...base, id: `${S}:bar:${i}:${n}:${d}`,
        prompt: L(`Model with Math: ${c.en(n, d)} In the bar diagram the whole bar is ${n} ${c.total.en} and every box is ${d} ${c.per.en}: ${x} boxes. Write and solve an equation.`,
            `Моделируй: ${c.ru(n, d)} На схеме из полосок вся полоска - ${n} ${c.total.ru}, а каждая клетка - ${d} ${c.per.ru}: клеток ${x}. Запиши и реши уравнение.`),
        answer: { kind: 'fill', layout: 'lines', values: [n, d, q], lines },
        steps: [
            L(`The whole bar is ${n} ${c.total.en}, every box is ${d} ${c.total.en}, ${x} boxes: ${n} ÷ ${d} = ${x}.`, `Вся полоска - ${n} ${c.total.ru}, каждая клетка - ${d} ${c.total.ru}, клеток ${x}: ${n} ÷ ${d} = ${x}.`),
            ...ladderSteps(n, d),
            L(`${x} = ${q}: ${q} ${c.unit.en}.`, `${x} = ${q}: ${q} ${c.unit.ru}.`),
        ],
        hint: L(`The whole bar is the total, one box is one ${c.unit.en.slice(0, -1)}. Total ÷ one box = how many boxes.`, `Вся полоска - это всё вместе, одна клетка - это ${c.per.ru}. Всё ÷ одна клетка = сколько клеток.`),
        visual: { kind: 'bars', rows: [{ label: L(`${x} ${c.unit.en}`, `${x} ${c.unit.ru}`), boxes: q, value: String(d) }], braces: [{ row: 0, label: L(`${n} ${c.total.en}`, `${n} ${c.total.ru}`) }] },
        data: { n, d, style: 'bar' },
    };
};

// ---------- problem 15: how many more pages with 4 on a page than with 6 ----------

type Album = { en: (n: number, a: number, b: number) => string; ru: (n: number, a: number, b: number) => string; thing: L10n };
const ALBUMS: Album[] = [
    { en: (n, a, b) => `Georgena has ${n} pictures she wants to organize in a photo album. How many more pages of the album will be used if Georgena puts ${a} pictures on each page than if she puts ${b} pictures on each page?`,
        ru: (n, a, b) => `У Джорджины ${n} ${ruPlural(n, 'фотография', 'фотографии', 'фотографий')} для альбома. На сколько больше страниц альбома уйдёт, если класть по ${a} фотографии на страницу, чем если класть по ${b}?`, thing: L('pages', 'страниц') },
    { en: (n, a, b) => `Ron has ${n} wizard cards for his album. How many more pages will he use with ${a} cards on each page than with ${b} cards on each page?`,
        ru: (n, a, b) => `У Рона ${n} ${ruPlural(n, 'карточка', 'карточки', 'карточек')} с волшебниками для альбома. На сколько больше страниц уйдёт, если класть по ${a} карточки на страницу, чем по ${b}?`, thing: L('pages', 'страниц') },
];
const PAIRS: [number, number][] = [[4, 6], [2, 3], [3, 4], [2, 4], [3, 6], [2, 5], [4, 8], [3, 9], [2, 6]];
const lcm = (a: number, b: number) => { let x = a; while (x % b) x += a; return x; };

const makeCompare = (rng: Rng): Problem => {
    const [a, b] = pick(rng, PAIRS), m = lcm(a, b), al = pick(rng, ALBUMS), i = ALBUMS.indexOf(al);
    let n: number;
    for (;;) { n = m * int(rng, 1, Math.floor(99 / m)); if (n / a >= 11 && n / a <= 49) break; }
    const qa = n / a, qb = n / b;
    const lines: FillLine[] = [
        { label: L(`Pages with ${a} on each`, `Страниц по ${a} на каждой`), parts: [`${n} ÷ ${a} = `, B(0)] },
        { label: L(`Pages with ${b} on each`, `Страниц по ${b} на каждой`), parts: [`${n} ÷ ${b} = `, B(1)] },
        { label: L('How many more pages', 'На сколько больше страниц'), parts: [E(0), ' − ', E(1), ' = ', B(2)] },
    ];
    return {
        ...base, id: `${S}:compare:${i}:${n}:${a}:${b}`,
        prompt: L(`Make Sense and Persevere: ${al.en(n, a, b)}`, `Разберись и не сдавайся: ${al.ru(n, a, b)}`),
        answer: { kind: 'fill', layout: 'lines', values: [qa, qb, qa - qb], lines },
        steps: [
            L('Two divisions, then a subtraction. "How many more" is the difference of the two answers.', 'Два деления, потом вычитание. «На сколько больше» - это разность двух ответов.'),
            L(`${a} on a page: ${n} ÷ ${a}. ${tensOf(qa)} × ${a} = ${tensOf(qa) * a}, ${n} − ${tensOf(qa) * a} = ${n - tensOf(qa) * a}, ${a} × ${qa - tensOf(qa)} = ${n - tensOf(qa) * a}, so ${tensOf(qa)} + ${qa - tensOf(qa)} = ${qa} pages.`,
                `По ${a} на странице: ${n} ÷ ${a}. ${tensOf(qa)} × ${a} = ${tensOf(qa) * a}, ${n} − ${tensOf(qa) * a} = ${n - tensOf(qa) * a}, ${a} × ${qa - tensOf(qa)} = ${n - tensOf(qa) * a}, значит ${tensOf(qa)} + ${qa - tensOf(qa)} = ${qa} ${ruPlural(qa, 'страница', 'страницы', 'страниц')}.`),
            L(`${b} on a page: ${n} ÷ ${b} = ${qb} pages (${b} × ${qb} = ${n}).`, `По ${b} на странице: ${n} ÷ ${b} = ${qb} ${ruPlural(qb, 'страница', 'страницы', 'страниц')} (${b} × ${qb} = ${n}).`),
            L(`${qa} − ${qb} = ${qa - qb}: ${qa - qb} more pages with ${a} on each.`, `${qa} − ${qb} = ${qa - qb}: на ${qa - qb} ${ruPlural(qa - qb, 'страницу', 'страницы', 'страниц')} больше, если по ${a}.`),
        ],
        hint: L('Fewer pictures on a page means MORE pages. Divide twice, then subtract the smaller number of pages from the bigger one.', 'Меньше фотографий на странице - БОЛЬШЕ страниц. Раздели два раза, потом из большего числа страниц вычти меньшее.'),
        data: { n, a, b, style: 'compare' },
    };
};

// ---------- problem 16: can he share equally? ----------

type Share = { en: (n: number, d: number) => string; ru: (n: number, d: number) => string; thing: L10n; who: L10n };
const SHARES: Share[] = [
    { en: (n, d) => `Ryan has a total of ${n} pennies. Will he be able to give away his pennies equally to ${d} of his friends?`, ru: (n, d) => `У Райана ${n} ${ruPlural(n, 'монетка', 'монетки', 'монеток')}. Сможет ли он раздать их поровну ${d} друзьям?`, thing: L('pennies', 'монеток'), who: L('friend', 'другу') },
    { en: (n, d) => `Harry has ${n} jelly beans. Can he share them equally among ${d} friends?`, ru: (n, d) => `У Гарри ${n} ${ruPlural(n, 'конфета', 'конфеты', 'конфет')}. Сможет ли он поделить их поровну между ${d} друзьями?`, thing: L('jelly beans', 'конфет'), who: L('friend', 'другу') },
    { en: (n, d) => `Grandma Sveta baked ${n} cookies. Can she pack them equally into ${d} boxes?`, ru: (n, d) => `Бабушка Света испекла ${n} ${ruPlural(n, 'печенье', 'печенья', 'печений')}. Сможет ли она разложить их поровну в ${d} ${ruPlural(d, 'коробку', 'коробки', 'коробок')}?`, thing: L('cookies', 'печений'), who: L('box', 'коробке') },
];

const makeEqual = (rng: Rng): Problem => {
    const d = int(rng, 3, 9), q = int(rng, 11, Math.min(32, Math.floor(98 / d))), yes = rng() < 0.5, r = yes ? 0 : int(rng, 1, d - 1), n = d * q + r;
    const s = pick(rng, SHARES), i = SHARES.indexOf(s);
    const yesText = (k: number) => L(`Yes: ${d} × ${k} = ${d * k}, each ${s.who.en} gets ${k} and none are left`, `Да: ${d} × ${k} = ${d * k}, каждому ${s.who.ru} по ${k}, и ничего не остаётся`);
    const noText = (k: number, left: number) => L(`No: ${d} × ${k} = ${d * k}, each ${s.who.en} gets ${k} and ${left} ${left === 1 ? 'is' : 'are'} left over`, `Нет: ${d} × ${k} = ${d * k}, каждому ${s.who.ru} по ${k}, и ${left} в остатке`);
    const right = yes ? yesText(q) : noText(q, r);
    const wrong = yes ? [noText(q - 1, d), yesText(q + 1)] : [yesText(q), noText(q + 1, d - r)];
    return {
        ...base, id: `${S}:equal:${i}:${n}:${d}`,
        prompt: L(`Higher Order Thinking: ${s.en(n, d)} Explain.`, `Подумай: ${s.ru(n, d)} Объясни.`),
        answer: choice(rng, right, wrong),
        steps: [
            L(`Equal shares: ${n} ÷ ${d}. Partial quotients: ${tensOf(q)} × ${d} = ${tensOf(q) * d}, ${n} − ${tensOf(q) * d} = ${n - tensOf(q) * d}, then ${q - tensOf(q)} more: ${d} × ${q - tensOf(q)} = ${(q - tensOf(q)) * d}.`,
                `Поровну: ${n} ÷ ${d}. Частичные частные: ${tensOf(q)} × ${d} = ${tensOf(q) * d}, ${n} − ${tensOf(q) * d} = ${n - tensOf(q) * d}, потом ещё ${q - tensOf(q)}: ${d} × ${q - tensOf(q)} = ${(q - tensOf(q)) * d}.`),
            yes
                ? L(`${n} − ${d * q} = 0: nothing is left. ${d} × ${q} = ${n}, so yes, ${q} ${s.thing.en} each.`, `${n} − ${d * q} = 0: ничего не остаётся. ${d} × ${q} = ${n}, значит да, по ${q} ${s.thing.ru} каждому.`)
                : L(`${n} − ${d * q} = ${r}: ${r} left over, and ${r} is less than ${d}, so it cannot be shared. Equal shares are impossible: no.`, `${n} − ${d * q} = ${r}: ${r} в остатке, а ${r} меньше, чем ${d}, значит поделить нельзя. Поровну не получится: нет.`),
        ],
        hint: L('Equally means nothing is left over. Divide and look at the last subtraction: 0 means yes, anything else means no.', '«Поровну» значит ничего не остаётся. Раздели и посмотри на последнее вычитание: 0 - да, что-то другое - нет.'),
        data: { n, d, yes: yes ? 1 : 0, style: 'equal' },
    };
};

// ---------- problem 17: select all the combinations of partial quotients ----------

const combo = (xs: number[]): L10n => L(xs.join(', '), xs.join(', '));
const sumOf = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

const makeCombos = (rng: Rng): Problem => {
    const { d, q, n } = pair(rng), tens = tensOf(q), ones = q - tens;
    // every set adds up to the quotient; two different ones are shown (10, 1 and 10, 1 would be one)
    const rightAll: number[][] = [[tens, ones], [tens - 5, 5, ones], [...Array(tens / 10).fill(10), ones]];
    if (tens >= 30) rightAll.push([20, tens - 20, ones]);
    if (ones >= 2) rightAll.push([tens, ones - 1, 1]);
    const seen = new Set<string>();
    const right = shuffle(rng, rightAll.filter(xs => (seen.has(xs.join()) ? false : (seen.add(xs.join()), true)))).slice(0, 2);
    const other = ones >= 5 ? ones - int(rng, 1, 4) : ones + int(rng, 1, 4);
    const wrongAll: number[][] = [[tens, other], [tens + 10, ones], [...Array(tens / 10).fill(10), other], [tens + 10, tens, ones], [tens, ones, ones]];
    const wrong = wrongAll.filter(w => sumOf(w) !== q && !seen.has(w.join()) && (seen.add(w.join()), true)).slice(0, 3);
    const all = [...right, ...wrong];
    return {
        ...base, id: `${S}:combos:${n}:${d}:${all.map(x => x.join('-')).join(':')}`,
        prompt: L(`Select all correct combinations of partial quotients which can be used to find ${n} ÷ ${d}.`, `Отметь все наборы частичных частных, которыми можно найти ${n} ÷ ${d}.`),
        answer: multi(rng, right.map(combo), wrong.map(combo)),
        steps: [
            L(`${n} ÷ ${d} = ${q} (${d} × ${q} = ${n}). Partial quotients must add up to the quotient, ${q}.`, `${n} ÷ ${d} = ${q} (${d} × ${q} = ${n}). Частичные частные должны в сумме давать частное, ${q}.`),
            ...all.map(xs => L(`${xs.join(' + ')} = ${sumOf(xs)} ${sumOf(xs) === q ? '✓' : `✗ (not ${q})`}`, `${xs.join(' + ')} = ${sumOf(xs)} ${sumOf(xs) === q ? '✓' : `✗ (не ${q})`}`)),
            L('Check every set, all of them: a task like this can have two right answers.', 'Проверь каждый набор, все до одного: в таком задании может быть два правильных ответа.'),
        ],
        hint: L(`Find ${n} ÷ ${d} first. Then add the numbers of every set: the sets that make the quotient are right.`, `Сначала найди ${n} ÷ ${d}. Потом сложи числа каждого набора: подходят те наборы, где получается частное.`),
        data: { n, d, style: 'combos' },
    };
};

// ---------- problem 18: the Distributive Property, the missing number ----------

const makeMissing = (rng: Rng): Problem => {
    const { d, q, n } = pair(rng), tens = tensOf(q), ones = q - tens, a = tens * d, b = ones * d;
    const lines: FillLine[] = [
        { label: L(`Break ${n} into a part ${d} divides with tens, and the rest`, `Разбей ${n} на часть, которую ${d} делит десятками, и остаток`), parts: [`${n} ÷ ${d} = (${a} + `, B(0), `) ÷ ${d}`] },
        { label: L('Divide each part', 'Раздели каждую часть'), parts: [`= (${a} ÷ ${d}) + (`, E(0), ` ÷ ${d}) = ${tens} + `, B(1)] },
        { label: L('Add', 'Сложи'), parts: ['= ', B(2)] },
    ];
    return {
        ...base, id: `${S}:missing:${n}:${d}`,
        prompt: L(`Use the Distributive Property to find ${n} ÷ ${d}. Fill in the missing numbers.`, `Найди ${n} ÷ ${d} по распределительному свойству. Заполни пропуски.`),
        answer: { kind: 'fill', layout: 'lines', values: [b, ones, q], lines },
        steps: [
            L(`The missing part is what is left of ${n} after ${a}: ${n} − ${a} = ${b}. So ${n} = ${a} + ${b}.`, `Пропущенная часть - это то, что остаётся от ${n} после ${a}: ${n} − ${a} = ${b}. Значит ${n} = ${a} + ${b}.`),
            L(`Divide each part: ${a} ÷ ${d} = ${tens} and ${b} ÷ ${d} = ${ones}.`, `Раздели каждую часть: ${a} ÷ ${d} = ${tens} и ${b} ÷ ${d} = ${ones}.`),
            L(`Add: ${tens} + ${ones} = ${q}. So ${n} ÷ ${d} = ${q}.`, `Сложи: ${tens} + ${ones} = ${q}. Значит ${n} ÷ ${d} = ${q}.`),
            L(`Check: ${a} + ${b} = ${n} ✓ and ${q} × ${d} = ${n} ✓`, `Проверка: ${a} + ${b} = ${n} ✓ и ${q} × ${d} = ${n} ✓`),
        ],
        hint: L(`The two parts must add up to ${n}: subtract ${a} from ${n}. The missing number is the part, not its quotient.`, `Две части должны в сумме давать ${n}: вычти ${a} из ${n}. Пропущено число-часть, а не его частное.`),
        data: { n, d, a, style: 'missing' },
    };
};

export const makeTopic5PQ = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_5_5, want);
    if (style === 'ladder') return makeLadder(rng);
    if (style === 'groups') return makeGroups(rng);
    if (style === 'range') return makeRange(rng);
    if (style === 'bar') return makeBar(rng);
    if (style === 'compare') return makeCompare(rng);
    if (style === 'equal') return makeEqual(rng);
    if (style === 'combos') return makeCombos(rng);
    return makeMissing(rng);
};
