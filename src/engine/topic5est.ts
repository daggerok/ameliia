/// <reference lib="esnext" />
import { type FillLine, type FillPart, type L10n, type Problem, type Rng, L, choice, fmt, int, pick, pickStyle, ruPlural, shuffle } from './core';

// Topic 5, Lesson 5-3 of her class (Savvas enVision "Mental Math: Estimate Quotients for Greater Dividends"),
// Additional Practice 5-3, pages 61-62, homework of 2026-11-16 (4.NBT.B.6, 4.OA.A.3):
// - pattern: 8 × 2, 8 × 20, 8 × 200, 1,600 ÷ 8, so 1,561 ÷ 8 is about 200 (problems 1-2)
// - compat: estimate each quotient with the closest compatible number, 2,356 ÷ 6 is about 2,400 ÷ 6 (problems 3-18)
// - table: the bracelets of Bob and Kate, about how many with each color of bead (problem 19)
// - runout: which color of bead runs out first (problem 20)
// - rush: the beads for 7 bracelets of each color (problem 21)
// - moreless: pencils in packages of 6, is the exact answer more or less than the estimate (problem 22)
// - twoways: two estimates of 4,396 ÷ 4, the nearest hundred and the nearest thousand (problem 23)
// - best: the best estimate, $3,705 in 6 months, 1,795 students in 5 schools (problems 24-25)
// Her sheet (p. 61) showed where she thinks wrong: she rounds the dividend to the nearest hundred or thousand, as for a
// product (461 ÷ 9 as 500 ÷ 9, 2,356 ÷ 6 as 2,000 ÷ 6, 5,352 ÷ 9 as 5,000 ÷ 9, 279 ÷ 9 as 300 ÷ 9), instead of a number
// the divisor divides with a basic fact (450, 2,400, 5,400, 270); and a zero slipped in a pattern (7 × 30 as 2,100)

export const KINDS_5_3 = ['pattern', 'compat', 'table', 'runout', 'rush', 'moreless', 'twoways', 'best'] as const;
type Kind = (typeof KINDS_5_3)[number];

const B = (b: number): FillPart => ({ b });
type Tpl = (n: (x: number) => string) => string;
const W = (en: Tpl, ru: Tpl): L10n => L(en(x => fmt(x, 'en')), ru(x => fmt(x, 'ru')));
const S = 'est-quot' as const;
const base = { skill: S, topic: 'estimation' as const };

// ---------- the compatible number of this lesson ----------

// a basic fact of the divisor with zeros that lands closest to the dividend: the unit is the divisor × 10, × 100 or
// × 1,000, the biggest one not above the dividend (2,356 ÷ 6: units of 600, 4 of them make 2,400; 461 ÷ 9: units of 90,
// 5 of them make 450). k is the fact (6 × 4, 9 × 5), c the compatible number, q the estimate
export const compatibleBig = (n: number, d: number) => {
    let unit = d;
    while (unit * 10 <= n && unit < d * 1000) unit *= 10;
    const k = Math.round(n / unit), c = k * unit;
    return { c, q: c / d, unit, k };
};
// the nearest hundred of a 3-digit number, the nearest thousand of a 4-digit one: her way, which works only when the
// divisor divides that number with a basic fact
export const herRounding = (n: number) => { const place = n >= 1000 ? 1000 : 100; return Math.round(n / place) * place; };

// a dividend between lo and hi with exactly one closest compatible number: a fact 2 to 9, no tie, not divisible by the divisor
const bigPick = (rng: Rng, d: number, lo: number, hi: number, trap?: boolean): number => {
    for (;;) {
        const n = int(rng, lo, hi);
        const { c, unit, k } = compatibleBig(n, d);
        const frac = Math.abs(n / unit - Math.floor(n / unit) - 0.5);
        if (k < 2 || k > 9 || frac < 0.1 || n % d === 0 || n === c) continue;
        if (trap !== undefined && trap !== (herRounding(n) !== c)) continue;
        return n;
    }
};

const PLACE: [string, string, string, string, string][] = [
    ['one', 'ones', 'единица', 'единицы', 'единиц'],
    ['ten', 'tens', 'десяток', 'десятка', 'десятков'],
    ['hundred', 'hundreds', 'сотня', 'сотни', 'сотен'],
    ['thousand', 'thousands', 'тысяча', 'тысячи', 'тысяч'],
];
const zerosOf = (unit: number, d: number) => Math.round(Math.log10(unit / d));
const placeOf = (x: number, k: number, lang: 'en' | 'ru') => {
    const [e1, e2, r1, r2, r5] = PLACE[k];
    return lang === 'en' ? `${fmt(x, 'en')} ${enPl(x, e1, e2)}` : `${fmt(x, 'ru')} ${ruPlural(x, r1, r2, r5)}`;
};
const enPl = (n: number, one: string, many: string) => (n === 1 ? one : many);

// the steps of an estimate with the compatible number: the table of the divisor, zeros, the closest one, divide, check
const estSteps = (n: number, d: number): L10n[] => {
    const { c, q, unit, k } = compatibleBig(n, d), z = zerosOf(unit, d), r = herRounding(n);
    const trap = r !== c;
    return [
        ...(trap ? [W(x => `Rounding ${x(n)} to ${x(r)} does not help: ${d} does not divide ${x(r)} with a basic fact.`, x => `Округлить ${x(n)} до ${x(r)} не поможет: ${d} не делит ${x(r)} по таблице.`)] : []),
        W(x => `Think of the table of ${d}: ${d} × ${k} = ${k * d}. With ${z === 1 ? 'one zero' : z === 2 ? 'two zeros' : 'three zeros'}: ${d} × ${x(k * unit / d)} = ${x(c)}. ${x(c)} is close to ${x(n)}: a compatible number.`,
            x => `Вспомни таблицу на ${d}: ${d} × ${k} = ${k * d}. ${z === 1 ? 'Один ноль' : z === 2 ? 'Два нуля' : 'Три нуля'}: ${d} × ${x(k * unit / d)} = ${x(c)}. ${x(c)} близко к ${x(n)}: это удобное число.`),
        W(x => `${x(c)} is ${placeOf(k * d, z, 'en')}. ${placeOf(k * d, z, 'en')} ÷ ${d} is ${placeOf(k, z, 'en')}: ${x(c)} ÷ ${d} = ${x(q)}.`,
            x => `${x(c)} - это ${placeOf(k * d, z, 'ru')}. ${placeOf(k * d, z, 'ru')} ÷ ${d} - это ${placeOf(k, z, 'ru')}: ${x(c)} ÷ ${d} = ${x(q)}.`),
        W(x => `So ${x(n)} ÷ ${d} is about ${x(q)}. Check: ${x(q)} × ${d} = ${x(c)} ✓`, x => `Значит ${x(n)} ÷ ${d} - это примерно ${x(q)}. Проверка: ${x(q)} × ${d} = ${x(c)} ✓`),
    ];
};
const estHint = (n: number, d: number): L10n => {
    const { unit } = compatibleBig(n, d);
    return W(x => `Count by ${x(unit)}s (${x(unit)}, ${x(2 * unit)}, ${x(3 * unit)} ...) and stop at the number closest to ${x(n)}. That number ÷ ${d} is a basic fact with zeros.`,
        x => `Считай по ${x(unit)} (${x(unit)}, ${x(2 * unit)}, ${x(3 * unit)} ...) и остановись на числе, ближайшем к ${x(n)}. Это число ÷ ${d} - табличный пример с нулями.`);
};

// ---------- problems 1-2: a pattern of basic facts ----------

const makePattern = (rng: Rng): Problem => {
    let d = 0, k = 0;
    while (d * k < 12) { d = int(rng, 2, 9); k = int(rng, 2, 9); }
    const f = d * k, c = f * 100, n = c + (rng() < 0.5 ? -1 : 1) * int(rng, 1, 49);
    const lines: FillLine[] = [
        { parts: [`${d} × ${k} = `, B(0)] },
        { parts: [`${d} × ${fmt(k * 10, 'en')} = `, B(1)] },
        { parts: [`${d} × ${fmt(k * 100, 'en')} = `, B(2)] },
        { parts: [`${fmt(c, 'en')} ÷ ${d} = `, B(3)] },
        { label: L(`So ${fmt(n, 'en')} ÷ ${d} is about`, `Значит ${fmt(n, 'ru')} ÷ ${d} - это примерно`), parts: [{ echo: 3 }] },
    ];
    return {
        ...base, id: `${S}:pattern:${n}:${d}`,
        prompt: L(`Estimate ${fmt(n, 'en')} ÷ ${d}. Use the pattern of basic facts: what is ${d} × ${k}, ${d} × ${fmt(k * 10, 'en')}, ${d} × ${fmt(k * 100, 'en')}, then ${fmt(c, 'en')} ÷ ${d}?`,
            `Прикинь ${fmt(n, 'ru')} ÷ ${d}. Используй закономерность табличных примеров: сколько будет ${d} × ${k}, ${d} × ${fmt(k * 10, 'ru')}, ${d} × ${fmt(k * 100, 'ru')}, потом ${fmt(c, 'ru')} ÷ ${d}?`),
        answer: { kind: 'fill', layout: 'lines', values: [f, f * 10, c, k * 100], lines },
        steps: [
            L(`Basic fact: ${d} × ${k} = ${f}.`, `Табличный пример: ${d} × ${k} = ${f}.`),
            W(x => `${x(k * 10)} has one zero, so the product gets one zero: ${d} × ${x(k * 10)} = ${x(f * 10)}, not ${x(f * 100)}.`, x => `В ${x(k * 10)} один ноль, значит и в произведении один ноль: ${d} × ${x(k * 10)} = ${x(f * 10)}, а не ${x(f * 100)}.`),
            W(x => `${x(k * 100)} has two zeros: ${d} × ${x(k * 100)} = ${x(c)}.`, x => `В ${x(k * 100)} два нуля: ${d} × ${x(k * 100)} = ${x(c)}.`),
            W(x => `Division is multiplication backwards: ${x(c)} ÷ ${d} = ${x(k * 100)}.`, x => `Деление - это умножение наоборот: ${x(c)} ÷ ${d} = ${x(k * 100)}.`),
            W(x => `${x(n)} is close to ${x(c)}, so ${x(n)} ÷ ${d} is about ${x(k * 100)}.`, x => `${x(n)} близко к ${x(c)}, значит ${x(n)} ÷ ${d} - это примерно ${x(k * 100)}.`),
        ],
        hint: L(`One zero in the factor, one zero in the product. Two zeros, two zeros. Then divide ${fmt(c, 'en')} by ${d}: the fact backwards.`, `Один ноль в множителе - один ноль в произведении. Два нуля - два нуля. Потом раздели ${fmt(c, 'ru')} на ${d}: табличный пример наоборот.`),
        data: { n, d, k, style: 'pattern' },
    };
};

// ---------- problems 3-18: estimate each quotient ----------

const makeCompat = (rng: Rng): Problem => {
    const d = int(rng, 2, 9), four = rng() < 0.6;
    // her trap most of the time: the rounded number is not in the table of the divisor
    const n = bigPick(rng, d, four ? 1000 : 100, four ? 9999 : 999, rng() < 0.65 ? true : undefined);
    const { c, q } = compatibleBig(n, d);
    const lines: FillLine[] = [{ label: L('Compatible number, then the estimate', 'Удобное число, потом прикидка'), parts: [B(0), ` ÷ ${d} = `, B(1)] }];
    return {
        ...base, id: `${S}:compat:${n}:${d}`,
        prompt: L(`Estimate ${fmt(n, 'en')} ÷ ${d}. Write the compatible number closest to ${fmt(n, 'en')} that ${d} divides with a basic fact (${d} × 1 to ${d} × 9, with zeros), then the estimate.`,
            `Прикинь ${fmt(n, 'ru')} ÷ ${d}. Запиши удобное число, ближайшее к ${fmt(n, 'ru')}, которое ${d} делит по таблице (от ${d} × 1 до ${d} × 9, с нулями), потом прикидку.`),
        answer: { kind: 'fill', layout: 'lines', values: [c, q], lines },
        steps: estSteps(n, d), hint: estHint(n, d),
        data: { n, d, style: 'compat' },
    };
};

// ---------- problems 19-21: the bracelets of Bob and Kate ----------

type Color = { en: string; ru: string; ruGen: string };
const COLORS: Color[] = [
    { en: 'Blue', ru: 'Синие', ruGen: 'синих' }, { en: 'Silver', ru: 'Серебряные', ruGen: 'серебряных' }, { en: 'Rose', ru: 'Розовые', ruGen: 'розовых' },
    { en: 'White', ru: 'Белые', ruGen: 'белых' }, { en: 'Green', ru: 'Зелёные', ruGen: 'зелёных' }, { en: 'Gold', ru: 'Золотые', ruGen: 'золотых' },
];
type Row = { color: Color; beads: number; per: number };
const bracelets = (rng: Rng): Row[] => {
    for (;;) {
        const colors = shuffle(rng, COLORS).slice(0, 4), pers = shuffle(rng, [3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
        const rows = colors.map((color, i) => ({ color, per: pers[i], beads: bigPick(rng, pers[i], 100, 499) }));
        const ests = rows.map(r => compatibleBig(r.beads, r.per).q), exact = rows.map(r => Math.floor(r.beads / r.per));
        const least = Math.min(...ests), i = ests.indexOf(least);
        // one color runs out first, by the estimate and by the exact count alike
        if (ests.filter(e => e === least).length === 1 && exact.every((e, j) => j === i || e > exact[i])) return rows;
    }
};
const tableText = (rows: Row[], lang: 'en' | 'ru') => rows.map(r => (lang === 'en' ? `${r.color.en}: ${r.beads} beads, ${r.per} per bracelet` : `${r.color.ru}: ${r.beads} ${ruPlural(r.beads, 'бусина', 'бусины', 'бусин')}, по ${r.per} на браслет`)).join('; ');
const rowSteps = (rows: Row[]): L10n[] => rows.map(r => {
    const { c, q, k } = compatibleBig(r.beads, r.per);
    return W(x => `${r.color.en}: ${x(r.beads)} ÷ ${r.per}. ${r.per} × ${k} = ${k * r.per}, so ${x(c)} ÷ ${r.per} = ${x(q)}: about ${x(q)} bracelets.`, x => `${r.color.ru}: ${x(r.beads)} ÷ ${r.per}. ${r.per} × ${k} = ${k * r.per}, значит ${x(c)} ÷ ${r.per} = ${x(q)}: примерно ${x(q)} ${ruPlural(q, 'браслет', 'браслета', 'браслетов')}.`);
});
const tableId = (rows: Row[]) => rows.map(r => `${r.color.en[0]}${r.beads}-${r.per}`).join(':');

const makeTable = (rng: Rng): Problem => {
    const rows = bracelets(rng);
    const lines: FillLine[] = rows.map((r, i) => ({ label: L(`${r.color.en}, about`, `${r.color.ru}, примерно`), parts: [B(i)] }));
    return {
        ...base, id: `${S}:table:${tableId(rows)}`,
        prompt: L(`Bob and Kate are making bracelets to sell at a craft fair. The table shows how many beads they have of each color and how many beads one bracelet takes: ${tableText(rows, 'en')}. Determine about how many bracelets Bob and Kate can make with each color of bead. Complete the table.`,
            `Боб и Кейт делают браслеты для ярмарки. В таблице сколько у них бусин каждого цвета и сколько бусин уходит на один браслет: ${tableText(rows, 'ru')}. Определи, сколько примерно браслетов Боб и Кейт могут сделать из бусин каждого цвета. Заполни таблицу.`),
        answer: { kind: 'fill', layout: 'lines', values: rows.map(r => compatibleBig(r.beads, r.per).q), lines },
        steps: [
            L('Beads of a color ÷ beads per bracelet = bracelets. "About" means estimate with a compatible number.', 'Бусины одного цвета ÷ бусины на один браслет = браслеты. «Примерно» значит прикинь удобным числом.'),
            ...rowSteps(rows),
        ],
        hint: L('For each row: find the fact of the "beads per bracelet" number that lands closest to the beads, with a zero. Then divide.', 'В каждой строке: найди пример из таблицы на число «бусин на браслет», который с нулём попадает ближе всего к числу бусин. Потом раздели.'),
        data: { beads: rows.map(r => r.beads), per: rows.map(r => r.per), style: 'table' },
    };
};

const makeRunout = (rng: Rng): Problem => {
    const rows = bracelets(rng), ests = rows.map(r => compatibleBig(r.beads, r.per).q), least = Math.min(...ests), i = ests.indexOf(least);
    const options = rows.map(r => L(r.color.en, r.color.ru));
    return {
        ...base, id: `${S}:runout:${tableId(rows)}`,
        prompt: L(`Bob and Kate's beads: ${tableText(rows, 'en')}. About how many bracelets can they make before they run out of at least one color of bead? Which color of bead will they run out of first?`,
            `Бусины Боба и Кейт: ${tableText(rows, 'ru')}. Сколько примерно браслетов они сделают, пока не закончится хотя бы один цвет бусин? Какой цвет закончится первым?`),
        answer: { kind: 'choice', options, correct: i },
        steps: [
            L('Estimate the bracelets for every color first.', 'Сначала прикинь браслеты для каждого цвета.'),
            ...rowSteps(rows),
            W(x => `The smallest number is ${x(least)}, for ${rows[i].color.en.toLowerCase()}. After about ${x(least)} bracelets the ${rows[i].color.en.toLowerCase()} beads are gone: that color runs out first.`,
                x => `Самое маленькое число - ${x(least)}, у ${rows[i].color.ruGen}. Примерно после ${x(least)} ${ruPlural(least, 'браслета', 'браслетов', 'браслетов')} ${rows[i].color.ruGen} бусин не останется: этот цвет закончится первым.`),
        ],
        hint: L('The color with the FEWEST bracelets runs out first, not the one with the fewest beads: a bracelet of 9 beads eats beads fast.', 'Первым закончится цвет, из которого выйдет МЕНЬШЕ ВСЕГО браслетов, а не тот, где меньше всего бусин: браслет из 9 бусин съедает бусины быстро.'),
        data: { beads: rows.map(r => r.beads), per: rows.map(r => r.per), style: 'runout' },
    };
};

const makeRush = (rng: Rng): Problem => {
    const rows = bracelets(rng), k = int(rng, 5, 9);
    const lines: FillLine[] = rows.map((r, i) => ({ label: L(`${r.color.en}, ${r.per} per bracelet`, `${r.color.ru}, по ${r.per} на браслет`), parts: [B(i)] }));
    return {
        ...base, id: `${S}:rush:${tableId(rows)}:${k}`,
        prompt: L(`Bob and Kate's beads: ${tableText(rows, 'en')}. There is a special-rush order for ${k} bracelets of each color. How many beads are needed for ${k} bracelets of each color?`,
            `Бусины Боба и Кейт: ${tableText(rows, 'ru')}. Пришёл срочный заказ на ${k} ${ruPlural(k, 'браслет', 'браслета', 'браслетов')} каждого цвета. Сколько бусин нужно на ${k} ${ruPlural(k, 'браслет', 'браслета', 'браслетов')} каждого цвета?`),
        answer: { kind: 'fill', layout: 'lines', values: rows.map(r => r.per * k), lines },
        steps: [
            L(`This question is not "about": it is exact, and it multiplies. Beads per bracelet × ${k} bracelets.`, `Здесь не «примерно»: это точно, и это умножение. Бусины на браслет × ${k} ${ruPlural(k, 'браслет', 'браслета', 'браслетов')}.`),
            ...rows.map(r => L(`${r.color.en}: ${r.per} × ${k} = ${r.per * k} beads.`, `${r.color.ru}: ${r.per} × ${k} = ${r.per * k} ${ruPlural(r.per * k, 'бусина', 'бусины', 'бусин')}.`)),
            L('The total beads in the table do not matter here: the order says how many bracelets.', 'Сколько всего бусин в таблице, здесь неважно: в заказе сказано, сколько браслетов.'),
        ],
        hint: L(`${k} bracelets, each takes "beads per bracelet": multiply, do not divide.`, `${k} ${ruPlural(k, 'браслет', 'браслета', 'браслетов')}, на каждый уходит «бусин на браслет»: умножай, а не дели.`),
        data: { per: rows.map(r => r.per), k, style: 'rush' },
    };
};

// ---------- problem 22: more or less than the estimate ----------

type Pack = { en: [string, string, string]; ru: [string, string, string, string] };
const PACKS: Pack[] = [
    { en: ['pencils', 'packages', 'package'], ru: ['карандашей', 'упаковка', 'упаковки', 'упаковок'] },
    { en: ['cookies', 'boxes', 'box'], ru: ['печенек', 'коробка', 'коробки', 'коробок'] },
    { en: ['stickers', 'sheets', 'sheet'], ru: ['наклеек', 'лист', 'листа', 'листов'] },
    { en: ['marbles', 'bags', 'bag'], ru: ['шариков', 'пакет', 'пакета', 'пакетов'] },
];
const makeMoreLess = (rng: Rng): Problem => {
    const pk = pick(rng, PACKS), d = int(rng, 3, 9), n = bigPick(rng, d, 1000, 9999), { c, q } = compatibleBig(n, d), more = n > c;
    const pl = (x: number) => ruPlural(x, pk.ru[1], pk.ru[2], pk.ru[3]);
    const opt = (est: number, dir: 'more' | 'less' | 'same') => dir === 'same'
        ? W(x => `About ${x(est)} ${pk.en[1]}; you cannot tell without dividing exactly`, x => `Примерно ${x(est)} ${pl(est)}; без точного деления не узнать`)
        : W(x => `About ${x(est)} ${pk.en[1]}; the exact answer is ${dir}, because ${x(n)} is ${dir} than ${x(c)}`, x => `Примерно ${x(est)} ${pl(est)}; точный ответ ${dir === 'more' ? 'больше' : 'меньше'}, потому что ${x(n)} ${dir === 'more' ? 'больше' : 'меньше'}, чем ${x(c)}`);
    const right = opt(q, more ? 'more' : 'less');
    return {
        ...base, id: `${S}:moreless:${n}:${d}:${pk.en[0]}`,
        prompt: L(`Reasoning: the students who run the school store ordered ${fmt(n, 'en')} ${pk.en[0]}. They are putting them in ${pk.en[1]} of ${d} ${pk.en[0]}. About how many ${pk.en[1]} can they make? Will the exact answer be more or less than the estimate? Explain.`,
            `Рассуждай: ученики школьного магазина заказали ${fmt(n, 'ru')} ${pk.ru[0]}. Они раскладывают их в ${pk.ru[3]} по ${d} ${d === 1 ? pk.ru[0] : pk.ru[0]}. Сколько примерно ${pk.ru[3]} получится? Точный ответ будет больше или меньше прикидки? Объясни.`),
        answer: choice(rng, right, [opt(q, more ? 'less' : 'more'), opt(q * 10, more ? 'more' : 'less'), opt(q, 'same')]),
        steps: [
            ...estSteps(n, d),
            more
                ? W(x => `${x(n)} is more than ${x(c)}: more ${pk.en[0]}, more ${pk.en[1]}. The exact answer is more than ${x(q)}.`, x => `${x(n)} больше, чем ${x(c)}: больше ${pk.ru[0]} - больше ${pk.ru[3]}. Точный ответ больше, чем ${x(q)}.`)
                : W(x => `${x(n)} is less than ${x(c)}: fewer ${pk.en[0]}, fewer ${pk.en[1]}. The exact answer is less than ${x(q)}.`, x => `${x(n)} меньше, чем ${x(c)}: меньше ${pk.ru[0]} - меньше ${pk.ru[3]}. Точный ответ меньше, чем ${x(q)}.`),
        ],
        hint: L('Compare the real number with the compatible number. A smaller compatible number gives a smaller estimate, so the exact answer is more.', 'Сравни настоящее число с удобным. Удобное число меньше - прикидка меньше, значит точный ответ больше.'),
        data: { n, d, style: 'moreless' },
    };
};

// ---------- problem 23: two estimates, the nearest hundred and the nearest thousand ----------

const makeTwoWays = (rng: Rng): Problem => {
    const d = pick(rng, [2, 3, 4]), m = pick(rng, [d, 2 * d, 3 * d, 4 * d].filter(x => x <= 9));
    const N1 = m * 1000, N2 = N1 + (N1 + d * 100 <= 9999 && rng() < 0.5 ? d * 100 : -d * 100);
    const n = N2 + (rng() < 0.5 ? -1 : 1) * int(rng, 1, 49);
    const lines: FillLine[] = [
        { label: L('Nearest hundred', 'До ближайшей сотни'), parts: [`${fmt(n, 'en')} rounds to `, B(0), ', ', { echo: 0 }, ` ÷ ${d} = `, B(1)] },
        { label: L('Nearest thousand', 'До ближайшей тысячи'), parts: [`${fmt(n, 'en')} rounds to `, B(2), ', ', { echo: 2 }, ` ÷ ${d} = `, B(3)] },
    ];
    const closer = Math.abs(n - N2) < Math.abs(n - N1);
    return {
        ...base, id: `${S}:twoways:${n}:${d}`,
        prompt: L(`Higher Order Thinking: find two estimates for ${fmt(n, 'en')} ÷ ${d} by rounding the dividend to the nearest hundred and also to the nearest thousand. Compare the estimates.`,
            `Подумай: найди две прикидки для ${fmt(n, 'ru')} ÷ ${d}, округлив делимое до ближайшей сотни и до ближайшей тысячи. Сравни прикидки.`),
        answer: { kind: 'fill', layout: 'lines', values: [N2, N2 / d, N1, N1 / d], lines },
        steps: [
            W(x => `Nearest hundred: ${x(n)} rounds to ${x(N2)}. ${x(N2)} is ${N2 / 100} hundreds, ${N2 / 100} ÷ ${d} = ${N2 / 100 / d}, so ${x(N2)} ÷ ${d} = ${x(N2 / d)}.`, x => `До сотни: ${x(n)} округляется до ${x(N2)}. ${x(N2)} - это ${N2 / 100} ${ruPlural(N2 / 100, 'сотня', 'сотни', 'сотен')}, ${N2 / 100} ÷ ${d} = ${N2 / 100 / d}, значит ${x(N2)} ÷ ${d} = ${x(N2 / d)}.`),
            W(x => `Nearest thousand: ${x(n)} rounds to ${x(N1)}. ${m} ÷ ${d} = ${m / d}, so ${x(N1)} ÷ ${d} = ${x(N1 / d)}.`, x => `До тысячи: ${x(n)} округляется до ${x(N1)}. ${m} ÷ ${d} = ${m / d}, значит ${x(N1)} ÷ ${d} = ${x(N1 / d)}.`),
            W(x => `Compare: ${x(N2)} is closer to ${x(n)} than ${x(N1)} (${x(Math.abs(n - N2))} away, not ${x(Math.abs(n - N1))}), so ${x(N2 / d)} is the closer estimate. The thousand is faster, the hundred is closer.`,
                x => `Сравни: ${x(N2)} ближе к ${x(n)}, чем ${x(N1)} (на ${x(Math.abs(n - N2))}, а не на ${x(Math.abs(n - N1))}), значит ${x(N2 / d)} - более точная прикидка. Тысяча быстрее, сотня точнее.`),
        ],
        hint: L('Round twice: once to the hundreds, once to the thousands. Divide each rounded number. The rounded number closer to the real one gives the closer estimate.', 'Округли дважды: до сотен и до тысяч. Раздели каждое округлённое число. Чьё округление ближе к настоящему числу, та прикидка точнее.'),
        data: { n, d, closer: closer ? 1 : 0, style: 'twoways' },
    };
};

// ---------- problems 24-25: the best estimate ----------

const NAMES: [string, string][] = [['Gary', 'Гэри'], ['Mia', 'Мия'], ['Leo', 'Лео'], ['Nora', 'Нора']];
const makeBest = (rng: Rng): Problem => {
    const ctx = pick(rng, ['save', 'schools', 'miles', 'pages'] as const), d = ctx === 'save' ? int(rng, 3, 9) : int(rng, 2, 9);
    const n = bigPick(rng, d, 1000, 9999), { c, q, unit, k } = compatibleBig(n, d);
    // the neighbor fact: her rounding when it is another number, else the next fact away from the dividend
    const r = herRounding(n), nb = r !== c && r % unit === 0 ? r / d : (n > c ? k + 1 : k - 1) * unit / d;
    const money = ctx === 'save';
    const amount = (v: number) => (money ? W(x => `About $${x(v)}`, x => `Примерно $${x(v)}`) : W(x => `About ${x(v)}`, x => `Примерно ${x(v)}`));
    const [name, nameRu] = pick(rng, NAMES);
    const prompt = ctx === 'save'
        ? L(`${name}'s father needs to save $${fmt(n, 'en')} in ${d} months to pay for insurance. Which is the best estimate of the amount he should save each month?`, `Папе ${nameRu} нужно накопить $${fmt(n, 'ru')} за ${d} ${ruPlural(d, 'месяц', 'месяца', 'месяцев')} на страховку. Какая прикидка лучше всего показывает, сколько откладывать каждый месяц?`)
        : ctx === 'schools'
            ? L(`The local school district has ${fmt(n, 'en')} elementary students. They want to put the same number of students in each of ${d} schools. Which is the best estimate of the number of students they should put in each school?`, `В школьном округе ${fmt(n, 'ru')} ${ruPlural(n, 'ученик', 'ученика', 'учеников')} начальной школы. Их хотят распределить поровну по ${d} школам. Какая прикидка лучше всего показывает, сколько учеников будет в каждой школе?`)
            : ctx === 'miles'
                ? L(`${name}'s family drives ${fmt(n, 'en')} miles in ${d} days, the same distance each day. Which is the best estimate of the miles they drive each day?`, `Семья ${nameRu} проезжает ${fmt(n, 'ru')} ${ruPlural(n, 'милю', 'мили', 'миль')} за ${d} ${ruPlural(d, 'день', 'дня', 'дней')}, каждый день одинаково. Какая прикидка лучше всего показывает, сколько миль они проезжают в день?`)
                : L(`${name} wants to read a book of ${fmt(n, 'en')} pages in ${d} weeks, the same number of pages each week. Which is the best estimate of the pages to read each week?`, `${nameRu} хочет прочитать книгу в ${fmt(n, 'ru')} ${ruPlural(n, 'страницу', 'страницы', 'страниц')} за ${d} ${ruPlural(d, 'неделю', 'недели', 'недель')}, каждую неделю поровну. Какая прикидка лучше всего показывает, сколько страниц читать в неделю?`);
    return {
        ...base, id: `${S}:best:${ctx}:${n}:${d}`, prompt,
        answer: choice(rng, amount(q), [amount(nb), amount(q * 10), amount(q / 10)]),
        steps: [
            L(`Equal parts: ${fmt(n, 'en')} ÷ ${d}. "Best estimate" means the choice closest to the real answer.`, `Поровну: ${fmt(n, 'ru')} ÷ ${d}. «Лучшая прикидка» - это вариант, ближайший к настоящему ответу.`),
            ...estSteps(n, d),
            W(x => `${x(q * 10)} and ${x(q / 10)} have the wrong number of zeros; ${x(nb)} comes from a number farther from ${x(n)}.`, x => `В ${x(q * 10)} и ${x(q / 10)} не то количество нулей; ${x(nb)} получается из числа дальше от ${x(n)}.`),
        ],
        hint: L('Make your own estimate first, then find it among the choices. Watch the zeros: 600, not 60 or 6,000.', 'Сначала сделай свою прикидку, потом найди её среди вариантов. Следи за нулями: 600, а не 60 и не 6 000.'),
        data: { n, d, style: 'best' },
    };
};

export const makeTopic5Est = (rng: Rng, want?: string): Problem => {
    const style: Kind = pickStyle(rng, KINDS_5_3, want);
    if (style === 'pattern') return makePattern(rng);
    if (style === 'compat') return makeCompat(rng);
    if (style === 'table') return makeTable(rng);
    if (style === 'runout') return makeRunout(rng);
    if (style === 'rush') return makeRush(rng);
    if (style === 'moreless') return makeMoreLess(rng);
    if (style === 'twoways') return makeTwoWays(rng);
    return makeBest(rng);
};
