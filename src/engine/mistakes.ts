/// <reference lib="esnext" />
import { type Given, type L10n, type Problem, type SkillId, type Visual, L, SKILL_NAME, fmt } from './core';
import { diagnose } from './diagnose';
import { type Section, type Theory, answerLine } from './theory';

// Ameliia's own mistakes in the Topic 3 homework (checked 2026-10-22): her problem, what she wrote,
// the right way and a rule. After the review comes a new task of the same kind; a right answer fixes the mistake.

export type HomeworkMistake = {
    id: string;
    skill: SkillId;
    kind: string;            // the kind of task to practice next (see PREP_PLAN)
    where: L10n;             // the page and the problem number
    task: L10n;              // the problem as it was on the sheet
    wrote: L10n[];           // what she did: wrong on purpose, never checked as math
    right: L10n[];           // the right way, step by step
    rule: L10n;              // one sentence to remember
    visual?: Visual;
};

// numbers as 1,234 in English and 1 234 in Russian
const X = (f: (n: (x: number) => string) => string): L10n => L(f(x => fmt(x, 'en')), f(x => fmt(x, 'ru')));
const set = (s: string, n: number) => L(`Set ${s}, problem ${n}`, `Set ${s}, задание ${n}`);
const practice = (n: string) => L(`Assessment Practice, problem ${n}`, `Тест-практика, задание ${n}`);

export const HOMEWORK_MISTAKES: HomeworkMistake[] = [
    {
        id: 'c4', skill: 'mult-partial', kind: 'all', where: set('C', 4), task: X(n => `${n(1341)} × 7`),
        wrote: [X(n => `7 × 1 = 7, 7 × 40 = 28, 7 × 300 = ${n(2100)}, 7 × ${n(1000)} = ${n(7000)}`), X(n => `7 + 28 + ${n(2100)} + ${n(7000)} = ${n(9135)}`)],
        right: [
            L('40 is 4 tens. 7 × 4 tens is 28 tens, and 28 tens is 280.', '40 - это 4 десятка. 7 × 4 десятка - это 28 десятков, а 28 десятков - это 280.'),
            X(n => `7 × 1 = 7, 7 × 40 = 280, 7 × 300 = ${n(2100)}, 7 × ${n(1000)} = ${n(7000)}`),
            X(n => `7 + 280 + ${n(2100)} + ${n(7000)} = ${n(9387)}`),
        ],
        rule: L('Say the place out loud before you multiply: tens give tens, hundreds give hundreds.', 'Проговори разряд перед умножением: десятки дают десятки, сотни дают сотни.'),
    },
    {
        id: 'd3', skill: 'mult-dist', kind: 'all', where: set('D', 3), task: L('720 × 6', '720 × 6'),
        wrote: [X(n => `(6 × 700) + (6 × 20) = ${n(4200)} + 12 = ${n(4212)}`)],
        right: [
            L('720 = 700 + 20', '720 = 700 + 20'),
            L('20 is 2 tens. 6 × 2 tens is 12 tens, and 12 tens is 120.', '20 - это 2 десятка. 6 × 2 десятка - это 12 десятков, а 12 десятков - это 120.'),
            X(n => `(6 × 700) + (6 × 20) = ${n(4200)} + 120 = ${n(4320)}`),
        ],
        rule: L('Keep the zero: 6 × 20 = 120, not 12.', 'Не теряй ноль: 6 × 20 = 120, а не 12.'),
    },
    {
        id: 'd8', skill: 'mult-dist', kind: 'all', where: set('D', 8), task: X(n => `4 × ${n(1865)}`),
        wrote: [X(n => `4 × (${n(1000)} + 80 + 60 + 5)`), L('The 8 in 1,865 was written as 80.', 'Цифра 8 в числе 1 865 записана как 80.')],
        right: [
            L('The 8 in 1,865 is in the hundreds place: it means 800.', 'Цифра 8 в числе 1 865 стоит в разряде сотен: это 800.'),
            X(n => `${n(1865)} = ${n(1000)} + 800 + 60 + 5`),
            X(n => `(4 × ${n(1000)}) + (4 × 800) + (4 × 60) + (4 × 5) = ${n(4000)} + ${n(3200)} + 240 + 20 = ${n(7460)}`),
        ],
        rule: L('Check the parts: they must add up to the number. 1,000 + 80 + 60 + 5 is only 1,145.', 'Проверь части: в сумме они должны дать само число. 1 000 + 80 + 60 + 5 - это всего 1 145.'),
    },
    {
        id: 'd5', skill: 'mult-dist', kind: 'all', where: set('D', 5), task: L('371 × 8', '371 × 8'),
        wrote: [X(n => `(8 × 300) + (8 × 70) + (8 × 1) = ${n(2400)} + 640 + 8 = ${n(3048)}`)],
        right: [
            L('8 × 7 = 56, so 8 × 70 = 560.', '8 × 7 = 56, значит 8 × 70 = 560.'),
            X(n => `(8 × 300) + (8 × 70) + (8 × 1) = ${n(2400)} + 560 + 8 = ${n(2968)}`),
        ],
        rule: L('8 × 7 = 56 and 8 × 8 = 64. Say the fact before you write it.', '8 × 7 = 56, а 8 × 8 = 64. Проговори пример, прежде чем записать.'),
    },
    {
        id: 'd2', skill: 'mult-dist', kind: 'all', where: set('D', 2), task: L('326 × 9', '326 × 9'),
        wrote: [X(n => `(9 × 300) + (9 × 20) + (9 × 9) = ${n(2700)} + 180 + 81 = ${n(2961)}`)],
        right: [
            L('326 = 300 + 20 + 6: the ones digit is 6, not 9.', '326 = 300 + 20 + 6: в разряде единиц 6, а не 9.'),
            X(n => `(9 × 300) + (9 × 20) + (9 × 6) = ${n(2700)} + 180 + 54 = ${n(2934)}`),
        ],
        rule: L('After you copy the parts, compare each one with the problem.', 'Переписав части, сверь каждую с условием.'),
    },
    {
        id: 'f10', skill: 'mult-mental', kind: 'comp', where: set('F', 10), task: L('937 × 7', '937 × 7'),
        wrote: [L('You wrote 8,433. That is 937 × 9, not 937 × 7.', 'Ты написала 8 433. Это 937 × 9, а не 937 × 7.')],
        right: [
            L('937 = 940 − 3', '937 = 940 − 3'),
            X(n => `7 × 940 = ${n(6580)}`),
            L('7 × 3 = 21', '7 × 3 = 21'),
            X(n => `${n(6580)} − 21 = ${n(6559)}`),
        ],
        rule: L('Read the problem again before you start: which number do you multiply by?', 'Перечитай условие, прежде чем начать: на какое число умножаем?'),
    },
    {
        id: 'a1', skill: 'mult-tens', kind: 'plain', where: set('A', 1), task: L('8 × 60', '8 × 60'),
        wrote: [L('You wrote 560.', 'Ты написала 560.')],
        right: [L('8 × 60 is 8 × 6 tens.', '8 × 60 - это 8 × 6 десятков.'), L('8 × 6 = 48, and 48 tens is 480.', '8 × 6 = 48, а 48 десятков - это 480.')],
        rule: L('Basic fact first, then the zero: 8 × 6 = 48, so 8 × 60 = 480.', 'Сначала табличный пример, потом ноль: 8 × 6 = 48, значит 8 × 60 = 480.'),
    },
    {
        id: 'q10', skill: 'mult-word', kind: 'tickets', where: practice('10'),
        task: L('Adult tickets $1,182, child tickets $459. The cost of 3 adult and 3 child tickets?', 'Взрослая путёвка $1 182, детская $459. Сколько стоят 3 взрослые и 3 детские?'),
        wrote: [X(n => `3 × ${n(1182)} = ${n(3546)} and 3 × 459 = ${n(1377)}: both right`) , X(n => `${n(3546)} + ${n(1377)}: you wrote ${n(3923)}`)],
        right: [
            L('Ones: 6 + 7 = 13, write 3, carry 1. Tens: 4 + 7 + 1 = 12, write 2, carry 1.', 'Единицы: 6 + 7 = 13, пишем 3, 1 переносим. Десятки: 4 + 7 + 1 = 12, пишем 2, 1 переносим.'),
            L('Hundreds: 5 + 3 + 1 = 9. Thousands: 3 + 1 = 4.', 'Сотни: 5 + 3 + 1 = 9. Тысячи: 3 + 1 = 4.'),
            X(n => `${n(3546)} + ${n(1377)} = ${n(4923)}`),
            X(n => `Estimate: 3 × ${n(1200)} + 3 × 500 = ${n(3600)} + ${n(1500)} = ${n(5100)}`),
            L('$4,923 is close to $5,100 ✓. $3,923 is far away: the estimate catches the mistake.', '$4 923 близко к $5 100 ✓. А $3 923 далеко: прикидка ловит ошибку.'),
        ],
        rule: L('Estimate first, then check that your answer is close to it.', 'Сначала прикинь, потом проверь, что ответ рядом с прикидкой.'),
    },
    {
        id: 'b8', skill: 'est-product', kind: 'big', where: set('B', 8), task: X(n => `Estimate 6 × ${n(8166)}`),
        wrote: [L('You wrote 56,000.', 'Ты написала 56 000.')],
        right: [
            L('8,166 has 4 digits: round it to the nearest thousand. 8,166 → 8,000.', 'В 8 166 четыре цифры: округляем до тысяч. 8 166 → 8 000.'),
            X(n => `6 × ${n(8000)} = ${n(48000)}`),
        ],
        rule: L('3 digits: round to hundreds. 4 digits: round to thousands.', 'Три цифры - округляем до сотен. Четыре цифры - до тысяч.'),
    },
    {
        id: 'h2', skill: 'mult-word', kind: 'story', where: set('H', 2),
        task: L('Mia has 34 dolls, the warehouse has 5 times as many: 170. How can you decide if your answer is reasonable?', 'У Мии 34 куклы, на складе в 5 раз больше: 170. Как понять, что ответ правдоподобный?'),
        wrote: [L('"I know my answer is reasonable because" and nothing after it.', '«Я знаю, что мой ответ правдоподобный, потому что» - и дальше ничего.')],
        right: [L('Round: 34 is about 30.', 'Округляем: 34 - это примерно 30.'), L('Multiply: 5 × 30 = 150.', 'Умножаем: 5 × 30 = 150.'), L('Compare: 150 is close to 170, so 170 is reasonable.', 'Сравниваем: 150 близко к 170, значит 170 - правдоподобный ответ.')],
        rule: L('Reasonable = round, multiply, compare.', 'Правдоподобно = округляю, умножаю, сравниваю.'),
    },
    {
        id: 'q17b', skill: 'mult-word', kind: 'gifts', where: practice('17B'),
        task: L('A keyboard costs $105, Mr. Luca buys 4. Write and solve an equation. Explain why your answer is reasonable.', 'Пианино стоит $105, мистер Лука покупает 4. Запиши и реши уравнение. Объясни, почему ответ правдоподобный.'),
        wrote: [L('A bar diagram of four 105s and 420, then "reasonable because I made a bar diagram". No equation, no estimate.', 'Схема из четырёх полосок по 105 и 420, потом «правдоподобно, потому что я нарисовала схему». Нет уравнения и нет прикидки.')],
        right: [L('Equation: c = 4 × 105 = 420', 'Уравнение: c = 4 × 105 = 420'), L('Estimate: $105 is about $100, 4 × $100 = $400.', 'Прикидка: $105 - это примерно $100, 4 × $100 = $400.'),
            L('$420 is close to $400, so the answer is reasonable.', '$420 близко к $400, значит ответ правдоподобный.')],
        rule: L('A drawing shows the math. An estimate proves it is reasonable.', 'Рисунок показывает решение. А доказывает правдоподобность прикидка.'),
    },
    {
        id: 'q2', skill: 'mult-mental', kind: 'story', where: practice('2'),
        task: L('Alberto rode the train 198 miles round trip 4 times. Explain how to use mental math to find the total distance.', 'Альберто 4 раза проехал на поезде туда и обратно по 198 миль. Объясни, как найти всё расстояние в уме.'),
        wrote: [L('The standard algorithm and an area model: 792. The answer is right, but the question asks for mental math.', 'Столбик и модель площади: 792. Ответ верный, но спрашивают про устный счёт.')],
        right: [L('198 is close to 200: 198 = 200 − 2', '198 близко к 200: 198 = 200 − 2'), L('4 × 200 = 800', '4 × 200 = 800'), L('4 × 2 = 8', '4 × 2 = 8'), L('800 − 8 = 792 miles', '800 − 8 = 792 мили')],
        rule: L('Mental math: use a round number close by, then fix the difference.', 'Устный счёт: возьми круглое число рядом, потом поправь разницу.'),
    },
    {
        id: 'q19', skill: 'mult-mental', kind: 'how', where: practice('19'), task: L('How can you use mental math to find 6 × 295?', 'Как найти 6 × 295 в уме?'),
        wrote: [L('An area model: 1,770. Right answer, but not mental math.', 'Модель площади: 1 770. Ответ верный, но это не устный счёт.')],
        right: [L('295 = 300 − 5', '295 = 300 − 5'), X(n => `6 × 300 = ${n(1800)}`), L('6 × 5 = 30', '6 × 5 = 30'), X(n => `${n(1800)} − 30 = ${n(1770)}`)],
        rule: L('Rounded up? Subtract the extra: 6 × 5, not just 5.', 'Округлила вверх? Вычти лишнее: 6 × 5, а не просто 5.'),
    },
    {
        id: 'q7', skill: 'mult-area', kind: 'all', where: practice('7'), task: L('Draw a model to find 365 × 3.', 'Нарисуй модель и найди 365 × 3.'),
        wrote: [L('In the boxes: 10, 9 and 5. Those are digits of the answer, not the parts.', 'В клетках: 10, 9 и 5. Это цифры ответа, а не части.')],
        right: [L('365 = 300 + 60 + 5: one box for each part.', '365 = 300 + 60 + 5: по клетке на каждую часть.'), L('3 × 300 = 900, 3 × 60 = 180, 3 × 5 = 15', '3 × 300 = 900, 3 × 60 = 180, 3 × 5 = 15'),
            X(n => `900 + 180 + 15 = ${n(1095)}`)],
        rule: L('Each box = the number on the left × the number on top.', 'Каждая клетка = число слева × число сверху.'),
        visual: { kind: 'area', a: 365, b: 3 },
    },
    {
        id: 'q5b', skill: 'mult-word', kind: 'area', where: practice('5B'), task: L('18 rows of peppers, 9 plants in each row. Draw an area model and show the partial products.', '18 рядов перца, в каждом по 9 кустов. Нарисуй модель площади и покажи частичные произведения.'),
        wrote: [L('In the boxes: 16 and 2. The total 162 is right, but the boxes are not the partial products.', 'В клетках: 16 и 2. Итог 162 верный, но в клетках не частичные произведения.')],
        right: [L('18 = 10 + 8', '18 = 10 + 8'), L('9 × 10 = 90, 9 × 8 = 72', '9 × 10 = 90, 9 × 8 = 72'), L('90 + 72 = 162', '90 + 72 = 162')],
        rule: L('Write the partial products in the boxes, then add them.', 'В клетки пиши частичные произведения, потом складывай их.'),
        visual: { kind: 'area', a: 18, b: 9 },
    },
    {
        id: 'q8', skill: 'mult-expr', kind: 'product', where: practice('8'), task: L('Select all of the expressions that have a product of 640.', 'Выбери все выражения со значением 640.'),
        wrote: [L('You picked (6 × 100) + (4 × 10) and (6 × 100) × (4 × 10). You did not pick 160 × 4.', 'Ты выбрала (6 × 100) + (4 × 10) и (6 × 100) × (4 × 10). И не выбрала 160 × 4.')],
        right: [L('(6 × 100) + (4 × 10) = 600 + 40 = 640 ✓', '(6 × 100) + (4 × 10) = 600 + 40 = 640 ✓'), L('160 × 4 = 640 ✓', '160 × 4 = 640 ✓'),
            X(n => `(6 × 100) × (4 × 10) = 600 × 40 = ${n(24000)}: not 640`), L('9 × 54 = 486 and 60 × 4 × 1 = 240: not 640', '9 × 54 = 486 и 60 × 4 × 1 = 240: не 640')],
        rule: L('Find the value of every option. Place value parts are added, not multiplied.', 'Посчитай каждый вариант. Части разрядов складывают, а не перемножают.'),
    },
    {
        id: 'q15', skill: 'mult-word', kind: 'bar', where: practice('15'), task: L('Write and solve an equation for the bar diagram: 48, 48, 48, 48, the whole is b.', 'Запиши и реши уравнение по схеме: 48, 48, 48, 48, целое - b.'),
        wrote: [L('You wrote 48 + 48 + 48 + 48 and 192: the right number, but no letter b.', 'Ты написала 48 + 48 + 48 + 48 и 192: число верное, но нет буквы b.')],
        right: [L('The whole bar is b: 4 equal parts of 48.', 'Вся полоса - это b: 4 равные части по 48.'), L('b = 4 × 48 = 192', 'b = 4 × 48 = 192')],
        rule: L('An equation uses the letter of the problem: b = 4 × 48.', 'В уравнении есть буква из задачи: b = 4 × 48.'),
        visual: { kind: 'bars', rows: [{ label: L('b', 'b'), boxes: 4, value: '48' }], braces: [{ row: 0, label: L('b = ?', 'b = ?') }] },
    },
    {
        id: 'p65', skill: 'speed-trip', kind: 'map', where: L('Textbook p. 65, problem 6', 'Учебник, с. 65, задание 6'),
        task: L('A → B: 120 km in 2 hours, B → C: 231 km in 3 hours, C → D: 90 km in 2 hours. The average speed from A to D?', 'A → B: 120 км за 2 часа, B → C: 231 км за 3 часа, C → D: 90 км за 2 часа. Средняя скорость от A до D?'),
        wrote: [L('You added the three speeds and divided by 3: (60 + 77 + 45) ÷ 3.', 'Ты сложила три скорости и разделила на 3: (60 + 77 + 45) ÷ 3.')],
        right: [L('Your speeds of the parts were right: 120 ÷ 2 = 60, 231 ÷ 3 = 77, 90 ÷ 2 = 45.', 'Скорости частей у тебя верные: 120 ÷ 2 = 60, 231 ÷ 3 = 77, 90 ÷ 2 = 45.'),
            L('All the distance: 120 + 231 + 90 = 441 km', 'Всё расстояние: 120 + 231 + 90 = 441 км'), L('All the time: 2 + 3 + 2 = 7 hours', 'Всё время: 2 + 3 + 2 = 7 часов'),
            L('441 ÷ 7 = 63 km/h', '441 ÷ 7 = 63 км/ч')],
        rule: L('Average speed of a trip = ALL the distance ÷ ALL the time. Never average the speeds.', 'Средняя скорость поездки = ВСЁ расстояние ÷ ВСЁ время. Скорости не усредняют.'),
    },
];

// the review page before her new task: the sheet, her answer, the right way, the rule
export const mistakeTheory = (m: HomeworkMistake): Theory => ({
    skill: m.skill,
    title: L(`Your homework: ${m.where.en}`, `Твоя домашка: ${m.where.ru}`),
    sections: [
        { kind: 'story', body: L(`Let's fix this one together. ${m.task.en}`, `Исправим это вместе. ${m.task.ru}`) },
        { kind: 'warn', title: L('What you wrote', 'Что ты написала'), body: m.wrote },
        { kind: 'example', title: L('The right way', 'Как правильно'), prompt: m.task, body: m.right, visual: m.visual },
        { kind: 'trick', title: L('Remember', 'Запомни'), body: [m.rule] },
        { kind: 'love', body: L('Now a new task of the same kind. You can do it!', 'Теперь новое задание того же вида. У тебя получится!') },
    ] satisfies Section[],
});

// ---------- one queue to rework: the homework mistakes, then every mistake she made in the app ----------

// a wrong answer in the app: the task itself, so the review shows exactly what she saw, what she answered
// (raw: her answer itself, for the diagnosis) and how many times she got it wrong
export type LoggedMistake = { t: number; problem: Problem; given: string; raw?: Given; times?: number };

export type ReworkItem = { from: 'homework'; m: HomeworkMistake } | { from: 'app'; e: LoggedMistake };

// homework first, then the app mistakes she got wrong most often, the oldest first
export const reworkQueue = (fixed: string[], log: LoggedMistake[]): ReworkItem[] => [
    ...HOMEWORK_MISTAKES.filter(m => !fixed.includes(m.id)).map(m => ({ from: 'homework' as const, m })),
    ...[...log].sort((a, b) => (b.times ?? 1) - (a.times ?? 1) || a.t - b.t).map(e => ({ from: 'app' as const, e })),
];

// The rework list by topic (owner, 2026-10-29): she may pick one mistake to fix first, or a whole topic she has just
// learned, or let the app take them in random order. Groups: the skill with the most mistakes first
export const reworkGroups = (queue: ReworkItem[]): { skill: SkillId; items: ReworkItem[] }[] => {
    const by = new Map<SkillId, ReworkItem[]>();
    queue.forEach(r => by.set(reworkSkill(r), [...(by.get(reworkSkill(r)) ?? []), r]));
    return Array.from(by.entries()).map(([skill, items]) => ({ skill, items })).sort((a, b) => b.items.length - a.items.length);
};
export type ReworkPick = { skill?: SkillId; random: boolean };
// the next mistake: of the chosen topic only while it has any, at random or in the list order
export const reworkNext = (queue: ReworkItem[], pick: ReworkPick, r: number): ReworkItem | null => {
    const pool = pick.skill ? queue.filter(x => reworkSkill(x) === pick.skill) : queue;
    if (!pool.length) return null;
    return pick.random ? pool[Math.min(pool.length - 1, Math.floor(r * pool.length))] : pool[0];
};

export const reworkId = (r: ReworkItem) => (r.from === 'homework' ? `homework:${r.m.id}` : `app:${r.e.problem.id}`);
export const reworkSkill = (r: ReworkItem): SkillId => (r.from === 'homework' ? r.m.skill : r.e.problem.skill);

const whatWentWrong = (e: LoggedMistake): L10n[] => {
    const d = e.raw ? diagnose(e.problem, e.raw) : null;
    return d ? [L(`🔎 What went wrong: ${d.en}`, `🔎 Что пошло не так: ${d.ru}`)] : [];
};

export const reworkTheory = (r: ReworkItem): Theory => {
    if (r.from === 'homework') return mistakeTheory(r.m);
    const p = r.e.problem;
    return {
        skill: p.skill,
        title: L(`Rework: ${SKILL_NAME[p.skill].en}`, `Работа над ошибкой: ${SKILL_NAME[p.skill].ru}`),
        sections: [
            { kind: 'story', body: L('This task did not work out last time. Let\'s look at it again.', 'В прошлый раз это задание не получилось. Посмотрим на него ещё раз.') },
            { kind: 'warn', title: L('What you answered', 'Что ты ответила'), body: [L(r.e.given, r.e.given), ...whatWentWrong(r.e)] },
            { kind: 'example', title: L('The right way', 'Как правильно'), prompt: p.prompt, body: [...p.steps, answerLine(p)], visual: p.visual },
            { kind: 'love', body: L('Now a new task of the same kind. You can do it!', 'Теперь новое задание того же вида. У тебя получится!') },
        ],
    };
};
