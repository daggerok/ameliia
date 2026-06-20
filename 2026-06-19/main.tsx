import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AppConfig, GeneratedTaskInstance, VisualData, StudentProfile } from './types';
import { generateTask } from './mathEngine';

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
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 lg:p-10 rounded-3xl shadow-2xl w-full space-y-4 md:space-y-6 border border-slate-100 dark:border-slate-700">
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
                    <select value={config.lang} onChange={e => update('lang', e.target.value)} className="w-full p-2.5 md:p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-base md:text-lg focus:outline-none transition-all">
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-bold uppercase text-slate-400 mb-1 md:mb-2">{t.theme}</label>
                    <select value={config.theme} onChange={e => update('theme', e.target.value)} className="w-full p-2.5 md:p-3 border rounded-2xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-base md:text-lg focus:outline-none transition-all">
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
    onRetry: () => void; // Добавили коллбек для регенерации вводных
    lang: 'ru' | 'en';
}

const TaskDisplay: React.FC<TaskDisplayProps> = ({ task, onAnswer, next, onRetry, lang }) => {
    const [num, setNum] = useState('');
    const [den, setDen] = useState('');
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const [ok, setOk] = useState(false);
    const t = DICTIONARY[lang];

    useEffect(() => { setNum(''); setDen(''); setText(''); setDone(false); }, [task]);

    const check = (e: React.FormEvent) => {
        e.preventDefault(); if (done) return;
        let isOk = false;
        if (task.answerType === 'number') isOk = parseFloat(num) === task.correctAnswer;
        else if (task.answerType === 'comparison' || task.answerType === 'text') isOk = text.trim().toLowerCase() === String(task.correctAnswer).toLowerCase();
        else if (task.answerType === 'fraction') isOk = parseInt(num) === task.correctAnswer.numerator && parseInt(den) === task.correctAnswer.denominator;
        setOk(isOk); setDone(true); onAnswer(isOk);
    };

    const inputStyle = "p-3 md:p-4 text-center border-3 border-indigo-500 rounded-2xl text-xl md:text-2xl lg:text-3xl font-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-600 dark:focus:ring-indigo-400 shadow-md transition-all";

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 lg:p-10 rounded-3xl shadow-2xl w-full border border-slate-100 dark:border-slate-700">

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
                                    onClick={onRetry} // Вызываем триггер генерации новых чисел для этой же темы
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

    // Регенерация ПЛАГИНА: передаем текущий task.id как принудительный forceModuleId
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
                <header className="flex justify-between items-center py-3 md:py-5 mb-2 w-full">
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
                    <div className="grid grid-cols-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-5 text-center text-white shadow-xl mb-6 w-full text-sm md:text-base font-bold">
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
