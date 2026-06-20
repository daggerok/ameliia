import { TaskGeneratorModule, StudentProfile } from './types';

// Хелпер для персонализации похвалы и обращений
const getPraise = (profile: StudentProfile, lang: 'ru' | 'en'): string => {
    const name = profile.name || (lang === 'ru' ? 'Ученик' : 'Student');
    if (lang === 'en') return `Great job, ${name}!`;

    if (profile.gender === 'girl') return `Умница, ${name}! Ты отлично справилась.`;
    if (profile.gender === 'boy') return `Молодец, ${name}! Ты отлично справился.`;
    return `Отличная работа, ${name}! Задание решено верно.`;
};

// Хелпер для персонализации действий (например: "Как ты думаешь, ..." или "Как ты думала, ...")
const getActionWord = (profile: StudentProfile, base: string): string => {
    if (profile.gender === 'girl') return base + 'а'; // решил -> решила
    if (profile.gender === 'boy') return base;        // решил -> решил
    return base + 'и';                                // решил -> решили (нейтрально-уважительное)
};

export const registry: TaskGeneratorModule[] = [
    // ==========================================
    // GRADE 1 (1 КЛАСС)
    // ==========================================

    // СССР: Сложение с переходом через десяток (Вариации формулировок)
    {
        id: 'ussr-g1-add',
        grade: 1,
        system: 'USSR',
        topicRu: 'Сложение через десяток',
        topicEn: 'Addition over 10',
        generateState: () => {
            const a = Math.floor(Math.random() * 4) + 6; // 6-9
            const b = Math.floor(Math.random() * 5) + 5; // 5-9
            const variation = Math.floor(Math.random() * 3); // 0, 1 или 2
            return { a, b, variation };
        },
        render: (state, lang, profile) => {
            const sum = state.a + state.b;
            let question = '';
            if (lang === 'ru') {
                if (state.variation === 0) question = `Вычисли: ${state.a} + ${state.b} = ?`;
                else if (state.variation === 1) question = `Найди сумму чисел ${state.a} и ${state.b}.`;
                else question = `Первое слагаемое ${state.a}, второе слагаемое ${state.b}. Чему равна сумма?`;
            } else {
                if (state.variation === 0) question = `Calculate: ${state.a} + ${state.b} = ?`;
                else if (state.variation === 1) question = `Find the sum of ${state.a} and ${state.b}.`;
                else question = `Add ${state.a} and ${state.b} together.`;
            }

            return {
                question,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `Разложим ${state.b}: сначала дополним ${state.a} до 10, прибавив ${10 - state.a}, а затем прибавим оставшиеся ${state.b - (10 - state.a)}. Ответ: ${sum}.`
                    : `Make a 10 first! ${state.a} + ${10 - state.a} = 10. Then add the rest: 10 + ${state.b - (10 - state.a)} = ${sum}.`}`,
                answerType: 'number',
                correctAnswer: sum
            };
        }
    },

    // US: Понятие равенства (Missing Addend)
    {
        id: 'us-g1-equality',
        grade: 1,
        system: 'US',
        topicRu: 'Истинные равенства',
        topicEn: 'True Equality',
        generateState: () => {
            const a = Math.floor(Math.random() * 6) + 2;
            const b = Math.floor(Math.random() * 6) + 2;
            const c = Math.floor(Math.random() * (a + b - 1)) + 1;
            const variation = Math.floor(Math.random() * 2);
            return { a, b, c, variation };
        },
        render: (state, lang, profile) => {
            const missing = (state.a + state.b) - state.c;
            const isLeftMissing = state.variation === 1;

            const eqStr = isLeftMissing
                ? `_ + ${state.c} = ${state.a} + ${state.b}`
                : `${state.a} + ${state.b} = ${state.c} + _`;

            return {
                question: lang === 'ru' ? `Сделай равенство верным: ${eqStr}` : `Make the equation true: ${eqStr}`,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `Обе стороны должны быть равны ${state.a + state.b}. Чтобы получить ${state.a + state.b}, к ${state.c} нужно прибавить ${missing}.`
                    : `Both sides must equal ${state.a + state.b}. To balance it, ${state.c} + ${missing} = ${state.a + state.b}.`}`,
                answerType: 'number',
                correctAnswer: missing
            };
        }
    },

    // ==========================================
    // GRADE 2 (2 КЛАСС)
    // ==========================================

    // СССР: Уравнения (Разные формулировки неизвестного)
    {
        id: 'ussr-g2-equations',
        grade: 2,
        system: 'USSR',
        topicRu: 'Уравнения',
        topicEn: 'Equations',
        generateState: () => {
            const x = Math.floor(Math.random() * 30) + 10;
            const known = Math.floor(Math.random() * 40) + 20;
            const sum = x + known;
            const variation = Math.floor(Math.random() * 3);
            return { x, known, sum, variation };
        },
        render: (state, lang, profile) => {
            let q = '';
            if (lang === 'ru') {
                if (state.variation === 0) q = `Реши уравнение: x + ${state.known} = ${state.sum}. Чему равен x?`;
                else if (state.variation === 1) q = `Какое число нужно прибавить к ${state.known}, чтобы получить ${state.sum}?`;
                else q = `Неизвестное число увеличили на ${state.known} и получили ${state.sum}. Найди это число.`;
            } else {
                if (state.variation === 0) q = `Solve for x: x + ${state.known} = ${state.sum}`;
                else if (state.variation === 1) q = `What number added to ${state.known} gives ${state.sum}?`;
                else q = `An unknown number was increased by ${state.known} to get ${state.sum}. What is the number?`;
            }

            return {
                question: q,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `Чтобы найти неизвестное слагаемое, нужно из суммы (${state.sum}) вычесть известное слагаемое (${state.known}). Получаем ${state.x}.`
                    : `Subtract the known addend (${state.known}) from the sum (${state.sum}) to find the missing part: ${state.x}.`}`,
                answerType: 'number',
                correctAnswer: state.x
            };
        }
    },

    // US: Массивы умножения (Arrays)
    {
        id: 'us-g2-arrays',
        grade: 2,
        system: 'US',
        topicRu: 'Основы умножения (Массивы)',
        topicEn: 'Multiplication Arrays',
        generateState: () => {
            const rows = Math.floor(Math.random() * 4) + 2; // 2-5
            const cols = Math.floor(Math.random() * 4) + 2; // 2-5
            const variation = Math.floor(Math.random() * 2);
            return { rows, cols, variation };
        },
        render: (state, lang, profile) => {
            const total = state.rows * state.cols;
            let q = '';
            if (lang === 'ru') {
                q = state.variation === 0
                    ? `У тебя есть сетка: ${state.rows} ряда по ${state.cols} квадратика в каждом. Сколько всего квадратиков?`
                    : `В саду посадили деревья: ${state.rows} ряда, в каждом ряду по ${state.cols} дерева. Сколько всего деревьев?`;
            } else {
                q = state.variation === 0
                    ? `An array has ${state.rows} rows and ${state.cols} columns. How many items are there in total?`
                    : `There are ${state.rows} rows of desks with ${state.cols} desks in each row. How many desks are there?`;
            }

            return {
                question: q,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `Мы умножаем количество рядов (${state.rows}) на количество элементов в ряду (${state.cols}): ${state.rows} × ${state.cols} = ${total}.`
                    : `Multiply the rows by the columns: ${state.rows} × ${state.cols} = ${total}.`}`,
                answerType: 'number',
                correctAnswer: total
            };
        }
    },

    // ==========================================
    // GRADE 3 (3 КЛАСС)
    // ==========================================

    // СССР: Скорость, Время, Расстояние (S = V * t)
    {
        id: 'ussr-g3-svt',
        grade: 3,
        system: 'USSR',
        topicRu: 'Движение (S = V × t)',
        topicEn: 'Speed, Time, Distance',
        generateState: () => {
            const v = Math.floor(Math.random() * 40) + 40; // Скорость 40-80 км/ч
            const t = Math.floor(Math.random() * 4) + 2;   // Время 2-5 часов
            const s = v * t;
            const type = Math.floor(Math.random() * 3);    // 0: найти S, 1: найти V, 2: найти t
            return { v, t, s, type };
        },
        render: (state, lang, profile) => {
            let q = ''; let exp = ''; let ans = 0;

            if (state.type === 0) { // Ищем S
                q = lang === 'ru' ? `Поезд ехал ${state.t} часа со скоростью ${state.v} км/ч. Какое расстояние он проехал?`
                    : `A train traveled for ${state.t} hours at a speed of ${state.v} km/h. What distance did it cover?`;
                exp = lang === 'ru' ? `Чтобы найти расстояние (S), нужно скорость умножить на время: ${state.v} × ${state.t} = ${state.s} км.`
                    : `Distance = Speed × Time. ${state.v} × ${state.t} = ${state.s} km.`;
                ans = state.s;
            } else if (state.type === 1) { // Ищем V
                q = lang === 'ru' ? `Машина проехала ${state.s} км за ${state.t} часа. С какой скоростью она двигалась?`
                    : `A car drove ${state.s} km in ${state.t} hours. What was its speed?`;
                exp = lang === 'ru' ? `Чтобы найти скорость (V), нужно расстояние разделить на время: ${state.s} ÷ ${state.t} = ${state.v} км/ч.`
                    : `Speed = Distance ÷ Time. ${state.s} ÷ ${state.t} = ${state.v} km/h.`;
                ans = state.v;
            } else { // Ищем t
                q = lang === 'ru' ? `Расстояние между городами ${state.s} км. За какое время автобус проедет этот путь, если его скорость ${state.v} км/ч?`
                    : `The distance between cities is ${state.s} km. How long will it take a bus traveling at ${state.v} km/h to cover it?`;
                exp = lang === 'ru' ? `Чтобы найти время (t), нужно расстояние разделить на скорость: ${state.s} ÷ ${state.v} = ${state.t} ч.`
                    : `Time = Distance ÷ Speed. ${state.s} ÷ ${state.v} = ${state.t} hours.`;
                ans = state.t;
            }

            return {
                question: q,
                explanation: `${getPraise(profile, lang)} ${exp}`,
                answerType: 'number',
                correctAnswer: ans
            };
        }
    },

    // US: Эквивалентные дроби
    {
        id: 'us-g3-eq-fractions',
        grade: 3,
        system: 'US',
        topicRu: 'Эквивалентные дроби',
        topicEn: 'Equivalent Fractions',
        generateState: () => {
            const baseNum = Math.floor(Math.random() * 2) + 1; // 1-2
            const baseDen = Math.floor(Math.random() * 3) + 3; // 3-5
            const mult = Math.floor(Math.random() * 3) + 2;    // 2-4
            const askNumerator = Math.random() > 0.5;
            return { baseNum, baseDen, mult, askNumerator };
        },
        render: (state, lang, profile) => {
            const newNum = state.baseNum * state.mult;
            const newDen = state.baseDen * state.mult;

            const eqStr = state.askNumerator
                ? `${state.baseNum}/${state.baseDen} = ?/${newDen}`
                : `${state.baseNum}/${state.baseDen} = ${newNum}/?`;

            return {
                question: lang === 'ru'
                    ? `Сделай дроби равными (введи только неизвестное число):\n\n${eqStr}`
                    : `Fill in the blank to make equivalent fractions (type the missing number):\n\n${eqStr}`,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `Обе части дроби были умножены на ${state.mult}. Следовательно, правильный ответ: ${state.askNumerator ? newNum : newDen}.`
                    : `Both the numerator and denominator are multiplied by ${state.mult}. The missing number is ${state.askNumerator ? newNum : newDen}.`}`,
                answerType: 'number',
                correctAnswer: state.askNumerator ? newNum : newDen
            };
        }
    },

    // ==========================================
    // GRADE 4 (4 КЛАСС)
    // ==========================================

    // СССР: Внетабличное умножение (Столбик)
    {
        id: 'ussr-g4-multiplication',
        grade: 4,
        system: 'USSR',
        topicRu: 'Умножение многозначных чисел',
        topicEn: 'Multi-digit Multiplication',
        generateState: () => {
            const a = Math.floor(Math.random() * 800) + 100; // 100-899
            const b = Math.floor(Math.random() * 90) + 10;   // 10-99
            return { a, b };
        },
        render: (state, lang, profile) => {
            return {
                question: lang === 'ru'
                    ? `Выполни умножение (письменно или в уме): ${state.a} × ${state.b} = ?`
                    : `Calculate: ${state.a} × ${state.b} = ?`,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `Произведение чисел ${state.a} и ${state.b} равно ${state.a * state.b}.`
                    : `The product of ${state.a} and ${state.b} is ${state.a * state.b}.`}`,
                answerType: 'number',
                correctAnswer: state.a * state.b
            };
        }
    },

    // US: Сложение дробей с одинаковым знаменателем
    {
        id: 'us-g4-fraction-addition',
        grade: 4,
        system: 'US',
        topicRu: 'Сложение дробей',
        topicEn: 'Adding Fractions',
        generateState: () => {
            const den = Math.floor(Math.random() * 6) + 4; // 4-9
            const num1 = Math.floor(Math.random() * (den - 2)) + 1;
            const num2 = Math.floor(Math.random() * (den - num1 - 1)) + 1;
            return { num1, num2, den };
        },
        render: (state, lang, profile) => {
            return {
                question: lang === 'ru'
                    ? `Сложи дроби: ${state.num1}/${state.den} + ${state.num2}/${state.den} = ?`
                    : `Add the fractions: ${state.num1}/${state.den} + ${state.num2}/${state.den} = ?`,
                explanation: `${getPraise(profile, lang)} ${lang === 'ru'
                    ? `При сложении дробей с одинаковым знаменателем мы просто складываем числители: ${state.num1} + ${state.num2} = ${state.num1 + state.num2}. Знаменатель остается ${state.den}.`
                    : `Add the numerators together while keeping the denominator the same: ${state.num1} + ${state.num2} = ${state.num1 + state.num2}.`}`,
                answerType: 'fraction',
                correctAnswer: { numerator: state.num1 + state.num2, denominator: state.den }
            };
        }
    }
];
