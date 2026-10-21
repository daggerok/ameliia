import { type L10n, type Problem, type Rng, type SkillId, type Visual, L, SKILL_NAME, fmt, int, pick, ruPlural } from './core';
import { longDivisionText, partialQuotientsText } from './division';
import { makeProblem } from './index';
import { LOVE, WHY_MATH } from './messages';

export type Section =
    | { kind: 'story'; body: L10n }
    | { kind: 'idea'; title: L10n; body: L10n[] }
    | { kind: 'steps'; title: L10n; body: L10n[] }
    | { kind: 'example'; title: L10n; prompt: L10n; body: L10n[]; visual?: Visual }
    | { kind: 'warn'; title: L10n; body: L10n[] }
    | { kind: 'trick'; title: L10n; body: L10n[] }
    | { kind: 'life'; body: L10n }
    | { kind: 'love'; body: L10n };

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

const builders: Record<SkillId, (rng: Rng) => { hook: L10n[]; sections: Section[] }> = {
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
                L('Pip the owl once divided 618 by 3 and got 26. Grandpa Valerik laughed: "But 26 × 3 = 78, not 618!" Pip forgot the zero: the right answer is 206.', 'Сова Пип однажды разделила 618 на 3 и получила 26. Дедушка Валерик рассмеялся: «Но 26 × 3 = 78, а не 618!» Пип забыла ноль: правильный ответ 206.'),
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
                L('Pip the owl makes funny mistakes. Can you catch them? The secret weapon is multiplication.', 'Сова Пип делает смешные ошибки. Сможешь их поймать? Секретное оружие - умножение.'),
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

export const answerLine = (p: Problem): L10n => {
    const a = p.answer;
    if (a.kind === 'number') return L(`Answer: ${fmt(a.value, 'en')}`, `Ответ: ${fmt(a.value, 'ru')}`);
    if (a.kind === 'remainder') return L(`Answer: ${fmt(a.q, 'en')} R ${a.r}`, `Ответ: ${fmt(a.q, 'ru')} (остаток ${a.r})`);
    const o = a.options[a.correct];
    return L(`Answer: ${o.en}`, `Ответ: ${o.ru}`);
};

export const buildTheory = (skill: SkillId, rng: Rng, failed?: Problem): Theory => {
    const { hook, sections } = builders[skill](rng);
    const out: Section[] = [{ kind: 'story', body: pick(rng, hook) }, ...sections];
    // a brand-new worked example from the real task generator, so the theory never looks the same twice
    // never the same task as the one she just failed
    let fresh = makeProblem(skill, rng);
    for (let i = 0; i < 20 && failed && fresh.id === failed.id; i++) fresh = makeProblem(skill, rng);
    out.push({ kind: 'example', title: T.example2, prompt: fresh.prompt, body: [...fresh.steps, answerLine(fresh)], visual: fresh.visual });
    if (failed) out.push({ kind: 'example', title: T.yours, prompt: failed.prompt, body: [...failed.steps, answerLine(failed)], visual: failed.visual });
    out.push({ kind: 'life', body: pick(rng, WHY_MATH) });
    out.push({ kind: 'love', body: pick(rng, LOVE) });
    return { skill, title: SKILL_NAME[skill], sections: out };
};
