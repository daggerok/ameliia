import { type L10n, type Problem, type Rng, type SkillId, L, choice, fmt, int, pick, pickStyle, ruPlural } from './core';
import { AMELIIA, FAMILY } from './words';

export const PLACE_NAME: Record<number, L10n> = {
    10: L('ten', 'десятков'), 100: L('hundred', 'сотен'), 1000: L('thousand', 'тысяч'), 10000: L('ten thousand', 'десятков тысяч'),
};
const PLACE_DIGIT_NAME: Record<number, L10n> = {
    10: L('tens', 'десятков'), 100: L('hundreds', 'сотен'), 1000: L('thousands', 'тысяч'), 10000: L('ten thousands', 'десятков тысяч'),
};

export const roundTo = (n: number, place: number) => Math.round(n / place) * place;
const digitAt = (n: number, place: number) => Math.floor(n / place) % 10;

export const roundingSteps = (n: number, place: number): L10n[] => {
    const d = digitAt(n, place);
    const next = digitAt(n, place / 10);
    const r = roundTo(n, place);
    const up = next >= 5;
    const steps: L10n[] = [
        L(`Find the ${PLACE_DIGIT_NAME[place].en} digit in ${fmt(n, 'en')}: it is ${d}.`, `Находим цифру разряда ${PLACE_DIGIT_NAME[place].ru} в числе ${fmt(n, 'ru')}: это ${d}.`),
        L(`Look at the digit just to its right: ${next}.`, `Смотрим на цифру справа от неё: ${next}.`),
        up
            ? L(`${next} is 5 or more, so we round UP: ${d} becomes ${d + 1}${d === 9 ? ': write 0 and carry 1 to the next place' : ''}.`,
                `${next} - это 5 или больше, значит округляем ВВЕРХ: ${d} становится ${d + 1}${d === 9 ? ': пишем 0 и переносим 1 в следующий разряд' : ''}.`)
            : L(`${next} is less than 5, so we round DOWN: ${d} stays ${d}.`, `${next} меньше 5, значит округляем ВНИЗ: ${d} остаётся ${d}.`),
        L(`All digits to the right become zeros: ${fmt(r, 'en')}.`, `Все цифры правее становятся нулями: ${fmt(r, 'ru')}.`),
    ];
    return steps;
};

const placesFor = (digits: number) => [10, 100, 1000, 10000].filter(p => p < 10 ** (digits - 1) * 10 && p <= 10 ** (digits - 1));

const makeRound = (rng: Rng): Problem => {
    const digits = int(rng, 2, 5);
    const place = pick(rng, placesFor(digits));
    let n = int(rng, 10 ** (digits - 1), 10 ** digits - 1);
    const tricky = rng();
    if (tricky < 0.2 && place * 10 < 10 ** digits) {
        // make the place digit a 9 that rolls over, like 7,962 -> 8,000
        n = n - digitAt(n, place) * place + 9 * place;
        n = n - digitAt(n, place / 10) * (place / 10) + int(rng, 5, 9) * (place / 10);
    } else if (tricky < 0.35) {
        // exactly a 5 to the right: still rounds up
        n = n - digitAt(n, place / 10) * (place / 10) + 5 * (place / 10);
    }
    // a number that is already round would make an empty task
    while (n % place === 0) n += int(rng, 1, place - 1);
    const style = rng() < 0.75 ? 'plain' : pick(rng, ['greatest', 'least'] as const);
    if (style === 'plain') {
        const r = roundTo(n, place);
        const low = Math.floor(n / place) * place;
        return {
            id: `round:${n}:${place}`, skill: 'round', topic: 'estimation',
            prompt: L(`Round ${fmt(n, 'en')} to the nearest ${PLACE_NAME[place].en}.`, `Округли ${fmt(n, 'ru')} до ${PLACE_NAME[place].ru}.`),
            answer: { kind: 'number', value: r },
            steps: [L(`${fmt(n, 'en')} is between ${fmt(low, 'en')} and ${fmt(low + place, 'en')}.`, `${fmt(n, 'ru')} лежит между ${fmt(low, 'ru')} и ${fmt(low + place, 'ru')}.`), ...roundingSteps(n, place)],
            hint: L(`Is ${fmt(n, 'en')} closer to ${fmt(low, 'en')} or to ${fmt(low + place, 'en')}?`, `${fmt(n, 'ru')} ближе к ${fmt(low, 'ru')} или к ${fmt(low + place, 'ru')}?`),
            visual: { kind: 'numberline', value: n, low, high: low + place, place },
            data: { n, place, value: r },
        };
    }
    const target = roundTo(n, place) || place;
    const value = style === 'greatest' ? target + place / 2 - 1 : target - place / 2;
    return {
        id: `round:${style}:${target}:${place}`, skill: 'round', topic: 'estimation',
        prompt: style === 'greatest'
            ? L(`What is the GREATEST whole number that rounds to ${fmt(target, 'en')} when you round to the nearest ${PLACE_NAME[place].en}?`,
                `Какое САМОЕ БОЛЬШОЕ целое число при округлении до ${PLACE_NAME[place].ru} даёт ${fmt(target, 'ru')}?`)
            : L(`What is the LEAST whole number that rounds to ${fmt(target, 'en')} when you round to the nearest ${PLACE_NAME[place].en}?`,
                `Какое САМОЕ МАЛЕНЬКОЕ целое число при округлении до ${PLACE_NAME[place].ru} даёт ${fmt(target, 'ru')}?`),
        answer: { kind: 'number', value },
        steps: [
            L(`The halfway point between ${fmt(target - place, 'en')} and ${fmt(target, 'en')} is ${fmt(target - place / 2, 'en')}; between ${fmt(target, 'en')} and ${fmt(target + place, 'en')} it is ${fmt(target + place / 2, 'en')}.`,
                `Середина между ${fmt(target - place, 'ru')} и ${fmt(target, 'ru')} - это ${fmt(target - place / 2, 'ru')}; между ${fmt(target, 'ru')} и ${fmt(target + place, 'ru')} - ${fmt(target + place / 2, 'ru')}.`),
            L(`A halfway number rounds UP, so ${fmt(target - place / 2, 'en')} already rounds to ${fmt(target, 'en')}, but ${fmt(target + place / 2, 'en')} rounds to ${fmt(target + place, 'en')}.`,
                `Число ровно посередине округляется ВВЕРХ: ${fmt(target - place / 2, 'ru')} уже даёт ${fmt(target, 'ru')}, а ${fmt(target + place / 2, 'ru')} даёт ${fmt(target + place, 'ru')}.`),
            L(`So the answer is ${fmt(value, 'en')}.`, `Значит ответ ${fmt(value, 'ru')}.`),
        ],
        hint: L('Find the halfway numbers. Remember: exactly halfway rounds up.', 'Найди числа посередине. Помни: ровно посередине - округляем вверх.'),
        data: { target, place, style, value },
    };
};

const makeEstSum = (rng: Rng): Problem => {
    if (rng() < 0.3) {
        // a cafe bill rounded to the nearest ten dollars
        // realistic cafe prices: lunch $11-39, a treat $8-29
        const a = int(rng, 11, 39), b = int(rng, 8, 29);
        const ra = roundTo(a, 10), rb = roundTo(b, 10);
        const who = pick(rng, FAMILY.slice(1));
        return {
            id: `est-sum:cafe:${a}:${b}`, skill: 'est-sum', topic: 'estimation',
            prompt: L(`At a cafe ${who.en} buys lunch for $${a} and ice cream and hot chocolate for $${b}. Round each price to the nearest ten dollars. About how much is the bill?`,
                `В кафе ${who.ru[0].toLowerCase()}${who.ru.slice(1)} покупает обед за $${a}, а мороженое и горячий шоколад за $${b}. Округли каждую цену до десятков долларов. Примерно сколько будет счёт?`),
            answer: { kind: 'number', value: ra + rb },
            steps: [L(`$${a} rounds to $${ra}, $${b} rounds to $${rb}.`, `$${a} округляем до $${ra}, $${b} - до $${rb}.`),
                L(`$${ra} + $${rb} = $${ra + rb}. The exact bill is $${a + b}, very close!`, `$${ra} + $${rb} = $${ra + rb}. Точный счёт $${a + b} - очень близко!`)],
            hint: L('Round first, then add the round numbers.', 'Сначала округли, потом сложи круглые числа.'),
            data: { values: [a, b], place: 10, value: ra + rb },
        };
    }
    const place = pick(rng, [100, 100, 1000]);
    const count = int(rng, 2, 3);
    const subtract = count === 2 && rng() < 0.35;
    let nums = Array.from({ length: count }, () => int(rng, place === 100 ? 101 : 1001, place === 100 ? 989 : 9899));
    // an estimate must really be close: rounding both numbers of a difference can blow it up (1,549 − 1,450 -> 1,000)
    for (let i = 0; i < 50 && subtract && Math.abs((roundTo(Math.max(...nums), place) - roundTo(Math.min(...nums), place)) - (Math.max(...nums) - Math.min(...nums))) > place / 2; i++) {
        nums = Array.from({ length: count }, () => int(rng, place === 100 ? 101 : 1001, place === 100 ? 989 : 9899));
    }
    if (subtract) nums.sort((x, y) => y - x);
    const rounded = nums.map(x => roundTo(x, place));
    if (subtract && rounded[0] === rounded[1]) nums[0] += place;
    const r2 = nums.map(x => roundTo(x, place));
    const value = subtract ? r2[0] - r2[1] : r2.reduce((s, x) => s + x, 0);
    const op = subtract ? ' − ' : ' + ';
    return {
        id: `est-sum:${subtract ? 'd' : 's'}:${nums.join(',')}:${place}`, skill: 'est-sum', topic: 'estimation',
        prompt: L(`Estimate ${nums.map(x => fmt(x, 'en')).join(op)} by rounding each number to the nearest ${PLACE_NAME[place].en}.`,
            `Прикинь ${nums.map(x => fmt(x, 'ru')).join(op)}: округли каждое число до ${PLACE_NAME[place].ru}.`),
        answer: { kind: 'number', value },
        steps: [
            ...nums.map((x, i) => L(`${fmt(x, 'en')} → ${fmt(r2[i], 'en')}`, `${fmt(x, 'ru')} → ${fmt(r2[i], 'ru')}`)),
            L(`${r2.map(x => fmt(x, 'en')).join(op)} = ${fmt(value, 'en')}.`, `${r2.map(x => fmt(x, 'ru')).join(op)} = ${fmt(value, 'ru')}.`),
            L(`The exact answer is ${fmt(subtract ? nums[0] - nums[1] : nums.reduce((s, x) => s + x, 0), 'en')}, so our estimate is close.`,
                `Точный ответ ${fmt(subtract ? nums[0] - nums[1] : nums.reduce((s, x) => s + x, 0), 'ru')}, наша прикидка близко.`),
        ],
        hint: L(`Round every number to the nearest ${PLACE_NAME[place].en} first. Then the math is easy!`, `Сначала округли каждое число до ${PLACE_NAME[place].ru}. Потом считать легко!`),
        data: { values: nums, place, subtract: subtract ? 1 : 0, value },
    };
};

// 50 × 30: multiply the front digits (5 × 3 = 15), then write all the zeros (2 zeros -> 1,500)
export const zerosSteps = (a: number, b: number): L10n[] => {
    const lead = (x: number) => Number(String(x).replace(/0+$/, ''));
    const zeros = (x: number) => String(x).length - String(lead(x)).length;
    const la = lead(a), lb = lead(b), z = zeros(a) + zeros(b);
    const p = la * lb;
    return [
        L(`Multiply the front digits: ${la} × ${lb} = ${p}.`, `Перемножаем цифры без нулей: ${la} × ${lb} = ${p}.`),
        L(`Count the zeros in ${fmt(a, 'en')} and ${fmt(b, 'en')}: ${z}. Write them after ${p}: ${fmt(a * b, 'en')}.`,
            `Считаем нули в ${fmt(a, 'ru')} и ${fmt(b, 'ru')}: ${z}. Дописываем их после ${p}: ${fmt(a * b, 'ru')}.`),
    ];
};

const makeEstProduct = (rng: Rng, want?: string): Problem => {
    const style = pickStyle(rng, ['tens', 'tens', 'big', 'reasonable'] as const, want);
    if (style === 'tens') {
        let a = int(rng, 21, 98), b = int(rng, 21, 98);
        while (a % 10 === 0) a++;
        while (b % 10 === 0) b++;
        const ra = roundTo(a, 10), rb = roundTo(b, 10);
        return {
            id: `est-product:t:${a}:${b}`, skill: 'est-product', topic: 'estimation',
            prompt: L(`Estimate ${a} × ${b} by rounding each number to the nearest ten.`, `Прикинь ${a} × ${b}: округли каждое число до десятков.`),
            answer: { kind: 'number', value: ra * rb },
            steps: [L(`${a} → ${ra}, ${b} → ${rb}.`, `${a} → ${ra}, ${b} → ${rb}.`), ...zerosSteps(ra, rb),
                L(`The exact answer is ${fmt(a * b, 'en')}. The estimate tells us the answer is about ${fmt(ra * rb, 'en')}.`, `Точный ответ ${fmt(a * b, 'ru')}. Прикидка подсказывает, что ответ около ${fmt(ra * rb, 'ru')}.`)],
            hint: L('Round both numbers to tens, multiply the front digits, then add the zeros.', 'Округли оба числа до десятков, перемножь цифры без нулей и допиши нули.'),
            data: { a, b, ra, rb, value: ra * rb },
        };
    }
    if (style === 'big') {
        const b = int(rng, 3, 9);
        const big = rng() < 0.5;
        const place = big ? 1000 : 100;
        let a = big ? int(rng, 1100, 9400) : int(rng, 110, 940);
        if (roundTo(a, place) === 0 || roundTo(a, place) >= place * 10) a = place * 2 + 37;
        const ra = roundTo(a, place);
        return {
            id: `est-product:b:${a}:${b}`, skill: 'est-product', topic: 'estimation',
            prompt: L(`Estimate ${fmt(a, 'en')} × ${b}. Round ${fmt(a, 'en')} to the nearest ${PLACE_NAME[place].en} first.`,
                `Прикинь ${fmt(a, 'ru')} × ${b}. Сначала округли ${fmt(a, 'ru')} до ${PLACE_NAME[place].ru}.`),
            answer: { kind: 'number', value: ra * b },
            steps: [L(`${fmt(a, 'en')} → ${fmt(ra, 'en')}.`, `${fmt(a, 'ru')} → ${fmt(ra, 'ru')}.`), ...zerosSteps(ra, b),
                L(`The exact answer is ${fmt(a * b, 'en')}.`, `Точный ответ ${fmt(a * b, 'ru')}.`)],
            hint: L(`${fmt(ra, 'en')} × ${b}: think ${ra / place} × ${b}, then add the zeros.`, `${fmt(ra, 'ru')} × ${b}: посчитай ${ra / place} × ${b}, потом допиши нули.`),
            data: { a, b, ra, value: ra * b },
        };
    }
    let a = int(rng, 21, 89), b = int(rng, 21, 89);
    while (a % 10 === 0) a++;
    while (b % 10 === 0) b++;
    const exact = a * b;
    const est = roundTo(a, 10) * roundTo(b, 10);
    const offered = pick(rng, [exact, exact, Math.round(exact / 10), exact * 10]);
    const ok = offered === exact;
    const answer = choice(rng,
        ok ? L(`Yes, it is about the same size as the estimate ${fmt(est, 'en')}`, `Да, это примерно того же размера, что и прикидка ${fmt(est, 'ru')}`)
            : L(`No, the estimate is about ${fmt(est, 'en')}`, `Нет, прикидка примерно ${fmt(est, 'ru')}`),
        ok ? [L(`No, the estimate is about ${fmt(est * 10, 'en')}`, `Нет, прикидка примерно ${fmt(est * 10, 'ru')}`), L(`No, the estimate is about ${fmt(Math.round(est / 10), 'en')}`, `Нет, прикидка примерно ${fmt(Math.round(est / 10), 'ru')}`)]
            : [L(`Yes, it is about the same size as the estimate ${fmt(est, 'en')}`, `Да, это примерно того же размера, что и прикидка ${fmt(est, 'ru')}`), L(`Yes, any answer with these digits is fine`, `Да, подходит любой ответ с такими цифрами`)]);
    return {
        id: `est-product:r:${a}:${b}:${offered}`, skill: 'est-product', topic: 'estimation',
        prompt: L(`${AMELIIA.en} got ${fmt(offered, 'en')} for ${a} × ${b}. Is that a reasonable answer?`, `У ${AMELIIA.ruGen} получилось ${a} × ${b} = ${fmt(offered, 'ru')}. Это правдоподобный ответ?`),
        answer,
        steps: [L(`Estimate: ${a} → ${roundTo(a, 10)}, ${b} → ${roundTo(b, 10)}, ${roundTo(a, 10)} × ${roundTo(b, 10)} = ${fmt(est, 'en')}.`, `Прикидка: ${a} → ${roundTo(a, 10)}, ${b} → ${roundTo(b, 10)}, ${roundTo(a, 10)} × ${roundTo(b, 10)} = ${fmt(est, 'ru')}.`),
            ok ? L(`${fmt(offered, 'en')} is about the same size as ${fmt(est, 'en')}, so it is reasonable. (Exact: ${fmt(exact, 'en')}.)`, `${fmt(offered, 'ru')} примерно того же размера, что и ${fmt(est, 'ru')}, значит ответ правдоподобный. (Точно: ${fmt(exact, 'ru')}.)`)
                : L(`${fmt(offered, 'en')} is far from ${fmt(est, 'en')}, so something went wrong. (Exact: ${fmt(exact, 'en')}.)`, `${fmt(offered, 'ru')} далеко от ${fmt(est, 'ru')}, значит где-то ошибка. (Точно: ${fmt(exact, 'ru')}.)`)],
        hint: L('Estimate first. Is the answer about the same size?', 'Сначала прикинь. Ответ примерно такого же размера?'),
        data: { a, b, offered, est, ok: ok ? 1 : 0 },
    };
};

export const areaSteps = (a: number, b: number): L10n[] => {
    const split = (x: number) => String(x).split('').map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i)).filter(v => v > 0);
    const pa = split(a), pb = b < 10 ? [b] : split(b);
    const parts: { x: number; y: number; p: number }[] = [];
    pa.forEach(x => pb.forEach(y => parts.push({ x, y, p: x * y })));
    return [
        // a round number like 60 is already one part, there is nothing to break apart
        L(`Break the numbers apart by place value: ${[pa.length > 1 ? `${fmt(a, 'en')} = ${pa.map(x => fmt(x, 'en')).join(' + ')}` : `${fmt(a, 'en')} is already one part`, ...(b >= 10 ? [pb.length > 1 ? `${b} = ${pb.join(' + ')}` : `${b} is already one part`] : [])].join(', ')}.`,
            `Раскладываем числа по разрядам: ${[pa.length > 1 ? `${fmt(a, 'ru')} = ${pa.map(x => fmt(x, 'ru')).join(' + ')}` : `${fmt(a, 'ru')} - уже одна часть`, ...(b >= 10 ? [pb.length > 1 ? `${b} = ${pb.join(' + ')}` : `${b} - уже одна часть`] : [])].join(', ')}.`),
        ...parts.map(q => L(`${fmt(q.x, 'en')} × ${q.y} = ${fmt(q.p, 'en')}`, `${fmt(q.x, 'ru')} × ${q.y} = ${fmt(q.p, 'ru')}`)),
        L(`Add the parts: ${parts.map(q => fmt(q.p, 'en')).join(' + ')} = ${fmt(a * b, 'en')}.`, `Складываем части: ${parts.map(q => fmt(q.p, 'ru')).join(' + ')} = ${fmt(a * b, 'ru')}.`),
    ];
};

const makeMultiply = (rng: Rng): Problem => {
    const twoByTwo = rng() < 0.5;
    const story = rng() < 0.4;
    // a gymnastics club has 12-40 kids and a kid gets 12-20 stickers, plain tasks use any two-digit numbers
    const a = twoByTwo ? (story ? int(rng, 12, 40) : int(rng, 12, 98)) : int(rng, 102, 4999);
    const b = twoByTwo ? (story ? int(rng, 12, 20) : int(rng, 12, 98)) : int(rng, 2, 9);
    const prompt = story
        ? (twoByTwo
            ? L(`The gymnastics club has ${a} kids. Each kid gets ${b} stickers for a great practice. How many stickers is that in all?`,
                `В клубе гимнастики ${a} ${ruPlural(a, 'ребёнок', 'ребёнка', 'детей')}. Каждый получает по ${b} ${ruPlural(b, 'наклейке', 'наклейки', 'наклеек')} за хорошую тренировку. Сколько всего наклеек?`)
            : L(`A cafe in Fort Lee sells ${fmt(a, 'en')} cups of hot chocolate every month. How many cups does it sell in ${b} months?`,
                `Кафе в Форт-Ли продаёт ${fmt(a, 'ru')} ${ruPlural(a, 'чашку', 'чашки', 'чашек')} горячего шоколада в месяц. Сколько чашек оно продаст за ${b} ${ruPlural(b, 'месяц', 'месяца', 'месяцев')}?`))
        : L(`${fmt(a, 'en')} × ${b} = ?`, `${fmt(a, 'ru')} × ${b} = ?`);
    return {
        id: `multiply:${a}:${b}`, skill: 'multiply', topic: 'estimation',
        prompt, answer: { kind: 'number', value: a * b },
        steps: [...areaSteps(a, b), L(`Estimate to check: about ${fmt(roundTo(a, a >= 1000 ? 1000 : a >= 100 ? 100 : 10), 'en')} × ${b < 10 ? b : roundTo(b, 10)} = ${fmt(roundTo(a, a >= 1000 ? 1000 : a >= 100 ? 100 : 10) * (b < 10 ? b : roundTo(b, 10)), 'en')} ✓`,
            `Прикидка для проверки: примерно ${fmt(roundTo(a, a >= 1000 ? 1000 : a >= 100 ? 100 : 10), 'ru')} × ${b < 10 ? b : roundTo(b, 10)} = ${fmt(roundTo(a, a >= 1000 ? 1000 : a >= 100 ? 100 : 10) * (b < 10 ? b : roundTo(b, 10)), 'ru')} ✓`)],
        hint: L('Break each number apart by place value (thousands, hundreds, tens, ones), multiply each part, then add.', 'Разбей каждое число по разрядам (тысячи, сотни, десятки, единицы), умножь каждую часть и сложи.'),
        visual: { kind: 'area', a, b },
        data: { a, b, value: a * b },
    };
};

export const makeEstimation = (rng: Rng, skill: SkillId, want?: string): Problem => {
    if (skill === 'est-sum') return makeEstSum(rng);
    if (skill === 'est-product') return makeEstProduct(rng, want);
    if (skill === 'multiply') return makeMultiply(rng);
    return makeRound(rng);
};
