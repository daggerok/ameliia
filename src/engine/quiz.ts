import { type L10n, type Problem, type Rng, type SkillId, L, TOPIC_OF, choice, fmt, int, pick, ruPlural, shuffle } from './core';
import { makeFreshProblem, makeProblem } from './index';

const concept = (skill: SkillId, id: string, q: L10n, right: L10n, wrong: L10n[], why: L10n, rng: Rng): Problem => ({
    id: `quiz:${skill}:${id}`, skill, topic: TOPIC_OF[skill], prompt: q,
    answer: choice(rng, right, wrong), steps: [why], hint: L('Think about what the theory said.', 'Вспомни, что говорилось в теории.'), data: {},
});

// the example numbers have the size of the skill: 2-digit for div-2d, 4-digit for div-4d
const sized = (skill: SkillId, rng: Rng) => {
    const d = int(rng, 3, 9);
    const [lo, hi] = skill === 'div-2d' ? [11, Math.floor(99 / d)] : skill === 'div-4d' ? [Math.ceil(1000 / d), Math.floor(9999 / d)] : [Math.ceil(100 / d), Math.floor(999 / d)];
    return { d, q: int(rng, lo, hi) };
};

const longDivisionConcepts = (skill: SkillId, rng: Rng): Problem[] => {
    const { d, q } = sized(skill, rng), n = d * q;
    const x = d + int(rng, 1, d - 1);
    const small = int(rng, 1, d - 1);
    return [
        concept(skill, 'first', L('What is the FIRST step of long division?', 'Какой ПЕРВЫЙ шаг деления столбиком?'),
            L('Divide', 'Делим'), [L('Bring down', 'Сносим'), L('Subtract', 'Вычитаем'), L('Multiply', 'Умножаем')],
            L('Dad comes first: Divide, then Mom (Multiply), Sister (Subtract), Brother (Bring down).', 'Папа первый: делим, потом Мама (умножаем), Сестра (вычитаем), Брат (сносим).'), rng),
        concept(skill, 'after-sub', L('You just subtracted. What do you do next?', 'Ты только что вычла. Что дальше?'),
            L('Bring down the next digit', 'Снести следующую цифру'), [L('Write the answer and stop', 'Записать ответ и остановиться'), L('Multiply again', 'Снова умножить'), L('Add the digits', 'Сложить цифры')],
            L('After Sister (Subtract) comes Brother (Bring down), then the family starts again.', 'После Сестры (вычитаем) идёт Брат (сносим), и семья начинает снова.'), rng),
        concept(skill, `quotient-${n}`, L(`In ${fmt(n, 'en')} ÷ ${d} = ${q}, which number is the quotient?`, `В примере ${fmt(n, 'ru')} ÷ ${d} = ${q} какое число - частное?`),
            L(String(q), String(q)), [L(fmt(n, 'en'), fmt(n, 'ru')), L(String(d), String(d)), L(fmt(n - d, 'en'), fmt(n - d, 'ru'))],
            L('The quotient is the answer of a division.', 'Частное - это ответ деления.'), rng),
        concept(skill, `too-big-${x}-${d}`, L(`You subtracted and got ${x}, but the divisor is ${d}. What does that mean?`, `Ты вычла и получила ${x}, а делитель ${d}. Что это значит?`),
            L('The digit on top is too small, try one more', 'Цифра сверху слишком маленькая, попробуй на одну больше'),
            [L('Everything is fine, keep going', 'Всё хорошо, продолжай'), L('The digit on top is too big', 'Цифра сверху слишком большая'), L('Write a 0 on top', 'Напиши 0 сверху')],
            L(`What is left must be smaller than the divisor. ${x} is not smaller than ${d}, so ${d} fits one more time.`, `Остаток должен быть меньше делителя. ${x} не меньше ${d}, значит ${d} поместится ещё раз.`), rng),
        concept(skill, `zero-${small}-${d}`, L(`You bring down a digit and get ${small}. The divisor is ${d}. What do you write in the quotient?`, `Ты снесла цифру и получила ${small}. Делитель ${d}. Что написать в частное?`),
            L('0', '0'), [L('Nothing, skip it', 'Ничего, пропустить'), L(String(small), String(small)), L('1', '1')],
            L(`${d} does not fit into ${small}, so the quotient digit is 0. Never skip it!`, `${d} не помещается в ${small}, значит цифра частного 0. Её нельзя пропускать!`), rng),
    ];
};

const concepts: Partial<Record<SkillId, (rng: Rng) => Problem[]>> = {
    'div-facts': rng => {
        const d = int(rng, 2, 9), q = int(rng, 2, 10), n = d * q;
        return [
            concept('div-facts', `partner-${n}-${d}`, L(`Which multiplication fact helps you find ${n} ÷ ${d}?`, `Какой пример на умножение помогает найти ${n} ÷ ${d}?`),
                L(`${d} × ${q} = ${n}`, `${d} × ${q} = ${n}`), [L(`${d} + ${q} = ${d + q}`, `${d} + ${q} = ${d + q}`), L(`${n} × ${d} = ${n * d}`, `${n} × ${d} = ${n * d}`), L(`${d} × ${q + 1} = ${d * (q + 1)}`, `${d} × ${q + 1} = ${d * (q + 1)}`)],
                L(`${d} × ${q} = ${n} is the partner of ${n} ÷ ${d} = ${q}.`, `${d} × ${q} = ${n} - друг примера ${n} ÷ ${d} = ${q}.`), rng),
            concept('div-facts', `family-${n}-${d}`, L(`${n} ÷ ${d} = ${q}. Which one is in the same fact family?`, `${n} ÷ ${d} = ${q}. Какой пример из той же семьи?`),
                L(`${n} ÷ ${q} = ${d}`, `${n} ÷ ${q} = ${d}`), [L(`${q} ÷ ${d} = ${n}`, `${q} ÷ ${d} = ${n}`), L(`${n} − ${d} = ${q}`, `${n} − ${d} = ${q}`), L(`${d} ÷ ${n} = ${q}`, `${d} ÷ ${n} = ${q}`)],
                L(`The fact family of ${d}, ${q} and ${n}: ${d} × ${q} = ${n}, ${q} × ${d} = ${n}, ${n} ÷ ${d} = ${q}, ${n} ÷ ${q} = ${d}.`, `Семья чисел ${d}, ${q} и ${n}: ${d} × ${q} = ${n}, ${q} × ${d} = ${n}, ${n} ÷ ${d} = ${q}, ${n} ÷ ${q} = ${d}.`), rng),
            concept('div-facts', `skip-${n}-${d}`, L(`You skip-count by ${d} until you reach ${n}. How many jumps is that?`, `Ты считаешь через ${d}, пока не дойдёшь до ${n}. Сколько это прыжков?`),
                L(String(q), String(q)), [L(String(q + 1), String(q + 1)), L(String(n - d), String(n - d)), L(String(d), String(d))].filter(o => o.en !== String(q)),
                L(`${Array.from({ length: q }, (_, i) => (i + 1) * d).join(', ')}: ${q} jumps, so ${n} ÷ ${d} = ${q}.`, `${Array.from({ length: q }, (_, i) => (i + 1) * d).join(', ')}: ${q} ${ruPlural(q, 'прыжок', 'прыжка', 'прыжков')}, значит ${n} ÷ ${d} = ${q}.`), rng),
        ];
    },
    'div-rem': rng => {
        const d = int(rng, 3, 9), q = int(rng, 3, 12), r = int(rng, 1, d - 1), n = d * q + r;
        return [
            concept('div-rem', `imp-${d}`, L(`Which remainder is IMPOSSIBLE when you divide by ${d}?`, `Какой остаток НЕВОЗМОЖЕН при делении на ${d}?`),
                L(String(d), String(d)), [L(String(d - 1), String(d - 1)), L('1', '1'), L('0', '0')],
                L(`A remainder must be smaller than ${d}. ${d} itself is too big: it would make one more group.`, `Остаток должен быть меньше ${d}. Само ${d} слишком большое: получилась бы ещё одна группа.`), rng),
            concept('div-rem', `check-${n}-${d}`, L(`How do you check ${n} ÷ ${d} = ${q} R ${r}?`, `Как проверить ${n} ÷ ${d} = ${q} (остаток ${r})?`),
                L(`${q} × ${d} + ${r} = ${n}`, `${q} × ${d} + ${r} = ${n}`), [L(`${q} × ${d} − ${r} = ${n}`, `${q} × ${d} − ${r} = ${n}`), L(`${q} + ${d} + ${r} = ${n}`, `${q} + ${d} + ${r} = ${n}`), L(`${n} × ${d} = ${q}`, `${n} × ${d} = ${q}`)],
                L('Multiply the quotient by the divisor, then ADD the remainder.', 'Умножь частное на делитель и ПРИБАВЬ остаток.'), rng),
        ];
    },
    'div-word': rng => {
        const d = int(rng, 6, 9), q = int(rng, 4, 9), r = int(rng, 1, d - 1), n = d * q + r;
        return [
            concept('div-word', `up-${n}-${d}`, L(`${n} kids go on a trip, ${d} kids fit in one van. ${n} ÷ ${d} = ${q} R ${r}. How many vans do they need?`, `${n} ${ruPlural(n, 'ребёнок едет', 'ребёнка едут', 'детей едут')} на экскурсию, в один микроавтобус помещается ${d}. ${n} ÷ ${d} = ${q} (остаток ${r}). Сколько нужно микроавтобусов?`),
                L(String(q + 1), String(q + 1)), [L(String(q), String(q)), L(String(r), String(r)), L(String(q + r), String(q + r))],
                L(`${q} vans are full and ${r} ${r === 1 ? 'kid still needs' : 'kids still need'} a seat, so we round up to ${q + 1}.`, `${q} ${ruPlural(q, 'микроавтобус заполнен', 'микроавтобуса заполнены', 'микроавтобусов заполнены')}, а ещё ${r} ${ruPlural(r, 'ребёнку', 'детям', 'детям')} нужно место, поэтому округляем вверх до ${q + 1}.`), rng),
            concept('div-word', `down-${n}-${d}`, L(`${n} beads, ${d} beads make one bracelet. ${n} ÷ ${d} = ${q} R ${r}. How many whole bracelets?`, `${n} ${ruPlural(n, 'бусина', 'бусины', 'бусин')}, на один браслет нужно ${d}. ${n} ÷ ${d} = ${q} (остаток ${r}). Сколько целых браслетов?`),
                L(String(q), String(q)), [L(String(q + 1), String(q + 1)), L(String(r), String(r)), L(String(n), String(n))],
                L(`Only full bracelets count. ${r} ${r === 1 ? 'bead is' : 'beads are'} not enough for one more.`, `Считаются только целые браслеты. ${r} ${ruPlural(r, 'бусины', 'бусин', 'бусин')} на ещё один не хватит.`), rng),
        ];
    },
    'div-check': rng => {
        const d = int(rng, 3, 9), q = int(rng, 12, 99), n = d * q;
        return [concept('div-check', `how-${n}-${d}`, L(`How do you check ${fmt(n, 'en')} ÷ ${d} = ${q}?`, `Как проверить ${fmt(n, 'ru')} ÷ ${d} = ${q}?`),
            L(`Multiply ${q} × ${d}`, `Умножить ${q} × ${d}`), [L(`Add ${q} + ${d}`, `Сложить ${q} + ${d}`), L(`Divide ${q} ÷ ${d}`, `Разделить ${q} ÷ ${d}`), L(`Subtract ${fmt(n, 'en')} − ${q}`, `Вычесть ${fmt(n, 'ru')} − ${q}`)],
            L('Multiplication undoes division: quotient × divisor = dividend.', 'Умножение отменяет деление: частное × делитель = делимое.'), rng)];
    },
    'speed-basic': rng => {
        const t = int(rng, 2, 5), s = 10 * int(rng, 3, 9), d = s * t;
        return [
            concept('speed-basic', 'formula', L('Which rule gives the average speed?', 'Какое правило даёт среднюю скорость?'),
                L('distance ÷ time', 'расстояние ÷ время'), [L('distance × time', 'расстояние × время'), L('time ÷ distance', 'время ÷ расстояние'), L('distance + time', 'расстояние + время')],
                L('Speed tells the distance in ONE hour, so we share the distance over the hours.', 'Скорость - это расстояние за ОДИН час, поэтому делим расстояние на часы.'), rng),
            concept('speed-basic', `mean-${d}-${t}`, L(`${d} miles in ${t} hours. What does that mean?`, `${d} миль за ${t} ч. Что это значит?`),
                L(`About ${s} miles each hour`, `Примерно ${s} миль за каждый час`), [L(`${d} miles each hour`, `${d} миль за каждый час`), L(`${d * t} miles each hour`, `${d * t} миль за каждый час`), L(`${t} miles each hour`, `${t} миль за каждый час`)],
                L(`${d} ÷ ${t} = ${s}.`, `${d} ÷ ${t} = ${s}.`), rng),
            concept('speed-basic', 'faster', L('A car and a train go the same distance. The train takes less time. Which is faster?', 'Машина и поезд проезжают одно и то же расстояние. Поезду нужно меньше времени. Кто быстрее?'),
                L('The train', 'Поезд'), [L('The car', 'Машина'), L('They are the same', 'Одинаково'), L('We cannot tell', 'Нельзя сказать')],
                L('Same distance in less time means a bigger speed.', 'То же расстояние за меньшее время - значит скорость больше.'), rng),
        ];
    },
    'speed-find': rng => [
        concept('speed-find', 'dist', L('You know the speed and the time. How do you find the distance?', 'Известны скорость и время. Как найти расстояние?'),
            L('speed × time', 'скорость × время'), [L('speed ÷ time', 'скорость ÷ время'), L('time ÷ speed', 'время ÷ скорость'), L('speed + time', 'скорость + время')],
            L('Every hour adds the speed again: multiply.', 'Каждый час добавляет ещё одну скорость: умножаем.'), rng),
        concept('speed-find', 'time', L('You know the distance and the speed. How do you find the time?', 'Известны расстояние и скорость. Как найти время?'),
            L('distance ÷ speed', 'расстояние ÷ скорость'), [L('distance × speed', 'расстояние × скорость'), L('speed ÷ distance', 'скорость ÷ расстояние'), L('distance − speed', 'расстояние − скорость')],
            L('How many speeds fit into the distance? That many hours.', 'Сколько раз скорость помещается в расстоянии - столько и часов.'), rng),
    ],
    'speed-trip': rng => [
        concept('speed-trip', 'whole', L('How do you find the average speed of a WHOLE trip with several parts?', 'Как найти среднюю скорость ВСЕЙ поездки из нескольких частей?'),
            L('All the distance ÷ all the time', 'Всё расстояние ÷ всё время'), [L('Add the speeds and divide by the number of parts', 'Сложить скорости и разделить на число частей'), L('Take the fastest speed', 'Взять самую большую скорость'), L('Add all the speeds', 'Сложить все скорости')],
            L('Parts can take different times, so only total distance ÷ total time is correct.', 'Части могут длиться разное время, поэтому верно только всё расстояние ÷ всё время.'), rng),
        concept('speed-trip', 'leg', L('A part of the trip shows the speed and the time. How do you get its distance?', 'У части поездки даны скорость и время. Как найти её расстояние?'),
            L('speed × time', 'скорость × время'), [L('speed ÷ time', 'скорость ÷ время'), L('speed + time', 'скорость + время'), L('You cannot', 'Никак')],
            L('Distance = speed × time.', 'Расстояние = скорость × время.'), rng),
    ],
    'speed-units': rng => {
        const h = int(rng, 2, 5);
        return [
            concept('speed-units', `h-${h}`, L(`How many minutes are in ${h} hours?`, `Сколько минут в ${h} часах?`),
                L(String(h * 60), String(h * 60)), [L(String(h * 100), String(h * 100)), L(String(h * 30), String(h * 30)), L(String(h + 60), String(h + 60))],
                L(`1 hour = 60 minutes, so ${h} × 60 = ${h * 60}.`, `1 час = 60 минут, значит ${h} × 60 = ${h * 60}.`), rng),
            concept('speed-units', 'half', L('How many minutes is half an hour?', 'Сколько минут в получасе?'),
                L('30', '30'), [L('50', '50'), L('15', '15'), L('60', '60')],
                L('60 ÷ 2 = 30.', '60 ÷ 2 = 30.'), rng),
        ];
    },
    'round': rng => {
        const n = int(rng, 1012, 9987);
        const r100 = Math.round(n / 100) * 100;
        return [
            concept('round', `look-${n}`, L(`To round ${fmt(n, 'en')} to the nearest hundred, which digit do you look at?`, `Чтобы округлить ${fmt(n, 'ru')} до сотен, на какую цифру смотришь?`),
                L(`${Math.floor(n / 10) % 10} (the tens digit)`, `${Math.floor(n / 10) % 10} (цифра десятков)`), [L(`${n % 10} (the ones digit)`, `${n % 10} (цифра единиц)`), L(`${Math.floor(n / 1000)} (the thousands digit)`, `${Math.floor(n / 1000)} (цифра тысяч)`), L('All of them', 'На все')],
                L('Look at the ONE digit just to the right of the hundreds place: the tens digit.', 'Смотрим на ОДНУ цифру справа от сотен - на цифру десятков.'), rng),
            concept('round', `which-${r100}`, L(`Which number rounds to ${fmt(r100, 'en')} when you round to the nearest hundred?`, `Какое число при округлении до сотен даёт ${fmt(r100, 'ru')}?`),
                L(fmt(r100 - 30, 'en'), fmt(r100 - 30, 'ru')), [L(fmt(r100 - 70, 'en'), fmt(r100 - 70, 'ru')), L(fmt(r100 + 60, 'en'), fmt(r100 + 60, 'ru')), L(fmt(r100 + 150, 'en'), fmt(r100 + 150, 'ru'))],
                L(`${fmt(r100 - 30, 'en')} has 7 in the tens place, so it rounds up to ${fmt(r100, 'en')}.`, `У ${fmt(r100 - 30, 'ru')} в десятках 7, поэтому оно округляется вверх до ${fmt(r100, 'ru')}.`), rng),
        ];
    },
    'est-sum': rng => [concept('est-sum', 'first', L('What is the first step when you estimate a sum by rounding?', 'Какой первый шаг, когда прикидываешь сумму округлением?'),
        L('Round each number', 'Округлить каждое число'), [L('Add the exact numbers', 'Сложить точные числа'), L('Round only the biggest number', 'Округлить только самое большое число'), L('Subtract the numbers', 'Вычесть числа')],
        L('Round each number first, then add the easy numbers.', 'Сначала округлить каждое число, потом сложить удобные числа.'), rng)],
    'est-product': rng => {
        const [a, b] = pick(rng, [[5, 4], [6, 5], [4, 5], [8, 5], [2, 5]]);
        const p = a * 10 * b * 10;
        return [concept('est-product', `zeros-${a}-${b}`, L(`What is ${a}0 × ${b}0?`, `Сколько будет ${a}0 × ${b}0?`),
            L(fmt(p, 'en'), fmt(p, 'ru')), [L(fmt(p / 10, 'en'), fmt(p / 10, 'ru')), L(fmt(p * 10, 'en'), fmt(p * 10, 'ru')), L(fmt(a * b + 20, 'en'), fmt(a * b + 20, 'ru'))],
            L(`${a} × ${b} = ${a * b}, then add 2 zeros: ${fmt(p, 'en')}.`, `${a} × ${b} = ${a * b}, потом дописываем 2 нуля: ${fmt(p, 'ru')}.`), rng)];
    },
    'multiply': rng => {
        const a1 = 10 * int(rng, 2, 8), a0 = int(rng, 2, 9), b1 = 10 * int(rng, 2, 8), b0 = int(rng, 2, 9);
        const a = a1 + a0, b = b1 + b0;
        const parts = [a1 * b1, a1 * b0, a0 * b1, a0 * b0];
        return [concept('multiply', `parts-${a}-${b}`, L(`Which parts add up to ${a} × ${b}?`, `Какие части в сумме дают ${a} × ${b}?`),
            L(parts.map(x => fmt(x, 'en')).join(' + '), parts.map(x => fmt(x, 'ru')).join(' + ')), [L(`${fmt(parts[0], 'en')} + ${parts[3]}`, `${fmt(parts[0], 'ru')} + ${parts[3]}`), L(`${fmt(parts[0], 'en')} + ${fmt(parts[1], 'en')}`, `${fmt(parts[0], 'ru')} + ${fmt(parts[1], 'ru')}`), L(`${fmt(a1 * b1, 'en')} + ${a0 + b0}`, `${fmt(a1 * b1, 'ru')} + ${a0 + b0}`)],
            L(`Four parts: ${a1}×${b1}, ${a1}×${b0}, ${a0}×${b1} and ${a0}×${b0}. Do not forget the middle ones!`, `Четыре части: ${a1}×${b1}, ${a1}×${b0}, ${a0}×${b1} и ${a0}×${b0}. Не забудь средние!`), rng)];
    },
};

const conceptFor = (skill: SkillId, rng: Rng): Problem => {
    if (skill === 'motion-ideas') return makeProblem('motion-ideas', rng);
    const list = (concepts[skill] ?? (r => longDivisionConcepts(skill, r)))(rng);
    return pick(rng, list);
};

// 1 question about the method + 2 fresh tasks of the same skill, every quiz different
export const buildQuiz = (skill: SkillId, rng: Rng, seen: Set<string>): Problem[] => {
    const q1 = conceptFor(skill, rng);
    const used = new Set([...seen, q1.id]);
    const q2 = makeFreshProblem(skill, rng, used);
    used.add(q2.id);
    const q3 = makeFreshProblem(skill, rng, used);
    return [q1, ...shuffle(rng, [q2, q3])];
};

export const QUIZ_PASS = 2;
