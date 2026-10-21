import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { type L10n, type Lang, type Problem, type SkillId, type Topic, SKILL_NAME, TOPIC_ICON, TOPIC_NAME, TOPIC_OF, TOPIC_TARGET, fmt, makeRng, sameAnswer } from './engine/core';
import {
    type GameState, ALL_SKILLS, addTime, applyAnswer, applyQuiz, applyTest, applyTheoryRead, buildTest, grade, newState, nextProblem, normalize, totalTime,
} from './engine/game';
import { makeFreshProblem } from './engine/index';
import { ENCOURAGE, KIND, LOVE, PRAISE, WHY_MATH } from './engine/messages';
import { QUIZ_PASS, buildQuiz } from './engine/quiz';
import { CHAPTERS, STARS_PER_CHAPTER } from './engine/story';
import { type Section, type Theory, answerLine, buildTheory } from './engine/theory';
import { VisualView } from './ui/Boards';
import { Guide, Lina, Pip } from './ui/Buddy';
import { PAINTINGS, PaintingView } from './ui/Paintings';

// ========================================
// UI TEXTS
// ========================================
const UI = {
    en: {
        title: 'Math Quest', subtitle: 'with Lina and Pip', play: 'Play', playSub: 'Learn by playing', test: 'Practice test', testSub: '12 tasks, like at school on Friday',
        story: 'Story book', gallery: 'My paintings', progress: 'Progress', settings: 'Settings', home: 'Home', check: 'Check', hint: 'Hint', next: 'Next task',
        learn: 'Let\'s learn it with Lina', learnFirst: 'Read the theory first', readDone: 'I read it! Quiz time', quiz: 'Mini quiz', question: 'Question', of: 'of',
        quizPassed: 'Quiz passed!', quizFailed: 'Not yet, let\'s read it once more', tryNew: 'Try a new task', backToTask: 'Back to my task', readAgain: 'Read again with new examples',
        howSolve: 'How to solve it', correct: 'Correct!', wrong: 'Not quite', stars: 'Stars', streak: 'Streak', today: 'Today', accuracy: 'Correct', quotient: 'Answer',
        remainder: 'R', empty: 'Type your answer first', pick: 'Choose an answer', startTest: 'Start the test', finish: 'Finish the test', result: 'Your result', gradeL: 'Grade',
        time: 'Time', practiceMistakes: 'Practice my mistakes', back: 'Back', locked: 'Opens at', chapter: 'Chapter', read: 'Read', language: 'Language', theme: 'Theme',
        sound: 'Sound', reset: 'Reset all progress', resetConfirm: 'Really delete all stars and progress?', parents: 'For Mom and Dad', minutes: 'min', goal: 'Daily goal',
        balance: 'Learning time', target: 'goal', skill: 'Skill', solved: 'Solved', reads: 'Theory', quizzes: 'Quizzes', tests: 'Practice tests', noTests: 'No tests yet',
        painting: 'Magic painting', finished: 'Finished paintings', newPainting: 'Your painting is finished! A new one is waiting.', light: 'Light', dark: 'Dark', system: 'Auto',
        on: 'On', off: 'Off', yourAnswer: 'Your answer', rightAnswer: 'Right answer', starsWord: 'stars', reviewFirst: 'Let\'s look at the theory for this one first, then you will crush it!',
        testIntro: 'Like a real test: no hints, answer every task, the results come at the end. Ready?', theoryFor: 'Theory', skipTheory: 'Back to the task', paintingHelp: 'Every star paints one more part of the picture.',
        parentsText: 'Learning time follows 50% division, 25% motion and speed, 25% rounding and estimating. A wrong answer always leads to theory and a mini quiz, and that skill comes back a few tasks later. Content follows the NJ Student Learning Standards for grade 4 (4.NBT.A.3, 4.NBT.B.5, 4.NBT.B.6, 4.OA.A.3, 4.M.A.1-2, 4-PS3-1, 4-PS3-3); velocity and acceleration are bonus explorer words.',
        perfect: 'Perfect test!', stepsWord: 'Steps', yes: 'Yes', no: 'No', taskOf: 'Task',
        nextQ: 'Next question', finishQuiz: 'Finish the quiz', youAnswered: 'You answered', testIn: (n: number) => n === 0 ? 'The test is today! You are ready!' : n === 1 ? 'The test is tomorrow!' : `The test is in ${n} days`, testDate: 'School test date', almost: '2 of 3, almost perfect! Great learning.', earned: 'stars earned',
    },
    ru: {
        title: 'Математический квест', subtitle: 'с Линой и Пип', play: 'Играть', playSub: 'Учимся, играя', test: 'Пробный тест', testSub: '12 заданий, как в школе в пятницу',
        story: 'Книжка-история', gallery: 'Мои картины', progress: 'Прогресс', settings: 'Настройки', home: 'Домой', check: 'Проверить', hint: 'Подсказка', next: 'Следующее задание',
        learn: 'Разберёмся вместе с Линой', learnFirst: 'Сначала прочитать теорию', readDone: 'Прочитала! К викторине', quiz: 'Мини-викторина', question: 'Вопрос', of: 'из',
        quizPassed: 'Викторина пройдена!', quizFailed: 'Пока не получилось, прочитаем ещё раз', tryNew: 'Новое задание', backToTask: 'Вернуться к заданию', readAgain: 'Прочитать ещё раз с новыми примерами',
        howSolve: 'Как решать', correct: 'Верно!', wrong: 'Не совсем', stars: 'Звёзды', streak: 'Серия', today: 'Сегодня', accuracy: 'Верно', quotient: 'Ответ',
        remainder: 'Ост.', empty: 'Сначала напиши ответ', pick: 'Выбери ответ', startTest: 'Начать тест', finish: 'Закончить тест', result: 'Твой результат', gradeL: 'Оценка',
        time: 'Время', practiceMistakes: 'Потренировать ошибки', back: 'Назад', locked: 'Откроется при', chapter: 'Глава', read: 'Читать', language: 'Язык', theme: 'Тема',
        sound: 'Звук', reset: 'Сбросить весь прогресс', resetConfirm: 'Точно удалить все звёзды и прогресс?', parents: 'Для мамы и папы', minutes: 'мин', goal: 'Цель на день',
        balance: 'Время учёбы', target: 'цель', skill: 'Навык', solved: 'Решено', reads: 'Теория', quizzes: 'Викторины', tests: 'Пробные тесты', noTests: 'Тестов пока нет',
        painting: 'Волшебная картина', finished: 'Готовые картины', newPainting: 'Картина готова! Тебя ждёт новая.', light: 'Светлая', dark: 'Тёмная', system: 'Авто',
        on: 'Вкл', off: 'Выкл', yourAnswer: 'Твой ответ', rightAnswer: 'Правильный ответ', starsWord: 'звёзд', reviewFirst: 'Давай сначала заглянем в теорию к этому заданию, и всё получится!',
        testIntro: 'Как настоящий тест: без подсказок, ответь на все задания, результаты в конце. Готова?', theoryFor: 'Теория', skipTheory: 'Вернуться к заданию', paintingHelp: 'Каждая звезда раскрашивает ещё кусочек картины.',
        parentsText: 'Время учёбы делится так: 50% деление, 25% движение и скорость, 25% округление и прикидка. После ошибки всегда идёт теория и мини-викторина, а навык возвращается через несколько заданий. Содержание по стандартам NJ для 4 класса (4.NBT.A.3, 4.NBT.B.5, 4.NBT.B.6, 4.OA.A.3, 4.M.A.1-2, 4-PS3-1, 4-PS3-3); velocity и ускорение - бонусные слова исследователя.',
        perfect: 'Идеальный тест!', stepsWord: 'Шаги', yes: 'Да', no: 'Нет', taskOf: 'Задание',
        nextQ: 'Следующий вопрос', finishQuiz: 'Закончить викторину', youAnswered: 'Ты ответила', testIn: (n: number) => n === 0 ? 'Тест сегодня! Ты готова!' : n === 1 ? 'Тест завтра!' : `До теста ${n} ${n < 5 ? 'дня' : 'дней'}`, testDate: 'Дата теста в школе', almost: '2 из 3 - почти идеально! Отлично учишься.', earned: 'звёзд заработано',
    },
};
type UIText = typeof UI.en;

const STORE = 'math_quest_v1';
// two stars paint one part of the magic picture
const STARS_PER_PART = 2;
const params = new URLSearchParams(location.search);
const SELFTEST = params.has('selftest');
const seed = Number(params.get('seed')) || (Date.now() % 2147483647);
const today = () => new Date().toISOString().slice(0, 10);
const tr = (l: L10n, lang: Lang) => l[lang];

// ========================================
// SOUND
// ========================================
const Sound = {
    ctx: null as AudioContext | null,
    tone(freqs: number[], type: OscillatorType = 'sine', len = 0.12) {
        try {
            this.ctx = this.ctx ?? new AudioContext();
            const ctx = this.ctx;
            freqs.forEach((f, i) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = type; o.connect(g); g.connect(ctx.destination);
                const t = ctx.currentTime + i * len;
                o.frequency.setValueAtTime(f, t);
                g.gain.setValueAtTime(0.18, t);
                g.gain.exponentialRampToValueAtTime(0.01, t + len * 1.8);
                o.start(t); o.stop(t + len * 2);
            });
        } catch { /* audio is optional */ }
    },
    good() { this.tone([523, 659, 784]); },
    bad() { this.tone([330, 262], 'triangle', 0.16); },
    win() { this.tone([523, 659, 784, 1047, 1319], 'sine', 0.1); },
};

// ========================================
// SMALL PIECES
// ========================================
const card = 'bg-white dark:bg-slate-800 p-5 md:p-7 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700';
const primary = 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 hover:opacity-90 transition-all disabled:opacity-40';
const secondary = 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-2xl font-black active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all';

const Confetti: React.FC<{ on: boolean }> = ({ on }) => {
    if (!on) return null;
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 36 }, (_, i) => (
                <div key={i} className="absolute animate-confetti-fall" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 13) % 30}%`, width: 9, height: 9, borderRadius: i % 2 ? '50%' : '2px', background: colors[i % colors.length], animationDelay: `${(i % 9) * 0.06}s` }} />
            ))}
        </div>
    );
};

const StatsBar: React.FC<{ g: GameState; t: UIText; pop: boolean }> = ({ g, t, pop }) => {
    const mins = Math.floor((g.daily[today()] ?? 0) / 60);
    const acc = g.answered ? Math.round((g.correct / g.answered) * 100) : 0;
    return (
        <div className="grid grid-cols-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-3 md:p-4 text-center text-white shadow-xl mb-4 w-full" data-testid="statsbar">
            <div><div className={`text-xl md:text-2xl font-black ${pop ? 'animate-counter-up' : ''}`} data-testid="stars">⭐ {g.stars}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.stars}</div></div>
            <div><div className="text-xl md:text-2xl font-black">🔥 {g.streak}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.streak}</div></div>
            <div><div className="text-xl md:text-2xl font-black">⏱ {mins}</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.today}, {t.minutes}</div></div>
            <div><div className="text-xl md:text-2xl font-black">✓ {acc}%</div><div className="opacity-70 text-[10px] md:text-xs uppercase font-extrabold tracking-wider">{t.accuracy}</div></div>
        </div>
    );
};

const Steps: React.FC<{ steps: L10n[]; lang: Lang }> = ({ steps, lang }) => (
    <ol className="space-y-1.5 text-base md:text-lg font-medium leading-relaxed">
        {steps.map((s, i) => <li key={i} className="whitespace-pre-line">{tr(s, lang)}</li>)}
    </ol>
);

// ========================================
// ANSWER INPUT
// ========================================
type Given = { value?: number; q?: number; r?: number; choice?: number };
const digitsOnly = (s: string) => s.replace(/[^\d]/g, '');

const AnswerInput: React.FC<{ problem: Problem; lang: Lang; t: UIText; onSubmit: (g: Given) => void; label?: string }> = ({ problem, lang, t, onSubmit, label }) => {
    const [v, setV] = useState('');
    const [r, setR] = useState('');
    const [c, setC] = useState<number | null>(null);
    const [warn, setWarn] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { setV(''); setR(''); setC(null); setTimeout(() => ref.current?.focus({ preventScroll: true }), 80); }, [problem.id]);
    const a = problem.answer;
    const submit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (a.kind === 'choice') { if (c === null) { setWarn(true); setTimeout(() => setWarn(false), 1800); return; } onSubmit({ choice: c }); return; }
        if (!digitsOnly(v) || (a.kind === 'remainder' && !digitsOnly(r))) { setWarn(true); setTimeout(() => setWarn(false), 1800); return; }
        if (a.kind === 'remainder') onSubmit({ q: Number(digitsOnly(v)), r: Number(digitsOnly(r)) });
        else onSubmit({ value: Number(digitsOnly(v)) });
    };
    const box = 'p-3 md:p-4 text-center border-[3px] border-indigo-500 rounded-2xl text-2xl md:text-3xl font-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-md';
    return (
        <form onSubmit={submit} className="space-y-3" data-testid="answer-form">
            {warn && <div className="text-center text-rose-500 font-bold animate-bounce-in">⚠️ {a.kind === 'choice' ? t.pick : t.empty}</div>}
            {a.kind === 'choice' ? (
                <div className="grid gap-2">
                    {a.options.map((o, i) => (
                        <button type="button" key={i} data-testid={`choice-${i}`} onClick={() => setC(i)}
                            className={`text-left p-4 rounded-2xl border-2 font-bold text-base md:text-lg transition-all active:scale-[0.98] ${c === i ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100'}`}>
                            <span className="inline-flex w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 items-center justify-center text-sm mr-2">{'ABCD'[i]}</span>{tr(o, lang)}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap justify-center items-center gap-3">
                    <input ref={ref} data-testid="answer" inputMode="numeric" autoComplete="off" value={v} onChange={e => setV(e.target.value)} placeholder="?" aria-label={label ?? t.quotient} className={`${box} w-36 md:w-44`} />
                    {a.kind === 'remainder' && (<>
                        <span className="text-2xl font-black text-rose-500">{t.remainder}</span>
                        <input data-testid="remainder" inputMode="numeric" autoComplete="off" value={r} onChange={e => setR(e.target.value)} placeholder="?" aria-label={t.remainder} className={`${box} w-24 border-rose-400`} />
                    </>)}
                </div>
            )}
            <button type="submit" data-testid="check" className={`${primary} w-full py-4 text-xl`}>{t.check}</button>
        </form>
    );
};

// ========================================
// THEORY PAGE (a page from a storybook)
// ========================================
const SectionView: React.FC<{ s: Section; lang: Lang }> = ({ s, lang }) => {
    const box = 'rounded-2xl p-4 md:p-5';
    if (s.kind === 'story') return <p className="text-lg md:text-xl leading-relaxed font-serif italic text-slate-700 dark:text-slate-200 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 rounded-r-2xl p-4">{tr(s.body, lang)}</p>;
    if (s.kind === 'life') return <div className={`${box} bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold`}>🌱 {tr(s.body, lang)}</div>;
    if (s.kind === 'love') return <div className={`${box} bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-black text-center`}>{tr(s.body, lang)}</div>;
    const tone = s.kind === 'warn' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800' : s.kind === 'trick' ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800'
        : s.kind === 'example' ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700';
    const icon = { idea: '💡', steps: '🪜', example: '✏️', warn: '⚠️', trick: '🧠' }[s.kind];
    return (
        <div className={`${box} border ${tone}`}>
            <h3 className="font-black text-lg md:text-xl mb-2 text-slate-800 dark:text-slate-100">{icon} {tr(s.title, lang)}</h3>
            {s.kind === 'example' && <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 whitespace-pre-line">{tr(s.prompt, lang)}</p>}
            <ul className="space-y-1.5 text-base md:text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                {s.body.map((b, i) => <li key={i} className="whitespace-pre-line">{tr(b, lang)}</li>)}
            </ul>
            {s.kind === 'example' && <VisualView visual={s.visual} lang={lang} />}
        </div>
    );
};

const TheoryView: React.FC<{ theory: Theory; lang: Lang; t: UIText; onDone: () => void; onSkip?: () => void }> = ({ theory, lang, t, onDone, onSkip }) => (
    <div className={`${card} space-y-4 animate-slide-up`} data-testid="theory">
        <div className="flex items-center gap-3">
            <Lina mood="happy" size={64} />
            <div>
                <div className="text-xs font-black uppercase tracking-wider text-indigo-500">{TOPIC_ICON[TOPIC_OF[theory.skill]]} {t.theoryFor}</div>
                <h2 className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{tr(theory.title, lang)}</h2>
            </div>
        </div>
        {theory.sections.map((s, i) => <SectionView key={i} s={s} lang={lang} />)}
        <button data-testid="theory-done" onClick={onDone} className={`${primary} w-full py-4 text-xl`}>📝 {t.readDone}</button>
        {onSkip && <button onClick={onSkip} className={`${secondary} w-full py-3`}>{t.skipTheory}</button>}
    </div>
);

// ========================================
// QUIZ
// ========================================
const QuizView: React.FC<{ items: Problem[]; lang: Lang; t: UIText; sound: boolean; onDone: (correct: number) => void }> = ({ items, lang, t, sound, onDone }) => {
    const [i, setI] = useState(0);
    const [results, setResults] = useState<boolean[]>([]);
    const [shown, setShown] = useState<boolean | null>(null);
    const p = items[i];
    const answer = (g: Given) => {
        const ok = sameAnswer(p.answer, g);
        if (sound) ok ? Sound.good() : Sound.bad();
        setShown(ok);
        setResults(r => [...r, ok]);
    };
    const next = () => {
        if (i + 1 >= items.length) { onDone(results.filter(Boolean).length); return; }
        setI(i + 1); setShown(null);
    };
    return (
        <div className={`${card} space-y-4 animate-slide-up`} data-testid="quiz" data-selftest-answer={SELFTEST ? JSON.stringify(p.answer) : undefined}>
            <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black text-violet-600 dark:text-violet-400">📝 {t.quiz}</h2>
                <span className="text-sm font-black text-slate-400" data-testid="quiz-progress">{t.question} {i + 1} {t.of} {items.length}</span>
            </div>
            <div className="flex gap-1.5">{items.map((_, k) => <div key={k} className={`h-2 flex-1 rounded-full ${k < results.length ? (results[k] ? 'bg-emerald-400' : 'bg-rose-400') : k === i ? 'bg-violet-400' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>
            <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed" data-testid="quiz-prompt">{tr(p.prompt, lang)}</p>
            {shown === null ? <AnswerInput problem={p} lang={lang} t={t} onSubmit={answer} /> : (
                <div className="space-y-3 animate-slide-up">
                    <div className={`p-4 rounded-2xl border-[3px] ${shown ? 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'}`} data-testid="quiz-feedback" data-ok={String(shown)}>
                        <div className="font-black text-lg mb-1">{shown ? `✅ ${t.correct}` : `💭 ${t.wrong}`}</div>
                        <Steps steps={[...p.steps, answerLine(p)]} lang={lang} />
                    </div>
                    <button data-testid="quiz-next" onClick={next} className={`${primary} w-full py-4 text-xl`}>{i + 1 < items.length ? `${t.nextQ} ▶` : `${t.finishQuiz} ✓`}</button>
                </div>
            )}
        </div>
    );
};

// ========================================
// APP
// ========================================
type Screen = 'home' | 'play' | 'theory' | 'quiz' | 'quizResult' | 'test' | 'testResult' | 'stats' | 'story' | 'gallery' | 'settings';
type Learn = { skill: SkillId; failed?: Problem; mode: 'failed' | 'first' | 'due'; theory: Theory; quiz: Problem[]; quizScore: number };
type Attempt = { hint: boolean; wrong: boolean; afterLearn: boolean; start: number; result: null | { ok: boolean; stars: number; praise: L10n; given: string } };
type TestRun = { problems: Problem[]; idx: number; given: Given[]; start: number; results?: boolean[] };

const load = (): GameState => { try { const s = localStorage.getItem(STORE); return s ? normalize(JSON.parse(s)) : newState(); } catch { return newState(); } };

export const App: React.FC = () => {
    const [g, setG] = useState<GameState>(load);
    const [screen, setScreen] = useState<Screen>('home');
    const [problem, setProblem] = useState<Problem | null>(null);
    const [attempt, setAttempt] = useState<Attempt>({ hint: false, wrong: false, afterLearn: false, start: Date.now(), result: null });
    const [learn, setLearn] = useState<Learn | null>(null);
    const [test, setTest] = useState<TestRun | null>(null);
    const [chapter, setChapter] = useState<number | null>(null);
    const [confetti, setConfetti] = useState(false);
    const [pop, setPop] = useState(false);
    const [banner, setBanner] = useState<L10n | null>(null);
    const rng = useRef(makeRng(seed)).current;
    const lastActive = useRef(Date.now());
    const lang = g.lang;
    const t = UI[lang];
    const greeting = useMemo(() => [rng() < 0.5 ? LOVE[Math.floor(rng() * LOVE.length)] : WHY_MATH[Math.floor(rng() * WHY_MATH.length)]], [screen === 'home']);

    // persist and theme
    useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(g)); } catch { /* private mode */ } }, [g]);
    useEffect(() => {
        const dark = g.theme === 'dark' || (g.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
    }, [g.theme]);
    useEffect(() => { document.title = lang === 'en' ? 'Math Quest with Lina' : 'Математический квест с Линой'; document.documentElement.lang = lang; }, [lang]);
    useEffect(() => { window.scrollTo({ top: 0 }); }, [screen, problem?.id]);
    useEffect(() => { if (!banner) return; const id = setTimeout(() => setBanner(null), 7000); return () => clearTimeout(id); }, [banner]);
    const go = (s: Screen) => { setBanner(null); setScreen(s); };

    // learning time: counts only while the page is visible, she is active and on a learning screen
    const currentTopic: Topic | null = screen === 'play' && problem ? problem.topic
        : (screen === 'theory' || screen === 'quiz') && learn ? TOPIC_OF[learn.skill]
            : screen === 'test' && test ? test.problems[test.idx]?.topic ?? null : null;
    useEffect(() => {
        const mark = () => { lastActive.current = Date.now(); };
        window.addEventListener('pointerdown', mark); window.addEventListener('keydown', mark); window.addEventListener('scroll', mark, { passive: true });
        return () => { window.removeEventListener('pointerdown', mark); window.removeEventListener('keydown', mark); window.removeEventListener('scroll', mark); };
    }, []);
    useEffect(() => {
        if (!currentTopic) return;
        const id = setInterval(() => {
            if (document.visibilityState !== 'visible' || Date.now() - lastActive.current > 90_000) return;
            setG(s => addTime(s, currentTopic, 5, today()));
        }, 5000);
        return () => clearInterval(id);
    }, [currentTopic]);

    // the stars also paint the magic picture
    const paint = (s: GameState, stars: number): GameState => {
        if (!stars) return s;
        const p = { ...s.painting, done: [...s.painting.done] };
        p.filled += stars;
        let finished = false;
        while (p.filled >= PAINTINGS[p.index].regions.length * STARS_PER_PART) {
            p.filled -= PAINTINGS[p.index].regions.length * STARS_PER_PART;
            p.done.push(p.index);
            p.index = (p.index + 1) % PAINTINGS.length;
            finished = true;
        }
        if (finished) { setBanner({ en: UI.en.newPainting, ru: UI.ru.newPainting }); celebrate(); }
        return { ...s, painting: p };
    };
    const celebrate = () => { setConfetti(true); if (g.sound) Sound.win(); setTimeout(() => setConfetti(false), 2200); };

    const openTheory = (skill: SkillId, mode: Learn['mode'], failed?: Problem) => {
        const theory = buildTheory(skill, rng, failed);
        setLearn({ skill, failed, mode, theory, quiz: [], quizScore: 0 });
        setG(s => applyTheoryRead(s, skill));
        setScreen('theory');
    };

    const startProblem = (p: Problem, afterLearn = false) => {
        setProblem(p);
        setAttempt({ hint: false, wrong: false, afterLearn, start: Date.now(), result: null });
        setScreen('play');
    };

    const play = () => {
        if (problem && !attempt.result) { setScreen('play'); return; }
        const p = nextProblem(g, rng);
        if (g.skills[p.skill].needsTheory) { setProblem(p); setAttempt({ hint: false, wrong: false, afterLearn: true, start: Date.now(), result: null }); setBanner({ en: UI.en.reviewFirst, ru: UI.ru.reviewFirst }); openTheory(p.skill, 'due'); return; }
        startProblem(p);
    };

    const submit = (given: Given) => {
        if (!problem) return;
        const ok = sameAnswer(problem.answer, given);
        const { state, stars } = applyAnswer(g, problem, ok, { firstTry: !attempt.afterLearn, hint: attempt.hint, sec: (Date.now() - attempt.start) / 1000 });
        setG(paint(state, stars));
        if (g.sound) ok ? Sound.good() : Sound.bad();
        if (ok) { setPop(true); setTimeout(() => setPop(false), 500); if (state.streak > 0 && state.streak % 5 === 0) celebrate(); }
        setAttempt(a => ({ ...a, wrong: !ok, result: { ok, stars, given: givenText(problem, given, lang), praise: ok ? (state.streak % 5 === 0 ? LOVE[Math.floor(rng() * LOVE.length)] : PRAISE[Math.floor(rng() * PRAISE.length)]) : ENCOURAGE[Math.floor(rng() * ENCOURAGE.length)] } }));
    };

    const theoryDone = () => {
        if (!learn) return;
        const quiz = buildQuiz(learn.skill, rng, new Set(g.recent));
        setLearn({ ...learn, quiz });
        setScreen('quiz');
    };

    const quizDone = (correct: number) => {
        if (!learn) return;
        const passed = correct >= QUIZ_PASS;
        setG(s => applyQuiz(s, learn.skill, passed, learn.quiz.map(q => q.id)));
        setLearn({ ...learn, quizScore: correct });
        if (passed && g.sound) Sound.win();
        setScreen('quizResult');
    };

    const afterQuiz = () => {
        if (!learn) return;
        if (learn.quizScore < QUIZ_PASS) { openTheory(learn.skill, learn.mode, learn.failed); return; }
        // read first: back to the same task; after a mistake: a brand-new task of the same skill
        if (learn.mode === 'first' && problem && !attempt.result) { setScreen('play'); return; }
        if (learn.mode === 'due' && problem && !attempt.result) { setScreen('play'); return; }
        startProblem(makeFreshProblem(learn.skill, rng, new Set(g.recent)), true);
    };

    const startTest = () => { setTest({ problems: buildTest(g, rng), idx: 0, given: [], start: Date.now() }); go('test'); };
    const testAnswer = (given: Given) => {
        if (!test) return;
        const all = [...test.given, given];
        if (test.idx + 1 < test.problems.length) { setTest({ ...test, given: all, idx: test.idx + 1 }); return; }
        const results = test.problems.map((p, i) => sameAnswer(p.answer, all[i]));
        const sec = (Date.now() - test.start) / 1000;
        setG(paint(applyTest(g, test.problems, results, sec), results.filter(Boolean).length));
        setTest({ ...test, given: all, results });
        if (results.every(Boolean)) celebrate();
        setScreen('testResult');
    };

    // self-check hooks: the browser checks read the current right answer
    useEffect(() => {
        if (!SELFTEST) return;
        (window as unknown as { __mq: unknown }).__mq = { screen, problem, learn, test, state: g, seed };
    });

    const setLang = (l: Lang) => setG(s => ({ ...s, lang: l }));
    const chaptersOpen = Math.min(CHAPTERS.length, 1 + Math.floor(g.stars / STARS_PER_CHAPTER));

    return (
        <div className="min-h-screen w-full px-4 py-3 md:p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors flex flex-col items-center overflow-x-hidden">
            <Confetti on={confetti} />
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl flex flex-col">
                <header className="flex justify-between items-center py-3 mb-1 gap-2">
                    <button onClick={() => go('home')} className="flex items-center gap-2 text-left min-w-0" data-testid="nav-home">
                        <Pip size={40} className="shrink-0" />
                        <div>
                            <h1 className="text-base sm:text-xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-wide leading-none truncate">{t.title}</h1>
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold italic">{t.subtitle}</p>
                        </div>
                    </button>
                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                        <button data-testid="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} className="px-2.5 sm:px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black">{lang === 'en' ? 'RU' : 'EN'}</button>
                        <button data-testid="nav-stats" onClick={() => go('stats')} className="px-2.5 sm:px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black">📊</button>
                        <button data-testid="nav-settings" onClick={() => go('settings')} className="px-2.5 sm:px-3 py-2 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-black">⚙️</button>
                    </div>
                </header>
                <StatsBar g={g} t={t} pop={pop} />
                {banner && <div className="mb-3 animate-bounce-in" onClick={() => setBanner(null)}><Guide mood="cheer">{tr(banner, lang)}</Guide></div>}
                <main className="w-full pb-8">
                    {screen === 'home' && <Home g={g} t={t} lang={lang} greeting={greeting[0]} chaptersOpen={chaptersOpen} onPlay={play} onTest={startTest} onStory={() => { setChapter(null); go('story'); }} onGallery={() => go('gallery')} onStats={() => go('stats')} />}
                    {screen === 'play' && problem && (
                        <PlayView problem={problem} attempt={attempt} lang={lang} t={t}
                            onSubmit={submit}
                            onHint={() => setAttempt(a => ({ ...a, hint: true }))}
                            onLearnFirst={() => openTheory(problem.skill, 'first')}
                            onLearn={() => { setBanner(null); openTheory(problem.skill, 'failed', problem); }}
                            onNext={() => { setBanner(null); const p = nextProblem(g, rng); if (g.skills[p.skill].needsTheory) { setProblem(p); setAttempt({ hint: false, wrong: false, afterLearn: true, start: Date.now(), result: null }); setBanner({ en: UI.en.reviewFirst, ru: UI.ru.reviewFirst }); openTheory(p.skill, 'due'); } else startProblem(p); }} />
                    )}
                    {screen === 'theory' && learn && <TheoryView theory={learn.theory} lang={lang} t={t} onDone={() => { setBanner(null); theoryDone(); }} onSkip={learn.mode === 'first' ? () => setScreen('play') : undefined} />}
                    {screen === 'quiz' && learn && <QuizView key={learn.quiz.map(q => q.id).join()} items={learn.quiz} lang={lang} t={t} sound={g.sound} onDone={quizDone} />}
                    {screen === 'quizResult' && learn && (
                        <div className={`${card} space-y-4 text-center animate-bounce-in`} data-testid="quiz-result" data-passed={String(learn.quizScore >= QUIZ_PASS)}>
                            <Lina mood={learn.quizScore >= QUIZ_PASS ? 'cheer' : 'care'} size={110} className="mx-auto" />
                            <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{learn.quizScore >= QUIZ_PASS ? `🎉 ${t.quizPassed}` : t.quizFailed}</h2>
                            <p className="text-xl font-black">{learn.quizScore} / {learn.quiz.length}</p>
                            <p className="font-bold text-rose-500">{learn.quizScore === learn.quiz.length ? tr(PRAISE[learn.quizScore % PRAISE.length], lang) : learn.quizScore >= QUIZ_PASS ? t.almost : tr(KIND[learn.quizScore % KIND.length], lang)}</p>
                            <button data-testid="quiz-continue" onClick={afterQuiz} className={`${primary} w-full py-4 text-xl`}>
                                {learn.quizScore < QUIZ_PASS ? `📖 ${t.readAgain}` : (learn.mode !== 'failed' && problem && !attempt.result) ? `▶ ${t.backToTask}` : `▶ ${t.tryNew}`}
                            </button>
                        </div>
                    )}
                    {screen === 'test' && test && <TestView run={test} lang={lang} t={t} onAnswer={testAnswer} />}
                    {screen === 'testResult' && test?.results && <TestResult run={test} lang={lang} t={t} onPractice={() => { setProblem(null); play(); }} onHome={() => go('home')} />}
                    {screen === 'stats' && <StatsView g={g} t={t} lang={lang} />}
                    {screen === 'story' && <StoryView open={chaptersOpen} chapter={chapter} setChapter={i => { setChapter(i); if (i !== null && !g.chaptersRead.includes(i)) setG(s => ({ ...s, chaptersRead: [...s.chaptersRead, i] })); }} lang={lang} t={t} stars={g.stars} />}
                    {screen === 'gallery' && <GalleryView g={g} t={t} lang={lang} />}
                    {screen === 'settings' && <SettingsView g={g} setG={setG} t={t} />}
                </main>
            </div>
        </div>
    );
};

// ========================================
// SCREENS
// ========================================
const Home: React.FC<{ g: GameState; t: UIText; lang: Lang; greeting: L10n; chaptersOpen: number; onPlay: () => void; onTest: () => void; onStory: () => void; onGallery: () => void; onStats: () => void }> = ({ g, t, lang, greeting, chaptersOpen, onPlay, onTest, onStory, onGallery, onStats }) => {
    const mins = Math.floor((g.daily[today()] ?? 0) / 60);
    const goal = 20;
    const p = PAINTINGS[g.painting.index];
    return (
        <div className="space-y-4 animate-slide-up" data-testid="home">
            <Guide mood="happy" pip>{lang === 'en' ? 'Hi Ameliia! ' : 'Привет, Амелия! '}{tr(greeting, lang)}</Guide>
            {(() => { const days = Math.round((Date.parse(g.testDate) - Date.parse(today())) / 86_400_000); return days >= 0 ? <div className="text-center font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl py-2" data-testid="countdown">📅 {t.testIn(days)}</div> : null; })()}
            <button data-testid="play" onClick={onPlay} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl p-5 md:p-6 shadow-2xl shadow-indigo-500/30 active:scale-[0.98] transition-all text-left flex items-center gap-4">
                <span className="text-5xl">🚀</span>
                <span><span className="block text-3xl font-black">{t.play}</span><span className="block font-bold opacity-80">{t.playSub}</span></span>
            </button>
            <div className="grid grid-cols-2 gap-3">
                <button data-testid="test" onClick={onTest} className={`${card} !p-4 text-left active:scale-[0.98]`}><div className="text-3xl">📝</div><div className="font-black text-lg">{t.test}</div><div className="text-xs font-bold text-slate-400">{t.testSub}</div></button>
                <button data-testid="story" onClick={onStory} className={`${card} !p-4 text-left active:scale-[0.98]`}><div className="text-3xl">📖</div><div className="font-black text-lg">{t.story}</div><div className="text-xs font-bold text-slate-400">{chaptersOpen} / {CHAPTERS.length}</div></button>
                <button data-testid="gallery" onClick={onGallery} className={`${card} !p-4 text-left active:scale-[0.98]`}><div className="text-3xl">🎨</div><div className="font-black text-lg">{t.gallery}</div><div className="text-xs font-bold text-slate-400">{g.painting.done.length} ✓</div></button>
                <button data-testid="progress" onClick={onStats} className={`${card} !p-4 text-left active:scale-[0.98]`}><div className="text-3xl">📊</div><div className="font-black text-lg">{t.progress}</div><div className="text-xs font-bold text-slate-400">{mins} / {goal} {t.minutes}</div></button>
            </div>
            <div className={`${card} !p-4`}>
                <div className="flex justify-between font-black mb-2"><span>🎯 {t.goal}</span><span>{mins} / {goal} {t.minutes}</span></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.min(100, (mins / goal) * 100)}%` }} /></div>
            </div>
            <div className={`${card} !p-4`}>
                <div className="flex justify-between items-center font-black mb-2"><span>🎨 {t.painting}</span><span className="text-sm text-slate-400">{Math.floor(g.painting.filled / STARS_PER_PART)} / {p.regions.length}</span></div>
                <PaintingView painting={p} filled={Math.floor(g.painting.filled / STARS_PER_PART)} />
                <p className="text-xs font-bold text-slate-400 mt-2">{t.paintingHelp}</p>
            </div>
        </div>
    );
};

const PlayView: React.FC<{ problem: Problem; attempt: Attempt; lang: Lang; t: UIText; onSubmit: (g: Given) => void; onHint: () => void; onLearnFirst: () => void; onLearn: () => void; onNext: () => void }> = ({ problem, attempt, lang, t, onSubmit, onHint, onLearnFirst, onLearn, onNext }) => {
    const res = attempt.result;
    return (
        <div className={`${card} space-y-4 ${res && !res.ok ? 'animate-shake' : 'animate-slide-up'}`} data-testid="play-card" data-skill={problem.skill} data-selftest-answer={SELFTEST ? JSON.stringify(problem.answer) : undefined}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-wider uppercase">
                <span className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">{TOPIC_ICON[problem.topic]} {tr(TOPIC_NAME[problem.topic], lang)}</span>
                <span className="text-slate-400 normal-case italic">{tr(SKILL_NAME[problem.skill], lang)}</span>
            </div>
            <p className="text-lg md:text-2xl text-slate-800 dark:text-slate-100 font-bold leading-relaxed whitespace-pre-line" data-testid="prompt">{tr(problem.prompt, lang)}</p>
            {!res && (<>
                {attempt.hint ? <Guide mood="think" testId="hint-text">{tr(problem.hint, lang)}</Guide> : null}
                <AnswerInput problem={problem} lang={lang} t={t} onSubmit={onSubmit} />
                <div className="grid grid-cols-2 gap-2">
                    <button data-testid="hint" disabled={attempt.hint} onClick={onHint} className={`${secondary} py-3 disabled:opacity-40`}>💡 {t.hint}</button>
                    <button data-testid="learn-first" onClick={onLearnFirst} className={`${secondary} py-3`}>📖 {t.learnFirst}</button>
                </div>
            </>)}
            {res && res.ok && (
                <div className="space-y-3 animate-slide-up" data-testid="result" data-ok="true">
                    <div className="p-4 rounded-2xl border-[3px] bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-500 animate-correct-flash">
                        <div className="flex items-center gap-3"><Lina mood="cheer" size={56} /><div><div className="font-black text-xl">✅ {t.correct} +{res.stars} ⭐</div><div className="font-bold">{tr(res.praise, lang)}</div></div></div>
                    </div>
                    <details className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4">
                        <summary className="font-black cursor-pointer">🪜 {t.howSolve}</summary>
                        <div className="mt-2"><Steps steps={problem.steps} lang={lang} /><VisualView visual={problem.visual} lang={lang} stepByStep={false} /></div>
                    </details>
                    <button data-testid="next" onClick={onNext} className={`${primary} w-full py-4 text-xl`}>{t.next} ▶</button>
                </div>
            )}
            {res && !res.ok && (
                <div className="space-y-3 animate-slide-up" data-testid="result" data-ok="false">
                    <div className="text-center font-black text-rose-600 dark:text-rose-400" data-testid="your-answer">{t.youAnswered}: {res.given}</div>
                    <Guide mood="care" pip>{tr(res.praise, lang)}</Guide>
                    <button data-testid="learn" onClick={onLearn} className={`${primary} w-full py-4 text-xl`}>📖 {t.learn}</button>
                </div>
            )}
        </div>
    );
};

const TestView: React.FC<{ run: TestRun; lang: Lang; t: UIText; onAnswer: (g: Given) => void }> = ({ run, lang, t, onAnswer }) => {
    const p = run.problems[run.idx];
    return (
        <div className={`${card} space-y-4 animate-slide-up`} data-testid="test-card" data-selftest-answer={SELFTEST ? JSON.stringify(p.answer) : undefined}>
            {run.idx === 0 && <Guide mood="happy">{t.testIntro}</Guide>}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400">📝 {t.test}</h2>
                <span className="text-sm font-black text-slate-400" data-testid="test-progress">{t.taskOf} {run.idx + 1} {t.of} {run.problems.length}</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${(run.idx / run.problems.length) * 100}%` }} /></div>
            <p className="text-lg md:text-2xl font-bold leading-relaxed whitespace-pre-line" data-testid="prompt">{tr(p.prompt, lang)}</p>
            <AnswerInput problem={p} lang={lang} t={t} onSubmit={onAnswer} />
        </div>
    );
};

const givenText = (p: Problem, g: Given, lang: Lang) => p.answer.kind === 'choice' ? (g.choice !== undefined ? tr(p.answer.options[g.choice], lang) : '-')
    : p.answer.kind === 'remainder' ? `${g.q ?? '-'} R ${g.r ?? '-'}` : fmt(g.value ?? 0, lang);

const TestResult: React.FC<{ run: TestRun; lang: Lang; t: UIText; onPractice: () => void; onHome: () => void }> = ({ run, lang, t, onPractice, onHome }) => {
    const results = run.results ?? [];
    const score = results.filter(Boolean).length;
    const sec = Math.round((Date.now() - run.start) / 1000);
    return (
        <div className="space-y-4 animate-slide-up" data-testid="test-result" data-score={score}>
            <div className={`${card} text-center space-y-2`}>
                <Lina mood={score === results.length ? 'cheer' : 'happy'} size={100} className="mx-auto" />
                <h2 className="text-2xl font-black">{score === results.length ? `🏆 ${t.perfect}` : t.result}</h2>
                <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{score} / {results.length}</div>
                <div className="font-black text-slate-500">+{score} ⭐ {t.earned} · {t.time}: {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</div>
                <p className="font-bold text-rose-500">{tr(LOVE[score % LOVE.length], lang)}</p>
            </div>
            {run.problems.map((p, i) => (
                <details key={i} className={`${card} !p-4`} open={!results[i]}>
                    <summary className="font-black cursor-pointer">{results[i] ? '✅' : '❌'} {i + 1}. {tr(SKILL_NAME[p.skill], lang)}</summary>
                    <p className="mt-2 font-bold whitespace-pre-line">{tr(p.prompt, lang)}</p>
                    {!results[i] && <p className="mt-1 text-rose-600 dark:text-rose-400 font-black">{t.yourAnswer}: {givenText(p, run.given[i], lang)}</p>}
                    <div className="mt-2 text-emerald-700 dark:text-emerald-300 font-black">{tr(answerLine(p), lang)}</div>
                    {!results[i] && <div className="mt-2"><Steps steps={p.steps} lang={lang} /><VisualView visual={p.visual} lang={lang} stepByStep={false} /></div>}
                </details>
            ))}
            <div className="grid grid-cols-2 gap-3">
                <button data-testid="practice-mistakes" onClick={onPractice} className={`${primary} py-4`}>{t.practiceMistakes}</button>
                <button onClick={onHome} className={`${secondary} py-4`}>{t.home}</button>
            </div>
        </div>
    );
};

const StatsView: React.FC<{ g: GameState; t: UIText; lang: Lang }> = ({ g, t, lang }) => {
    const total = totalTime(g) || 1;
    const week = Object.entries(g.daily).sort().slice(-7);
    return (
        <div className="space-y-4 animate-slide-up" data-testid="stats">
            <div className={card}>
                <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-3">⏱ {t.balance}</h2>
                {(['division', 'science', 'estimation'] as Topic[]).map(tp => {
                    const share = g.time[tp] / total;
                    return (
                        <div key={tp} className="mb-3">
                            <div className="flex justify-between font-bold text-sm"><span>{TOPIC_ICON[tp]} {tr(TOPIC_NAME[tp], lang)}</span><span>{Math.round(g.time[tp] / 60)} {t.minutes} · {Math.round(share * 100)}% ({t.target} {TOPIC_TARGET[tp] * 100}%)</span></div>
                            <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-indigo-500" style={{ width: `${share * 100}%` }} />
                                <div className="absolute top-0 h-full w-0.5 bg-rose-500" style={{ left: `${TOPIC_TARGET[tp] * 100}%` }} />
                            </div>
                        </div>
                    );
                })}
                <div className="flex gap-2 items-end h-24 mt-4">
                    {week.map(([d, s]) => <div key={d} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-emerald-400 rounded-t-lg" style={{ height: `${Math.min(80, s / 30)}px` }} /><span className="text-[10px] font-bold text-slate-400">{d.slice(5)}</span></div>)}
                </div>
            </div>
            <div className={`${card} overflow-x-auto`}>
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-400 text-xs uppercase"><th className="py-1">{t.skill}</th><th className="px-1">{t.solved}</th><th className="px-1">✓</th><th className="hidden sm:table-cell px-1">{t.reads}</th><th className="hidden sm:table-cell px-1">{t.quizzes}</th></tr></thead>
                    <tbody>
                        {ALL_SKILLS.map(s => {
                            const st = g.skills[s];
                            const acc = st.seen ? Math.round((st.correct / st.seen) * 100) : null;
                            return <tr key={s} className="border-t border-slate-100 dark:border-slate-700"><td className="py-1.5 font-bold break-words pr-1">{TOPIC_ICON[TOPIC_OF[s]]} {tr(SKILL_NAME[s], lang)}</td><td className="px-1">{st.correct}/{st.seen}</td><td className={acc === null ? '' : acc >= 80 ? 'text-emerald-600 font-black' : acc >= 60 ? 'text-amber-600 font-black' : 'text-rose-600 font-black'}>{acc === null ? '-' : `${acc}%`}</td><td className="hidden sm:table-cell px-1">{st.theoryReads}</td><td className="hidden sm:table-cell px-1">{st.quizPasses}</td></tr>;
                        })}
                    </tbody>
                </table>
            </div>
            <div className={card}>
                <h2 className="text-xl font-black mb-2">📝 {t.tests}</h2>
                {g.tests.length === 0 ? <p className="text-slate-400 font-bold">{t.noTests}</p> : g.tests.slice().reverse().map((x, i) => (
                    <div key={i} className="flex justify-between font-bold border-t border-slate-100 dark:border-slate-700 py-1.5"><span>{new Date(x.t).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU')}</span><span>{x.score}/{x.total} · {grade(x.score, x.total)}</span></div>
                ))}
            </div>
        </div>
    );
};

const StoryView: React.FC<{ open: number; chapter: number | null; setChapter: (i: number | null) => void; lang: Lang; t: UIText; stars: number }> = ({ open, chapter, setChapter, lang, t }) => {
    if (chapter !== null) {
        const c = CHAPTERS[chapter];
        return (
            <div className={`${card} space-y-4 animate-slide-up`} data-testid="chapter">
                <div className="text-xs font-black uppercase tracking-wider text-amber-500">{t.chapter} {chapter + 1}</div>
                <h2 className="text-3xl font-black font-serif">{c.icon} {tr(c.title, lang)}</h2>
                {c.text.map((p, i) => <p key={i} className="text-lg md:text-xl leading-relaxed font-serif text-slate-700 dark:text-slate-200">{tr(p, lang)}</p>)}
                <button onClick={() => setChapter(null)} className={`${secondary} w-full py-3`}>{t.back}</button>
            </div>
        );
    }
    return (
        <div className="space-y-3 animate-slide-up" data-testid="story-list">
            {CHAPTERS.map((c, i) => i < open ? (
                <button key={i} onClick={() => setChapter(i)} className={`${card} !p-4 text-left flex items-center gap-3 active:scale-[0.98]`}><span className="text-3xl">{c.icon}</span><span><span className="block text-xs font-black text-amber-500">{t.chapter} {i + 1}</span><span className="block font-black text-lg font-serif">{tr(c.title, lang)}</span></span></button>
            ) : (
                <div key={i} className={`${card} !p-4 flex items-center gap-3 opacity-50`}><span className="text-3xl">🔒</span><span className="font-bold">{t.chapter} {i + 1} · {t.locked} {i * STARS_PER_CHAPTER} ⭐</span></div>
            ))}
        </div>
    );
};

const GalleryView: React.FC<{ g: GameState; t: UIText; lang: Lang }> = ({ g, t, lang }) => {
    const p = PAINTINGS[g.painting.index];
    return (
        <div className="space-y-4 animate-slide-up" data-testid="gallery-view">
            <div className={card}>
                <h2 className="text-xl font-black mb-2">🎨 {tr(p.name, lang)} · {Math.floor(g.painting.filled / STARS_PER_PART)}/{p.regions.length}</h2>
                <PaintingView painting={p} filled={Math.floor(g.painting.filled / STARS_PER_PART)} />
                <p className="text-sm font-bold text-slate-400 mt-2">{t.paintingHelp}</p>
            </div>
            {g.painting.done.length > 0 && <h3 className="font-black text-lg">{t.finished}</h3>}
            <div className="grid grid-cols-2 gap-3">
                {g.painting.done.map((i, k) => <div key={k} className={`${card} !p-2`}><PaintingView painting={PAINTINGS[i]} filled={PAINTINGS[i].regions.length} /><p className="text-xs font-bold mt-1">{tr(PAINTINGS[i].name, lang)}</p></div>)}
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ g: GameState; setG: React.Dispatch<React.SetStateAction<GameState>>; t: UIText }> = ({ g, setG, t }) => {
    const opt = (active: boolean) => `p-3 rounded-2xl font-bold border text-sm transition-all ${active ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`;
    return (
        <div className={`${card} space-y-5 animate-slide-up`} data-testid="settings">
            <div><div className="text-xs font-black uppercase text-slate-400 mb-1.5">{t.language}</div><div className="grid grid-cols-2 gap-2">{(['en', 'ru'] as Lang[]).map(l => <button key={l} onClick={() => setG(s => ({ ...s, lang: l }))} className={opt(g.lang === l)}>{l === 'en' ? '🇺🇸 English' : '🇷🇺 Русский'}</button>)}</div></div>
            <div><div className="text-xs font-black uppercase text-slate-400 mb-1.5">{t.theme}</div><div className="grid grid-cols-3 gap-2">{(['light', 'dark', 'system'] as const).map(m => <button key={m} onClick={() => setG(s => ({ ...s, theme: m }))} className={opt(g.theme === m)}>{m === 'light' ? `☀️ ${t.light}` : m === 'dark' ? `🌙 ${t.dark}` : `🌓 ${t.system}`}</button>)}</div></div>
            <div><div className="text-xs font-black uppercase text-slate-400 mb-1.5">{t.sound}</div><button onClick={() => setG(s => ({ ...s, sound: !s.sound }))} className={`${opt(g.sound)} w-full`}>{g.sound ? `🔊 ${t.on}` : `🔇 ${t.off}`}</button></div>
            <div><div className="text-xs font-black uppercase text-slate-400 mb-1.5">📅 {t.testDate}</div><input type="date" value={g.testDate} onChange={e => setG(s => ({ ...s, testDate: e.target.value }))} className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-bold" /></div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4"><div className="font-black mb-1">👨‍👩‍👧‍👦 {t.parents}</div><p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{t.parentsText}</p></div>
            <button onClick={() => { if (confirm(t.resetConfirm)) setG({ ...newState(), lang: g.lang, theme: g.theme, sound: g.sound }); }} className="w-full p-3 rounded-2xl font-black bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">{t.reset}</button>
        </div>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
