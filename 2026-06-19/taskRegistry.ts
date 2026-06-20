import { TaskGeneratorModule } from './types';

const getPencilString = (count: number, lang: 'ru' | 'en'): string => {
    if (lang === 'en') {
        return `${count} pencil${count > 1 ? 's' : ''}`;
    }
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} карандаш`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} карандаша`;
    return `${count} карандашей`;
};

export const registry: TaskGeneratorModule[] = [
    {
        id: 'ussr-g1-pencils',
        grade: 1,
        system: 'USSR',
        topicRu: 'Текстовая задача',
        topicEn: 'Word Problem',
        generateState: () => {
            const total = Math.floor(Math.random() * 5) + 6;
            const given = Math.floor(Math.random() * 3) + 2;
            const namesRu = ['Петя', 'Коля', 'Миша', 'Дима'];
            const namesEn = ['Peter', 'Nick', 'Mike', 'Dennis'];
            const nameIndex = Math.floor(Math.random() * namesRu.length);
            return { total, given, nameRu: namesRu[nameIndex], nameEn: namesEn[nameIndex] };
        },
        render: (state, lang) => {
            const remaining = state.total - state.given;
            if (lang === 'ru') {
                return {
                    question: `У ${state.nameRu} было ${getPencilString(state.total, 'ru')}. Он отдал другу ${getPencilString(state.given, 'ru')}. Сколько карандашей осталось?`,
                    explanation: `Из общего количества вычитаем отданные предметы: ${state.total} - ${state.given} = ${remaining}.`,
                    answerType: 'number',
                    correctAnswer: remaining
                };
            } else {
                return {
                    question: `${state.nameEn} had ${getPencilString(state.total, 'en')}. He gave ${getPencilString(state.given, 'en')} to his friend. How many pencils are left?`,
                    explanation: `Subtract the given items from the total: ${state.total} - ${state.given} = ${remaining}.`,
                    answerType: 'number',
                    correctAnswer: remaining
                };
            }
        }
    },
    {
        id: 'ussr-g1-add-over-ten',
        grade: 1,
        system: 'USSR',
        topicRu: 'Сложение',
        topicEn: 'Addition',
        generateState: () => {
            const a = Math.floor(Math.random() * 4) + 6;
            const b = Math.floor(Math.random() * 5) + 5;
            return { a, b };
        },
        render: (state, lang) => {
            const sum = state.a + state.b;
            const toTen = 10 - state.a;
            const rest = state.b - toTen;
            return {
                question: lang === 'ru' ? `Вычисли значение выражения: ${state.a} + ${state.b} = ?` : `Calculate: ${state.a} + ${state.b} = ?`,
                explanation: lang === 'ru'
                    ? `Дополняем ${state.a} до 10: берем ${toTen} из ${state.b} (остается ${rest}). Получаем 10 + ${rest} = ${sum}.`
                    : `First, make a ten: add ${toTen} to ${state.a} (leaving ${rest} from ${state.b}). Then add the rest: 10 + ${rest} = ${sum}.`,
                answerType: 'number',
                correctAnswer: sum
            };
        }
    },
    {
        id: 'us-g1-equality',
        grade: 1,
        system: 'US',
        topicRu: 'Равенства',
        topicEn: 'True Equality',
        generateState: () => {
            const a = Math.floor(Math.random() * 6) + 2;
            const b = Math.floor(Math.random() * 6) + 2;
            const c = Math.floor(Math.random() * (a + b - 1)) + 1;
            return { a, b, c };
        },
        render: (state, lang) => {
            const missing = (state.a + state.b) - state.c;
            return {
                question: lang === 'ru'
                    ? `Сделай равенство верным: ${state.a} + ${state.b} = ${state.c} + _`
                    : `Make the equation true: ${state.a} + ${state.b} = ${state.c} + _`,
                explanation: lang === 'ru'
                    ? `Левая часть равна ${state.a} + ${state.b} = ${state.a + state.b}. Чтобы правая часть была такой же, нужно к ${state.c} прибавить ${missing}.`
                    : `The left side is ${state.a} + ${state.b} = ${state.a + state.b}. To balance the right side, ${state.c} + ${missing} = ${state.a + state.b}.`,
                answerType: 'number',
                correctAnswer: missing
            };
        }
    },
    {
        id: 'us-g1-comparison',
        grade: 1,
        system: 'US',
        topicRu: 'Сравнение чисел',
        topicEn: 'Number Comparison',
        generateState: () => {
            const a = Math.floor(Math.random() * 90) + 10;
            const b = Math.floor(Math.random() * 90) + 10;
            return { a, b };
        },
        render: (state, lang) => {
            const symbol = state.a > state.b ? '>' : state.a < state.b ? '<' : '=';
            return {
                question: lang === 'ru'
                    ? `Какой знак делает равенство верным? ${state.a} [ _ ] ${state.b}. Введи '>', '<' или '='`
                    : `Which sign makes it true? ${state.a} [ _ ] ${state.b}. Type '>', '<' or '='`,
                explanation: lang === 'ru'
                    ? `Число ${state.a} ${state.a > state.b ? 'больше чем' : state.a < state.b ? 'меньше чем' : 'равно'} ${state.b}.`
                    : `${state.a} is ${state.a > state.b ? 'greater than' : state.a < state.b ? 'less than' : 'equal to'} ${state.b}.`,
                answerType: 'comparison',
                correctAnswer: symbol
            };
        }
    },
    {
        id: 'ussr-g2-equations',
        grade: 2,
        system: 'USSR',
        topicRu: 'Уравнения',
        topicEn: 'Equations',
        generateState: () => {
            const x = Math.floor(Math.random() * 20) + 5;
            const mod = Math.floor(Math.random() * 30) + 10;
            return { x, mod };
        },
        render: (state, lang) => {
            const sum = state.x + state.mod;
            return {
                question: lang === 'ru'
                    ? `Реши уравнение: x + ${state.mod} = ${sum}. Чему равен x?`
                    : `Solve the equation: x + ${state.mod} = ${sum}. Find x.`,
                explanation: lang === 'ru'
                    ? `Чтобы найти неизвестное слагаемое (x), вычитаем известное слагаемое из суммы: ${sum} - ${state.mod} = ${state.x}.`
                    : `To find the unknown addend (x), subtract the known addend from the sum: ${sum} - ${state.mod} = ${state.x}.`,
                answerType: 'number',
                correctAnswer: state.x
            };
        }
    },
    {
        id: 'us-g2-bar-fractions',
        grade: 2,
        system: 'US',
        topicRu: 'Доли и дроби',
        topicEn: 'Fractions Intro',
        generateState: () => {
            const totalParts = Math.floor(Math.random() * 4) + 3;
            const shadedParts = Math.floor(Math.random() * (totalParts - 1)) + 1;
            return { totalParts, shadedParts };
        },
        render: (state, lang) => {
            return {
                question: lang === 'ru'
                    ? `Какая доля фигуры закрашена синим цветом?`
                    : `What fraction of the diagram is shaded blue?`,
                explanation: lang === 'ru'
                    ? `Фигура разделена на ${state.totalParts} равных частей, из которых закрашено ${state.shadedParts}. Это составляет ${state.shadedParts}/${state.totalParts}.`
                    : `The shape is divided into ${state.totalParts} equal parts, and ${state.shadedParts} are shaded. This represents ${state.shadedParts}/${state.totalParts}.`,
                answerType: 'fraction',
                correctAnswer: { numerator: state.shadedParts, denominator: state.totalParts },
                visual: { type: 'bar', totalParts: state.totalParts, shadedParts: state.shadedParts }
            };
        }
    }
];
