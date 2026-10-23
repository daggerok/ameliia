import { type L10n, type Problem, type Rng, type SkillId, type Visual, L, SKILL_NAME, fmt, int, pick, ruPlural } from './core';
import { longDivisionText, partialQuotientsText } from './division';
import { makeProblem } from './index';
import { roundTo } from './estimation';
import { placeParts, standardRows } from './strategies';
import { LOVE, WHY_MATH } from './messages';

export type Section =
    | { kind: 'story'; body: L10n }
    | { kind: 'idea'; title: L10n; body: L10n[] }
    | { kind: 'steps'; title: L10n; body: L10n[] }
    | { kind: 'example'; title: L10n; prompt: L10n; body: L10n[]; visual?: Visual }
    | { kind: 'warn'; title: L10n; body: L10n[] }
    | { kind: 'trick'; title: L10n; body: L10n[] }
    | { kind: 'life'; body: L10n }
    | { kind: 'love'; body: L10n }
    // a skill this one is built on, shown before its own theory: the whole lesson of that skill, folded
    | { kind: 'prereq'; title: L10n; sections: Section[] };

export type Theory = { skill: SkillId; title: L10n; sections: Section[] };

const T = {
    idea: L('The big idea', 'Главная идея'),
    how: L('How to do it', 'Как решать'),
    example: L('Let\'s try one together', 'Решим вместе'),
    example2: L('One more example', 'Ещё один пример'),
    bigger: L('Now with bigger numbers', 'Теперь с числами побольше'),
    yours: L('Your task, step by step', 'Твоя задача по шагам'),
    warn: L('Watch out!', 'Осторожно!'),
    trick: L('Memory trick', 'Запоминалка'),
    method2: L('Another way: break it apart', 'Другой способ: разбить на части'),
};

// Long division is the same method for 2, 3 and 4 digits, only the numbers grow
// the worked example has the size of the skill: 2-digit for div-2d, 3-digit for div-3d, 4-digit for div-4d
const longDivisionIdea = (rng: Rng, digits: 2 | 3 | 4): Section[] => {
    const d = int(rng, 3, 7);
    const q = int(rng, Math.max(11, Math.ceil(10 ** (digits - 1) / d)), Math.floor((10 ** digits - 1) / d));
    const n = d * q;
    return [
        { kind: 'idea', title: T.idea, body: [
            L('A big division is a chain of small divisions. We go one place at a time, from LEFT to RIGHT, the same way you read a book.',
                'Большое деление - это цепочка маленьких делений. Идём по одному разряду СЛЕВА НАПРАВО, как читаем книгу.'),
            L('The number we divide is the dividend, the number we divide by is the divisor, and the answer is the quotient.',
                'Число, которое делим, называется делимое, число, на которое делим, - делитель, а ответ - частное.'),
        ] },
        { kind: 'steps', title: T.how, body: [
            L('1. Divide: how many times does the divisor fit? Write that digit on top.', '1. Делим: сколько раз помещается делитель? Пишем цифру сверху.'),
            L('2. Multiply: the top digit × the divisor. Write it under.', '2. Умножаем: цифра сверху × делитель. Пишем под числом.'),
            L('3. Subtract: what is left must be SMALLER than the divisor.', '3. Вычитаем: остаток должен быть МЕНЬШЕ делителя.'),
            L('4. Bring down the next digit and start again from step 1.', '4. Сносим следующую цифру и снова начинаем с шага 1.'),
            L('5. Check: quotient × divisor (+ remainder) = dividend.', '5. Проверяем: частное × делитель (+ остаток) = делимое.'),
        ] },
        { kind: 'trick', title: T.trick, body: [
            L('Dad, Mom, Sister, Brother: Divide, Multiply, Subtract, Bring down. The Sister is you, Ameliia, and the Brother is little Martin!',
                'Папа, Мама, Сестра, Брат: делим, умножаем, вычитаем, сносим. Сестра - это ты, Амелия, а Брат - маленький Мартин!'),
            L('The family always comes in the same order, again and again, until no digits are left.', 'Семья всегда идёт в одном порядке, снова и снова, пока не кончатся цифры.'),
        ] },
        { kind: 'example', title: T.example, prompt: L(`${fmt(n, 'en')} ÷ ${d}`, `${fmt(n, 'ru')} ÷ ${d}`), body: longDivisionText(n, d), visual: { kind: 'longdiv', dividend: n, divisor: d } },
    ];
};

const breakApart = (rng: Rng, big: boolean): Section => {
    const d = int(rng, 3, 8);
    const q = big ? int(rng, 112, Math.floor(999 / d)) : int(rng, 11, Math.floor(99 / d));
    const n = d * q;
    return { kind: 'example', title: T.method2, prompt: L(`${fmt(n, 'en')} ÷ ${d}: take away easy chunks of ${d}`, `${fmt(n, 'ru')} ÷ ${d}: отнимаем удобные части по ${d}`), body: [
        L('Use place value: take away the biggest easy chunk first (100 or 10 times the divisor), then smaller chunks, until less than the divisor is left. Then add up how many times you took the divisor.', 'Используем разряды: сначала отнимаем самую большую удобную часть (делитель × 100 или × 10), потом поменьше, пока не останется меньше делителя. Потом складываем, сколько раз взяли делитель.'),
        ...partialQuotientsText(n, d),
    ] };
};

const warnLong: Section = { kind: 'warn', title: T.warn, body: [
    L('Write a digit in the quotient after EVERY bring-down. If the divisor does not fit, that digit is 0.', 'После КАЖДОГО сноса пишем цифру в частное. Если делитель не помещается, эта цифра 0.'),
    L('If what is left after subtracting is the same as the divisor or bigger, your top digit is too small. Try one more.', 'Если после вычитания осталось столько же, сколько делитель, или больше, цифра сверху слишком маленькая. Попробуй на одну больше.'),
    L('Do not divide the whole big number at once. Only the part you are working on.', 'Не дели сразу всё большое число. Только ту часть, с которой сейчас работаешь.'),
] };

// ---------- multiplication strategies (the anchor chart: Area Model, Distributive Property, Partial Products, Standard Algorithm) ----------

// a one-digit times a 3-digit number without zeros, so every strategy has three real parts
const chartPair = (rng: Rng) => {
    const m = int(rng, 3, 9);
    const a = 100 * int(rng, 1, 9) + 10 * int(rng, 1, 9) + int(rng, 1, 9);
    return { m, a, parts: placeParts(a) };
};

const fourWays = (m: number, a: number): Section => {
    const parts = placeParts(a);
    const prods = parts.map(p => m * p);
    const rows = standardRows(m, a);
    return {
        kind: 'idea', title: L(`Four roads, one answer: ${m} × ${a}`, `Четыре дороги, один ответ: ${m} × ${a}`),
        body: [
            L(`Area Model: boxes ${parts.map(p => `${m} × ${p} = ${fmt(m * p, 'en')}`).join(', ')}; ${prods.map(p => fmt(p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}.`,
                `Модель площади: клетки ${parts.map(p => `${m} × ${p} = ${fmt(m * p, 'ru')}`).join(', ')}; ${prods.map(p => fmt(p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}.`),
            L(`Distributive Property: ${m} × ${a} = ${m} × (${parts.join(' + ')}) = ${parts.map(p => `(${m} × ${p})`).join(' + ')} = ${prods.map(p => fmt(p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}.`,
                `Распределительное свойство: ${m} × ${a} = ${m} × (${parts.join(' + ')}) = ${parts.map(p => `(${m} × ${p})`).join(' + ')} = ${prods.map(p => fmt(p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}.`),
            L(`Partial Products: ${prods.map((p, i) => `${fmt(p, 'en')} (${m} × ${parts[i]})`).join(', ')}, added: ${fmt(m * a, 'en')}.`,
                `Частичные произведения: ${prods.map((p, i) => `${fmt(p, 'ru')} (${m} × ${parts[i]})`).join(', ')}, сумма: ${fmt(m * a, 'ru')}.`),
            L(`Standard Algorithm (in the US): start in the ones place: ${rows.map(r => r.carryIn ? `${m} × ${r.d} = ${r.prod}, ${r.prod} + ${r.carryIn} = ${r.sum}` : `${m} × ${r.d} = ${r.prod}`).join('; ')}. Answer ${fmt(m * a, 'en')}.`,
                `Умножение столбиком: начинаем с единиц: ${rows.map(r => r.carryIn ? `${m} × ${r.d} = ${r.prod}, ${r.prod} + ${r.carryIn} = ${r.sum}` : `${m} × ${r.d} = ${r.prod}`).join('; ')}. Ответ ${fmt(m * a, 'ru')}.`),
            L('Every strategy is the same idea: break the big number into place values, multiply each part, put the parts back together.', 'Все способы - одна идея: разбить большое число по разрядам, умножить каждую часть и собрать части обратно.'),
        ],
    };
};

const zerosWarn: Section = { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
    L('A zero digit gives a zero part: 804 = 800 + 4, because 0 tens is nothing. 6 × 0 = 0, so you may skip that box or line.', 'Цифра 0 даёт пустую часть: 804 = 800 + 4, ведь 0 десятков - это ничего. 6 × 0 = 0, эту клетку или строку можно пропустить.'),
    L('Keep the zeros: 6 × 80 = 480, not 48. 6 × 100 = 600, not 6.', 'Не теряй нули: 6 × 80 = 480, а не 48. 6 × 100 = 600, а не 6.'),
    L('A quick way: 6 × 80 is 6 × 8 = 48, then write the zero back: 480.', 'Быстрый способ: 6 × 80 - это 6 × 8 = 48, потом дописываем ноль: 480.'),
] };

const strategyBuilders: Record<'mult-area' | 'mult-dist' | 'mult-partial' | 'mult-standard', (rng: Rng) => { hook: L10n[]; sections: Section[] }> = {
    'mult-area': rng => {
        const { m, a, parts } = chartPair(rng);
        return {
            hook: [
                L('Ameliia loves painting rectangles. The Area Model is a rectangle cut into boxes: each box is one easy multiplication!', 'Амелия любит рисовать прямоугольники. Модель площади - это прямоугольник, разрезанный на клетки: каждая клетка - одно лёгкое умножение!'),
                L(`Grandma Sveta's garden is ${m} rows by ${a} flowers. Too big to count? Cut it into pieces by hundreds, tens and ones.`, `Огород бабушки Светы - ${m} грядок по ${a} цветов. Слишком много, чтобы считать? Разрежем на части: сотни, десятки и единицы.`),
            ],
            sections: [
                { kind: 'steps', title: L('How to do it', 'Как решать'), body: [
                    L(`1. Break ${a} into place values and write them on top: ${parts.join(' + ')}.`, `1. Разбей ${a} по разрядам и запиши сверху: ${parts.join(' + ')}.`),
                    L(`2. Write ${m} on the left side.`, `2. Слева запиши ${m}.`),
                    L('3. In every box multiply the number on the left by the number on top.', '3. В каждой клетке умножь число слева на число сверху.'),
                    L('4. Add all the boxes together.', '4. Сложи все клетки.'),
                ] },
                { kind: 'example', title: L('Let\'s try one together', 'Решим вместе'), prompt: L(`${m} × ${a}`, `${m} × ${a}`),
                    body: [...parts.map(p => L(`${m} × ${p} = ${fmt(m * p, 'en')}`, `${m} × ${p} = ${fmt(m * p, 'ru')}`)), L(`${parts.map(p => fmt(m * p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}`, `${parts.map(p => fmt(m * p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}`)],
                    visual: { kind: 'area', a, b: m } },
                { kind: 'trick', title: L('Two-digit times two-digit', 'Двузначное на двузначное'), body: [
                    L('23 × 45: put 20 + 3 on the left and 40 + 5 on top. Four boxes: 20 × 40 = 800, 20 × 5 = 100, 3 × 40 = 120, 3 × 5 = 15. 800 + 100 + 120 + 15 = 1,035.',
                        '23 × 45: слева 20 + 3, сверху 40 + 5. Четыре клетки: 20 × 40 = 800, 20 × 5 = 100, 3 × 40 = 120, 3 × 5 = 15. 800 + 100 + 120 + 15 = 1 035.'),
                ] },
                zerosWarn,
                fourWays(m, a),
            ],
        };
    },
    'mult-dist': rng => {
        const { m, a, parts } = chartPair(rng);
        return {
            hook: [
                L(`${m} friends each get ${a} stickers. How many in all? The Distributive Property says: give out the hundreds, then the tens, then the ones, and add.`, `Каждый из ${m} друзей получает по ${a} ${ruPlural(a, 'наклейке', 'наклейки', 'наклеек')}. Сколько всего? Распределительное свойство говорит: раздай сотни, потом десятки, потом единицы и сложи.`),
                L('"Distribute" means "hand out to everyone". The number outside the brackets is handed out to every part inside.', '«Распределить» значит «раздать всем». Число перед скобками раздаётся каждой части в скобках.'),
            ],
            sections: [
                { kind: 'steps', title: L('How to do it', 'Как решать'), body: [
                    L(`1. Write the big number as a sum of place values in brackets: ${m} × (${parts.join(' + ')}).`, `1. Запиши большое число суммой разрядов в скобках: ${m} × (${parts.join(' + ')}).`),
                    L(`2. Hand ${m} to every part: ${parts.map(p => `(${m} × ${p})`).join(' + ')}.`, `2. Раздай ${m} каждой части: ${parts.map(p => `(${m} × ${p})`).join(' + ')}.`),
                    L(`3. Multiply each part: ${parts.map(p => fmt(m * p, 'en')).join(' + ')}.`, `3. Умножь каждую часть: ${parts.map(p => fmt(m * p, 'ru')).join(' + ')}.`),
                    L(`4. Add: ${fmt(m * a, 'en')}.`, `4. Сложи: ${fmt(m * a, 'ru')}.`),
                ] },
                { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
                    L('A zero digit gives no part: 804 = 800 + 4, so 6 × 804 = (6 × 800) + (6 × 4).', 'Цифра 0 не даёт части: 804 = 800 + 4, значит 6 × 804 = (6 × 800) + (6 × 4).'),
                    L(`Multiply EVERY part, not only the first one: ${m} × (${parts.join(' + ')}) is not ${m} × ${parts[0]} + ${parts.slice(1).join(' + ')}.`, `Умножай КАЖДУЮ часть, а не только первую: ${m} × (${parts.join(' + ')}) - это не ${m} × ${parts[0]} + ${parts.slice(1).join(' + ')}.`),
                    L('Keep the zeros: 6 × 80 = 480, not 48.', 'Не теряй нули: 6 × 80 = 480, а не 48.'),
                ] },
                fourWays(m, a),
            ],
        };
    },
    'mult-partial': rng => {
        const { m, a, parts } = chartPair(rng);
        return {
            hook: [
                L('Partial Products is the Area Model written in a column: one line for every box, then add the lines.', 'Частичные произведения - это модель площади, записанная столбиком: по строке на каждую клетку, потом складываем строки.'),
                L('Like packing for Florida: socks in one bag, shirts in another, shoes in a third. At the end everything goes into one suitcase!', 'Как сборы во Флориду: носки в один пакет, футболки в другой, обувь в третий. А в конце всё в один чемодан!'),
            ],
            sections: [
                { kind: 'steps', title: L('How to do it', 'Как решать'), body: [
                    L(`1. Write ${a} on top and × ${m} under it.`, `1. Запиши ${a} сверху и × ${m} под ним.`),
                    ...parts.map((p, i) => L(`${i + 2}. ${m} × ${p} = ${fmt(m * p, 'en')}: write it on its own line.`, `${i + 2}. ${m} × ${p} = ${fmt(m * p, 'ru')}: запиши на отдельной строке.`)),
                    L(`${parts.length + 2}. Add the lines: ${parts.map(p => fmt(m * p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}.`, `${parts.length + 2}. Сложи строки: ${parts.map(p => fmt(m * p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}.`),
                ] },
                { kind: 'trick', title: L('Keep the columns straight', 'Ровные столбики'), body: [
                    L('Write every partial product so that ones are under ones, tens under tens, hundreds under hundreds. The notepad has grid paper for that!', 'Пиши частичные произведения так, чтобы единицы были под единицами, десятки под десятками, сотни под сотнями. В блокноте бумага в клетку, это удобно!'),
                ] },
                zerosWarn,
                fourWays(m, a),
            ],
        };
    },
    'mult-standard': rng => {
        // the worked example always carries, that is the part to learn
        let { m, a } = chartPair(rng);
        while (!standardRows(m, a).some(r => r.carryIn > 0)) ({ m, a } = chartPair(rng));
        const rows = standardRows(m, a);
        return {
            hook: [
                L('The Standard Algorithm is the fastest road. The secret: start in the ONES place and never forget the carried number.', 'Умножение столбиком - самая быстрая дорога. Секрет: начинай с разряда ЕДИНИЦ и не забывай перенесённое число.'),
                L('Carrying is like Martin\'s blocks: 10 ones make a ten, so they climb up to the tens tower.', 'Перенос - как кубики Мартина: 10 единиц складываются в десяток и переходят в башню десятков.'),
            ],
            sections: [
                { kind: 'steps', title: L('How to do it', 'Как решать'), body: [
                    L('1. Multiply the ones digit. Write the ones of the answer, carry the tens above the next digit (like the small 4 1 above 182 on the chart).', '1. Умножь цифру единиц. Запиши единицы ответа, а десятки перенеси над следующей цифрой (как маленькие 4 1 над 182 на плакате).'),
                    L('2. Multiply the tens digit, THEN add the carried number.', '2. Умножь цифру десятков, ПОТОМ прибавь перенесённое число.'),
                    L('3. Keep going to the left. At the last digit write the whole number.', '3. Двигайся влево. На последней цифре пиши всё число целиком.'),
                ] },
                { kind: 'example', title: L('Let\'s try one together', 'Решим вместе'), prompt: L(`${a} × ${m}`, `${a} × ${m}`), body: rows.map((r, i) => {
                    const head = r.carryIn ? `${m} × ${r.d} = ${r.prod}, ${r.prod} + ${r.carryIn} = ${r.sum}` : `${m} × ${r.d} = ${r.prod}`;
                    return i === rows.length - 1 ? L(`${head}: write ${r.sum}. Answer ${fmt(m * a, 'en')}.`, `${head}: пишем ${r.sum}. Ответ ${fmt(m * a, 'ru')}.`)
                        : L(`${head}: write ${r.write}${r.carryOut ? `, carry ${r.carryOut}` : ''}.`, `${head}: пишем ${r.write}${r.carryOut ? `, ${r.carryOut} переносим` : ''}.`);
                }) },
                { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
                    L('Multiply first, then add the carry. 6 × 8 + 1 is 49, not 6 × 9.', 'Сначала умножай, потом прибавляй перенос. 6 × 8 + 1 = 49, а не 6 × 9.'),
                    L('Cross out a carried number once you used it, so you do not add it twice.', 'Зачёркивай перенесённое число, когда использовала его, чтобы не прибавить дважды.'),
                    L('Nothing to carry? The carry is 0. A 0 digit: 6 × 0 = 0, then add the carry.', 'Нечего переносить? Перенос 0. Цифра 0: 6 × 0 = 0, потом прибавь перенос.'),
                ] },
                fourWays(m, a),
            ],
        };
    },
};

// ---------- homework Topic 3: comparison and word problems with extra information ----------

const wordBuilders: Record<'compare' | 'word-steps', (rng: Rng) => { hook: L10n[]; sections: Section[] }> = {
    'compare': rng => {
        const b = int(rng, 6, 9), k = 10, big = b * k;
        return {
            hook: [
                L(`When Mia was born she weighed ${b} pounds. At 10 years old she weighed 10 times as much. Two different questions hide here: "how much did she weigh?" and "how much MORE did she weigh?"`, `Когда Мия родилась, она весила ${b} ${ruPlural(b, 'фунт', 'фунта', 'фунтов')}. В 10 лет она весила в 10 раз больше. Здесь прячутся два разных вопроса: «сколько она весила?» и «на сколько БОЛЬШЕ она весила?»`),
                L('"Times as much" and "how much more" sound alike, but they are different math. Today you learn to tell them apart like a detective.', '«В … раз больше» и «на … больше» звучат похоже, но это разная математика. Сегодня научимся различать их, как детектив.'),
            ],
            sections: [
                { kind: 'idea', title: L('Three kinds of comparing', 'Три вида сравнения'), body: [
                    L(`"${k} times as much as ${b}": equal groups, MULTIPLY. w = ${b} × ${k} = ${big}.`, `«В ${k} раз больше, чем ${b}»: равные группы, УМНОЖАЕМ. w = ${b} × ${k} = ${big}.`),
                    L(`"How much more is ${big} than ${b}?": a difference, SUBTRACT. d = ${big} − ${b} = ${big - b}.`, `«На сколько ${big} больше, чем ${b}?»: разница, ВЫЧИТАЕМ. d = ${big} − ${b} = ${big - b}.`),
                    L(`"How many times as much is ${big} as ${b}?": how many groups fit, DIVIDE. ${big} ÷ ${b} = ${k}.`, `«Во сколько раз ${big} больше, чем ${b}?»: сколько раз помещается, ДЕЛИМ. ${big} ÷ ${b} = ${k}.`),
                ] },
                { kind: 'example', title: L('The bar diagram', 'Столбчатая модель'), prompt: L(`Mia: ${b} pounds at birth, 10 times as much at 10`, `Мия: ${b} ${ruPlural(b, 'фунт', 'фунта', 'фунтов')} при рождении, в 10 раз больше в 10 лет`), body: [
                    L(`Top bar: one box of ${b}. Bottom bar: ${k} boxes of ${b}, the whole bar is w.`, `Верхняя полоска: одна клетка ${b}. Нижняя: ${k} клеток по ${b}, вся полоска - это w.`),
                    L(`w = ${b} × ${k} = ${big} pounds.`, `w = ${b} × ${k} = ${big} ${ruPlural(big, 'фунт', 'фунта', 'фунтов')}.`),
                    L(`The part of the bottom bar that sticks out past the top bar is d: d = ${big} − ${b} = ${big - b} pounds.`, `Часть нижней полоски, которая выступает за верхнюю, - это d: d = ${big} − ${b} = ${big - b} ${ruPlural(big - b, 'фунт', 'фунта', 'фунтов')}.`),
                ], visual: { kind: 'bars', rows: [{ label: L('at birth', 'при рождении'), boxes: 1, value: String(b) }, { label: L('at 10', 'в 10 лет'), boxes: k, value: String(b) }], braces: [{ row: 1, label: L(`w = ${k} × ${b}`, `w = ${k} × ${b}`) }, { row: 1, from: 1, label: L(`d = w − ${b}`, `d = w − ${b}`) }] } },
                { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
                    L(`"How much more" never uses ×. Writing ${big} × d = ${b} mixes two questions: the right equation is d = ${big} − ${b}.`, `«На сколько больше» никогда не решается через ×. Запись ${big} × d = ${b} путает два вопроса: правильно d = ${big} − ${b}.`),
                    L('Use the letter the problem gives you: w for weight, d for difference.', 'Используй букву из задачи: w - вес, d - разница.'),
                    L('Check the difference by adding: smaller + difference = bigger.', 'Проверяй разницу сложением: меньшее + разница = большее.'),
                ] },
                { kind: 'trick', title: L('Memory trick', 'Запоминалка'), body: [
                    L('TIMES makes a train of equal boxes. MORE is the piece that sticks out.', 'РАЗЫ - это поезд из одинаковых вагончиков. НА СКОЛЬКО - это кусочек, который торчит.'),
                ] },
            ],
        };
    },
    'word-steps': rng => {
        const c1 = int(rng, 1102, 1890), p1 = 4, c2 = int(rng, 1102, 1890), p2 = 3;
        return {
            hook: [
                L('A word problem is like a little mystery story. Some clues are important, some are there to trick you. A good detective crosses out the extra clues.', 'Текстовая задача - как маленький детектив. Одни улики важные, другие нужны, чтобы запутать. Хороший сыщик вычёркивает лишние улики.'),
                L('Ameliia already did something smart in her homework: she wrote "pencils = extra, not needed". That is exactly what good problem solvers do!', 'В домашке Амелия уже сделала умную вещь: написала «карандаши - лишнее, не нужно». Именно так и поступают хорошие решатели задач!'),
            ],
            sections: [
                { kind: 'steps', title: L('Five steps for a word problem', 'Пять шагов для текстовой задачи'), body: [
                    L('1. Underline the question. What exactly do we need to find?', '1. Подчеркни вопрос. Что именно нужно найти?'),
                    L('2. Circle the numbers that talk about the same thing as the question. Cross out the extra ones.', '2. Обведи числа, которые говорят о том же, о чём вопрос. Лишние вычеркни.'),
                    L('3. Match each number with its label: how many of WHAT, how much for WHAT.', '3. Свяжи каждое число с его подписью: сколько ЧЕГО, сколько стоит ЧТО.'),
                    L('4. Write an equation with a letter and solve it. Do not forget the unit ($, pounds, minutes).', '4. Запиши уравнение с буквой и реши его. Не забудь единицу ($, фунты, минуты).'),
                    L('5. Check that the answer is reasonable with an estimate.', '5. Проверь прикидкой, что ответ правдоподобный.'),
                ] },
                { kind: 'example', title: L('Let\'s try one together', 'Решим вместе'), prompt: L(`A bookstore ordered ${fmt(c1, 'en')} packs of pens and ${fmt(c2, 'en')} packs of pencils. Pens cost ${p1} a pack, pencils ${p2} a pack. How much did it spend on pens?`, `Книжный магазин заказал ${fmt(c1, 'ru')} ${ruPlural(c1, 'пачку', 'пачки', 'пачек')} ручек и ${fmt(c2, 'ru')} ${ruPlural(c2, 'пачку', 'пачки', 'пачек')} карандашей. Ручки стоят ${p1} за пачку, карандаши - ${p2}. Сколько потратили на ручки?`), body: [
                    L('The question is about PENS. Pencils are extra: cross out the pencil numbers.', 'Вопрос про РУЧКИ. Карандаши лишние: вычёркиваем их числа.'),
                    L(`Pens: ${fmt(c1, 'en')} packs, ${p1} a pack. Careful: ${fmt(c2, 'en')} belongs to the pencils, not to the pens!`, `Ручки: ${fmt(c1, 'ru')} пачек, ${p1} за пачку. Внимание: ${fmt(c2, 'ru')} относится к карандашам, а не к ручкам!`),
                    L(`c = ${fmt(c1, 'en')} × ${p1} = ${fmt(c1 * p1, 'en')}, so ${fmt(c1 * p1, 'en')}.`, `c = ${fmt(c1, 'ru')} × ${p1} = ${fmt(c1 * p1, 'ru')}, то есть ${fmt(c1 * p1, 'ru')}.`),
                    L(`Reasonable? ${fmt(c1, 'en')} is about ${fmt(Math.round(c1 / 100) * 100, 'en')}, ${fmt(Math.round(c1 / 100) * 100, 'en')} × ${p1} = ${fmt(Math.round(c1 / 100) * 100 * p1, 'en')}. Close ✓`, `Правдоподобно? ${fmt(c1, 'ru')} - примерно ${fmt(Math.round(c1 / 100) * 100, 'ru')}, ${fmt(Math.round(c1 / 100) * 100, 'ru')} × ${p1} = ${fmt(Math.round(c1 / 100) * 100 * p1, 'ru')}. Близко ✓`),
                ] },
                { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
                    L('Do not swap the numbers: the number of pens goes with the price of pens.', 'Не перепутай числа: количество ручек идёт с ценой ручек.'),
                    L('"It is reasonable because I computed accurately" is not a reason. A reason is an estimate: round, multiply, compare.', '«Правдоподобно, потому что я посчитала аккуратно» - это не объяснение. Объяснение - это прикидка: округли, умножь, сравни.'),
                    L('Write the unit in the answer: $6,112, not just 6,112.', 'Пиши единицу в ответе: $6 112, а не просто 6 112.'),
                ] },
                { kind: 'trick', title: L('Have you seen a problem like this before?', 'Встречалась ли тебе такая задача?'), body: [
                    L('Yes! It is a "number of things × price of one thing" problem, the same as 6 × 182: multiply a big number by a one-digit number with any strategy you like.', 'Да! Это задача «количество × цена одной штуки», такая же, как 6 × 182: умножаем большое число на однозначное любым способом.'),
                    L('Place-value blocks would take too long for 4-digit numbers: partial products or the standard algorithm are faster.', 'Кубики для разрядов слишком долго рисовать для четырёхзначных чисел: частичные произведения или столбик быстрее.'),
                ] },
            ],
        };
    },
};


// ---------- Topic 3 test: multiples of 10, mental math, matching expressions, word problems; Science Chapter 2: forces ----------

const topic3Builders: Record<'mult-tens' | 'mult-mental' | 'mult-expr' | 'mult-word' | 'forces', (rng: Rng) => { hook: L10n[]; sections: Section[] }> = {
    'mult-tens': rng => {
        const m = int(rng, 2, 9), d = int(rng, 2, 9), f = m * d;
        return {
            hook: [
                L(`Grandma Sveta buys ${m} boxes of beads with ${d * 100} beads in each box. ${m} × ${d * 100} looks big, but you already know ${m} × ${d}. The zeros just ride along!`, `Бабушка Света покупает ${m} ${ruPlural(m, 'коробку', 'коробки', 'коробок')} бусин, в каждой по ${d * 100}. ${m} × ${d * 100} выглядит большим, но ты уже знаешь ${m} × ${d}. Нули просто едут следом!`),
                L(`${m} × ${d} = ${f}. That one fact gives you ${m} × ${d * 10}, ${m} × ${fmt(d * 100, 'en')} and ${m} × ${fmt(d * 1000, 'en')} for free.`, `${m} × ${d} = ${f}. Этот один пример бесплатно даёт ${m} × ${d * 10}, ${m} × ${fmt(d * 100, 'ru')} и ${m} × ${fmt(d * 1000, 'ru')}.`),
                L(`The library of a magic castle has ${m} rooms with ${d * 100} spell books in each. A wizard does not count them one by one: ${m} × ${d} = ${f}, so ${m} × ${d * 100} = ${fmt(f * 100, 'en')}.`, `В библиотеке волшебного замка ${m} ${ruPlural(m, 'зал', 'зала', 'залов')}, в каждом ${d * 100} книг заклинаний. Волшебник не считает их по одной: ${m} × ${d} = ${f}, значит ${m} × ${d * 100} = ${fmt(f * 100, 'ru')}.`),
            ],
            sections: [
                { kind: 'idea', title: L('The big idea', 'Главная идея'), body: [
                    L(`${m} × ${d * 10} means ${m} × ${d} tens. ${m} × ${d} = ${f}, and ${f} tens is ${fmt(f * 10, 'en')}.`, `${m} × ${d * 10} - это ${m} × ${d} десятков. ${m} × ${d} = ${f}, а ${f} десятков - это ${fmt(f * 10, 'ru')}.`),
                    L(`${m} × ${fmt(d * 100, 'en')} means ${m} × ${d} hundreds: ${f} hundreds is ${fmt(f * 100, 'en')}.`, `${m} × ${fmt(d * 100, 'ru')} - это ${m} × ${d} сотен: ${f} сотен - это ${fmt(f * 100, 'ru')}.`),
                    L(`${m} × ${fmt(d * 1000, 'en')} means ${m} × ${d} thousands: ${f} thousands is ${fmt(f * 1000, 'en')}.`, `${m} × ${fmt(d * 1000, 'ru')} - это ${m} × ${d} тысяч: ${f} тысяч - это ${fmt(f * 1000, 'ru')}.`),
                ] },
                { kind: 'steps', title: L('How to do it', 'Как решать'), body: [
                    L('1. Hide the zeros and use the basic fact.', '1. Спрячь нули и возьми табличный пример.'),
                    L('2. Count the zeros at the end of the factors.', '2. Посчитай нули в конце множителей.'),
                    L('3. Write that many zeros after the basic fact answer.', '3. Допиши столько же нулей после ответа табличного примера.'),
                ] },
                { kind: 'example', title: L('The pattern', 'Закономерность'), prompt: L(`${m} × ${d}, ${m} × ${d * 10}, ${m} × ${fmt(d * 100, 'en')}, ${m} × ${fmt(d * 1000, 'en')}`, `${m} × ${d}, ${m} × ${d * 10}, ${m} × ${fmt(d * 100, 'ru')}, ${m} × ${fmt(d * 1000, 'ru')}`),
                    body: [1, 10, 100, 1000].map(z => L(`${m} × ${fmt(d * z, 'en')} = ${fmt(f * z, 'en')}`, `${m} × ${fmt(d * z, 'ru')} = ${fmt(f * z, 'ru')}`)) },
                { kind: 'warn', title: L('Watch out: the extra zero', 'Осторожно: лишний ноль'), body: [
                    L('When the basic fact already ends in zero, the answer has one more zero. 5 × 4 = 20, so 5 × 4,000 = 20,000: four zeros, not three!', 'Если табличный пример уже заканчивается нулём, в ответе будет на один ноль больше. 5 × 4 = 20, значит 5 × 4 000 = 20 000: четыре нуля, а не три!'),
                    L('6 × 50 = 300, not 30. 8 × 500 = 4,000, not 400.', '6 × 50 = 300, а не 30. 8 × 500 = 4 000, а не 400.'),
                ] },
                { kind: 'trick', title: L('Use it to estimate', 'Пригодится для прикидки'), body: [
                    L('9 × 1,993 is about 9 × 2,000 = 18,000. Round a 3-digit number to the nearest hundred and a 4-digit number to the nearest thousand, then multiply with zeros.', '9 × 1 993 - это примерно 9 × 2 000 = 18 000. Трёхзначное число округляй до сотен, четырёхзначное - до тысяч, потом умножай с нулями.'),
                ] },
            ],
        };
    },
    'mult-mental': rng => {
        const m = int(rng, 3, 9), R = 10 * int(rng, 3, 9), k = int(rng, 1, 3), a = R - k;
        return {
            hook: [
                L(`At the store a toy costs $${a}. Dad buys ${m} of them and says the total in two seconds. His secret: $${a} is almost $${R}!`, `В магазине игрушка стоит $${a}. Папа покупает ${m} штук и за две секунды называет сумму. Его секрет: $${a} - это почти $${R}!`),
                L('Mental math is a set of shortcuts. You move numbers around or use a round number, and the hard problem turns easy.', 'Устный счёт - это набор коротких путей. Переставляешь числа или берёшь круглое число, и трудный пример становится лёгким.'),
            ],
            sections: [
                { kind: 'idea', title: L('Two shortcuts', 'Два коротких пути'), body: [
                    L('Commutative and Associative Properties: you may swap factors and move the brackets. 8 × 50 = (4 × 2) × 50 = 4 × (2 × 50) = 4 × 100 = 400.', 'Переместительное и сочетательное свойства: множители можно менять местами и переставлять скобки. 8 × 50 = (4 × 2) × 50 = 4 × (2 × 50) = 4 × 100 = 400.'),
                    L('Compensation: use a round number close to the real one, then fix the difference. 9 × 67: 9 × 70 = 630, 9 × 3 = 27, 630 − 27 = 603.', 'Округление с поправкой: возьми круглое число рядом с настоящим, потом поправь разницу. 9 × 67: 9 × 70 = 630, 9 × 3 = 27, 630 − 27 = 603.'),
                ] },
                { kind: 'steps', title: L('Compensation step by step', 'Поправка по шагам'), body: [
                    L(`1. Think: ${a} = ${R} − ${k}.`, `1. Подумай: ${a} = ${R} − ${k}.`),
                    L(`2. Multiply the round number: ${m} × ${R} = ${fmt(m * R, 'en')}.`, `2. Умножь круглое число: ${m} × ${R} = ${fmt(m * R, 'ru')}.`),
                    L(`3. You took ${k} too many ${m} times: ${m} × ${k} = ${m * k}.`, `3. Ты взяла по ${k} лишних ${m} ${ruPlural(m, 'раз', 'раза', 'раз')}: ${m} × ${k} = ${m * k}.`),
                    L(`4. Subtract: ${fmt(m * R, 'en')} − ${m * k} = ${fmt(m * a, 'en')}.`, `4. Вычти: ${fmt(m * R, 'ru')} − ${m * k} = ${fmt(m * a, 'ru')}.`),
                ] },
                { kind: 'example', title: L('Bigger numbers work the same', 'С большими числами так же'), prompt: L('6 × 295 and 4 × 198', '6 × 295 и 4 × 198'), body: [
                    L('6 × 295: 6 × 300 = 1,800, 6 × 5 = 30, 1,800 − 30 = 1,770.', '6 × 295: 6 × 300 = 1 800, 6 × 5 = 30, 1 800 − 30 = 1 770.'),
                    L('4 × 198: 4 × 200 = 800, 4 × 2 = 8, 800 − 8 = 792.', '4 × 198: 4 × 200 = 800, 4 × 2 = 8, 800 − 8 = 792.'),
                    L('7 × 52 rounds DOWN: 7 × 50 = 350, 7 × 2 = 14, 350 + 14 = 364. Rounded down? Add back.', '7 × 52 округляем ВНИЗ: 7 × 50 = 350, 7 × 2 = 14, 350 + 14 = 364. Округлила вниз? Прибавь.'),
                ] },
                { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
                    L(`Subtract ${m} × ${k}, not just ${k}: every one of the ${m} groups got ${k} extra.`, `Вычитай ${m} × ${k}, а не просто ${k}: каждая из ${m} групп получила по ${k} лишних.`),
                    L('Rounded up: subtract. Rounded down: add.', 'Округлила вверх - вычитай. Округлила вниз - прибавляй.'),
                ] },
                { kind: 'trick', title: L('Friendly pairs', 'Дружные пары'), body: [
                    L('2 × 5 = 10, 2 × 50 = 100, 4 × 25 = 100, 2 × 500 = 1,000, 4 × 250 = 1,000. Spot a pair, multiply it first.', '2 × 5 = 10, 2 × 50 = 100, 4 × 25 = 100, 2 × 500 = 1 000, 4 × 250 = 1 000. Нашла пару - умножай её первой.'),
                ] },
            ],
        };
    },
    'mult-expr': rng => {
        const m = int(rng, 3, 9), a = 1000 + 100 * int(rng, 1, 9) + 10 * int(rng, 1, 9) + int(rng, 1, 9), parts = placeParts(a);
        const prods = parts.map(p => m * p);
        return {
            hook: [
                L('On the test some questions say "Select all that apply". That means there can be MORE than one right answer, so check every box, one by one.', 'В тесте бывают вопросы «Выбери все подходящие». Значит, верных ответов может быть БОЛЬШЕ одного, поэтому проверь каждый вариант по очереди.'),
                L('Expressions are like costumes: (8 × 400) + (8 × 90) + (8 × 3) and 493 × 8 look different, but underneath they are the same number.', 'Выражения - как костюмы: (8 × 400) + (8 × 90) + (8 × 3) и 493 × 8 выглядят по-разному, но внутри одно и то же число.'),
            ],
            sections: [
                { kind: 'idea', title: L(`Ways to write ${m} × ${fmt(a, 'en')}`, `Способы записать ${m} × ${fmt(a, 'ru')}`), body: [
                    L(`Expanded form in brackets: ${m} × (${parts.map(p => fmt(p, 'en')).join(' + ')}).`, `Разряды в скобках: ${m} × (${parts.map(p => fmt(p, 'ru')).join(' + ')}).`),
                    L(`Distributive Property: ${parts.map(p => `(${m} × ${fmt(p, 'en')})`).join(' + ')} = ${prods.map(p => fmt(p, 'en')).join(' + ')} = ${fmt(m * a, 'en')}.`, `Распределительное свойство: ${parts.map(p => `(${m} × ${fmt(p, 'ru')})`).join(' + ')} = ${prods.map(p => fmt(p, 'ru')).join(' + ')} = ${fmt(m * a, 'ru')}.`),
                    L(`Swapped factors: ${fmt(a, 'en')} × ${m}.`, `Множители наоборот: ${fmt(a, 'ru')} × ${m}.`),
                    L(`The partial products are ${prods.map(p => fmt(p, 'en')).join(', ')}: one for every place.`, `Частичные произведения: ${prods.map(p => fmt(p, 'ru')).join(', ')} - по одному на каждый разряд.`),
                ] },
                { kind: 'steps', title: L('Select all that apply', 'Выбери все подходящие'), body: [
                    L('1. Read every option, not only until you find one right answer.', '1. Прочитай каждый вариант, а не только до первого верного.'),
                    L('2. Check that the brackets hold the WHOLE number, with the right place values.', '2. Проверь, что в скобках ВСЁ число и правильные разряды.'),
                    L('3. Check that EVERY part is multiplied.', '3. Проверь, что умножена КАЖДАЯ часть.'),
                    L('4. Not sure? Find the value of the option and compare.', '4. Сомневаешься? Посчитай значение варианта и сравни.'),
                ] },
                { kind: 'warn', title: L('Traps from the test', 'Ловушки из теста'), body: [
                    L('Digits are not place values: 5 × 617 is (5 × 600) + (5 × 10) + (5 × 7), not (5 × 6) + (5 × 1) + (5 × 7).', 'Цифры - это не разряды: 5 × 617 - это (5 × 600) + (5 × 10) + (5 × 7), а не (5 × 6) + (5 × 1) + (5 × 7).'),
                    L('Multiply every part: (8 × 400) + 93 is not 8 × 493.', 'Умножай каждую часть: (8 × 400) + 93 - это не 8 × 493.'),
                    L('Add the parts, do not multiply them: (6 × 100) + (4 × 10) = 640, but (6 × 100) × (4 × 10) = 24,000.', 'Части складывают, а не перемножают: (6 × 100) + (4 × 10) = 640, а (6 × 100) × (4 × 10) = 24 000.'),
                    L('Compensation must take away the right amount: 8 × 493 = (8 × 500) − (8 × 7), not (8 × 500) − (8 × 93).', 'Поправка должна отнять правильное число: 8 × 493 = (8 × 500) − (8 × 7), а не (8 × 500) − (8 × 93).'),
                ] },
                { kind: 'trick', title: L('Read it backwards', 'Читай наоборот'), body: [
                    L('(400 × 3) + (36 × 3): both parts are multiplied by 3, so it is (400 + 36) × 3 = 436 × 3.', '(400 × 3) + (36 × 3): обе части умножены на 3, значит это (400 + 36) × 3 = 436 × 3.'),
                ] },
            ],
        };
    },
    'mult-word': rng => {
        const b = int(rng, 21, 49), k = int(rng, 3, 6), big = b * k;
        return {
            hook: [
                L(`Mia has ${b} dolls. A toy store's warehouse has ${k} times as many. A bar diagram turns those words into a picture, and the picture tells you to multiply.`, `У Мии ${b} ${ruPlural(b, 'кукла', 'куклы', 'кукол')}. На складе магазина в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше. Схема из полосок превращает слова в картинку, а картинка подсказывает: умножай.`),
                L('Test word problems often have two steps and a table with extra numbers. A good plan beats fast guessing.', 'В тестовых задачах часто два шага и таблица с лишними числами. Хороший план лучше быстрой догадки.'),
                L(`Ameliia read ${b} pages of Harry Potter this week, and Mom read ${k} times as many. A bar diagram shows it: one bar of ${b} for Ameliia, ${k} bars of ${b} for Mom.`, `Амелия прочитала за неделю ${b} ${ruPlural(b, 'страницу', 'страницы', 'страниц')} «Гарри Поттера», а мама в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше. Схема это показывает: одна полоска ${b} для Амелии и ${k} полосок по ${b} для мамы.`),
            ],
            sections: [
                { kind: 'steps', title: L('A plan for every word problem', 'План для любой задачи'), body: [
                    L('1. Underline the question. What do you need to find?', '1. Подчеркни вопрос. Что нужно найти?'),
                    L('2. Pick only the numbers you need. A table may have extra rows.', '2. Выбери только нужные числа. В таблице могут быть лишние строки.'),
                    L('3. Draw a bar diagram: equal boxes mean multiply, two different parts mean add or subtract.', '3. Нарисуй схему из полосок: одинаковые полоски - умножаем, две разные части - складываем или вычитаем.'),
                    L('4. Write an equation with a letter and solve it.', '4. Запиши уравнение с буквой и реши его.'),
                    L('5. Check with an estimate and write the unit.', '5. Проверь прикидкой и напиши единицы.'),
                ] },
                { kind: 'example', title: L('Times as many', 'Во сколько раз больше'), prompt: L(`Mia has ${b} dolls. The warehouse has ${k} times as many dolls. How many dolls are in the warehouse?`, `У Мии ${b} ${ruPlural(b, 'кукла', 'куклы', 'кукол')}. На складе в ${k} ${ruPlural(k, 'раз', 'раза', 'раз')} больше. Сколько кукол на складе?`), body: [
                    L(`One box of ${b} for Mia, ${k} boxes of ${b} for the warehouse.`, `Одна полоска ${b} для Мии, ${k} полосок по ${b} для склада.`),
                    L(`d = ${k} × ${b} = ${big}.`, `d = ${k} × ${b} = ${big}.`),
                    L(`Reasonable? ${b} is about ${roundTo(b, 10)}, ${k} × ${roundTo(b, 10)} = ${k * roundTo(b, 10)}, close to ${big} ✓`, `Правдоподобно? ${b} - это примерно ${roundTo(b, 10)}, ${k} × ${roundTo(b, 10)} = ${k * roundTo(b, 10)}, близко к ${big} ✓`),
                ], visual: { kind: 'bars', rows: [{ label: L('Mia', 'Мия'), boxes: 1, value: String(b) }, { label: L('warehouse', 'склад'), boxes: k, value: String(b) }], braces: [{ row: 1, label: L(`d = ${k} × ${b}`, `d = ${k} × ${b}`) }] } },
                { kind: 'example', title: L('Two kinds of bags', 'Два вида пакетов'), prompt: L('Mr. Ortiz sells 4 bags of 50 tortillas and 6 bags of 25 tortillas. How many tortillas?', 'Мистер Ортис продал 4 пакета по 50 тортилий и 6 пакетов по 25. Сколько всего тортилий?'), body: [
                    L('4 × 50 = 200 and 6 × 25 = 150.', '4 × 50 = 200 и 6 × 25 = 150.'),
                    L('200 + 150 = 350 tortillas. Not 4 + 6 = 10: that only counts the bags!', '200 + 150 = 350 тортилий. Не 4 + 6 = 10: так считаются только пакеты!'),
                ] },
                { kind: 'warn', title: L('Watch out!', 'Осторожно!'), body: [
                    L('"5 times as many" multiplies. "How many more" subtracts. Some problems ask both, one step after the other.', '«В 5 раз больше» - умножаем. «На сколько больше» - вычитаем. В некоторых задачах нужно и то, и другое, по очереди.'),
                    L('"Every hour" or "each week" means the same amount again and again: find one hour first, then multiply by the hours.', '«Каждый час» или «каждую неделю» значит одно и то же количество снова и снова: сначала найди за один час, потом умножь на число часов.'),
                    L('Is "about $200" reasonable for 4 gifts of $105? 4 × $100 = $400, so no.', '«Примерно $200» за 4 подарка по $105 - правдоподобно? 4 × $100 = $400, значит нет.'),
                ] },
                { kind: 'trick', title: L('Equation from a bar diagram', 'Уравнение по схеме'), body: [
                    L('Boxes 48, 48, 48, 48 with b over the whole bar: b = 4 × 48 = 192.', 'Полоски 48, 48, 48, 48, над всей полосой b: b = 4 × 48 = 192.'),
                ] },
            ],
        };
    },
    'forces': () => ({
        hook: [
            L('On the playground you push a swing, pull a wagon and slide down the slide because gravity pulls you. Forces are everywhere!', 'На площадке ты толкаешь качели, тянешь тележку и скатываешься с горки, потому что тебя тянет гравитация. Силы повсюду!'),
            L('Test on Friday: Chapter 2, What Affects Motion? Here are all the words of Part I with examples you know from real life.', 'Тест в пятницу: глава 2 «Что влияет на движение?». Здесь все слова из части I с примерами из жизни.'),
        ],
        sections: [
            { kind: 'idea', title: L('Study guide words', 'Слова из памятки'), body: [
                L('MOTION: a change in position of an object.', 'ДВИЖЕНИЕ: изменение положения предмета.'),
                L('REFERENCE POINT: a place or object used to tell if an object is in motion. Choose something that stays still, like a tree or a building.', 'ТОЧКА ОТСЧЁТА: место или предмет, по которому видно, движется ли предмет. Выбирай то, что стоит на месте: дерево или здание.'),
                L('FORCE: any push or pull.', 'СИЛА: любой толчок или тяга.'),
                L('GRAVITY: the force that pulls all objects toward each other. It makes a dropped apple fall.', 'ГРАВИТАЦИЯ: сила, которая притягивает все предметы друг к другу. Из-за неё падает отпущенное яблоко.'),
                L('RELATIVE MOTION: the change of one object\'s position compared with another object\'s position. On a train Mom looks still to you, but moving to a person on the platform.', 'ОТНОСИТЕЛЬНОЕ ДВИЖЕНИЕ: изменение положения одного предмета по сравнению с другим. В поезде мама для тебя неподвижна, а для человека на платформе движется.'),
            ] },
            { kind: 'steps', title: L('Four ways to move', 'Четыре вида движения'), body: [
                L('A straight line: a bowling ball rolling down the lane.', 'По прямой: шар катится по дорожке боулинга.'),
                L('A curved path: a basketball flying into the hoop.', 'По кривой: баскетбольный мяч летит в корзину.'),
                L('Back and forth, a vibration: a plucked guitar string.', 'Туда-сюда, вибрация: дёрнутая струна гитары.'),
                L('A rotation: a spinning top or a fan.', 'Вращение: юла или вентилятор.'),
            ] },
            { kind: 'idea', title: L('What a force does', 'Что делает сила'), body: [
                L('All forces have a size and a direction.', 'У всех сил есть величина и направление.'),
                L('A force can make a still object start to move in the direction of the force.', 'Сила может сдвинуть неподвижный предмет в направлении силы.'),
                L('It can make a moving object go faster, slow down, stop or change direction.', 'Она может заставить движущийся предмет ехать быстрее, медленнее, остановиться или повернуть.'),
                L('The amount of force matters: a hard kick changes the speed of a ball more than a soft kick.', 'Величина силы важна: сильный удар меняет скорость мяча больше, чем слабый.'),
            ] },
            { kind: 'warn', title: L('Balanced or unbalanced?', 'Уравновешенные или нет?'), body: [
                L('Balanced forces: equal in size, opposite in direction. A still object stays still, a moving object keeps the same speed and direction.', 'Уравновешенные силы: равные по величине, противоположные по направлению. Неподвижный предмет остаётся на месте, движущийся сохраняет скорость и направление.'),
                L('Unbalanced forces: one side is stronger, so the object moves toward the stronger force, like the rope in a tug of war.', 'Неуравновешенные силы: одна сторона сильнее, и предмет движется в сторону большей силы, как канат в перетягивании.'),
                L('A book on a table is not "forceless": gravity pulls it down, the table pushes it up just as hard.', 'На книгу на столе силы действуют: гравитация тянет вниз, а стол так же сильно толкает вверх.'),
            ] },
            { kind: 'trick', title: L('Memory trick', 'Запоминалка'), body: [
                L('PUSH sends it away, PULL brings it closer. A tie in tug of war = balanced.', 'ТОЛЧОК - от себя, ТЯГА - к себе. Ничья в перетягивании каната = уравновешенные силы.'),
            ] },
        ],
    }),
};

const builders: Record<SkillId, (rng: Rng) => { hook: L10n[]; sections: Section[] }> = {
    ...strategyBuilders,
    ...wordBuilders,
    ...topic3Builders,
    'div-facts': rng => {
        const d = int(rng, 3, 9), q = int(rng, 3, 9), n = d * q;
        const skip = Array.from({ length: q }, (_, i) => (i + 1) * d);
        return {
            hook: [
                L(`Grandma Sveta baked ${n} cookies for ${d} people. To be fair, everyone gets the same number. That is division!`, `Бабушка Света испекла ${n} ${ruPlural(n, 'печеньку', 'печеньки', 'печенек')} на ${d} ${ruPlural(d, 'человека', 'человек', 'человек')}. Чтобы было честно, все получают поровну. Это и есть деление!`),
                L(`Martin has ${n} toy blocks and wants ${d} towers that are exactly the same. How many blocks go in each tower? Division knows!`, `У Мартина ${n} ${ruPlural(n, 'кубик', 'кубика', 'кубиков')}, и он хочет ${d} ${ruPlural(d, 'одинаковую башню', 'одинаковые башни', 'одинаковых башен')}. Сколько кубиков в каждой? Деление знает!`),
                L(`At the cafe ${n} macarons go onto ${d} plates, the same on each plate. Let's find out how many!`, `В кафе ${n} ${ruPlural(n, 'пирожное', 'пирожных', 'пирожных')} макарон раскладывают на ${d} ${ruPlural(d, 'тарелку', 'тарелки', 'тарелок')} поровну. Узнаем, сколько на каждой!`),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L(`Division splits a number into equal groups. ${n} ÷ ${d} = ${q} means: ${n} shared into ${d} equal groups gives ${q} in each group.`, `Деление разбивает число на равные группы. ${n} ÷ ${d} = ${q} значит: ${n} поровну на ${d} ${ruPlural(d, 'группу', 'группы', 'групп')} - в каждой по ${q}.`),
                    L(`Every division has a multiplication partner: ${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q} and ${n} ÷ ${q} = ${d}. This is a fact family.`, `У каждого деления есть друг-умножение: ${d} × ${q} = ${n}, значит ${n} ÷ ${d} = ${q} и ${n} ÷ ${q} = ${d}. Это семья примеров.`),
                ] },
                { kind: 'steps', title: T.how, body: [
                    L(`Ask: ${d} times WHAT makes ${n}?`, `Спроси себя: ${d} умножить на СКОЛЬКО будет ${n}?`),
                    L(`Forgot? Skip-count by ${d}: ${skip.join(', ')}. That is ${q} jumps, so the answer is ${q}.`, `Забыла? Считай через ${d}: ${skip.join(', ')}. Это ${q} ${ruPlural(q, 'прыжок', 'прыжка', 'прыжков')}, значит ответ ${q}.`),
                ] },
                { kind: 'example', title: T.example, prompt: L(`${n} ÷ ${d}`, `${n} ÷ ${d}`), body: [L(`${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q}.`, `${d} × ${q} = ${n}, значит ${n} ÷ ${d} = ${q}.`)], visual: { kind: 'groups', total: n, groups: d, icon: '⭐' } },
                { kind: 'warn', title: T.warn, body: [
                    L(`Dividing makes the number smaller (when you divide by more than 1). ${n} ÷ ${d} can never be bigger than ${n}.`, `При делении (на число больше 1) ответ меньше делимого. ${n} ÷ ${d} не может быть больше ${n}.`),
                    L(`Order matters: ${n} ÷ ${d} is not the same as ${d} ÷ ${n}.`, `Порядок важен: ${n} ÷ ${d} - это не то же самое, что ${d} ÷ ${n}.`),
                ] },
            ],
        };
    },
    'div-2d': rng => ({
        hook: [
            L('Two-digit numbers can be shared too! We just do it in two little steps: tens first, then ones.', 'Двузначные числа тоже можно делить! Просто в два маленьких шага: сначала десятки, потом единицы.'),
            L('Imagine sharing a pile of 10-sticker sheets and single stickers. First share the sheets, then the singles.', 'Представь, что делишь листы по 10 наклеек и отдельные наклейки. Сначала делим листы, потом отдельные.'),
        ],
        sections: [...longDivisionIdea(rng, 2), breakApart(rng, false), warnLong],
    }),
    'div-3d': rng => ({
        hook: [
            L('Three digits? No problem! The same four family steps, just one more round.', 'Три цифры? Не проблема! Те же четыре шага семьи, просто на один круг больше.'),
            L('A 300-page book is read one page at a time. A 3-digit division is done one digit at a time!', 'Книгу в 300 страниц читают по одной странице. Трёхзначное число делят по одной цифре!'),
        ],
        sections: [...longDivisionIdea(rng, 3), breakApart(rng, true), warnLong],
    }),
    'div-4d': rng => ({
        hook: [
            L('Four digits look huge, but you already know the secret: Dad, Mom, Sister, Brother, again and again.', 'Четыре цифры выглядят огромными, но ты уже знаешь секрет: Папа, Мама, Сестра, Брат, снова и снова.'),
            L('A flight to Italy is thousands of miles long, but it starts with one step onto the plane. Big divisions start with one small step too.', 'Перелёт в Италию длиной в тысячи миль начинается с одного шага в самолёт. Большое деление тоже начинается с маленького шага.'),
        ],
        sections: [...longDivisionIdea(rng, 4), breakApart(rng, true), warnLong],
    }),
    'div-zero': rng => {
        const d = int(rng, 3, 8);
        let q = 0;
        for (;;) { q = int(rng, 102, 909); if (String(q)[1] === '0') break; }
        const n = d * q;
        return {
            hook: [
                L('Zero is a sneaky little digit. It hides in the middle of answers, and many kids forget to write it. Not you!', 'Ноль - хитрая маленькая цифра. Он прячется в середине ответа, и многие дети забывают его написать. Но не ты!'),
                L('Pip the capybara once divided 618 by 3 and got 26. Grandpa Valerik laughed: "But 26 × 3 = 78, not 618!" Pip forgot the zero: the right answer is 206.', 'Капибара Пип однажды разделила 618 на 3 и получила 26. Дедушка Валерик рассмеялся: «Но 26 × 3 = 78, а не 618!» Пип забыла ноль: правильный ответ 206.'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L('After you bring down a digit, the divisor might not fit. Then the quotient digit is 0, and you MUST write it.', 'Когда снесли цифру, делитель может не поместиться. Тогда цифра частного 0, и её ОБЯЗАТЕЛЬНО пишем.'),
                    L('The 0 keeps the other digits in the right places, like a placeholder in a line of kids.', 'Ноль держит остальные цифры на своих местах, как место в очереди, которое кто-то занял.'),
                ] },
                { kind: 'example', title: T.example, prompt: L(`${fmt(n, 'en')} ÷ ${d}`, `${fmt(n, 'ru')} ÷ ${d}`), body: longDivisionText(n, d), visual: { kind: 'longdiv', dividend: n, divisor: d } },
                { kind: 'trick', title: T.trick, body: [
                    L('After the first quotient digit, every bring-down adds exactly one more digit to the quotient. Missing one? It is probably a 0.', 'После первой цифры частного каждый снос добавляет в частное ровно одну цифру. Не хватает цифры? Скорее всего, это 0.'),
                    L(`Estimate first: ${fmt(n, 'en')} ÷ ${d} is about ${fmt(Math.round(n / d / 100) * 100, 'en')}, so the answer needs 3 digits.`, `Сначала прикинь: ${fmt(n, 'ru')} ÷ ${d} - это примерно ${fmt(Math.round(n / d / 100) * 100, 'ru')}, значит в ответе 3 цифры.`),
                ] },
                warnLong,
            ],
        };
    },
    'div-rem': rng => {
        const d = int(rng, 3, 7), q = int(rng, 3, 9), r = int(rng, 1, d - 1), n = d * q + r;
        return {
            hook: [
                L(`Mom has ${n} chocolate candies for ${d} kids. Everyone gets ${q}, and ${r} ${r === 1 ? 'is' : 'are'} left over. Those leftovers have a name: the remainder!`, `У мамы ${n} ${ruPlural(n, 'шоколадная конфета', 'шоколадные конфеты', 'шоколадных конфет')} на ${d} ${ruPlural(d, 'ребёнка', 'детей', 'детей')}. Каждому по ${q}, и ${r} остаётся. У остатка есть имя - остаток!`),
                L('Not everything shares perfectly. When something is left over, we write it with an R.', 'Не всё делится ровно. Когда что-то остаётся, мы пишем это с буквой R (остаток).'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L(`${n} ÷ ${d} = ${q} R ${r}: ${q} in each group and ${r} left over.`, `${n} ÷ ${d} = ${q} (остаток ${r}): в каждой группе ${q}, и ${r} остаётся.`),
                    L('The remainder is ALWAYS smaller than the divisor. If it is not, one more fits into each group.', 'Остаток ВСЕГДА меньше делителя. Если нет - в каждую группу поместится ещё по одному.'),
                ] },
                { kind: 'steps', title: T.how, body: [
                    L('Divide with the usual steps until no digits are left.', 'Делим обычными шагами, пока не кончатся цифры.'),
                    L('The last number after subtracting is the remainder.', 'Последнее число после вычитания - это остаток.'),
                    L('Check: quotient × divisor + remainder = dividend.', 'Проверка: частное × делитель + остаток = делимое.'),
                ] },
                { kind: 'example', title: T.example, prompt: L(`${n} ÷ ${d}`, `${n} ÷ ${d}`), body: longDivisionText(n, d), visual: { kind: 'groups', total: n, groups: d, icon: '🍫' } },
                (() => { const d2 = int(rng, 4, 9), q2 = int(rng, 21, 99), r2 = int(rng, 1, d2 - 1), n2 = d2 * q2 + r2; return { kind: 'example' as const, title: T.bigger, prompt: L(`${fmt(n2, 'en')} ÷ ${d2}`, `${fmt(n2, 'ru')} ÷ ${d2}`), body: longDivisionText(n2, d2), visual: { kind: 'longdiv' as const, dividend: n2, divisor: d2 } }; })(),
                { kind: 'warn', title: T.warn, body: [
                    L('In the answer boxes, put the quotient in the first box and the remainder in the R box.', 'В ответе частное пиши в первое окошко, а остаток - в окошко R.'),
                    L('No remainder? Then write 0 in the R box.', 'Нет остатка? Тогда пиши 0 в окошко R.'),
                ] },
            ],
        };
    },
    'div-word': rng => {
        const d = int(rng, 6, 9), q = int(rng, 4, 9), r = int(rng, 1, d - 1), n = d * q + r;
        return {
            hook: [
                L('Word problems are little stories. Your job is to be a detective: what is shared, how many groups, and what does the leftover mean?', 'Текстовые задачи - это маленькие истории. Ты детектив: что делят, сколько групп и что значит остаток?'),
                L('Ameliia loves reading, and word problems are reading plus math. Read slowly, picture the story, then divide.', 'Амелия любит читать, а текстовая задача - это чтение плюс математика. Читай медленно, представь историю, потом дели.'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L('Clue words for division: share, split, equally, each, per, how many groups, how many in each.', 'Слова-подсказки для деления: поровну, разделить, каждому, по, сколько групп, сколько в каждой.'),
                    L(`The same math, ${n} ÷ ${d} = ${q} R ${r}, can give three different answers. The story decides!`, `Одно и то же ${n} ÷ ${d} = ${q} (остаток ${r}) может дать три разных ответа. Решает история!`),
                ] },
                { kind: 'steps', title: L('Three kinds of leftovers', 'Три вида остатка'), body: [
                    L(`Round UP: ${n} kids, ${d} in each van. ${q} vans are full and ${r} ${r === 1 ? 'kid still needs' : 'kids still need'} a ride, so ${q + 1} vans.`, `Округляем ВВЕРХ: ${n} ${ruPlural(n, 'ребёнок', 'ребёнка', 'детей')}, по ${d} в микроавтобус. ${q} ${ruPlural(q, 'микроавтобус заполнен', 'микроавтобуса заполнены', 'микроавтобусов заполнены')}, а ещё ${r} ${ruPlural(r, 'ребёнку', 'детям', 'детям')} нужно место, значит нужно ${q + 1} ${ruPlural(q + 1, 'микроавтобус', 'микроавтобуса', 'микроавтобусов')}.`),
                    L(`Drop it: ${n} beads, ${d} beads per bracelet. Only ${q} whole bracelets; ${r} ${r === 1 ? 'bead is' : 'beads are'} not enough for another.`, `Отбрасываем: ${n} ${ruPlural(n, 'бусина', 'бусины', 'бусин')}, по ${d} на браслет. Только ${q} целых ${ruPlural(q, 'браслет', 'браслета', 'браслетов')}; ${r} ${ruPlural(r, 'бусины', 'бусин', 'бусин')} на ещё один не хватит.`),
                    L(`The remainder IS the answer: ${n} candies for ${d} kids. How many are left? ${r}.`, `Остаток И ЕСТЬ ответ: ${n} ${ruPlural(n, 'конфета', 'конфеты', 'конфет')} на ${d} ${ruPlural(d, 'ребёнка', 'детей', 'детей')}. Сколько останется? ${r}.`),
                ] },
                { kind: 'trick', title: T.trick, body: [
                    L('Ask yourself: "Does every last one need a place?" (round up), "Can I only use full groups?" (drop it), "How many are left?" (the remainder).', 'Спроси себя: «Каждому нужно место?» (вверх), «Считаются только полные группы?» (отбросить), «Сколько осталось?» (остаток).'),
                ] },
            ],
        };
    },
    'div-check': rng => {
        const d = int(rng, 3, 9), q = int(rng, 104, 308), n = d * q;
        return {
            hook: [
                L('Grown-ups check their math when it matters: money at the store, distances for a trip. You can check every division in 10 seconds!', 'Взрослые проверяют расчёты, когда это важно: деньги в магазине, расстояние в поездке. Любое деление можно проверить за 10 секунд!'),
                L('Pip the capybara makes funny mistakes. Can you catch them? The secret weapon is multiplication.', 'Капибара Пип делает смешные ошибки. Сможешь их поймать? Секретное оружие - умножение.'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L('Division and multiplication undo each other. quotient × divisor = dividend.', 'Деление и умножение отменяют друг друга. Частное × делитель = делимое.'),
                    L(`${fmt(n, 'en')} ÷ ${d} = ${q}? Check: ${q} × ${d} = ${fmt(n, 'en')} ✓`, `${fmt(n, 'ru')} ÷ ${d} = ${q}? Проверка: ${q} × ${d} = ${fmt(n, 'ru')} ✓`),
                ] },
                { kind: 'steps', title: L('Mistakes to catch', 'Ошибки, которые надо ловить'), body: [
                    L('A missing zero in the middle of the quotient (206 written as 26).', 'Потерянный ноль в середине частного (206 записали как 26).'),
                    L('A remainder that is bigger than the divisor.', 'Остаток больше делителя.'),
                    L('An answer that is way too big or too small: estimate first!', 'Ответ слишком большой или слишком маленький: сначала прикинь!'),
                ] },
                { kind: 'example', title: T.example, prompt: L(`${fmt(n, 'en')} ÷ ${d}`, `${fmt(n, 'ru')} ÷ ${d}`), body: longDivisionText(n, d), visual: { kind: 'longdiv', dividend: n, divisor: d } },
            ],
        };
    },
    'speed-basic': rng => {
        const s = pick(rng, [30, 40]), t = 2, dd = s * t;
        return {
            hook: [
                L(`Dad drives ${dd} miles to the Jersey Shore in ${t} hours. How fast is that? Speed tells us how far you go in ONE hour.`, `Папа проезжает ${dd} миль до побережья Джерси за ${t} ч. Насколько это быстро? Скорость показывает, сколько проезжаешь за ОДИН час.`),
                L('A cheetah, a train, a bike and a turtle all move, but not equally fast. Speed is how we compare them.', 'Гепард, поезд, велосипед и черепаха все двигаются, но не одинаково быстро. Скорость помогает их сравнить.'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L('Speed = distance ÷ time. If you go 120 miles in 2 hours, every hour you go 120 ÷ 2 = 60 miles. That is 60 miles per hour (mph).', 'Скорость = расстояние ÷ время. Если проехать 120 миль за 2 часа, за каждый час получается 120 ÷ 2 = 60 миль. Это 60 миль в час (миль/ч).'),
                    L('Most countries, like Italy, measure speed in kilometers per hour (km/h). The math is exactly the same.', 'В большинстве стран, например в Италии, скорость измеряют в километрах в час (км/ч). Математика точно такая же.'),
                    L('Real cars speed up, slow down and stop at lights, so their speed is not constant. AVERAGE speed tells what steady speed would make the same trip in the same time.', 'Настоящие машины разгоняются, тормозят и стоят на светофорах, поэтому их скорость не постоянна. СРЕДНЯЯ скорость - это такая ровная скорость, с которой поездка заняла бы столько же времени.'),
                ] },
                { kind: 'steps', title: T.how, body: [
                    L('1. Find the distance and the time in the story.', '1. Найди в задаче расстояние и время.'),
                    L('2. Divide: distance ÷ time.', '2. Раздели: расстояние ÷ время.'),
                    L('3. Name the unit: miles per hour or kilometers per hour.', '3. Назови единицу: мили в час или километры в час.'),
                    L('4. Check: speed × time should give the distance back.', '4. Проверь: скорость × время = расстояние.'),
                ] },
                { kind: 'trick', title: L('Same trip, car or train?', 'Одна поездка: машина или поезд?'), body: [
                    L('If the car needs 3 hours and the train needs 2 hours for the same 120 miles: car 120 ÷ 3 = 40 mph, train 120 ÷ 2 = 60 mph. Less time for the same distance means more speed.', 'Если машине нужно 3 часа, а поезду 2 часа на те же 120 миль: машина 120 ÷ 3 = 40 миль/ч, поезд 120 ÷ 2 = 60 миль/ч. Меньше времени на то же расстояние - значит скорость больше.'),
                ] },
            ],
        };
    },
    'speed-find': () => ({
        hook: [
            L('Speed, distance and time are a team of three. If you know two of them, you can always find the third!', 'Скорость, расстояние и время - команда из трёх. Если знаешь двоих, всегда найдёшь третьего!'),
            L('Planning the Florida trip: how far can we go in 5 hours? How long will 300 miles take? This is the math for that.', 'Планируем поездку во Флориду: сколько проедем за 5 часов? Сколько займут 300 миль? Вот математика для этого.'),
        ],
        sections: [
            { kind: 'idea', title: T.idea, body: [
                L('Distance = speed × time. 50 mph for 3 hours: 50 + 50 + 50 = 50 × 3 = 150 miles.', 'Расстояние = скорость × время. 50 миль/ч в течение 3 часов: 50 + 50 + 50 = 50 × 3 = 150 миль.'),
                L('Time = distance ÷ speed. 150 miles at 50 mph: how many 50s fit into 150? 3, so 3 hours.', 'Время = расстояние ÷ скорость. 150 миль со скоростью 50 миль/ч: сколько раз 50 помещается в 150? 3, значит 3 часа.'),
                L('Speed = distance ÷ time. 150 miles in 3 hours: 150 ÷ 3 = 50 mph.', 'Скорость = расстояние ÷ время. 150 миль за 3 часа: 150 ÷ 3 = 50 миль/ч.'),
            ] },
            { kind: 'trick', title: T.trick, body: [
                L('Draw a triangle: D on top, S and T at the bottom. Cover what you want. D is covered? S × T. S is covered? D ÷ T. T is covered? D ÷ S.', 'Нарисуй треугольник: Р (расстояние) сверху, С (скорость) и В (время) внизу. Закрой то, что ищешь. Закрыли Р? С × В. Закрыли С? Р ÷ В. Закрыли В? Р ÷ С.'),
            ] },
            { kind: 'warn', title: T.warn, body: [
                L('Looking for the distance? The answer is BIGGER than the speed (when the time is more than 1 hour): multiply.', 'Ищешь расстояние? Ответ БОЛЬШЕ скорости (если времени больше 1 часа): умножай.'),
                L('Looking for the time or the speed? Divide.', 'Ищешь время или скорость? Дели.'),
            ] },
        ],
    }),
    'speed-trip': rng => {
        const [s1, s2] = pick(rng, [[60, 20], [30, 50]]), t1 = 1, t2 = 3;
        const D = s1 * t1 + s2 * t2, T2 = t1 + t2;
        return {
            hook: [
                L('Our trip to Italy will have many parts: a car to Newark Airport, a plane to Rome, a train to Grandma Olga and Grandpa Valeriy. Each part has its own speed!', 'В поездке в Италию будет много частей: машина до аэропорта Ньюарк, самолёт до Рима, поезд к бабушке Оле и дедушке Валерию. У каждой части своя скорость!'),
                L('A day out: bike to the playground, bus to the cafe, walk home. What was the average speed of the whole trip? There is a trap, and you will learn to avoid it.', 'Прогулка: на велосипеде до площадки, на автобусе до кафе, пешком домой. Какая средняя скорость всей поездки? Тут есть ловушка, и ты научишься её обходить.'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L('Average speed of a whole trip = ALL the distance ÷ ALL the time.', 'Средняя скорость всей поездки = ВСЁ расстояние ÷ ВСЁ время.'),
                    L('Average speed of one part = that part\'s distance ÷ that part\'s time.', 'Средняя скорость одной части = расстояние этой части ÷ время этой части.'),
                ] },
                { kind: 'steps', title: T.how, body: [
                    L('1. If a part shows speed and time, find its distance: speed × time.', '1. Если у части дана скорость и время, найди расстояние: скорость × время.'),
                    L('2. Add all the distances.', '2. Сложи все расстояния.'),
                    L('3. Add all the times.', '3. Сложи всё время.'),
                    L('4. Divide total distance by total time.', '4. Раздели всё расстояние на всё время.'),
                ] },
                { kind: 'example', title: L('The map from the textbook: point A to point D', 'Карта из учебника: от точки A до точки D'), prompt: L('A → B: 120 km in 2 hours, B → C: 231 km in 3 hours, C → D: 90 km in 2 hours', 'A → B: 120 км за 2 часа, B → C: 231 км за 3 часа, C → D: 90 км за 2 часа'), body: [
                    L('A → B: 120 ÷ 2 = 60 km/h. B → C: 231 ÷ 3 = 77 km/h. C → D: 90 ÷ 2 = 45 km/h.', 'A → B: 120 ÷ 2 = 60 км/ч. B → C: 231 ÷ 3 = 77 км/ч. C → D: 90 ÷ 2 = 45 км/ч.'),
                    L('Whole trip: 120 + 231 + 90 = 441 km, 2 + 3 + 2 = 7 hours, 441 ÷ 7 = 63 km/h.', 'Вся поездка: 120 + 231 + 90 = 441 км, 2 + 3 + 2 = 7 часов, 441 ÷ 7 = 63 км/ч.'),
                    L('The 3 hours at 77 km/h count more than the 2-hour parts, so the speeds cannot simply be added and divided by 3.', '3 часа со скоростью 77 км/ч весят больше, чем части по 2 часа, поэтому скорости нельзя просто сложить и разделить на 3.'),
                ] },
                { kind: 'warn', title: L('The trap: do not average the speeds!', 'Ловушка: не усредняй скорости!'), body: [
                    L(`Part 1: ${s1} mph for ${t1} hour. Part 2: ${s2} mph for ${t2} hours.`, `Часть 1: ${s1} миль/ч в течение ${t1} часа. Часть 2: ${s2} миль/ч в течение ${t2} часов.`),
                    L(`Wrong: (${s1} + ${s2}) ÷ 2 = ${(s1 + s2) / 2}.`, `Неверно: (${s1} + ${s2}) ÷ 2 = ${(s1 + s2) / 2}.`),
                    L(`Right: distance ${s1} × ${t1} + ${s2} × ${t2} = ${D} miles, time ${t1} + ${t2} = ${T2} hours, ${D} ÷ ${T2} = ${D / T2} mph.`, `Верно: расстояние ${s1} × ${t1} + ${s2} × ${t2} = ${D} миль, время ${t1} + ${t2} = ${T2} ч, ${D} ÷ ${T2} = ${D / T2} миль/ч.`),
                    L(`We spent more time at ${s2} mph, so the true average is closer to ${s2}.`, `Дольше мы ехали со скоростью ${s2} миль/ч, поэтому настоящее среднее ближе к ${s2}.`),
                ] },
            ],
        };
    },
    'speed-units': () => ({
        hook: [
            L('Clocks and speeds go together. A piano lesson, a train ride, a gymnastics practice: they all take minutes and hours.', 'Часы и скорость всегда вместе. Урок пианино, поездка на поезде, тренировка по гимнастике - всё это минуты и часы.'),
        ],
        sections: [
            { kind: 'idea', title: T.idea, body: [
                L('1 hour = 60 minutes. Half an hour = 30 minutes. A quarter hour = 15 minutes.', '1 час = 60 минут. Полчаса = 30 минут. Четверть часа = 15 минут.'),
                L('2 hours 15 minutes = 2 × 60 + 15 = 135 minutes.', '2 часа 15 минут = 2 × 60 + 15 = 135 минут.'),
                L('Speed per hour from minutes: 4 miles in 30 minutes means 8 miles in 60 minutes, so 8 mph.', 'Скорость в час из минут: 4 мили за 30 минут значит 8 миль за 60 минут, то есть 8 миль/ч.'),
            ] },
            { kind: 'steps', title: L('How long is the ride?', 'Сколько длится поездка?'), body: [
                L('Jump on the clock: from 9:40 to 10:00 is 20 minutes, from 10:00 to 11:00 is 60 more, from 11:00 to 11:25 is 25 more.', 'Прыгай по часам: от 9:40 до 10:00 - 20 минут, от 10:00 до 11:00 - ещё 60, от 11:00 до 11:25 - ещё 25.'),
                L('Add the jumps: 20 + 60 + 25 = 105 minutes.', 'Складываем прыжки: 20 + 60 + 25 = 105 минут.'),
            ] },
            { kind: 'warn', title: T.warn, body: [
                L('An hour is 60 minutes, not 100! 1:50 + 20 minutes is 2:10, not 1:70.', 'В часе 60 минут, а не 100! 1:50 + 20 минут - это 2:10, а не 1:70.'),
            ] },
        ],
    }),
    'motion-ideas': () => ({
        hook: [
            L('On the playground everything moves: the swing goes back and forth, the slide makes you faster, the merry-go-round spins. Scientists have special words for all of it!', 'На детской площадке всё движется: качели летают туда-сюда, на горке разгоняешься, карусель крутится. У учёных есть особые слова для всего этого!'),
            L('In 4th grade young scientists learn a big idea: the same object has more energy when it moves faster. Let\'s learn four explorer words: speed, velocity, acceleration and energy.', 'В 4 классе юные учёные узнают главную идею: один и тот же предмет, когда движется быстрее, имеет больше энергии. Выучим четыре слова исследователя: скорость, velocity, ускорение и энергия.'),
        ],
        sections: [
            { kind: 'idea', title: L('Four explorer words', 'Четыре слова исследователя'), body: [
                L('SPEED: how fast something moves. 30 mph.', 'СКОРОСТЬ (speed): как быстро что-то движется. 30 миль/ч.'),
                L('VELOCITY: speed AND direction. 30 mph north. Same speed but a new direction means a new velocity.', 'VELOCITY: скорость И направление. 30 миль/ч на север. Скорость та же, но направление новое - значит velocity другая.'),
                L('ACCELERATION: a change in velocity. Speeding up, slowing down AND turning are all acceleration.', 'УСКОРЕНИЕ (acceleration): изменение velocity. Разгон, торможение И поворот - всё это ускорение.'),
                L('ENERGY: the same object has more energy when it moves faster. The same ball rolled fast hits the pins harder, the same bumper car going fast bumps harder and louder.', 'ЭНЕРГИЯ: один и тот же предмет, когда движется быстрее, имеет больше энергии. Тот же шар, пущенный быстро, сильнее бьёт по кеглям, та же машинка на большой скорости бьёт сильнее и громче.'),
            ] },
            { kind: 'idea', title: L('Study guide, Part II: what is speed?', 'Памятка, часть II: что такое скорость?'), body: [
                L('Speed: the rate at which an object changes position.', 'Скорость (speed): то, как быстро предмет меняет положение.'),
                L('Velocity: the speed AND the direction. Direction words: north, south, east and west, or left, right, up and down.', 'Velocity: скорость И направление. Слова направления: север, юг, восток и запад или влево, вправо, вверх и вниз.'),
                L('Acceleration: any change in the speed or the direction of an object\'s motion.', 'Ускорение (acceleration): любое изменение скорости или направления движения.'),
                L('Average speed = total distance ÷ total time.', 'Средняя скорость = всё расстояние ÷ всё время.'),
            ] },
            { kind: 'steps', title: L('Is the velocity constant?', 'Velocity постоянна?'), body: [
                L('Ask two questions: Does the speed change? Does the direction change?', 'Задай два вопроса: меняется ли скорость? Меняется ли направление?'),
                L('Both "no": constant velocity, like a train on a straight track at a steady speed.', 'Оба ответа «нет»: velocity постоянна, как у поезда на прямом пути с ровной скоростью.'),
                L('Any "yes": the velocity changes, so the object is accelerating, like a merry-go-round or a car leaving a red light.', 'Хоть одно «да»: velocity меняется, значит есть ускорение, как у карусели или машины, отъезжающей от светофора.'),
            ] },
            { kind: 'warn', title: T.warn, body: [
                L('Fast does not mean accelerating. A plane flying straight at a steady 500 mph is not accelerating.', 'Быстро - не значит ускоряется. Самолёт, летящий прямо с постоянной скоростью 500 миль/ч, не ускоряется.'),
                L('Slowing down is acceleration too!', 'Торможение - это тоже ускорение!'),
            ] },
        ],
    }),
    'round': rng => {
        const n = int(rng, 1201, 8899);
        const low = Math.floor(n / 100) * 100;
        return {
            hook: [
                L('At the cafe nobody says "this costs $18.73, so I need $18.73". We say "about $20". That is rounding: a friendly, easy number close to the real one.', 'В кафе никто не говорит «это стоит $18.73». Мы говорим «примерно $20». Это округление: удобное число рядом с настоящим.'),
                L('Is Florida about 1,000 miles away or exactly 1,047? For planning, "about" is perfect. Rounding gives us "about".', 'До Флориды примерно 1 000 миль или ровно 1 047? Для планов «примерно» - то что нужно. Округление даёт «примерно».'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L(`Rounding finds the closest "round" number. ${fmt(n, 'en')} is between ${fmt(low, 'en')} and ${fmt(low + 100, 'en')}. Which is closer?`, `Округление находит ближайшее «круглое» число. ${fmt(n, 'ru')} лежит между ${fmt(low, 'ru')} и ${fmt(low + 100, 'ru')}. Что ближе?`),
                    L('Look at the digit just to the RIGHT of the place you round to. 0-4: round down. 5-9: round up.', 'Смотри на цифру СПРАВА от разряда, до которого округляешь. 0-4: вниз. 5-9: вверх.'),
                ] },
                { kind: 'steps', title: T.how, body: [
                    L('1. Underline the digit in the rounding place.', '1. Подчеркни цифру нужного разряда.'),
                    L('2. Look at its right neighbor.', '2. Посмотри на её соседа справа.'),
                    L('3. 5 or more? Add 1 to the underlined digit. Less than 5? Keep it.', '3. 5 или больше? Прибавь 1 к подчёркнутой цифре. Меньше 5? Оставь как есть.'),
                    L('4. Change every digit to the right into 0.', '4. Все цифры правее замени на 0.'),
                ] },
                { kind: 'example', title: T.example, prompt: L(`Round ${fmt(n, 'en')} to the nearest hundred`, `Округли ${fmt(n, 'ru')} до сотен`), body: (() => { const r = Math.round(n / 100) * 100; const h = Math.floor(n / 100) % 10, nb = Math.floor(n / 10) % 10; return [L(`Hundreds digit: ${h}. Right neighbor: ${nb}.`, `Цифра сотен: ${h}. Сосед справа: ${nb}.`), nb >= 5 ? L(`${nb} is 5 or more, so ${h} goes up by 1 and the digits after it become 0.`, `${nb} - это 5 или больше, значит ${h} увеличиваем на 1, а цифры после неё становятся нулями.`) : L(`${nb} is less than 5, so ${h} stays and the digits after it become 0.`, `${nb} меньше 5, значит ${h} остаётся, а цифры после неё становятся нулями.`), L(`So ${fmt(n, 'en')} rounds to ${fmt(r, 'en')}.`, `Значит ${fmt(n, 'ru')} округляется до ${fmt(r, 'ru')}.`)]; })(), visual: { kind: 'numberline', value: n, low, high: low + 100, place: 100 } },
                { kind: 'warn', title: T.warn, body: [
                    L('A 9 that rounds up becomes 10: carry the 1! 7,962 to the nearest hundred is 8,000.', 'Девятка при округлении вверх становится 10: переносим 1! 7 962 до сотен - это 8 000.'),
                    L('Exactly 5 rounds UP: 350 to the nearest hundred is 400.', 'Если справа ровно 5, округляем ВВЕРХ: 350 до сотен - это 400.'),
                    L('Only look at ONE digit to the right, not all of them.', 'Смотри только на ОДНУ цифру справа, а не на все.'),
                ] },
            ],
        };
    },
    'est-sum': () => ({
        hook: [
            L('Mom asks: "We bought paint for $38 and brushes for $47. Do we have enough with $100?" A quick estimate answers in 3 seconds!', 'Мама спрашивает: «Мы купили краски за $38 и кисточки за $47. Хватит ли $100?» Быстрая прикидка отвечает за 3 секунды!'),
        ],
        sections: [
            { kind: 'idea', title: T.idea, body: [
                L('To estimate a sum, round each number first, then add the easy round numbers.', 'Чтобы прикинуть сумму, сначала округли каждое число, потом сложи удобные круглые числа.'),
                L('$38 → $40 and $47 → $50, so about $90. Yes, $100 is enough!', '$38 → $40 и $47 → $50, значит примерно $90. Да, $100 хватит!'),
            ] },
            { kind: 'steps', title: T.how, body: [
                L('1. Read which place to round to (tens, hundreds, thousands).', '1. Прочитай, до какого разряда округлять (десятки, сотни, тысячи).'),
                L('2. Round EVERY number to that place.', '2. Округли КАЖДОЕ число до этого разряда.'),
                L('3. Add or subtract the rounded numbers.', '3. Сложи или вычти округлённые числа.'),
            ] },
            { kind: 'warn', title: T.warn, body: [
                L('Round first, then add. If you add first and round the total, you may get a different number than the task asks for.', 'Сначала округляй, потом складывай. Если сначала сложить, а потом округлить, можно получить не то число, которое просят.'),
            ] },
        ],
    }),
    'est-product': rng => {
        // factors right next to a ten, so the estimate really is close
        const a = pick(rng, [48, 52, 61, 39, 71, 29, 59, 42]), b = pick(rng, [31, 29, 19, 41, 51, 22]);
        const ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10;
        return {
            hook: [
                L(`Is ${a} × ${b} closer to ${fmt(ra * rb / 10, 'en')}, ${fmt(ra * rb, 'en')} or ${fmt(ra * rb * 10, 'en')}? Estimating tells you in a flash, before you do the long multiplication.`, `${a} × ${b} ближе к ${fmt(ra * rb / 10, 'ru')}, ${fmt(ra * rb, 'ru')} или ${fmt(ra * rb * 10, 'ru')}? Прикидка подскажет мгновенно, ещё до длинного умножения.`),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L(`Round each factor: ${a} → ${ra}, ${b} → ${rb}.`, `Округли каждый множитель: ${a} → ${ra}, ${b} → ${rb}.`),
                    L(`Multiply the front digits: ${ra / 10} × ${rb / 10} = ${(ra / 10) * (rb / 10)}. Then add all the zeros (2): ${fmt(ra * rb, 'en')}.`, `Перемножь цифры без нулей: ${ra / 10} × ${rb / 10} = ${(ra / 10) * (rb / 10)}. Потом допиши все нули (2): ${fmt(ra * rb, 'ru')}.`),
                    L(`The exact answer ${fmt(a * b, 'en')} is close to ${fmt(ra * rb, 'en')}.`, `Точный ответ ${fmt(a * b, 'ru')} близок к ${fmt(ra * rb, 'ru')}.`),
                ] },
                { kind: 'warn', title: T.warn, body: [
                    L('Count zeros carefully when the front digits make a number with its own zero: 50 × 40 → 5 × 4 = 20, plus 2 zeros = 2,000 (three zeros in the answer!).', 'Внимательно с нулями, когда цифры дают число со своим нулём: 50 × 40 → 5 × 4 = 20, плюс 2 нуля = 2 000 (в ответе три нуля!).'),
                ] },
                { kind: 'trick', title: L('Is it reasonable?', 'Правдоподобно?'), body: [
                    L('After you multiply exactly, compare with your estimate. Far away? Look for a mistake.', 'После точного умножения сравни с прикидкой. Далеко? Ищи ошибку.'),
                ] },
            ],
        };
    },
    'multiply': rng => {
        // no zero in the ones place, so the example has four real parts
        const a = 10 * int(rng, 2, 8) + int(rng, 1, 9), b = 10 * int(rng, 2, 8) + int(rng, 1, 9);
        const big = int(rng, 1203, 4876), m = int(rng, 3, 8);
        return {
            hook: [
                L('Big multiplications are easier when you break them into friendly pieces, like cutting a big cake into slices.', 'Большое умножение легче, если разбить его на удобные кусочки, как большой торт на дольки.'),
                L('Ameliia loves painting rectangles of color. The area model is a painted rectangle that does multiplication!', 'Амелия любит рисовать цветные прямоугольники. Модель площади - это раскрашенный прямоугольник, который умножает!'),
            ],
            sections: [
                { kind: 'idea', title: T.idea, body: [
                    L('Break each number into tens and ones (or thousands, hundreds, tens and ones), multiply every pair, then add all the parts.', 'Разбей каждое число на десятки и единицы (или тысячи, сотни, десятки и единицы), перемножь каждую пару и сложи все части.'),
                ] },
                { kind: 'example', title: T.example, prompt: L(`${a} × ${b}`, `${a} × ${b}`), body: (() => {
                    const a1 = Math.floor(a / 10) * 10, a0 = a % 10, b1 = Math.floor(b / 10) * 10, b0 = b % 10;
                    const parts = [a1 * b1, a1 * b0, a0 * b1, a0 * b0];
                    return [
                        L(`${a} = ${a1} + ${a0}, ${b} = ${b1} + ${b0}.`, `${a} = ${a1} + ${a0}, ${b} = ${b1} + ${b0}.`),
                        L(`${a1} × ${b1} = ${parts[0]}, ${a1} × ${b0} = ${parts[1]}, ${a0} × ${b1} = ${parts[2]}, ${a0} × ${b0} = ${parts[3]}.`, `${a1} × ${b1} = ${parts[0]}, ${a1} × ${b0} = ${parts[1]}, ${a0} × ${b1} = ${parts[2]}, ${a0} × ${b0} = ${parts[3]}.`),
                        L(`${parts.map(x => fmt(x, 'en')).join(' + ')} = ${fmt(a * b, 'en')}.`, `${parts.map(x => fmt(x, 'ru')).join(' + ')} = ${fmt(a * b, 'ru')}.`),
                    ];
                })(), visual: { kind: 'area', a, b } },
                { kind: 'example', title: T.bigger, prompt: L(`${fmt(big, 'en')} × ${m}`, `${fmt(big, 'ru')} × ${m}`), body: (() => {
                    const parts = String(big).split('').map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i)).filter(x => x > 0);
                    return [
                        L(`${fmt(big, 'en')} = ${parts.map(x => fmt(x, 'en')).join(' + ')}.`, `${fmt(big, 'ru')} = ${parts.map(x => fmt(x, 'ru')).join(' + ')}.`),
                        L(parts.map(x => `${fmt(x, 'en')} × ${m} = ${fmt(x * m, 'en')}`).join(', ') + '.', parts.map(x => `${fmt(x, 'ru')} × ${m} = ${fmt(x * m, 'ru')}`).join(', ') + '.'),
                        L(`${parts.map(x => fmt(x * m, 'en')).join(' + ')} = ${fmt(big * m, 'en')}.`, `${parts.map(x => fmt(x * m, 'ru')).join(' + ')} = ${fmt(big * m, 'ru')}.`),
                    ];
                })(), visual: { kind: 'area', a: big, b: m } },
                { kind: 'warn', title: T.warn, body: [
                    L('Do not forget the middle parts! 23 × 45 is NOT just 20 × 40 + 3 × 5. There are four parts.', 'Не забывай средние части! 23 × 45 - это НЕ просто 20 × 40 + 3 × 5. Частей четыре.'),
                    L('Estimate to check: 23 × 45 is about 20 × 50 = 1,000, and the exact answer 1,035 is close.', 'Проверь прикидкой: 23 × 45 примерно 20 × 50 = 1 000, и точный ответ 1 035 близко.'),
                ] },
            ],
        };
    },
};

// the skills a task is built on, nearest first; the page shows the whole chain from the basics up
// (average speed divides, a word problem multiplies and rounds, the standard algorithm is short partial products)
const NEEDS: Partial<Record<SkillId, SkillId[]>> = {
    'div-2d': ['div-facts'], 'div-3d': ['div-2d'], 'div-zero': ['div-3d'], 'div-4d': ['div-3d'],
    'div-rem': ['div-facts'], 'div-word': ['div-rem'], 'div-check': ['div-2d', 'mult-standard'],
    'speed-basic': ['div-2d'], 'speed-find': ['speed-basic', 'mult-standard'], 'speed-trip': ['speed-find'],
    'speed-units': ['div-facts'], 'motion-ideas': ['speed-basic'],
    'est-sum': ['round'], 'est-product': ['round', 'mult-tens'], 'multiply': ['mult-area'],
    'mult-dist': ['mult-area'], 'mult-partial': ['mult-area'], 'mult-standard': ['mult-partial'],
    'compare': ['div-facts'], 'word-steps': ['mult-standard', 'round'],
    'mult-mental': ['mult-tens', 'mult-dist'], 'mult-expr': ['mult-dist', 'mult-partial'], 'mult-word': ['compare', 'mult-standard'],
};

// every building block in learning order: a skill comes after everything it needs
export const chainOf = (skill: SkillId): SkillId[] => {
    const out: SkillId[] = [];
    const visit = (s: SkillId) => { for (const n of NEEDS[s] ?? []) visit(n); if (!out.includes(s)) out.push(s); };
    visit(skill);
    return out.slice(0, -1);
};

const blocksIntro = (skill: SkillId, chain: SkillId[]): Section => ({
    kind: 'steps', title: L('What you need for this, in order', 'Что для этого нужно, по порядку'),
    body: [...chain, skill].map((s, i) => (i === chain.length
        ? L(`${i + 1}. ${SKILL_NAME[s].en} - this page`, `${i + 1}. ${SKILL_NAME[s].ru} - эта страница`)
        : L(`${i + 1}. ${SKILL_NAME[s].en} - tap the block below to read it`, `${i + 1}. ${SKILL_NAME[s].ru} - нажми на блок ниже, чтобы прочитать`))),
});

export const answerLine = (p: Problem): L10n => {
    const a = p.answer;
    if (a.kind === 'number') return L(`Answer: ${fmt(a.value, 'en')}`, `Ответ: ${fmt(a.value, 'ru')}`);
    if (a.kind === 'remainder') return L(`Answer: ${fmt(a.q, 'en')} R ${a.r}`, `Ответ: ${fmt(a.q, 'ru')} (остаток ${a.r})`);
    // a worksheet: the last blank is the final product
    if (a.kind === 'fill') return L(`Answer: ${fmt(a.values[a.values.length - 1], 'en')}`, `Ответ: ${fmt(a.values[a.values.length - 1], 'ru')}`);
    if (a.kind === 'multi') return L(`Answer: ${a.correct.map(i => a.options[i].en).join('; ')}`, `Ответ: ${a.correct.map(i => a.options[i].ru).join('; ')}`);
    const o = a.options[a.correct];
    return L(`Answer: ${o.en}`, `Ответ: ${o.ru}`);
};

export const buildTheory = (skill: SkillId, rng: Rng, failed?: Problem): Theory => {
    const { hook, sections } = builders[skill](rng);
    const out: Section[] = [{ kind: 'story', body: pick(rng, hook) }];
    // after a mistake her own task comes first, step by step, then the rest of the page
    if (failed) out.push({ kind: 'example', title: T.yours, prompt: failed.prompt, body: [...failed.steps, answerLine(failed)], visual: failed.visual });
    // the building blocks first, from the basics up, then this skill
    const chain = chainOf(skill);
    if (chain.length) {
        out.push(blocksIntro(skill, chain));
        chain.forEach((s, i) => out.push({ kind: 'prereq', title: L(`Building block ${i + 1}: ${SKILL_NAME[s].en}`, `Кирпичик ${i + 1}: ${SKILL_NAME[s].ru}`), sections: builders[s](rng).sections }));
    }
    out.push(...sections);
    // a brand-new worked example from the real task generator, so the theory never looks the same twice
    // never the same task as the one she just failed
    let fresh = makeProblem(skill, rng);
    for (let i = 0; i < 20 && failed && fresh.id === failed.id; i++) fresh = makeProblem(skill, rng);
    out.push({ kind: 'example', title: T.example2, prompt: fresh.prompt, body: [...fresh.steps, answerLine(fresh)], visual: fresh.visual });
    out.push({ kind: 'life', body: pick(rng, WHY_MATH) });
    out.push({ kind: 'love', body: pick(rng, LOVE) });
    return { skill, title: SKILL_NAME[skill], sections: out };
};
