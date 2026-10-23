import { type Answer, type L10n, type Problem, type Rng, type SkillId, L, choice, fmt, int, pick, ruPlural, shuffle } from './core';
import { kidName, ITEMS, CONTAINERS, type Item } from './words';

// ---------- long division (US layout: quotient above the dividend) ----------

export type LongStep = {
    part: number;       // the number we divide in this step
    digit: number;      // quotient digit written above
    product: number;    // digit * divisor
    rest: number;       // part - product
    column: number;     // index of the dividend digit the quotient digit sits above
    broughtDown?: number; // next digit brought down after this step
};

// Standard algorithm: start with the leading digits that are at least the divisor, then one digit per step.
// A digit that is too small after a bring-down gives a 0 in the quotient (the step kids skip most often).
export const longDivision = (dividend: number, divisor: number): { steps: LongStep[]; quotient: number; remainder: number } => {
    const digits = String(dividend).split('').map(Number);
    let i = 0;
    let part = digits[0];
    while (part < divisor && i < digits.length - 1) {
        i++;
        part = part * 10 + digits[i];
    }
    const steps: LongStep[] = [];
    let quotient = 0;
    for (;;) {
        const digit = Math.floor(part / divisor);
        const product = digit * divisor;
        const rest = part - product;
        quotient = quotient * 10 + digit;
        const step: LongStep = { part, digit, product, rest, column: i };
        if (i < digits.length - 1) {
            i++;
            step.broughtDown = digits[i];
            steps.push(step);
            part = rest * 10 + digits[i];
        } else {
            steps.push(step);
            return { steps, quotient, remainder: rest };
        }
    }
};

export const longDivisionText = (dividend: number, divisor: number): L10n[] => {
    const { steps, quotient, remainder } = longDivision(dividend, divisor);
    const lines: L10n[] = [];
    steps.forEach((s, k) => {
        if (k === 0 && String(dividend).length > 1) {
            const lead = Number(String(dividend)[0]);
            if (lead < divisor) lines.push(L(
                `${lead} is smaller than ${divisor}, so we start with ${s.part}.`,
                `${lead} меньше ${divisor}, поэтому начинаем с ${s.part}.`));
        }
        if (s.digit === 0 && s.part === 0) {
            lines.push(L(`Divide: 0 ÷ ${divisor} = 0. Write 0 in the quotient - do not skip it!`, `Делим: 0 ÷ ${divisor} = 0. Пишем 0 в частное - его нельзя пропускать!`));
        } else if (s.digit === 0) {
            lines.push(L(
                `Divide: ${divisor} does not fit into ${s.part}, because ${s.part} is smaller than ${divisor}. Write 0 in the quotient - do not skip it!`,
                `Делим: ${divisor} не помещается в ${s.part}, потому что ${s.part} меньше ${divisor}. Пишем 0 в частное - его нельзя пропускать!`));
        } else if (s.rest === 0) {
            lines.push(L(
                `Divide: ${fmt(s.part, 'en')} ÷ ${divisor} = ${s.digit}. Write ${s.digit} in the quotient.`,
                `Делим: ${fmt(s.part, 'ru')} ÷ ${divisor} = ${s.digit}. Пишем ${s.digit} в частное.`));
        } else {
            // not an exact division: say how many times it fits, never write 17 ÷ 3 = 5
            lines.push(L(
                `Divide: how many times does ${divisor} fit into ${fmt(s.part, 'en')}? ${s.digit} ${s.digit === 1 ? 'time' : 'times'}, because ${s.digit} × ${divisor} = ${fmt(s.product, 'en')} and ${s.digit + 1} × ${divisor} = ${fmt(s.product + divisor, 'en')} is too much. Write ${s.digit} in the quotient.`,
                `Делим: сколько раз ${divisor} помещается в ${fmt(s.part, 'ru')}? ${s.digit} ${ruPlural(s.digit, 'раз', 'раза', 'раз')}, потому что ${s.digit} × ${divisor} = ${fmt(s.product, 'ru')}, а ${s.digit + 1} × ${divisor} = ${fmt(s.product + divisor, 'ru')} - уже много. Пишем ${s.digit} в частное.`));
        }
        lines.push(L(
            `Multiply: ${s.digit} × ${divisor} = ${fmt(s.product, 'en')}. Subtract: ${fmt(s.part, 'en')} − ${fmt(s.product, 'en')} = ${s.rest}.`,
            `Умножаем: ${s.digit} × ${divisor} = ${fmt(s.product, 'ru')}. Вычитаем: ${fmt(s.part, 'ru')} − ${fmt(s.product, 'ru')} = ${s.rest}.`));
        if (s.broughtDown !== undefined) {
            lines.push(L(
                `Bring down the next digit ${s.broughtDown}: now we have ${s.rest * 10 + s.broughtDown}.`,
                `Сносим следующую цифру ${s.broughtDown}: получаем ${s.rest * 10 + s.broughtDown}.`));
        }
    });
    lines.push(remainder === 0
        ? L(`Nothing is left, so ${fmt(dividend, 'en')} ÷ ${divisor} = ${fmt(quotient, 'en')}.`,
            `Ничего не осталось, значит ${fmt(dividend, 'ru')} ÷ ${divisor} = ${fmt(quotient, 'ru')}.`)
        : L(`${remainder} is left and it is smaller than ${divisor}, so ${fmt(dividend, 'en')} ÷ ${divisor} = ${fmt(quotient, 'en')} R ${remainder}.`,
            `Осталось ${remainder}, это меньше ${divisor}, значит ${fmt(dividend, 'ru')} ÷ ${divisor} = ${fmt(quotient, 'ru')} (остаток ${remainder}).`));
    lines.push(remainder === 0
        ? L(`Check: ${fmt(quotient, 'en')} × ${divisor} = ${fmt(dividend, 'en')} ✓`, `Проверка: ${fmt(quotient, 'ru')} × ${divisor} = ${fmt(dividend, 'ru')} ✓`)
        : L(`Check: ${fmt(quotient, 'en')} × ${divisor} + ${remainder} = ${fmt(dividend, 'en')} ✓`, `Проверка: ${fmt(quotient, 'ru')} × ${divisor} + ${remainder} = ${fmt(dividend, 'ru')} ✓`));
    return lines;
};

// ---------- partial quotients (break the dividend apart by place value) ----------

export type Chunk = { take: number; times: number; left: number };

export const partialQuotients = (dividend: number, divisor: number): { chunks: Chunk[]; quotient: number; remainder: number } => {
    const chunks: Chunk[] = [];
    let left = dividend;
    let quotient = 0;
    for (let place = 1000; place >= 1; place /= 10) {
        const times = Math.floor(left / (divisor * place)) * place;
        if (times > 0) {
            left -= times * divisor;
            quotient += times;
            chunks.push({ take: times * divisor, times, left });
        }
    }
    return { chunks, quotient, remainder: left };
};

export const partialQuotientsText = (dividend: number, divisor: number): L10n[] => {
    const { chunks, quotient, remainder } = partialQuotients(dividend, divisor);
    const lines = chunks.map(c => L(
        `${fmt(c.times, 'en')} × ${divisor} = ${fmt(c.take, 'en')}. Take it away: ${fmt(c.left + c.take, 'en')} − ${fmt(c.take, 'en')} = ${fmt(c.left, 'en')}.`,
        `${fmt(c.times, 'ru')} × ${divisor} = ${fmt(c.take, 'ru')}. Отнимаем: ${fmt(c.left + c.take, 'ru')} − ${fmt(c.take, 'ru')} = ${fmt(c.left, 'ru')}.`));
    const sum = chunks.map(c => c.times);
    lines.push(L(
        `Add the parts: ${sum.map(s => fmt(s, 'en')).join(' + ')} = ${fmt(quotient, 'en')}${remainder ? `, ${remainder} left over` : ''}.`,
        `Складываем части: ${sum.map(s => fmt(s, 'ru')).join(' + ')} = ${fmt(quotient, 'ru')}${remainder ? `, в остатке ${remainder}` : ''}.`));
    return lines;
};

// ---------- generators ----------

const DIVISION_LEVELS: Partial<Record<SkillId, (rng: Rng) => { dividend: number; divisor: number }>> = {
    // facts stay inside the 10 × 10 multiplication table
    'div-facts': rng => { const d = int(rng, 2, 9); return { dividend: d * int(rng, 2, 10), divisor: d }; },
    // 2-digit: quotient at least 11 so a real two-step division happens
    'div-2d': rng => { const d = int(rng, 2, 8); const q = int(rng, 11, Math.floor(99 / d)); return { dividend: d * q, divisor: d }; },
    'div-3d': rng => {
        const d = int(rng, 2, 9);
        for (;;) {
            const q = int(rng, Math.ceil(100 / d), Math.floor(999 / d));
            if (!String(q).includes('0') && q >= 12) return { dividend: d * q, divisor: d };
        }
    },
    'div-zero': rng => {
        const d = int(rng, 2, 9);
        for (;;) {
            const q = int(rng, 101, Math.min(1999, Math.floor(9999 / d)));
            const s = String(q);
            // a zero inside or at the end of the quotient, never only a leading one
            if (s.slice(1).includes('0') && d * q >= 100) return { dividend: d * q, divisor: d };
        }
    },
    'div-4d': rng => { const d = int(rng, 2, 9); const q = int(rng, Math.ceil(1000 / d), Math.floor(9999 / d)); return { dividend: d * q, divisor: d }; },
    'div-rem': rng => {
        const d = int(rng, 3, 9);
        const q = pick(rng, [int(rng, 4, 12), int(rng, 12, 99), int(rng, 100, 999)]);
        const r = int(rng, 1, d - 1);
        return { dividend: d * q + r, divisor: d };
    },
};

const ruCount = (n: number, item: Item) => `${fmt(n, 'ru')} ${ruPlural(n, item.ru[0], item.ru[1], item.ru[2])}`;
const enCount = (n: number, item: Item) => `${fmt(n, 'en')} ${n === 1 ? item.en[0] : item.en[1]}`;

type Story = { max: number; min?: number; maxDivisor?: number; minDivisor?: number; make: (n: string, nr: string, dividend: number, divisor: number) => L10n };

// Stories from Ameliia's life: piano and flute, gymnastics, painting, books, cafes, playgrounds, the iPad.
// Each story only takes numbers that make sense for it (no 7,056 kids on a playground).
const STORIES: Story[] = [
    // she and Mom love the Harry Potter books and movies
    { max: 800, min: 100, make: (n, nr, x, d) => L(`Ameliia reads a Harry Potter book with ${n} pages in ${d} weeks, the same number of pages every week. How many pages does she read each week?`,
        `Амелия читает книгу о Гарри Поттере: ${nr} ${ruPlural(x, 'страница', 'страницы', 'страниц')} за ${d} ${ruPlural(d, 'неделю', 'недели', 'недель')}, каждую неделю одинаково. Сколько страниц она читает в неделю?`) },
    { max: 90, make: (n, nr, x, d) => L(`Mom bought ${n} chocolate frogs for a Harry Potter movie night with ${d} kids. Everyone gets the same number. How many frogs does each kid get?`,
        `Мама купила ${nr} ${ruPlural(x, 'шоколадную лягушку', 'шоколадные лягушки', 'шоколадных лягушек')} для вечера с фильмом о Гарри Поттере на ${d} ${ruPlural(d, 'ребёнка', 'детей', 'детей')}. Всем поровну. Сколько лягушек получит каждый?`) },
    { max: 450, make: (n, nr, _x, d) => L(`Ameliia practices piano for ${n} minutes in ${d} days, the same amount every day. How many minutes does she practice each day?`,
        `Амелия занимается на пианино ${nr} ${ruPlural(Number(nr.replace(/\s/g, '')), 'минуту', 'минуты', 'минут')} за ${d} ${ruPlural(d, 'день', 'дня', 'дней')}, каждый день одинаково. Сколько минут она занимается в день?`) },
    { max: 400, minDivisor: 2, maxDivisor: 4, make: (n, nr, x, d) => L(`A flute song has ${n} beats. Each measure has ${d} beats. How many measures does the song have?`,
        `В мелодии для флейты ${nr} ${ruPlural(x, 'доля', 'доли', 'долей')}. В каждом такте ${d} ${ruPlural(d, 'доля', 'доли', 'долей')}. Сколько тактов в мелодии?`) },
    { max: 300, make: (n, nr, x, d) => L(`At gymnastics Ameliia did ${n} cartwheels in ${d} practices, the same number each time. How many cartwheels did she do at each practice?`,
        `На гимнастике Амелия сделала ${nr} ${ruPlural(x, 'колесо', 'колеса', 'колёс')} за ${d} ${ruPlural(d, 'тренировку', 'тренировки', 'тренировок')}, каждый раз одинаково. Сколько колёс она делала на каждой тренировке?`) },
    { max: 120, make: (n, nr, x, d) => L(`Ameliia paints ${n} little flowers on ${d} pictures, the same number on each picture. How many flowers are on each picture?`,
        `Амелия рисует ${nr} ${ruPlural(x, 'цветочек', 'цветочка', 'цветочков')} на ${d} ${ruPlural(d, 'картине', 'картинах', 'картинах')}, на каждой поровну. Сколько цветочков на каждой картине?`) },
    { max: 200, make: (n, nr, x, d) => L(`The art class has ${n} tubes of paint for ${d} tables, the same number on every table. How many tubes does each table get?`,
        `В кружке рисования ${nr} ${ruPlural(x, 'тюбик', 'тюбика', 'тюбиков')} краски на ${d} ${ruPlural(d, 'стол', 'стола', 'столов')}, на каждый стол поровну. Сколько тюбиков на каждом столе?`) },
    { max: 200, make: (n, nr, x, d) => L(`Ameliia's coloring book has ${n} pictures. She paints ${d} pictures every day. In how many days will she paint the whole book?`,
        `В раскраске у Амелии ${nr} ${ruPlural(x, 'картинка', 'картинки', 'картинок')}. Она раскрашивает по ${d} в день. За сколько дней она раскрасит всю книгу?`) },
    { max: 500, make: (n, nr, x, d) => L(`Ameliia mixes ${n} drops of paint into ${d} jars to make the same new color in each jar. How many drops go into each jar?`,
        `Амелия раскладывает ${nr} ${ruPlural(x, 'каплю', 'капли', 'капель')} краски в ${d} ${ruPlural(d, 'баночку', 'баночки', 'баночек')} поровну, чтобы в каждой получился одинаковый цвет. Сколько капель в каждой баночке?`) },
    { max: 900, make: (n, nr, x, d) => L(`A new book has ${n} pages. Ameliia reads the same number of pages each day and finishes it in ${d} days. How many pages does she read a day?`,
        `В новой книге ${nr} ${ruPlural(x, 'страница', 'страницы', 'страниц')}. Амелия читает каждый день поровну и дочитывает за ${d} ${ruPlural(d, 'день', 'дня', 'дней')}. Сколько страниц она читает в день?`) },
    { max: 400, make: (n, nr, x, d) => L(`A cafe in Fort Lee bakes ${n} croissants and puts ${d} on each plate. How many plates does it fill?`,
        `Кафе в Форт-Ли испекло ${nr} ${ruPlural(x, 'круассан', 'круассана', 'круассанов')} и кладёт по ${d} на тарелку. Сколько тарелок получится?`) },
    { max: 200, make: (n, nr, x, d) => L(`An ice cream shop has ${n} scoops of chocolate ice cream. Each cup gets ${d} scoops. How many cups can they make?`,
        `В кафе-мороженом ${nr} ${ruPlural(x, 'шарик', 'шарика', 'шариков')} шоколадного мороженого. В каждый стаканчик кладут по ${d}. Сколько стаканчиков получится?`) },
    { max: 60, make: (n, nr, x, d) => L(`${n} kids at the playground split into ${d} equal teams for tag. How many kids are on each team?`,
        `На детской площадке ${nr} ${ruPlural(x, 'ребёнок', 'ребёнка', 'детей')} делятся на ${d} ${ruPlural(d, 'равную команду', 'равные команды', 'равных команд')} для игры в салки. Сколько детей в каждой команде?`) },
    { max: 500, make: (n, nr, x, d) => L(`Ameliia's iPad game has ${n} levels. She plays ${d} levels every day. How many days will it take to finish all the levels?`,
        `В игре на iPad у Амелии ${nr} ${ruPlural(x, 'уровень', 'уровня', 'уровней')}. Она проходит по ${d} в день. За сколько дней она пройдёт все уровни?`) },
    { max: 200, make: (n, nr, x, d) => L(`Grandma Sveta and Ameliia bake ${n} chocolate cookies and pack them into ${d} boxes for the family, the same number in each. How many cookies go in each box?`,
        `Бабушка Света и Амелия испекли ${nr} ${ruPlural(x, 'шоколадную печеньку', 'шоколадные печеньки', 'шоколадных печенек')} и разложили поровну в ${d} ${ruPlural(d, 'коробку', 'коробки', 'коробок')} для всей семьи. Сколько печенек в каждой коробке?`) },
    { max: 150, make: (n, nr, x, d) => L(`Ameliia helps little Martin build ${d} equal towers from his ${n} toy blocks. How many blocks are in each tower?`,
        `Амелия помогает маленькому Мартину построить ${d} ${ruPlural(d, 'одинаковую башню', 'одинаковые башни', 'одинаковых башен')} из ${nr} ${ruPlural(x, 'кубика', 'кубиков', 'кубиков')}. Сколько кубиков в каждой башне?`) },
    { max: 300, make: (n, nr, _x, d) => L(`Ameliia saves the same amount each week for the trip to Italy. After ${d} weeks she has $${n}. How many dollars does she save each week?`,
        `Амелия каждую неделю откладывает одинаковую сумму на поездку в Италию. Через ${d} ${ruPlural(d, 'неделю', 'недели', 'недель')} у неё $${nr}. Сколько долларов она откладывает в неделю?`) },
    // big numbers belong to big places
    { max: 9999, min: 500, make: (n, nr, x, d) => L(`A chocolate factory makes ${n} chocolate bars and packs them equally into ${d} trucks. How many chocolate bars go in each truck?`,
        `Шоколадная фабрика сделала ${nr} ${ruPlural(x, 'шоколадку', 'шоколадки', 'шоколадок')} и разложила их поровну в ${d} ${ruPlural(d, 'грузовик', 'грузовика', 'грузовиков')}. Сколько шоколадок в каждом грузовике?`) },
    { max: 9999, min: 500, make: (n, nr, x, d) => L(`The Fort Lee library has ${n} books on ${d} floors, the same number on each floor. How many books are on each floor?`,
        `В библиотеке Форт-Ли ${nr} ${ruPlural(x, 'книга', 'книги', 'книг')} на ${d} ${ruPlural(d, 'этаже', 'этажах', 'этажах')}, на каждом поровну. Сколько книг на каждом этаже?`) },
    { max: 9999, min: 500, make: (n, nr, x, d) => L(`A candy store has ${n} gummy bears in ${d} giant jars, the same number in each jar. How many gummy bears are in each jar?`,
        `В магазине сладостей ${nr} ${ruPlural(x, 'мармеладный мишка', 'мармеладных мишки', 'мармеладных мишек')} в ${d} ${ruPlural(d, 'огромной банке', 'огромных банках', 'огромных банках')}, в каждой поровну. Сколько мишек в каждой банке?`) },
    { max: 9999, min: 500, make: (n, nr, x, d) => L(`${n} people came to a gymnastics show and sat in ${d} equal sections. How many people sat in each section?`,
        `На выступление по гимнастике пришли ${nr} ${ruPlural(x, 'человек', 'человека', 'человек')} и сели в ${d} ${ruPlural(d, 'одинаковый сектор', 'одинаковых сектора', 'одинаковых секторов')}. Сколько человек в каждом секторе?`) },
];

const familyStory = (rng: Rng, dividend: number, divisor: number): L10n => {
    const who = kidName(rng);
    const item = pick(rng, ITEMS);
    const box = pick(rng, CONTAINERS);
    return rng() < 0.5
        ? L(`${who.en} has ${enCount(dividend, item)}. ${who.enShe} puts them equally into ${divisor} ${box.en[1]}. How many ${item.en[1]} go in each ${box.en[0]}?`,
            `У ${who.ruGen} ${ruCount(dividend, item)}. ${who.ruShe} раскладывает их поровну в ${divisor} ${ruPlural(divisor, box.ru[0], box.ru[1], box.ru[2])}. Сколько ${item.ru[2]} ${box.ruEach}?`)
        : L(`${who.en} has ${enCount(dividend, item)} and shares them equally among ${divisor} friends. How many ${item.en[1]} does each friend get?`,
            `У ${who.ruGen} ${ruCount(dividend, item)}. ${who.ruShe} делит их поровну между ${divisor} ${ruPlural(divisor, 'другом', 'друзьями', 'друзьями')}. Сколько ${item.ru[2]} достанется каждому?`);
};

export const shareStory = (rng: Rng, dividend: number, divisor: number): L10n => {
    const fits = STORIES.filter(s => dividend <= s.max && dividend >= (s.min ?? 0) && divisor >= (s.minDivisor ?? 2) && divisor <= (s.maxDivisor ?? 9));
    // small numbers: also the family's own things (stickers, beads); big numbers: only stories that fit
    if (dividend <= 300 && rng() < 0.35) return familyStory(rng, dividend, divisor);
    const s = pick(rng, fits);
    return s.make(fmt(dividend, 'en'), fmt(dividend, 'ru'), dividend, divisor);
};

const plainPrompt = (dividend: number, divisor: number) => L(`${fmt(dividend, 'en')} ÷ ${divisor} = ?`, `${fmt(dividend, 'ru')} ÷ ${divisor} = ?`);

const divisionHint = (dividend: number, divisor: number): L10n => {
    const lead = Number(String(dividend)[0]);
    return lead >= divisor
        ? L(`Start from the left: how many times does ${divisor} fit into ${lead}?`, `Начни слева: сколько раз ${divisor} помещается в ${lead}?`)
        : L(`${lead} is smaller than ${divisor}. Use the first two digits: how many times does ${divisor} fit into ${String(dividend).slice(0, 2)}?`,
            `${lead} меньше ${divisor}. Возьми первые две цифры: сколько раз ${divisor} помещается в ${String(dividend).slice(0, 2)}?`);
};

// facts are solved with the multiplication partner, not with long division
export const factSteps = (dividend: number, divisor: number): L10n[] => {
    const q = dividend / divisor;
    const skip = Array.from({ length: q }, (_, i) => (i + 1) * divisor);
    return [
        L(`Think of the multiplication partner: ${divisor} × ? = ${dividend}.`, `Вспомни друга-умножение: ${divisor} × ? = ${dividend}.`),
        L(`${divisor} × ${q} = ${dividend}, so ${dividend} ÷ ${divisor} = ${q}.`, `${divisor} × ${q} = ${dividend}, значит ${dividend} ÷ ${divisor} = ${q}.`),
        L(`Not sure? Skip-count by ${divisor}: ${skip.join(', ')}. That is ${q} jumps.`, `Не уверена? Считай через ${divisor}: ${skip.join(', ')}. Это ${q} ${ruPlural(q, 'прыжок', 'прыжка', 'прыжков')}.`),
    ];
};

const makeDivisionProblem = (rng: Rng, skill: SkillId): Problem => {
    const { dividend, divisor } = (DIVISION_LEVELS[skill] ?? DIVISION_LEVELS['div-3d']!)(rng);
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    // half of the tasks are stories so reading and math go together
    const story = skill !== 'div-rem' && rng() < 0.5;
    const prompt = story ? shareStory(rng, dividend, divisor) : plainPrompt(dividend, divisor);
    const answer: Answer = skill === 'div-rem' ? { kind: 'remainder', q: quotient, r: remainder } : { kind: 'number', value: quotient };
    const prefix = story ? [L(`We need ${fmt(dividend, 'en')} ÷ ${divisor}.`, `Нужно найти ${fmt(dividend, 'ru')} ÷ ${divisor}.`)] : [];
    const facts = skill === 'div-facts';
    return {
        id: `${skill}:${dividend}:${divisor}:${story ? 's' : 'p'}`,
        skill, topic: 'division', prompt, answer,
        steps: [...prefix, ...(facts ? factSteps(dividend, divisor) : longDivisionText(dividend, divisor))],
        hint: facts
            ? L(`Think: ${divisor} times what makes ${dividend}?`, `Подумай: ${divisor} умножить на сколько будет ${dividend}?`)
            : divisionHint(dividend, divisor),
        visual: facts ? { kind: 'groups', total: dividend, groups: divisor, icon: '⭐' } : { kind: 'longdiv', dividend, divisor },
        data: { dividend, divisor, quotient, remainder },
    };
};

// Interpreting remainders (4.OA.A.3): round up, drop it, or the remainder itself is the answer.
// Each context has its own realistic group size and full noun forms in both languages.
type Noun = { en: [string, string]; ru: [string, string, string] };
const N = (en1: string, en2: string, ru1: string, ru2: string, ru5: string): Noun => ({ en: [en1, en2], ru: [ru1, ru2, ru5] });
const en = (n: number, w: Noun) => `${fmt(n, 'en')} ${n === 1 ? w.en[0] : w.en[1]}`;
const ru = (n: number, w: Noun) => `${fmt(n, 'ru')} ${ruPlural(n, w.ru[0], w.ru[1], w.ru[2])}`;

const UP = [
    { d: [7, 9], thing: N('kid', 'kids', 'ребёнок', 'ребёнка', 'детей'), box: N('van', 'vans', 'микроавтобус', 'микроавтобуса', 'микроавтобусов'),
        en: (t: string, d: string) => `${t} are going on a field trip to the Liberty Science Center. Each van holds ${d}. How many vans do they need so every kid gets a seat?`,
        ru: (t: string, d: string) => `На экскурсию в Научный центр «Либерти» едут ${t}. В один микроавтобус помещается ${d}. Сколько нужно микроавтобусов, чтобы всем хватило места?` },
    { d: [6, 9], thing: N('book', 'books', 'книга', 'книги', 'книг'), box: N('shelf', 'shelves', 'полка', 'полки', 'полок'),
        en: (t: string, d: string) => `The school library got ${t}. Each shelf holds ${d}. How many shelves are needed so every book has a place?`,
        ru: (t: string, d: string) => `В школьную библиотеку привезли ${t}. На одну полку помещается ${d}. Сколько нужно полок, чтобы поместились все книги?` },
    { d: [4, 9], thing: N('cupcake', 'cupcakes', 'кекс', 'кекса', 'кексов'), box: N('box', 'boxes', 'коробка', 'коробки', 'коробок'),
        en: (t: string, d: string) => `Mom baked ${t} for the class party. A box holds ${d}. How many boxes does she need for all of them?`,
        ru: (t: string, d: string) => `Мама испекла ${t} для праздника в классе. В одну коробку помещается ${d}. Сколько нужно коробок для всех кексов?` },
];
const DOWN = [
    { d: [3, 9], thing: N('inch of ribbon', 'inches of ribbon', 'дюйм ленты', 'дюйма ленты', 'дюймов ленты'), made: N('bow', 'bows', 'бантик', 'бантика', 'бантиков'),
        en: (t: string, d: string) => `Ameliia has ${t}. One bow needs ${d}. How many whole bows can she make?`,
        ru: (t: string, d: string) => `У Амелии ${t}. На один бантик нужно ${d}. Сколько целых бантиков она сможет сделать?` },
    { d: [6, 9], thing: N('bead', 'beads', 'бусина', 'бусины', 'бусин'), made: N('bracelet', 'bracelets', 'браслет', 'браслета', 'браслетов'),
        en: (t: string, d: string) => `Ameliia has ${t}. A small bracelet needs ${d}. How many whole bracelets can she make?`,
        ru: (t: string, d: string) => `У Амелии ${t}. На маленький браслет нужно ${d}. Сколько целых браслетов она сможет сделать?` },
    { d: [3, 6], thing: N('strawberry', 'strawberries', 'клубничка', 'клубнички', 'клубничек'), made: N('fruit cup', 'fruit cups', 'стаканчик', 'стаканчика', 'стаканчиков'),
        en: (t: string, d: string) => `Grandma Sveta has ${t}. One fruit cup needs ${d}. How many full fruit cups can she make?`,
        ru: (t: string, d: string) => `У бабушки Светы ${t}. На один фруктовый стаканчик нужно ${d}. Сколько полных стаканчиков она сможет сделать?` },
];
const LEFT = [
    { thing: N('cookie', 'cookies', 'печенька', 'печеньки', 'печенек'),
        en: (t: string, d: number) => `Mom baked ${t}. They are shared equally among ${d} kids, each kid gets the same number. How many cookies are left over?`,
        ru: (t: string, d: number) => `Мама испекла ${t}. Их делят поровну между ${d} детьми. Сколько печенек останется?`, ruAcc: N('', '', 'печеньку', 'печеньки', 'печенек') },
    { thing: N('piece of saltwater taffy', 'pieces of saltwater taffy', 'ириска', 'ириски', 'ирисок'),
        en: (t: string, d: number) => `Ameliia brought ${t} from the boardwalk and shares them equally among ${d} friends. How many pieces are left over?`,
        ru: (t: string, d: number) => `Амелия привезла с набережной ${t} и делит их поровну между ${d} друзьями. Сколько ирисок останется?`, ruAcc: N('', '', 'ириску', 'ириски', 'ирисок') },
    { thing: N('Halloween candy', 'Halloween candies', 'конфета', 'конфеты', 'конфет'),
        en: (t: string, d: number) => `${t[0].toUpperCase()}${t.slice(1)} are shared equally among ${d} kids. How many candies are left over?`,
        ru: (t: string, d: number) => `${t} с Хэллоуина делят поровну между ${d} детьми. Сколько конфет останется?`, ruAcc: N('', '', 'конфету', 'конфеты', 'конфет') },
];

const makeWordProblem = (rng: Rng): Problem => {
    const kind = pick(rng, ['up', 'down', 'left'] as const);
    let prompt: L10n, value: number, why: L10n, divisor: number, q: number, r: number;
    if (kind === 'up') {
        const c = pick(rng, UP);
        divisor = int(rng, c.d[0], c.d[1]); q = int(rng, 2, 9); r = int(rng, 1, divisor - 1);
        const total = divisor * q + r;
        prompt = L(c.en(en(total, c.thing), en(divisor, c.thing)), c.ru(ru(total, c.thing), ru(divisor, c.thing)));
        value = q + 1;
        why = L(`${fmt(total, 'en')} ÷ ${divisor} = ${q} R ${r}. ${en(q, c.box)} ${q === 1 ? 'is' : 'are'} full, but ${en(r, c.thing)} still ${r === 1 ? 'needs' : 'need'} a place, so we need one more: ${q} + 1 = ${q + 1}.`,
            `${fmt(total, 'ru')} ÷ ${divisor} = ${q} (остаток ${r}). ${ru(q, c.box)} заполнены, но для остатка (${ru(r, c.thing)}) тоже нужно место, поэтому нужно на 1 больше: ${q} + 1 = ${q + 1}.`);
    } else if (kind === 'down') {
        const c = pick(rng, DOWN);
        divisor = int(rng, c.d[0], c.d[1]); q = int(rng, 2, 12); r = int(rng, 1, divisor - 1);
        const total = divisor * q + r;
        prompt = L(c.en(en(total, c.thing), en(divisor, c.thing)), c.ru(ru(total, c.thing), ru(divisor, c.thing)));
        value = q;
        why = L(`${fmt(total, 'en')} ÷ ${divisor} = ${q} R ${r}. The ${en(r, c.thing)} left over ${r === 1 ? 'is' : 'are'} not enough for one more ${c.made.en[0]}, so the answer is ${q}.`,
            `${fmt(total, 'ru')} ÷ ${divisor} = ${q} (остаток ${r}). Остаток (${ru(r, c.thing)}) - это меньше, чем нужно на ещё один ${c.made.ru[0]}, поэтому ответ ${q}.`);
    } else {
        const c = pick(rng, LEFT);
        divisor = int(rng, 3, 9); q = int(rng, 2, 9); r = int(rng, 1, divisor - 1);
        const total = divisor * q + r;
        prompt = L(c.en(en(total, c.thing), divisor), c.ru(ru(total, c.ruAcc), divisor));
        value = r;
        why = L(`${fmt(total, 'en')} ÷ ${divisor} = ${q} R ${r}. Everyone gets ${q}, and ${r} ${r === 1 ? 'is' : 'are'} left over.`,
            `${fmt(total, 'ru')} ÷ ${divisor} = ${q} (остаток ${r}). Каждый получит по ${q}, и останется ${r}.`);
    }
    const total = divisor * q + r;
    return {
        id: `div-word:${kind}:${total}:${divisor}:${prompt.en.slice(0, 14)}`,
        skill: 'div-word', topic: 'division', prompt,
        answer: { kind: 'number', value },
        steps: [...longDivisionText(total, divisor), why],
        hint: L(`First divide ${fmt(total, 'en')} by ${divisor}. Then think: what does the remainder mean in this story?`,
            `Сначала раздели ${fmt(total, 'ru')} на ${divisor}. Потом подумай: что значит остаток в этой истории?`),
        data: { dividend: total, divisor, quotient: q, remainder: r, kind },
    };
};

// Check by multiplication, or spot a classic mistake (the missing zero, a remainder that is too big)
const makeCheckProblem = (rng: Rng): Problem => {
    const style = int(rng, 0, 2);
    if (style === 0) {
        const d = int(rng, 2, 9), q = int(rng, 12, 250), dividend = d * q;
        const answer = choice(rng, L(`${fmt(q, 'en')} × ${d} = ${fmt(dividend, 'en')}`, `${fmt(q, 'ru')} × ${d} = ${fmt(dividend, 'ru')}`), [
            L(`${fmt(q, 'en')} + ${d} = ${fmt(q + d, 'en')}`, `${fmt(q, 'ru')} + ${d} = ${fmt(q + d, 'ru')}`),
            L(`${fmt(dividend, 'en')} × ${d} = ${fmt(dividend * d, 'en')}`, `${fmt(dividend, 'ru')} × ${d} = ${fmt(dividend * d, 'ru')}`),
            L(`${fmt(dividend, 'en')} − ${d} = ${fmt(dividend - d, 'en')}`, `${fmt(dividend, 'ru')} − ${d} = ${fmt(dividend - d, 'ru')}`),
        ]);
        return {
            id: `div-check:m:${dividend}:${d}`, skill: 'div-check', topic: 'division',
            prompt: L(`${fmt(dividend, 'en')} ÷ ${d} = ${fmt(q, 'en')}. Which multiplication proves it?`, `${fmt(dividend, 'ru')} ÷ ${d} = ${fmt(q, 'ru')}. Какое умножение это доказывает?`),
            answer,
            steps: [L(`Division and multiplication are a team: quotient × divisor = dividend.`, `Деление и умножение - команда: частное × делитель = делимое.`),
                L(`${fmt(q, 'en')} × ${d} = ${fmt(dividend, 'en')}, so the division is right.`, `${fmt(q, 'ru')} × ${d} = ${fmt(dividend, 'ru')}, значит деление верное.`)],
            hint: L('Multiply the answer by the number you divided by.', 'Умножь ответ на число, на которое делили.'),
            data: { dividend, divisor: d, quotient: q, remainder: 0, style },
        };
    }
    if (style === 1) {
        // the missing-zero mistake: 618 ÷ 3 written as 26 instead of 206
        let d = 2, q = 206;
        for (;;) {
            d = int(rng, 2, 9);
            q = int(rng, 101, 909);
            const s = String(q);
            if (s[1] === '0' && s[2] !== '0') break;
        }
        const dividend = d * q;
        const wrongQ = Number(String(q).replace('0', ''));
        const answer = choice(rng, L(`No, it should be ${fmt(q, 'en')}`, `Нет, должно быть ${fmt(q, 'ru')}`), [
            L('Yes, it is correct', 'Да, всё верно'),
            L(`No, it should be ${fmt(q * 10, 'en')}`, `Нет, должно быть ${fmt(q * 10, 'ru')}`),
            L(`No, it should be ${fmt(wrongQ + 1, 'en')}`, `Нет, должно быть ${fmt(wrongQ + 1, 'ru')}`),
        ]);
        return {
            id: `div-check:z:${dividend}:${d}`, skill: 'div-check', topic: 'division',
            prompt: L(`Pip the capybara wrote ${fmt(dividend, 'en')} ÷ ${d} = ${fmt(wrongQ, 'en')}. Is Pip right?`, `Капибара Пип написала ${fmt(dividend, 'ru')} ÷ ${d} = ${fmt(wrongQ, 'ru')}. Пип права?`),
            answer,
            steps: [L(`Check: ${fmt(wrongQ, 'en')} × ${d} = ${fmt(wrongQ * d, 'en')}, not ${fmt(dividend, 'en')}. Something is wrong!`, `Проверим: ${fmt(wrongQ, 'ru')} × ${d} = ${fmt(wrongQ * d, 'ru')}, а не ${fmt(dividend, 'ru')}. Что-то не так!`),
                ...longDivisionText(dividend, d)],
            hint: L('Multiply Pip\'s answer back. Did a zero go missing?', 'Умножь ответ Пип обратно. Не потерялся ли ноль?'),
            data: { dividend, divisor: d, quotient: q, remainder: 0, style },
        };
    }
    // a remainder must always be smaller than the divisor
    const d = int(rng, 3, 9), q = int(rng, 5, 60), r = int(rng, 1, d - 1), dividend = d * q + r;
    const answer = choice(rng, L(`No: ${fmt(q, 'en')} R ${r}`, `Нет: ${fmt(q, 'ru')} (остаток ${r})`), [
        L('Yes, it is correct', 'Да, всё верно'),
        L(`No: ${fmt(q + 1, 'en')} R ${r}`, `Нет: ${fmt(q + 1, 'ru')} (остаток ${r})`),
        L(`No: ${fmt(q - 1, 'en')} R ${r}`, `Нет: ${fmt(q - 1, 'ru')} (остаток ${r})`),
    ]);
    return {
        id: `div-check:r:${dividend}:${d}`, skill: 'div-check', topic: 'division',
        prompt: L(`Someone wrote ${fmt(dividend, 'en')} ÷ ${d} = ${fmt(q - 1, 'en')} R ${r + d}. Is it right?`, `Кто-то написал ${fmt(dividend, 'ru')} ÷ ${d} = ${fmt(q - 1, 'ru')} (остаток ${r + d}). Это верно?`),
        answer,
        steps: [L(`The remainder ${r + d} is bigger than ${d}. A remainder must always be smaller than the divisor, so ${d} fits one more time.`, `Остаток ${r + d} больше ${d}. Остаток всегда должен быть меньше делителя, значит ${d} поместится ещё раз.`),
            L(`${fmt(q - 1, 'en')} + 1 = ${fmt(q, 'en')} and ${r + d} − ${d} = ${r}. Answer: ${fmt(q, 'en')} R ${r}.`, `${fmt(q - 1, 'ru')} + 1 = ${fmt(q, 'ru')} и ${r + d} − ${d} = ${r}. Ответ: ${fmt(q, 'ru')} (остаток ${r}).`),
            L(`Check: ${fmt(q, 'en')} × ${d} + ${r} = ${fmt(dividend, 'en')} ✓`, `Проверка: ${fmt(q, 'ru')} × ${d} + ${r} = ${fmt(dividend, 'ru')} ✓`)],
        hint: L('Compare the remainder with the divisor. Which one must be smaller?', 'Сравни остаток с делителем. Кто из них должен быть меньше?'),
        data: { dividend, divisor: d, quotient: q, remainder: r, style },
    };
};

export const makeDivision = (rng: Rng, skill: SkillId): Problem => {
    if (skill === 'div-word') return makeWordProblem(rng);
    if (skill === 'div-check') return makeCheckProblem(rng);
    return makeDivisionProblem(rng, skill);
};
