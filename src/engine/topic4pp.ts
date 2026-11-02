/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, fmt, int, multi, pick, pickStyle, ruPlural, shuffle } from './core';
import { roundTo } from './estimation';

// Topic 4, Lesson 4-6 of her class (Savvas enVision "Use Partial Products to Multiply by 2-Digit Numbers"),
// Additional Practice 4-6, pages 53-54, the homework of 2026-11-02 (4.NBT.B.5):
// - column: estimate, find all four partial products in a column, add (Another Look 12 × 14 and problems 1-8)
// - reason: why the calculations to the right of each partial product are simpler problems (problem 9)
// - mistakes: explain the mistakes in a calculation and give the correct product (problem 10)
// - graph: adult tickets by weekday, $10 each, did the theater make its $1,200 goal (problem 11)
// - golf: 245 balls plus a carton of 5 crates of 15 boxes of 12 balls (problem 12)
// - missing: which set of numbers has the missing partial product and the final product (problem 13)
// - factor: select all the equations in which 15 is the missing factor (problem 14)
// Her first try of p. 53-54 (2026-11-02) showed where she thinks wrong, so the tasks lean on it: the tens × tens partial
// product when both tens digits are 2 or more (24 × 12: she took 10 × 10 = 100 for 20 × 10; 23 × 46: 20 × 40 = 80), the
// basic facts 9 × 4 (she wrote 32) and 8 × 7 (she wrote 50), and adding the column (6 + 30 + 100 + 20 came out as 150)

export const KINDS_4_6 = ['column', 'reason', 'mistakes', 'graph', 'golf', 'missing', 'factor'] as const;
type Kind = (typeof KINDS_4_6)[number];

const B = (b: number): FillPart => ({ b });
type Tpl = (n: (x: number) => string) => string;
const X = (f: Tpl): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
const W = (en: Tpl, ru: Tpl): L10n => L(en(x => fmt(x, 'en')), ru(x => fmt(x, 'ru')));
const S = 'pp-2x2' as const;
const base = { skill: S, topic: 'estimation' as const };

const tensOf = (a: number) => Math.floor(a / 10) * 10;
const onesOf = (a: number) => a % 10;
// the digits she misses most come more often: 4, 6, 7, 8, 9
const DIGITS = [1, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9];
const twoDigit = (rng: Rng, loT: number, hiT: number) => 10 * int(rng, loT, hiT) + pick(rng, DIGITS);
// the pair of problems 1-8: half the time both tens digits are 2 or more, the box she gets wrong
const pair = (rng: Rng) => (rng() < 0.5 ? { a: twoDigit(rng, 2, 8), b: twoDigit(rng, 2, 7) } : { a: twoDigit(rng, 1, 8), b: twoDigit(rng, 1, 2) });

// the four partial products in the order of the column: ones × ones, ones × tens, tens × ones, tens × tens (bottom × top)
export const columnPartials = (top: number, bot: number): number[] => [onesOf(bot) * onesOf(top), onesOf(bot) * tensOf(top), tensOf(bot) * onesOf(top), tensOf(bot) * tensOf(top)];

// a partial product said the way the book says it, with the basic fact and the zeros when both parts are tens
const factLine = (x: number, y: number): L10n => {
    const p = x * y;
    if (x >= 10 && y >= 10) return W(n => `${x} × ${y}: ${x / 10} × ${y / 10} = ${(x / 10) * (y / 10)}, then two zeros: ${n(p)}`, n => `${x} × ${y}: ${x / 10} × ${y / 10} = ${(x / 10) * (y / 10)}, потом два нуля: ${n(p)}`);
    if (x >= 10 || y >= 10) { const [t, o] = x >= 10 ? [x, y] : [y, x]; return W(n => `${x} × ${y}: ${t / 10} × ${o} = ${(t / 10) * o}, then one zero: ${n(p)}`, n => `${x} × ${y}: ${t / 10} × ${o} = ${(t / 10) * o}, потом один ноль: ${n(p)}`); }
    return X(n => `${x} × ${y} = ${n(p)}`);
};
const addLine = (ps: number[], total: number): L10n => {
    const ones = ps.reduce((s, p) => s + (p % 10), 0);
    const tens = ps.reduce((s, p) => s + Math.floor((p % 100) / 10), 0) + Math.floor(ones / 10);
    const carry = tens >= 10 ? W(n => ` (the tens make ${tens} tens: write ${tens % 10}, carry ${Math.floor(tens / 10)} to the hundreds)`, n => ` (десятков набралось ${tens}: пишем ${tens % 10}, ${Math.floor(tens / 10)} переносим в сотни)`) : L('', '');
    return W(n => `Add in a column, ones under ones: ${ps.map(n).join(' + ')} = ${n(total)}${carry.en}.`, n => `Складывай столбиком, единицы под единицами: ${ps.map(n).join(' + ')} = ${n(total)}${carry.ru}.`);
};
const estLine = (a: number, b: number): L10n => {
    const ra = roundTo(a, 10), rb = roundTo(b, 10);
    return W(n => `Estimate first: ${a} × ${b} is about ${ra} × ${rb} = ${n(ra * rb)}. The answer must be close to it.`, n => `Сначала прикинь: ${a} × ${b} - это примерно ${ra} × ${rb} = ${n(ra * rb)}. Ответ должен быть близко.`);
};
const columnSteps = (top: number, bot: number): L10n[] => {
    const ps = columnPartials(top, bot), [to, tt, bo, bt] = [onesOf(top), tensOf(top), onesOf(bot), tensOf(bot)];
    return [
        estLine(top, bot),
        L(`Write ${bot} under ${top}. Multiply the ones of ${bot} by each part of ${top}, then the tens of ${bot} by each part.`, `Запиши ${bot} под ${top}. Умножь единицы числа ${bot} на каждую часть ${top}, потом десятки числа ${bot} на каждую часть.`),
        factLine(bo, to), factLine(bo, tt), factLine(bt, to), factLine(bt, tt),
        addLine(ps, top * bot),
        W(n => `Check: ${n(top * bot)} is close to the estimate ✓`, n => `Проверка: ${n(top * bot)} близко к прикидке ✓`),
    ];
};
const columnHint = (top: number, bot: number): L10n => L(`Four partial products: ${onesOf(bot)} × ${onesOf(top)}, ${onesOf(bot)} × ${tensOf(top)}, ${tensOf(bot)} × ${onesOf(top)}, ${tensOf(bot)} × ${tensOf(top)}. For tens × tens: the basic fact, then two zeros (20 × 40 = 800, not 80).`,
    `Четыре частичных произведения: ${onesOf(bot)} × ${onesOf(top)}, ${onesOf(bot)} × ${tensOf(top)}, ${tensOf(bot)} × ${onesOf(top)}, ${tensOf(bot)} × ${tensOf(top)}. Для десятки × десятки: табличный пример, потом два нуля (20 × 40 = 800, а не 80).`);

// ---------- problems 1-8: all the partial products in a column, then add ----------

const makeColumn = (rng: Rng): Problem => {
    const { a: top, b: bot } = pair(rng), ps = columnPartials(top, bot);
    const [to, tt, bo, bt] = [onesOf(top), tensOf(top), onesOf(bot), tensOf(bot)];
    const lines: FillLine[] = [
        { label: L('Partial products', 'Частичные произведения'), parts: [`${top} × ${bot}`] },
        { parts: [{ t: L(`${bo} × ${to}`, `${bo} × ${to}`) }, ' = ', B(0)] },
        { parts: [{ t: L(`${bo} × ${tt}`, `${bo} × ${tt}`) }, ' = ', B(1)] },
        { parts: [{ t: L(`${bt} × ${to}`, `${bt} × ${to}`) }, ' = ', B(2)] },
        { parts: ['+ ', { t: L(`${bt} × ${tt}`, `${bt} × ${tt}`) }, ' = ', B(3)] },
        { label: L('Product', 'Произведение'), parts: [B(4)] },
    ];
    return {
        ...base, id: `${S}:column:${top}:${bot}`,
        prompt: L(`Estimate ${top} × ${bot}. Find all the partial products, then add to find the final product. Draw an area model in the notepad if it helps.`,
            `Прикинь ${top} × ${bot}. Найди все частичные произведения, потом сложи и найди произведение. Если помогает, нарисуй в блокноте модель площади.`),
        answer: { kind: 'fill', layout: 'lines', values: [...ps, top * bot], lines },
        steps: columnSteps(top, bot), hint: columnHint(top, bot), visual: { kind: 'area', a: top, b: bot },
        data: { a: top, b: bot, value: top * bot, style: 'column' },
    };
};

// ---------- problem 9: why the calculations to the right are simpler problems ----------

const makeReason = (rng: Rng): Problem => {
    const { a: top, b: bot } = pair(rng), ps = columnPartials(top, bot);
    const [to, tt, bo, bt] = [onesOf(top), tensOf(top), onesOf(bot), tensOf(bot)];
    const right = L(`Each one is a basic fact with tens: ${bt / 10} tens × ${tt / 10} tens is ${(bt / 10) * (tt / 10)} hundreds, so you only need the facts and the zeros`,
        `Каждое - это табличный пример с десятками: ${bt / 10} десятков × ${tt / 10} десятков - это ${(bt / 10) * (tt / 10)} сотен, нужны только таблица и нули`);
    return {
        ...base, id: `${S}:reason:${top}:${bot}`,
        prompt: L(`Reasoning: ${top} × ${bot} has the partial products ${ps.map(x => fmt(x, 'en')).join(', ')}. To the right of them you can write ${bo} × ${to}, ${bo} × ${tt / 10} tens, ${bt / 10} tens × ${to}, ${bt / 10} tens × ${tt / 10} tens. Why can these be thought of as simpler problems?`,
            `Рассуждение: у ${top} × ${bot} частичные произведения ${ps.map(x => fmt(x, 'ru')).join(', ')}. Справа от них можно записать ${bo} × ${to}, ${bo} × ${tt / 10} десятков, ${bt / 10} десятков × ${to}, ${bt / 10} десятков × ${tt / 10} десятков. Почему это более простые задачи?`),
        answer: choice(rng, right, [
            L('Because the numbers are rounded to the nearest ten first', 'Потому что числа сначала округляют до десятков'),
            L('Because you add the digits instead of multiplying them', 'Потому что цифры складывают, а не умножают'),
            L(`They are not simpler: you still multiply ${top} by ${bot} in one step`, `Они не проще: всё равно умножаешь ${top} на ${bot} за один шаг`),
        ]),
        steps: [
            L(`${bt} × ${tt} is ${bt / 10} tens × ${tt / 10} tens. The basic fact ${bt / 10} × ${tt / 10} = ${(bt / 10) * (tt / 10)} gives ${(bt / 10) * (tt / 10)} hundreds: ${fmt(bt * tt, 'en')}.`, `${bt} × ${tt} - это ${bt / 10} десятков × ${tt / 10} десятков. Табличный пример ${bt / 10} × ${tt / 10} = ${(bt / 10) * (tt / 10)} даёт ${(bt / 10) * (tt / 10)} сотен: ${fmt(bt * tt, 'ru')}.`),
            L(`${bo} × ${tt} is ${bo} × ${tt / 10} tens = ${bo * (tt / 10)} tens = ${bo * tt}. Place value turns every partial product into a fact you know.`, `${bo} × ${tt} - это ${bo} × ${tt / 10} десятков = ${bo * (tt / 10)} десятков = ${bo * tt}. Разряды превращают каждое частичное произведение в знакомый пример.`),
        ],
        hint: L('Think of 20 × 30 as 2 tens × 3 tens: 2 × 3 = 6, and 6 hundreds is 600.', 'Думай о 20 × 30 как о 2 десятка × 3 десятка: 2 × 3 = 6, а 6 сотен - это 600.'),
        data: { a: top, b: bot, style: 'reason' },
    };
};

// ---------- problem 10: explain the mistakes, show the correct calculation ----------

const makeMistakes = (rng: Rng): Problem => {
    const top = 10 * int(rng, 1, 2) + int(rng, 1, 4), bot = 10 + int(rng, 2, 4), ps = columnPartials(top, bot), p = top * bot;
    const [to, tt, bo, bt] = [onesOf(top), tensOf(top), onesOf(bot), tensOf(bot)];
    // the mistake of the book: the tens were multiplied as ones, so the two partial products with a ten lost a zero
    const wrong = [ps[0], ps[1] / 10, ps[2], ps[3] / 10], wrongSum = wrong.reduce((s, x) => s + x, 0);
    const right = W(n => `${bo} × ${tt} = ${n(ps[1])}, not ${n(wrong[1])}, and ${bt} × ${tt} = ${n(ps[3])}, not ${n(wrong[3])}: the tens were multiplied as ones. The product is ${n(p)}`,
        n => `${bo} × ${tt} = ${n(ps[1])}, а не ${n(wrong[1])}, и ${bt} × ${tt} = ${n(ps[3])}, а не ${n(wrong[3])}: десятки умножили как единицы. Произведение ${n(p)}`);
    return {
        ...base, id: `${S}:mistakes:${top}:${bot}`,
        prompt: L(`Explain the mistakes in this calculation: ${top} × ${bot} with the partial products ${wrong.join(', ')} and the answer ${wrongSum}. Which is the correct calculation?`,
            `Объясни ошибки в вычислении: ${top} × ${bot} с частичными произведениями ${wrong.join(', ')} и ответом ${wrongSum}. Какое вычисление верное?`),
        answer: choice(rng, right, [
            W(n => `Only the addition is wrong: ${wrong.map(n).join(' + ')} should be ${n(wrongSum + 10)}`, n => `Неверно только сложение: ${wrong.map(n).join(' + ')} должно быть ${n(wrongSum + 10)}`),
            W(n => `${bo} × ${to} should be ${n(ps[0] * 10)}: the ones need a zero too. The product is ${n(wrongSum + ps[0] * 9)}`, n => `${bo} × ${to} должно быть ${n(ps[0] * 10)}: единицам тоже нужен ноль. Произведение ${n(wrongSum + ps[0] * 9)}`),
            W(n => `There is no mistake: ${top} × ${bot} = ${n(wrongSum)}`, n => `Ошибки нет: ${top} × ${bot} = ${n(wrongSum)}`),
        ]),
        steps: [
            estLine(top, bot),
            W(n => `${wrongSum} is far from the estimate, so something is wrong. ${tt} is ${tt / 10} ten, not ${tt / 10} one: ${bo} × ${tt} = ${n(ps[1])} and ${bt} × ${tt} = ${n(ps[3])}.`, n => `${wrongSum} далеко от прикидки, значит есть ошибка. ${tt} - это ${tt / 10} десяток, а не ${tt / 10} единица: ${bo} × ${tt} = ${n(ps[1])} и ${bt} × ${tt} = ${n(ps[3])}.`),
            addLine(ps, p),
        ],
        hint: L('Estimate first. Then look at each partial product: did every ten keep its zero?', 'Сначала прикинь. Потом посмотри на каждое частичное произведение: у каждого десятка остался его ноль?'),
        data: { a: top, b: bot, value: p, style: 'mistakes' },
    };
};

// ---------- problem 11: the ticket goal of the week ----------

const DAYS: [L10n, L10n][] = [[L('Mon.', 'пн'), L('Monday', 'понедельник')], [L('Tue.', 'вт'), L('Tuesday', 'вторник')], [L('Wed.', 'ср'), L('Wednesday', 'среда')], [L('Thu.', 'чт'), L('Thursday', 'четверг')], [L('Fri.', 'пт'), L('Friday', 'пятница')]];
const makeGraph = (rng: Rng): Problem => {
    const adults = DAYS.map(() => int(rng, 8, 30)), kids = DAYS.map(() => int(rng, 5, 28));
    const pa = 10, pk = int(rng, 6, 9), goal = 100 * int(rng, 9, 14), total = adults.reduce((s, x) => s + x, 0), made = total * pa, diff = Math.abs(made - goal), over = made >= goal;
    const list = (xs: number[], lang: 'en' | 'ru') => DAYS.map((d, i) => `${d[0][lang]} ${xs[i]}`).join(', ');
    const right = over
        ? W(n => `Yes: ${total} × $${pa} = $${n(made)}, $${n(diff)} more than the goal`, n => `Да: ${total} × $${pa} = $${n(made)}, на $${n(diff)} больше цели`)
        : W(n => `No: ${total} × $${pa} = $${n(made)}, $${n(diff)} less than the goal`, n => `Нет: ${total} × $${pa} = $${n(made)}, на $${n(diff)} меньше цели`);
    const kidsTotal = kids.reduce((s, x) => s + x, 0), both = made + kidsTotal * pk;
    return {
        ...base, id: `${S}:graph:${adults.join('')}:${goal}`,
        prompt: L(`A movie theater charges $${pa} for an adult ticket and $${pk} for a child ticket. The goal is to make $${fmt(goal, 'en')} on adult tickets each week. Adult tickets sold: ${list(adults, 'en')}. Child tickets: ${list(kids, 'en')}. Did the theater make its goal this week? How much more or less than the goal did it make?`,
            `Кинотеатр берёт $${pa} за взрослый билет и $${pk} за детский. Цель - заработать $${fmt(goal, 'ru')} на взрослых билетах за неделю. Взрослых билетов продано: ${list(adults, 'ru')}. Детских: ${list(kids, 'ru')}. Выполнил ли кинотеатр цель на этой неделе? На сколько больше или меньше цели он заработал?`),
        answer: choice(rng, right, [
            over ? W(n => `No: $${n(made)} is $${n(diff)} less than the goal`, n => `Нет: $${n(made)} - это на $${n(diff)} меньше цели`) : W(n => `Yes: $${n(made)} is $${n(diff)} more than the goal`, n => `Да: $${n(made)} - это на $${n(diff)} больше цели`),
            W(n => `${both >= goal ? 'Yes' : 'No'}: adults and children together made $${n(both)}`, n => `${both >= goal ? 'Да' : 'Нет'}: взрослые и дети вместе дали $${n(both)}`),
            W(n => `${total >= goal ? 'Yes' : 'No'}: ${total} tickets against a goal of ${n(goal)}`, n => `${total >= goal ? 'Да' : 'Нет'}: ${total} билетов против цели ${n(goal)}`),
        ]),
        steps: [
            L(`The goal is about adult tickets only. Add the adults: ${adults.join(' + ')} = ${total}.`, `Цель только про взрослые билеты. Сложи взрослых: ${adults.join(' + ')} = ${total}.`),
            X(n => `${total} × $${pa} = $${n(made)}`),
            over ? W(n => `$${n(made)} − $${n(goal)} = $${n(diff)}: the goal is made, $${n(diff)} more.`, n => `$${n(made)} − $${n(goal)} = $${n(diff)}: цель выполнена, на $${n(diff)} больше.`)
                : W(n => `$${n(goal)} − $${n(made)} = $${n(diff)}: the goal is not made, $${n(diff)} less.`, n => `$${n(goal)} − $${n(made)} = $${n(diff)}: цель не выполнена, на $${n(diff)} меньше.`),
        ],
        hint: L('Read the goal again: adult tickets only. Count the adults of the week, multiply by $10, compare with the goal.', 'Перечитай цель: только взрослые билеты. Сосчитай взрослых за неделю, умножь на $10, сравни с целью.'),
        data: { total, pa, goal, made, style: 'graph' },
    };
};

// ---------- problem 12: a carton of golf balls ----------

const makeGolf = (rng: Rng): Problem => {
    const have = int(rng, 120, 480), perBox = int(rng, 10, 14), boxes = int(rng, 10, 20), crates = int(rng, 2, 6);
    const crate = perBox * boxes, carton = crate * crates, total = have + carton;
    return {
        ...base, id: `${S}:golf:${have}:${perBox}:${boxes}:${crates}`,
        prompt: L(`Higher Order Thinking: a golf practice range has ${have} balls. The owner bought a carton of golf balls: ${perBox} balls to a box, ${boxes} boxes to a crate, ${crates} crates to a carton. How many golf balls does the owner have after buying the carton?`,
            `Подумай: на тренировочном поле для гольфа ${have} ${ruPlural(have, 'мяч', 'мяча', 'мячей')}. Хозяин купил упаковку мячей: ${perBox} мячей в коробке, ${boxes} коробок в ящике, ${crates} ${ruPlural(crates, 'ящик', 'ящика', 'ящиков')} в упаковке. Сколько мячей у хозяина после покупки упаковки?`),
        answer: { kind: 'number', value: total },
        steps: [
            L(`Balls in a crate: ${perBox} × ${boxes}.`, `Мячей в ящике: ${perBox} × ${boxes}.`),
            ...columnSteps(boxes, perBox).slice(2, 7),
            X(n => `Balls in the carton: ${n(crate)} × ${crates} = ${n(carton)}`).en ? W(n => `Balls in the carton: ${n(crate)} × ${crates} = ${n(carton)}`, n => `Мячей в упаковке: ${n(crate)} × ${crates} = ${n(carton)}`) : L('', ''),
            W(n => `Together with the balls he had: ${n(have)} + ${n(carton)} = ${n(total)}`, n => `Вместе с теми, что были: ${n(have)} + ${n(carton)} = ${n(total)}`),
        ],
        hint: L('Three steps: balls in a crate (box × boxes), balls in the carton (× crates), then add the balls he already had.', 'Три шага: мячи в ящике (коробка × коробки), мячи в упаковке (× ящики), потом прибавь те, что уже были.'),
        data: { have, perBox, boxes, crates, value: total, style: 'golf' },
    };
};

// ---------- problem 13: which set has the missing partial product and the final product ----------

const makeMissing = (rng: Rng): Problem => {
    const top = 10 + int(rng, 1, 4), bot = 10 * int(rng, 1, 2) + int(rng, 5, 9), ps = columnPartials(top, bot), p = top * bot;
    const shown = ps.slice(0, 3), miss = ps[3];
    const set = (x: number, y: number) => X(n => `${n(x)}; ${n(y)}`);
    const right = set(miss, p);
    const wrong = [set(miss / 10, p - miss + miss / 10), set(miss, p + 10), set(miss, p - 10), set(miss * 10, p - miss + miss * 10)];
    const options = shuffle(rng, [right, ...shuffle(rng, wrong).slice(0, 3)]);
    return {
        ...base, id: `${S}:missing:${top}:${bot}`,
        prompt: L(`${top} × ${bot}: the partial products are ${shown.join(', ')}, __. Which set of numbers has the missing partial product and the final product?`,
            `${top} × ${bot}: частичные произведения ${shown.join(', ')}, __. В каком наборе пропущенное частичное произведение и итоговое произведение?`),
        answer: { kind: 'choice', options, correct: options.indexOf(right) },
        steps: [
            L(`The missing one is tens × tens: ${tensOf(bot)} × ${tensOf(top)}.`, `Пропущено десятки × десятки: ${tensOf(bot)} × ${tensOf(top)}.`),
            factLine(tensOf(bot), tensOf(top)),
            addLine(ps, p),
            estLine(top, bot),
        ],
        hint: L(`Find the last partial product yourself (${tensOf(bot)} × ${tensOf(top)}), then add all four.`, `Сначала сама найди последнее частичное произведение (${tensOf(bot)} × ${tensOf(top)}), потом сложи все четыре.`),
        data: { a: top, b: bot, miss, value: p, style: 'missing' },
    };
};

// ---------- problem 14: select all the equations in which f is the missing factor ----------

const makeFactor = (rng: Rng): Problem => {
    const f = int(rng, 12, 19), others = [f - 1, f + 1, f + 2, f - 2, f + 5];
    const eq = (x: number, prod: number, left: boolean) => L(left ? `b × ${x} = ${fmt(prod, 'en')}` : `${x} × b = ${fmt(prod, 'en')}`, left ? `b × ${x} = ${fmt(prod, 'ru')}` : `${x} × b = ${fmt(prod, 'ru')}`);
    // five different known factors, so no two equations read the same
    const xs = shuffle(rng, Array.from({ length: 49 }, (_, i) => 21 + i)).slice(0, 5).map(x => ({ x, left: rng() < 0.5 }));
    const rightN = int(rng, 2, 3);
    const rightNums = xs.slice(0, rightN);
    const right = rightNums.map(o => eq(o.x, o.x * f, o.left));
    const wrong = xs.slice(rightN).map(o => eq(o.x, o.x * others[int(rng, 0, others.length - 1)], o.left));
    return {
        ...base, id: `${S}:factor:${f}:${rightNums.map(o => o.x).join('-')}`,
        prompt: L(`Select all the equations in which ${f} is the missing factor b.`, `Отметь все равенства, в которых пропущенный множитель b равен ${f}.`),
        answer: multi(rng, right, wrong),
        steps: [
            L(`Try b = ${f} in each equation: multiply, or divide the product by the other factor.`, `Подставь b = ${f} в каждое равенство: умножь, или раздели произведение на другой множитель.`),
            ...rightNums.map(o => X(n => `${o.x} × ${f} = ${n(o.x * f)} ✓`)),
            L('In the others, b × the factor does not give the product.', 'В остальных b × множитель не даёт произведение.'),
        ],
        hint: L(`Estimate: ${f} is about ${roundTo(f, 10)}. Then check the ones digit: the product must end like the factor × ${onesOf(f)}.`, `Прикинь: ${f} - это примерно ${roundTo(f, 10)}. Потом проверь единицы: произведение должно оканчиваться как множитель × ${onesOf(f)}.`),
        data: { f, style: 'factor' },
    };
};

export const makeTopic4PP = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_4_6, want);
    if (style === 'column') return makeColumn(rng);
    if (style === 'reason') return makeReason(rng);
    if (style === 'mistakes') return makeMistakes(rng);
    if (style === 'graph') return makeGraph(rng);
    if (style === 'golf') return makeGolf(rng);
    if (style === 'missing') return makeMissing(rng);
    return makeFactor(rng);
};
