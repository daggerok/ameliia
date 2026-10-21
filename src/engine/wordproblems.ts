import { type Answer, type FillLine, type FillPart, type L10n, type Problem, type Rng, type SkillId, L, choice, fmt, int, pick, ruPlural } from './core';

// Topic 3 "Model with Math" of her class (Savvas enVision, lessons 3-8 and the performance task):
// - comparison: "10 times as much" is multiplication, "how much more" is subtraction, "how many times as many" is division (4.OA.A.1, 4.OA.A.2)
// - multi-step money problems with extra information, an equation with a letter and a reasonableness check by estimation (4.OA.A.3)

const B = (b: number): FillPart => ({ b });

// ---------- comparison ----------

type Who = { en: string; ru: string; ruGen: string };
type CompareCtx = {
    kMin: number; kMax: number; bMin: number; bMax: number;
    letterBig: string; letterDiff: string;
    // texts with {b}, {k}; unit nouns in both languages
    setup: (b: number, k: number) => L10n; askBig: L10n; askDiff: L10n; askTimes: (big: number, b: number) => L10n;
    unit: (x: number) => L10n; small: Who; big: Who;
};

const pounds = (x: number) => L(`${fmt(x, 'en')} ${x === 1 ? 'pound' : 'pounds'}`, `${fmt(x, 'ru')} ${ruPlural(x, 'фунт', 'фунта', 'фунтов')}`);
const things = (en1: string, en2: string, ru1: string, ru2: string, ru5: string) => (x: number) => L(`${fmt(x, 'en')} ${x === 1 ? en1 : en2}`, `${fmt(x, 'ru')} ${ruPlural(x, ru1, ru2, ru5)}`);

const COMPARE: CompareCtx[] = [
    {
        kMin: 3, kMax: 4, bMin: 6, bMax: 9, letterBig: 'w', letterDiff: 'd',
        setup: (b, k) => L(`When little Martin was born, he weighed ${b} pounds. Now he weighs ${k} times as much.`, `Когда маленький Мартин родился, он весил ${b} ${ruPlural(b, 'фунт', 'фунта', 'фунтов')}. Сейчас он весит в ${k} раза больше.`),
        askBig: L('How much does Martin weigh now?', 'Сколько Мартин весит сейчас?'),
        askDiff: L('How much more does Martin weigh now than when he was born?', 'На сколько больше Мартин весит сейчас, чем при рождении?'),
        askTimes: (big, b) => L(`Martin weighed ${b} pounds when he was born and weighs ${big} pounds now. How many times as much does he weigh now?`, `При рождении Мартин весил ${b} ${ruPlural(b, 'фунт', 'фунта', 'фунтов')}, а сейчас ${big} ${ruPlural(big, 'фунт', 'фунта', 'фунтов')}. Во сколько раз больше он весит сейчас?`),
        unit: pounds, small: { en: 'at birth', ru: 'при рождении', ruGen: 'при рождении' }, big: { en: 'now', ru: 'сейчас', ruGen: 'сейчас' },
    },
    {
        kMin: 9, kMax: 10, bMin: 6, bMax: 9, letterBig: 'w', letterDiff: 'd',
        setup: (b, k) => L(`When Ameliia's friend Mia was born, she weighed ${b} pounds. When she was 10 years old, she weighed ${k} times as much.`, `Когда подруга Амелии Мия родилась, она весила ${b} ${ruPlural(b, 'фунт', 'фунта', 'фунтов')}. Когда ей было 10 лет, она весила в ${k} раз больше.`),
        askBig: L('How much did Mia weigh when she was 10 years old?', 'Сколько весила Мия в 10 лет?'),
        askDiff: L('How much more did Mia weigh when she was 10 years old than when she was born?', 'На сколько больше весила Мия в 10 лет, чем при рождении?'),
        askTimes: (big, b) => L(`Mia weighed ${b} pounds when she was born and ${big} pounds at 10 years old. How many times as much did she weigh at 10?`, `При рождении Мия весила ${b} ${ruPlural(b, 'фунт', 'фунта', 'фунтов')}, а в 10 лет ${big} ${ruPlural(big, 'фунт', 'фунта', 'фунтов')}. Во сколько раз больше она весила в 10 лет?`),
        unit: pounds, small: { en: 'at birth', ru: 'при рождении', ruGen: 'при рождении' }, big: { en: 'at 10', ru: 'в 10 лет', ruGen: 'в 10 лет' },
    },
    {
        kMin: 2, kMax: 9, bMin: 6, bMax: 25, letterBig: 's', letterDiff: 'd',
        setup: (b, k) => L(`Emma has ${b} stickers. Ameliia has ${k} times as many stickers as Emma.`, `У Эммы ${b} ${ruPlural(b, 'наклейка', 'наклейки', 'наклеек')}. У Амелии в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше наклеек, чем у Эммы.`),
        askBig: L('How many stickers does Ameliia have?', 'Сколько наклеек у Амелии?'),
        askDiff: L('How many more stickers does Ameliia have than Emma?', 'На сколько больше наклеек у Амелии, чем у Эммы?'),
        askTimes: (big, b) => L(`Emma has ${b} stickers and Ameliia has ${big}. How many times as many stickers does Ameliia have?`, `У Эммы ${b} ${ruPlural(b, 'наклейка', 'наклейки', 'наклеек')}, а у Амелии ${big}. Во сколько раз больше наклеек у Амелии?`),
        unit: things('sticker', 'stickers', 'наклейка', 'наклейки', 'наклеек'), small: { en: 'Emma', ru: 'Эмма', ruGen: 'у Эммы' }, big: { en: 'Ameliia', ru: 'Амелия', ruGen: 'у Амелии' },
    },
    {
        kMin: 2, kMax: 6, bMin: 12, bMax: 40, letterBig: 'p', letterDiff: 'd',
        setup: (b, k) => L(`On Monday Ameliia read ${b} pages of her book. On Saturday she read ${k} times as many pages.`, `В понедельник Амелия прочитала ${b} ${ruPlural(b, 'страницу', 'страницы', 'страниц')} книги. В субботу она прочитала в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше страниц.`),
        askBig: L('How many pages did she read on Saturday?', 'Сколько страниц она прочитала в субботу?'),
        askDiff: L('How many more pages did she read on Saturday than on Monday?', 'На сколько больше страниц она прочитала в субботу, чем в понедельник?'),
        askTimes: (big, b) => L(`Ameliia read ${b} pages on Monday and ${big} pages on Saturday. How many times as many pages did she read on Saturday?`, `Амелия прочитала ${b} ${ruPlural(b, 'страницу', 'страницы', 'страниц')} в понедельник и ${big} в субботу. Во сколько раз больше страниц она прочитала в субботу?`),
        unit: things('page', 'pages', 'страница', 'страницы', 'страниц'), small: { en: 'Monday', ru: 'понедельник', ruGen: 'в понедельник' }, big: { en: 'Saturday', ru: 'суббота', ruGen: 'в субботу' },
    },
    {
        kMin: 2, kMax: 5, bMin: 10, bMax: 30, letterBig: 'm', letterDiff: 'd',
        setup: (b, k) => L(`Ameliia practiced the flute for ${b} minutes on Tuesday. On Sunday she practiced ${k} times as long.`, `Во вторник Амелия занималась на флейте ${b} ${ruPlural(b, 'минуту', 'минуты', 'минут')}. В воскресенье она занималась в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} дольше.`),
        askBig: L('How many minutes did she practice on Sunday?', 'Сколько минут она занималась в воскресенье?'),
        askDiff: L('How many more minutes did she practice on Sunday than on Tuesday?', 'На сколько минут дольше она занималась в воскресенье, чем во вторник?'),
        askTimes: (big, b) => L(`Ameliia practiced ${b} minutes on Tuesday and ${big} minutes on Sunday. How many times as long did she practice on Sunday?`, `Амелия занималась ${b} ${ruPlural(b, 'минуту', 'минуты', 'минут')} во вторник и ${big} в воскресенье. Во сколько раз дольше она занималась в воскресенье?`),
        unit: things('minute', 'minutes', 'минута', 'минуты', 'минут'), small: { en: 'Tuesday', ru: 'вторник', ruGen: 'во вторник' }, big: { en: 'Sunday', ru: 'воскресенье', ruGen: 'в воскресенье' },
    },
];

const barsFor = (c: CompareCtx, b: number, k: number, braces: ('big' | 'diff')[]) => ({
    kind: 'bars' as const,
    rows: [
        { label: L(c.small.en, c.small.ru), boxes: 1, value: String(b) },
        { label: L(c.big.en, c.big.ru), boxes: k, value: String(b) },
    ],
    braces: braces.map(x => (x === 'big'
        ? { row: 1, label: L(`${c.letterBig} = ${k} × ${b}`, `${c.letterBig} = ${k} × ${b}`) }
        : { row: 1, from: 1, label: L(`${c.letterDiff} = ${c.letterBig} − ${b}`, `${c.letterDiff} = ${c.letterBig} − ${b}`) })),
});

const STEP = (i: number) => L(`Step ${i}`, `Шаг ${i}`);

const makeCompare = (rng: Rng): Problem => {
    const c = pick(rng, COMPARE);
    const b = int(rng, c.bMin, c.bMax), k = int(rng, c.kMin, c.kMax), big = b * k, diff = big - b;
    const style = pick(rng, ['two', 'two', 'times', 'divide', 'choose', 'choose-diff', 'model'] as const);
    const id = `compare:${style}:${COMPARE.indexOf(c)}:${b}:${k}`;
    const timesWord = L('times as much / as many: multiply', 'в … раз больше: умножаем');
    // which bar diagram fits: the homework asks to draw one before writing the equation
    if (style === 'model') {
        const bars = (n: number, v: number) => L(`${n} ${n === 1 ? 'box' : 'boxes'} of ${v}`, `${n} ${ruPlural(n, 'полоска', 'полоски', 'полосок')} по ${v}`);
        const two = (big: L10n) => L(`${c.small.en}: ${bars(1, b).en}; ${c.big.en}: ${big.en}`, `${c.small.ru}: ${bars(1, b).ru}; ${c.big.ru}: ${big.ru}`);
        const answer: Answer = choice(rng, two(bars(k, b)), [
            two(bars(1, k)), two(L(`${bars(1, b).en} and ${bars(1, k).en}`, `${bars(1, b).ru} и ${bars(1, k).ru}`)), two(bars(k, 1)),
        ]);
        return {
            id, skill: 'compare', topic: 'estimation',
            prompt: L(`${c.setup(b, k).en} Which bar diagram shows this?`, `${c.setup(b, k).ru} Какая схема из полосок это показывает?`),
            answer,
            steps: [L(`"${k} times as much" means ${k} equal boxes, each as big as ${b}.`, `«В ${k} раз больше» - это ${k} одинаковых полосок, каждая как ${b}.`),
                L(`So ${c.letterBig} = ${b} × ${k} = ${big}.`, `Значит ${c.letterBig} = ${b} × ${k} = ${big}.`)],
            hint: L(`The smaller amount is one box of ${b}. How many of the same boxes make the bigger amount?`, `Меньшее - одна полоска ${b}. Сколько таких же полосок в большем?`),
            visual: barsFor(c, b, k, ['big']),
            data: { b, k, big, style },
        };
    }
    if (style === 'two') {
        const lines: FillLine[] = [
            { label: L(`${STEP(1).en}: ${c.letterBig}, the bigger amount`, `${STEP(1).ru}: ${c.letterBig}, большее количество`), parts: [`${c.letterBig} = `, B(0), ' × ', B(1), ' = ', B(2)] },
            { label: L(`${STEP(2).en}: ${c.letterDiff}, the difference`, `${STEP(2).ru}: ${c.letterDiff}, разница`), parts: [`${c.letterDiff} = `, B(3), ' − ', B(4), ' = ', B(5)] },
        ];
        return {
            id, skill: 'compare', topic: 'estimation',
            prompt: L(`${c.setup(b, k).en}\n1) ${c.askBig.en} Write an equation for ${c.letterBig}.\n2) ${c.askDiff.en} Write an equation for ${c.letterDiff}.`,
                `${c.setup(b, k).ru}\n1) ${c.askBig.ru} Запиши уравнение для ${c.letterBig}.\n2) ${c.askDiff.ru} Запиши уравнение для ${c.letterDiff}.`),
            answer: { kind: 'fill', layout: 'lines', values: [b, k, big, big, b, diff], lines, anyOrder: [[0, 1]] },
            steps: [
                L(`"${k} times as much" means ${k} groups of ${b}: multiply.`, `«В ${k} раз больше» значит ${k} раз по ${b}: умножаем.`),
                L(`${c.letterBig} = ${b} × ${k} = ${big}, so ${c.unit(big).en}.`, `${c.letterBig} = ${b} × ${k} = ${big}, то есть ${c.unit(big).ru}.`),
                L(`"How much more" asks for the difference: subtract the smaller amount from the bigger one.`, `«На сколько больше» спрашивает разницу: из большего вычитаем меньшее.`),
                L(`${c.letterDiff} = ${big} − ${b} = ${diff}, so ${c.unit(diff).en} more.`, `${c.letterDiff} = ${big} − ${b} = ${diff}, то есть на ${c.unit(diff).ru} больше.`),
                L(`Check: ${b} + ${diff} = ${big} ✓`, `Проверка: ${b} + ${diff} = ${big} ✓`),
            ],
            hint: L(`Step 1 is "times as much": ${b} × ${k}. Step 2 is "how much more": the bigger amount minus ${b}.`, `Шаг 1 - «во сколько раз»: ${b} × ${k}. Шаг 2 - «на сколько»: большее минус ${b}.`),
            visual: barsFor(c, b, k, ['big', 'diff']),
            data: { b, k, big, diff, style },
        };
    }
    if (style === 'times') {
        return {
            id, skill: 'compare', topic: 'estimation',
            prompt: L(`${c.setup(b, k).en} ${c.askBig.en} Write an equation for ${c.letterBig}.`, `${c.setup(b, k).ru} ${c.askBig.ru} Запиши уравнение для ${c.letterBig}.`),
            answer: { kind: 'fill', layout: 'lines', values: [b, k, big], lines: [{ parts: [`${c.letterBig} = `, B(0), ' × ', B(1), ' = ', B(2)] }], anyOrder: [[0, 1]] },
            steps: [L(`"${k} times as much" means ${k} groups of ${b}: multiply.`, `«В ${k} раз больше» значит ${k} раз по ${b}: умножаем.`), L(`${c.letterBig} = ${b} × ${k} = ${big}.`, `${c.letterBig} = ${b} × ${k} = ${big}.`)],
            hint: L(`Draw ${k} equal bars of ${b}.`, `Нарисуй ${k} одинаковых полосок по ${b}.`),
            visual: barsFor(c, b, k, ['big']),
            data: { b, k, big, style },
        };
    }
    if (style === 'divide') {
        return {
            id, skill: 'compare', topic: 'estimation',
            prompt: L(`${c.askTimes(big, b).en} Write an equation.`, `${c.askTimes(big, b).ru} Запиши уравнение.`),
            answer: { kind: 'fill', layout: 'lines', values: [big, b, k], lines: [{ parts: [B(0), ' ÷ ', B(1), ' = ', B(2)] }] },
            steps: [L('"How many times as many" asks how many groups of the smaller amount fit into the bigger one: divide.', '«Во сколько раз больше» спрашивает, сколько раз меньшее помещается в большем: делим.'),
                L(`${big} ÷ ${b} = ${k}. Check: ${b} × ${k} = ${big} ✓`, `${big} ÷ ${b} = ${k}. Проверка: ${b} × ${k} = ${big} ✓`)],
            hint: L(`${b} times what is ${big}?`, `${b} умножить на сколько будет ${big}?`),
            visual: barsFor(c, b, k, ['big']),
            data: { b, k, big, style },
        };
    }
    // choose the right equation: the homework mixed "times as much" and "how much more"
    if (style === 'choose') {
        const answer: Answer = choice(rng, L(`${c.letterBig} = ${b} × ${k}`, `${c.letterBig} = ${b} × ${k}`), [
            L(`${c.letterBig} = ${b} + ${k}`, `${c.letterBig} = ${b} + ${k}`), L(`${c.letterBig} = ${b} − ${k}`, `${c.letterBig} = ${b} − ${k}`), L(`${b} × ${c.letterBig} = ${k}`, `${b} × ${c.letterBig} = ${k}`),
        ]);
        return {
            id, skill: 'compare', topic: 'estimation',
            prompt: L(`${c.setup(b, k).en} Which equation finds ${c.letterBig}, ${c.askBig.en.toLowerCase().replace(/\?$/, '')}?`, `${c.setup(b, k).ru} Какое уравнение находит ${c.letterBig}? ${c.askBig.ru}`),
            answer,
            steps: [L(`"${k} times as much" means multiply: ${c.letterBig} = ${b} × ${k} = ${big}.`, `«В ${k} раз больше» значит умножить: ${c.letterBig} = ${b} × ${k} = ${big}.`), L(`${timesWord.en}.`, `${timesWord.ru}.`)],
            hint: L('"Times as much" is not "more by": it means equal groups.', '«В … раз больше» - это не «на … больше»: это равные группы.'),
            visual: barsFor(c, b, k, ['big']),
            data: { b, k, big, style },
        };
    }
    const answer: Answer = choice(rng, L(`${c.letterDiff} = ${big} − ${b}`, `${c.letterDiff} = ${big} − ${b}`), [
        L(`${big} × ${c.letterDiff} = ${b}`, `${big} × ${c.letterDiff} = ${b}`), L(`${c.letterDiff} = ${big} × ${b}`, `${c.letterDiff} = ${big} × ${b}`), L(`${c.letterDiff} = ${big} ÷ ${b}`, `${c.letterDiff} = ${big} ÷ ${b}`),
    ]);
    return {
        id, skill: 'compare', topic: 'estimation',
        prompt: L(`${c.setup(b, k).en} That is ${c.unit(big).en}. ${c.askDiff.en} Which equation finds ${c.letterDiff}?`, `${c.setup(b, k).ru} Это ${c.unit(big).ru}. ${c.askDiff.ru} Какое уравнение находит ${c.letterDiff}?`),
        answer,
        steps: [L(`"How much more" is a difference: subtract. ${c.letterDiff} = ${big} − ${b} = ${diff}.`, `«На сколько больше» - это разница: вычитаем. ${c.letterDiff} = ${big} − ${b} = ${diff}.`),
            L(`${big} ÷ ${b} = ${k} would answer a different question: how many TIMES as much.`, `${big} ÷ ${b} = ${k} отвечает на другой вопрос: во СКОЛЬКО РАЗ больше.`)],
        hint: L('How much more = bigger − smaller.', 'На сколько больше = большее − меньшее.'),
        visual: barsFor(c, b, k, ['big', 'diff']),
        data: { b, k, big, diff, style },
    };
};

// ---------- multi-step money problems with extra information ----------

// en: what was ordered; ru: the same after a number [1, 2-4, 5+] (accusative after "заказал"); name: for questions; per: the price unit
type Item = { en: string; ru: [string, string, string]; name: [string, string]; per: [string, string] };
type Shop = { place: L10n; items: [Item, Item]; count: [number, number]; price: [number, number] };
const I = (en: string, ru: [string, string, string], name: [string, string], per: [string, string]): Item => ({ en, ru, name, per });
const SHOPS: Shop[] = [
    { place: L('A bookstore', 'Книжный магазин'), count: [1012, 4890], price: [2, 9],
        items: [I('packs of pens', ['пачку ручек', 'пачки ручек', 'пачек ручек'], ['pens', 'ручки'], ['a pack', 'за пачку']), I('packs of pencils', ['пачку карандашей', 'пачки карандашей', 'пачек карандашей'], ['pencils', 'карандаши'], ['a pack', 'за пачку'])] },
    { place: L('An art store', 'Магазин для художников'), count: [1012, 2890], price: [3, 9],
        items: [I('paint sets', ['набор красок', 'набора красок', 'наборов красок'], ['paint sets', 'наборы красок'], ['a set', 'за набор']), I('boxes of brushes', ['коробку кисточек', 'коробки кисточек', 'коробок кисточек'], ['brushes', 'кисточки'], ['a box', 'за коробку'])] },
    { place: L('An ice cream shop', 'Кафе-мороженое'), count: [1012, 3500], price: [4, 9],
        items: [I('boxes of cones', ['коробку рожков', 'коробки рожков', 'коробок рожков'], ['cones', 'рожки'], ['a box', 'за коробку']), I('boxes of cups', ['коробку стаканчиков', 'коробки стаканчиков', 'коробок стаканчиков'], ['cups', 'стаканчики'], ['a box', 'за коробку'])] },
    { place: L('A music store', 'Музыкальный магазин'), count: [1012, 2500], price: [5, 9],
        items: [I('flute cases', ['футляр для флейты', 'футляра для флейт', 'футляров для флейт'], ['flute cases', 'футляры для флейт'], ['a case', 'за футляр']), I('piano books', ['нотный сборник', 'нотных сборника', 'нотных сборников'], ['piano books', 'нотные сборники'], ['a book', 'за сборник'])] },
];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const round100 = (x: number) => Math.round(x / 100) * 100;

const makeWordSteps = (rng: Rng): Problem => {
    const s = pick(rng, SHOPS);
    let c1 = int(rng, s.count[0], s.count[1]), c2 = int(rng, s.count[0], s.count[1]);
    while (c2 === c1) c2 = int(rng, s.count[0], s.count[1]);
    let p1 = int(rng, s.price[0], s.price[1]), p2 = int(rng, s.price[0], s.price[1]);
    while (p2 === p1) p2 = int(rng, s.price[0], s.price[1]);
    const cost1 = c1 * p1, cost2 = c2 * p2;
    const style = pick(rng, ['one', 'one', 'both', 'more', 'need', 'reason', 'like', 'meaning', 'diagram', 'blocks'] as const);
    const id = `word-steps:${style}:${SHOPS.indexOf(s)}:${c1}:${p1}:${c2}:${p2}`;
    const [x1, x2] = s.items;
    const setup = L(`${s.place.en} ordered ${fmt(c1, 'en')} ${x1.en} and ${fmt(c2, 'en')} ${x2.en}. The ${x1.name[0]} cost $${p1} ${x1.per[0]}, the ${x2.name[0]} cost $${p2} ${x2.per[0]}.`,
        `${s.place.ru} заказал ${fmt(c1, 'ru')} ${ruPlural(c1, ...x1.ru)} и ${fmt(c2, 'ru')} ${ruPlural(c2, ...x2.ru)}. ${cap(x1.name[1])} стоят $${p1} ${x1.per[1]}, ${x2.name[1]} - $${p2} ${x2.per[1]}.`);
    const match = L(`Match each number to its label: ${fmt(c1, 'en')} goes with $${p1} (${x1.name[0]}), ${fmt(c2, 'en')} goes with $${p2} (${x2.name[0]}).`,
        `Свяжи каждое число со своей подписью: ${fmt(c1, 'ru')} идёт с $${p1} (${x1.name[1]}), ${fmt(c2, 'ru')} - с $${p2} (${x2.name[1]}).`);
    const est1 = round100(c1) * p1;
    const estLine = L(`Reasonable? Estimate: ${fmt(c1, 'en')} is about ${fmt(round100(c1), 'en')}, ${fmt(round100(c1), 'en')} × ${p1} = ${fmt(est1, 'en')}. $${fmt(cost1, 'en')} is close to $${fmt(est1, 'en')} ✓`,
        `Правдоподобно? Прикидка: ${fmt(c1, 'ru')} - это примерно ${fmt(round100(c1), 'ru')}, ${fmt(round100(c1), 'ru')} × ${p1} = ${fmt(est1, 'ru')}. $${fmt(cost1, 'ru')} близко к $${fmt(est1, 'ru')} ✓`);
    if (style === 'one') {
        // one item: the other item is extra information; equation with a letter, then an estimate to check
        const lines: FillLine[] = [
            { label: L(`Equation: c is the cost of the ${x1.name[0]}`, `Уравнение: c - стоимость (${x1.name[1]})`), parts: ['c = ', B(0), ' × ', B(1), ' = ', B(2)] },
            { label: L('Estimate to check: round the number of packs to the nearest hundred', 'Прикидка для проверки: округли количество до сотен'), parts: [B(3), ' × ', B(4), ' = ', B(5)] },
        ];
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} How much did the store spend on ${x1.name[0]}?`, `${setup.ru} Сколько магазин потратил на ${x1.name[1]}?`),
            answer: { kind: 'fill', layout: 'lines', values: [c1, p1, cost1, round100(c1), p1, est1], lines, anyOrder: [[0, 1], [3, 4]] },
            steps: [
                L(`The question asks only about ${x1.name[0]}. The ${x2.name[0]} (${fmt(c2, 'en')} and $${p2}) are extra information: cross them out.`, `Вопрос только про ${x1.name[1]}. ${cap(x2.name[1])} (${fmt(c2, 'ru')} и $${p2}) - лишние данные: вычеркни их.`),
                match,
                L(`c = ${fmt(c1, 'en')} × ${p1} = ${fmt(cost1, 'en')}. The store spent $${fmt(cost1, 'en')}.`, `c = ${fmt(c1, 'ru')} × ${p1} = ${fmt(cost1, 'ru')}. Магазин потратил $${fmt(cost1, 'ru')}.`),
                estLine,
            ],
            hint: L(`Which price belongs to the ${x1.name[0]}? Multiply their number of packs by their price.`, `Какая цена у товара «${x1.name[1]}»? Умножь их количество на их цену.`),
            data: { c1, p1, c2, p2, cost1, style },
        };
    }
    if (style === 'both') {
        const total = cost1 + cost2;
        const lines: FillLine[] = [
            { label: L(`Step 1: ${x1.name[0]}`, `Шаг 1: ${x1.name[1]}`), parts: [B(0), ' × ', B(1), ' = ', B(2)] },
            { label: L(`Step 2: ${x2.name[0]}`, `Шаг 2: ${x2.name[1]}`), parts: [B(3), ' × ', B(4), ' = ', B(5)] },
            { label: L('Step 3: t, the total', 'Шаг 3: t, всего'), parts: ['t = ', B(6), ' + ', B(7), ' = ', B(8)] },
        ];
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} How much did the store spend in all?`, `${setup.ru} Сколько всего потратил магазин?`),
            answer: { kind: 'fill', layout: 'lines', values: [c1, p1, cost1, c2, p2, cost2, cost1, cost2, total], lines, anyOrder: [[0, 1], [3, 4], [6, 7]] },
            steps: [match,
                L(`${fmt(c1, 'en')} × ${p1} = ${fmt(cost1, 'en')}`, `${fmt(c1, 'ru')} × ${p1} = ${fmt(cost1, 'ru')}`),
                L(`${fmt(c2, 'en')} × ${p2} = ${fmt(cost2, 'en')}`, `${fmt(c2, 'ru')} × ${p2} = ${fmt(cost2, 'ru')}`),
                L(`t = ${fmt(cost1, 'en')} + ${fmt(cost2, 'en')} = ${fmt(total, 'en')}. The store spent $${fmt(total, 'en')}.`, `t = ${fmt(cost1, 'ru')} + ${fmt(cost2, 'ru')} = ${fmt(total, 'ru')}. Магазин потратил $${fmt(total, 'ru')}.`)],
            hint: L('Two steps: find each cost, then add them.', 'Два шага: найди каждую стоимость, потом сложи.'),
            data: { c1, p1, c2, p2, cost1, cost2, total, style },
        };
    }
    if (style === 'more') {
        const [hi, lo] = cost1 >= cost2 ? [cost1, cost2] : [cost2, cost1];
        const [hiName, loName] = cost1 >= cost2 ? [x1.name, x2.name] : [x2.name, x1.name];
        const values = [c1, p1, cost1, c2, p2, cost2, hi, lo, hi - lo];
        const lines: FillLine[] = [
            { label: L(`Step 1: ${x1.name[0]}`, `Шаг 1: ${x1.name[1]}`), parts: [B(0), ' × ', B(1), ' = ', B(2)] },
            { label: L(`Step 2: ${x2.name[0]}`, `Шаг 2: ${x2.name[1]}`), parts: [B(3), ' × ', B(4), ' = ', B(5)] },
            { label: L('Step 3: d, how much more', 'Шаг 3: d, на сколько больше'), parts: ['d = ', B(6), ' − ', B(7), ' = ', B(8)] },
        ];
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} How much more did the store spend on ${hiName[0]} than on ${loName[0]}?`, `${setup.ru} На сколько больше магазин потратил на ${hiName[1]}, чем на ${loName[1]}?`),
            answer: { kind: 'fill', layout: 'lines', values, lines, anyOrder: [[0, 1], [3, 4]] },
            steps: [match,
                L(`${fmt(c1, 'en')} × ${p1} = ${fmt(cost1, 'en')}`, `${fmt(c1, 'ru')} × ${p1} = ${fmt(cost1, 'ru')}`),
                L(`${fmt(c2, 'en')} × ${p2} = ${fmt(cost2, 'en')}`, `${fmt(c2, 'ru')} × ${p2} = ${fmt(cost2, 'ru')}`),
                L(`"How much more" is a difference: d = ${fmt(hi, 'en')} − ${fmt(lo, 'en')} = ${fmt(hi - lo, 'en')}, so $${fmt(hi - lo, 'en')} more.`, `«На сколько больше» - это разница: d = ${fmt(hi, 'ru')} − ${fmt(lo, 'ru')} = ${fmt(hi - lo, 'ru')}, то есть на $${fmt(hi - lo, 'ru')} больше.`)],
            hint: L('Find both costs, then subtract the smaller one from the bigger one.', 'Найди обе стоимости, потом из большей вычти меньшую.'),
            data: { c1, p1, c2, p2, cost1, cost2, style },
        };
    }
    if (style === 'need') {
        const answer: Answer = choice(rng, L(`${fmt(c1, 'en')} and $${p1}`, `${fmt(c1, 'ru')} и $${p1}`), [
            L(`${fmt(c2, 'en')} and $${p1}`, `${fmt(c2, 'ru')} и $${p1}`), L(`${fmt(c1, 'en')} and $${p2}`, `${fmt(c1, 'ru')} и $${p2}`), L(`${fmt(c2, 'en')} and $${p2}`, `${fmt(c2, 'ru')} и $${p2}`),
        ]);
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} To find how much the store spent on ${x1.name[0]}, which two numbers do you need?`, `${setup.ru} Чтобы узнать, сколько магазин потратил на ${x1.name[1]}, какие два числа нужны?`),
            answer,
            steps: [match, L(`The ${x2.name[0]} are extra information. Cost of ${x1.name[0]}: ${fmt(c1, 'en')} × ${p1} = ${fmt(cost1, 'en')}.`, `${cap(x2.name[1])} - лишние данные. Стоимость: ${fmt(c1, 'ru')} × ${p1} = ${fmt(cost1, 'ru')}.`)],
            hint: L('Underline the question. Which numbers talk about the same thing as the question?', 'Подчеркни вопрос. Какие числа говорят о том же, о чём вопрос?'),
            data: { c1, p1, c2, p2, cost1, style },
        };
    }
    const ask = L(`How much did the store spend on ${x1.name[0]}?`, `Сколько магазин потратил на ${x1.name[1]}?`);
    const solve = L(`c = ${fmt(c1, 'en')} × ${p1} = ${fmt(cost1, 'en')}. The store spent $${fmt(cost1, 'en')}.`, `c = ${fmt(c1, 'ru')} × ${p1} = ${fmt(cost1, 'ru')}. Магазин потратил $${fmt(cost1, 'ru')}.`);
    // "is this problem like other problems you have solved?": the plan, not the number
    if (style === 'like') {
        const answer: Answer = choice(rng, L(`Yes: how many ${x1.name[0]} × the price of one, like 6 × 182. The ${x2.name[0]} are extra information`, `Да: количество (${x1.name[1]}) × цена одного, как 6 × 182. ${cap(x2.name[1])} - лишние данные`), [
            L('Yes: add all four numbers', 'Да: сложить все четыре числа'),
            L(`Yes: how many ${x1.name[0]} + the price of one`, `Да: количество (${x1.name[1]}) + цена одного`),
            L('No: it needs all four numbers multiplied together', 'Нет: нужно перемножить все четыре числа'),
        ]);
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} ${ask.en} Is this problem like other problems you have solved? Which plan is right?`, `${setup.ru} ${ask.ru} Похожа ли задача на те, что ты уже решала? Какой план верный?`),
            answer,
            steps: [L(`It is a "how many × price of one" problem: multiply a big number by a one-digit number, like 6 × 182.`, 'Это задача «количество × цена одного»: умножаем большое число на однозначное, как 6 × 182.'),
                L(`The question is only about ${x1.name[0]}, so the ${x2.name[0]} are extra.`, `Вопрос только про ${x1.name[1]}, поэтому ${x2.name[1]} - лишние.`), solve],
            hint: L('We know how many and the price of one. Which operation joins equal groups?', 'Мы знаем количество и цену одного. Какое действие соединяет равные группы?'),
            data: { c1, p1, c2, p2, cost1, style },
        };
    }
    // what each number means: labels first, then the equation
    if (style === 'meaning') {
        const labels = [
            L(`how many ${x1.en} were ordered`, `сколько заказали (${x1.name[1]})`),
            L(`the price of the ${x1.name[0]} for ${x1.per[0]}`, `цена ${x1.per[1]} (${x1.name[1]})`),
            L(`how many ${x2.en} were ordered`, `сколько заказали (${x2.name[1]})`),
            L(`the price of the ${x2.name[0]} for ${x2.per[0]}`, `цена ${x2.per[1]} (${x2.name[1]})`),
        ];
        const which = int(rng, 0, 2);
        const shown = [L(fmt(c1, 'en'), fmt(c1, 'ru')), L(`$${p1}`, `$${p1}`), L(fmt(c2, 'en'), fmt(c2, 'ru'))][which];
        const answer: Answer = choice(rng, labels[which], labels.filter((_, i) => i !== which));
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} ${ask.en} What does ${shown.en} mean?`, `${setup.ru} ${ask.ru} Что означает ${shown.ru}?`),
            answer,
            steps: [match, L(`Only the ${x1.name[0]} numbers are needed: c = ${fmt(c1, 'en')} × ${p1}.`, `Нужны только числа про ${x1.name[1]}: c = ${fmt(c1, 'ru')} × ${p1}.`), solve],
            hint: L(`Find ${shown.en} in the text. Which words are right next to it?`, `Найди ${shown.ru} в тексте. Какие слова стоят рядом?`),
            data: { c1, p1, c2, p2, cost1, style, which },
        };
    }
    // which bar diagram fits: equal parts make a whole, so multiply
    if (style === 'diagram') {
        const answer: Answer = choice(rng, L(`${p1} equal parts of ${fmt(c1, 'en')}, the whole is c: multiply`, `${p1} равных частей по ${fmt(c1, 'ru')}, целое - c: умножаем`), [
            L(`One part ${fmt(c1, 'en')} and one part ${p1} side by side: add`, `Одна часть ${fmt(c1, 'ru')} и одна часть ${p1} рядом: складываем`),
            L(`${p1} equal parts of ${fmt(c2, 'en')}, the whole is c: multiply`, `${p1} равных частей по ${fmt(c2, 'ru')}, целое - c: умножаем`),
            L(`${fmt(c1, 'en')} split into ${p1} equal parts: divide`, `${fmt(c1, 'ru')} разделить на ${p1} равных частей: делим`),
        ]);
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} ${ask.en} Which bar diagram fits, and which operation?`, `${setup.ru} ${ask.ru} Какая схема подходит и какое действие?`),
            answer,
            steps: [L(`${fmt(c1, 'en')} boxes of $${p1} are too many to draw, so draw it the other way: ${p1} equal parts of ${fmt(c1, 'en')}. The answer is the same.`, `${fmt(c1, 'ru')} полосок по $${p1} не нарисуешь, поэтому рисуем наоборот: ${p1} равных частей по ${fmt(c1, 'ru')}. Ответ тот же.`),
                L('Equal parts that make a whole: multiply.', 'Равные части складываются в целое: умножаем.'), solve],
            hint: L(`Use the ${x1.name[0]} numbers only. Equal parts or two different parts?`, `Бери только числа про ${x1.name[1]}. Равные части или две разные?`),
            visual: { kind: 'bars', rows: [{ label: L(cap(x1.name[0]), cap(x1.name[1])), boxes: p1, value: fmt(c1, 'en') }], braces: [{ row: 0, label: L(`c = ${p1} × ${fmt(c1, 'en')}`, `c = ${p1} × ${fmt(c1, 'ru')}`) }] },
            data: { c1, p1, c2, p2, cost1, style },
        };
    }
    // would place-value blocks be a good way: no, 4-digit numbers need a written strategy
    if (style === 'blocks') {
        const answer: Answer = choice(rng, L(`No: ${fmt(c1, 'en')} is big, drawing blocks ${p1} times takes too long. Partial products or the standard algorithm is faster`, `Нет: ${fmt(c1, 'ru')} - большое число, рисовать кубики ${p1} раз слишком долго. Частичные произведения или столбик быстрее`), [
            L('Yes: blocks are always the fastest way', 'Да: кубики - всегда самый быстрый способ'),
            L(`Yes: there are only ${p1} groups`, `Да: групп всего ${p1}`),
            L('No: you cannot multiply dollars', 'Нет: доллары нельзя умножать'),
        ]);
        return {
            id, skill: 'word-steps', topic: 'estimation',
            prompt: L(`${setup.en} ${ask.en} Would place-value blocks be a good way to solve it?`, `${setup.ru} ${ask.ru} Удобно ли решать эту задачу кубиками для разрядов?`),
            answer,
            steps: [L(`Blocks for ${fmt(c1, 'en')} drawn ${p1} times: thousands, hundreds, tens and ones, again and again. That takes too long.`, `Кубики для ${fmt(c1, 'ru')}, нарисованные ${p1} раз: тысячи, сотни, десятки и единицы снова и снова. Это слишком долго.`),
                L('Blocks are good for small numbers. For 4-digit numbers use partial products or the standard algorithm.', 'Кубики хороши для маленьких чисел. Для четырёхзначных - частичные произведения или столбик.'), solve],
            hint: L(`How many blocks would you draw for ${fmt(c1, 'en')}, ${p1} times?`, `Сколько кубиков пришлось бы нарисовать для ${fmt(c1, 'ru')}, ${p1} раз?`),
            data: { c1, p1, c2, p2, cost1, style },
        };
    }
    const answer: Answer = choice(rng,
        L(`${fmt(c1, 'en')} is about ${fmt(round100(c1), 'en')}, and ${fmt(round100(c1), 'en')} × ${p1} = ${fmt(est1, 'en')}, which is close to $${fmt(cost1, 'en')}`, `${fmt(c1, 'ru')} - это примерно ${fmt(round100(c1), 'ru')}, а ${fmt(round100(c1), 'ru')} × ${p1} = ${fmt(est1, 'ru')}, это близко к $${fmt(cost1, 'ru')}`), [
            L('Because I computed accurately', 'Потому что я посчитала аккуратно'),
            L('Because it is a big number', 'Потому что это большое число'),
            L(`Because ${fmt(c1, 'en')} + ${p1} is close to it`, `Потому что ${fmt(c1, 'ru')} + ${p1} близко к нему`),
        ]);
    return {
        id, skill: 'word-steps', topic: 'estimation',
        prompt: L(`${setup.en} Ameliia found that the store spent $${fmt(cost1, 'en')} on ${x1.name[0]}. Which explanation shows that her answer is reasonable?`,
            `${setup.ru} Амелия нашла, что магазин потратил на ${x1.name[1]} $${fmt(cost1, 'ru')}. Какое объяснение показывает, что ответ правдоподобный?`),
        answer,
        steps: [L('"Reasonable" means: an estimate with easy numbers lands close to the answer. "I computed accurately" does not show anything.', '«Правдоподобно» значит: прикидка с удобными числами получается рядом с ответом. Фраза «я посчитала аккуратно» ничего не доказывает.'), estLine],
        hint: L('Round to easy numbers and multiply. Is it close?', 'Округли до удобных чисел и умножь. Близко?'),
        data: { c1, p1, c2, p2, cost1, style },
    };
};

export const makeWordProblem = (rng: Rng, skill: SkillId): Problem => (skill === 'compare' ? makeCompare(rng) : makeWordSteps(rng));
