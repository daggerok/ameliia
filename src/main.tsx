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
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch {}
    },
    playWrong() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch {}
    },
    playStreak() {
        try {
            const ctx = this.getCtx();
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
                osc.start(ctx.currentTime + i * 0.1);
                osc.stop(ctx.currentTime + i * 0.1 + 0.3);
            });
        } catch {}
    },
    playTick() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        } catch {}
    },
    playTimeout() {
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch {}
    }
};

// ========================================
// HELPERS
// ========================================
const getPraise = (profile: StudentProfile, lang: 'ru' | 'en'): string => {
    const name = profile.name || (lang === 'ru' ? 'Ученик' : 'Student');
    if (lang === 'en') return `Great job, ${name}! 🎉`;
    if (profile.gender === 'girl') return `Умница, ${name}! 🎉`;
    if (profile.gender === 'boy') return `Молодец, ${name}! 🎉`;
    return `Отличная работа, ${name}! 🎉`;
};

const getEncouragement = (profile: StudentProfile, lang: 'ru' | 'en'): string => {
    const name = profile.name || (lang === 'ru' ? 'друг' : 'friend');
    if (lang === 'en') return `Not quite right, ${name}. But that's okay — let's learn together! Here's how to solve it step by step:`;
    if (profile.gender === 'girl') return `Пока не совсем верно, ${name}. Но ничего страшного — давай разберёмся вместе! Вот как решить это задание шаг за шагом:`;
    if (profile.gender === 'boy') return `Пока не совсем верно, ${name}. Но ничего страшного — давай разберёмся вместе! Вот как решить это задание шаг за шагом:`;
    return `Пока не совсем верно, ${name}. Давай разберёмся вместе! Вот как решить это шаг за шагом:`;
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
// COLOR THEMES
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
// TASK REGISTRY
// ========================================
export const registry: TaskGeneratorModule[] = [
    // ==========================================
    // GRADE 1 — USSR
    // ==========================================
    {
        id: 'ussr-g1-add-over-ten',
        grade: 1,
        system: 'USSR',
        topicRu: 'Сложение через десяток',
        topicEn: 'Addition over 10',
        generateState: () => ({ a: randInt(6, 9), b: randInt(5, 9), v: randInt(0, 2) }),
        render: (s, lang, p) => {
            const sum = s.a + s.b;
            const toTen = 10 - s.a;
            const rest = s.b - toTen;
            const q = lang === 'ru'
                ? [`Сколько будет ${s.a} + ${s.b}?\n\nНапиши число — результат сложения.`, `Найди сумму двух чисел: ${s.a} и ${s.b}.\n\nСложи их вместе и напиши ответ.`, `Первое число — ${s.a}, второе число — ${s.b}.\n\nСколько получится, если их сложить?`][s.v]
                : [`What is ${s.a} + ${s.b}?\n\nAdd these two numbers together and type the answer.`, `Find the sum of ${s.a} and ${s.b}.\n\nType the total.`, `First number is ${s.a}, second is ${s.b}.\n\nWhat do you get when you add them?`][s.v];
            const wrongBody = lang === 'ru'
                ? `Когда мы складываем числа и получается больше 10, удобно считать «через десяток».\n\n📌 Шаг 1: Сначала дополним ${s.a} до 10. Для этого от ${s.b} «заберём» ${toTen}, потому что ${s.a} + ${toTen} = 10.\n📌 Шаг 2: От ${s.b} осталось ${rest} (потому что ${s.b} − ${toTen} = ${rest}).\n📌 Шаг 3: Теперь 10 + ${rest} = ${sum}.\n\n✅ Ответ: ${s.a} + ${s.b} = ${sum}`
                : `When adding numbers that go over 10, we can use the "make a 10" strategy.\n\n📌 Step 1: How many more does ${s.a} need to reach 10? It needs ${toTen} more, because ${s.a} + ${toTen} = 10.\n📌 Step 2: Take ${toTen} from ${s.b}. That leaves ${rest} (because ${s.b} − ${toTen} = ${rest}).\n📌 Step 3: Now add: 10 + ${rest} = ${sum}.\n\n✅ Answer: ${s.a} + ${s.b} = ${sum}`;
            const correctBody = lang === 'ru' ? `${s.a} + ${s.b} = ${sum}. Ты отлично считаешь через десяток!` : `${s.a} + ${s.b} = ${sum}. You nailed the "make a 10" strategy!`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${correctBody}`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: sum };
        }
    },
    {
        id: 'ussr-g1-subtract',
        grade: 1,
        system: 'USSR',
        topicRu: 'Вычитание в пределах 20',
        topicEn: 'Subtraction within 20',
        generateState: () => ({ a: randInt(11, 18), b: randInt(3, 9) }),
        render: (s, lang, p) => {
            const diff = s.a - s.b;
            const q = lang === 'ru'
                ? `Сколько будет ${s.a} − ${s.b}?\n\nОт большего числа отними меньшее и напиши результат.`
                : `What is ${s.a} − ${s.b}?\n\nSubtract the smaller number from the bigger one. Type the result.`;
            const wrongBody = lang === 'ru'
                ? `Вычитание — это когда мы «убираем» часть от числа.\n\n📌 У нас есть ${s.a}. Нам нужно убрать ${s.b}.\n📌 Можно считать назад от ${s.a}: отсчитай ${s.b} шагов назад.\n📌 ${s.a} − ${s.b} = ${diff}\n\n💡 Подсказка: Если сложно, можно проверить — ${diff} + ${s.b} = ${s.a}? Да!\n\n✅ Ответ: ${diff}`
                : `Subtraction means "taking away" some from a number.\n\n📌 We start with ${s.a} and need to take away ${s.b}.\n📌 Count back ${s.b} steps from ${s.a}.\n📌 ${s.a} − ${s.b} = ${diff}\n\n💡 Tip: You can check — does ${diff} + ${s.b} = ${s.a}? Yes!\n\n✅ Answer: ${diff}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.a} − ${s.b} = ${diff}. ${lang === 'ru' ? 'Верно!' : 'Correct!'}`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: diff };
        }
    },
    {
        id: 'ussr-g1-compare',
        grade: 1,
        system: 'USSR',
        topicRu: 'Сравнение чисел',
        topicEn: 'Comparing Numbers',
        generateState: () => {
            const a = randInt(1, 20);
            let b = randInt(1, 20);
            if (Math.random() < 0.3) b = a;
            return { a, b };
        },
        render: (s, lang, p) => {
            const ans = s.a > s.b ? '>' : s.a < s.b ? '<' : '=';
            const q = lang === 'ru'
                ? `Сравни два числа: ${s.a} и ${s.b}.\n\nПоставь правильный знак:\n• > (больше) — если первое число больше\n• < (меньше) — если первое число меньше\n• = (равно) — если числа одинаковые\n\n${s.a}  □  ${s.b}`
                : `Compare two numbers: ${s.a} and ${s.b}.\n\nType the correct sign:\n• > (greater) — if the first number is bigger\n• < (less) — if the first number is smaller\n• = (equal) — if they are the same\n\n${s.a}  □  ${s.b}`;
            const wrongBody = lang === 'ru'
                ? `Чтобы сравнить числа, представь числовую прямую. Число, которое стоит правее (дальше от нуля) — больше.\n\n📌 ${s.a} ${s.a > s.b ? 'стоит правее' : s.a < s.b ? 'стоит левее' : 'стоит на том же месте, что и'} ${s.b}\n📌 Значит ${s.a} ${ans} ${s.b}\n\n💡 Запомни: знак < похож на букву «Л» (Левое меньше). Острый конец всегда смотрит на меньшее число.\n\n✅ Ответ: ${ans}`
                : `To compare numbers, imagine a number line. The number further to the right is bigger.\n\n📌 ${s.a} is ${s.a > s.b ? 'to the right of' : s.a < s.b ? 'to the left of' : 'at the same spot as'} ${s.b}\n📌 So ${s.a} ${ans} ${s.b}\n\n💡 Remember: The pointy end of < or > always points to the smaller number.\n\n✅ Answer: ${ans}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.a} ${ans} ${s.b}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'comparison' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g1-missing-number',
        grade: 1,
        system: 'USSR',
        topicRu: 'Неизвестное слагаемое',
        topicEn: 'Missing Addend',
        generateState: () => {
            const a = randInt(2, 9);
            const b = randInt(2, 9);
            return { a, b, hideFirst: Math.random() > 0.5 };
        },
        render: (s, lang, p) => {
            const sum = s.a + s.b;
            const ans = s.hideFirst ? s.a : s.b;
            const known = s.hideFirst ? s.b : s.a;
            const eq = s.hideFirst ? `? + ${s.b} = ${sum}` : `${s.a} + ? = ${sum}`;
            const q = lang === 'ru'
                ? `В этом примере спряталось одно число. Найди его!\n\n${eq}\n\nКакое число нужно поставить вместо «?», чтобы равенство стало верным?`
                : `One number is hiding in this equation. Find it!\n\n${eq}\n\nWhat number should replace "?" to make this equation true?`;
            const wrongBody = lang === 'ru'
                ? `Когда одно число в сложении спряталось, мы можем найти его с помощью вычитания!\n\n📌 Мы знаем, что ? + ${known} = ${sum} (или ${known} + ? = ${sum})\n📌 Чтобы найти неизвестное, вычтем известное из суммы: ${sum} − ${known} = ${ans}\n📌 Проверка: ${s.a} + ${s.b} = ${sum} ✓\n\n💡 Правило: Чтобы найти неизвестное слагаемое, из суммы вычитают известное слагаемое.\n\n✅ Ответ: ${ans}`
                : `When a number is missing from addition, we can find it using subtraction!\n\n📌 We know that ? + ${known} = ${sum}\n📌 To find the missing number, subtract the known number from the total: ${sum} − ${known} = ${ans}\n📌 Check: ${s.a} + ${s.b} = ${sum} ✓\n\n💡 Rule: To find a missing addend, subtract the known addend from the sum.\n\n✅ Answer: ${ans}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.a} + ${s.b} = ${sum}. ${lang === 'ru' ? 'Неизвестное число — ' : 'The missing number is '}${ans}!`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g1-word-problem',
        grade: 1,
        system: 'USSR',
        topicRu: 'Задача в одно действие',
        topicEn: 'One-Step Word Problem',
        generateState: () => ({ type: randInt(0, 3), a: randInt(3, 10), b: randInt(2, 7) }),
        render: (s, lang, p) => {
            const name = p.name || (lang === 'ru' ? 'Маша' : 'Emma');
            const stories = lang === 'ru' ? [
                { q: `У ${name} было ${s.a} яблок. Потом ей подарили ещё ${s.b} яблок.\n\nСколько яблок стало у ${name} всего? Напиши число.`, ans: s.a + s.b,
                    wrong: `Здесь нужно сложить — ведь яблок стало БОЛЬШЕ (подарили ещё).\n\n📌 Было: ${s.a} яблок\n📌 Подарили ещё: ${s.b} яблок\n📌 Стало: ${s.a} + ${s.b} = ${s.a + s.b} яблок\n\n💡 Слово «ещё» подсказывает, что нужно складывать.\n\n✅ Ответ: ${s.a + s.b}`,
                    right: `${s.a} + ${s.b} = ${s.a + s.b} яблок.` },
                { q: `На дереве сидели ${s.a + s.b} птичек. Потом ${s.b} птичек улетели.\n\nСколько птичек осталось на дереве? Напиши число.`, ans: s.a,
                    wrong: `Здесь нужно вычитать — ведь птичек стало МЕНЬШЕ (улетели).\n\n📌 Было: ${s.a + s.b} птичек\n📌 Улетели: ${s.b} птичек\n📌 Осталось: ${s.a + s.b} − ${s.b} = ${s.a} птичек\n\n💡 Слово «улетели» / «осталось» подсказывает вычитание.\n\n✅ Ответ: ${s.a}`,
                    right: `${s.a + s.b} − ${s.b} = ${s.a} птичек.` },
                { q: `В вазе стоят ${s.a} красных роз и ${s.b} белых роз.\n\nСколько роз в вазе всего? Напиши число.`, ans: s.a + s.b,
                    wrong: `Нужно сложить все розы вместе!\n\n📌 Красные: ${s.a} роз\n📌 Белые: ${s.b} роз\n📌 Всего: ${s.a} + ${s.b} = ${s.a + s.b} роз\n\n💡 Слово «всего» подсказывает, что нужно сложить все части.\n\n✅ Ответ: ${s.a + s.b}`,
                    right: `${s.a} + ${s.b} = ${s.a + s.b} роз.` },
                { q: `${name} за день прочитал(а) ${s.a + s.b} страниц. Утром — ${s.a} страниц, а остальные вечером.\n\nСколько страниц ${name} прочитал(а) вечером?`, ans: s.b,
                    wrong: `Если мы знаем всего и знаем часть — вычитаем!\n\n📌 Всего за день: ${s.a + s.b} страниц\n📌 Утром: ${s.a} страниц\n📌 Вечером (остаток): ${s.a + s.b} − ${s.a} = ${s.b} страниц\n\n💡 «Остальные» = всего минус известная часть.\n\n✅ Ответ: ${s.b}`,
                    right: `${s.a + s.b} − ${s.a} = ${s.b} страниц.` },
            ] : [
                { q: `${name} had ${s.a} apples. Then she got ${s.b} more apples.\n\nHow many apples does ${name} have now? Type the number.`, ans: s.a + s.b,
                    wrong: `We need to ADD because she got MORE apples.\n\n📌 Had: ${s.a} apples\n📌 Got more: ${s.b} apples\n📌 Now has: ${s.a} + ${s.b} = ${s.a + s.b} apples\n\n💡 The word "more" tells us to add.\n\n✅ Answer: ${s.a + s.b}`,
                    right: `${s.a} + ${s.b} = ${s.a + s.b} apples.` },
                { q: `There were ${s.a + s.b} birds in a tree. Then ${s.b} birds flew away.\n\nHow many birds are still in the tree? Type the number.`, ans: s.a,
                    wrong: `We need to SUBTRACT because birds left (fewer now).\n\n📌 Were: ${s.a + s.b} birds\n📌 Flew away: ${s.b} birds\n📌 Left: ${s.a + s.b} − ${s.b} = ${s.a} birds\n\n💡 "Flew away" / "left" means subtract.\n\n✅ Answer: ${s.a}`,
                    right: `${s.a + s.b} − ${s.b} = ${s.a} birds.` },
                { q: `A vase has ${s.a} red roses and ${s.b} white roses.\n\nHow many roses are in the vase altogether? Type the number.`, ans: s.a + s.b,
                    wrong: `We need to ADD all roses together.\n\n📌 Red: ${s.a}\n📌 White: ${s.b}\n📌 Total: ${s.a} + ${s.b} = ${s.a + s.b}\n\n💡 "Altogether" or "total" means add everything up.\n\n✅ Answer: ${s.a + s.b}`,
                    right: `${s.a} + ${s.b} = ${s.a + s.b} roses.` },
                { q: `${name} read ${s.a + s.b} pages today. She read ${s.a} in the morning and the rest in the evening.\n\nHow many pages did she read in the evening?`, ans: s.b,
                    wrong: `We know the total and one part — subtract to find the other part.\n\n📌 Total: ${s.a + s.b} pages\n📌 Morning: ${s.a} pages\n📌 Evening: ${s.a + s.b} − ${s.a} = ${s.b} pages\n\n💡 "The rest" = total minus the known part.\n\n✅ Answer: ${s.b}`,
                    right: `${s.a + s.b} − ${s.a} = ${s.b} pages.` },
            ];
            const st = stories[s.type];
            return { question: st.q, explanationCorrect: `${getPraise(p, lang)} ${st.right}`, explanationWrong: `${getEncouragement(p, lang)}\n\n${st.wrong}`, answerType: 'number' as InputType, correctAnswer: st.ans };
        }
    },

    // ==========================================
    // GRADE 1 — US
    // ==========================================
    {
        id: 'us-g1-equality',
        grade: 1,
        system: 'US',
        topicRu: 'Истинные равенства',
        topicEn: 'True Equality',
        generateState: () => {
            const a = randInt(2, 6);
            const b = randInt(2, 6);
            return { a, b, c: randInt(1, a + b - 1), v: randInt(0, 1) };
        },
        render: (s, lang, p) => {
            const missing = (s.a + s.b) - s.c;
            const total = s.a + s.b;
            const eq = s.v === 1 ? `? + ${s.c} = ${s.a} + ${s.b}` : `${s.a} + ${s.b} = ${s.c} + ?`;
            const q = lang === 'ru'
                ? `В равенстве обе стороны от знака «=» должны быть одинаковыми.\n\nНайди число вместо знака «?», чтобы равенство стало верным:\n\n${eq}`
                : `In an equation, both sides of the "=" sign must be the same.\n\nFind the missing number (shown as "?") to make this equation true:\n\n${eq}`;
            const wrongBody = lang === 'ru'
                ? `Равенство — как весы: обе чаши должны весить одинаково!\n\n📌 Левая сторона: ${s.a} + ${s.b} = ${total}\n📌 Значит правая сторона тоже должна быть = ${total}\n📌 ${s.c} + ? = ${total}\n📌 ? = ${total} − ${s.c} = ${missing}\n\n💡 Проверка: ${s.c} + ${missing} = ${total} ✓\n\n✅ Ответ: ${missing}`
                : `An equation is like a balance scale — both sides must weigh the same!\n\n📌 One side: ${s.a} + ${s.b} = ${total}\n📌 So the other side must also equal ${total}\n📌 ${s.c} + ? = ${total}\n📌 ? = ${total} − ${s.c} = ${missing}\n\n💡 Check: ${s.c} + ${missing} = ${total} ✓\n\n✅ Answer: ${missing}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.c} + ${missing} = ${total}. ${lang === 'ru' ? 'Обе стороны равны!' : 'Both sides are equal!'}`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: missing };
        }
    },
    {
        id: 'us-g1-count-shapes',
        grade: 1,
        system: 'US',
        topicRu: 'Считаем фигуры',
        topicEn: 'Counting Shapes',
        generateState: () => ({ rows: randInt(1, 3), cols: randInt(2, 5) }),
        render: (s, lang, p) => {
            const total = s.rows * s.cols;
            const q = lang === 'ru' ? `Посчитай все квадратики на картинке ниже.\n\nМожно считать по одному, или рядами. Напиши, сколько квадратиков всего.` : `Count all the squares in the picture below.\n\nYou can count one by one, or by rows. Type the total number.`;
            const wrongBody = lang === 'ru'
                ? `Давай посчитаем рядами — так быстрее и точнее!\n\n📌 На картинке ${s.rows} ряда\n📌 В каждом ряду ${s.cols} квадратиков\n📌 Можно посчитать: ${Array.from({ length: s.rows }, () => s.cols).join(' + ')} = ${total}\n📌 Или ${s.rows} × ${s.cols} = ${total}\n\n✅ Ответ: ${total}`
                : `Let's count by rows — it's faster and more accurate!\n\n📌 There are ${s.rows} rows\n📌 Each row has ${s.cols} squares\n📌 Count: ${Array.from({ length: s.rows }, () => s.cols).join(' + ')} = ${total}\n📌 Or ${s.rows} × ${s.cols} = ${total}\n\n✅ Answer: ${total}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${total} ${lang === 'ru' ? 'квадратиков' : 'squares'}!`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: total, visual: { type: 'grid' as const, rows: s.rows, cols: s.cols } };
        }
    },
    {
        id: 'us-g1-tens-ones',
        grade: 1,
        system: 'US',
        topicRu: 'Десятки и единицы',
        topicEn: 'Tens and Ones',
        generateState: () => ({ tens: randInt(1, 5), ones: randInt(0, 9), askTens: Math.random() > 0.5 }),
        render: (s, lang, p) => {
            const num = s.tens * 10 + s.ones;
            const q = s.askTens
                ? (lang === 'ru' ? `Число ${num} состоит из десятков и единиц.\n\nСколько в нём ДЕСЯТКОВ?\n\n💡 Десятки — это группы по 10.` : `The number ${num} is made of tens and ones.\n\nHow many TENS does it have?\n\n💡 Tens are groups of 10.`)
                : (lang === 'ru' ? `Число ${num} состоит из десятков и единиц.\n\nСколько в нём ЕДИНИЦ?\n\n💡 Единицы — это то, что «осталось» после десятков.` : `The number ${num} is made of tens and ones.\n\nHow many ONES does it have?\n\n💡 Ones are what's "left over" after the tens.`);
            const wrongBody = lang === 'ru'
                ? `Каждое двузначное число состоит из десятков и единиц.\n\n📌 Число ${num} можно разложить:\n📌 ${s.tens} десятков (это ${s.tens} × 10 = ${s.tens * 10})\n📌 ${s.ones} единиц\n📌 ${s.tens * 10} + ${s.ones} = ${num}\n\n💡 Первая цифра (слева) — это десятки, вторая — единицы.\n\n✅ Ответ: ${s.askTens ? s.tens : s.ones}`
                : `Every two-digit number is made of tens and ones.\n\n📌 The number ${num} breaks down as:\n📌 ${s.tens} tens (that's ${s.tens} × 10 = ${s.tens * 10})\n📌 ${s.ones} ones\n📌 ${s.tens * 10} + ${s.ones} = ${num}\n\n💡 The left digit = tens, the right digit = ones.\n\n✅ Answer: ${s.askTens ? s.tens : s.ones}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${num} = ${s.tens} ${lang === 'ru' ? 'дес.' : 'tens'} + ${s.ones} ${lang === 'ru' ? 'ед.' : 'ones'}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.askTens ? s.tens : s.ones };
        }
    },

    // ==========================================
    // GRADE 2 — USSR
    // ==========================================
    {
        id: 'ussr-g2-mult-table',
        grade: 2,
        system: 'USSR',
        topicRu: 'Таблица умножения',
        topicEn: 'Multiplication Table',
        generateState: () => ({ a: randInt(2, 9), b: randInt(2, 9), askProduct: Math.random() > 0.3 }),
        render: (s, lang, p) => {
            const product = s.a * s.b;
            if (s.askProduct) {
                const q = lang === 'ru'
                    ? `Сколько будет ${s.a} × ${s.b}?\n\nУмножение — это когда мы складываем одно число несколько раз.\n${s.a} × ${s.b} значит: «возьми ${s.a} ровно ${s.b} раз».`
                    : `What is ${s.a} × ${s.b}?\n\nMultiplication means adding a number to itself several times.\n${s.a} × ${s.b} means: "take ${s.a}, ${s.b} times".`;
                const wrongBody = lang === 'ru'
                    ? `Умножение — это быстрое сложение!\n\n📌 ${s.a} × ${s.b} = ${Array(s.b).fill(s.a).join(' + ')} = ${product}\n📌 Мы сложили число ${s.a} ровно ${s.b} раз.\n\n💡 Совет: Учи таблицу умножения — она пригодится тебе всю жизнь!\n\n✅ Ответ: ${product}`
                    : `Multiplication is just fast addition!\n\n📌 ${s.a} × ${s.b} = ${Array(s.b).fill(s.a).join(' + ')} = ${product}\n📌 We added ${s.a} to itself ${s.b} times.\n\n💡 Tip: Practice your times tables — they'll help you forever!\n\n✅ Answer: ${product}`;
                return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.a} × ${s.b} = ${product}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: product };
            } else {
                const q = lang === 'ru'
                    ? `Сколько будет ${product} ÷ ${s.a}?\n\nДеление — обратное действие умножению. На сколько групп по ${s.a} можно разделить ${product}?`
                    : `What is ${product} ÷ ${s.a}?\n\nDivision is the opposite of multiplication. How many groups of ${s.a} fit into ${product}?`;
                const wrongBody = lang === 'ru'
                    ? `Деление — это обратное умножение.\n\n📌 Вопрос: ${product} ÷ ${s.a} = ?\n📌 Это то же самое, что спросить: «${s.a} × ? = ${product}»\n📌 ${s.a} × ${s.b} = ${product}, значит ${product} ÷ ${s.a} = ${s.b}\n\n💡 Если знаешь таблицу умножения, деление — легко!\n\n✅ Ответ: ${s.b}`
                    : `Division is the reverse of multiplication.\n\n📌 Question: ${product} ÷ ${s.a} = ?\n📌 That's the same as: "${s.a} × ? = ${product}"\n📌 ${s.a} × ${s.b} = ${product}, so ${product} ÷ ${s.a} = ${s.b}\n\n💡 If you know your times tables, division is easy!\n\n✅ Answer: ${s.b}`;
                return { question: q, explanationCorrect: `${getPraise(p, lang)} ${product} ÷ ${s.a} = ${s.b}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.b };
            }
        }
    },
    {
        id: 'ussr-g2-add-hundreds',
        grade: 2,
        system: 'USSR',
        topicRu: 'Сложение в пределах 100',
        topicEn: 'Addition within 100',
        generateState: () => ({ a: randInt(20, 60), b: randInt(15, 39) }),
        render: (s, lang, p) => {
            const sum = s.a + s.b;
            const q = lang === 'ru' ? `Вычисли: ${s.a} + ${s.b} = ?\n\nСложи два числа и напиши результат.` : `Calculate: ${s.a} + ${s.b} = ?\n\nAdd the two numbers and type the result.`;
            const aTens = Math.floor(s.a / 10) * 10;
            const aOnes = s.a % 10;
            const bTens = Math.floor(s.b / 10) * 10;
            const bOnes = s.b % 10;
            const wrongBody = lang === 'ru'
                ? `Складывать большие числа удобно по разрядам!\n\n📌 Разложим: ${s.a} = ${aTens} + ${aOnes}, ${s.b} = ${bTens} + ${bOnes}\n📌 Десятки: ${aTens} + ${bTens} = ${aTens + bTens}\n📌 Единицы: ${aOnes} + ${bOnes} = ${aOnes + bOnes}\n📌 Итого: ${aTens + bTens} + ${aOnes + bOnes} = ${sum}\n\n✅ Ответ: ${sum}`
                : `It's easier to add big numbers by place value!\n\n📌 Break apart: ${s.a} = ${aTens} + ${aOnes}, ${s.b} = ${bTens} + ${bOnes}\n📌 Tens: ${aTens} + ${bTens} = ${aTens + bTens}\n📌 Ones: ${aOnes} + ${bOnes} = ${aOnes + bOnes}\n📌 Total: ${aTens + bTens} + ${aOnes + bOnes} = ${sum}\n\n✅ Answer: ${sum}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.a} + ${s.b} = ${sum}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: sum };
        }
    },
    {
        id: 'ussr-g2-equations',
        grade: 2,
        system: 'USSR',
        topicRu: 'Уравнения',
        topicEn: 'Equations',
        generateState: () => {
            const x = randInt(10, 30);
            const known = randInt(20, 40);
            return { x, known, sum: x + known };
        },
        render: (s, lang, p) => {
            const q = lang === 'ru'
                ? `Реши уравнение:\n\nx + ${s.known} = ${s.sum}\n\nНайди, чему равен x. Это число, которое при сложении с ${s.known} даёт ${s.sum}.`
                : `Solve the equation:\n\nx + ${s.known} = ${s.sum}\n\nFind the value of x. It's the number that, when added to ${s.known}, gives ${s.sum}.`;
            const wrongBody = lang === 'ru'
                ? `Уравнение — это «математическая загадка»: найди число, которое делает равенство верным.\n\n📌 x + ${s.known} = ${s.sum}\n📌 Чтобы найти x, нужно из ${s.sum} вычесть ${s.known}\n📌 x = ${s.sum} − ${s.known} = ${s.x}\n📌 Проверка: ${s.x} + ${s.known} = ${s.sum} ✓\n\n💡 Правило: неизвестное слагаемое = сумма минус известное слагаемое.\n\n✅ Ответ: x = ${s.x}`
                : `An equation is a math puzzle: find the number that makes it true.\n\n📌 x + ${s.known} = ${s.sum}\n📌 To find x, subtract ${s.known} from ${s.sum}\n📌 x = ${s.sum} − ${s.known} = ${s.x}\n📌 Check: ${s.x} + ${s.known} = ${s.sum} ✓\n\n💡 Rule: missing addend = sum − known addend.\n\n✅ Answer: x = ${s.x}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} x = ${s.x}. (${s.x} + ${s.known} = ${s.sum} ✓)`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.x };
        }
    },

    // ==========================================
    // GRADE 2 — US
    // ==========================================
    {
        id: 'us-g2-arrays',
        grade: 2,
        system: 'US',
        topicRu: 'Массивы (умножение)',
        topicEn: 'Multiplication Arrays',
        generateState: () => ({ rows: randInt(2, 5), cols: randInt(2, 5) }),
        render: (s, lang, p) => {
            const total = s.rows * s.cols;
            const q = lang === 'ru'
                ? `Посмотри на картинку: ${s.rows} рядов по ${s.cols} квадратика.\n\nСколько квадратиков всего? Можешь считать по одному или рядами.`
                : `Look at the picture: ${s.rows} rows with ${s.cols} squares each.\n\nHow many squares are there in total? You can count one by one or by rows.`;
            const wrongBody = lang === 'ru'
                ? `Когда предметы расставлены рядами — можно умножать!\n\n📌 ${s.rows} рядов по ${s.cols} = ${s.rows} × ${s.cols}\n📌 Или сложим: ${Array(s.rows).fill(s.cols).join(' + ')} = ${total}\n\n💡 Умножение — это быстрый способ посчитать одинаковые группы.\n\n✅ Ответ: ${total}`
                : `When things are arranged in equal rows — you can multiply!\n\n📌 ${s.rows} rows of ${s.cols} = ${s.rows} × ${s.cols}\n📌 Or add: ${Array(s.rows).fill(s.cols).join(' + ')} = ${total}\n\n💡 Multiplication is a shortcut for counting equal groups.\n\n✅ Answer: ${total}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.rows} × ${s.cols} = ${total}!`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: total, visual: { type: 'grid' as const, rows: s.rows, cols: s.cols } };
        }
    },
    {
        id: 'us-g2-even-odd',
        grade: 2,
        system: 'US',
        topicRu: 'Чётные и нечётные',
        topicEn: 'Even or Odd',
        generateState: () => ({ n: randInt(1, 50) }),
        render: (s, lang, p) => {
            const isEven = s.n % 2 === 0;
            const q = lang === 'ru'
                ? `Число ${s.n} — чётное или нечётное?\n\n• Чётное — делится на 2 без остатка (2, 4, 6, 8...)\n• Нечётное — НЕ делится на 2 без остатка (1, 3, 5, 7...)\n\nНапиши «чёт» или «нечет».`
                : `Is the number ${s.n} even or odd?\n\n• Even — can be split into 2 equal groups (2, 4, 6, 8...)\n• Odd — cannot be split equally (1, 3, 5, 7...)\n\nType "even" or "odd".`;
            const wrongBody = lang === 'ru'
                ? `Чётное число можно разделить на 2 ровно, без остатка.\n\n📌 ${s.n} ÷ 2 = ${isEven ? s.n / 2 : `${Math.floor(s.n / 2)} остаток 1`}\n📌 Значит ${s.n} — ${isEven ? 'ЧЁТНОЕ' : 'НЕЧЁТНОЕ'}\n\n💡 Подсказка: смотри на последнюю цифру! Если она 0, 2, 4, 6, 8 — число чётное. Если 1, 3, 5, 7, 9 — нечётное.\n📌 Последняя цифра ${s.n} — это ${s.n % 10}, ${isEven ? 'чётная' : 'нечётная'}\n\n✅ Ответ: ${isEven ? 'чёт' : 'нечет'}`
                : `An even number divides by 2 with no remainder.\n\n📌 ${s.n} ÷ 2 = ${isEven ? s.n / 2 : `${Math.floor(s.n / 2)} remainder 1`}\n📌 So ${s.n} is ${isEven ? 'EVEN' : 'ODD'}\n\n💡 Quick trick: look at the last digit! 0, 2, 4, 6, 8 → even. 1, 3, 5, 7, 9 → odd.\n📌 Last digit of ${s.n} is ${s.n % 10} → ${isEven ? 'even' : 'odd'}\n\n✅ Answer: ${isEven ? 'even' : 'odd'}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.n} ${lang === 'ru' ? (isEven ? '— чётное!' : '— нечётное!') : (isEven ? 'is even!' : 'is odd!')}`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'text' as InputType, correctAnswer: lang === 'ru' ? (isEven ? 'чёт' : 'нечет') : (isEven ? 'even' : 'odd') };
        }
    },

    // ==========================================
    // GRADE 3 — USSR
    // ==========================================
    {
        id: 'ussr-g3-svt',
        grade: 3,
        system: 'USSR',
        topicRu: 'Скорость, время, расстояние',
        topicEn: 'Speed, Time, Distance',
        generateState: () => {
            const v = randInt(40, 80);
            const t = randInt(2, 5);
            return { v, t, s: v * t, type: randInt(0, 2) };
        },
        render: (s, lang, p) => {
            let q = '', wrongBody = '', ans = 0, correctBody = '';
            if (s.type === 0) {
                ans = s.s;
                q = lang === 'ru'
                    ? `Поезд едет со скоростью ${s.v} км/ч. Он ехал ${s.t} часа.\n\nКакое расстояние проехал поезд?\n\n💡 Скорость показывает, сколько км проезжается за 1 час.`
                    : `A train travels at ${s.v} km/h. It drove for ${s.t} hours.\n\nWhat distance did the train cover?\n\n💡 Speed tells you how many km are traveled in 1 hour.`;
                wrongBody = lang === 'ru'
                    ? `Чтобы найти расстояние, нужно скорость умножить на время!\n\n📌 Формула: Расстояние = Скорость × Время\n📌 S = V × t\n📌 S = ${s.v} × ${s.t} = ${s.s} км\n\n💡 Думай так: если за 1 час поезд проезжает ${s.v} км, то за ${s.t} часа — в ${s.t} раз больше.\n\n✅ Ответ: ${s.s} км`
                    : `To find distance, multiply speed by time!\n\n📌 Formula: Distance = Speed × Time\n📌 S = V × t\n📌 S = ${s.v} × ${s.t} = ${s.s} km\n\n💡 Think: if it goes ${s.v} km in 1 hour, in ${s.t} hours it goes ${s.t} times as far.\n\n✅ Answer: ${s.s} km`;
                correctBody = `S = ${s.v} × ${s.t} = ${s.s} km.`;
            } else if (s.type === 1) {
                ans = s.v;
                q = lang === 'ru'
                    ? `Машина проехала ${s.s} км за ${s.t} часа.\n\nС какой скоростью она ехала?\n\n💡 Скорость — сколько км за один час.`
                    : `A car drove ${s.s} km in ${s.t} hours.\n\nWhat was its speed?\n\n💡 Speed = how many km per one hour.`;
                wrongBody = lang === 'ru'
                    ? `Чтобы найти скорость, нужно расстояние разделить на время!\n\n📌 Формула: Скорость = Расстояние ÷ Время\n📌 V = S ÷ t\n📌 V = ${s.s} ÷ ${s.t} = ${s.v} км/ч\n\n💡 Мы делим весь путь на количество часов, чтобы узнать, сколько проезжается за один час.\n\n✅ Ответ: ${s.v} км/ч`
                    : `To find speed, divide distance by time!\n\n📌 Formula: Speed = Distance ÷ Time\n📌 V = S ÷ t\n📌 V = ${s.s} ÷ ${s.t} = ${s.v} km/h\n\n💡 We divide the total journey by hours to find how far per one hour.\n\n✅ Answer: ${s.v} km/h`;
                correctBody = `V = ${s.s} ÷ ${s.t} = ${s.v} km/h.`;
            } else {
                ans = s.t;
                q = lang === 'ru'
                    ? `Расстояние между городами ${s.s} км. Автобус едет со скоростью ${s.v} км/ч.\n\nЗа сколько часов автобус доберётся?\n\n💡 Время — сколько часов длится поездка.`
                    : `The distance between cities is ${s.s} km. A bus goes at ${s.v} km/h.\n\nHow many hours will the trip take?\n\n💡 Time = how many hours the trip lasts.`;
                wrongBody = lang === 'ru'
                    ? `Чтобы найти время, нужно расстояние разделить на скорость!\n\n📌 Формула: Время = Расстояние ÷ Скорость\n📌 t = S ÷ V\n📌 t = ${s.s} ÷ ${s.v} = ${s.t} ч\n\n💡 Мы делим весь путь на скорость (км за час), чтобы узнать сколько часов.\n\n✅ Ответ: ${s.t} ч`
                    : `To find time, divide distance by speed!\n\n📌 Formula: Time = Distance ÷ Speed\n📌 t = S ÷ V\n📌 t = ${s.s} ÷ ${s.v} = ${s.t} hours\n\n💡 We divide distance by speed (km per hour) to get hours.\n\n✅ Answer: ${s.t} hours`;
                correctBody = `t = ${s.s} ÷ ${s.v} = ${s.t} h.`;
            }
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${correctBody}`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: ans };
        }
    },
    {
        id: 'ussr-g3-perimeter',
        grade: 3,
        system: 'USSR',
        topicRu: 'Периметр прямоугольника',
        topicEn: 'Rectangle Perimeter',
        generateState: () => ({ a: randInt(3, 15), b: randInt(3, 15) }),
        render: (s, lang, p) => {
            const per = 2 * (s.a + s.b);
            const q = lang === 'ru'
                ? `Прямоугольник имеет стороны ${s.a} см и ${s.b} см.\n\nНайди его периметр — общую длину всех сторон.\n\n💡 У прямоугольника 4 стороны: 2 длинных и 2 коротких.`
                : `A rectangle has sides ${s.a} cm and ${s.b} cm.\n\nFind its perimeter — the total length of all sides.\n\n💡 A rectangle has 4 sides: 2 long and 2 short.`;
            const wrongBody = lang === 'ru'
                ? `Периметр — это длина «забора» вокруг фигуры. Нужно сложить все стороны!\n\n📌 У прямоугольника 4 стороны:\n   Верх: ${s.a} см\n   Низ: ${s.a} см\n   Слева: ${s.b} см\n   Справа: ${s.b} см\n📌 P = ${s.a} + ${s.b} + ${s.a} + ${s.b} = ${per} см\n📌 Короче: P = 2 × (${s.a} + ${s.b}) = 2 × ${s.a + s.b} = ${per} см\n\n💡 Запомни формулу: P = 2 × (длина + ширина)\n\n✅ Ответ: ${per} см`
                : `Perimeter is the total distance around a shape — like a fence!\n\n📌 A rectangle has 4 sides:\n   Top: ${s.a} cm\n   Bottom: ${s.a} cm\n   Left: ${s.b} cm\n   Right: ${s.b} cm\n📌 P = ${s.a} + ${s.b} + ${s.a} + ${s.b} = ${per} cm\n📌 Shortcut: P = 2 × (${s.a} + ${s.b}) = 2 × ${s.a + s.b} = ${per} cm\n\n💡 Formula: P = 2 × (length + width)\n\n✅ Answer: ${per} cm`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} P = 2 × (${s.a} + ${s.b}) = ${per} ${lang === 'ru' ? 'см' : 'cm'}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: per };
        }
    },

    // ==========================================
    // GRADE 3 — US
    // ==========================================
    {
        id: 'us-g3-area',
        grade: 3,
        system: 'US',
        topicRu: 'Площадь прямоугольника',
        topicEn: 'Area of Rectangle',
        generateState: () => ({ a: randInt(2, 8), b: randInt(2, 6) }),
        render: (s, lang, p) => {
            const area = s.a * s.b;
            const q = lang === 'ru'
                ? `Прямоугольник: длина ${s.a} см, ширина ${s.b} см.\n\nНайди его площадь — сколько квадратных сантиметров помещается внутри.\n\n💡 Площадь = сколько квадратиков 1×1 поместится внутри фигуры.`
                : `A rectangle is ${s.a} cm long and ${s.b} cm wide.\n\nFind its area — how many square centimeters fit inside.\n\n💡 Area = how many 1×1 squares fit inside the shape.`;
            const wrongBody = lang === 'ru'
                ? `Площадь прямоугольника = длина × ширина.\n\n📌 Длина = ${s.a} см, ширина = ${s.b} см\n📌 Площадь = ${s.a} × ${s.b} = ${area} кв.см\n\n💡 Представь: ${s.b} рядов по ${s.a} квадратиков. Всего ${area} квадратиков!\n\n⚠️ Не путай с периметром! Периметр = длина ВОКРУГ. Площадь = сколько ВНУТРИ.\n\n✅ Ответ: ${area} кв.см`
                : `Area of a rectangle = length × width.\n\n📌 Length = ${s.a} cm, Width = ${s.b} cm\n📌 Area = ${s.a} × ${s.b} = ${area} sq cm\n\n💡 Imagine: ${s.b} rows of ${s.a} squares. That's ${area} squares total!\n\n⚠️ Don't confuse with perimeter! Perimeter = distance AROUND. Area = space INSIDE.\n\n✅ Answer: ${area} sq cm`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.a} × ${s.b} = ${area} ${lang === 'ru' ? 'кв.см' : 'sq cm'}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: area, visual: { type: 'grid' as const, rows: Math.min(s.b, 6), cols: Math.min(s.a, 8) } };
        }
    },
    {
        id: 'us-g3-rounding',
        grade: 3,
        system: 'US',
        topicRu: 'Округление',
        topicEn: 'Rounding',
        generateState: () => ({ n: randInt(11, 99) }),
        render: (s, lang, p) => {
            const rounded = Math.round(s.n / 10) * 10;
            const onesDigit = s.n % 10;
            const roundUp = onesDigit >= 5;
            const q = lang === 'ru'
                ? `Округли число ${s.n} до ближайшего десятка.\n\n💡 Округление — это замена числа на ближайшее «круглое» (оканчивается на 0).`
                : `Round the number ${s.n} to the nearest ten.\n\n💡 Rounding means replacing a number with the nearest "round" number (ending in 0).`;
            const wrongBody = lang === 'ru'
                ? `Чтобы округлить до десятка, смотрим на цифру единиц!\n\n📌 Число: ${s.n}\n📌 Цифра единиц: ${onesDigit}\n📌 ${onesDigit} ${roundUp ? '≥ 5 → округляем ВВЕРХ' : '< 5 → округляем ВНИЗ'}\n📌 ${s.n} ≈ ${rounded}\n\n💡 Правило: если единицы 5, 6, 7, 8 или 9 — округляем вверх. Если 0, 1, 2, 3, 4 — вниз.\n\n✅ Ответ: ${rounded}`
                : `To round to the nearest ten, look at the ones digit!\n\n📌 Number: ${s.n}\n📌 Ones digit: ${onesDigit}\n📌 ${onesDigit} ${roundUp ? '≥ 5 → round UP' : '< 5 → round DOWN'}\n📌 ${s.n} ≈ ${rounded}\n\n💡 Rule: 5+ → round up. 0-4 → round down.\n\n✅ Answer: ${rounded}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.n} ≈ ${rounded}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: rounded };
        }
    },

    // ==========================================
    // GRADE 4 — USSR
    // ==========================================
    {
        id: 'ussr-g4-long-division',
        grade: 4,
        system: 'USSR',
        topicRu: 'Деление столбиком',
        topicEn: 'Long Division',
        generateState: () => {
            const d = randInt(6, 25);
            const q = randInt(10, 50);
            return { dividend: d * q, divisor: d, quotient: q };
        },
        render: (s, lang, p) => {
            const q = lang === 'ru'
                ? `Раздели ${s.dividend} на ${s.divisor}.\n\nНапиши результат деления (целое число).`
                : `Divide ${s.dividend} by ${s.divisor}.\n\nType the result (whole number).`;
            const wrongBody = lang === 'ru'
                ? `Деление — это «сколько раз одно число помещается в другом».\n\n📌 ${s.dividend} ÷ ${s.divisor} = ?\n📌 Спросим: «${s.divisor} × ? = ${s.dividend}»\n📌 ${s.divisor} × ${s.quotient} = ${s.dividend} ✓\n📌 Значит ${s.dividend} ÷ ${s.divisor} = ${s.quotient}\n\n💡 Проверка: ${s.quotient} × ${s.divisor} = ${s.dividend} ✓\n\n✅ Ответ: ${s.quotient}`
                : `Division asks: "how many times does one number fit into another?"\n\n📌 ${s.dividend} ÷ ${s.divisor} = ?\n📌 Ask: "${s.divisor} × ? = ${s.dividend}"\n📌 ${s.divisor} × ${s.quotient} = ${s.dividend} ✓\n📌 So ${s.dividend} ÷ ${s.divisor} = ${s.quotient}\n\n💡 Check: ${s.quotient} × ${s.divisor} = ${s.dividend} ✓\n\n✅ Answer: ${s.quotient}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.dividend} ÷ ${s.divisor} = ${s.quotient}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.quotient };
        }
    },

    // ==========================================
    // GRADE 4 — US
    // ==========================================
    {
        id: 'us-g4-fraction-addition',
        grade: 4,
        system: 'US',
        topicRu: 'Сложение дробей',
        topicEn: 'Adding Fractions',
        generateState: () => {
            const den = randInt(4, 9);
            const n1 = randInt(1, den - 2);
            return { num1: n1, num2: randInt(1, den - n1 - 1), den };
        },
        render: (s, lang, p) => {
            const sumN = s.num1 + s.num2;
            const q = lang === 'ru'
                ? `Сложи две дроби:\n\n${s.num1}/${s.den} + ${s.num2}/${s.den} = ?\n\nНапиши ответ в виде дроби (числитель / знаменатель).\n\n💡 Дробь — это часть целого. Например, 1/4 — одна четвёртая часть пирога.`
                : `Add the two fractions:\n\n${s.num1}/${s.den} + ${s.num2}/${s.den} = ?\n\nType the answer as a fraction (numerator / denominator).\n\n💡 A fraction is a part of a whole. For example, 1/4 = one quarter of a pie.`;
            const wrongBody = lang === 'ru'
                ? `Когда у дробей одинаковый знаменатель (число внизу), складываем только числители (числа сверху)!\n\n📌 ${s.num1}/${s.den} + ${s.num2}/${s.den}\n📌 Знаменатели одинаковые: ${s.den} — их НЕ складываем!\n📌 Складываем числители: ${s.num1} + ${s.num2} = ${sumN}\n📌 Ответ: ${sumN}/${s.den}\n\n💡 Представь пирог, разрезанный на ${s.den} кусочков. У тебя ${s.num1} кусочков и ещё ${s.num2}. Всего ${sumN} кусочков из ${s.den}.\n\n✅ Ответ: ${sumN}/${s.den}`
                : `When fractions have the same denominator (bottom number), just add the numerators (top numbers)!\n\n📌 ${s.num1}/${s.den} + ${s.num2}/${s.den}\n📌 Denominators are the same: ${s.den} — DON'T add them!\n📌 Add numerators: ${s.num1} + ${s.num2} = ${sumN}\n📌 Answer: ${sumN}/${s.den}\n\n💡 Imagine a pie cut into ${s.den} slices. You have ${s.num1} slices plus ${s.num2} more. That's ${sumN} slices out of ${s.den}.\n\n✅ Answer: ${sumN}/${s.den}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.num1}/${s.den} + ${s.num2}/${s.den} = ${sumN}/${s.den}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'fraction' as InputType, correctAnswer: { numerator: sumN, denominator: s.den } };
        }
    },
    {
        id: 'us-g4-mixed-numbers',
        grade: 4,
        system: 'US',
        topicRu: 'Смешанные числа',
        topicEn: 'Mixed Numbers',
        generateState: () => {
            const w = randInt(1, 5);
            const n = randInt(1, 3);
            return { whole: w, num: n, den: randInt(n + 1, 6) };
        },
        render: (s, lang, p) => {
            const improperNum = s.whole * s.den + s.num;
            const q = lang === 'ru'
                ? `Смешанное число — это целая часть и дробная часть вместе.\n\nНапример: 2 ¾ — это 2 целых и ¾.\n\nПреврати смешанное число ${s.whole} ${s.num}/${s.den} в «неправильную дробь» (где верхнее число больше нижнего).\n\nНапиши только ЧИСЛИТЕЛЬ (верхнее число новой дроби).`
                : `A mixed number has a whole part and a fraction part together.\n\nExample: 2 ¾ means 2 wholes and ¾.\n\nConvert the mixed number ${s.whole} ${s.num}/${s.den} into an "improper fraction" (where the top number is bigger than the bottom).\n\nType only the NUMERATOR (the top number of the new fraction).`;
            const wrongBody = lang === 'ru'
                ? `Смешанное число = целая часть + дробная часть. Чтобы сделать неправильную дробь:\n\n📌 Шаг 1: Умножь целую часть на знаменатель:\n   ${s.whole} × ${s.den} = ${s.whole * s.den}\n   (Это значит: «${s.whole} целых — это ${s.whole * s.den} кусочков размера 1/${s.den}»)\n📌 Шаг 2: Прибавь числитель:\n   ${s.whole * s.den} + ${s.num} = ${improperNum}\n📌 Шаг 3: Знаменатель остаётся тот же: ${s.den}\n📌 Результат: ${improperNum}/${s.den}\n\n💡 Почему это работает? ${s.whole} целых пирогов, каждый разрезан на ${s.den} кусков — это ${s.whole * s.den} кусков. Плюс ещё ${s.num} кусков = ${improperNum} кусков.\n\n✅ Числитель: ${improperNum}`
                : `A mixed number = whole part + fraction part. To make an improper fraction:\n\n📌 Step 1: Multiply whole by denominator:\n   ${s.whole} × ${s.den} = ${s.whole * s.den}\n   (This means: "${s.whole} wholes = ${s.whole * s.den} pieces of size 1/${s.den}")\n📌 Step 2: Add the numerator:\n   ${s.whole * s.den} + ${s.num} = ${improperNum}\n📌 Step 3: Keep the same denominator: ${s.den}\n📌 Result: ${improperNum}/${s.den}\n\n💡 Why? ${s.whole} whole pies, each cut into ${s.den} slices = ${s.whole * s.den} slices. Plus ${s.num} more = ${improperNum} slices.\n\n✅ Numerator: ${improperNum}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.whole} ${s.num}/${s.den} = ${improperNum}/${s.den}. ${lang === 'ru' ? 'Числитель' : 'Numerator'} = ${improperNum}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: improperNum };
        }
    },

    // ==========================================
    // GRADE 5 — USSR
    // ==========================================
    {
        id: 'ussr-g5-percentages',
        grade: 5,
        system: 'USSR',
        topicRu: 'Проценты',
        topicEn: 'Percentages',
        generateState: () => ({ whole: pick([50, 100, 200, 300, 500]), pct: pick([10, 20, 25, 50, 75]) }),
        render: (s, lang, p) => {
            const ans = s.whole * s.pct / 100;
            const q = lang === 'ru'
                ? `Найди ${s.pct}% от числа ${s.whole}.\n\n💡 Процент (%) — это одна сотая часть числа.\n1% от 100 = 1. 50% = половина.`
                : `Find ${s.pct}% of ${s.whole}.\n\n💡 Percent (%) means "per hundred" — one hundredth.\n1% of 100 = 1. 50% = half.`;
            const wrongBody = lang === 'ru'
                ? `Процент — это доля от 100.\n\n📌 ${s.pct}% — это ${s.pct} частей из 100\n📌 ${s.pct}% = ${s.pct}/100 = ${s.pct / 100}\n📌 ${s.pct}% от ${s.whole} = ${s.whole} × ${s.pct}/100\n📌 = ${s.whole} × ${s.pct / 100} = ${ans}\n\n💡 Лайфхаки:\n• 10% — раздели на 10\n• 25% — раздели на 4\n• 50% — раздели на 2\n\n✅ Ответ: ${ans}`
                : `Percent means "out of 100".\n\n📌 ${s.pct}% = ${s.pct} out of 100 = ${s.pct}/100 = ${s.pct / 100}\n📌 ${s.pct}% of ${s.whole} = ${s.whole} × ${s.pct}/100\n📌 = ${s.whole} × ${s.pct / 100} = ${ans}\n\n💡 Shortcuts:\n• 10% → divide by 10\n• 25% → divide by 4\n• 50% → divide by 2\n\n✅ Answer: ${ans}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.pct}% ${lang === 'ru' ? 'от' : 'of'} ${s.whole} = ${ans}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: ans };
        }
    },

    // ==========================================
    // GRADE 5 — US
    // ==========================================
    {
        id: 'us-g5-exponents',
        grade: 5,
        system: 'US',
        topicRu: 'Степени',
        topicEn: 'Exponents',
        generateState: () => ({ base: randInt(2, 6), exp: randInt(2, 3) }),
        render: (s, lang, p) => {
            const ans = Math.pow(s.base, s.exp);
            const sup = s.exp === 2 ? '²' : '³';
            const mult = Array(s.exp).fill(s.base).join(' × ');
            const q = lang === 'ru'
                ? `Вычисли: ${s.base}${sup}\n\n💡 Маленькая цифра сверху (степень) показывает, сколько раз число умножается само на себя.\n${s.base}${sup} означает «${s.base} умножить на себя ${s.exp} раза».`
                : `Calculate: ${s.base}${sup}\n\n💡 The small number above (exponent) tells how many times to multiply the number by itself.\n${s.base}${sup} means "${s.base} multiplied by itself ${s.exp} times".`;
            const wrongBody = lang === 'ru'
                ? `Степень — это многократное умножение числа на само себя.\n\n📌 ${s.base}${sup} = ${mult}\n📌 ${s.exp === 2 ? `${s.base} × ${s.base} = ${ans}` : `${s.base} × ${s.base} = ${s.base * s.base}, потом ${s.base * s.base} × ${s.base} = ${ans}`}\n\n⚠️ Важно: ${s.base}${sup} это НЕ ${s.base} × ${s.exp} = ${s.base * s.exp}!\nЭто ${mult} = ${ans}.\n\n✅ Ответ: ${ans}`
                : `An exponent means multiplying a number by itself multiple times.\n\n📌 ${s.base}${sup} = ${mult}\n📌 ${s.exp === 2 ? `${s.base} × ${s.base} = ${ans}` : `${s.base} × ${s.base} = ${s.base * s.base}, then ${s.base * s.base} × ${s.base} = ${ans}`}\n\n⚠️ Important: ${s.base}${sup} is NOT ${s.base} × ${s.exp} = ${s.base * s.exp}!\nIt's ${mult} = ${ans}.\n\n✅ Answer: ${ans}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.base}${sup} = ${mult} = ${ans}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: ans };
        }
    },

    // ==========================================
    // GRADE 6 — USSR
    // ==========================================
    {
        id: 'ussr-g6-negative',
        grade: 6,
        system: 'USSR',
        topicRu: 'Отрицательные числа',
        topicEn: 'Negative Numbers',
        generateState: () => ({ a: randInt(-15, 15), b: randInt(-15, 15), op: pick(['+', '-'] as const) }),
        render: (s, lang, p) => {
            const res = s.op === '+' ? s.a + s.b : s.a - s.b;
            const expr = `(${s.a}) ${s.op} (${s.b})`;
            const q = lang === 'ru'
                ? `Вычисли: ${expr} = ?\n\n💡 Отрицательные числа — числа меньше нуля. На числовой прямой они слева от 0.`
                : `Calculate: ${expr} = ?\n\n💡 Negative numbers are less than zero. On a number line, they are to the left of 0.`;
            let wrongBody: string;
            if (s.op === '+') {
                wrongBody = lang === 'ru'
                    ? `Сложение с отрицательными числами:\n\n📌 Если оба числа положительные → обычное сложение\n📌 Если оба отрицательные → складываем модули, ставим минус\n📌 Если знаки разные → вычитаем меньший модуль из большего, ставим знак большего\n\n📌 (${s.a}) + (${s.b}) = ${res}\n\n💡 Представь термометр: если было ${s.a}° и изменилось на ${s.b}°, будет ${res}°.\n\n✅ Ответ: ${res}`
                    : `Adding with negative numbers:\n\n📌 Both positive → normal addition\n📌 Both negative → add absolute values, make negative\n📌 Different signs → subtract smaller from larger, keep the sign of the larger\n\n📌 (${s.a}) + (${s.b}) = ${res}\n\n💡 Think of a thermometer: ${s.a}° changes by ${s.b}° → ${res}°.\n\n✅ Answer: ${res}`;
            } else {
                wrongBody = lang === 'ru'
                    ? `Вычитание = сложение с противоположным числом!\n\n📌 (${s.a}) − (${s.b}) = (${s.a}) + (${-s.b}) = ${res}\n📌 Меняем знак второго числа и складываем.\n\n💡 Вычесть (${s.b}) — всё равно что прибавить (${-s.b}).\n\n✅ Ответ: ${res}`
                    : `Subtracting = adding the opposite!\n\n📌 (${s.a}) − (${s.b}) = (${s.a}) + (${-s.b}) = ${res}\n📌 Change the sign of the second number and add.\n\n💡 Subtracting (${s.b}) is the same as adding (${-s.b}).\n\n✅ Answer: ${res}`;
            }
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${expr} = ${res}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: res };
        }
    },

    // ==========================================
    // GRADE 6 — US
    // ==========================================
    {
        id: 'us-g6-ratios',
        grade: 6,
        system: 'US',
        topicRu: 'Отношения (пропорции)',
        topicEn: 'Ratios',
        generateState: () => ({ a: randInt(2, 8), b: randInt(2, 8), mult: randInt(2, 5) }),
        render: (s, lang, p) => {
            const q = lang === 'ru'
                ? `Отношение красных шаров к синим = ${s.a}:${s.b}.\n\nЕсли красных шаров ${s.a * s.mult}, сколько синих?\n\n💡 Отношение — это сравнение двух количеств. ${s.a}:${s.b} значит «на каждые ${s.a} красных приходится ${s.b} синих».`
                : `The ratio of red balls to blue balls is ${s.a}:${s.b}.\n\nIf there are ${s.a * s.mult} red balls, how many blue?\n\n💡 A ratio compares two quantities. ${s.a}:${s.b} means "for every ${s.a} red, there are ${s.b} blue".`;
            const wrongBody = lang === 'ru'
                ? `Отношение ${s.a}:${s.b} значит, что на каждые ${s.a} красных → ${s.b} синих.\n\n📌 Красных = ${s.a * s.mult}\n📌 Во сколько раз больше? ${s.a * s.mult} ÷ ${s.a} = ${s.mult}\n📌 Значит всё увеличено в ${s.mult} раз\n📌 Синих = ${s.b} × ${s.mult} = ${s.b * s.mult}\n\n💡 Найди «множитель» — во сколько раз увеличили — и примени его ко второму числу.\n\n✅ Ответ: ${s.b * s.mult}`
                : `Ratio ${s.a}:${s.b} means for every ${s.a} red → ${s.b} blue.\n\n📌 Red = ${s.a * s.mult}\n📌 How many times bigger? ${s.a * s.mult} ÷ ${s.a} = ${s.mult}\n📌 Everything is multiplied by ${s.mult}\n📌 Blue = ${s.b} × ${s.mult} = ${s.b * s.mult}\n\n💡 Find the "scale factor" and apply it to the other number.\n\n✅ Answer: ${s.b * s.mult}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} ${s.b} × ${s.mult} = ${s.b * s.mult} ${lang === 'ru' ? 'синих шаров' : 'blue balls'}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.b * s.mult };
        }
    },

    // ==========================================
    // GRADE 7 — USSR
    // ==========================================
    {
        id: 'ussr-g7-linear-eq',
        grade: 7,
        system: 'USSR',
        topicRu: 'Линейные уравнения',
        topicEn: 'Linear Equations',
        generateState: () => {
            const x = randInt(-10, 10);
            const a = randInt(2, 7);
            const b = randInt(-20, 20);
            return { a, b, c: a * x + b, x };
        },
        render: (s, lang, p) => {
            const bStr = s.b >= 0 ? `+ ${s.b}` : `− ${Math.abs(s.b)}`;
            const q = lang === 'ru'
                ? `Реши уравнение:\n\n${s.a}x ${bStr} = ${s.c}\n\nНайди x — число, которое делает равенство верным.`
                : `Solve the equation:\n\n${s.a}x ${bStr} = ${s.c}\n\nFind x — the number that makes this equation true.`;
            const step1 = s.c - s.b;
            const wrongBody = lang === 'ru'
                ? `Решаем уравнение — «раскрываем» x шаг за шагом:\n\n📌 ${s.a}x ${bStr} = ${s.c}\n📌 Шаг 1: Перенесём ${s.b >= 0 ? s.b : `(${s.b})`} на другую сторону (меняя знак):\n   ${s.a}x = ${s.c} ${s.b >= 0 ? '−' : '+'} ${Math.abs(s.b)} = ${step1}\n📌 Шаг 2: Разделим обе стороны на ${s.a}:\n   x = ${step1} ÷ ${s.a} = ${s.x}\n\n💡 Проверка: ${s.a} × ${s.x} ${bStr} = ${s.a * s.x} ${bStr} = ${s.c} ✓\n\n✅ Ответ: x = ${s.x}`
                : `Solve the equation step by step — "unwrap" x:\n\n📌 ${s.a}x ${bStr} = ${s.c}\n📌 Step 1: Move ${s.b >= 0 ? s.b : `(${s.b})`} to the other side (flip the sign):\n   ${s.a}x = ${s.c} ${s.b >= 0 ? '−' : '+'} ${Math.abs(s.b)} = ${step1}\n📌 Step 2: Divide both sides by ${s.a}:\n   x = ${step1} ÷ ${s.a} = ${s.x}\n\n💡 Check: ${s.a} × ${s.x} ${bStr} = ${s.a * s.x} ${bStr} = ${s.c} ✓\n\n✅ Answer: x = ${s.x}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} x = ${s.x}. (${s.a}×${s.x} ${bStr} = ${s.c} ✓)`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.x };
        }
    },

    // ==========================================
    // GRADE 8 — USSR
    // ==========================================
    {
        id: 'ussr-g8-pythagoras',
        grade: 8,
        system: 'USSR',
        topicRu: 'Теорема Пифагора',
        topicEn: 'Pythagorean Theorem',
        generateState: () => {
            const t = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]);
            return { a: t[0], b: t[1], c: t[2], findHyp: Math.random() > 0.4 };
        },
        render: (s, lang, p) => {
            if (s.findHyp) {
                const q = lang === 'ru'
                    ? `В прямоугольном треугольнике два коротких стороны (катеты): ${s.a} и ${s.b}.\n\nНайди длину самой длинной стороны (гипотенузы).\n\n💡 Прямоугольный треугольник — треугольник с углом 90°. Гипотенуза — сторона напротив прямого угла.`
                    : `A right triangle has two shorter sides (legs): ${s.a} and ${s.b}.\n\nFind the length of the longest side (hypotenuse).\n\n💡 A right triangle has a 90° angle. The hypotenuse is the side opposite it.`;
                const wrongBody = lang === 'ru'
                    ? `Теорема Пифагора: в прямоугольном треугольнике a² + b² = c² (c — гипотенуза).\n\n📌 a = ${s.a}, b = ${s.b}\n📌 a² = ${s.a}² = ${s.a * s.a}\n📌 b² = ${s.b}² = ${s.b * s.b}\n📌 c² = ${s.a * s.a} + ${s.b * s.b} = ${s.c * s.c}\n📌 c = √${s.c * s.c} = ${s.c}\n\n💡 Запомни: квадрат гипотенузы = сумма квадратов катетов.\n\n✅ Ответ: ${s.c}`
                    : `Pythagorean Theorem: a² + b² = c² (c = hypotenuse).\n\n📌 a = ${s.a}, b = ${s.b}\n📌 a² = ${s.a * s.a}\n📌 b² = ${s.b * s.b}\n📌 c² = ${s.a * s.a} + ${s.b * s.b} = ${s.c * s.c}\n📌 c = √${s.c * s.c} = ${s.c}\n\n💡 Remember: hypotenuse² = leg² + leg².\n\n✅ Answer: ${s.c}`;
                return { question: q, explanationCorrect: `${getPraise(p, lang)} c = √(${s.a}² + ${s.b}²) = ${s.c}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.c };
            } else {
                const q = lang === 'ru'
                    ? `Гипотенуза прямоугольного треугольника = ${s.c}, один катет = ${s.a}.\n\nНайди другой катет.`
                    : `The hypotenuse of a right triangle is ${s.c}, one leg is ${s.a}.\n\nFind the other leg.`;
                const wrongBody = lang === 'ru'
                    ? `Используем теорему Пифагора: a² + b² = c²\n\n📌 c = ${s.c}, a = ${s.a}, b = ?\n📌 b² = c² − a² = ${s.c * s.c} − ${s.a * s.a} = ${s.b * s.b}\n📌 b = √${s.b * s.b} = ${s.b}\n\n✅ Ответ: ${s.b}`
                    : `Use Pythagorean Theorem: a² + b² = c²\n\n📌 c = ${s.c}, a = ${s.a}, b = ?\n📌 b² = c² − a² = ${s.c * s.c} − ${s.a * s.a} = ${s.b * s.b}\n📌 b = √${s.b * s.b} = ${s.b}\n\n✅ Answer: ${s.b}`;
                return { question: q, explanationCorrect: `${getPraise(p, lang)} b = √(${s.c}² − ${s.a}²) = ${s.b}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.b };
            }
        }
    },
    {
        id: 'ussr-g8-sqrt',
        grade: 8,
        system: 'USSR',
        topicRu: 'Квадратные корни',
        topicEn: 'Square Roots',
        generateState: () => ({ n: pick([4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]) }),
        render: (s, lang, p) => {
            const ans = Math.sqrt(s.n);
            const q = lang === 'ru'
                ? `Чему равен √${s.n}?\n\n💡 Квадратный корень — это число, которое при умножении на себя даёт то, что под корнем.\n√${s.n} = ? означает «? × ? = ${s.n}»`
                : `What is √${s.n}?\n\n💡 A square root is a number that when multiplied by itself gives the number under the root.\n√${s.n} = ? means "? × ? = ${s.n}"`;
            const wrongBody = lang === 'ru'
                ? `Квадратный корень — обратное действие к возведению в квадрат.\n\n📌 Нужно найти число, которое при умножении на себя даёт ${s.n}\n📌 ${ans} × ${ans} = ${s.n} ✓\n📌 Значит √${s.n} = ${ans}\n\n💡 Полезно запомнить квадраты: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144...\n\n✅ Ответ: ${ans}`
                : `Square root is the opposite of squaring.\n\n📌 Find the number that × itself = ${s.n}\n📌 ${ans} × ${ans} = ${s.n} ✓\n📌 So √${s.n} = ${ans}\n\n💡 Useful to memorize perfect squares: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144...\n\n✅ Answer: ${ans}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} √${s.n} = ${ans} (${lang === 'ru' ? 'потому что' : 'because'} ${ans} × ${ans} = ${s.n}).`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: ans };
        }
    },

    // ==========================================
    // GRADE 8 — US
    // ==========================================
    {
        id: 'us-g8-linear-fn',
        grade: 8,
        system: 'US',
        topicRu: 'Линейная функция',
        topicEn: 'Linear Functions',
        generateState: () => ({ m: randInt(-5, 5), b: randInt(-10, 10), x: randInt(-5, 5) }),
        render: (s, lang, p) => {
            const y = s.m * s.x + s.b;
            const bStr = s.b >= 0 ? `+ ${s.b}` : `− ${Math.abs(s.b)}`;
            const q = lang === 'ru'
                ? `Функция: y = ${s.m}x ${bStr}\n\nНайди значение y при x = ${s.x}.\n\n💡 Подставь ${s.x} вместо x в формулу и вычисли.`
                : `Function: y = ${s.m}x ${bStr}\n\nFind y when x = ${s.x}.\n\n💡 Plug ${s.x} in for x and calculate.`;
            const step1 = s.m * s.x;
            const wrongBody = lang === 'ru'
                ? `Подставляем значение x в формулу:\n\n📌 y = ${s.m}x ${bStr}\n📌 Подставим x = ${s.x}:\n📌 y = ${s.m} × (${s.x}) ${bStr}\n📌 y = ${step1} ${bStr}\n📌 y = ${y}\n\n💡 Функция — это «машинка»: подаёшь x, получаешь y.\n\n✅ Ответ: y = ${y}`
                : `Substitute x into the formula:\n\n📌 y = ${s.m}x ${bStr}\n📌 Plug in x = ${s.x}:\n📌 y = ${s.m} × (${s.x}) ${bStr}\n📌 y = ${step1} ${bStr}\n📌 y = ${y}\n\n💡 A function is like a machine: you put in x, you get out y.\n\n✅ Answer: y = ${y}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} y = ${s.m}(${s.x}) ${bStr} = ${y}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: y };
        }
    },
    {
        id: 'us-g8-systems',
        grade: 8,
        system: 'US',
        topicRu: 'Системы уравнений',
        topicEn: 'Systems of Equations',
        generateState: () => {
            const x = randInt(1, 8);
            const y = randInt(1, 8);
            return { x, y, sum: x + y, diff: x - y };
        },
        render: (s, lang, p) => {
            const q = lang === 'ru'
                ? `Система уравнений:\n\nx + y = ${s.sum}\nx − y = ${s.diff}\n\nНайди x.\n\n💡 Система — это две «загадки» с двумя неизвестными. Решаем их вместе!`
                : `System of equations:\n\nx + y = ${s.sum}\nx − y = ${s.diff}\n\nFind x.\n\n💡 A system is two puzzles with two unknowns. Solve them together!`;
            const wrongBody = lang === 'ru'
                ? `Метод сложения — складываем оба уравнения!\n\n📌 x + y = ${s.sum}\n📌 x − y = ${s.diff}\n📌 Складываем (y и −y сокращаются!):\n📌 2x = ${s.sum} + (${s.diff}) = ${s.sum + s.diff}\n📌 x = ${s.sum + s.diff} ÷ 2 = ${s.x}\n\n💡 Проверка: x = ${s.x}, y = ${s.sum} − ${s.x} = ${s.y}\n📌 ${s.x} + ${s.y} = ${s.sum} ✓\n📌 ${s.x} − ${s.y} = ${s.diff} ✓\n\n✅ Ответ: x = ${s.x}`
                : `Method: Add both equations!\n\n📌 x + y = ${s.sum}\n📌 x − y = ${s.diff}\n📌 Add them (y and −y cancel out!):\n📌 2x = ${s.sum} + (${s.diff}) = ${s.sum + s.diff}\n📌 x = ${s.sum + s.diff} ÷ 2 = ${s.x}\n\n💡 Check: x = ${s.x}, y = ${s.sum} − ${s.x} = ${s.y}\n📌 ${s.x} + ${s.y} = ${s.sum} ✓\n📌 ${s.x} − ${s.y} = ${s.diff} ✓\n\n✅ Answer: x = ${s.x}`;
            return { question: q, explanationCorrect: `${getPraise(p, lang)} x = ${s.x}, y = ${s.y}.`, explanationWrong: `${getEncouragement(p, lang)}\n\n${wrongBody}`, answerType: 'number' as InputType, correctAnswer: s.x };
        }
    },
];

// ========================================
// MATH ENGINE
// ========================================
export const generateTask = (grades: number[], chosenSystem: 'US' | 'USSR' | 'both', lang: 'ru' | 'en', profile: StudentProfile, forceModuleId?: string): GeneratedTaskInstance => {
    let sel = forceModuleId ? registry.find(m => m.id === forceModuleId) : null;
    if (!sel) {
        const avail = registry.filter(m => grades.includes(m.grade) && (chosenSystem === 'both' || m.system === chosenSystem));
        if (!avail.length) return { id: 'fallback', grade: 1, system: 'US', topic: 'Basic', question: '1+1=?', explanationCorrect: '2!', explanationWrong: '1+1=2.', answerType: 'number', correctAnswer: 2, visual: { type: 'none' } };
        sel = pick(avail);
    }
    const r = sel.render(sel.generateState(), lang, profile);
    return { id: sel.id, grade: sel.grade, system: sel.system, topic: lang === 'ru' ? sel.topicRu : sel.topicEn, question: r.question, explanationCorrect: r.explanationCorrect, explanationWrong: r.explanationWrong, answerType: r.answerType, correctAnswer: r.correctAnswer, visual: r.visual || { type: 'none' } };
};

// ========================================
// CONFIG & DICTIONARY
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
        appTitle: 'MATH', appSubtitle: 'US & USSR', practice: '✏️ Practice', menu: '⚙️ Menu', history: '📊 Progress', settings: 'Settings', studentName: 'Student Name', lang: 'Language', theme: 'App Theme', colorTheme: 'Color Scheme', gender: 'Profile Gender', boy: 'Boy', girl: 'Girl', neutral: 'Neutral', emojiLabel: 'Avatar Emoji', noEmoji: 'No Emoji', curriculum: 'Curriculum', usCurriculum: '🇺🇸 US', ussrCurriculum: '☭ USSR', bothCurriculum: '🌍 Both', gradesScope: 'Grades', export: '📤 Export', import: '📥 Import', reset: '🗑️ Reset', resetConfirm: 'Reset all settings?', correct: 'Correct', total: 'Total', streak: 'Streak', best: 'Best', check: 'Check ✓', correctFeedback: '🎉 Correct!', wrongFeedback: '💡 Not quite!', nextTask: 'Next →', retryTask: '🔄 Retry', workspaceNeutral: 'Workspace', gradeLabel: 'Grade', themeLight: '☀️ Light', themeDark: '🌙 Dark', themeSystem: '💻 System', soundOn: '🔊 Sound', soundOff: '🔇 Muted', timedMode: '⏱️ Timer', timerLabel: 'Seconds per task', timeUp: '⏰ Time\'s up!', progressTitle: 'Progress', topicAccuracy: 'Topic Accuracy', noHistory: 'No tasks yet. Start practicing!', backToPractice: '← Back', emptyField: 'Please enter an answer!', streakCelebration5: '🔥 5 in a row!', streakCelebration10: '⚡ 10! Amazing!', streakCelebration25: '🏆 25! Legend!', showTaskInfo: 'Show task info', showTaskInfoDesc: 'Grade & topic above question', allowSelection: 'Allow text selection', allowSelectionDesc: 'Enable for translator extensions',
    },
    ru: {
        appTitle: 'МАТЕМАТИКА', appSubtitle: 'СССР и США', practice: '✏️ Задачи', menu: '⚙️ Меню', history: '📊 Прогресс', settings: 'Настройки', studentName: 'Имя ученика', lang: 'Язык', theme: 'Тема', colorTheme: 'Цвет', gender: 'Пол', boy: 'Мальчик', girl: 'Девочка', neutral: 'Нейтральный', emojiLabel: 'Эмодзи', noEmoji: 'Без эмодзи', curriculum: 'Программа', usCurriculum: '🇺🇸 США', ussrCurriculum: '☭ СССР', bothCurriculum: '🌍 Обе', gradesScope: 'Классы', export: '📤 Экспорт', import: '📥 Импорт', reset: '🗑️ Сброс', resetConfirm: 'Сбросить настройки?', correct: 'Верно', total: 'Всего', streak: 'Серия', best: 'Рекорд', check: 'Проверить ✓', correctFeedback: '🎉 Правильно!', wrongFeedback: '💡 Не совсем!', nextTask: 'Далее →', retryTask: '🔄 Ещё раз', workspaceNeutral: 'Рабочее пространство', gradeLabel: 'Класс', themeLight: '☀️ Светлая', themeDark: '🌙 Тёмная', themeSystem: '💻 Системная', soundOn: '🔊 Звук', soundOff: '🔇 Тихо', timedMode: '⏱️ Таймер', timerLabel: 'Секунд на задание', timeUp: '⏰ Время вышло!', progressTitle: 'Прогресс', topicAccuracy: 'Точность по темам', noHistory: 'Задач пока нет. Начни!', backToPractice: '← Назад', emptyField: 'Введи ответ!', streakCelebration5: '🔥 5 подряд!', streakCelebration10: '⚡ 10! Круто!', streakCelebration25: '🏆 25! Легенда!', showTaskInfo: 'Инфо о задании', showTaskInfoDesc: 'Класс и тема над вопросом', allowSelection: 'Выделение текста', allowSelectionDesc: 'Для переводчика / копирования',
    }
};

const AVAILABLE_EMOJIS = ['👧','👧🏻','👧🏼','👧🏽','👧🏾','👧🏿','👦','👦🏻','👦🏼','👦🏽','👦🏾','👦🏿','🧒','🧒🏻','🧒🏼','🧒🏽','🧒🏾','🧒🏿','🐱','🐶','🦊','🦁','🐼','🦄','🦉','🐸','🐰','🐝','🚀','⭐','🌈','🎯','🧠','💎','🎨','🌟'];
const MAX_GRADE = 8;

// ========================================
// UI COMPONENTS
// ========================================
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    const pieces = Array.from({ length: 24 }, (_, i) => {
        const c = pick(['#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']);
        return { id: i, left: `${randInt(5, 95)}%`, delay: `${Math.random() * 0.5}s`, color: c, size: randInt(6, 12), rot: randInt(0, 360) };
    });
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map(pc => (
                <div key={pc.id} className="absolute animate-confetti-fall" style={{ left: pc.left, top: '-20px', animationDelay: pc.delay, width: pc.size, height: pc.size, backgroundColor: pc.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px', transform: `rotate(${pc.rot}deg)` }} />
            ))}
        </div>
    );
};

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

const TaskVisualizer: React.FC<{ data: VisualData }> = ({ data }) => {
    if (!data || data.type === 'none') return null;

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

    if (data.type === 'bar' && data.totalParts) {
        const total = Math.min(data.totalParts, 20);
        const shaded = Math.min(data.shadedParts || 0, total);
        return (
            <div className="flex gap-1 justify-center my-4 flex-wrap">
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className={`w-6 h-8 md:w-8 md:h-10 rounded-lg border-2 ${i < shaded ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-600'}`} />
                ))}
            </div>
        );
    }

    if (data.type === 'numberline' && data.min !== undefined && data.max !== undefined) {
        const { min, max, marked = [] } = data;
        const w = 500;
        const pad = 30;
        return (
            <svg width="100%" viewBox={`0 0 ${w} 50`} className="mx-auto w-full max-w-xl my-4">
                <line x1={pad} y1={25} x2={w - pad} y2={25} stroke="#64748b" strokeWidth="2" />
                {Array.from({ length: max - min + 1 }).map((_, i) => {
                    const num = min + i;
                    const x = pad + (i / (max - min)) * (w - 2 * pad);
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

const ProgressView: React.FC<{ history: HistoryEntry[]; lang: 'ru' | 'en'; onBack: () => void }> = ({ history, lang, onBack }) => {
    const t = DICTIONARY[lang];
    if (!history.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700 animate-slide-up text-center">
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-4">{t.progressTitle}</h2>
                <p className="text-slate-500 text-lg mb-6">{t.noHistory}</p>
                <button onClick={onBack} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold">{t.backToPractice}</button>
            </div>
        );
    }
    const topicMap = new Map<string, { correct: number; total: number; grade: number; system: SchoolSystem }>();
    history.forEach(h => { const k = `${h.system}-g${h.grade}-${h.topic}`; const e = topicMap.get(k) || { correct: 0, total: 0, grade: h.grade, system: h.system }; e.total++; if (h.correct) e.correct++; topicMap.set(k, e); });
    const topics = Array.from(topicMap.entries()).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
    const tc = history.filter(h => h.correct).length;
    const tp = Math.round((tc / history.length) * 100);
    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700 animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{t.progressTitle}</h2>
                <button onClick={onBack} className="text-sm font-bold text-slate-400">{t.backToPractice}</button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl"><div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{tp}%</div><div className="text-xs font-bold text-slate-400 uppercase">{t.correct}</div></div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl"><div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{tc}</div><div className="text-xs font-bold text-slate-400 uppercase">{t.correct}</div></div>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl"><div className="text-2xl font-black text-slate-600 dark:text-slate-300">{history.length}</div><div className="text-xs font-bold text-slate-400 uppercase">{t.total}</div></div>
            </div>
            <div>
                <h3 className="text-sm font-black uppercase text-slate-400 mb-3">{t.topicAccuracy}</h3>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {topics.map(([k, d]) => {
                        const pc = Math.round((d.correct / d.total) * 100);
                        return (
                            <div key={k} className="animate-fade-in">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[60%]"><span className="text-xs text-slate-400 mr-1">{d.system} G{d.grade}</span>{k.split('-').slice(2).join('-')}</span>
                                    <span className={`text-sm font-black ${pc >= 80 ? 'text-emerald-500' : pc >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{pc}% ({d.correct}/{d.total})</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${pc >= 80 ? 'bg-emerald-500' : pc >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pc}%` }} /></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SettingsMenu: React.FC<{ config: AppConfig; onConfigChange: (c: AppConfig) => void }> = ({ config, onConfigChange }) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const t = DICTIONARY[config.lang];
    const ct = COLOR_THEMES[config.colorTheme];
    const update = (k: keyof AppConfig, v: any) => onConfigChange({ ...config, [k]: v });
    const handleGrade = (g: number) => { let l = [...config.gradeMode.grades]; l = l.includes(g) ? l.filter(x => x !== g) : [...l, g].sort(); if (!l.length) l = [1]; update('gradeMode', { type: l.length > 1 ? 'range' : 'single', grades: l }); };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full space-y-5 border border-slate-100 dark:border-slate-700 animate-slide-up">
            <h2 className={`text-2xl md:text-3xl font-black ${ct.text} ${ct.textDark}`}>{t.settings}</h2>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.studentName}</label><input type="text" value={config.studentName} onChange={e => update('studentName', e.target.value)} className={`w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-lg focus:outline-none focus:ring-4 ${ct.ring} transition-all`} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.lang}</label><select value={config.lang} onChange={e => update('lang', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none transition-all"><option value="en">🇺🇸 English</option><option value="ru">🇷🇺 Русский</option></select></div>
                <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.theme}</label><select value={config.theme} onChange={e => update('theme', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none transition-all"><option value="light">{t.themeLight}</option><option value="dark">{t.themeDark}</option><option value="system">{t.themeSystem}</option></select></div>
            </div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.colorTheme}</label><div className="grid grid-cols-6 gap-2">{(Object.keys(COLOR_THEMES) as ColorTheme[]).map(c => <button key={c} onClick={() => update('colorTheme', c)} className={`h-10 rounded-xl border-3 transition-all hover:scale-110 bg-gradient-to-br ${COLOR_THEMES[c].gradient} ${config.colorTheme === c ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent'}`} />)}</div></div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.gender}</label><div className="grid grid-cols-3 gap-2">{(['boy', 'girl', 'none'] as Gender[]).map(g => <button key={g} onClick={() => update('avatarTheme', g)} className={`p-2.5 rounded-2xl font-bold border text-sm transition-all ${config.avatarTheme === g ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>{g === 'boy' ? t.boy : g === 'girl' ? t.girl : t.neutral}</button>)}</div></div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.emojiLabel}</label><div className="flex flex-wrap gap-1.5 p-2.5 border rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-24 overflow-y-auto"><button onClick={() => update('emoji', '')} className={`px-2 py-1 text-xs rounded-lg border font-bold transition-all ${config.emoji === '' ? `${ct.primary} text-white ${ct.border}` : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>{t.noEmoji}</button>{AVAILABLE_EMOJIS.map(em => <button key={em} onClick={() => update('emoji', em)} className={`p-1 text-xl rounded-lg border transition-all hover:scale-125 ${config.emoji === em ? `${ct.bg20} ${ct.border} scale-110` : 'border-transparent'}`}>{em}</button>)}</div></div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.curriculum}</label><select value={config.schoolSystem} onChange={e => update('schoolSystem', e.target.value)} className="w-full p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none transition-all"><option value="US">{t.usCurriculum}</option><option value="USSR">{t.ussrCurriculum}</option><option value="both">{t.bothCurriculum}</option></select></div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.gradesScope}</label><div className="grid grid-cols-4 gap-2">{Array.from({ length: MAX_GRADE }, (_, i) => i + 1).map(g => <label key={g} className={`flex items-center justify-center gap-1.5 cursor-pointer p-2 border rounded-xl select-none transition-all text-sm font-bold ${config.gradeMode.grades.includes(g) ? `${ct.bg20} ${ct.border} ${ct.text} ${ct.textDark}` : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}><input type="checkbox" checked={config.gradeMode.grades.includes(g)} onChange={() => handleGrade(g)} className="sr-only" /><span>{g}</span></label>)}</div></div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.showTaskInfo}</label><button onClick={() => update('showTaskMeta', !config.showTaskMeta)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.showTaskMeta ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>{config.showTaskMeta ? '👁️ ON' : '👁️‍🗨️ OFF'}</button><p className="text-xs text-slate-400 mt-1">{t.showTaskInfoDesc}</p></div>
            <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.allowSelection}</label><button onClick={() => update('allowTextSelection', !config.allowTextSelection)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.allowTextSelection ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>{config.allowTextSelection ? '📋 ON' : '🔒 OFF'}</button><p className="text-xs text-slate-400 mt-1">{t.allowSelectionDesc}</p></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{config.sound ? t.soundOn : t.soundOff}</label><button onClick={() => update('sound', !config.sound)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.sound ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>{config.sound ? '🔊 ON' : '🔇 OFF'}</button></div>
                <div><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.timedMode}</label><button onClick={() => update('timedMode', !config.timedMode)} className={`w-full p-3 rounded-2xl font-bold border text-sm transition-all ${config.timedMode ? `${ct.primary} text-white ${ct.border} shadow-lg` : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>{config.timedMode ? '⏱️ ON' : '⏱️ OFF'}</button></div>
            </div>
            {config.timedMode && <div className="animate-slide-down"><label className="block text-xs font-black uppercase text-slate-400 mb-1.5">{t.timerLabel}: {config.timerSeconds}s</label><input type="range" min={30} max={300} step={30} value={config.timerSeconds} onChange={e => update('timerSeconds', parseInt(e.target.value))} className="w-full accent-indigo-600" /><div className="flex justify-between text-xs text-slate-400 font-bold"><span>30s</span><span className="opacity-0">.</span><span className="opacity-0">.</span><span>120s</span><span className="opacity-0">.</span><span className="opacity-0">.</span><span>210s</span><span className="opacity-0">.</span><span className="opacity-0">.</span><span>300s</span></div></div>}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-xs font-bold">
                <button onClick={() => { const b = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'math_config.json'; a.click(); }} className="p-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">{t.export}</button>
                <button onClick={() => fileInput.current?.click()} className="p-2.5 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all shadow-md active:scale-95">{t.import}</button>
                <input type="file" ref={fileInput} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { onConfigChange({ ...DEFAULT_CONFIG, ...JSON.parse(ev.target?.result as string) }); } catch {} }; r.readAsText(f); }} className="hidden" accept=".json" />
                <button onClick={() => { if (confirm(t.resetConfirm)) onConfigChange(DEFAULT_CONFIG); }} className="p-2.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-md active:scale-95">{t.reset}</button>
            </div>
        </div>
    );
};

const TaskDisplay: React.FC<{ task: GeneratedTaskInstance; onAnswer: (c: boolean) => void; next: () => void; onRetry: () => void; lang: 'ru' | 'en'; config: AppConfig }> = ({ task, onAnswer, next, onRetry, lang, config }) => {
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

    useEffect(() => { setNum(''); setDen(''); setText(''); setDone(false); setOk(false); setTimedOut(false); setEmptyWarning(false); setTimeout(() => inputRef.current?.focus(), 100); }, [task]);
    useEffect(() => { if (!done) return; const h = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [done, next]);
    const handleTimeUp = useCallback(() => { if (done) return; setTimedOut(true); setDone(true); setOk(false); onAnswer(false); }, [done, onAnswer]);

    const check = (e: React.FormEvent) => {
        e.preventDefault();
        if (done) return;
        if (task.answerType === 'number' && !num.trim()) { setEmptyWarning(true); setTimeout(() => setEmptyWarning(false), 2000); return; }
        if (task.answerType === 'fraction' && (!num.trim() || !den.trim())) { setEmptyWarning(true); setTimeout(() => setEmptyWarning(false), 2000); return; }
        if ((task.answerType === 'comparison' || task.answerType === 'text') && !text.trim()) { setEmptyWarning(true); setTimeout(() => setEmptyWarning(false), 2000); return; }
        let isOk = false;
        if (task.answerType === 'number') isOk = parseFloat(num) === task.correctAnswer;
        else if (task.answerType === 'comparison' || task.answerType === 'text') isOk = text.trim().toLowerCase() === String(task.correctAnswer).toLowerCase();
        else if (task.answerType === 'fraction') { const uN = parseInt(num), uD = parseInt(den); if (!isNaN(uN) && !isNaN(uD) && uD !== 0) isOk = fractionsEqual(uN, uD, task.correctAnswer.numerator, task.correctAnswer.denominator); }
        if (config.sound) isOk ? SoundEngine.playCorrect() : SoundEngine.playWrong();
        if (!isOk) { setIsShaking(true); setTimeout(() => setIsShaking(false), 400); }
        setOk(isOk); setDone(true); onAnswer(isOk);
    };

    const ib = `p-3 md:p-4 text-center border-3 rounded-2xl text-xl md:text-2xl font-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 shadow-md transition-all ${ct.border} ${ct.ring}`;

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
            <p className="text-lg md:text-xl lg:text-2xl text-slate-800 dark:text-slate-100 font-bold mb-5 leading-relaxed whitespace-pre-line">{task.question}</p>
            {task.visual && <TaskVisualizer data={task.visual} />}
            <form onSubmit={check} className="space-y-5">
                {!done ? (
                    <div className="space-y-3">
                        {emptyWarning && <div className="text-center text-rose-500 font-bold text-sm animate-bounce-in">⚠️ {t.emptyField}</div>}
                        <div className="flex flex-wrap justify-center items-center gap-3">
                            {task.answerType === 'fraction' ? (
                                <div className="flex items-center gap-2">
                                    <input ref={inputRef} type="number" value={num} onChange={e => setNum(e.target.value)} className={`${ib} w-20 md:w-24`} placeholder="?" />
                                    <span className="text-3xl font-black text-slate-600 dark:text-slate-300">/</span>
                                    <input type="number" value={den} onChange={e => setDen(e.target.value)} className={`${ib} w-20 md:w-24`} placeholder="?" />
                                </div>
                            ) : task.answerType === 'comparison' ? (
                                <input ref={inputRef} type="text" maxLength={1} value={text} onChange={e => setText(e.target.value)} className={`${ib} w-24 md:w-28`} placeholder="< = >" />
                            ) : task.answerType === 'text' ? (
                                <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)} className={`${ib} w-40 md:w-52`} placeholder="..." />
                            ) : (
                                <input ref={inputRef} type="number" step="any" value={num} onChange={e => setNum(e.target.value)} className={`${ib} w-32 md:w-40`} placeholder="?" />
                            )}
                            <button type="submit" className={`${ct.primary} text-white px-6 py-3.5 md:py-4 rounded-2xl text-lg md:text-xl font-black transition-all shadow-lg ${ct.shadow} active:scale-95 hover:opacity-90`}>{t.check}</button>
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
                            <div className="font-black text-lg md:text-xl mb-2">{ok ? t.correctFeedback : t.wrongFeedback}</div>
                            <p className="text-base md:text-lg font-medium whitespace-pre-line opacity-90 leading-relaxed">{ok ? task.explanationCorrect : task.explanationWrong}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            {!ok && <button type="button" onClick={onRetry} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 py-3.5 rounded-2xl text-lg font-black transition-all active:scale-95 border border-slate-300 dark:border-slate-600">{t.retryTask}</button>}
                            <button type="button" onClick={next} className={`w-full ${ct.primary} ${ct.primaryDark} text-white py-3.5 rounded-2xl text-lg font-black shadow-xl hover:opacity-90 transition-all active:scale-95 ${ok ? 'md:col-span-2' : ''}`}>{t.nextTask}</button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

const StatsBar: React.FC<{ stats: { correct: number; total: number; streak: number; bestStreak: number }; lang: 'ru' | 'en'; colorTheme: ColorTheme; animateCorrect: boolean; animateStreak: boolean }> = ({ stats, lang, colorTheme, animateCorrect, animateStreak }) => {
    const t = DICTIONARY[lang];
    const ct = COLOR_THEMES[colorTheme];
    return (
        <div className={`grid grid-cols-4 bg-gradient-to-r ${ct.gradient} rounded-2xl p-3 md:p-4 text-center text-white shadow-xl mb-5 w-full animate-fade-in`}>
            <div><div className={`text-xl md:text-2xl font-black ${animateCorrect ? 'animate-counter-up' : ''}`}>{stats.correct}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.correct}</div></div>
            <div><div className="text-xl md:text-2xl font-black">{stats.total}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.total}</div></div>
            <div><div className={`text-xl md:text-2xl font-black ${animateStreak ? 'animate-streak-fire' : ''}`}>🔥 {stats.streak}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.streak}</div></div>
            <div><div className="text-xl md:text-2xl font-black">⭐ {stats.bestStreak}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.best}</div></div>
        </div>
    );
};

// ========================================
// APP
// ========================================
export const App: React.FC = () => {
    const [config, setConfig] = useState<AppConfig>(() => { try { const s = localStorage.getItem('math_core_config'); return s ? { ...DEFAULT_CONFIG, ...JSON.parse(s) } : DEFAULT_CONFIG; } catch { return DEFAULT_CONFIG; } });
    const [stats, setStats] = useState(() => { try { const s = localStorage.getItem('math_core_stats'); return s ? JSON.parse(s) : { correct: 0, total: 0, streak: 0, bestStreak: 0 }; } catch { return { correct: 0, total: 0, streak: 0, bestStreak: 0 }; } });
    const [history, setHistory] = useState<HistoryEntry[]>(() => { try { const s = localStorage.getItem('math_core_history'); return s ? JSON.parse(s) : []; } catch { return []; } });
    const [task, setTask] = useState<GeneratedTaskInstance | null>(null);
    const [taskKey, setTaskKey] = useState(0);
    const [view, setView] = useState<'practice' | 'settings' | 'progress'>('practice');
    const [showConfetti, setShowConfetti] = useState(false);
    const [streakCelebration, setStreakCelebration] = useState(0);
    const [animateCorrect, setAnimateCorrect] = useState(false);
    const [animateStreak, setAnimateStreak] = useState(false);
    const t = DICTIONARY[config.lang];
    const ct = COLOR_THEMES[config.colorTheme];

    useEffect(() => { localStorage.setItem('math_core_config', JSON.stringify(config)); const el = document.documentElement; const dark = config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); dark ? el.classList.add('dark') : el.classList.remove('dark'); }, [config]);
    useEffect(() => { document.title = config.lang === 'ru' ? 'Математика СССР и США' : 'US math & USSR mathematics'; }, [config.lang]);
    useEffect(() => { localStorage.setItem('math_core_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('math_core_history', JSON.stringify(history)); }, [history]);
    useEffect(() => { handleNext(); }, [config.gradeMode.grades, config.schoolSystem, config.lang]);
    useEffect(() => { if (config.theme !== 'system') return; const mq = window.matchMedia('(prefers-color-scheme: dark)'); const h = (e: MediaQueryListEvent) => { e.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }; mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, [config.theme]);

    const handleNext = useCallback(() => { const pr: StudentProfile = { name: config.studentName.trim(), gender: config.avatarTheme }; setTaskKey(k => k + 1); setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang, pr)); }, [config]);
    const handleRetry = useCallback(() => { if (!task) return; const pr: StudentProfile = { name: config.studentName.trim(), gender: config.avatarTheme }; setTaskKey(k => k + 1); setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang, pr, task.id)); }, [config, task]);

    const handleResult = useCallback((ok: boolean) => {
        setStats((prev: any) => { const ns = ok ? prev.streak + 1 : 0; return { correct: prev.correct + (ok ? 1 : 0), total: prev.total + 1, streak: ns, bestStreak: Math.max(prev.bestStreak || 0, ns) }; });
        if (task) setHistory(prev => [...prev.slice(-499), { taskId: task.id, grade: task.grade, system: task.system, topic: task.topic, correct: ok, timestamp: Date.now() }]);
        if (ok) {
            setAnimateCorrect(true); setTimeout(() => setAnimateCorrect(false), 400);
            const ns = stats.streak + 1;
            if ([5, 10, 25].includes(ns)) { setShowConfetti(true); setStreakCelebration(ns); setAnimateStreak(true); if (config.sound) SoundEngine.playStreak(); setTimeout(() => { setShowConfetti(false); setStreakCelebration(0); setAnimateStreak(false); }, 2500); }
            else { setAnimateStreak(true); setTimeout(() => setAnimateStreak(false), 600); }
        }
    }, [task, stats.streak, config.sound]);

    const wsTitle = () => { const n = config.studentName.trim(); if (!n) return t.workspaceNeutral; if (config.lang === 'ru') { if (config.avatarTheme === 'girl') return `Ученица: ${n}`; if (config.avatarTheme === 'boy') return `Ученик: ${n}`; return n; } return `${n}'s Workspace`; };

    return (
        <div className={`min-h-screen w-screen p-3 md:p-6 lg:p-10 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col items-center justify-start md:justify-center overflow-x-hidden overflow-y-auto ${config.allowTextSelection ? '' : 'select-none'}`}>
            <Confetti active={showConfetti} />
            <StreakCelebration streak={streakCelebration} lang={config.lang} />
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl flex flex-col justify-center">
                <header className="flex justify-between items-center py-3 md:py-4 mb-2 w-full animate-fade-in">
                    <div className="flex items-start gap-2">
                        <h1 className={`text-2xl md:text-3xl lg:text-4xl font-black ${ct.text} ${ct.textDark} tracking-widest leading-none`}>{t.appTitle}</h1>
                        <div className="flex flex-col justify-center pt-0.5">
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold italic tracking-wide leading-tight">{t.appSubtitle}</p>
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold leading-tight">{wsTitle()} {config.emoji}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {view !== 'progress' && <button onClick={() => setView(view === 'settings' ? 'practice' : 'settings')} className="px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">{view === 'settings' ? t.practice : t.menu}</button>}
                        <button onClick={() => setView(view === 'progress' ? 'practice' : 'progress')} className="px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">{view === 'progress' ? t.practice : t.history}</button>
                    </div>
                </header>
                <StatsBar stats={stats} lang={config.lang} colorTheme={config.colorTheme} animateCorrect={animateCorrect} animateStreak={animateStreak} />
                <div className="w-full flex items-start justify-center pb-6">
                    {view === 'settings' ? <SettingsMenu config={config} onConfigChange={setConfig} />
                        : view === 'progress' ? <ProgressView history={history} lang={config.lang} onBack={() => setView('practice')} />
                            : task && <TaskDisplay key={taskKey} task={task} onAnswer={handleResult} next={handleNext} onRetry={handleRetry} lang={config.lang} config={config} />}
                </div>
            </div>
        </div>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
