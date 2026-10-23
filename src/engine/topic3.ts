import { type Answer, type FillLine, type FillPart, type L10n, type Problem, type Rng, type SkillId, L, choice, fmt, int, multi, pick, pickStyle, ruPlural, shuffle } from './core';
import { placeParts } from './strategies';
import { roundTo } from './estimation';
import { AMELIIA } from './words';

// Topic 3 of her class (Savvas enVision "Use Strategies and Properties to Multiply by 1-Digit Numbers"),
// the reteaching sets A-H and the assessment practice 1-20 before the test (4.NBT.B.5, 4.OA.A.2, 4.OA.A.3):
// - mult-tens: basic facts and place value with multiples of 10, 100 and 1,000 (Set A)
// - mult-mental: the Commutative and Associative Properties and compensation, 9 × 67 = 9 × 70 − 9 × 3 (Set F)
// - mult-expr: which expressions or partial products match a product, "select all that apply" (Q4, 6, 8, 11, 12, 16, 18, 20)
// - mult-word: bar diagrams and multi-step word problems with tables (Set H, Q3, 5, 9, 10, 13, 14, 15, 17)

const B = (b: number): FillPart => ({ b });
// one template in both languages: numbers are written 1,234 in English and 1 234 in Russian
const X = (f: (n: (x: number) => string) => string): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
// an expression and its value, so a "select all" option is right exactly when its value is the product
type Opt = { t: L10n; v: number };
const O = (v: number, f: (n: (x: number) => string) => string): Opt => ({ t: X(f), v });
const multiOf = (rng: Rng, target: number, opts: Opt[]): Answer => multi(rng, opts.filter(o => o.v === target).map(o => o.t), opts.filter(o => o.v !== target).map(o => o.t));
const plusParts = (parts: number[], n: (x: number) => string) => parts.map(n).join(' + ');
const timesParts = (m: number, parts: number[], n: (x: number) => string) => parts.map(p => `(${m} × ${n(p)})`).join(' + ');
const SELECT_ALL = L('Select all that apply.', 'Выбери все подходящие ответы.');

// a number whose digits are all not zero, so every place gives a real part
const fullDigits = (rng: Rng, digits: number) => Number(Array.from({ length: digits }, () => int(rng, 1, 9)).join(''));

// "Check: 1,874 is about 2,000, 3 × 2,000 = 6,000, close to 5,622 ✓"
const estimateLine = (m: number, a: number): L10n => {
    const place = a >= 1000 ? 1000 : a >= 100 ? 100 : 10;
    const r = roundTo(a, place);
    return X(n => `${n(a)} → ${n(r)}, ${m} × ${n(r)} = ${n(m * r)}`);
};
const reasonable = (m: number, a: number): L10n => {
    const e = estimateLine(m, a);
    return L(`Reasonable? Estimate: ${e.en}, close to ${fmt(m * a, 'en')} ✓`, `Правдоподобно? Прикидка: ${e.ru}, близко к ${fmt(m * a, 'ru')} ✓`);
};
const partialSteps = (m: number, a: number): L10n[] => {
    const parts = placeParts(a);
    return [
        ...parts.map(p => X(n => `${m} × ${n(p)} = ${n(m * p)}`)),
        X(n => `${parts.map(p => n(m * p)).join(' + ')} = ${n(m * a)}`),
    ];
};

// ---------- Set A: multiply by multiples of 10, 100 and 1,000 ----------

// the place name after a number in Russian: [1, 2-4, 5+]
const PLACE: [number, string, [string, string, string]][] = [[10, 'tens', ['десяток', 'десятка', 'десятков']], [100, 'hundreds', ['сотня', 'сотни', 'сотен']], [1000, 'thousands', ['тысяча', 'тысячи', 'тысяч']]];
// basic facts that already end in zero: the answer gets an extra zero (5 × 4,000 = 20,000)
const ZERO_FACTS: [number, number][] = [[5, 2], [5, 4], [5, 6], [5, 8], [2, 5], [4, 5], [6, 5], [8, 5]];

const makeTens = (rng: Rng, want?: string): Problem => {
    const style = pickStyle(rng, ['plain', 'plain', 'plain', 'units', 'pattern', 'zero'] as const, want);
    const [m, d] = style === 'zero' || rng() < 0.3 ? pick(rng, ZERO_FACTS) : [int(rng, 2, 9), int(rng, 2, 9)];
    const k = int(rng, 1, 3), [place, wordEn, wordRu] = PLACE[k - 1];
    const word = L(wordEn, wordRu[2]);
    const b = d * place, p = m * b, fact = m * d;
    const id = `mult-tens:${style}:${m}:${b}`;
    const extraZero = fact % 10 === 0
        ? [L(`The basic fact ${m} × ${d} = ${fact} already ends in zero, so the answer has one more zero than ${fmt(b, 'en')}: ${fmt(p, 'en')}.`,
            `Табличный пример ${m} × ${d} = ${fact} уже заканчивается нулём, поэтому в ответе на один ноль больше, чем в ${fmt(b, 'ru')}: ${fmt(p, 'ru')}.`)]
        : [];
    const steps: L10n[] = [
        L(`${m} × ${fmt(b, 'en')} is ${m} × ${d} ${word.en}.`, `${m} × ${fmt(b, 'ru')} - это ${m} × ${d} ${word.ru}.`),
        L(`Basic fact: ${m} × ${d} = ${fact}.`, `Табличный пример: ${m} × ${d} = ${fact}.`),
        L(`${fact} ${wordEn}: ${fact} × ${fmt(place, 'en')} = ${fmt(p, 'en')}.`, `${fact} ${ruPlural(fact, ...wordRu)}: ${fact} × ${fmt(place, 'ru')} = ${fmt(p, 'ru')}.`),
        ...extraZero,
    ];
    const hint = L(`Use the basic fact ${m} × ${d}, then write the zeros of ${fmt(b, 'en')}.`, `Возьми табличный пример ${m} × ${d}, потом допиши нули из ${fmt(b, 'ru')}.`);
    if (style === 'units') {
        const lines: FillLine[] = [
            { label: L('Use place value', 'Используй разряды'), parts: [`${m} × ${fmt(b, 'en')} = ${m} × `, B(0), ' ', { t: word }] },
            { parts: ['= ', B(1), ' ', { t: word }] },
            { parts: ['= ', { echo: 1 }, ` × ${fmt(place, 'en')}`, ' = ', B(2)] },
        ];
        return {
            id, skill: 'mult-tens', topic: 'estimation',
            prompt: L(`Find ${m} × ${fmt(b, 'en')} with basic facts and place value.`, `Найди ${m} × ${fmt(b, 'ru')} с помощью таблицы умножения и разрядов.`),
            answer: { kind: 'fill', layout: 'lines', values: [d, fact, p], lines },
            steps, hint, data: { m, b, style },
        };
    }
    if (style === 'pattern') {
        const row = [d, d * 10, d * 100, d * 1000];
        return {
            id, skill: 'mult-tens', topic: 'estimation',
            prompt: L(`Finish the pattern: ${m} × ${d}, ${m} × ${d * 10}, ${m} × ${fmt(d * 100, 'en')}, ${m} × ${fmt(d * 1000, 'en')}.`, `Продолжи закономерность: ${m} × ${d}, ${m} × ${d * 10}, ${m} × ${fmt(d * 100, 'ru')}, ${m} × ${fmt(d * 1000, 'ru')}.`),
            answer: { kind: 'fill', layout: 'lines', values: row.map(x => m * x), lines: row.map((x, i) => ({ parts: [`${m} × ${fmt(x, 'en')} = `, B(i)] })) },
            steps: [
                L(`Basic fact: ${m} × ${d} = ${fact}.`, `Табличный пример: ${m} × ${d} = ${fact}.`),
                L('Each time the second factor gets one more zero, the product gets one more zero too.', 'Каждый раз, когда у второго множителя появляется ещё один ноль, у произведения тоже появляется ещё один ноль.'),
                ...row.map(x => X(n => `${m} × ${n(x)} = ${n(m * x)}`)),
            ],
            hint: L(`Start with ${m} × ${d}, then add one zero at a time.`, `Начни с ${m} × ${d}, потом добавляй по одному нулю.`),
            data: { m, b: d * 1000, style },
        };
    }
    if (style === 'zero') {
        return {
            id, skill: 'mult-tens', topic: 'estimation',
            prompt: L(`What is ${m} × ${fmt(b, 'en')}?`, `Сколько будет ${m} × ${fmt(b, 'ru')}?`),
            answer: choice(rng, X(n => n(p)), [X(n => n(p / 10)), X(n => n(p * 10)), X(n => n(p >= 1000 ? p / 100 : m + b))]),
            steps, hint, data: { m, b, style },
        };
    }
    const flip = rng() < 0.4;
    return {
        id: `${id}:${flip ? 'f' : 'n'}`, skill: 'mult-tens', topic: 'estimation',
        prompt: flip ? L(`Find ${fmt(b, 'en')} × ${m}.`, `Найди ${fmt(b, 'ru')} × ${m}.`) : L(`Find ${m} × ${fmt(b, 'en')}.`, `Найди ${m} × ${fmt(b, 'ru')}.`),
        answer: { kind: 'number', value: p },
        steps: [...(flip ? [L(`${fmt(b, 'en')} × ${m} is the same as ${m} × ${fmt(b, 'en')}.`, `${fmt(b, 'ru')} × ${m} - то же самое, что ${m} × ${fmt(b, 'ru')}.`)] : []), ...steps],
        hint, data: { m, b, style },
    };
};

// ---------- Set F: mental math with properties and compensation ----------

// a number close to a round one: 67 = 70 − 3, 198 = 200 − 2, 937 = 940 − 3, 52 = 50 + 2
const nearRound = (rng: Rng, sub: boolean) => {
    const R = pick(rng, [10 * int(rng, 3, 9), 100 * int(rng, 2, 9), 10 * int(rng, 12, 98)]);
    const k = sub ? int(rng, 1, 3) : int(rng, 1, 2);
    return { R, k, a: sub ? R - k : R + k };
};

type CompStory = (m: number, a: number) => L10n;
const COMP_STORIES: CompStory[] = [
    (m, a) => L(`Alberto rode the train ${fmt(a, 'en')} miles round trip ${m} times last month. Use mental math to find the total distance he traveled.`,
        `Альберто ${m} ${ruPlural(m, 'раз', 'раза', 'раз')} за месяц съездил на поезде туда и обратно, каждая поездка - ${fmt(a, 'ru')} ${ruPlural(a, 'миля', 'мили', 'миль')}. Посчитай в уме, сколько всего миль он проехал.`),
    (m, a) => L(`A bookstore sold ${m} boxes of books. Each box holds ${fmt(a, 'en')} books. Use mental math to find how many books were sold.`,
        `Книжный магазин продал ${m} ${ruPlural(m, 'коробку', 'коробки', 'коробок')} книг. В каждой коробке ${fmt(a, 'ru')} ${ruPlural(a, 'книга', 'книги', 'книг')}. Посчитай в уме, сколько книг продали.`),
    (m, a) => L(`A farm stand packs ${fmt(a, 'en')} apples in each crate. ${AMELIIA.en}'s class buys ${m} crates for the fall fair. Use mental math to find how many apples that is.`,
        `Фермерский прилавок кладёт в каждый ящик ${fmt(a, 'ru')} ${ruPlural(a, 'яблоко', 'яблока', 'яблок')}. Класс ${AMELIIA.ruGen} покупает ${m} ${ruPlural(m, 'ящик', 'ящика', 'ящиков')} для осенней ярмарки. Посчитай в уме, сколько это яблок.`),
];

const makeMental = (rng: Rng, want?: string): Problem => {
    const style = pickStyle(rng, ['comp', 'comp', 'story', 'assoc', 'how'] as const, want);
    const m = int(rng, 3, 9);
    if (style === 'assoc') {
        // 8 × 50 = (4 × 2) × 50 = 4 × (2 × 50) = 4 × 100: find the pair that makes 10, 100 or 1,000
        const [y, f] = pick(rng, [[5, 2], [50, 2], [500, 2], [25, 4], [250, 4]] as [number, number][]);
        const c = int(rng, 2, 9), x = c * f, p = x * y;
        const flip = rng() < 0.5;
        return {
            id: `mult-mental:assoc:${x}:${y}:${flip ? 'f' : 'n'}`, skill: 'mult-mental', topic: 'estimation',
            prompt: flip ? L(`Use the Commutative and Associative Properties to find ${fmt(y, 'en')} × ${x}.`, `Используй переместительное и сочетательное свойства, чтобы найти ${fmt(y, 'ru')} × ${x}.`)
                : L(`Use the Commutative and Associative Properties to find ${x} × ${fmt(y, 'en')}.`, `Используй переместительное и сочетательное свойства, чтобы найти ${x} × ${fmt(y, 'ru')}.`),
            answer: { kind: 'number', value: p },
            steps: [
                ...(flip ? [L(`Commutative: ${fmt(y, 'en')} × ${x} = ${x} × ${fmt(y, 'en')}.`, `Переместительное: ${fmt(y, 'ru')} × ${x} = ${x} × ${fmt(y, 'ru')}.`)] : []),
                L(`Look for a pair that makes a round number: ${f} × ${fmt(y, 'en')} = ${fmt(f * y, 'en')}.`, `Ищем пару, которая даёт круглое число: ${f} × ${fmt(y, 'ru')} = ${fmt(f * y, 'ru')}.`),
                X(n => `${x} × ${n(y)} = (${c} × ${f}) × ${n(y)} = ${c} × (${f} × ${n(y)}) = ${c} × ${n(f * y)} = ${n(p)}`),
                L('Moving the brackets (associative) and swapping the factors (commutative) never changes the product.', 'Если переставить скобки (сочетательное свойство) или поменять множители местами (переместительное), произведение не меняется.'),
            ],
            hint: L(`${x} = ${c} × ${f}. What is ${f} × ${fmt(y, 'en')}?`, `${x} = ${c} × ${f}. Сколько будет ${f} × ${fmt(y, 'ru')}?`),
            data: { x, y, style, value: p },
        };
    }
    const sub = style === 'how' || rng() < 0.75;
    const { R, k, a } = nearRound(rng, sub);
    const p = m * a, op = sub ? ' − ' : ' + ';
    const steps: L10n[] = [
        L(`${fmt(a, 'en')} is close to ${fmt(R, 'en')}: ${fmt(a, 'en')} = ${fmt(R, 'en')}${op}${k}.`, `${fmt(a, 'ru')} близко к ${fmt(R, 'ru')}: ${fmt(a, 'ru')} = ${fmt(R, 'ru')}${op}${k}.`),
        L(`Multiply mentally: ${m} × ${fmt(R, 'en')} = ${fmt(m * R, 'en')}.`, `Умножаем в уме: ${m} × ${fmt(R, 'ru')} = ${fmt(m * R, 'ru')}.`),
        sub ? L(`That used ${k} too many in each of the ${m} groups, so subtract ${m} × ${k} = ${m * k}.`, `Мы взяли по ${k} ${k === 1 ? 'лишнему' : 'лишних'} в каждой из ${m} групп, поэтому вычитаем ${m} × ${k} = ${m * k}.`)
            : L(`Each of the ${m} groups still needs ${k} more, so add ${m} × ${k} = ${m * k}.`, `Каждой из ${m} групп не хватает ещё ${k}, поэтому прибавляем ${m} × ${k} = ${m * k}.`),
        X(n => `${n(m * R)}${op}${n(m * k)} = ${n(p)}`),
        L(`So ${m} × ${fmt(a, 'en')} = ${fmt(p, 'en')}.`, `Значит ${m} × ${fmt(a, 'ru')} = ${fmt(p, 'ru')}.`),
        ...(sub ? [L(`Careful: subtract ${m} × ${k}, not just ${k}.`, `Осторожно: вычитаем ${m} × ${k}, а не просто ${k}.`)] : []),
    ];
    const hint = L(`Think of ${fmt(a, 'en')} as ${fmt(R, 'en')}${op}${k}. Multiply ${fmt(R, 'en')} first, then fix the ${k}.`, `Представь ${fmt(a, 'ru')} как ${fmt(R, 'ru')}${op}${k}. Сначала умножь ${fmt(R, 'ru')}, потом поправь на ${k}.`);
    if (style === 'how') {
        return {
            id: `mult-mental:how:${m}:${a}`, skill: 'mult-mental', topic: 'estimation',
            prompt: L(`How can you use mental math to find the product of ${m} × ${fmt(a, 'en')}?`, `Как найти произведение ${m} × ${fmt(a, 'ru')} в уме?`),
            answer: choice(rng, L(
                `Think ${m} × ${fmt(R, 'en')} = ${fmt(m * R, 'en')}, then subtract ${m} × ${k} = ${m * k}: ${fmt(m * R, 'en')} − ${m * k} = ${fmt(p, 'en')}`,
                `Посчитать ${m} × ${fmt(R, 'ru')} = ${fmt(m * R, 'ru')}, потом вычесть ${m} × ${k} = ${m * k}: ${fmt(m * R, 'ru')} − ${m * k} = ${fmt(p, 'ru')}`), [
                L(`Think ${m} × ${fmt(R, 'en')}, then subtract only ${k}`, `Посчитать ${m} × ${fmt(R, 'ru')}, потом вычесть только ${k}`),
                L(`Think ${m} × ${fmt(R, 'en')}, then add ${m} × ${k}`, `Посчитать ${m} × ${fmt(R, 'ru')}, потом прибавить ${m} × ${k}`),
                L(`Round ${fmt(a, 'en')} to ${fmt(R, 'en')}: the exact product is ${m} × ${fmt(R, 'en')}`, `Округлить ${fmt(a, 'ru')} до ${fmt(R, 'ru')}: точное произведение - это ${m} × ${fmt(R, 'ru')}`),
            ]),
            steps, hint, data: { m, a, R, k, sub: 1, style, value: p },
        };
    }
    // compensation as a worksheet: the round number, both products, then fix
    const lines: FillLine[] = [
        { label: L(`Think: ${fmt(a, 'en')} is close to a round number`, `Подумай: ${fmt(a, 'ru')} близко к круглому числу`), parts: [`${fmt(a, 'en')} = `, B(0), op, B(1)] },
        { label: L('Multiply the round number', 'Умножь круглое число'), parts: [`${m} × `, { echo: 0 }, ' = ', B(2)] },
        { label: sub ? L('How much too many?', 'Сколько лишнего?') : L('How much is missing?', 'Сколько не хватает?'), parts: [`${m} × `, { echo: 1 }, ' = ', B(3)] },
        { label: sub ? L('Adjust by subtracting', 'Поправь вычитанием') : L('Adjust by adding', 'Поправь сложением'), parts: [{ echo: 2 }, op, { echo: 3 }, ' = ', B(4)] },
    ];
    const si = int(rng, 0, COMP_STORIES.length - 1), story = style === 'story' ? COMP_STORIES[si](m, a) : null;
    return {
        id: `mult-mental:${style}:${m}:${a}${story ? `:${si}` : ''}`, skill: 'mult-mental', topic: 'estimation',
        prompt: story ?? L(`Use compensation to find ${m} × ${fmt(a, 'en')}: use a round number close to ${fmt(a, 'en')}, then adjust.`, `Найди ${m} × ${fmt(a, 'ru')} с поправкой: возьми круглое число рядом с ${fmt(a, 'ru')}, потом поправь ответ.`),
        answer: { kind: 'fill', layout: 'lines', values: [R, k, m * R, m * k, p], lines },
        steps, hint, data: { m, a, R, k, sub: sub ? 1 : 0, style, value: p },
    };
};

// ---------- Assessment practice: which expressions match ----------

const makeExpr = (rng: Rng, want?: string): Problem => {
    const style = pickStyle(rng, ['partials', 'expand', 'same', 'back', 'product', 'equiv', 'pick'] as const, want);
    const m = int(rng, 3, 9);
    if (style === 'partials') {
        // 1,874 × 3: 3,000, 2,400, 210 and 12 are the partial products; 5,400 and 2,000 are traps
        const a = fullDigits(rng, rng() < 0.5 ? 3 : 4), parts = placeParts(a), right = parts.map(p => m * p);
        const traps = shuffle(rng, [...parts.map(p => m * p * 10), ...parts.filter(p => p >= 10).map(p => (m * p) / 10), ...parts.map(p => (m + 1) * p), m * parts[0] + parts[1]])
            .filter((v, i, all) => Number.isInteger(v) && !right.includes(v) && all.indexOf(v) === i).slice(0, 6 - right.length);
        return {
            id: `mult-expr:partials:${m}:${a}`, skill: 'mult-expr', topic: 'estimation',
            prompt: L(`What are the partial products when finding ${fmt(a, 'en')} × ${m}? ${SELECT_ALL.en}`, `Какие частичные произведения получаются при умножении ${fmt(a, 'ru')} × ${m}? ${SELECT_ALL.ru}`),
            answer: multi(rng, right.map(v => X(n => n(v))), traps.map(v => X(n => n(v)))),
            steps: [X(n => `${n(a)} = ${plusParts(parts, n)}`), L(`Multiply ${m} by every place value part:`, `Умножаем ${m} на каждую часть по разрядам:`), ...partialSteps(m, a), reasonable(m, a)],
            hint: L(`Break ${fmt(a, 'en')} apart by place value, then multiply each part by ${m}.`, `Разбей ${fmt(a, 'ru')} по разрядам и умножь каждую часть на ${m}.`),
            data: { m, a, style, value: m * a },
        };
    }
    if (style === 'expand') {
        // 1,235 × 9: the expanded form in brackets, the distributed products and the swapped factors all work
        const a = fullDigits(rng, rng() < 0.6 ? 4 : 3), parts = placeParts(a), target = m * a;
        const tens = parts[parts.length - 2], swapTens = tens === 90 ? tens - 10 : tens + 10;
        const off = parts.map(p => (p === tens ? swapTens : p));
        const opts: Opt[] = [
            O(target, n => `${m} × (${plusParts(parts, n)})`),
            O(m * off.reduce((s, x) => s + x, 0), n => `${m} × (${plusParts(off, n)})`),
            O(target, n => timesParts(m, parts, n)),
            O(target, n => `${m} × ${n(a)}`),
            O(a + m, n => `${n(a)} + ${m}`),
            O(m * parts[0] + (a - parts[0]), n => `(${m} × ${n(parts[0])}) + ${n(a - parts[0])}`),
        ];
        return {
            id: `mult-expr:expand:${m}:${a}`, skill: 'mult-expr', topic: 'estimation',
            prompt: L(`Select all the expressions that could be used to find ${fmt(a, 'en')} × ${m}.`, `Выбери все выражения, с помощью которых можно найти ${fmt(a, 'ru')} × ${m}.`),
            answer: multiOf(rng, target, opts),
            steps: [
                X(n => `${n(a)} = ${plusParts(parts, n)}`),
                L(`${m} × (${plusParts(parts, x => fmt(x, 'en'))}) keeps the whole number together, so it works.`, `${m} × (${plusParts(parts, x => fmt(x, 'ru'))}) - это всё число целиком, подходит.`),
                X(n => `${timesParts(m, parts, n)} = ${parts.map(p => n(m * p)).join(' + ')} = ${n(target)}`),
                L(`${m} × ${fmt(a, 'en')} is the same as ${fmt(a, 'en')} × ${m} (commutative property).`, `${m} × ${fmt(a, 'ru')} - то же самое, что ${fmt(a, 'ru')} × ${m} (переместительное свойство).`),
                L(`Traps: a wrong digit in the brackets, adding ${m} instead of multiplying, or multiplying only the first part.`, `Ловушки: неверная цифра в скобках, прибавить ${m} вместо умножения или умножить только первую часть.`),
            ],
            hint: L(`Each right expression must have the value ${fmt(a, 'en')} × ${m}. Check every part inside the brackets.`, `Каждое верное выражение должно равняться ${fmt(a, 'ru')} × ${m}. Проверь каждую часть в скобках.`),
            data: { m, a, style, value: target },
        };
    }
    if (style === 'same') {
        // 5 × 617 = (5 × 600) + (5 × 10) + (5 × 7), not the digits alone
        const a = fullDigits(rng, 3), [h, t, o] = placeParts(a), target = m * a;
        const opts: Opt[] = [
            O(target, n => timesParts(m, [h, t, o], n)),
            O(m * (h / 100 + t / 10 + o), () => `(${m} × ${h / 100}) + (${m} × ${t / 10}) + (${m} × ${o})`),
            O(m * (h / 10 + t + o * 10), () => `(${m} × ${h / 10}) + (${m} × ${t}) + (${m} × ${o * 10})`),
            O(m * (h + t / 10 + o), n => `(${m} × ${n(h)}) + (${m} × ${t / 10}) + (${m} × ${o})`),
        ];
        const right = opts[0], wrong = opts.slice(1).filter(o => o.v !== target);
        return {
            id: `mult-expr:same:${m}:${a}`, skill: 'mult-expr', topic: 'estimation',
            prompt: L(`Which expression has the same value as ${m} × ${a}?`, `Какое выражение имеет то же значение, что и ${m} × ${a}?`),
            answer: choice(rng, right.t, wrong.map(w => w.t)),
            steps: [X(n => `${a} = ${n(h)} + ${t} + ${o}`), X(n => `${m} × ${a} = ${timesParts(m, [h, t, o], n)} = ${n(m * h)} + ${m * t} + ${m * o} = ${n(target)}`),
                L(`The digit ${h / 100} means ${h} and the digit ${t / 10} means ${t}: use the place values, not the digits.`, `Цифра ${h / 100} означает ${h}, а цифра ${t / 10} - ${t}: бери значения разрядов, а не цифры.`)],
            hint: L(`Write ${a} in expanded form first: hundreds + tens + ones.`, `Сначала запиши ${a} суммой разрядов: сотни + десятки + единицы.`),
            data: { m, a, style, value: target },
        };
    }
    if (style === 'back') {
        // (400 × 3) + (36 × 3) is 436 × 3: the distributive property read backwards
        const h = 100 * int(rng, 1, 9), r = int(rng, 11, 99), a = h + r, target = a * m;
        const answer = choice(rng, L(`${a} × ${m}`, `${a} × ${m}`), [
            L(`${a} ÷ ${m}`, `${a} ÷ ${m}`), L(`${h} × ${m} + ${r}`, `${h} × ${m} + ${r}`), L(`${h} × ${r + m}`, `${h} × ${r + m}`),
        ]);
        return {
            id: `mult-expr:back:${m}:${a}`, skill: 'mult-expr', topic: 'estimation',
            prompt: L(`Which of the following is equivalent to (${h} × ${m}) + (${r} × ${m})?`, `Какое выражение равно (${h} × ${m}) + (${r} × ${m})?`),
            answer,
            steps: [L(`Both parts are multiplied by the same ${m}, so join the parts: ${h} + ${r} = ${a}.`, `Обе части умножаются на одно и то же ${m}, поэтому соединяем части: ${h} + ${r} = ${a}.`),
                X(n => `(${h} × ${m}) + (${r} × ${m}) = ${n(h * m)} + ${n(r * m)} = ${n(target)}`), X(n => `${a} × ${m} = ${n(target)}`)],
            hint: L(`What number do you get when you put ${h} and ${r} back together?`, `Какое число получится, если снова сложить ${h} и ${r}?`),
            data: { m, a, style, value: target },
        };
    }
    if (style === 'product') {
        // all expressions with a product of 640: (6 × 100) + (4 × 10) and 160 × 4 yes, (6 × 100) × (4 × 10) no
        const d1 = int(rng, 1, 9), d2 = int(rng, 1, 9), P = 100 * d1 + 10 * d2;
        const divs = [2, 3, 4, 5, 6, 7, 8, 9].filter(x => P % x === 0 && P / x >= 11);
        const f = pick(rng, divs), q = P / f, near = q + int(rng, 1, 3);
        const opts: Opt[] = [
            O(P, () => `(${d1} × 100) + (${d2} × 10)`),
            O(P, () => `${q} × ${f}`),
            O(d1 * d2 * 1000, n => `(${d1} × 100) × (${d2} × 10)`),
            O(d1 * 10 * d2, () => `${d1 * 10} × ${d2} × 1`),
            O(f * near, () => `${f} × ${near}`),
            ...(rng() < 0.5 ? [O(P, () => `${P / 10} × 10`)] : []),
        ];
        return {
            id: `mult-expr:product:${P}:${f}`, skill: 'mult-expr', topic: 'estimation',
            prompt: L(`Select all of the expressions that have a product of ${P}.`, `Выбери все выражения, значение которых равно ${P}.`),
            answer: multiOf(rng, P, opts),
            steps: [
                L(`(${d1} × 100) + (${d2} × 10) = ${d1 * 100} + ${d2 * 10} = ${P}: the expanded form of ${P}.`, `(${d1} × 100) + (${d2} × 10) = ${d1 * 100} + ${d2 * 10} = ${P}: это ${P}, разложенное по разрядам.`),
                L(`${q} × ${f} = ${P} ✓`, `${q} × ${f} = ${P} ✓`),
                L(
                    `(${d1} × 100) × (${d2} × 10) = ${d1 * 100} × ${d2 * 10} = ${fmt(d1 * d2 * 1000, 'en')}: multiplying the parts instead of adding them is wrong.`,
                    `(${d1} × 100) × (${d2} × 10) = ${d1 * 100} × ${d2 * 10} = ${fmt(d1 * d2 * 1000, 'ru')}: перемножать части вместо сложения - неверно.`),
                L(`${d1 * 10} × ${d2} × 1 = ${d1 * d2 * 10}, ${f} × ${near} = ${f * near}.`, `${d1 * 10} × ${d2} × 1 = ${d1 * d2 * 10}, ${f} × ${near} = ${f * near}.`),
            ],
            hint: L(`Find the value of every expression. Is it exactly ${P}?`, `Посчитай каждое выражение. Получается ровно ${P}?`),
            data: { P, f, style, value: P },
        };
    }
    if (style === 'equiv') {
        // 8 × 493: (8 × 400) + (8 × 90) + (8 × 3), 493 × 8 and (8 × 500) − (8 × 7) all work
        const R = 100 * int(rng, 2, 9), k = int(rng, 2, 9), a = R - k, parts = placeParts(a), target = m * a;
        const rest = a - parts[0];
        const opts: Opt[] = [
            O(target, n => timesParts(m, parts, n)),
            O(m * parts[0] + rest, n => `(${m} × ${n(parts[0])}) + ${rest}`),
            O(target, n => `${a} × ${m}`),
            O(m * R - m * rest, n => `(${m} × ${R}) − (${m} × ${rest})`),
            O(target, () => `(${m} × ${R}) − (${m} × ${k})`),
        ];
        return {
            id: `mult-expr:equiv:${m}:${a}`, skill: 'mult-expr', topic: 'estimation',
            prompt: L(`Which of the following are equivalent to ${m} × ${a}? ${SELECT_ALL.en}`, `Какие выражения равны ${m} × ${a}? ${SELECT_ALL.ru}`),
            answer: multiOf(rng, target, opts),
            steps: [
                L(
                    `Distributive: ${timesParts(m, parts, x => fmt(x, 'en'))} = ${parts.map(p => fmt(m * p, 'en')).join(' + ')} = ${fmt(target, 'en')}.`,
                    `Распределительное: ${timesParts(m, parts, x => fmt(x, 'ru'))} = ${parts.map(p => fmt(m * p, 'ru')).join(' + ')} = ${fmt(target, 'ru')}.`),
                L(`Commutative: ${a} × ${m} is the same as ${m} × ${a}.`, `Переместительное: ${a} × ${m} - то же самое, что ${m} × ${a}.`),
                L(`Compensation: ${a} = ${R} − ${k}, so (${m} × ${R}) − (${m} × ${k}) = ${fmt(m * R, 'en')} − ${m * k} = ${fmt(target, 'en')}.`,
                    `С поправкой: ${a} = ${R} − ${k}, значит (${m} × ${R}) − (${m} × ${k}) = ${fmt(m * R, 'ru')} − ${m * k} = ${fmt(target, 'ru')}.`),
                L(`(${m} × ${R}) − (${m} × ${rest}) takes away too much: ${R} − ${rest} is not ${a}.`, `(${m} × ${R}) − (${m} × ${rest}) отнимает слишком много: ${R} − ${rest} - это не ${a}.`),
            ],
            hint: L(`${a} = ${R} − ${k}. Which expressions keep all of ${a} and multiply every part by ${m}?`, `${a} = ${R} − ${k}. Какие выражения сохраняют всё число ${a} и умножают на ${m} каждую часть?`),
            data: { m, a, style, value: target },
        };
    }
    // 5 × 1,903: 9,515, not 9,505 (a lost carry) or 965 (a lost zero)
    let a = 0;
    for (;;) {
        const ds = [int(rng, 1, 9), int(rng, 1, 9), int(rng, 1, 9), int(rng, 1, 9)];
        ds[int(rng, 1, 2)] = 0;
        a = Number(ds.join(''));
        if (m * (a % 10) >= 10) break;
    }
    const target = m * a, digits = String(target);
    const swapped = Number(digits.slice(0, 1) + digits[2] + digits[1] + digits.slice(3));
    const noZero = m * Number(String(a).replace('0', ''));
    const lostCarry = target - 10 * Math.floor((m * (a % 10)) / 10);
    return {
        id: `mult-expr:pick:${m}:${a}`, skill: 'mult-expr', topic: 'estimation',
        prompt: L(`What is the product of ${m} × ${fmt(a, 'en')}?`, `Чему равно произведение ${m} × ${fmt(a, 'ru')}?`),
        answer: choice(rng, X(n => n(target)), [lostCarry, swapped, noZero, target + 100].filter(v => v !== target).map(v => X(n => n(v)))),
        steps: [X(n => `${n(a)} = ${plusParts(placeParts(a), n)}`), ...partialSteps(m, a), reasonable(m, a),
            L(`Watch the zero: ${m} × 0 = 0, but a carried number still goes into that place.`, `Внимание на ноль: ${m} × 0 = 0, но перенесённое число всё равно попадает в этот разряд.`)],
        hint: L(`Estimate first: ${estimateLine(m, a).en}. Which answer is close and exact?`, `Сначала прикинь: ${estimateLine(m, a).ru}. Какой ответ близко и точный?`),
        data: { m, a, style, value: target },
    };
};

// ---------- Set H and the word problems of the assessment ----------

type Thing = { en: [string, string]; ru: [string, string, string] };
const T = (en: [string, string], ru: [string, string, string]): Thing => ({ en, ru });
const cnt = (x: number, t: Thing): L10n => L(`${fmt(x, 'en')} ${x === 1 ? t.en[0] : t.en[1]}`, `${fmt(x, 'ru')} ${ruPlural(x, ...t.ru)}`);

// "Mia has 34 dolls. A toy store's warehouse has 5 times as many dolls."
type BarStory = { thing: Thing; letter: string; small: L10n; big: L10n; setup: (b: number, k: number) => L10n; ask: L10n };
const BAR_STORIES: BarStory[] = [
    { thing: T(['doll', 'dolls'], ['кукла', 'куклы', 'кукол']), letter: 'd', small: L('Mia', 'Мия'), big: L('warehouse', 'склад'),
        setup: (b, k) => L(`Mia has a collection of ${b} dolls. A toy store's warehouse has ${k} times as many dolls.`, `У Мии коллекция из ${b} ${ruPlural(b, 'куклы', 'кукол', 'кукол')}. На складе магазина игрушек в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше кукол.`),
        ask: L('How many dolls are in the warehouse?', 'Сколько кукол на складе?') },
    { thing: T(['book', 'books'], ['книга', 'книги', 'книг']), letter: 'b', small: L('Ameliia', 'Амелия'), big: L('library', 'библиотека'),
        setup: (b, k) => L(`Ameliia has ${b} books at home. The class library has ${k} times as many books.`, `У Амелии дома ${b} ${ruPlural(b, 'книга', 'книги', 'книг')}. В библиотеке класса в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше книг.`),
        ask: L('How many books are in the class library?', 'Сколько книг в библиотеке класса?') },
    { thing: T(['seashell', 'seashells'], ['ракушка', 'ракушки', 'ракушек']), letter: 's', small: L('Martin', 'Мартин'), big: L('Ameliia', 'Амелия'),
        setup: (b, k) => L(`Little Martin found ${b} seashells at the Jersey Shore. Ameliia found ${k} times as many.`, `Маленький Мартин нашёл на побережье Джерси ${b} ${ruPlural(b, 'ракушку', 'ракушки', 'ракушек')}. Амелия нашла в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше.`),
        ask: L('How many seashells did Ameliia find?', 'Сколько ракушек нашла Амелия?') },
    { thing: T(['sticker', 'stickers'], ['наклейка', 'наклейки', 'наклеек']), letter: 's', small: L('Emma', 'Эмма'), big: L('the store', 'магазин'),
        setup: (b, k) => L(`Emma has ${b} stickers. The craft store has ${k} times as many stickers on one shelf.`, `У Эммы ${b} ${ruPlural(b, 'наклейка', 'наклейки', 'наклеек')}. На одной полке магазина для творчества в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше наклеек.`),
        ask: L('How many stickers are on the shelf?', 'Сколько наклеек на полке?') },
];

const equationLines = (letter: string): FillLine[] => [{ label: L('Equation', 'Уравнение'), parts: [`${letter} = `, B(0), ' × ', B(1), ' = ', B(2)] }];

// the vegetable garden of the science class: rows of each plant, the same number of plants in every row
const GARDEN: [L10n, [number, number]][] = [
    [L('Strawberries', 'Клубника'), [41, 79]], [L('Peppers', 'Перец'), [12, 29]], [L('Squash', 'Кабачки'), [11, 19]], [L('Tomatoes', 'Помидоры'), [14, 39]],
];
const PLANTS: Thing[] = [T(['strawberry plant', 'strawberry plants'], ['куст клубники', 'куста клубники', 'кустов клубники']), T(['pepper plant', 'pepper plants'], ['куст перца', 'куста перца', 'кустов перца']),
    T(['squash plant', 'squash plants'], ['куст кабачков', 'куста кабачков', 'кустов кабачков']), T(['tomato plant', 'tomato plants'], ['куст помидоров', 'куста помидоров', 'кустов помидоров'])];

// the coffee shop table of the assessment: cups of hot drinks sold in one week
const DRINKS: [L10n, Thing, [number, number]][] = [
    [L('Coffee', 'Кофе'), T(['cup of coffee', 'cups of coffee'], ['чашка кофе', 'чашки кофе', 'чашек кофе']), [612, 899]],
    [L('Latte', 'Латте'), T(['cup of latte', 'cups of latte'], ['чашка латте', 'чашки латте', 'чашек латте']), [412, 689]],
    [L('Mocha', 'Мокко'), T(['cup of mocha', 'cups of mocha'], ['чашка мокко', 'чашки мокко', 'чашек мокко']), [120, 290]],
    [L('Cappuccino', 'Капучино'), T(['cup of cappuccino', 'cups of cappuccino'], ['чашка капучино', 'чашки капучино', 'чашек капучино']), [113, 199]],
];

// bags of two sizes: "4 bags of 50 and 6 bags of 25"
// ruIn: "в пакетах"; ru bag forms are for "продали 4 пакета"
type Bags = { who: L10n; thing: Thing; sizes: [number, number]; bag: Thing; ruIn: string };
const BAGS: Bags[] = [
    { who: L('Mr. Ortiz sells tortillas', 'Мистер Ортис продаёт тортильи'), thing: T(['tortilla', 'tortillas'], ['тортилья', 'тортильи', 'тортилий']), sizes: [25, 50], bag: T(['bag', 'bags'], ['пакет', 'пакета', 'пакетов']), ruIn: 'в пакетах' },
    { who: L('The bakery sells cookies', 'Пекарня продаёт печенье'), thing: T(['cookie', 'cookies'], ['печенька', 'печеньки', 'печенек']), sizes: [6, 12], bag: T(['box', 'boxes'], ['коробку', 'коробки', 'коробок']), ruIn: 'в коробках' },
    { who: L('The art store sells crayons', 'Магазин для художников продаёт карандаши'), thing: T(['crayon', 'crayons'], ['карандаш', 'карандаша', 'карандашей']), sizes: [24, 48], bag: T(['box', 'boxes'], ['коробку', 'коробки', 'коробок']), ruIn: 'в коробках' },
];

// gifts for nieces and nephews: about $100 or $200 each
const GIFTS: [L10n, [number, number]][] = [[L('a digital keyboard', 'электронное пианино'), [101, 109]], [L('a scooter', 'самокат'), [91, 99]], [L('a bike', 'велосипед'), [201, 209]], [L('an art set', 'набор для рисования'), [46, 54]]];

const makeWord = (rng: Rng, want?: string): Problem => {
    const style = pickStyle(rng, ['bar', 'story', 'story', 'rows', 'area', 'bags', 'bakery', 'weeks', 'iced', 'tickets', 'reason', 'gifts'] as const, want);
    if (style === 'bar') {
        // a bar diagram of equal boxes, the whole is the letter: 48 48 48 48 -> b = 4 × 48
        const n = int(rng, 2, 6), v = pick(rng, [int(rng, 12, 99), int(rng, 101, 499)]), letter = pick(rng, ['b', 'n', 't', 'p']);
        return {
            id: `mult-word:bar:${n}:${v}:${letter}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`Write and solve an equation that represents the bar diagram: ${n} equal parts of ${v}, the whole is ${letter}.`, `Запиши и реши уравнение по схеме: ${n} ${ruPlural(n, 'равная часть', 'равные части', 'равных частей')} по ${v}, целое - это ${letter}.`),
            answer: { kind: 'fill', layout: 'lines', values: [n, v, n * v], lines: equationLines(letter), anyOrder: [[0, 1]] },
            steps: [L(`${n} equal parts that make a whole: multiply.`, `${n} ${ruPlural(n, 'равная часть', 'равные части', 'равных частей')} в сумме дают целое: умножаем.`), X(f => `${letter} = ${n} × ${v} = ${f(n * v)}`),
                L(`Check: ${Array(n).fill(v).join(' + ')} = ${fmt(n * v, 'en')} ✓`, `Проверка: ${Array(n).fill(v).join(' + ')} = ${fmt(n * v, 'ru')} ✓`)],
            hint: L(`How many equal parts? How big is each part?`, `Сколько равных частей? Какая каждая часть?`),
            visual: { kind: 'bars', rows: [{ label: L(letter, letter), boxes: n, value: String(v) }], braces: [{ row: 0, label: L(`${letter} = ?`, `${letter} = ?`) }] },
            data: { n, v, style, value: n * v },
        };
    }
    if (style === 'story') {
        const s = pick(rng, BAR_STORIES), b = int(rng, 21, 99), k = int(rng, 3, 9), big = b * k;
        return {
            id: `mult-word:story:${BAR_STORIES.indexOf(s)}:${b}:${k}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`${s.setup(b, k).en} ${s.ask.en} Use a bar diagram and write an equation.`, `${s.setup(b, k).ru} ${s.ask.ru} Нарисуй схему из полосок и запиши уравнение.`),
            answer: { kind: 'fill', layout: 'lines', values: [k, b, big], lines: equationLines(s.letter), anyOrder: [[0, 1]] },
            steps: [L(`"${k} times as many" means ${k} equal parts of ${b}: multiply.`, `«В ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше» - это ${k} ${ruPlural(k, 'равная часть', 'равные части', 'равных частей')} по ${b}: умножаем.`),
                X(n => `${s.letter} = ${k} × ${b} = ${n(big)}`), ...partialSteps(k, b), reasonable(k, b),
                L(`So the answer is ${cnt(big, s.thing).en}.`, `Значит ответ: ${cnt(big, s.thing).ru}.`)],
            hint: L(`Draw one bar of ${b} and ${k} bars of ${b} under it.`, `Нарисуй одну полоску ${b}, а под ней ${k} полосок по ${b}.`),
            visual: { kind: 'bars', rows: [{ label: s.small, boxes: 1, value: String(b) }, { label: s.big, boxes: k, value: String(b) }], braces: [{ row: 1, label: L(`${s.letter} = ${k} × ${b}`, `${s.letter} = ${k} × ${b}`) }] },
            data: { k, b, style, value: big },
        };
    }
    if (style === 'rows' || style === 'area') {
        const rows = GARDEN.map(([, [lo, hi]]) => int(rng, lo, hi));
        const at = int(rng, 0, 3);
        // the area model needs two real parts: no round row counts
        if (rows[at] % 10 === 0) rows[at] += 1;
        const r = rows[at], per = int(rng, 3, 9), total = r * per;
        const table = GARDEN.map(([name], k) => L(`${name.en}: ${rows[k]} rows`, `${name.ru}: ${rows[k]} ${ruPlural(rows[k], 'ряд', 'ряда', 'рядов')}`));
        const setup = L(`A science class is growing plants behind the school. Each section is laid out in rows:\n${table.map(t => t.en).join('\n')}\nThere are ${per} ${PLANTS[at].en[1]} in each row.`,
            `Класс выращивает растения за школой. Каждая грядка разбита на ряды:\n${table.map(t => t.ru).join('\n')}\nВ каждом ряду ${per} ${ruPlural(per, ...PLANTS[at].ru)}.`);
        if (style === 'rows') {
            return {
                id: `mult-word:rows:${rows.join(',')}:${at}:${per}`, skill: 'mult-word', topic: 'estimation',
                prompt: L(`${setup.en} Write and solve an equation to find how many ${PLANTS[at].en[1]} were planted.`, `${setup.ru} Запиши и реши уравнение: сколько всего ${PLANTS[at].ru[2]} посадили?`),
                answer: { kind: 'fill', layout: 'lines', values: [r, per, total], lines: equationLines('p'), anyOrder: [[0, 1]] },
                steps: [L(`Only the ${GARDEN[at][0].en.toLowerCase()} row is needed: ${r} rows. The other rows are extra information.`, `Нужна только строка «${GARDEN[at][0].ru}»: ${r} ${ruPlural(r, 'ряд', 'ряда', 'рядов')}. Остальные ряды - лишние данные.`),
                    X(n => `p = ${r} × ${per} = ${n(total)}`), ...partialSteps(per, r)],
                hint: L(`Rows × plants in each row.`, `Ряды × кусты в каждом ряду.`),
                data: { r, per, style, value: total },
            };
        }
        const pa = placeParts(r);
        const values = [...pa, ...pa.map(x => per * x), total];
        return {
            id: `mult-word:area:${rows.join(',')}:${at}:${per}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`${setup.en} Use an area model and the partial products to find how many ${PLANTS[at].en[1]} are planted.`, `${setup.ru} С помощью модели площади и частичных произведений найди, сколько всего ${PLANTS[at].ru[2]} посажено.`),
            answer: { kind: 'fill', layout: 'area', values, top: pa.map((_, k) => B(k)), left: [String(per)], cells: [pa.map((_, k) => pa.length + k)], total: values.length - 1 },
            steps: [X(n => `${r} = ${pa.join(' + ')}`), ...pa.map(x => X(n => `${per} × ${x} = ${n(per * x)}`)), X(n => `${pa.map(x => n(per * x)).join(' + ')} = ${n(total)}`)],
            hint: L(`Put ${r} on top as tens and ones, ${per} on the left.`, `Сверху ${r} как десятки и единицы, слева ${per}.`),
            visual: { kind: 'area', a: r, b: per },
            data: { r, per, style, value: total },
        };
    }
    if (style === 'bags') {
        const g = pick(rng, BAGS), [small, large] = g.sizes, nl = int(rng, 2, 9), ns = int(rng, 2, 9);
        const total = nl * large + ns * small;
        return {
            id: `mult-word:bags:${BAGS.indexOf(g)}:${nl}:${ns}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`${g.who.en} in ${g.bag.en[1]} of ${small} and in ${g.bag.en[1]} of ${large}. If ${nl} ${g.bag.en[1]} of ${large} and ${ns} ${g.bag.en[1]} of ${small} are sold, how many ${g.thing.en[1]} were sold?`,
                `${g.who.ru} ${g.ruIn} по ${small} и по ${large} штук. Продали ${nl} ${ruPlural(nl, ...g.bag.ru)} по ${large} и ${ns} ${ruPlural(ns, ...g.bag.ru)} по ${small}. Сколько всего ${g.thing.ru[2]} продали?`),
            answer: choice(rng, cnt(total, g.thing), [cnt(nl + ns, g.thing), cnt(nl * large, g.thing), cnt(total * 10, g.thing), cnt((nl + ns) * large, g.thing)]),
            steps: [X(n => `${nl} × ${large} = ${n(nl * large)}`), X(n => `${ns} × ${small} = ${n(ns * small)}`), X(n => `${n(nl * large)} + ${n(ns * small)} = ${n(total)}`),
                L(`Two kinds of ${g.bag.en[1]}: multiply each kind, then add.`, `Два вида упаковки: умножь каждый вид отдельно, потом сложи.`)],
            hint: L(`First the big ${g.bag.en[1]}, then the small ones, then add.`, `Сначала большие упаковки, потом маленькие, потом сложи.`),
            data: { nl, ns, small, large, style, value: total },
        };
    }
    if (style === 'bakery') {
        // 215 cookies and 45 muffins every hour, 4 hours
        const c = int(rng, 110, 299), f = int(rng, 21, 69), h = int(rng, 2, 6), per = c + f;
        return {
            id: `mult-word:bakery:${c}:${f}:${h}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`Bea's Bakery bakes ${c} cookies and ${f} muffins every hour. How many baked goods are baked in ${h} hours?`,
                `Пекарня Беи каждый час печёт ${c} ${ruPlural(c, 'печенье', 'печенья', 'печений')} и ${f} ${ruPlural(f, 'маффин', 'маффина', 'маффинов')}. Сколько всего выпечки получится за ${h} ${ruPlural(h, 'час', 'часа', 'часов')}?`),
            answer: { kind: 'fill', layout: 'lines', values: [per, per * h], lines: [
                { label: L('Step 1: baked goods in 1 hour', 'Шаг 1: выпечка за 1 час'), parts: [`${c} + ${f} = `, B(0)] },
                { label: L(`Step 2: in ${h} hours`, `Шаг 2: за ${h} ${ruPlural(h, 'час', 'часа', 'часов')}`), parts: ['t = ', { echo: 0 }, ` × ${h} = `, B(1)] },
            ] },
            steps: [X(() => `${c} + ${f} = ${per}`), X(n => `t = ${per} × ${h} = ${n(per * h)}`), ...partialSteps(h, per),
                L(
                    `Another way: ${c} × ${h} = ${fmt(c * h, 'en')}, ${f} × ${h} = ${f * h}, ${fmt(c * h, 'en')} + ${f * h} = ${fmt(per * h, 'en')}.`,
                    `Другой способ: ${c} × ${h} = ${fmt(c * h, 'ru')}, ${f} × ${h} = ${f * h}, ${fmt(c * h, 'ru')} + ${f * h} = ${fmt(per * h, 'ru')}.`)],
            hint: L('How many baked goods in ONE hour? Then multiply by the hours.', 'Сколько выпечки за ОДИН час? Потом умножь на число часов.'),
            data: { c, f, h, style, value: per * h },
        };
    }
    if (style === 'weeks' || style === 'iced') {
        const sold = DRINKS.map(([, , [lo, hi]]) => int(rng, lo, hi));
        // the hot mocha is a round number in the table so the "5 times as many" step stays mental
        sold[2] = 10 * int(rng, 12, 29);
        const table = DRINKS.map(([name], k) => L(`${name.en}: ${fmt(sold[k], 'en')}`, `${name.ru}: ${fmt(sold[k], 'ru')}`));
        const intro = L(`The table shows the number of hot drinks sold in a busy coffee shop in 1 week:\n${table.map(t => t.en).join('\n')}`,
            `В таблице - сколько горячих напитков продала оживлённая кофейня за 1 неделю:\n${table.map(t => t.ru).join('\n')}`);
        const w = int(rng, 2, 6);
        if (style === 'weeks') {
            const at = int(rng, 0, 3), x = sold[at], total = x * w;
            return {
                id: `mult-word:weeks:${sold.join(',')}:${at}:${w}`, skill: 'mult-word', topic: 'estimation',
                prompt: L(`${intro.en}\nIf the same number of cups of ${DRINKS[at][0].en.toLowerCase()} were sold for ${w} weeks in a row, how many cups would be sold in all?`,
                    `${intro.ru}\nЕсли ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')} подряд каждую неделю продавать столько же чашек напитка «${DRINKS[at][0].ru}», сколько всего чашек продадут?`),
                answer: { kind: 'number', value: total },
                steps: [L(`Only the ${DRINKS[at][0].en.toLowerCase()} number is needed: ${fmt(x, 'en')} a week.`, `Нужно только число из строки «${DRINKS[at][0].ru}»: ${fmt(x, 'ru')} в неделю.`),
                    X(n => `${n(x)} × ${w} = ${n(total)}`), ...partialSteps(w, x), reasonable(w, x)],
                hint: L(`Cups in one week × ${w} weeks.`, `Чашки за одну неделю × ${w}.`),
                data: { x, w, style, value: total },
            };
        }
        // the iced mocha sold k times as many as the hot mocha: how many more in w weeks
        const hot = sold[2], k = int(rng, 3, 6), iced = k * hot;
        const values = [iced, iced * w, hot * w, iced * w - hot * w];
        return {
            id: `mult-word:iced:${sold.join(',')}:${k}:${w}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`${intro.en}\nThe special drink of the month was an iced mocha. The shop sold ${k} times as many iced mochas in one week as hot mochas. How many more iced mochas than hot mochas were sold in ${w} weeks?`,
                `${intro.ru}\nНапиток месяца - холодный мокко. За неделю его продали в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше, чем горячего мокко. На сколько больше холодного мокко, чем горячего, продали за ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}?`),
            answer: { kind: 'fill', layout: 'lines', values, lines: [
                { label: L('Step 1: iced mochas in 1 week', 'Шаг 1: холодный мокко за 1 неделю'), parts: [`${k} × ${hot} = `, B(0)] },
                { label: L(`Step 2: iced mochas in ${w} weeks`, `Шаг 2: холодный мокко за ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}`), parts: [{ echo: 0 }, ` × ${w} = `, B(1)] },
                { label: L(`Step 3: hot mochas in ${w} weeks`, `Шаг 3: горячий мокко за ${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}`), parts: [`${hot} × ${w} = `, B(2)] },
                { label: L('Step 4: d, how many more', 'Шаг 4: d, на сколько больше'), parts: ['d = ', { echo: 1 }, ' − ', { echo: 2 }, ' = ', B(3)] },
            ] },
            steps: [X(n => `${k} × ${hot} = ${n(iced)}`), X(n => `${n(iced)} × ${w} = ${n(iced * w)}`), X(n => `${hot} × ${w} = ${n(hot * w)}`),
                X(n => `d = ${n(iced * w)} − ${n(hot * w)} = ${n(values[3])}`),
                L(`"Times as many" multiplies, "how many more" subtracts. The other drinks are extra information.`, `«Во сколько раз» - умножаем, «на сколько больше» - вычитаем. Остальные напитки - лишние данные.`)],
            hint: L('Find the iced and the hot mochas for all the weeks, then subtract.', 'Найди холодный и горячий мокко за все недели, потом вычти.'),
            data: { hot, k, w, style, value: values[3] },
        };
    }
    if (style === 'tickets') {
        // 3 adult tickets of $1,182 and 3 child tickets of $459, and why the answer is reasonable
        const A = int(rng, 1012, 1989), C = int(rng, 312, 689), n = int(rng, 2, 4);
        const rA = roundTo(A, 100), rC = roundTo(C, 100), est = n * rA + n * rC, total = n * A + n * C;
        return {
            id: `mult-word:tickets:${A}:${C}:${n}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`Tickets for a resort cost $${fmt(A, 'en')} each for adults and $${C} each for children. Find the cost for ${n} adult tickets and ${n} child tickets. Explain how you know your answer is reasonable.`,
                `Путёвка на курорт стоит $${fmt(A, 'ru')} для взрослого и $${C} для ребёнка. Сколько стоят ${n} ${ruPlural(n, 'взрослая путёвка', 'взрослые путёвки', 'взрослых путёвок')} и ${n} ${ruPlural(n, 'детская', 'детские', 'детских')}? Объясни, почему ответ правдоподобный.`),
            answer: { kind: 'fill', layout: 'lines', values: [est, n * A, n * C, total], lines: [
                { label: L('Estimate first: round to hundreds', 'Сначала прикинь: округли до сотен'), parts: [`${n} × ${fmt(rA, 'en')} + ${n} × ${rC} = `, B(0)] },
                { label: L('Adults', 'Взрослые'), parts: [`${n} × ${fmt(A, 'en')} = `, B(1)] },
                { label: L('Children', 'Дети'), parts: [`${n} × ${C} = `, B(2)] },
                { label: L('t, the total cost', 't, вся стоимость'), parts: ['t = ', { echo: 1 }, ' + ', { echo: 2 }, ' = ', B(3)] },
            ] },
            steps: [L(
                `Estimate: ${n} × ${fmt(rA, 'en')} + ${n} × ${rC} = ${fmt(n * rA, 'en')} + ${fmt(n * rC, 'en')} = ${fmt(est, 'en')}.`, `Прикидка: ${n} × ${fmt(rA, 'ru')} + ${n} × ${rC} = ${fmt(n * rA, 'ru')} + ${fmt(n * rC, 'ru')} = ${fmt(est, 'ru')}.`),
                X(f => `${n} × ${f(A)} = ${f(n * A)}`), X(f => `${n} × ${C} = ${f(n * C)}`), X(f => `t = ${f(n * A)} + ${f(n * C)} = ${f(total)}`),
                L(`Another way: ${n} × (${fmt(A, 'en')} + ${C}) = ${n} × ${fmt(A + C, 'en')} = ${fmt(total, 'en')}.`, `Другой способ: ${n} × (${fmt(A, 'ru')} + ${C}) = ${n} × ${fmt(A + C, 'ru')} = ${fmt(total, 'ru')}.`),
                L(`$${fmt(total, 'en')} is close to the estimate $${fmt(est, 'en')}, so it is reasonable.`, `$${fmt(total, 'ru')} близко к прикидке $${fmt(est, 'ru')}, значит ответ правдоподобный.`)],
            hint: L('Estimate with round hundreds, then find each cost exactly and add.', 'Прикинь с круглыми сотнями, потом точно найди каждую стоимость и сложи.'),
            data: { A, C, n, style, value: total },
        };
    }
    // a gift for each of the nieces and nephews: is "about $200" reasonable, and the exact cost
    const [gift, [lo, hi]] = pick(rng, GIFTS), nieces = int(rng, 1, 3), nephews = int(rng, 1, 2), k = nieces + nephews;
    // a round price needs no estimate: $50 stays $50
    let p = int(rng, lo, hi);
    if (p % 10 === 0) p += 1;
    const place = p >= 100 ? 100 : 10, r = roundTo(p, place), est = k * r;
    const family = L(`${nieces} ${nieces === 1 ? 'niece' : 'nieces'} and ${nephews} ${nephews === 1 ? 'nephew' : 'nephews'}`, `${nieces} ${ruPlural(nieces, 'племянница', 'племянницы', 'племянниц')} и ${nephews} ${ruPlural(nephews, 'племянник', 'племянника', 'племянников')}`);
    const setup = L(`Mr. Luca has ${family.en}. He would like to buy ${gift.en} for each of them. It costs $${p}.`, `У мистера Луки ${family.ru}. Он хочет купить каждому ${gift.ru}. Одна покупка стоит $${p}.`);
    if (style === 'reason') {
        const guessOk = rng() < 0.4, guess = guessOk ? est : pick(rng, [est / 2, est - 2 * r, est + 2 * r].filter(x => x > 0 && x !== est));
        const answer = guessOk
            ? choice(rng, L(`Yes: ${k} × $${r} = $${est}, so the total is about $${est}`, `Да: ${k} × $${r} = $${est}, значит всего примерно $${est}`), [
                L(`No: it is about $${fmt(est * 10, 'en')}`, `Нет: это примерно $${fmt(est * 10, 'ru')}`), L('No: the price is not a round number, so you cannot estimate', 'Нет: цена не круглая, поэтому прикинуть нельзя'), L(`Yes, but only because $${guess} is a round number`, `Да, но только потому, что $${guess} - круглое число`)])
            : choice(rng, L(`No: ${k} × $${r} = $${est}, so the total is about $${est}, not $${guess}`, `Нет: ${k} × $${r} = $${est}, значит всего примерно $${est}, а не $${guess}`), [
                L(`Yes: $${p} is close to $${r}`, `Да: $${p} близко к $${r}`), L(`Yes: because $${guess} is a round number`, `Да: потому что $${guess} - круглое число`), L(`No: it is about $${fmt(est * 10, 'en')}`, `Нет: это примерно $${fmt(est * 10, 'ru')}`)]);
        return {
            id: `mult-word:reason:${GIFTS.findIndex(g => g[0].en === gift.en)}:${p}:${nieces}:${nephews}:${guess}`, skill: 'mult-word', topic: 'estimation',
            prompt: L(`${setup.en} He thinks the total cost should be about $${guess}. Is this amount reasonable?`, `${setup.ru} Он думает, что всего выйдет примерно $${guess}. Это правдоподобно?`),
            answer,
            steps: [L(`${nieces} + ${nephews} = ${k} gifts.`, `${nieces} + ${nephews} = ${k} ${ruPlural(k, 'подарок', 'подарка', 'подарков')}.`), L(`$${p} is about $${r}.`, `$${p} - это примерно $${r}.`),
                L(`${k} × $${r} = $${est}.`, `${k} × $${r} = $${est}.`), L(`Exact: ${k} × $${p} = $${fmt(k * p, 'en')}.`, `Точно: ${k} × $${p} = $${fmt(k * p, 'ru')}.`)],
            hint: L(`How many gifts? Round the price, then multiply.`, `Сколько подарков? Округли цену и умножь.`),
            data: { p, k, est, guess, style, ok: guessOk ? 1 : 0 },
        };
    }
    return {
        id: `mult-word:gifts:${GIFTS.findIndex(g => g[0].en === gift.en)}:${p}:${nieces}:${nephews}`, skill: 'mult-word', topic: 'estimation',
        prompt: L(`${setup.en} Write and solve an equation to find the total cost. Estimate first to see that your answer is reasonable.`, `${setup.ru} Запиши и реши уравнение для всей стоимости. Сначала прикинь, чтобы проверить ответ.`),
        answer: { kind: 'fill', layout: 'lines', values: [est, k, p, k * p], lines: [
            { label: L(`Estimate first: $${p} is about $${r}`, `Сначала прикинь: $${p} - это примерно $${r}`), parts: [`${k} × ${r} = `, B(0)] },
            { label: L('Equation: c is the total cost', 'Уравнение: c - вся стоимость'), parts: ['c = ', B(1), ' × ', B(2), ' = ', B(3)] },
        ], anyOrder: [[1, 2]] },
        steps: [L(`${nieces} + ${nephews} = ${k} gifts.`, `${nieces} + ${nephews} = ${k} ${ruPlural(k, 'подарок', 'подарка', 'подарков')}.`), L(`Estimate: ${k} × $${r} = $${est}.`, `Прикидка: ${k} × $${r} = $${est}.`),
            X(n => `c = ${k} × ${p} = ${n(k * p)}`), L(`$${fmt(k * p, 'en')} is close to $${est}, so it is reasonable.`, `$${fmt(k * p, 'ru')} близко к $${est}, значит ответ правдоподобный.`)],
        hint: L('Count the nieces and nephews together, then multiply by the price.', 'Сложи племянниц и племянников, потом умножь на цену.'),
        data: { p, k, est, style, value: k * p },
    };
};

export const makeTopic3 = (rng: Rng, skill: SkillId, want?: string): Problem => {
    if (skill === 'mult-tens') return makeTens(rng, want);
    if (skill === 'mult-mental') return makeMental(rng, want);
    if (skill === 'mult-expr') return makeExpr(rng, want);
    return makeWord(rng, want);
};
