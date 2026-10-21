import { type FillLine, type FillPart, type L10n, type Problem, type Rng, type SkillId, L, fmt, int } from './core';

// Multiplication strategies from the 4th grade anchor chart (example 6 × 182):
// Area Model, Distributive Property, Partial Products, Standard Algorithm (4.NBT.B.5).
// Each task is a worksheet to fill in, the way the school sheets ask "Solve 5 × 976 using ...".

// 182 -> [100, 80, 2]; a zero digit adds no part (406 -> [400, 6])
export const placeParts = (n: number) => String(n).split('').map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i)).filter(v => v > 0);

const PLACE: [number, L10n][] = [[1000, L('thousands', 'тысячи')], [100, L('hundreds', 'сотни')], [10, L('tens', 'десятки')], [1, L('ones', 'единицы')]];
const placeName = (p: number) => (PLACE.find(([v]) => p >= v) ?? PLACE[3])[1];
// [700, 2] -> "hundreds and ones", named by the real parts, so a zero digit never gives a wrong name
const partNames = (parts: number[]): L10n => {
    const names = parts.map(placeName);
    const joinWith = (xs: string[], and: string) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);
    return L(joinWith(names.map(n => n.en), 'and'), joinWith(names.map(n => n.ru), 'и'));
};

// 80 × 80: 8 × 8 = 64, then the 2 zeros: 6,400
const zerosHint = (x: number, y: number): L10n => {
    const lead = (n: number) => Number(String(n).replace(/0+$/, ''));
    const z = String(x).length - String(lead(x)).length + String(y).length - String(lead(y)).length;
    if (!z) return L(`${x} × ${y} = ${fmt(x * y, 'en')}.`, `${x} × ${y} = ${fmt(x * y, 'ru')}.`);
    const zeros = (n: number, lang: 'en' | 'ru') => (lang === 'en' ? `${n} ${n === 1 ? 'zero' : 'zeros'}` : `${n} ${n === 1 ? 'ноль' : n < 5 ? 'нуля' : 'нулей'}`);
    return L(`${fmt(x, 'en')} × ${fmt(y, 'en')}: ${lead(x)} × ${lead(y)} = ${lead(x) * lead(y)}, then write the ${zeros(z, 'en')}: ${fmt(x * y, 'en')}.`,
        `${fmt(x, 'ru')} × ${fmt(y, 'ru')}: ${lead(x)} × ${lead(y)} = ${lead(x) * lead(y)}, потом допиши ${zeros(z, 'ru')}: ${fmt(x * y, 'ru')}.`);
};

type Pair = { m: number; a: number; two: boolean }; // two: 2-digit × 2-digit, otherwise one-digit × multi-digit

const pickPair = (rng: Rng, allowTwo: boolean): Pair => {
    if (allowTwo && rng() < 0.35) {
        // 2-digit × 2-digit with ones that are not zero, so there are 4 real parts
        const m = 10 * int(rng, 1, 9) + int(rng, 1, 9), a = 10 * int(rng, 1, 9) + int(rng, 1, 9);
        return { m, a, two: true };
    }
    const m = int(rng, 3, 9);
    const a = rng() < 0.7 ? int(rng, 112, 989) : int(rng, 1012, 4989);
    return { m, a, two: false };
};

const B = (b: number): FillPart => ({ b });
const plus = (xs: FillPart[]): FillPart[] => xs.flatMap((x, i) => (i ? [' + ', x] : [x]));

// Round to the two biggest places (182 -> 180) to stay close; if that changes nothing (730), round to the biggest place.
// A round number like 700 needs no estimate, so no line at all.
const checkLine = (m: number, a: number): L10n[] => {
    if (m >= 10) return [];
    const len = String(a).length;
    let est = Math.round(a / 10 ** (len - 2)) * 10 ** (len - 2);
    if (est === a) est = Math.round(a / 10 ** (len - 1)) * 10 ** (len - 1);
    if (est === a || Math.abs(est - a) / a > 0.12) return [];
    return [L(`Check with an estimate: ${fmt(a, 'en')} is about ${fmt(est, 'en')}, ${m} × ${fmt(est, 'en')} = ${fmt(m * est, 'en')}, close to ${fmt(m * a, 'en')} ✓`,
        `Проверь прикидкой: ${fmt(a, 'ru')} - это примерно ${fmt(est, 'ru')}, ${m} × ${fmt(est, 'ru')} = ${fmt(m * est, 'ru')}, близко к ${fmt(m * a, 'ru')} ✓`)];
};

// ---------- Area Model ----------

const makeArea = (rng: Rng): Problem => {
    const { m, a, two } = pickPair(rng, true);
    const pa = placeParts(a), pm = two ? placeParts(m) : [m];
    const values: number[] = [];
    const top = pa.map(p => { values.push(p); return B(values.length - 1); });
    const left: FillPart[] = two ? pm.map(p => { values.push(p); return B(values.length - 1); }) : [String(m)];
    const cells = pm.map(x => pa.map(y => { values.push(x * y); return values.length - 1; }));
    values.push(m * a);
    const total = values.length - 1;
    const products = pm.flatMap(x => pa.map(y => x * y));
    return {
        id: `mult-area:${m}x${a}`, skill: 'mult-area', topic: 'estimation',
        prompt: two
            ? L(`Solve ${m} × ${a} using the Area Model. Put ${a} on top and ${m} on the left, break both into tens and ones, fill in every box, then add the boxes.`,
                `Реши ${m} × ${a} с помощью модели площади. Сверху ${a}, слева ${m}: разбей оба числа на десятки и единицы, заполни каждую клетку и сложи их.`)
            : L(`Solve ${m} × ${fmt(a, 'en')} using the Area Model. Break ${fmt(a, 'en')} into ${partNames(pa).en} on top, fill in every box, then add the boxes.`,
                `Реши ${m} × ${fmt(a, 'ru')} с помощью модели площади. Разбей ${fmt(a, 'ru')} сверху на ${partNames(pa).ru}, заполни каждую клетку и сложи их.`),
        answer: { kind: 'fill', layout: 'area', values, top, left, cells, total },
        steps: [
            L(`Break apart by place value: ${fmt(a, 'en')} = ${pa.map(p => fmt(p, 'en')).join(' + ')}${two ? `, ${m} = ${pm.join(' + ')}` : ''}.`,
                `Раскладываем по разрядам: ${fmt(a, 'ru')} = ${pa.map(p => fmt(p, 'ru')).join(' + ')}${two ? `, ${m} = ${pm.join(' + ')}` : ''}.`),
            ...pm.flatMap(x => pa.map(y => L(`${fmt(x, 'en')} × ${fmt(y, 'en')} = ${fmt(x * y, 'en')}`, `${fmt(x, 'ru')} × ${fmt(y, 'ru')} = ${fmt(x * y, 'ru')}`))),
            L(`Add the boxes: ${products.map(p => fmt(p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}.`, `Складываем клетки: ${products.map(p => fmt(p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}.`),
            ...checkLine(m, a),
        ],
        hint: L(`Each box is the number on the left times the number on top. ${zerosHint(pm[0], pa[0]).en}`, `Каждая клетка - число слева умножить на число сверху. ${zerosHint(pm[0], pa[0]).ru}`),
        visual: { kind: 'area', a, b: m },
        data: { m, a, two: two ? 1 : 0 },
    };
};

// ---------- Distributive Property ----------

const makeDist = (rng: Rng): Problem => {
    const { m, a, two } = pickPair(rng, true);
    // break the second factor apart by place value and hand the first factor to every part
    const pa = placeParts(a);
    const values: number[] = [];
    const split = pa.map(p => { values.push(p); return B(values.length - 1); });
    const prods = pa.map(p => { values.push(m * p); return B(values.length - 1); });
    values.push(m * a);
    const group = (from: number) => pa.map((_, i) => from + i);
    const again: FillPart[] = pa.map((_, i) => ({ echo: i }));
    const lines: FillLine[] = [
        { parts: [`${fmt(m, 'en')} × ${fmt(a, 'en')} = ${m} × (`, ...plus(split), ')'] },
        { parts: ['= ', ...again.flatMap((x, i) => [...(i ? [' + '] : []), `(${m} × `, x, ')'])] },
        { parts: ['= ', ...plus(prods)] },
        { parts: ['= ', B(values.length - 1)] },
    ];
    return {
        id: `mult-dist:${m}x${a}`, skill: 'mult-dist', topic: 'estimation',
        prompt: L(`Solve ${m} × ${fmt(a, 'en')} using the Distributive Property: break ${fmt(a, 'en')} apart by place value, multiply each part by ${m}, then add.`,
            `Реши ${m} × ${fmt(a, 'ru')} с помощью распределительного свойства: разбей ${fmt(a, 'ru')} по разрядам, умножь каждую часть на ${m} и сложи.`),
        answer: { kind: 'fill', layout: 'lines', values, lines, anyOrder: [group(0)], multiply: { by: m, parts: group(0), products: group(pa.length) } },
        steps: [
            L(`${m} × ${fmt(a, 'en')} = ${m} × (${pa.map(p => fmt(p, 'en')).join(' + ')})`, `${m} × ${fmt(a, 'ru')} = ${m} × (${pa.map(p => fmt(p, 'ru')).join(' + ')})`),
            L(`= ${pa.map(p => `(${m} × ${fmt(p, 'en')})`).join(' + ')}`, `= ${pa.map(p => `(${m} × ${fmt(p, 'ru')})`).join(' + ')}`),
            L(`= ${pa.map(p => fmt(m * p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}`, `= ${pa.map(p => fmt(m * p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}`),
            L(`The ${m} is shared with every part: that is the distributive property.`, `Множитель ${m} достаётся каждой части: это и есть распределительное свойство.`),
            ...checkLine(m, a),
        ],
        hint: two
            ? L(`Write ${a} as ${pa.join(' + ')}. Then ${m} × ${pa[0]} = ${m} × ${pa[0] / 10} × 10 = ${fmt(m * pa[0] / 10, 'en')} × 10 = ${fmt(m * pa[0], 'en')}.`,
                `Запиши ${a} как ${pa.join(' + ')}. Потом ${m} × ${pa[0]} = ${m} × ${pa[0] / 10} × 10 = ${fmt(m * pa[0] / 10, 'ru')} × 10 = ${fmt(m * pa[0], 'ru')}.`)
            : L(`First write ${fmt(a, 'en')} as ${pa.length} parts: ${partNames(pa).en}.`, `Сначала запиши ${fmt(a, 'ru')} как ${pa.length} ${pa.length < 5 ? 'части' : 'частей'}: ${partNames(pa).ru}.`),
        data: { m, a, two: two ? 1 : 0 },
    };
};

// ---------- Partial Products ----------

const makePartial = (rng: Rng): Problem => {
    const { m, a, two } = pickPair(rng, true);
    const pa = placeParts(a), pm = two ? placeParts(m) : [m];
    // row by row, like the rows of the Area Model: 6 × 100, 6 × 80, 6 × 2; 20 × 40, 20 × 5, 3 × 40, 3 × 5
    const pairs: [number, number][] = pm.flatMap(x => pa.map(y => [x, y] as [number, number]));
    const values = pairs.map(([x, y]) => x * y);
    values.push(m * a);
    const lines: FillLine[] = [
        { parts: [fmt(a, 'en')] },
        { parts: [`× ${m}`] },
        ...pairs.map(([x, y], i): FillLine => ({ parts: [...(i === pairs.length - 1 ? ['+ '] : []), B(i)], note: `← ${fmt(x, 'en')} × ${fmt(y, 'en')}` })),
        { parts: [B(values.length - 1)], label: L('Total', 'Итого') },
    ];
    // the school sheet writes "5 × 976": she copies it into a column with the big number on top
    const asked = !two && rng() < 0.5 ? L(`${m} × ${fmt(a, 'en')}`, `${m} × ${fmt(a, 'ru')}`) : L(`${fmt(a, 'en')} × ${m}`, `${fmt(a, 'ru')} × ${m}`);
    return {
        id: `mult-partial:${m}x${a}:${asked.en.startsWith(String(m)) ? 'm' : 'a'}`, skill: 'mult-partial', topic: 'estimation',
        prompt: L(`Solve ${asked.en} using Partial Products. Write each partial product, then add them.`,
            `Реши ${asked.ru} частичными произведениями. Запиши каждое частичное произведение и сложи их.`),
        answer: { kind: 'fill', layout: 'vertical', values, lines, anyOrder: [pairs.map((_, i) => i)] },
        steps: [
            ...(asked.en.startsWith(String(m)) && !two ? [L(`Write the big number on top: ${fmt(a, 'en')} × ${m} is the same as ${m} × ${fmt(a, 'en')}.`, `Большое число пишем сверху: ${fmt(a, 'ru')} × ${m} - то же самое, что ${m} × ${fmt(a, 'ru')}.`)] : []),
            ...pairs.map(([x, y]) => L(`${fmt(x, 'en')} × ${fmt(y, 'en')} = ${fmt(x * y, 'en')}`, `${fmt(x, 'ru')} × ${fmt(y, 'ru')} = ${fmt(x * y, 'ru')}`)),
            L(`${values.slice(0, -1).map(v => fmt(v, 'en')).join(' + ')} = ${fmt(m * a, 'en')}`, `${values.slice(0, -1).map(v => fmt(v, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}`),
            L('Line the partial products up by place value before you add: ones under ones, tens under tens.', 'Перед сложением выровняй частичные произведения по разрядам: единицы под единицами, десятки под десятками.'),
            ...checkLine(m, a),
        ],
        hint: L(`Multiply by one place at a time. ${zerosHint(pairs[0][0], pairs[0][1]).en}`, `Умножай по одному разряду. ${zerosHint(pairs[0][0], pairs[0][1]).ru}`),
        data: { m, a, two: two ? 1 : 0 },
    };
};

// ---------- Standard Algorithm (one-digit multiplier) ----------

export type StandardRow = { d: number; prod: number; carryIn: number; sum: number; write: number; carryOut: number };

export const standardRows = (m: number, a: number): StandardRow[] => {
    const digits = String(a).split('').map(Number).reverse();
    const rows: StandardRow[] = [];
    let carry = 0;
    digits.forEach((d, i) => {
        const prod = m * d, sum = prod + carry;
        const last = i === digits.length - 1;
        rows.push({ d, prod, carryIn: carry, sum, write: last ? sum : sum % 10, carryOut: last ? 0 : Math.floor(sum / 10) });
        carry = Math.floor(sum / 10);
    });
    return rows;
};

const PLACE_LABEL: L10n[] = [L('Ones place: start here!', 'Разряд единиц: начинаем здесь!'), L('Tens place', 'Разряд десятков'), L('Hundreds place', 'Разряд сотен'), L('Thousands place', 'Разряд тысяч')];
const WRITE = L('write', 'пишем'), CARRY = L('carry', 'переносим');

const makeStandard = (rng: Rng): Problem => {
    // carrying is the point of the standard algorithm, so at least one place gets a carry
    let { m, a } = pickPair(rng, false);
    while (!standardRows(m, a).some(r => r.carryIn > 0)) ({ m, a } = pickPair(rng, false));
    const rows = standardRows(m, a);
    const values: number[] = [];
    const box = (v: number) => { values.push(v); return B(values.length - 1); };
    // every place: the product, plus the carry, then the digit she writes and the digit she carries (like "4 1" above 182)
    const lines: FillLine[] = rows.map((r, i): FillLine => {
        const last = i === rows.length - 1;
        const parts: FillPart[] = [`${m} × ${r.d} = `, box(r.prod)];
        if (r.carryIn) parts.push(` + ${r.carryIn} = `, box(r.sum));
        if (!last) parts.push('  →  ', { t: WRITE }, ' ', box(r.write), ',', '  ', { t: CARRY }, ' ', box(r.carryOut));
        return { parts, label: PLACE_LABEL[i] };
    });
    lines.push({ parts: [`${fmt(a, 'en')} × ${m} = `, box(m * a)], label: L('Answer', 'Ответ') });
    const place = (i: number) => [L('ones', 'единиц'), L('tens', 'десятков'), L('hundreds', 'сотен'), L('thousands', 'тысяч'), L('ten thousands', 'десятков тысяч')][i];
    return {
        id: `mult-standard:${m}x${a}`, skill: 'mult-standard', topic: 'estimation',
        prompt: L(`Solve ${fmt(a, 'en')} × ${m} using the Standard Algorithm. Start in the ones place, write one digit and carry the rest to the next place.`,
            `Реши ${fmt(a, 'ru')} × ${m} умножением столбиком. Начни с разряда единиц: пиши одну цифру, а остальное переноси в следующий разряд.`),
        answer: { kind: 'fill', layout: 'lines', values, lines },
        steps: [
            ...rows.map((r, i) => {
                const head = r.carryIn ? `${m} × ${r.d} = ${r.prod}, ${r.prod} + ${r.carryIn} = ${r.sum}` : `${m} × ${r.d} = ${r.prod}`;
                return i === rows.length - 1
                    ? L(`${place(i).en[0].toUpperCase()}${place(i).en.slice(1)}: ${head}. It is the last digit, so write ${r.sum}.`, `Разряд ${place(i).ru}: ${head}. Это последняя цифра, пишем ${r.sum}.`)
                    : L(`${place(i).en[0].toUpperCase()}${place(i).en.slice(1)}: ${head}. Write ${r.write}, carry ${r.carryOut}.`,
                        `Разряд ${place(i).ru}: ${head}. Пишем ${r.write}, переносим ${r.carryOut}.`);
            }),
            L(`So ${fmt(a, 'en')} × ${m} = ${fmt(m * a, 'en')}.`, `Значит ${fmt(a, 'ru')} × ${m} = ${fmt(m * a, 'ru')}.`),
            L('Nothing to carry? Then the carry is 0.', 'Нечего переносить? Тогда перенос 0.'),
            ...checkLine(m, a),
        ],
        hint: rows[0].carryOut
            ? L(`First ${m} × ${rows[0].d} = ${rows[0].prod}. Write the ones digit ${rows[0].write} and carry the tens digit ${rows[0].carryOut} to the next place.`,
                `Сначала ${m} × ${rows[0].d} = ${rows[0].prod}. Пиши цифру единиц ${rows[0].write}, а цифру десятков ${rows[0].carryOut} переноси в следующий разряд.`)
            : L(`First ${m} × ${rows[0].d} = ${rows[0].prod}: write ${rows[0].write}, there is nothing to carry, so the carry is 0.`, `Сначала ${m} × ${rows[0].d} = ${rows[0].prod}: пишем ${rows[0].write}, переносить нечего, перенос 0.`),
        data: { m, a, two: 0 },
    };
};

export const makeStrategy = (rng: Rng, skill: SkillId): Problem => {
    if (skill === 'mult-area') return makeArea(rng);
    if (skill === 'mult-dist') return makeDist(rng);
    if (skill === 'mult-partial') return makePartial(rng);
    return makeStandard(rng);
};
