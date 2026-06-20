import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ========================================
// TYPES
// ========================================
export type SchoolSystem = 'US' | 'USSR';
export type InputType = 'number' | 'fraction' | 'comparison' | 'text';
export type Gender = 'boy' | 'girl' | 'none';
export type ColorTheme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet';

export interface VisualData {
    type: 'circle' | 'bar' | 'grid' | 'numberline' | 'none';
    totalParts?: number;
    shadedParts?: number;
    rows?: number;
    cols?: number;
    highlights?: number[];
    min?: number;
    max?: number;
    marked?: number[];
}

export interface StudentProfile {
    name: string;
    gender: Gender;
}

export interface GeneratedTaskInstance {
    id: string;
    grade: number;
    system: SchoolSystem;
    topic: string;
    question: string;
    explanationCorrect: string;
    explanationWrong: string;
    answerType: InputType;
    correctAnswer: any;
    visual: VisualData;
}

export interface HistoryEntry {
    taskId: string;
    grade: number;
    system: SchoolSystem;
    topic: string;
    correct: boolean;
    timestamp: number;
}

export interface AppConfig {
    studentName: string;
    lang: 'ru' | 'en';
    theme: 'light' | 'dark' | 'system';
    colorTheme: ColorTheme;
    avatarTheme: Gender;
    emoji: string;
    schoolSystem: 'US' | 'USSR' | 'both';
    gradeMode: {
        type: 'single' | 'range';
        grades: number[];
    };
    order: 'sequential' | 'shuffle';
    sound: boolean;
    timedMode: boolean;
    timerSeconds: number;
    showTaskMeta: boolean;
    allowTextSelection: boolean;
}

export interface TaskGeneratorModule {
    id: string;
    grade: number;
    system: SchoolSystem;
    topicRu: string;
    topicEn: string;
    generateState: () => any;
    render: (state: any, lang: 'ru' | 'en', profile: StudentProfile) => {
        question: string;
        explanationCorrect: string;
        explanationWrong: string;
        answerType: InputType;
        correctAnswer: any;
        visual?: VisualData;
    };
}

// ========================================
// SOUND ENGINE
// ========================================
const SoundEngine = {
    ctx: null as AudioContext | null,
    getCtx() {
        if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        return this.ctx;
    },
    playCorrect() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        } catch {}
    },
    playWrong() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
        } catch {}
    },
    playStreak() {
        try {
            const ctx = this.getCtx();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
                osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.3);
            });
        } catch {}
    },
    playTick() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
        } catch {}
    },
    playTimeout() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        } catch {}
    }
};

// ========================================
// HELPERS
// ========================================
const getPraise = (profile: StudentProfile, lang: 'ru' | 'en'): string => {
    const name = profile.name || (lang === 'ru' ? 'Ученик' : 'Student');
    if (lang === 'en') return `Great job, ${name}!`;
    if (profile.gender === 'girl') return `Умница, ${name}!`;
    if (profile.gender === 'boy') return `Молодец, ${name}!`;
    return `Отличная работа, ${name}!`;
};

const getEncouragement = (profile: StudentProfile, lang: 'ru' | 'en'): string => {
    const name = profile.name || (lang === 'ru' ? 'Ученик' : 'Student');
    if (lang === 'en') return `Not quite, ${name}. Let's see how it works:`;
    if (profile.gender === 'girl') return `Не расстраивайся, ${name}! Давай разберёмся:`;
    if (profile.gender === 'boy') return `Не расстраивайся, ${name}! Давай разберёмся:`;
    return `Ничего страшного, ${name}! Давай разберёмся:`;
};

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const simplifyFraction = (n: number, d: number) => {
    if (d === 0) return { n: 0, d: 1 };
    const g = gcd(Math.abs(n), Math.abs(d));
    return { n: n / g, d: d / g };
};

const fractionsEqual = (n1: number, d1: number, n2: number, d2: number): boolean => {
    const s1 = simplifyFraction(n1, d1);
    const s2 = simplifyFraction(n2, d2);
    return s1.n === s2.n && s1.d === s2.d;
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ========================================
// COLOR THEME SYSTEM
// ========================================
const COLOR_THEMES: Record<ColorTheme, { primary: string; primaryDark: string; gradient: string; ring: string; shadow: string; bg20: string; text: string; textDark: string; border: string }> = {
    indigo: { primary: 'bg-indigo-600', primaryDark: 'dark:bg-indigo-500', gradient: 'from-indigo-500 to-purple-600', ring: 'focus:ring-indigo-500/20', shadow: 'shadow-indigo-500/20', bg20: 'bg-indigo-500/20', text: 'text-indigo-600', textDark: 'dark:text-indigo-400', border: 'border-indigo-500' },
    emerald: { primary: 'bg-emerald-600', primaryDark: 'dark:bg-emerald-500', gradient: 'from-emerald-500 to-teal-600', ring: 'focus:ring-emerald-500/20', shadow: 'shadow-emerald-500/20', bg20: 'bg-emerald-500/20', text: 'text-emerald-600', textDark: 'dark:text-emerald-400', border: 'border-emerald-500' },
    rose: { primary: 'bg-rose-600', primaryDark: 'dark:bg-rose-500', gradient: 'from-rose-500 to-pink-600', ring: 'focus:ring-rose-500/20', shadow: 'shadow-rose-500/20', bg20: 'bg-rose-500/20', text: 'text-rose-600', textDark: 'dark:text-rose-400', border: 'border-rose-500' },
    amber: { primary: 'bg-amber-600', primaryDark: 'dark:bg-amber-500', gradient: 'from-amber-500 to-orange-600', ring: 'focus:ring-amber-500/20', shadow: 'shadow-amber-500/20', bg20: 'bg-amber-500/20', text: 'text-amber-600', textDark: 'dark:text-amber-400', border: 'border-amber-500' },
    sky: { primary: 'bg-sky-600', primaryDark: 'dark:bg-sky-500', gradient: 'from-sky-500 to-cyan-600', ring: 'focus:ring-sky-500/20', shadow: 'shadow-sky-500/20', bg20: 'bg-sky-500/20', text: 'text-sky-600', textDark: 'dark:text-sky-400', border: 'border-sky-500' },
    violet: { primary: 'bg-violet-600', primaryDark: 'dark:bg-violet-500', gradient: 'from-violet-500 to-fuchsia-600', ring: 'focus:ring-violet-500/20', shadow: 'shadow-violet-500/20', bg20: 'bg-violet-500/20', text: 'text-violet-600', textDark: 'dark:text-violet-400', border: 'border-violet-500' },
};

// ========================================
// EXPLANATION BUILDER
// ========================================
const makeExplanations = (
    profile: StudentProfile,
    lang: 'ru' | 'en',
    explanationBody: string
): { explanationCorrect: string; explanationWrong: string } => ({
    explanationCorrect: `${getPraise(profile, lang)} ${explanationBody}`,
    explanationWrong: `${getEncouragement(profile, lang)} ${explanationBody}`,
});

// ========================================
// TASK REGISTRY
// ========================================
export const registry: TaskGeneratorModule[] = [
    // ==========================================
    // GRADE 1 — USSR
    // ==========================================
    {
        id: 'ussr-g1-add-over-ten',
        grade: 1, system: 'USSR',
        topicRu: 'Сложение через десяток', topicEn: 'Addition over 10',
        generateState: () => {
            const a = randInt(6, 9); const b = randInt(5, 9);
            const v = randInt(0, 2);
            return { a, b, v };
        },
        render: (s, lang, profile) => {
            const sum = s.a + s.b;
            const q = lang === 'ru'
                ? [`Вычисли: ${s.a} + ${s.b} = ?`, `Найди сумму чисел ${s.a} и ${s.b}.`, `Первое слагаемое ${s.a}, второе слагаемое ${s.b}. Чему равна сумма?`][s.v]
                : [`Calculate: ${s.a} + ${s.b} = ?`, `Find the sum of ${s.a} and ${s.b}.`, `Add ${s.a} and ${s.b} together.`][s.v];
            const body = lang === 'ru'
                ? `Разложим ${s.b}: дополним ${s.a} до 10, прибавив ${10 - s.a}, затем прибавим ${s.b - (10 - s.a)}. Ответ: ${sum}.`
                : `Make 10 first: ${s.a} + ${10 - s.a} = 10, then 10 + ${s.b - (10 - s.a)} = ${sum}.`;
            return { question: q, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: sum };
        }
    },
    {
        id: 'ussr-g1-subtract',
        grade: 1, system: 'USSR',
        topicRu: 'Вычитание в пределах 20', topicEn: 'Subtraction within 20',
        generateState: () => {
            const a = randInt(11, 18); const b = randInt(3, 9);
            return { a, b };
        },
        render: (s, lang, profile) => {
            const diff = s.a - s.b;
            const body = `${s.a} − ${s.b} = ${diff}.`;
            return { question: lang === 'ru' ? `Вычисли: ${s.a} − ${s.b} = ?` : `Calculate: ${s.a} − ${s.b} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: diff };
        }
    },
    {
        id: 'ussr-g1-compare',
        grade: 1, system: 'USSR',
        topicRu: 'Сравнение чисел', topicEn: 'Comparing Numbers',
        generateState: () => {
            const a = randInt(1, 20); let b = randInt(1, 20);
            if (Math.random() < 0.3) b = a;
            return { a, b };
        },
        render: (s, lang, profile) => {
            const ans = s.a > s.b ? '>' : s.a < s.b ? '<' : '=';
            const body = `${s.a} ${ans} ${s.b}`;
            return {
                question: lang === 'ru' ? `Сравни числа. Поставь знак >, < или =\n\n${s.a}  □  ${s.b}` : `Compare. Type >, < or =\n\n${s.a}  □  ${s.b}`,
                ...makeExplanations(profile, lang, body), answerType: 'comparison' as InputType, correctAnswer: ans
            };
        }
    },
    {
        id: 'ussr-g1-missing-number',
        grade: 1, system: 'USSR',
        topicRu: 'Неизвестное слагаемое', topicEn: 'Missing Addend',
        generateState: () => {
            const a = randInt(2, 9); const b = randInt(2, 9);
            const hideFirst = Math.random() > 0.5;
            return { a, b, hideFirst };
        },
        render: (s, lang, profile) => {
            const sum = s.a + s.b;
            const q = s.hideFirst ? `? + ${s.b} = ${sum}` : `${s.a} + ? = ${sum}`;
            const ans = s.hideFirst ? s.a : s.b;
            const body = lang === 'ru'
                ? `Чтобы найти неизвестное слагаемое, вычтем из суммы (${sum}) известное: ${sum} − ${s.hideFirst ? s.b : s.a} = ${ans}.`
                : `Subtract from the sum: ${sum} − ${s.hideFirst ? s.b : s.a} = ${ans}.`;
            return { question: lang === 'ru' ? `Найди неизвестное число:\n\n${q}` : `Find the missing number:\n\n${q}`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g1-word-problem',
        grade: 1, system: 'USSR',
        topicRu: 'Задача в одно действие', topicEn: 'One-Step Word Problem',
        generateState: () => {
            const type = randInt(0, 3);
            const a = randInt(3, 10); const b = randInt(2, 7);
            return { type, a, b };
        },
        render: (s, lang, profile) => {
            const stories = lang === 'ru' ? [
                { q: `У ${profile.name || 'Маши'} было ${s.a} яблок. Ей дали ещё ${s.b}. Сколько яблок стало?`, ans: s.a + s.b, exp: `${s.a} + ${s.b} = ${s.a + s.b}` },
                { q: `На ветке сидели ${s.a + s.b} птиц. ${s.b} улетели. Сколько осталось?`, ans: s.a, exp: `${s.a + s.b} − ${s.b} = ${s.a}` },
                { q: `В вазе ${s.a} красных роз и ${s.b} белых. Сколько роз всего?`, ans: s.a + s.b, exp: `${s.a} + ${s.b} = ${s.a + s.b}` },
                { q: `${profile.name || 'Коля'} прочитал ${s.a + s.b} страниц. Утром — ${s.a}, а сколько вечером?`, ans: s.b, exp: `${s.a + s.b} − ${s.a} = ${s.b}` },
            ] : [
                { q: `${profile.name || 'Emma'} had ${s.a} apples. She got ${s.b} more. How many now?`, ans: s.a + s.b, exp: `${s.a} + ${s.b} = ${s.a + s.b}` },
                { q: `There were ${s.a + s.b} birds. ${s.b} flew away. How many left?`, ans: s.a, exp: `${s.a + s.b} − ${s.b} = ${s.a}` },
                { q: `A vase has ${s.a} red and ${s.b} white roses. Total?`, ans: s.a + s.b, exp: `${s.a} + ${s.b} = ${s.a + s.b}` },
                { q: `${profile.name || 'Tom'} read ${s.a + s.b} pages. ${s.a} in morning. How many in evening?`, ans: s.b, exp: `${s.a + s.b} − ${s.a} = ${s.b}` },
            ];
            const story = stories[s.type];
            return { question: story.q, ...makeExplanations(profile, lang, story.exp), answerType: 'number' as InputType, correctAnswer: story.ans };
        }
    },

    // ==========================================
    // GRADE 1 — US
    // ==========================================
    {
        id: 'us-g1-equality',
        grade: 1, system: 'US',
        topicRu: 'Истинные равенства', topicEn: 'True Equality',
        generateState: () => {
            const a = randInt(2, 6); const b = randInt(2, 6);
            const c = randInt(1, a + b - 1); const v = randInt(0, 1);
            return { a, b, c, v };
        },
        render: (s, lang, profile) => {
            const missing = (s.a + s.b) - s.c;
            const eq = s.v === 1 ? `_ + ${s.c} = ${s.a} + ${s.b}` : `${s.a} + ${s.b} = ${s.c} + _`;
            const body = lang === 'ru'
                ? `Обе стороны = ${s.a + s.b}. ${s.c} + ${missing} = ${s.a + s.b}.`
                : `Both sides must equal ${s.a + s.b}. ${s.c} + ${missing} = ${s.a + s.b}.`;
            return { question: lang === 'ru' ? `Сделай равенство верным:\n\n${eq}` : `Make the equation true:\n\n${eq}`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: missing };
        }
    },
    {
        id: 'us-g1-count-shapes',
        grade: 1, system: 'US',
        topicRu: 'Считаем фигуры', topicEn: 'Counting Shapes',
        generateState: () => {
            const rows = randInt(1, 3); const cols = randInt(2, 5);
            return { rows, cols };
        },
        render: (s, lang, profile) => {
            const total = s.rows * s.cols;
            const body = lang === 'ru'
                ? `Всего ${s.rows} ряда по ${s.cols} = ${total} квадратиков.`
                : `${s.rows} rows of ${s.cols} = ${total} squares total.`;
            return { question: lang === 'ru' ? `Посчитай квадратики на картинке.` : `Count all the squares in the picture.`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: total, visual: { type: 'grid' as const, rows: s.rows, cols: s.cols } };
        }
    },
    {
        id: 'us-g1-tens-ones',
        grade: 1, system: 'US',
        topicRu: 'Десятки и единицы', topicEn: 'Tens and Ones',
        generateState: () => {
            const tens = randInt(1, 5); const ones = randInt(0, 9);
            const askTens = Math.random() > 0.5;
            return { tens, ones, askTens };
        },
        render: (s, lang, profile) => {
            const num = s.tens * 10 + s.ones;
            const q = s.askTens
                ? (lang === 'ru' ? `Сколько десятков в числе ${num}?` : `How many tens are in ${num}?`)
                : (lang === 'ru' ? `Сколько единиц в числе ${num}?` : `How many ones are in ${num}?`);
            const body = lang === 'ru'
                ? `${num} = ${s.tens} десятков и ${s.ones} единиц.`
                : `${num} = ${s.tens} tens and ${s.ones} ones.`;
            return { question: q, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.askTens ? s.tens : s.ones, visual: { type: 'bar' as const, totalParts: num, shadedParts: s.askTens ? s.tens * 10 : s.ones } };
        }
    },
    {
        id: 'us-g1-number-line',
        grade: 1, system: 'US',
        topicRu: 'Числовая прямая', topicEn: 'Number Line',
        generateState: () => {
            const start = randInt(0, 10); const steps = randInt(2, 6);
            return { start, steps };
        },
        render: (s, lang, profile) => {
            const body = `${s.start} + ${s.steps} = ${s.start + s.steps}.`;
            return {
                question: lang === 'ru'
                    ? `Начни с числа ${s.start} и сделай ${s.steps} шагов вправо. На каком числе окажешься?`
                    : `Start at ${s.start} and take ${s.steps} steps right. What number do you land on?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.start + s.steps, visual: { type: 'numberline' as const, min: 0, max: 20, marked: [s.start] }
            };
        }
    },

    // ==========================================
    // GRADE 2 — USSR
    // ==========================================
    {
        id: 'ussr-g2-equations',
        grade: 2, system: 'USSR',
        topicRu: 'Уравнения', topicEn: 'Equations',
        generateState: () => {
            const x = randInt(10, 30); const known = randInt(20, 40);
            const sum = x + known; const v = randInt(0, 2);
            return { x, known, sum, v };
        },
        render: (s, lang, profile) => {
            const q = lang === 'ru'
                ? [`Реши уравнение: x + ${s.known} = ${s.sum}. Чему равен x?`, `Какое число нужно прибавить к ${s.known}, чтобы получить ${s.sum}?`, `Неизвестное число увеличили на ${s.known} и получили ${s.sum}. Найди это число.`][s.v]
                : [`Solve for x: x + ${s.known} = ${s.sum}`, `What number added to ${s.known} gives ${s.sum}?`, `An unknown number plus ${s.known} equals ${s.sum}. Find it.`][s.v];
            const body = `x = ${s.sum} − ${s.known} = ${s.x}.`;
            return { question: q, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.x };
        }
    },
    {
        id: 'ussr-g2-mult-table',
        grade: 2, system: 'USSR',
        topicRu: 'Таблица умножения', topicEn: 'Multiplication Table',
        generateState: () => {
            const a = randInt(2, 9); const b = randInt(2, 9);
            const askProduct = Math.random() > 0.3;
            return { a, b, askProduct };
        },
        render: (s, lang, profile) => {
            const product = s.a * s.b;
            if (s.askProduct) {
                const body = `${s.a} × ${s.b} = ${product}.`;
                return { question: `${s.a} × ${s.b} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: product };
            } else {
                const body = `${product} ÷ ${s.a} = ${s.b}.`;
                return { question: `${product} ÷ ${s.a} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.b };
            }
        }
    },
    {
        id: 'ussr-g2-add-hundreds',
        grade: 2, system: 'USSR',
        topicRu: 'Сложение в пределах 100', topicEn: 'Addition within 100',
        generateState: () => {
            const a = randInt(20, 60); const b = randInt(15, 39);
            return { a, b };
        },
        render: (s, lang, profile) => {
            const body = `${s.a} + ${s.b} = ${s.a + s.b}.`;
            return { question: lang === 'ru' ? `Вычисли: ${s.a} + ${s.b} = ?` : `Calculate: ${s.a} + ${s.b} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.a + s.b };
        }
    },
    {
        id: 'ussr-g2-word-two-step',
        grade: 2, system: 'USSR',
        topicRu: 'Задача в два действия', topicEn: 'Two-Step Word Problem',
        generateState: () => {
            const a = randInt(5, 15); const b = randInt(3, 10); const c = randInt(2, 8);
            const type = randInt(0, 1);
            return { a, b, c, type };
        },
        render: (s, lang, profile) => {
            if (s.type === 0) {
                const ans = s.a + s.a + s.b;
                const body = lang === 'ru'
                    ? `Во второй: ${s.a} + ${s.b} = ${s.a + s.b}. Всего: ${s.a} + ${s.a + s.b} = ${ans}.`
                    : `Second basket: ${s.a} + ${s.b} = ${s.a + s.b}. Total: ${s.a} + ${s.a + s.b} = ${ans}.`;
                return {
                    question: lang === 'ru'
                        ? `В первой корзине ${s.a} грибов, во второй на ${s.b} больше. Сколько вместе?`
                        : `First basket: ${s.a} mushrooms, second has ${s.b} more. Total in both?`,
                    ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans
                };
            } else {
                const ans = s.a + s.c;
                const body = lang === 'ru'
                    ? `${s.a + s.b} − ${s.b} = ${s.a}, потом ${s.a} + ${s.c} = ${ans}.`
                    : `${s.a + s.b} − ${s.b} = ${s.a}, then ${s.a} + ${s.c} = ${ans}.`;
                return {
                    question: lang === 'ru'
                        ? `У ${profile.name || 'Пети'} было ${s.a + s.b} наклеек. Он отдал ${s.b}, потом купил ${s.c}. Сколько стало?`
                        : `${profile.name || 'Pete'} had ${s.a + s.b} stickers. Gave ${s.b} away, bought ${s.c}. How many now?`,
                    ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans
                };
            }
        }
    },

    // ==========================================
    // GRADE 2 — US
    // ==========================================
    {
        id: 'us-g2-arrays',
        grade: 2, system: 'US',
        topicRu: 'Основы умножения (Массивы)', topicEn: 'Multiplication Arrays',
        generateState: () => {
            const rows = randInt(2, 5); const cols = randInt(2, 5);
            return { rows, cols };
        },
        render: (s, lang, profile) => {
            const total = s.rows * s.cols;
            const body = `${s.rows} × ${s.cols} = ${total}.`;
            return {
                question: lang === 'ru'
                    ? `В саду ${s.rows} ряда деревьев, по ${s.cols} в каждом. Сколько всего?`
                    : `An array has ${s.rows} rows and ${s.cols} columns. How many total?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: total, visual: { type: 'grid' as const, rows: s.rows, cols: s.cols }
            };
        }
    },
    {
        id: 'us-g2-even-odd',
        grade: 2, system: 'US',
        topicRu: 'Чётные и нечётные', topicEn: 'Even or Odd',
        generateState: () => ({ n: randInt(1, 50) }),
        render: (s, lang, profile) => {
            const isEven = s.n % 2 === 0;
            const body = lang === 'ru'
                ? `${s.n} ${isEven ? 'делится на 2 — чётное' : 'не делится на 2 — нечётное'}.`
                : `${s.n} is ${isEven ? 'even (divisible by 2)' : 'odd (not divisible by 2)'}.`;
            return {
                question: lang === 'ru'
                    ? `Число ${s.n} — чётное или нечётное? Напиши "чёт" или "нечет".`
                    : `Is ${s.n} even or odd? Type "even" or "odd".`,
                ...makeExplanations(profile, lang, body), answerType: 'text' as InputType, correctAnswer: lang === 'ru' ? (isEven ? 'чёт' : 'нечет') : (isEven ? 'even' : 'odd')
            };
        }
    },
    {
        id: 'us-g2-skip-counting',
        grade: 2, system: 'US',
        topicRu: 'Счёт группами', topicEn: 'Skip Counting',
        generateState: () => {
            const by = pick([2, 5, 10]); const count = randInt(3, 8);
            return { by, count };
        },
        render: (s, lang, profile) => {
            const result = s.by * s.count;
            const seq = Array.from({length: s.count}, (_, i) => (i + 1) * s.by).join(', ');
            const body = seq + '.';
            return {
                question: lang === 'ru'
                    ? `Считай по ${s.by}. Какое будет ${s.count}-е число?`
                    : `Count by ${s.by}s. What is the ${s.count}${s.count === 1 ? 'st' : s.count === 2 ? 'nd' : s.count === 3 ? 'rd' : 'th'} number?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: result
            };
        }
    },

    // ==========================================
    // GRADE 3 — USSR
    // ==========================================
    {
        id: 'ussr-g3-svt',
        grade: 3, system: 'USSR',
        topicRu: 'Движение (S = V × t)', topicEn: 'Speed, Time, Distance',
        generateState: () => {
            const v = randInt(40, 80); const t = randInt(2, 5);
            const s = v * t; const type = randInt(0, 2);
            return { v, t, s, type };
        },
        render: (s, lang, profile) => {
            let q = '', body = '', ans = 0;
            if (s.type === 0) {
                q = lang === 'ru' ? `Поезд ехал ${s.t} часа со скоростью ${s.v} км/ч. Расстояние?` : `A train went ${s.t} hours at ${s.v} km/h. Distance?`;
                body = `S = V × t = ${s.v} × ${s.t} = ${s.s} km.`; ans = s.s;
            } else if (s.type === 1) {
                q = lang === 'ru' ? `Машина проехала ${s.s} км за ${s.t} часа. Скорость?` : `A car drove ${s.s} km in ${s.t} hours. Speed?`;
                body = `V = S ÷ t = ${s.s} ÷ ${s.t} = ${s.v} km/h.`; ans = s.v;
            } else {
                q = lang === 'ru' ? `Расстояние ${s.s} км. Скорость ${s.v} км/ч. Время?` : `Distance ${s.s} km at ${s.v} km/h. Time?`;
                body = `t = S ÷ V = ${s.s} ÷ ${s.v} = ${s.t} h.`; ans = s.t;
            }
            return { question: q, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g3-division-remainder',
        grade: 3, system: 'USSR',
        topicRu: 'Деление с остатком', topicEn: 'Division with Remainder',
        generateState: () => {
            const divisor = randInt(3, 9);
            const quotient = randInt(2, 9);
            const remainder = randInt(1, divisor - 1);
            const dividend = divisor * quotient + remainder;
            const askRemainder = Math.random() > 0.5;
            return { dividend, divisor, quotient, remainder, askRemainder };
        },
        render: (s, lang, profile) => {
            const q = s.askRemainder
                ? (lang === 'ru' ? `Чему равен остаток: ${s.dividend} ÷ ${s.divisor} = ?` : `What is the remainder of ${s.dividend} ÷ ${s.divisor}?`)
                : (lang === 'ru' ? `${s.dividend} ÷ ${s.divisor} = ? (неполное частное)` : `${s.dividend} ÷ ${s.divisor} = ? (whole part)`);
            const body = `${s.dividend} ÷ ${s.divisor} = ${s.quotient} (${lang === 'ru' ? 'ост.' : 'rem.'} ${s.remainder}).`;
            return { question: q, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.askRemainder ? s.remainder : s.quotient };
        }
    },
    {
        id: 'ussr-g3-perimeter',
        grade: 3, system: 'USSR',
        topicRu: 'Периметр прямоугольника', topicEn: 'Rectangle Perimeter',
        generateState: () => ({ a: randInt(3, 15), b: randInt(3, 15) }),
        render: (s, lang, profile) => {
            const p = 2 * (s.a + s.b);
            const body = `P = 2 × (${s.a} + ${s.b}) = 2 × ${s.a + s.b} = ${p} ${lang === 'ru' ? 'см' : 'cm'}.`;
            return {
                question: lang === 'ru'
                    ? `Найди периметр прямоугольника со сторонами ${s.a} см и ${s.b} см.`
                    : `Find the perimeter of a rectangle: ${s.a} cm × ${s.b} cm.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: p
            };
        }
    },
    {
        id: 'ussr-g3-order-operations',
        grade: 3, system: 'USSR',
        topicRu: 'Порядок действий', topicEn: 'Order of Operations',
        generateState: () => {
            const a = randInt(2, 9); const b = randInt(2, 5); const c = randInt(1, 10);
            const type = randInt(0, 1);
            return { a, b, c, type };
        },
        render: (s, lang, profile) => {
            let expr: string, ans: number;
            if (s.type === 0) { expr = `${s.a} + ${s.b} × ${s.c}`; ans = s.a + s.b * s.c; }
            else { expr = `${s.a} × ${s.b} − ${s.c}`; ans = s.a * s.b - s.c; }
            const body = lang === 'ru'
                ? `Сначала умножение, потом сложение/вычитание. ${expr} = ${ans}.`
                : `Multiply first, then add/subtract. ${expr} = ${ans}.`;
            return { question: lang === 'ru' ? `Вычисли: ${expr} = ?` : `Calculate: ${expr} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans };
        }
    },

    // ==========================================
    // GRADE 3 — US
    // ==========================================
    {
        id: 'us-g3-eq-fractions',
        grade: 3, system: 'US',
        topicRu: 'Эквивалентные дроби', topicEn: 'Equivalent Fractions',
        generateState: () => {
            const baseNum = randInt(1, 2); const baseDen = randInt(3, 5);
            const mult = randInt(2, 4); const askNumerator = Math.random() > 0.5;
            return { baseNum, baseDen, mult, askNumerator };
        },
        render: (s, lang, profile) => {
            const newNum = s.baseNum * s.mult; const newDen = s.baseDen * s.mult;
            const eq = s.askNumerator ? `${s.baseNum}/${s.baseDen} = ?/${newDen}` : `${s.baseNum}/${s.baseDen} = ${newNum}/?`;
            const body = lang === 'ru'
                ? `Обе части умножили на ${s.mult}. Ответ: ${s.askNumerator ? newNum : newDen}.`
                : `Both parts multiplied by ${s.mult}. Answer: ${s.askNumerator ? newNum : newDen}.`;
            return { question: lang === 'ru' ? `Заполни пропуск:\n\n${eq}` : `Fill in the blank:\n\n${eq}`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.askNumerator ? newNum : newDen };
        }
    },
    {
        id: 'us-g3-fraction-vs-one',
        grade: 3, system: 'US',
        topicRu: 'Дроби и единица', topicEn: 'Fractions vs 1',
        generateState: () => {
            const den = pick([2, 3, 4]); const num = randInt(1, den * 2);
            return { num, den };
        },
        render: (s, lang, profile) => {
            const rel = s.num > s.den ? '>' : s.num < s.den ? '<' : '=';
            const body = lang === 'ru'
                ? `${s.num}/${s.den} ${rel} 1. Числитель ${s.num > s.den ? 'больше' : s.num < s.den ? 'меньше' : 'равен'} знаменателя.`
                : `${s.num}/${s.den} ${rel} 1. Numerator is ${s.num > s.den ? 'greater than' : s.num < s.den ? 'less than' : 'equal to'} denominator.`;
            return {
                question: lang === 'ru'
                    ? `${s.num}/${s.den} — больше, меньше или равно 1? Напиши "больше", "меньше" или "равно".`
                    : `Is ${s.num}/${s.den} greater than, less than, or equal to 1? Type "greater", "less", or "equal".`,
                ...makeExplanations(profile, lang, body), answerType: 'text' as InputType,
                correctAnswer: lang === 'ru' ? (s.num > s.den ? 'больше' : s.num < s.den ? 'меньше' : 'равно') : (s.num > s.den ? 'greater' : s.num < s.den ? 'less' : 'equal')
            };
        }
    },
    {
        id: 'us-g3-area',
        grade: 3, system: 'US',
        topicRu: 'Площадь прямоугольника', topicEn: 'Area of Rectangle',
        generateState: () => ({ a: randInt(2, 10), b: randInt(2, 10) }),
        render: (s, lang, profile) => {
            const body = `A = ${s.a} × ${s.b} = ${s.a * s.b} ${lang === 'ru' ? 'кв.см' : 'sq cm'}.`;
            return {
                question: lang === 'ru'
                    ? `Площадь прямоугольника: длина ${s.a} см, ширина ${s.b} см.`
                    : `Area of rectangle: length ${s.a} cm, width ${s.b} cm.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.a * s.b, visual: { type: 'grid' as const, rows: Math.min(s.b, 6), cols: Math.min(s.a, 8) }
            };
        }
    },
    {
        id: 'us-g3-rounding',
        grade: 3, system: 'US',
        topicRu: 'Округление', topicEn: 'Rounding',
        generateState: () => ({ n: randInt(11, 99) }),
        render: (s, lang, profile) => {
            const rounded = Math.round(s.n / 10) * 10;
            const body = lang === 'ru'
                ? `${s.n} ≈ ${rounded}. Единицы: ${s.n % 10} ${s.n % 10 >= 5 ? '≥ 5, вверх' : '< 5, вниз'}.`
                : `${s.n} ≈ ${rounded}. Ones digit: ${s.n % 10} ${s.n % 10 >= 5 ? '≥ 5, round up' : '< 5, round down'}.`;
            return {
                question: lang === 'ru' ? `Округли ${s.n} до ближайшего десятка.` : `Round ${s.n} to the nearest ten.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: rounded
            };
        }
    },

    // ==========================================
    // GRADE 4 — USSR
    // ==========================================
    {
        id: 'ussr-g4-multiplication',
        grade: 4, system: 'USSR',
        topicRu: 'Умножение многозначных', topicEn: 'Multi-digit Multiplication',
        generateState: () => ({ a: randInt(100, 899), b: randInt(10, 99) }),
        render: (s, lang, profile) => {
            const body = `${s.a} × ${s.b} = ${s.a * s.b}.`;
            return { question: `${s.a} × ${s.b} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.a * s.b };
        }
    },
    {
        id: 'ussr-g4-long-division',
        grade: 4, system: 'USSR',
        topicRu: 'Деление столбиком', topicEn: 'Long Division',
        generateState: () => {
            const divisor = randInt(6, 25); const quotient = randInt(10, 50);
            return { dividend: divisor * quotient, divisor, quotient };
        },
        render: (s, lang, profile) => {
            const body = `${s.dividend} ÷ ${s.divisor} = ${s.quotient}.`;
            return { question: `${s.dividend} ÷ ${s.divisor} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.quotient };
        }
    },
    {
        id: 'ussr-g4-area-composite',
        grade: 4, system: 'USSR',
        topicRu: 'Площадь составных фигур', topicEn: 'Composite Area',
        generateState: () => {
            const a = randInt(5, 12); const b = randInt(3, 8);
            const cutA = randInt(1, a - 2); const cutB = randInt(1, b - 2);
            return { a, b, cutA, cutB };
        },
        render: (s, lang, profile) => {
            const full = s.a * s.b; const cut = s.cutA * s.cutB; const ans = full - cut;
            const body = `${full} − ${cut} = ${ans} ${lang === 'ru' ? 'кв.см' : 'sq cm'}.`;
            return {
                question: lang === 'ru'
                    ? `Из прямоугольника ${s.a}×${s.b} см вырезали ${s.cutA}×${s.cutB} см. Площадь оставшейся фигуры?`
                    : `A ${s.cutA}×${s.cutB} cm rectangle is cut from a ${s.a}×${s.b} cm one. Remaining area?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans
            };
        }
    },
    {
        id: 'ussr-g4-multi-step',
        grade: 4, system: 'USSR',
        topicRu: 'Задача в несколько действий', topicEn: 'Multi-step Problem',
        generateState: () => {
            const price = randInt(5, 20); const qty1 = randInt(3, 8);
            const qty2 = randInt(2, 6); const budget = price * (qty1 + qty2) + randInt(5, 30);
            return { price, qty1, qty2, budget };
        },
        render: (s, lang, profile) => {
            const spent = s.price * (s.qty1 + s.qty2); const change = s.budget - spent;
            const body = lang === 'ru'
                ? `Всего: ${s.qty1} + ${s.qty2} = ${s.qty1 + s.qty2}. Стоимость: ${s.qty1 + s.qty2} × ${s.price} = ${spent}. Сдача: ${s.budget} − ${spent} = ${change}.`
                : `Total items: ${s.qty1 + s.qty2}. Cost: ${s.qty1 + s.qty2} × ${s.price} = ${spent}. Change: ${s.budget} − ${spent} = ${change}.`;
            return {
                question: lang === 'ru'
                    ? `Купили ${s.qty1} тетрадей и ${s.qty2} альбомов по ${s.price} руб. Заплатили ${s.budget} руб. Сдача?`
                    : `Bought ${s.qty1} notebooks and ${s.qty2} albums at $${s.price} each. Paid $${s.budget}. Change?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: change
            };
        }
    },

    // ==========================================
    // GRADE 4 — US
    // ==========================================
    {
        id: 'us-g4-fraction-addition',
        grade: 4, system: 'US',
        topicRu: 'Сложение дробей', topicEn: 'Adding Fractions',
        generateState: () => {
            const den = randInt(4, 9);
            const num1 = randInt(1, den - 2);
            const num2 = randInt(1, den - num1 - 1);
            return { num1, num2, den };
        },
        render: (s, lang, profile) => {
            const body = lang === 'ru'
                ? `Складываем числители: ${s.num1} + ${s.num2} = ${s.num1 + s.num2}. Знаменатель ${s.den}.`
                : `Add numerators: ${s.num1} + ${s.num2} = ${s.num1 + s.num2}. Denominator stays ${s.den}.`;
            return { question: `${s.num1}/${s.den} + ${s.num2}/${s.den} = ?`, ...makeExplanations(profile, lang, body), answerType: 'fraction' as InputType, correctAnswer: { numerator: s.num1 + s.num2, denominator: s.den } };
        }
    },
    {
        id: 'us-g4-mixed-numbers',
        grade: 4, system: 'US',
        topicRu: 'Смешанные числа', topicEn: 'Mixed Numbers',
        generateState: () => {
            const whole = randInt(1, 5); const num = randInt(1, 3); const den = randInt(num + 1, 6);
            return { whole, num, den };
        },
        render: (s, lang, profile) => {
            const improperNum = s.whole * s.den + s.num;
            const body = `${s.whole} × ${s.den} + ${s.num} = ${improperNum}. → ${improperNum}/${s.den}.`;
            return {
                question: lang === 'ru'
                    ? `Преврати ${s.whole} ${s.num}/${s.den} в неправильную дробь. Каков числитель?`
                    : `Convert ${s.whole} ${s.num}/${s.den} to improper fraction. Numerator?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: improperNum
            };
        }
    },
    {
        id: 'us-g4-factors',
        grade: 4, system: 'US',
        topicRu: 'Множители числа', topicEn: 'Factors',
        generateState: () => {
            const n = pick([12, 16, 18, 20, 24, 28, 30, 36]);
            let count = 0;
            for (let i = 1; i <= n; i++) { if (n % i === 0) count++; }
            return { n, factorCount: count };
        },
        render: (s, lang, profile) => {
            const body = lang === 'ru'
                ? `Перебираем делители от 1 до ${s.n}. Всего ${s.factorCount} делителей.`
                : `Count all numbers from 1 to ${s.n} that divide evenly. There are ${s.factorCount}.`;
            return {
                question: lang === 'ru' ? `Сколько делителей у числа ${s.n}?` : `How many factors does ${s.n} have?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.factorCount
            };
        }
    },
    {
        id: 'us-g4-angles',
        grade: 4, system: 'US',
        topicRu: 'Виды углов', topicEn: 'Types of Angles',
        generateState: () => ({ angle: pick([30, 45, 60, 75, 90, 105, 120, 135, 150, 170]) }),
        render: (s, lang, profile) => {
            const type = s.angle < 90 ? (lang === 'ru' ? 'острый' : 'acute') : s.angle === 90 ? (lang === 'ru' ? 'прямой' : 'right') : (lang === 'ru' ? 'тупой' : 'obtuse');
            const body = `${s.angle}° — ${type} (${s.angle < 90 ? '< 90°' : s.angle === 90 ? '= 90°' : '> 90°'}).`;
            return {
                question: lang === 'ru'
                    ? `Угол = ${s.angle}°. Какой он: острый, прямой или тупой?`
                    : `An angle is ${s.angle}°. Acute, right, or obtuse?`,
                ...makeExplanations(profile, lang, body), answerType: 'text' as InputType, correctAnswer: type
            };
        }
    },

    // ==========================================
    // GRADE 5 — USSR
    // ==========================================
    {
        id: 'ussr-g5-fractions-diff-den',
        grade: 5, system: 'USSR',
        topicRu: 'Сложение дробей с разным знаменателем', topicEn: 'Adding Fractions (Different Denominators)',
        generateState: () => {
            const den1 = pick([2, 3, 4, 5, 6]);
            const den2 = den1 * randInt(2, 3);
            const num1 = randInt(1, den1 - 1);
            const num2 = randInt(1, den2 - 1);
            return { num1, den1, num2, den2 };
        },
        render: (s, lang, profile) => {
            const commonDen = s.den2;
            const newNum1 = s.num1 * (s.den2 / s.den1);
            const sumNum = newNum1 + s.num2;
            const simplified = simplifyFraction(sumNum, commonDen);
            const body = lang === 'ru'
                ? `Общий знаменатель ${commonDen}. ${newNum1}/${commonDen} + ${s.num2}/${commonDen} = ${sumNum}/${commonDen}${simplified.n !== sumNum ? ` = ${simplified.n}/${simplified.d}` : ''}.`
                : `Common denominator is ${commonDen}. ${newNum1}/${commonDen} + ${s.num2}/${commonDen} = ${sumNum}/${commonDen}${simplified.n !== sumNum ? ` = ${simplified.n}/${simplified.d}` : ''}.`;
            return { question: `${s.num1}/${s.den1} + ${s.num2}/${s.den2} = ?`, ...makeExplanations(profile, lang, body), answerType: 'fraction' as InputType, correctAnswer: { numerator: sumNum, denominator: commonDen } };
        }
    },
    {
        id: 'ussr-g5-decimals',
        grade: 5, system: 'USSR',
        topicRu: 'Десятичные дроби', topicEn: 'Decimal Operations',
        generateState: () => {
            const a = Math.round(randInt(10, 99)) / 10;
            const b = Math.round(Math.min(a, randInt(10, 99) / 10) * 10) / 10;
            const op = pick(['+', '-'] as const);
            return { a, b, op };
        },
        render: (s, lang, profile) => {
            const result = Math.round((s.op === '+' ? s.a + s.b : s.a - s.b) * 10) / 10;
            const body = `${s.a} ${s.op} ${s.b} = ${result}.`;
            return { question: lang === 'ru' ? `Вычисли: ${s.a} ${s.op} ${s.b} = ?` : `Calculate: ${s.a} ${s.op} ${s.b} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: result };
        }
    },
    {
        id: 'ussr-g5-percentages',
        grade: 5, system: 'USSR',
        topicRu: 'Проценты', topicEn: 'Percentages',
        generateState: () => {
            const whole = pick([50, 100, 200, 300, 500]);
            const pct = pick([10, 20, 25, 50, 75]);
            return { whole, pct };
        },
        render: (s, lang, profile) => {
            const ans = s.whole * s.pct / 100;
            const body = `${s.pct}% × ${s.whole} = ${s.whole} × ${s.pct}/100 = ${ans}.`;
            return { question: lang === 'ru' ? `Найди ${s.pct}% от ${s.whole}.` : `Find ${s.pct}% of ${s.whole}.`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g5-volume',
        grade: 5, system: 'USSR',
        topicRu: 'Объём параллелепипеда', topicEn: 'Volume of Rectangular Prism',
        generateState: () => ({ a: randInt(2, 8), b: randInt(2, 8), c: randInt(2, 8) }),
        render: (s, lang, profile) => {
            const v = s.a * s.b * s.c;
            const body = `V = ${s.a} × ${s.b} × ${s.c} = ${v} ${lang === 'ru' ? 'куб.см' : 'cu cm'}.`;
            return {
                question: lang === 'ru' ? `Объём: ${s.a} × ${s.b} × ${s.c} см.` : `Volume: ${s.a} cm × ${s.b} cm × ${s.c} cm.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: v
            };
        }
    },

    // ==========================================
    // GRADE 5 — US
    // ==========================================
    {
        id: 'us-g5-decimal-place-value',
        grade: 5, system: 'US',
        topicRu: 'Разряды десятичных дробей', topicEn: 'Decimal Place Value',
        generateState: () => {
            const n = randInt(1, 9); const place = pick(['tenths', 'hundredths'] as const);
            const full = place === 'tenths' ? `0.${n}` : `0.0${n}`;
            return { n, place, full };
        },
        render: (s, lang, profile) => {
            const den = s.place === 'tenths' ? 10 : 100;
            const body = `${s.full} = ${s.n}/${den}.`;
            return {
                question: lang === 'ru' ? `Запиши ${s.full} как дробь. Каков знаменатель?` : `Write ${s.full} as a fraction. Denominator?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: den
            };
        }
    },
    {
        id: 'us-g5-coordinate',
        grade: 5, system: 'US',
        topicRu: 'Координатная плоскость', topicEn: 'Coordinate Plane',
        generateState: () => {
            const x = randInt(1, 10); const y = randInt(1, 10);
            const askX = Math.random() > 0.5;
            return { x, y, askX };
        },
        render: (s, lang, profile) => {
            const body = `${lang === 'ru' ? 'Ответ' : 'Answer'}: ${s.askX ? s.x : s.y}.`;
            return {
                question: lang === 'ru'
                    ? `Точка: (${s.askX ? '?' : s.x}, ${s.askX ? s.y : '?'}). ${s.askX ? `Она на ${s.x} вправо.` : `Она на ${s.y} вверх.`} Координата?`
                    : `Point at (${s.askX ? '?' : s.x}, ${s.askX ? s.y : '?'}). ${s.askX ? `It's ${s.x} right.` : `It's ${s.y} up.`} Coordinate?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.askX ? s.x : s.y
            };
        }
    },
    {
        id: 'us-g5-compare-decimals',
        grade: 5, system: 'US',
        topicRu: 'Сравнение десятичных', topicEn: 'Comparing Decimals',
        generateState: () => {
            const a = Math.round(randInt(1, 99)) / 10;
            let b = Math.round(randInt(1, 99)) / 10;
            if (Math.random() < 0.2) b = a;
            return { a, b };
        },
        render: (s, lang, profile) => {
            const ans = s.a > s.b ? '>' : s.a < s.b ? '<' : '=';
            const body = `${s.a} ${ans} ${s.b}.`;
            return {
                question: lang === 'ru' ? `Сравни: ${s.a}  □  ${s.b}` : `Compare: ${s.a}  □  ${s.b}`,
                ...makeExplanations(profile, lang, body), answerType: 'comparison' as InputType, correctAnswer: ans
            };
        }
    },
    {
        id: 'us-g5-exponents',
        grade: 5, system: 'US',
        topicRu: 'Степени', topicEn: 'Exponents',
        generateState: () => ({ base: randInt(2, 6), exp: randInt(2, 3) }),
        render: (s, lang, profile) => {
            const ans = Math.pow(s.base, s.exp);
            const body = `${s.base}${s.exp === 2 ? '²' : '³'} = ${Array(s.exp).fill(s.base).join(' × ')} = ${ans}.`;
            return { question: `${s.base}${s.exp === 2 ? '²' : '³'} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans };
        }
    },

    // ==========================================
    // GRADE 6 — USSR
    // ==========================================
    {
        id: 'ussr-g6-negative',
        grade: 6, system: 'USSR',
        topicRu: 'Отрицательные числа', topicEn: 'Negative Numbers',
        generateState: () => {
            const a = randInt(-20, 20); const b = randInt(-20, 20);
            const op = pick(['+', '-'] as const);
            return { a, b, op };
        },
        render: (s, lang, profile) => {
            const res = s.op === '+' ? s.a + s.b : s.a - s.b;
            const expr = `(${s.a}) ${s.op} (${s.b})`;
            const body = `${expr} = ${res}.`;
            return { question: `${expr} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: res };
        }
    },
    {
        id: 'ussr-g6-proportions',
        grade: 6, system: 'USSR',
        topicRu: 'Пропорции', topicEn: 'Proportions',
        generateState: () => {
            const a = randInt(2, 10); const c = randInt(2, 10);
            const mult = randInt(2, 5);
            return { a, b: a * mult, c, d: c * mult };
        },
        render: (s, lang, profile) => {
            const body = `x = ${s.c} × ${s.b} ÷ ${s.a} = ${s.d}.`;
            return { question: lang === 'ru' ? `Найди x: ${s.a}/${s.b} = ${s.c}/x` : `Find x: ${s.a}/${s.b} = ${s.c}/x`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.d };
        }
    },
    {
        id: 'ussr-g6-lcm-gcd',
        grade: 6, system: 'USSR',
        topicRu: 'НОК и НОД', topicEn: 'LCM and GCD',
        generateState: () => {
            const a = pick([6, 8, 10, 12, 14, 15, 18, 20, 24]);
            const b = pick([4, 6, 8, 9, 10, 12, 15, 16, 20]);
            const askGcd = Math.random() > 0.5;
            return { a, b, askGcd };
        },
        render: (s, lang, profile) => {
            const g = gcd(s.a, s.b); const l = (s.a * s.b) / g;
            const label = s.askGcd ? 'GCD' : 'LCM';
            const ans = s.askGcd ? g : l;
            const body = `${label}(${s.a}, ${s.b}) = ${ans}.`;
            return {
                question: s.askGcd
                    ? (lang === 'ru' ? `НОД(${s.a}, ${s.b}) = ?` : `GCD(${s.a}, ${s.b}) = ?`)
                    : (lang === 'ru' ? `НОК(${s.a}, ${s.b}) = ?` : `LCM(${s.a}, ${s.b}) = ?`),
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans
            };
        }
    },

    // ==========================================
    // GRADE 6 — US
    // ==========================================
    {
        id: 'us-g6-ratios',
        grade: 6, system: 'US',
        topicRu: 'Отношения', topicEn: 'Ratios',
        generateState: () => {
            const a = randInt(2, 8); const b = randInt(2, 8); const mult = randInt(2, 5);
            return { a, b, mult };
        },
        render: (s, lang, profile) => {
            const body = `${s.a * s.mult} ÷ ${s.a} = ${s.mult}. ${s.b} × ${s.mult} = ${s.b * s.mult}.`;
            return {
                question: lang === 'ru'
                    ? `Красные:синие = ${s.a}:${s.b}. Красных ${s.a * s.mult}. Сколько синих?`
                    : `Red:blue = ${s.a}:${s.b}. If red = ${s.a * s.mult}, how many blue?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.b * s.mult
            };
        }
    },
    {
        id: 'us-g6-abs-value',
        grade: 6, system: 'US',
        topicRu: 'Модуль числа', topicEn: 'Absolute Value',
        generateState: () => ({ n: randInt(-25, 25) }),
        render: (s, lang, profile) => {
            const body = lang === 'ru'
                ? `|${s.n}| = ${Math.abs(s.n)}. Модуль — расстояние до 0.`
                : `|${s.n}| = ${Math.abs(s.n)}. Absolute value = distance from 0.`;
            return { question: `|${s.n}| = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: Math.abs(s.n) };
        }
    },
    {
        id: 'us-g6-expressions',
        grade: 6, system: 'US',
        topicRu: 'Значение выражения', topicEn: 'Evaluating Expressions',
        generateState: () => {
            const a = randInt(2, 6); const x = randInt(1, 8); const b = randInt(1, 10);
            const op = pick(['+', '-'] as const);
            return { a, x, b, op };
        },
        render: (s, lang, profile) => {
            const result = s.op === '+' ? s.a * s.x + s.b : s.a * s.x - s.b;
            const body = `${s.a} × ${s.x} ${s.op} ${s.b} = ${s.a * s.x} ${s.op} ${s.b} = ${result}.`;
            return {
                question: lang === 'ru'
                    ? `${s.a}x ${s.op} ${s.b} при x = ${s.x}. Ответ?`
                    : `Evaluate ${s.a}x ${s.op} ${s.b} when x = ${s.x}.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: result
            };
        }
    },

    // ==========================================
    // GRADE 7 — USSR
    // ==========================================
    {
        id: 'ussr-g7-linear-eq',
        grade: 7, system: 'USSR',
        topicRu: 'Линейные уравнения', topicEn: 'Linear Equations',
        generateState: () => {
            const x = randInt(-10, 10); const a = randInt(2, 7); const b = randInt(-20, 20);
            return { a, b, c: a * x + b, x };
        },
        render: (s, lang, profile) => {
            const bStr = s.b < 0 ? `(${s.b})` : `${s.b}`;
            const body = `${s.a}x = ${s.c} − ${bStr} = ${s.c - s.b}. x = ${s.c - s.b}/${s.a} = ${s.x}.`;
            return {
                question: lang === 'ru' ? `Реши: ${s.a}x + ${bStr} = ${s.c}` : `Solve: ${s.a}x + ${bStr} = ${s.c}`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.x
            };
        }
    },
    {
        id: 'ussr-g7-powers',
        grade: 7, system: 'USSR',
        topicRu: 'Степени', topicEn: 'Powers',
        generateState: () => ({ base: pick([-3, -2, -1, 2, 3, 4, 5]), exp: randInt(2, 4) }),
        render: (s, lang, profile) => {
            const ans = Math.pow(s.base, s.exp);
            const sup = s.exp === 2 ? '²' : s.exp === 3 ? '³' : '⁴';
            const body = `(${s.base})${sup} = ${Array(s.exp).fill(s.base).join(' × ')} = ${ans}.`;
            return { question: `(${s.base})${sup} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g7-slope',
        grade: 7, system: 'USSR',
        topicRu: 'Наклон прямой', topicEn: 'Slope',
        generateState: () => {
            const x1 = randInt(0, 5); const y1 = randInt(0, 5);
            const x2 = x1 + randInt(1, 5); const y2 = y1 + randInt(-5, 5);
            return { x1, y1, x2, y2 };
        },
        render: (s, lang, profile) => {
            const rise = s.y2 - s.y1; const run = s.x2 - s.x1;
            const g = gcd(Math.abs(rise), Math.abs(run));
            const body = `${lang === 'ru' ? 'Наклон' : 'Slope'} = (${s.y2}−${s.y1})/(${s.x2}−${s.x1}) = ${rise}/${run}${g > 1 ? ` = ${rise/g}/${run/g}` : ''}.`;
            return {
                question: lang === 'ru'
                    ? `Наклон прямой через (${s.x1},${s.y1}) и (${s.x2},${s.y2}). Введи дробь.`
                    : `Slope through (${s.x1},${s.y1}) and (${s.x2},${s.y2}). Enter as fraction.`,
                ...makeExplanations(profile, lang, body), answerType: 'fraction' as InputType, correctAnswer: { numerator: rise, denominator: run }
            };
        }
    },

    // ==========================================
    // GRADE 7 — US
    // ==========================================
    {
        id: 'us-g7-proportional',
        grade: 7, system: 'US',
        topicRu: 'Пропорциональность', topicEn: 'Proportional Relationships',
        generateState: () => ({ rate: randInt(2, 8), qty: randInt(3, 12) }),
        render: (s, lang, profile) => {
            const body = `${s.rate} × ${s.qty} = ${s.rate * s.qty}.`;
            return {
                question: lang === 'ru'
                    ? `1 кг = ${s.rate} руб. Сколько стоят ${s.qty} кг?`
                    : `1 kg costs $${s.rate}. How much for ${s.qty} kg?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.rate * s.qty
            };
        }
    },
    {
        id: 'us-g7-percent-change',
        grade: 7, system: 'US',
        topicRu: 'Изменение в процентах', topicEn: 'Percent Change',
        generateState: () => {
            const original = pick([50, 80, 100, 120, 200]);
            const pct = pick([10, 20, 25, 50]);
            const increase = Math.random() > 0.5;
            return { original, pct, increase };
        },
        render: (s, lang, profile) => {
            const change = s.original * s.pct / 100;
            const result = s.increase ? s.original + change : s.original - change;
            const word = s.increase ? (lang === 'ru' ? 'увеличилась' : 'increased') : (lang === 'ru' ? 'уменьшилась' : 'decreased');
            const body = `${s.pct}% × ${s.original} = ${change}. ${lang === 'ru' ? 'Результат' : 'Result'}: ${result}.`;
            return {
                question: lang === 'ru'
                    ? `Цена ${s.original} руб. ${word} на ${s.pct}%. Новая цена?`
                    : `Price $${s.original} ${word} by ${s.pct}%. New price?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: result
            };
        }
    },
    {
        id: 'us-g7-inequality',
        grade: 7, system: 'US',
        topicRu: 'Неравенства', topicEn: 'Inequalities',
        generateState: () => {
            const a = randInt(2, 6); const b = randInt(1, 20);
            return { a, b };
        },
        render: (s, lang, profile) => {
            const ans = Math.ceil(s.b / s.a);
            const body = `x ≥ ${s.b}/${s.a} = ${(s.b / s.a).toFixed(2)}. ${lang === 'ru' ? 'Наименьшее целое' : 'Smallest integer'}: ${ans}.`;
            return {
                question: lang === 'ru'
                    ? `Наименьшее целое x, при котором ${s.a}x ≥ ${s.b}?`
                    : `Smallest integer x where ${s.a}x ≥ ${s.b}?`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: ans
            };
        }
    },

    // ==========================================
    // GRADE 8 — USSR
    // ==========================================
    {
        id: 'ussr-g8-quadratic',
        grade: 8, system: 'USSR',
        topicRu: 'Квадратные уравнения', topicEn: 'Quadratic Equations',
        generateState: () => {
            const r1 = randInt(-6, 6); const r2 = randInt(-6, 6);
            return { b: -(r1 + r2), c: r1 * r2, r1, r2 };
        },
        render: (s, lang, profile) => {
            const sum = s.r1 + s.r2;
            const body = lang === 'ru'
                ? `По теореме Виета: x₁ + x₂ = ${-s.b} = ${sum}.`
                : `By Vieta's: x₁ + x₂ = ${-s.b} = ${sum}.`;
            return {
                question: lang === 'ru'
                    ? `Сумма корней: x² ${s.b >= 0 ? '+' : '−'} ${Math.abs(s.b)}x ${s.c >= 0 ? '+' : '−'} ${Math.abs(s.c)} = 0`
                    : `Sum of roots: x² ${s.b >= 0 ? '+' : '−'} ${Math.abs(s.b)}x ${s.c >= 0 ? '+' : '−'} ${Math.abs(s.c)} = 0`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: sum
            };
        }
    },
    {
        id: 'ussr-g8-pythagoras',
        grade: 8, system: 'USSR',
        topicRu: 'Теорема Пифагора', topicEn: 'Pythagorean Theorem',
        generateState: () => {
            const triple = pick([[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15]]);
            const findHyp = Math.random() > 0.4;
            return { a: triple[0], b: triple[1], c: triple[2], findHyp };
        },
        render: (s, lang, profile) => {
            if (s.findHyp) {
                const body = `c = √(${s.a}² + ${s.b}²) = √${s.c*s.c} = ${s.c}.`;
                return {
                    question: lang === 'ru' ? `Катеты: ${s.a} и ${s.b}. Гипотенуза?` : `Legs: ${s.a} and ${s.b}. Hypotenuse?`,
                    ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.c
                };
            } else {
                const body = `b = √(${s.c}² − ${s.a}²) = √${s.b*s.b} = ${s.b}.`;
                return {
                    question: lang === 'ru' ? `Гипотенуза = ${s.c}, катет = ${s.a}. Другой катет?` : `Hypotenuse = ${s.c}, leg = ${s.a}. Other leg?`,
                    ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.b
                };
            }
        }
    },
    {
        id: 'ussr-g8-sqrt',
        grade: 8, system: 'USSR',
        topicRu: 'Квадратные корни', topicEn: 'Square Roots',
        generateState: () => ({ n: pick([4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225]) }),
        render: (s, lang, profile) => {
            const body = `√${s.n} = ${Math.sqrt(s.n)}.`;
            return { question: `√${s.n} = ?`, ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: Math.sqrt(s.n) };
        }
    },

    // ==========================================
    // GRADE 8 — US
    // ==========================================
    {
        id: 'us-g8-linear-fn',
        grade: 8, system: 'US',
        topicRu: 'Линейная функция', topicEn: 'Linear Functions',
        generateState: () => ({ m: randInt(-5, 5), b: randInt(-10, 10), x: randInt(-5, 5) }),
        render: (s, lang, profile) => {
            const y = s.m * s.x + s.b;
            const bStr = s.b >= 0 ? `+ ${s.b}` : `− ${Math.abs(s.b)}`;
            const body = `y = ${s.m}(${s.x}) ${bStr} = ${s.m * s.x} ${bStr} = ${y}.`;
            return {
                question: lang === 'ru'
                    ? `y = ${s.m}x ${bStr}. Найди y при x = ${s.x}.`
                    : `y = ${s.m}x ${bStr}. Find y when x = ${s.x}.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: y
            };
        }
    },
    {
        id: 'us-g8-scientific',
        grade: 8, system: 'US',
        topicRu: 'Стандартный вид', topicEn: 'Scientific Notation',
        generateState: () => ({ coeff: randInt(1, 9), exp: randInt(2, 6) }),
        render: (s, lang, profile) => {
            const full = s.coeff * Math.pow(10, s.exp);
            const sup = ['', '', '²', '³', '⁴', '⁵', '⁶'][s.exp];
            const body = `${s.coeff} × 10${sup} = ${full}.`;
            return {
                question: lang === 'ru'
                    ? `${s.coeff} × 10${sup} = ? (обычным числом)`
                    : `${s.coeff} × 10${sup} = ? (standard form)`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: full
            };
        }
    },
    {
        id: 'us-g8-systems',
        grade: 8, system: 'US',
        topicRu: 'Системы уравнений', topicEn: 'Systems of Equations',
        generateState: () => {
            const x = randInt(1, 8); const y = randInt(1, 8);
            return { x, y, sum: x + y, diff: x - y };
        },
        render: (s, lang, profile) => {
            const body = lang === 'ru'
                ? `Сложим: 2x = ${s.sum + s.diff}, x = ${s.x}.`
                : `Add equations: 2x = ${s.sum + s.diff}, x = ${s.x}.`;
            return {
                question: lang === 'ru'
                    ? `x + y = ${s.sum}, x − y = ${s.diff}. Найди x.`
                    : `x + y = ${s.sum}, x − y = ${s.diff}. Find x.`,
                ...makeExplanations(profile, lang, body), answerType: 'number' as InputType, correctAnswer: s.x
            };
        }
    },
];

// ========================================
// MATH ENGINE
// ========================================
export const generateTask = (
    grades: number[],
    chosenSystem: 'US' | 'USSR' | 'both',
    lang: 'ru' | 'en',
    profile: StudentProfile,
    forceModuleId?: string
): GeneratedTaskInstance => {
    let selectedModule = forceModuleId ? registry.find(m => m.id === forceModuleId) : null;

    if (!selectedModule) {
        const available = registry.filter(m => grades.includes(m.grade) && (chosenSystem === 'both' || m.system === chosenSystem));
        if (available.length === 0) {
            return {
                id: 'fallback', grade: 1, system: 'US',
                topic: lang === 'ru' ? 'Базовый счёт' : 'Basic Math',
                question: '1 + 1 = ?',
                explanationCorrect: lang === 'ru' ? 'Правильно! 1 + 1 = 2.' : 'Correct! 1 + 1 = 2.',
                explanationWrong: lang === 'ru' ? '1 + 1 = 2.' : '1 + 1 = 2.',
                answerType: 'number', correctAnswer: 2, visual: { type: 'none' }
            };
        }
        selectedModule = pick(available);
    }

    const taskState = selectedModule.generateState();
    const rendered = selectedModule.render(taskState, lang, profile);

    return {
        id: selectedModule.id,
        grade: selectedModule.grade,
        system: selectedModule.system,
        topic: lang === 'ru' ? selectedModule.topicRu : selectedModule.topicEn,
        question: rendered.question,
        explanationCorrect: rendered.explanationCorrect,
        explanationWrong: rendered.explanationWrong,
        answerType: rendered.answerType,
        correctAnswer: rendered.correctAnswer,
        visual: rendered.visual || { type: 'none' }
    };
};

// ========================================
// APP CONFIG & DICTIONARY
// ========================================
const DEFAULT_CONFIG: AppConfig = {
    studentName: 'Ameliia',
    lang: 'en',
    theme: 'system',
    colorTheme: 'indigo',
    avatarTheme: 'girl',
    emoji: '👧',
    schoolSystem: 'both',
    gradeMode: { type: 'range', grades: [1, 2, 3, 4] },
    order: 'shuffle',
    sound: false,
    timedMode: false,
    timerSeconds: 60,
    showTaskMeta: false,
    allowTextSelection: false,
};

const DICTIONARY = {
    en: {
        appTitle: 'MATH',
        appSubtitle: 'with love from US(SR)',
        practice: '✏️ Practice',
        menu: '⚙️ Menu',
        history: '📊 Progress',
        settings: 'Settings',
        studentName: 'Student Name',
        lang: 'Language',
        theme: 'App Theme',
        colorTheme: 'Color Scheme',
        gender: 'Profile Gender',
        boy: 'Boy',
        girl: 'Girl',
        neutral: 'Neutral',
        emojiLabel: 'Avatar Emoji',
        noEmoji: 'No Emoji',
        curriculum: 'Curriculum',
        usCurriculum: '🇺🇸 US (Common Core)',
        ussrCurriculum: '☭ USSR (Arithmetic)',
        bothCurriculum: '🌍 Both / Mixed',
        gradesScope: 'Grades',
        export: '📤 Export',
        import: '📥 Import',
        reset: '🗑️ Reset',
        resetConfirm: 'Reset all settings to default?',
        correct: 'Correct',
        total: 'Total',
        streak: 'Streak',
        best: 'Best',
        check: 'Check ✓',
        correctFeedback: '🎉 Correct!',
        wrongFeedback: '💡 Not quite!',
        nextTask: 'Next →',
        retryTask: '🔄 Retry',
        defaultStudent: 'Student',
        workspaceNeutral: 'Workspace',
        gradeLabel: 'Grade',
        themeLight: '☀️ Light',
        themeDark: '🌙 Dark',
        themeSystem: '💻 System',
        soundOn: '🔊 Sound',
        soundOff: '🔇 Muted',
        timedMode: '⏱️ Timed Mode',
        timerLabel: 'Seconds per task',
        timeUp: '⏰ Time\'s up!',
        progressTitle: 'Progress Report',
        topicAccuracy: 'Topic Accuracy',
        noHistory: 'No tasks completed yet. Start practicing!',
        backToPractice: '← Back to Practice',
        emptyField: 'Please enter an answer!',
        streakCelebration5: '🔥 5 in a row!',
        streakCelebration10: '⚡ 10 in a row! Amazing!',
        streakCelebration25: '🏆 25 streak! Legendary!',
        showTaskInfo: 'Show task info on question',
        showTaskInfoDesc: 'Grade, system & topic above question',
        allowSelection: 'Allow text selection',
        allowSelectionDesc: 'Enable to select/copy text (for translators)',
    },
    ru: {
        appTitle: 'МАТЕМАТИКА',
        appSubtitle: 'С любовью из СССР и США',
        practice: '✏️ Задачи',
        menu: '⚙️ Меню',
        history: '📊 Прогресс',
        settings: 'Настройки',
        studentName: 'Имя ученика',
        lang: 'Язык',
        theme: 'Тема',
        colorTheme: 'Цветовая схема',
        gender: 'Пол (для окончаний)',
        boy: 'Мальчик',
        girl: 'Девочка',
        neutral: 'Нейтральный',
        emojiLabel: 'Эмодзи аватара',
        noEmoji: 'Без эмодзи',
        curriculum: 'Программа',
        usCurriculum: '🇺🇸 США (Common Core)',
        ussrCurriculum: '☭ СССР (Арифметика)',
        bothCurriculum: '🌍 Обе системы',
        gradesScope: 'Классы',
        export: '📤 Экспорт',
        import: '📥 Импорт',
        reset: '🗑️ Сброс',
        resetConfirm: 'Сбросить все настройки?',
        correct: 'Верно',
        total: 'Всего',
        streak: 'Серия',
        best: 'Рекорд',
        check: 'Проверить ✓',
        correctFeedback: '🎉 Правильно!',
        wrongFeedback: '💡 Не совсем!',
        nextTask: 'Далее →',
        retryTask: '🔄 Ещё раз',
        defaultStudent: 'Ученик',
        workspaceNeutral: 'Рабочее пространство',
        gradeLabel: 'Класс',
        themeLight: '☀️ Светлая',
        themeDark: '🌙 Тёмная',
        themeSystem: '💻 Системная',
        soundOn: '🔊 Звук',
        soundOff: '🔇 Без звука',
        timedMode: '⏱️ На время',
        timerLabel: 'Секунд на задание',
        timeUp: '⏰ Время вышло!',
        progressTitle: 'Отчёт по прогрессу',
        topicAccuracy: 'Точность по темам',
        noHistory: 'Пока нет решённых задач. Начни тренировку!',
        backToPractice: '← Вернуться к задачам',
        emptyField: 'Введи ответ!',
        streakCelebration5: '🔥 5 подряд!',
        streakCelebration10: '⚡ 10 подряд! Восхитительно!',
        streakCelebration25: '🏆 Серия 25! Легенда!',
        showTaskInfo: 'Показывать инфо о задании',
        showTaskInfoDesc: 'Класс, система и тема над вопросом',
        allowSelection: 'Разрешить выделение текста',
        allowSelectionDesc: 'Включите для копирования текста (для переводчика)',
    }
};

const AVAILABLE_EMOJIS = [
    '👧', '👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿',
    '👦', '👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿',
    '🧒', '🧒🏻', '🧒🏼', '🧒🏽', '🧒🏾', '🧒🏿',
    '🐱', '🐶', '🦊', '🦁', '🐼', '🦄',
    '🦉', '🐸', '🐰', '🐝', '🚀', '⭐',
    '🌈', '🎯', '🧠', '💎', '🎨', '🌟'
];

const MAX_GRADE = 8;

// ========================================
// CONFETTI
// ========================================
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    const pieces = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${randInt(5, 95)}%`,
        delay: `${Math.random() * 0.5}s`,
        color: pick(['#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']),
        size: randInt(6, 12),
        rotation: randInt(0, 360),
    }));
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map(p => (
                <div key={p.id} className="absolute animate-confetti-fall" style={{ left: p.left, top: '-20px', animationDelay: p.delay, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px', transform: `rotate(${p.rotation}deg)` }} />
            ))}
        </div>
    );
};

// ========================================
// STREAK CELEBRATION
// ========================================
const StreakCelebration: React.FC<{ streak: number; lang: 'ru' | 'en' }> = ({ streak, lang }) => {
    const t = DICTIONARY[lang];
    let msg = '';
    if (streak === 5) msg = t.streakCelebration5;
    else if (streak === 10) msg = t.streakCelebration10;
    else if (streak === 25) msg = t.streakCelebration25;
    else return null;
    return (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce-in">
            <div className="text-4xl md:text-6xl font-black text-center p-6 md:p-8 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl shadow-2xl">{msg}</div>
        </div>
    );
};

// ========================================
// TASK VISUALIZER
// ========================================
const TaskVisualizer: React.FC<{ data: VisualData }> = ({ data }) => {
    if (!data || data.type === 'none') return null;

    if (data.type === 'bar' && data.totalParts) {
        const total = Math.min(data.totalParts, 20);
        const shaded = Math.min(data.shadedParts || 0, total);
        return (
            <div className="flex gap-1 justify-center my-4 flex-wrap">
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className={`w-6 h-8 md:w-8 md:h-10 rounded-lg border-2 transition-all duration-300 ${i < shaded ? 'bg-indigo-500 border-indigo-600 dark:bg-indigo-400 dark:border-indigo-500' : 'bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-600'}`} />
                ))}
            </div>
        );
    }

    if (data.type === 'grid' && data.rows && data.cols) {
        return (
            <div className="flex flex-col items-center gap-1.5 my-4">
                {Array.from({ length: data.rows }).map((_, r) => (
                    <div key={r} className="flex gap-1.5">
                        {Array.from({ length: data.cols! }).map((_, c) => (
                            <div key={c} className="w-8 h-8 md:w-10 md:h-10 bg-indigo-400 dark:bg-indigo-500 rounded-lg border-2 border-indigo-500 dark:border-indigo-400 animate-pop shadow-sm" style={{ animationDelay: `${(r * data.cols! + c) * 60}ms` }} />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (data.type === 'circle' && data.totalParts) {
        const total = data.totalParts; const shaded = data.shadedParts || 0;
        const size = 120; const cx = size / 2; const cy = size / 2; const r = (size - 10) / 2;
        return (
            <div className="flex justify-center my-4">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {Array.from({ length: total }).map((_, i) => {
                        const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
                        const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
                        const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle);
                        const x2 = cx + r * Math.cos(endAngle); const y2 = cy + r * Math.sin(endAngle);
                        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
                        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={i < shaded ? '#6366f1' : '#f1f5f9'} stroke="#334155" strokeWidth="2" />;
                    })}
                </svg>
            </div>
        );
    }

    if (data.type === 'numberline' && data.min !== undefined && data.max !== undefined) {
        const { min, max, marked = [] } = data;
        const width = 500; const padding = 30;
        return (
            <svg width="100%" viewBox={`0 0 ${width} 50`} className="mx-auto w-full max-w-xl my-4">
                <line x1={padding} y1={25} x2={width - padding} y2={25} stroke="#64748b" strokeWidth="2" />
                {Array.from({ length: max - min + 1 }).map((_, i) => {
                    const num = min + i; const x = padding + (i / (max - min)) * (width - 2 * padding);
                    return (
                        <g key={num}>
                            <line x1={x} y1={20} x2={x} y2={30} stroke="#64748b" strokeWidth="1.5" />
                            <text x={x} y={45} textAnchor="middle" fill="#64748b" fontSize="10">{num}</text>
                            {marked.includes(num) && <circle cx={x} cy={25} r={6} fill="#6366f1" className="animate-pop" />}
                        </g>
                    );
                })}
            </svg>
        );
    }

    return null;
};

// ========================================
// TIMER
// ========================================
const Timer: React.FC<{ seconds: number; active: boolean; onTimeUp: () => void; soundEnabled: boolean }> = ({ seconds, active, onTimeUp, soundEnabled }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

    useEffect(() => { setTimeLeft(seconds); }, [seconds, active]);

    useEffect(() => {
        if (!active) { clearInterval(intervalRef.current); return; }
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(intervalRef.current); if (soundEnabled) SoundEngine.playTimeout(); onTimeUp(); return 0; }
                if (prev <= 6 && soundEnabled) SoundEngine.playTick();
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [active]);

    const pct = (timeLeft / seconds) * 100;
    const isLow = timeLeft <= 10;

    return (
        <div className="w-full mb-4 animate-slide-down">
            <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold ${isLow ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>⏱️ {timeLeft}s</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${isLow ? 'bg-rose-500' : pct > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ========================================
// PROGRESS VIEW
// ========================================
const ProgressView: React.FC<{ history: HistoryEntry[]; lang: 'ru' | 'en'; onBack: () => void }> = ({ history, lang, onBack }) => {
    const t = DICTIONARY[lang];

    if (history.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700 animate-slide-up text-center">
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-4">{t.progressTitle}</h2>
                <p className="text-slate-500 text-lg mb-6">{t.noHistory}</p>
                <button onClick={onBack} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors">{t.backToPractice}</button>
            </div>
        );
    }

    const topicMap = new Map<string, { correct: number; total: number; grade: number; system: SchoolSystem }>();
    history.forEach(h => {
        const key = `${h.system}-g${h.grade}-${h.topic}`;
        const existing = topicMap.get(key) || { correct: 0, total: 0, grade: h.grade, system: h.system };
        existing.total++; if (h.correct) existing.correct++;
        topicMap.set(key, existing);
    });

    const topics = Array.from(topicMap.entries()).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
    const totalCorrect = history.filter(h => h.correct).length;
    const totalPct = Math.round((totalCorrect / history.length) * 100);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700 animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{t.progressTitle}</h2>
                <button onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t.backToPractice}</button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl">
                    <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalPct}%</div>
                    <div className="text-xs font-bold text-slate-400 uppercase">{t.correct}</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
                    <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{totalCorrect}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase">{t.correct}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl">
                    <div className="text-2xl md:text-3xl font-black text-slate-600 dark:text-slate-300">{history.length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase">{t.total}</div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-black uppercase text-slate-400 mb-3">{t.topicAccuracy}</h3>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {topics.map(([key, data]) => {
                        const pct = Math.round((data.correct / data.total) * 100);
                        const topicName = key.split('-').slice(2).join('-');
                        return (
                            <div key={key} className="animate-fade-in">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[60%]">
                                        <span className="text-xs text-slate-400 mr-1">{data.system} G{data.grade}</span>
                                        {topicName}
                                    </span>
                                    <span className={`text-sm font-black ${pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                        {pct}% ({data.correct}/{data.total})
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ========================================
// SETTINGS MENU
// ========================================
const SettingsMenu: React.FC<{ config: AppConfig; onConfigChange: (c: AppConfig) => void }> = ({ config, onConfigChange }) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const t = DICTIONARY[config.lang];
    const ct = COLOR_THEMES[config.colorTheme];

    const update = (k: keyof AppConfig, v: any) => onConfigChange({ ...config, [k]: v });

    const handleGrade = (grade: number) => {
        let list = [...config.gradeMode.grades];
        list = list.includes(grade) ? list.filter(g => g !== grade) : [...list, grade].sort();
        if (list.length === 0) list = [1];
        update('gradeMode', { type: list.length > 1 ? 'range' : 'single', grades: list });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full space-y-5 border border-slate-100 dark:border-slate-700 animate-slide-up">
            <h2 className={`text-2xl md:text-3xl font-black ${ct.text} ${ct.textDark}`}>{t.settings}</h2>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.studentName}</label>
                <input type="text" value={config.studentName} onChange={e => update('studentName', e.target.value)} className={`w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-lg focus:outline-none focus:ring-4 ${ct.ring} transition-all`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.lang}</label>
                    <select value={config.lang} onChange={e => update('lang', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none transition-all">
                        <option value="en">🇺🇸 English</option>
                        <option value="ru">🇷🇺 Русский</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.theme}</label>
                    <select value={config.theme} onChange={e => update('theme', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none transition-all">
                        <option value="light">{t.themeLight}</option>
                        <option value="dark">{t.themeDark}</option>
                        <option value="system">{t.themeSystem}</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.colorTheme}</label>
                <div className="grid grid-cols-6 gap-2">
                    {(Object.keys(COLOR_THEMES) as ColorTheme[]).map(c => (
                        <button key={c} onClick={() => update('colorTheme', c)} className={`h-10 rounded-xl border-3 transition-all hover:scale-110 bg-gradient-to-br ${COLOR_THEMES[c].gradient} ${config.colorTheme === c ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent'}`} />
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.gender}</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['boy', 'girl', 'none'] as Gender[]).map(g => (
                        <button key={g} onClick={() => update('avatarTheme', g)} className={`p-2.5 rounded-2xl font-bold border text-sm transition-all ${config.avatarTheme === g ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>
                            {g === 'boy' ? t.boy : g === 'girl' ? t.girl : t.neutral}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.emojiLabel}</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 border rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-24 overflow-y-auto">
                    <button onClick={() => update('emoji', '')} className={`px-2 py-1 text-xs rounded-lg border font-bold transition-all ${config.emoji === '' ? `${ct.primary} text-white ${ct.border}` : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>{t.noEmoji}</button>
                    {AVAILABLE_EMOJIS.map(em => (
                        <button key={em} onClick={() => update('emoji', em)} className={`p-1 text-xl rounded-lg border transition-all hover:scale-125 ${config.emoji === em ? `${ct.bg20} ${ct.border} scale-110` : 'border-transparent'}`}>{em}</button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.curriculum}</label>
                <select value={config.schoolSystem} onChange={e => update('schoolSystem', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none transition-all">
                    <option value="US">{t.usCurriculum}</option>
                    <option value="USSR">{t.ussrCurriculum}</option>
                    <option value="both">{t.bothCurriculum}</option>
                </select>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.gradesScope}</label>
                <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: MAX_GRADE }, (_, i) => i + 1).map(g => (
                        <label key={g} className={`flex items-center justify-center gap-1.5 cursor-pointer p-2 border rounded-xl select-none transition-all text-sm font-bold ${config.gradeMode.grades.includes(g) ? `${ct.bg20} ${ct.border} ${ct.text} ${ct.textDark}` : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>
                            <input type="checkbox" checked={config.gradeMode.grades.includes(g)} onChange={() => handleGrade(g)} className="sr-only" />
                            <span>{g}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.showTaskInfo}</label>
                <button onClick={() => update('showTaskMeta', !config.showTaskMeta)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.showTaskMeta ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                    {config.showTaskMeta ? '👁️ ON' : '👁️‍🗨️ OFF'}
                </button>
                <p className="text-xs text-slate-400 mt-1">{t.showTaskInfoDesc}</p>
            </div>

            <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.allowSelection}</label>
                <button onClick={() => update('allowTextSelection', !config.allowTextSelection)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.allowTextSelection ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                    {config.allowTextSelection ? '📋 ON' : '🔒 OFF'}
                </button>
                <p className="text-xs text-slate-400 mt-1">{t.allowSelectionDesc}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{config.sound ? t.soundOn : t.soundOff}</label>
                    <button onClick={() => update('sound', !config.sound)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.sound ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                        {config.sound ? '🔊 ON' : '🔇 OFF'}
                    </button>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.timedMode}</label>
                    <button onClick={() => update('timedMode', !config.timedMode)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.timedMode ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                        {config.timedMode ? '⏱️ ON' : '⏱️ OFF'}
                    </button>
                </div>
            </div>

            {config.timedMode && (
                <div className="animate-slide-down">
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.timerLabel}: {config.timerSeconds}s</label>
                    <input type="range" min={15} max={180} step={5} value={config.timerSeconds} onChange={e => update('timerSeconds', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                    <div className="flex justify-between text-xs text-slate-400 font-bold"><span>15s</span><span>60s</span><span>120s</span><span>180s</span></div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-xs font-bold">
                <button onClick={() => {
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'math_config.json'; a.click();
                }} className="p-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">{t.export}</button>
                <button onClick={() => fileInput.current?.click()} className="p-2.5 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all shadow-md active:scale-95">{t.import}</button>
                <input type="file" ref={fileInput} onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const r = new FileReader(); r.onload = evt => { try { onConfigChange({ ...DEFAULT_CONFIG, ...JSON.parse(evt.target?.result as string) }); } catch {} }; r.readAsText(file);
                }} className="hidden" accept=".json" />
                <button onClick={() => { if(confirm(t.resetConfirm)) onConfigChange(DEFAULT_CONFIG); }} className="p-2.5 bg-rose-600 text-white rounded-2xl col-span-3 hover:bg-rose-700 transition-all shadow-md active:scale-95">{t.reset}</button>
            </div>
        </div>
    );
};

// ========================================
// TASK DISPLAY
// ========================================
interface TaskDisplayProps {
    task: GeneratedTaskInstance;
    onAnswer: (c: boolean) => void;
    next: () => void;
    onRetry: () => void;
    lang: 'ru' | 'en';
    config: AppConfig;
}

const TaskDisplay: React.FC<TaskDisplayProps> = ({ task, onAnswer, next, onRetry, lang, config }) => {
    const [num, setNum] = useState('');
    const [den, setDen] = useState('');
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const [ok, setOk] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [emptyWarning, setEmptyWarning] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const t = DICTIONARY[lang];
    const ct = COLOR_THEMES[config.colorTheme];

    useEffect(() => {
        setNum(''); setDen(''); setText('');
        setDone(false); setOk(false); setTimedOut(false); setEmptyWarning(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [task]);

    useEffect(() => {
        if (!done) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); next(); } };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [done, next]);

    const handleTimeUp = useCallback(() => {
        if (done) return;
        setTimedOut(true); setDone(true); setOk(false); onAnswer(false);
    }, [done, onAnswer]);

    const check = (e: React.FormEvent) => {
        e.preventDefault();
        if (done) return;

        if (task.answerType === 'number' && num.trim() === '') { setEmptyWarning(true); setTimeout(() => setEmptyWarning(false), 2000); return; }
        if (task.answerType === 'fraction' && (num.trim() === '' || den.trim() === '')) { setEmptyWarning(true); setTimeout(() => setEmptyWarning(false), 2000); return; }
        if ((task.answerType === 'comparison' || task.answerType === 'text') && text.trim() === '') { setEmptyWarning(true); setTimeout(() => setEmptyWarning(false), 2000); return; }

        let isOk = false;
        if (task.answerType === 'number') isOk = parseFloat(num) === task.correctAnswer;
        else if (task.answerType === 'comparison' || task.answerType === 'text') isOk = text.trim().toLowerCase() === String(task.correctAnswer).toLowerCase();
        else if (task.answerType === 'fraction') {
            const userN = parseInt(num); const userD = parseInt(den);
            if (!isNaN(userN) && !isNaN(userD) && userD !== 0) isOk = fractionsEqual(userN, userD, task.correctAnswer.numerator, task.correctAnswer.denominator);
        }

        if (config.sound) isOk ? SoundEngine.playCorrect() : SoundEngine.playWrong();
        if (!isOk) { setIsShaking(true); setTimeout(() => setIsShaking(false), 400); }

        setOk(isOk); setDone(true); onAnswer(isOk);
    };

    const inputBase = `p-3 md:p-4 text-center border-3 rounded-2xl text-xl md:text-2xl font-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 shadow-md transition-all ${ct.border} ${ct.ring}`;

    return (
        <div className={`bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700 ${isShaking ? 'animate-shake' : 'animate-slide-up'}`}>

            {config.timedMode && !done && <Timer seconds={config.timerSeconds} active={!done} onTimeUp={handleTimeUp} soundEnabled={config.sound} />}

            {config.showTaskMeta && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-wider uppercase mb-4 animate-fade-in">
                    <span className={`${ct.bg20} ${ct.text} ${ct.textDark} px-2.5 py-1 rounded-lg`}>{t.gradeLabel} {task.grade}</span>
                    <span className="bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">{task.system === 'USSR' ? '☭' : '🇺🇸'} {task.system}</span>
                    <span className="text-slate-400 font-bold italic ml-auto normal-case text-xs">{task.topic}</span>
                </div>
            )}

            <p className="text-lg md:text-xl lg:text-2xl text-slate-800 dark:text-slate-100 font-bold mb-5 leading-relaxed whitespace-pre-line">
                {task.question}
            </p>

            {task.visual && <TaskVisualizer data={task.visual} />}

            <form onSubmit={check} className="space-y-5">
                {!done ? (
                    <div className="space-y-3">
                        {emptyWarning && (
                            <div className="text-center text-rose-500 font-bold text-sm animate-bounce-in">⚠️ {t.emptyField}</div>
                        )}
                        <div className="flex flex-wrap justify-center items-center gap-3">
                            {task.answerType === 'fraction' ? (
                                <div className="flex items-center gap-2">
                                    <input ref={inputRef} type="number" value={num} onChange={e => setNum(e.target.value)} className={`${inputBase} w-20 md:w-24`} placeholder="?" />
                                    <span className="text-3xl font-black text-slate-600 dark:text-slate-300">/</span>
                                    <input type="number" value={den} onChange={e => setDen(e.target.value)} className={`${inputBase} w-20 md:w-24`} placeholder="?" />
                                </div>
                            ) : task.answerType === 'comparison' ? (
                                <input ref={inputRef} type="text" maxLength={1} value={text} onChange={e => setText(e.target.value)} className={`${inputBase} w-24 md:w-28`} placeholder="< = >" />
                            ) : task.answerType === 'text' ? (
                                <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)} className={`${inputBase} w-40 md:w-52`} placeholder="..." />
                            ) : (
                                <input ref={inputRef} type="number" step="any" value={num} onChange={e => setNum(e.target.value)} className={`${inputBase} w-32 md:w-40`} placeholder="?" />
                            )}
                            <button type="submit" className={`${ct.primary} text-white px-6 py-3.5 md:py-4 rounded-2xl text-lg md:text-xl font-black transition-all shadow-lg ${ct.shadow} active:scale-95 hover:opacity-90`}>
                                {t.check}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-up">
                        {timedOut && <div className="text-center text-amber-500 font-black text-lg animate-bounce-in mb-2">{t.timeUp}</div>}

                        <div className={`p-5 md:p-6 rounded-2xl border-3 transition-all ${ok ? 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500 animate-correct-flash' : 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-500'}`}>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-wider uppercase opacity-60 mb-3 border-b pb-2 border-current/20">
                                <span className={`${ct.bg20} ${ct.text} ${ct.textDark} px-2.5 py-0.5 rounded-lg`}>{t.gradeLabel} {task.grade}</span>
                                <span className="bg-slate-500/20 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg">{task.system === 'USSR' ? '☭' : '🇺🇸'} {task.system}</span>
                                <span className="text-current font-bold italic ml-auto normal-case">{task.topic}</span>
                            </div>

                            <div className="font-black text-lg md:text-xl mb-2">
                                {ok ? t.correctFeedback : t.wrongFeedback}
                            </div>
                            <p className="text-base md:text-lg font-medium whitespace-pre-line opacity-90 leading-relaxed">
                                {ok ? task.explanationCorrect : task.explanationWrong}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            {!ok && (
                                <button type="button" onClick={onRetry} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 py-3.5 rounded-2xl text-lg font-black transition-all active:scale-95 border border-slate-300 dark:border-slate-600">
                                    {t.retryTask}
                                </button>
                            )}
                            <button type="button" onClick={next} className={`w-full ${ct.primary} ${ct.primaryDark} text-white py-3.5 rounded-2xl text-lg font-black shadow-xl hover:opacity-90 transition-all active:scale-95 ${ok ? 'md:col-span-2' : ''}`}>
                                {t.nextTask}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

// ========================================
// STATS BAR
// ========================================
const StatsBar: React.FC<{ stats: { correct: number; total: number; streak: number; bestStreak: number }; lang: 'ru' | 'en'; colorTheme: ColorTheme; animateCorrect: boolean; animateStreak: boolean }> = ({ stats, lang, colorTheme, animateCorrect, animateStreak }) => {
    const t = DICTIONARY[lang];
    const ct = COLOR_THEMES[colorTheme];

    return (
        <div className={`grid grid-cols-4 bg-gradient-to-r ${ct.gradient} rounded-2xl p-3 md:p-4 text-center text-white shadow-xl mb-5 w-full animate-fade-in`}>
            <div>
                <div className={`text-xl md:text-2xl font-black ${animateCorrect ? 'animate-counter-up' : ''}`}>{stats.correct}</div>
                <div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.correct}</div>
            </div>
            <div>
                <div className="text-xl md:text-2xl font-black">{stats.total}</div>
                <div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.total}</div>
            </div>
            <div>
                <div className={`text-xl md:text-2xl font-black ${animateStreak ? 'animate-streak-fire' : ''}`}>🔥 {stats.streak}</div>
                <div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.streak}</div>
            </div>
            <div>
                <div className="text-xl md:text-2xl font-black">⭐ {stats.bestStreak}</div>
                <div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.best}</div>
            </div>
        </div>
    );
};

// ========================================
// MAIN APP
// ========================================
export const App: React.FC = () => {
    const [config, setConfig] = useState<AppConfig>(() => {
        try { const s = localStorage.getItem('math_core_config'); return s ? { ...DEFAULT_CONFIG, ...JSON.parse(s) } : DEFAULT_CONFIG; } catch { return DEFAULT_CONFIG; }
    });
    const [stats, setStats] = useState(() => {
        try { const s = localStorage.getItem('math_core_stats'); return s ? JSON.parse(s) : { correct: 0, total: 0, streak: 0, bestStreak: 0 }; } catch { return { correct: 0, total: 0, streak: 0, bestStreak: 0 }; }
    });
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        try { const s = localStorage.getItem('math_core_history'); return s ? JSON.parse(s) : []; } catch { return []; }
    });
    const [task, setTask] = useState<GeneratedTaskInstance | null>(null);
    const [taskKey, setTaskKey] = useState(0);
    const [view, setView] = useState<'practice' | 'settings' | 'progress'>('practice');
    const [showConfetti, setShowConfetti] = useState(false);
    const [streakCelebration, setStreakCelebration] = useState(0);
    const [animateCorrect, setAnimateCorrect] = useState(false);
    const [animateStreak, setAnimateStreak] = useState(false);

    const t = DICTIONARY[config.lang];
    const ct = COLOR_THEMES[config.colorTheme];

    useEffect(() => {
        localStorage.setItem('math_core_config', JSON.stringify(config));
        const el = document.documentElement;
        const dark = config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) el.classList.add('dark'); else el.classList.remove('dark');
    }, [config]);

    useEffect(() => { localStorage.setItem('math_core_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('math_core_history', JSON.stringify(history)); }, [history]);
    useEffect(() => { handleNext(); }, [config.gradeMode.grades, config.schoolSystem, config.lang]);

    useEffect(() => {
        if (config.theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => { e.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [config.theme]);

    const handleNext = useCallback(() => {
        const profile: StudentProfile = { name: config.studentName.trim(), gender: config.avatarTheme };
        setTaskKey(k => k + 1);
        setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang, profile));
    }, [config]);

    const handleRetry = useCallback(() => {
        if (!task) return;
        const profile: StudentProfile = { name: config.studentName.trim(), gender: config.avatarTheme };
        setTaskKey(k => k + 1);
        setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang, profile, task.id));
    }, [config, task]);

    const handleResult = useCallback((ok: boolean) => {
        setStats((p: any) => {
            const newStreak = ok ? p.streak + 1 : 0;
            return { correct: p.correct + (ok ? 1 : 0), total: p.total + 1, streak: newStreak, bestStreak: Math.max(p.bestStreak || 0, newStreak) };
        });

        if (task) {
            setHistory(prev => [...prev.slice(-499), { taskId: task.id, grade: task.grade, system: task.system, topic: task.topic, correct: ok, timestamp: Date.now() }]);
        }

        if (ok) {
            setAnimateCorrect(true);
            setTimeout(() => setAnimateCorrect(false), 400);

            const newStreak = stats.streak + 1;
            if ([5, 10, 25].includes(newStreak)) {
                setShowConfetti(true); setStreakCelebration(newStreak); setAnimateStreak(true);
                if (config.sound) SoundEngine.playStreak();
                setTimeout(() => { setShowConfetti(false); setStreakCelebration(0); setAnimateStreak(false); }, 2500);
            } else {
                setAnimateStreak(true);
                setTimeout(() => setAnimateStreak(false), 600);
            }
        }
    }, [task, stats.streak, config.sound]);

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
        <div className={`min-h-screen w-screen p-3 md:p-6 lg:p-10 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col items-center justify-start md:justify-center overflow-x-hidden overflow-y-auto ${config.allowTextSelection ? '' : 'select-none'}`}>
            <Confetti active={showConfetti} />
            <StreakCelebration streak={streakCelebration} lang={config.lang} />

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl flex flex-col justify-center">
                <header className="flex justify-between items-center py-3 md:py-4 mb-2 w-full animate-fade-in">
                    <div>
                        <h1 className={`text-2xl md:text-3xl lg:text-4xl font-black ${ct.text} ${ct.textDark} tracking-widest`}>{t.appTitle}</h1>
                        <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5 italic tracking-wide">{t.appSubtitle}</p>
                        <p className="text-xs md:text-sm text-slate-400 font-bold mt-0.5">{renderWorkspaceTitle()} {config.emoji}</p>
                    </div>
                    <div className="flex gap-2">
                        {view !== 'progress' && (
                            <button onClick={() => setView(view === 'settings' ? 'practice' : 'settings')} className="px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
                                {view === 'settings' ? t.practice : t.menu}
                            </button>
                        )}
                        <button onClick={() => setView(view === 'progress' ? 'practice' : 'progress')} className="px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
                            {view === 'progress' ? t.practice : t.history}
                        </button>
                    </div>
                </header>

                <StatsBar stats={stats} lang={config.lang} colorTheme={config.colorTheme} animateCorrect={animateCorrect} animateStreak={animateStreak} />

                <div className="w-full flex items-start justify-center pb-6">
                    {view === 'settings' ? (
                        <SettingsMenu config={config} onConfigChange={setConfig} />
                    ) : view === 'progress' ? (
                        <ProgressView history={history} lang={config.lang} onBack={() => setView('practice')} />
                    ) : (
                        task && <TaskDisplay key={taskKey} task={task} onAnswer={handleResult} next={handleNext} onRetry={handleRetry} lang={config.lang} config={config} />
                    )}
                </div>
            </div>
        </div>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
