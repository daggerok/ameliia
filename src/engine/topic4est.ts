/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, fmt, int, pick, pickStyle, ruPlural } from './core';
import { roundTo } from './estimation';
import { AMELIIA } from './words';

// Topic 4, Lesson 4-3 of her class (Savvas enVision "Estimate: Use Rounding or Compatible Numbers"),
// Additional Practice 4-3, pages 47-48, the homework of 2026-10-27 (4.NBT.B.5, 4.OA.A.3):
// - guided: 23 × 12, "23 is close to 25, 12 is close to __, 25 × __ = __" (problems 1, 2 and the roller coaster of Another Look)
// - round: estimate each product, 19 × 24, 51 × 17 ... 91 × 77 (problems 3-16)
// - ways: "there is more than one way to estimate a product": rounding and compatible numbers (the speech bubble of p. 47)
// - story: about how many gallons to refill a 57-gallon bathtub every day for 31 days (problem 17)
// - weeks: about 45 gadgets a day, 7 days a week, about how many in 4 weeks (problem 19)
// - vocab: "___ are numbers that are easy to compute mentally" (problem 18)
// - sense: Nathan estimates 67 × 36 by finding 70 × 40, greater or less than the actual product (problem 20)
// - think: rounding or compatible numbers, what to consider (problem 21)
// - box: a tour guide leads groups of 26 people, 42 groups; two estimates with numbers from the box (problem 22)

export const KINDS_4_3 = ['guided', 'round', 'ways', 'story', 'weeks', 'vocab', 'sense', 'think', 'box'] as const;
type Kind = (typeof KINDS_4_3)[number];

const B = (b: number): FillPart => ({ b });
const X = (f: (n: (x: number) => string) => string): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
const S = 'est-2x2' as const;
const base = { skill: S, topic: 'estimation' as const };

// a 2-digit number whose ones are not 0 or 5, so rounding to the nearest ten is never in doubt
const plain = (rng: Rng, lo = 12, hi = 98) => {
    let x = int(rng, lo, hi);
    while (x % 5 === 0) x = int(rng, lo, hi);
    return x;
};
// a number close to 25, 50 or 75: the compatible numbers of the lesson
const nearCompat = (rng: Rng, compat: readonly number[]) => {
    const c = pick(rng, compat);
    return { c, a: c + pick(rng, [-2, -1, 1, 2]) };
};
const r10 = (x: number) => roundTo(x, 10);
const roundSteps = (a: number, b: number): L10n[] => {
    const ra = r10(a), rb = r10(b);
    return [
        L(`Round each number to the nearest ten: ${a} → ${ra}, ${b} → ${rb}.`, `Округли каждое число до десятков: ${a} → ${ra}, ${b} → ${rb}.`),
        L(`Multiply the front digits and write the two zeros: ${ra / 10} × ${rb / 10} = ${(ra / 10) * (rb / 10)}, so ${ra} × ${rb} = ${fmt(ra * rb, 'en')}.`,
            `Перемножь цифры без нулей и допиши два нуля: ${ra / 10} × ${rb / 10} = ${(ra / 10) * (rb / 10)}, значит ${ra} × ${rb} = ${fmt(ra * rb, 'ru')}.`),
    ];
};
const exactLine = (a: number, b: number, est: number): L10n => L(`Check: the exact product is ${a} × ${b} = ${fmt(a * b, 'en')}, close to ${fmt(est, 'en')} ✓`,
    `Проверка: точное произведение ${a} × ${b} = ${fmt(a * b, 'ru')}, близко к ${fmt(est, 'ru')} ✓`);
const ROUND_HINT = L('Round each number to the nearest ten, multiply the front digits, then write the two zeros.', 'Округли каждое число до десятков, перемножь цифры без нулей и допиши два нуля.');

// ---------- problems 1 and 2: compatible numbers on a sheet ----------

const makeGuided = (rng: Rng): Problem => {
    const { c, a } = nearCompat(rng, [25, 25, 50, 75]);
    const b = plain(rng, 12, 89), rb = r10(b), p = c * rb;
    const flip = rng() < 0.3;
    const expr = flip ? `${b} × ${a}` : `${a} × ${b}`;
    const lines: FillLine[] = [
        { label: L(`${a} is close to ${c}.`, `${a} близко к ${c}.`), parts: [{ t: L(`${b} is close to`, `${b} близко к`) }, ' ', B(0)] },
        { parts: [`${c} × `, { echo: 0 }, ' = ', B(1)] },
    ];
    return {
        ...base, id: `${S}:guided:${a}:${b}:${flip ? 'f' : 'n'}`,
        prompt: L(`Estimate ${expr} with compatible numbers: numbers close to the real ones that you can multiply mentally. ${a} is close to ${c}. What is ${b} close to? Then multiply.`,
            `Прикинь ${expr} с помощью удобных чисел: чисел рядом с настоящими, которые легко перемножить в уме. ${a} близко к ${c}. К чему близко ${b}? Потом перемножь.`),
        answer: { kind: 'fill', layout: 'lines', values: [rb, p], lines },
        steps: [
            L(`${a} is close to ${c}, a compatible number.`, `${a} близко к ${c}, это удобное число.`),
            L(`${b} is close to ${rb}: round it to the nearest ten.`, `${b} близко к ${rb}: округли до десятков.`),
            X(n => `${c} × ${rb} = ${n(p)}`),
            L(`So, ${expr} is about ${fmt(p, 'en')}.`, `Значит, ${expr} - это примерно ${fmt(p, 'ru')}.`),
        ],
        hint: L(`Round ${b} to the nearest ten, then multiply it by ${c}. ${c} × 4 = ${c * 4} helps: ${c} × 40 = ${fmt(c * 40, 'en')}.`, `Округли ${b} до десятков и умножь на ${c}. Помогает ${c} × 4 = ${c * 4}: ${c} × 40 = ${fmt(c * 40, 'ru')}.`),
        data: { a, b, c, rb, value: p, style: 'guided' },
    };
};

// ---------- problems 3-16: estimate each product by rounding ----------

const makeRound = (rng: Rng): Problem => {
    const a = plain(rng), b = plain(rng), p = r10(a) * r10(b);
    return {
        ...base, id: `${S}:round:${a}:${b}`,
        prompt: L(`Estimate ${a} × ${b}. Round each number to the nearest ten, then multiply.`, `Прикинь ${a} × ${b}. Округли каждое число до десятков, потом перемножь.`),
        answer: { kind: 'number', value: p },
        steps: [...roundSteps(a, b), exactLine(a, b, p)],
        hint: ROUND_HINT,
        data: { a, b, value: p, style: 'round' },
    };
};

// ---------- p. 47: there is more than one way to estimate a product ----------

const makeWays = (rng: Rng): Problem => {
    const { c, a } = nearCompat(rng, [25, 75]);
    const b = plain(rng, 12, 89), ra = r10(a), rb = r10(b), wb = rb + (b > rb ? 10 : -10);
    const flip = rng() < 0.3;
    const expr = flip ? `${b} × ${a}` : `${a} × ${b}`;
    const right = [
        L(`Round both: ${ra} × ${rb} = ${fmt(ra * rb, 'en')}`, `Округлить оба: ${ra} × ${rb} = ${fmt(ra * rb, 'ru')}`),
        L(`Compatible numbers: ${c} × ${rb} = ${fmt(c * rb, 'en')}`, `Удобные числа: ${c} × ${rb} = ${fmt(c * rb, 'ru')}`),
    ];
    const wrong = [
        // rounded the wrong way, the nearer ten is rb
        L(`Round both: ${ra} × ${wb} = ${fmt(ra * wb, 'en')}`, `Округлить оба: ${ra} × ${wb} = ${fmt(ra * wb, 'ru')}`),
        L(`Compatible numbers: ${c * 10} × ${rb} = ${fmt(c * 10 * rb, 'en')}`, `Удобные числа: ${c * 10} × ${rb} = ${fmt(c * 10 * rb, 'ru')}`),
        L(`Front digits only: ${Math.floor(a / 10)} × ${Math.floor(b / 10)} = ${Math.floor(a / 10) * Math.floor(b / 10)}`, `Только первые цифры: ${Math.floor(a / 10)} × ${Math.floor(b / 10)} = ${Math.floor(a / 10) * Math.floor(b / 10)}`),
    ];
    const options = [...right, ...wrong].map((o, i) => ({ o, i, k: rng() })).sort((x, y) => x.k - y.k);
    return {
        ...base, id: `${S}:ways:${a}:${b}:${flip ? 'f' : 'n'}`,
        prompt: L(`There is more than one way to estimate a product. Which are good estimates of ${expr}? Select all that apply.`,
            `Прикинуть произведение можно по-разному. Какие прикидки для ${expr} хорошие? Выбери все подходящие.`),
        answer: { kind: 'multi', options: options.map(x => x.o), correct: options.flatMap((x, k) => (x.i < 2 ? [k] : [])) },
        steps: [
            L(`Rounding: ${a} → ${ra}, ${b} → ${rb}, and ${ra} × ${rb} = ${fmt(ra * rb, 'en')}.`, `Округление: ${a} → ${ra}, ${b} → ${rb}, и ${ra} × ${rb} = ${fmt(ra * rb, 'ru')}.`),
            L(`Compatible numbers: ${a} is close to ${c}, and ${c} × ${rb} = ${fmt(c * rb, 'en')} is easy to find mentally.`, `Удобные числа: ${a} близко к ${c}, и ${c} × ${rb} = ${fmt(c * rb, 'ru')} легко посчитать в уме.`),
            L(`Both are close to the exact product ${a} × ${b} = ${fmt(a * b, 'en')}. ${b} rounds to ${rb}, not ${wb}, and ${c * 10} is far from ${a}.`, `Обе близки к точному произведению ${a} × ${b} = ${fmt(a * b, 'ru')}. ${b} округляется до ${rb}, а не до ${wb}, и ${c * 10} далеко от ${a}.`),
        ],
        hint: L(`One way rounds both numbers to the nearest ten. The other uses ${c}, a number close to ${a}. Check which ten is nearest.`, `Один способ округляет оба числа до ближайшего десятка. Другой берёт ${c}, число рядом с ${a}. Проверь, какой десяток ближе.`),
        data: { a, b, c, style: 'ways' },
    };
};

// ---------- problem 17: about how much in a month ----------

type Story = { text: (x: number, d: number) => L10n; unit: (n: number) => L10n };
const STORIES: Story[] = [
    { text: (x, d) => L(`A bathtub holds ${x} gallons of water. About how many gallons of water are used to refill the bathtub every day for ${d} days?`,
        `В ванну входит ${x} ${ruPlural(x, 'галлон', 'галлона', 'галлонов')} воды. Примерно сколько галлонов воды уйдёт, если наполнять ванну каждый день ${d} ${ruPlural(d, 'день', 'дня', 'дней')}?`),
        unit: n => L(`gallons`, ruPlural(n, 'галлон', 'галлона', 'галлонов')) },
    { text: (x, d) => L(`${AMELIIA.en} reads ${x} pages of Harry Potter every day for ${d} days. About how many pages does she read?`,
        `${AMELIIA.ru} читает по ${x} ${ruPlural(x, 'странице', 'страницы', 'страниц')} «Гарри Поттера» каждый день ${d} ${ruPlural(d, 'день', 'дня', 'дней')}. Примерно сколько страниц она прочитает?`),
        unit: n => L('pages', ruPlural(n, 'страница', 'страницы', 'страниц')) },
    { text: (x, d) => L(`Pip the capybara eats ${x} carrots a day. About how many carrots does Pip eat in ${d} days?`,
        `Капибара Пип съедает ${x} ${ruPlural(x, 'морковку', 'морковки', 'морковок')} в день. Примерно сколько морковок Пип съест за ${d} ${ruPlural(d, 'день', 'дня', 'дней')}?`),
        unit: n => L('carrots', ruPlural(n, 'морковка', 'морковки', 'морковок')) },
    { text: (x, d) => L(`A bakery bakes ${x} loaves of bread every day. About how many loaves does it bake in ${d} days?`,
        `Пекарня каждый день печёт ${x} ${ruPlural(x, 'буханку', 'буханки', 'буханок')} хлеба. Примерно сколько буханок она испечёт за ${d} ${ruPlural(d, 'день', 'дня', 'дней')}?`),
        unit: n => L('loaves', ruPlural(n, 'буханка', 'буханки', 'буханок')) },
];

const makeStory = (rng: Rng): Problem => {
    const i = int(rng, 0, STORIES.length - 1), x = plain(rng, 21, 89), d = pick(rng, [19, 21, 22, 28, 29, 31, 32]), p = r10(x) * r10(d);
    const u = STORIES[i].unit(p);
    return {
        ...base, id: `${S}:story:${i}:${x}:${d}`,
        prompt: L(`${STORIES[i].text(x, d).en} Round each number to the nearest ten to estimate.`, `${STORIES[i].text(x, d).ru} Для прикидки округли каждое число до десятков.`),
        answer: { kind: 'number', value: p },
        steps: [L(`"About how many" asks for an estimate: ${d} days of ${x}, so estimate ${x} × ${d}.`, `«Примерно сколько» - значит, нужна прикидка: ${d} ${ruPlural(d, 'день', 'дня', 'дней')} по ${x}, прикидываем ${x} × ${d}.`),
            ...roundSteps(x, d), L(`About ${fmt(p, 'en')} ${u.en}.`, `Примерно ${fmt(p, 'ru')} ${u.ru}.`)],
        hint: L(`Equal amounts every day: multiply. ${ROUND_HINT.en}`, `Каждый день одно и то же: умножай. ${ROUND_HINT.ru}`),
        data: { a: x, b: d, value: p, style: 'story' },
    };
};

// ---------- problem 19: weeks into days, then estimate ----------

type Shop = { who: L10n; verb: string; what: (n: number) => L10n };
const SHOPS: Shop[] = [
    { who: L('A store sells', 'Магазин продаёт'), verb: 'sell', what: n => L('gadgets', ruPlural(n, 'гаджет', 'гаджета', 'гаджетов')) },
    { who: L('A library lends', 'Библиотека выдаёт'), verb: 'lend', what: n => L('books', ruPlural(n, 'книгу', 'книги', 'книг')) },
    { who: L('Pip\'s café sells', 'Кафе Пипа продаёт'), verb: 'sell', what: n => L('cups of cocoa', ruPlural(n, 'чашку какао', 'чашки какао', 'чашек какао')) },
];

const makeWeeks = (rng: Rng): Problem => {
    const i = int(rng, 0, SHOPS.length - 1), { who, verb, what } = SHOPS[i];
    const x = int(rng, 21, 89), w = int(rng, 2, 5), d = 7 * w, rx = r10(x), rd = r10(d), p = rx * rd;
    const weeks = L(`${w} weeks`, `${w} ${ruPlural(w, 'неделю', 'недели', 'недель')}`);
    return {
        ...base, id: `${S}:weeks:${i}:${x}:${w}`,
        prompt: L(`${who.en} about ${x} ${what(x).en} a day, 7 days a week. About how many ${what(x).en} might it ${verb} in ${weeks.en}? Round each number to the nearest ten to estimate.`,
            `${who.ru} примерно ${x} ${what(x).ru} в день, 7 дней в неделю. Примерно сколько выйдет за ${weeks.ru}? Для прикидки округли каждое число до десятков.`),
        answer: { kind: 'number', value: p },
        steps: [
            L(`First the days: ${w} weeks of 7 days, ${w} × 7 = ${d} days.`, `Сначала дни: ${w} ${ruPlural(w, 'неделя', 'недели', 'недель')} по 7 дней, ${w} × 7 = ${d} ${ruPlural(d, 'день', 'дня', 'дней')}.`),
            L(`Now estimate ${x} × ${d}.`, `Теперь прикидываем ${x} × ${d}.`),
            ...roundSteps(x, d),
            exactLine(x, d, p),
        ],
        hint: L('Find the number of days first: weeks × 7. Then round both numbers to tens and multiply.', 'Сначала найди число дней: недели × 7. Потом округли оба числа до десятков и перемножь.'),
        data: { a: x, b: d, w, value: p, style: 'weeks' },
    };
};

// ---------- problem 18: the vocabulary of the lesson ----------

const WORDS: { def: L10n; word: string; accept: string[]; why: L10n }[] = [
    { def: L('_____ are numbers that are easy to compute mentally.', '_____ - это числа, с которыми легко считать в уме. Напиши термин по-английски, как в учебнике.'),
        word: 'compatible numbers', accept: ['compatible number', 'compatible'],
        why: L('Compatible numbers are numbers close to the real ones that are easy to compute mentally, like 25 for 24 or 40 for 38.', 'Удобные числа (по-английски так и называются в учебнике) - числа рядом с настоящими, с которыми легко считать в уме, например 25 вместо 24 или 40 вместо 38.') },
    { def: L('An _____ is a number that is close to the exact answer. "About how many" asks for one.', '_____ - число, близкое к точному ответу. Вопрос «примерно сколько» просит именно его. Напиши термин по-английски, как в учебнике.'),
        word: 'estimate', accept: ['estimation'],
        why: L('An estimate is close to the exact answer: 24 × 38 is about 25 × 40 = 1,000.', 'Прикидка близка к точному ответу: 24 × 38 - это примерно 25 × 40 = 1 000.') },
    { def: L('Replacing 38 with 40, the nearest ten, is called _____.', 'Замена 38 на 40, ближайший десяток, называется _____. Напиши термин по-английски, как в учебнике.'),
        word: 'rounding', accept: ['round', 'rounding to the nearest ten'],
        why: L('Rounding replaces a number with the nearest ten, hundred or thousand: 38 → 40, 31 → 30.', 'Округление заменяет число ближайшим десятком, сотней или тысячей: 38 → 40, 31 → 30.') },
];

const makeVocab = (rng: Rng): Problem => {
    const k = int(rng, 0, WORDS.length - 1), w = WORDS[k];
    return {
        ...base, id: `${S}:vocab:${k}`,
        prompt: L(`Vocabulary: use a vocabulary term to complete the definition. ${w.def.en}`, `Словарь урока: впиши термин в определение. ${w.def.ru}`),
        answer: { kind: 'word', word: w.word, accept: w.accept },
        steps: [w.why],
        hint: L(`It has ${w.word.length} letters with the spaces and starts with "${w.word[0]}".`, `В нём ${w.word.length} знаков с пробелами, по-английски он начинается на «${w.word[0]}».`),
        data: { k, style: 'vocab' },
    };
};

// ---------- problem 20: greater or less than the actual product ----------

const NAMES: L10n[] = [L('Nathan', 'Натан'), L('Lina', 'Лина'), L('Pip', 'Пип')];
const makeSense = (rng: Rng): Problem => {
    const up = rng() < 0.5, who = pick(rng, NAMES);
    const one = () => 10 * int(rng, 1, 8) + (up ? int(rng, 6, 9) : int(rng, 1, 4));
    const a = one(), b = one(), ra = r10(a), rb = r10(b), est = ra * rb, exact = a * b;
    const greater = L(`Greater: both numbers were rounded up, so the estimate is greater than the actual product`, `Больше: оба числа округлены вверх, значит прикидка больше точного произведения`);
    const less = L(`Less: both numbers were rounded down, so the estimate is less than the actual product`, `Меньше: оба числа округлены вниз, значит прикидка меньше точного произведения`);
    return {
        ...base, id: `${S}:sense:${who.en}:${a}:${b}`,
        prompt: L(`${who.en} estimates ${a} × ${b} by finding ${ra} × ${rb}. Will the estimate be greater than or less than the actual product? Explain.`,
            `${who.ru} прикидывает ${a} × ${b}, вычисляя ${ra} × ${rb}. Прикидка будет больше или меньше точного произведения? Объясни.`),
        answer: choice(rng, up ? greater : less, [up ? less : greater,
            L('The same: an estimate always equals the actual product', 'Такая же: прикидка всегда равна точному произведению'),
            L('You cannot tell without finding the exact product', 'Нельзя сказать, не найдя точное произведение')]),
        steps: [
            up ? L(`${a} → ${ra} and ${b} → ${rb}: both numbers went up.`, `${a} → ${ra} и ${b} → ${rb}: оба числа стали больше.`)
                : L(`${a} → ${ra} and ${b} → ${rb}: both numbers went down.`, `${a} → ${ra} и ${b} → ${rb}: оба числа стали меньше.`),
            up ? L('Bigger factors make a bigger product, so the estimate is greater.', 'Большие множители дают большее произведение, значит прикидка больше.')
                : L('Smaller factors make a smaller product, so the estimate is less.', 'Меньшие множители дают меньшее произведение, значит прикидка меньше.'),
            L(`Check: ${ra} × ${rb} = ${fmt(est, 'en')} and ${a} × ${b} = ${fmt(exact, 'en')}`, `Проверка: ${ra} × ${rb} = ${fmt(est, 'ru')} и ${a} × ${b} = ${fmt(exact, 'ru')}`),
        ],
        hint: L('Did each number go up or down when it was rounded?', 'Каждое число при округлении стало больше или меньше?'),
        data: { a, b, est, exact, up: up ? 1 : 0, style: 'sense' },
    };
};

// ---------- problem 21: rounding or compatible numbers ----------

const makeThink = (rng: Rng): Problem => {
    if (rng() < 0.5) {
        return {
            ...base, id: `${S}:think:choose`,
            prompt: L('Higher Order Thinking: what might you consider when deciding whether to use rounding or compatible numbers to estimate?',
                'Подумай: на что стоит посмотреть, когда решаешь, прикидывать округлением или удобными числами?'),
            answer: choice(rng,
                L('Which numbers are easy to multiply mentally: a number close to 25, 50 or 75 makes a good compatible number, otherwise round to the nearest ten', 'Какие числа легко перемножить в уме: число рядом с 25, 50 или 75 - хорошее удобное число, а иначе округляй до десятков'),
                [L('Always use the bigger of the two numbers', 'Всегда брать большее из двух чисел'),
                    L('Use compatible numbers only when both numbers already end in 0', 'Брать удобные числа только когда оба числа уже оканчиваются на 0'),
                    L('Neither: always find the exact product first', 'Ни то ни другое: сначала всегда найти точное произведение')]),
            steps: [L('24 × 38: 24 is close to 25, and 25 × 40 = 1,000 is easy. 61 × 38: round, 60 × 40 = 2,400.', '24 × 38: 24 близко к 25, и 25 × 40 = 1 000 считается легко. 61 × 38: округляем, 60 × 40 = 2 400.')],
            hint: L('Estimating is about numbers you can multiply in your head.', 'Прикидка - это про числа, которые легко перемножить в уме.'),
            data: { style: 'think' },
        };
    }
    return {
        ...base, id: `${S}:think:more`,
        prompt: L('Ameliia estimated 24 × 31 as 20 × 30 = 600. Lina estimated it as 25 × 30 = 750. Who is right?', 'Амелия прикинула 24 × 31 как 20 × 30 = 600. Лина прикинула как 25 × 30 = 750. Кто прав?'),
        answer: choice(rng,
            L('Both: there is more than one way to estimate, and both are close to the exact product 744', 'Обе: прикинуть можно по-разному, и обе прикидки близки к точному произведению 744'),
            [L('Only Ameliia: you must always round to the nearest ten', 'Только Амелия: всегда нужно округлять до десятков'),
                L('Only Lina: 25 is the only right number for 24', 'Только Лина: для 24 подходит только 25'),
                L('Neither: an estimate must equal the exact product', 'Никто: прикидка должна совпасть с точным произведением')]),
        steps: [L('Rounding gives 20 × 30 = 600, compatible numbers give 25 × 30 = 750. The exact product is 24 × 31 = 744. Both are estimates.', 'Округление даёт 20 × 30 = 600, удобные числа дают 25 × 30 = 750. Точно 24 × 31 = 744. Обе - прикидки.')],
        hint: L('There is more than one way to estimate a product.', 'Прикинуть произведение можно по-разному.'),
        data: { style: 'think' },
    };
};

// ---------- problem 22: numbers from the box ----------

const makeBox = (rng: Rng): Problem => {
    const a = pick(rng, [23, 24, 26, 27]), ra = r10(a);
    // the groups round to another ten than the people, so every number of the box is different
    let b = plain(rng, 31, 79);
    while (r10(b) === ra) b = plain(rng, 31, 79);
    const rb = r10(b), decoy = rb + 20 < 100 ? rb + 20 : rb - 20;
    const box = [25, ra, rb, decoy].sort((x, y) => x - y);
    const opt = (x: number, y: number) => X(n => `${x} × ${y} = ${n(x * y)}`);
    const right = [opt(25, rb), opt(ra, rb)];
    const wrong = [opt(25, ra), opt(25, decoy), opt(ra, decoy)];
    const options = [...right, ...wrong].map((o, i) => ({ o, i, k: rng() })).sort((x, y) => x.k - y.k);
    return {
        ...base, id: `${S}:box:${a}:${b}`,
        prompt: L(`A tour guide leads groups of ${a} people through a museum. She led ${b} groups last year. Choose compatible numbers from the box (${box.join(', ')}) to write two different estimates for the total number of people she led. Select both.`,
            `Экскурсовод водит по музею группы по ${a} ${ruPlural(a, 'человеку', 'человека', 'человек')}. В прошлом году она провела ${b} ${ruPlural(b, 'группу', 'группы', 'групп')}. Выбери удобные числа из рамки (${box.join(', ')}) и запиши две разные прикидки для числа всех людей. Отметь обе.`),
        answer: { kind: 'multi', options: options.map(x => x.o), correct: options.flatMap((x, k) => (x.i < 2 ? [k] : [])) },
        steps: [
            L(`${a} people in a group: ${a} is close to 25 and to ${ra}, both are in the box.`, `${a} человек в группе: ${a} близко к 25 и к ${ra}, оба числа есть в рамке.`),
            L(`${b} groups: ${b} is close to ${rb}. ${decoy} is too far from ${b}.`, `${b} групп: ${b} близко к ${rb}. ${decoy} слишком далеко от ${b}.`),
            L(`25 × ${rb} = ${fmt(25 * rb, 'en')} and ${ra} × ${rb} = ${fmt(ra * rb, 'en')}`, `25 × ${rb} = ${fmt(25 * rb, 'ru')} и ${ra} × ${rb} = ${fmt(ra * rb, 'ru')}`),
        ],
        hint: L(`One number from the box for the people in a group (close to ${a}), one for the groups (close to ${b}).`, `Одно число из рамки для людей в группе (близко к ${a}), другое для числа групп (близко к ${b}).`),
        data: { a, b, ra, rb, decoy, style: 'box' },
    };
};

export const makeTopic4Est = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_4_3, want);
    if (style === 'guided') return makeGuided(rng);
    if (style === 'round') return makeRound(rng);
    if (style === 'ways') return makeWays(rng);
    if (style === 'story') return makeStory(rng);
    if (style === 'weeks') return makeWeeks(rng);
    if (style === 'vocab') return makeVocab(rng);
    if (style === 'sense') return makeSense(rng);
    if (style === 'think') return makeThink(rng);
    return makeBox(rng);
};
