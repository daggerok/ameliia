import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// types.ts
export type SchoolSystem = 'US' | 'USSR';
export type InputType = 'number' | 'fraction' | 'comparison' | 'text';
export type Gender = 'boy' | 'girl' | 'none';

export interface VisualData {
    type: 'circle' | 'bar' | 'none';
    totalParts?: number;
    shadedParts?: number;
}

export interface StudentProfile {
    name: string;
    gender: Gender;
}

export interface GeneratedTaskInstance {
    id: string;
    grade: number;
    system: SchoolSystem;
    topic: string; // Локализованная тема, которая покажется в конце
    question: string;
    explanation: string;
    answerType: InputType;
    correctAnswer: any;
    visual: VisualData;
}

export interface AppConfig {
    studentName: string;
    lang: 'ru' | 'en';
    theme: 'light' | 'dark' | 'system';
    avatarTheme: Gender;
    emoji: string;
    schoolSystem: 'US' | 'USSR' | 'both';
    gradeMode: {
        type: 'single' | 'range';
        grades: number[];
    };
    order: 'sequential' | 'shuffle';
}

export interface TaskGeneratorModule {
    id: string;
    grade: number;
    system: SchoolSystem;
    topicRu: string; // Тема на русском
    topicEn: string; // Тема на английском
    generateState: () => any;
    render: (state: any, lang: 'ru' | 'en', profile: StudentProfile) => {
        question: string;
        explanation: string;
        answerType: InputType;
        correctAnswer: any;
        visual?: VisualData;
    };
}

// taskRegistry.ts
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

// mathEngine.ts
export const generateTask = (
    grades: number[],
    chosenSystem: 'US' | 'USSR' | 'both',
    lang: 'ru' | 'en',
    profile: StudentProfile,
    forceModuleId?: string // Добавили параметр для Retry
): GeneratedTaskInstance => {

    // Если передан конкретный ID модуля (нажали Retry), берем строго его
    let selectedModule = forceModuleId ? registry.find(m => m.id === forceModuleId) : null;

    // Если ID не передан или модуль не найден, выбираем случайно по фильтрам
    if (!selectedModule) {
        const availableModules = registry.filter(m => {
            const gradeMatch = grades.includes(m.grade);
            const systemMatch = chosenSystem === 'both' ? true : m.system === chosenSystem;
            return gradeMatch && systemMatch;
        });

        if (availableModules.length === 0) {
            return {
                id: 'fallback',
                grade: 1,
                system: 'US',
                topic: lang === 'ru' ? 'Базовый счет' : 'Basic Math',
                question: '1 + 1 = ?',
                explanation: '1 + 1 = 2',
                answerType: 'number',
                correctAnswer: 2,
                visual: { type: 'none' }
            };
        }
        selectedModule = availableModules[Math.floor(Math.random() * availableModules.length)];
    }

    const taskState = selectedModule.generateState();
    const rendered = selectedModule.render(taskState, lang, profile);

    return {
        // Сохраняем оригинальный ID модуля, чтобы main.tsx знал, что перезапускать при Retry
        id: selectedModule.id,
        grade: selectedModule.grade,
        system: selectedModule.system,
        topic: lang === 'ru' ? selectedModule.topicRu : selectedModule.topicEn,
        question: rendered.question,
        explanation: rendered.explanation,
        answerType: rendered.answerType,
        correctAnswer: rendered.correctAnswer,
        visual: rendered.visual || { type: 'none' }
    };
};

// main.tsx
const DEFAULT_CONFIG: AppConfig = {
    studentName: 'Ameliia',
    lang: 'en',
    theme: 'system',
    avatarTheme: 'girl',
    emoji: '👧',
    schoolSystem: 'both',
    gradeMode: { type: 'range', grades: [1, 2, 3, 4] },
    order: 'shuffle'
};

const DICTIONARY = {
    en: {
        appTitle: 'MATH',
        practice: '✏️ Practice',
        menu: '⚙️ Menu',
        tasks: '✏️ Tasks',
        settings: 'Settings',
        studentName: 'Student Name',
        lang: 'Language',
        theme: 'App Theme',
        gender: 'Profile Gender',
        boy: 'Boy',
        girl: 'Girl',
        neutral: 'Neutral',
        emojiLabel: 'Avatar Emoji',
        noEmoji: 'No Emoji',
        curriculum: 'Curriculum',
        usCurriculum: 'US School (Common Core)',
        ussrCurriculum: 'USSR School (Arithmetic)',
        bothCurriculum: 'Both / Mixed',
        gradesScope: 'Grades Scope',
        export: 'Export',
        import: 'Import',
        reset: 'Reset to Defaults',
        resetConfirm: 'Reset all settings to default?',
        correct: 'Correct',
        total: 'Total',
        streak: 'Streak',
        check: 'Check',
        correctFeedback: '🎉 Correct!',
        explanationFeedback: '💡 Explanation:',
        nextTask: 'Next Task →',
        retryTask: '🔄 Retry',
        defaultStudent: 'Student',
        workspaceNeutral: 'Workspace',
        gradeLabel: 'Grade',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'System'
    },
    ru: {
        appTitle: 'МАТЕМАТИКА',
        practice: '✏️ Задачи',
        menu: '⚙️ Меню',
        tasks: '✏️ Упражнения',
        settings: 'Настройки',
        studentName: 'Имя ученика',
        lang: 'Язык интерфейса',
        theme: 'Тема оформления',
        gender: 'Пол профиля (для окончаний)',
        boy: 'Мальчик',
        girl: 'Девочка',
        neutral: 'Нейтральный',
        emojiLabel: 'Эмодзи аватара',
        noEmoji: 'Без эмодзи',
        curriculum: 'Программа обучения',
        usCurriculum: 'Школа США (Common Core)',
        ussrCurriculum: 'Школа СССР (Арифметика)',
        bothCurriculum: 'Обе системы / Вперемешку',
        gradesScope: 'Выбор классов',
        export: 'Экспорт',
        import: 'Импорт',
        reset: 'Сбросить настройки',
        resetConfirm: 'Сбросить все настройки до заводских?',
        correct: 'Верно',
        total: 'Всего',
        streak: 'Серия',
        check: 'Проверить',
        correctFeedback: '🎉 Правильно!',
        explanationFeedback: '💡 Объяснение:',
        nextTask: 'Следующее задание →',
        retryTask: '🔄 Попробовать ещё раз',
        defaultStudent: 'Ученик',
        workspaceNeutral: 'Рабочее пространство',
        gradeLabel: 'Класс',
        themeLight: 'Светлая',
        themeDark: 'Тёмная',
        themeSystem: 'Системная'
    }
};

const AVAILABLE_EMOJIS = [
    '👧', '👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿',
    '👦', '👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿',
    '🧑', '🧑🏻', '🧑🏼', '🧑🏽', '🧑🏾', '🧑🏿',
    '🐱', '🐶', '🦊', '🦁', '🦄', '🚀'
];

const TaskVisualizer: React.FC<{ data: VisualData }> = ({ data }) => {
    if (!data || data.type === 'none' || !data.totalParts) return null;

    if (data.type === 'bar') {
        const total = data.totalParts;
        const shaded = data.shadedParts || 0;
        const width = 500;
        const height = 70;
        const itemWidth = width / total;

        return (
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="mx-auto w-full max-w-xl my-4 md:my-6">
                {Array.from({ length: total }).map((_, i) => (
                    <rect
                        key={i}
                        x={i * itemWidth}
                        y={4}
                        width={itemWidth - 6}
                        height={height - 8}
                        fill={i < shaded ? '#6366f1' : '#f1f5f9'}
                        stroke="#1e293b"
                        strokeWidth="3"
                        rx="6"
                    />
                ))}
            </svg>
        );
    }
    return null;
};

const SettingsMenu: React.FC<{ config: AppConfig; onConfigChange: (c: AppConfig) => void }> = ({ config, onConfigChange }) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const t = DICTIONARY[config.lang];

    const update = (k: keyof AppConfig, v: any) => onConfigChange({ ...config, [k]: v });

    const handleGrade = (grade: number) => {
        let list = [...config.gradeMode.grades];
        list = list.includes(grade) ? list.filter(g => g !== grade) : [...list, grade].sort();
        if (list.length === 0) list = [1];
        update('gradeMode', { type: list.length > 1 ? 'range' : 'single', grades: list });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 lg:p-10 rounded-3xl shadow-2xl w-full space-y-4 md:space-y-6 border border-slate-100 dark:border-slate-700 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{t.settings}</h2>

            <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.studentName}</label>
                <input
                    type="text"
                    value={config.studentName}
                    onChange={e => update('studentName', e.target.value)}
                    className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                    <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.lang}</label>
                    <select value={config.lang} onChange={e => update('lang', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-base md:text-lg focus:outline-none transition-all">
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.theme}</label>
                    <select value={config.theme} onChange={e => update('theme', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-base md:text-lg focus:outline-none transition-all">
                        <option value="light">{t.themeLight}</option>
                        <option value="dark">{t.themeDark}</option>
                        <option value="system">{t.themeSystem}</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.gender}</label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <button onClick={() => update('avatarTheme', 'boy')} className={`p-2.5 md:p-3 rounded-2xl font-bold border text-xs md:text-base transition-all ${config.avatarTheme === 'boy' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>{t.boy}</button>
                    <button onClick={() => update('avatarTheme', 'girl')} className={`p-2.5 md:p-3 rounded-2xl font-bold border text-xs md:text-base transition-all ${config.avatarTheme === 'girl' ? 'bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-500/30' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>{t.girl}</button>
                    <button onClick={() => update('avatarTheme', 'none')} className={`p-2.5 md:p-3 rounded-2xl font-bold border text-xs md:text-base transition-all ${config.avatarTheme === 'none' ? 'bg-slate-600 text-white border-slate-600 shadow-lg shadow-slate-500/30' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>{t.neutral}</button>
                </div>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.emojiLabel}</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 border rounded-2xl bg-slate-50 dark:bg-slate-900 max-h-24 overflow-y-auto">
                    <button
                        onClick={() => update('emoji', '')}
                        className={`p-1.5 text-xs md:text-sm rounded-xl border font-bold transition-all ${config.emoji === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                    >
                        {t.noEmoji}
                    </button>
                    {AVAILABLE_EMOJIS.map(em => (
                        <button
                            key={em}
                            onClick={() => update('emoji', em)}
                            className={`p-1 text-xl md:text-2xl rounded-xl border transition-all hover:scale-125 ${config.emoji === em ? 'bg-indigo-500/20 border-indigo-500 scale-110' : 'border-transparent'}`}
                        >
                            {em}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.curriculum}</label>
                <select value={config.schoolSystem} onChange={e => update('schoolSystem', e.target.value)} className="w-full p-2.5 md:p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-lg focus:outline-none transition-all">
                    <option value="US">{t.usCurriculum}</option>
                    <option value="USSR">{t.ussrCurriculum}</option>
                    <option value="both">{t.bothCurriculum}</option>
                </select>
            </div>

            <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.gradesScope}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[1, 2, 3, 4].map(g => (
                        <label key={g} className="flex items-center justify-center gap-2 cursor-pointer p-2.5 border rounded-2xl bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 select-none hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                            <input type="checkbox" checked={config.gradeMode.grades.includes(g)} onChange={() => handleGrade(g)} className="w-4 h-4 md:w-5 md:h-5 accent-indigo-600 rounded" />
                            <span className="text-sm md:text-base font-bold">{t.gradeLabel} {g}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2.5 text-xs md:text-sm font-bold">
                <button onClick={() => {
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'math_config.json'; a.click();
                }} className="p-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">{t.export}</button>
                <button onClick={() => fileInput.current?.click()} className="p-2.5 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20">{t.import}</button>
                <input type="file" ref={fileInput} onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const r = new FileReader(); r.onload = evt => onConfigChange(JSON.parse(evt.target?.result as string)); r.readAsText(file);
                }} className="hidden" accept=".json" />
                <button onClick={() => { if(confirm(t.resetConfirm)) onConfigChange(DEFAULT_CONFIG); }} className="p-2.5 bg-rose-600 text-white rounded-2xl col-span-2 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20">{t.reset}</button>
            </div>
        </div>
    );
};

interface TaskDisplayProps {
    task: GeneratedTaskInstance;
    onAnswer: (c: boolean) => void;
    next: () => void;
    onRetry: () => void;
    lang: 'ru' | 'en';
}

const TaskDisplay: React.FC<TaskDisplayProps> = ({ task, onAnswer, next, onRetry, lang }) => {
    const [num, setNum] = useState('');
    const [den, setDen] = useState('');
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const [ok, setOk] = useState(false);
    const [isShaking, setIsShaking] = useState(false); // Стейт триггера тряски
    const t = DICTIONARY[lang];

    useEffect(() => {
        setNum('');
        setDen('');
        setText('');
        setDone(false);
    }, [task]);

    const check = (e: React.FormEvent) => {
        e.preventDefault(); if (done) return;
        let isOk = false;
        if (task.answerType === 'number') isOk = parseFloat(num) === task.correctAnswer;
        else if (task.answerType === 'comparison' || task.answerType === 'text') isOk = text.trim().toLowerCase() === String(task.correctAnswer).toLowerCase();
        else if (task.answerType === 'fraction') isOk = parseInt(num) === task.correctAnswer.numerator && parseInt(den) === task.correctAnswer.denominator;

        if (!isOk) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 400); // Сбрасываем класс после завершения анимации
        }

        setOk(isOk); setDone(true); onAnswer(isOk);
    };

    const inputStyle = "p-3 md:p-4 text-center border-3 border-indigo-500 rounded-2xl text-xl md:text-2xl lg:text-3xl font-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-600 dark:focus:ring-indigo-400 shadow-md transition-all";

    return (
        /* Вставляем динамические классы анимаций: появление всегда, тряска — при ошибке */
        <div className={`bg-white dark:bg-slate-800 p-6 md:p-8 lg:p-10 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700 animate-fade-in ${isShaking ? 'animate-shake' : ''}`}>

            <p className="text-xl md:text-2xl lg:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6 leading-relaxed pt-2">
                {task.question}
            </p>

            {task.visual && <TaskVisualizer data={task.visual} />}

            <form onSubmit={check} className="space-y-6">
                {!done ? (
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        {task.answerType === 'fraction' ? (
                            <div className="flex items-center gap-2">
                                <input type="number" value={num} onChange={e => setNum(e.target.value)} className={`${inputStyle} w-20 md:w-24 lg:w-28`} required />
                                <span className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-200">/</span>
                                <input type="number" value={den} onChange={e => setDen(e.target.value)} className={`${inputStyle} w-20 md:w-24 lg:w-28`} required />
                            </div>
                        ) : task.answerType === 'comparison' ? (
                            <input type="text" maxLength={1} value={text} onChange={e => setText(e.target.value)} className={`${inputStyle} w-24 md:w-28 lg:w-32`} placeholder="< >" required />
                        ) : (
                            <input type="number" value={num} onChange={e => setNum(e.target.value)} className={`${inputStyle} w-36 md:w-44 lg:w-52`} placeholder="?" required />
                        )}
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 md:py-4 lg:py-5 rounded-2xl text-lg md:text-xl lg:text-2xl font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                            {t.check}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className={`p-5 md:p-6 lg:p-8 rounded-2xl border-3 ${ok ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-950/20 dark:text-green-300' : 'bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-950/20 dark:text-rose-300'}`}>

                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-black tracking-wider uppercase opacity-60 mb-3 border-b pb-2 border-slate-300/40 dark:border-slate-600/40">
                <span className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-lg">
                  {t.gradeLabel} {task.grade}
                </span>
                                <span className="bg-slate-500/20 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg">
                  {task.system}
                </span>
                                <span className="text-slate-600 dark:text-slate-400 font-bold italic ml-auto normal-case">
                  {task.topic}
                </span>
                            </div>

                            <div className="font-black text-lg md:text-xl lg:text-2xl mb-2">{ok ? t.correctFeedback : t.explanationFeedback}</div>
                            <p className="text-base md:text-lg lg:text-xl font-medium mt-1 whitespace-pre-line opacity-95 leading-relaxed">{task.explanation}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {!ok ? (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 py-3.5 md:py-4 lg:py-5 rounded-2xl text-lg md:text-xl lg:text-2xl font-black transition-all active:scale-95 border border-slate-300 dark:border-slate-600"
                                >
                                    {t.retryTask}
                                </button>
                            ) : <div className="hidden md:block"></div>}

                            <button
                                type="button"
                                onClick={next}
                                className={`w-full bg-slate-900 dark:bg-indigo-600 text-white py-3.5 md:py-4 lg:py-5 rounded-2xl text-lg md:text-xl lg:text-2xl font-black shadow-xl hover:opacity-95 transition-all active:scale-95 ${!ok ? '' : 'col-span-1 md:col-span-2'}`}
                            >
                                {t.nextTask}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export const App: React.FC = () => {
    const [config, setConfig] = useState<AppConfig>(() => {
        const saved = localStorage.getItem('math_core_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('math_core_stats');
        return saved ? JSON.parse(saved) : { correct: 0, total: 0, streak: 0 };
    });
    const [task, setTask] = useState<GeneratedTaskInstance | null>(null);
    const [openMenu, setOpenMenu] = useState(false);

    const t = DICTIONARY[config.lang];

    useEffect(() => {
        localStorage.setItem('math_core_config', JSON.stringify(config));
        const el = document.documentElement;
        const dark = config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) el.classList.add('dark'); else el.classList.remove('dark');
    }, [config]);

    useEffect(() => { localStorage.setItem('math_core_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { handleNext(); }, [config.gradeMode.grades, config.schoolSystem, config.lang]);

    const handleNext = () => {
        const profile: StudentProfile = {
            name: config.studentName.trim(),
            gender: config.avatarTheme
        };
        setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang, profile));
    };

    const handleRetry = () => {
        if (!task) return;
        const profile: StudentProfile = {
            name: config.studentName.trim(),
            gender: config.avatarTheme
        };
        setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang, profile, task.id));
    };

    const handleResult = (ok: boolean) => setStats((p: any) => ({ correct: p.correct + (ok ? 1 : 0), total: p.total + 1, streak: ok ? p.streak + 1 : 0 }));

    const renderWorkspaceTitle = () => {
        const name = config.studentName.trim();
        if (!name) return t.workspaceNeutral;

        if (config.lang === 'ru') {
            if (config.avatarTheme === 'girl') return `Пространство ученицы: ${name}`;
            if (config.avatarTheme === 'boy') return `Пространство ученика: ${name}`;
            return `Пространство: ${name}`;
        }
        return `${name}'s Workspace`;
    };

    return (
        <div className="min-h-screen w-screen p-4 md:p-8 lg:p-12 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200 flex flex-col items-center justify-start md:justify-center overflow-x-hidden overflow-y-auto select-none">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl flex flex-col justify-center text-base md:text-lg lg:text-xl">
                <header className="flex justify-between items-center py-3 md:py-5 mb-2 w-full animate-fade-in">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest">
                            {t.appTitle}
                        </h1>
                        <p className="text-xs md:text-sm lg:text-base text-slate-400 font-bold mt-1">
                            {renderWorkspaceTitle()} {config.emoji}
                        </p>
                    </div>
                    <button onClick={() => setOpenMenu(!openMenu)} className="px-4 py-2 bg-white dark:bg-slate-800 shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm lg:text-base font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        {openMenu ? t.practice : t.menu}
                    </button>
                </header>

                {!openMenu && (
                    <div className="grid grid-cols-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-5 text-center text-white shadow-xl mb-6 w-full text-sm md:text-base font-bold animate-fade-in">
                        <div><div className="text-xl md:text-2xl lg:text-3xl font-black">{stats.correct}</div><div className="opacity-75 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.correct}</div></div>
                        <div><div className="text-base md:text-2xl lg:text-3xl font-black">{stats.total}</div><div className="opacity-75 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.total}</div></div>
                        <div><div className="text-xl md:text-2xl lg:text-3xl font-black">🔥 {stats.streak}</div><div className="opacity-75 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.streak}</div></div>
                    </div>
                )}

                <div className="w-full flex items-start justify-center pb-6">
                    {openMenu ? (
                        <SettingsMenu config={config} onConfigChange={setConfig} />
                    ) : (
                        task && <TaskDisplay task={task} onAnswer={handleResult} next={handleNext} onRetry={handleRetry} lang={config.lang} />
                    )}
                </div>
            </div>
        </div>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
