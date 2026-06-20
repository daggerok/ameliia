import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AppConfig, GeneratedTaskInstance, VisualData } from './types';
import { generateTask } from './mathEngine';

const DEFAULT_CONFIG: AppConfig = {
    studentName: 'Ameliia',
    lang: 'en',
    theme: 'system',
    avatarTheme: 'girl',
    schoolSystem: 'both',
    gradeMode: { type: 'range', grades: [1, 2] },
    order: 'shuffle'
};

const TaskVisualizer: React.FC<{ data: VisualData }> = ({ data }) => {
    if (!data || data.type === 'none' || !data.totalParts) return null;

    if (data.type === 'bar') {
        const total = data.totalParts;
        const shaded = data.shadedParts || 0;
        const width = 300;
        const height = 50;
        const itemWidth = width / total;

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto max-w-xs my-4">
                {Array.from({ length: total }).map((_, i) => (
                    <rect
                        key={i}
                        x={i * itemWidth}
                        y={4}
                        width={itemWidth - 4}
                        height={height - 8}
                        fill={i < shaded ? '#6366f1' : '#f1f5f9'}
                        stroke="#1e293b"
                        strokeWidth="2"
                        rx="4"
                    />
                ))}
            </svg>
        );
    }
    return null;
};

const SettingsMenu: React.FC<{ config: AppConfig; onConfigChange: (c: AppConfig) => void }> = ({ config, onConfigChange }) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const update = (k: keyof AppConfig, v: any) => onConfigChange({ ...config, [k]: v });

    const handleGrade = (grade: number) => {
        let list = [...config.gradeMode.grades];
        list = list.includes(grade) ? list.filter(g => g !== grade) : [...list, grade].sort();
        if (list.length === 0) list = [1];
        update('gradeMode', { type: list.length > 1 ? 'range' : 'single', grades: list });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-md mx-auto space-y-4 border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {config.lang === 'ru' ? 'Настройки' : 'Settings'}
            </h2>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Student Name</label>
                <input type="text" value={config.studentName} onChange={e => update('studentName', e.target.value)} className="w-full p-2 border rounded-xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Lang</label>
                    <select value={config.lang} onChange={e => update('lang', e.target.value)} className="w-full p-2 border rounded-xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none">
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Theme</label>
                    <select value={config.theme} onChange={e => update('theme', e.target.value)} className="w-full p-2 border rounded-xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Avatar Theme</label>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => update('avatarTheme', 'boy')} className={`p-2 rounded-xl font-bold border transition-colors ${config.avatarTheme === 'boy' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>Boy</button>
                    <button onClick={() => update('avatarTheme', 'girl')} className={`p-2 rounded-xl font-bold border transition-colors ${config.avatarTheme === 'girl' ? 'bg-pink-600 text-white border-pink-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'}`}>Girl</button>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Curriculum</label>
                <select value={config.schoolSystem} onChange={e => update('schoolSystem', e.target.value)} className="w-full p-2 border rounded-xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none">
                    <option value="US">US School (Common Core)</option>
                    <option value="USSR">СССР (Арифметика)</option>
                    <option value="both">Both / Вперемешку</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Grades</label>
                <div className="flex gap-4">
                    {[1, 2].map(g => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                            <input type="checkbox" checked={config.gradeMode.grades.includes(g)} onChange={() => handleGrade(g)} className="w-4 h-4 accent-indigo-600 rounded" />
                            <span className="text-sm font-semibold">Grade {g}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs font-bold">
                <button onClick={() => {
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'math_config.json'; a.click();
                }} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">Export</button>
                <button onClick={() => fileInput.current?.click()} className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors">Import</button>
                <input type="file" ref={fileInput} onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const r = new FileReader(); r.onload = evt => onConfigChange(JSON.parse(evt.target?.result as string)); r.readAsText(file);
                }} className="hidden" accept=".json" />
                <button onClick={() => { if(confirm('Reset?')) onConfigChange(DEFAULT_CONFIG); }} className="p-2 bg-rose-600 text-white rounded-xl col-span-2 hover:bg-rose-700 transition-colors">Reset to Defaults</button>
            </div>
        </div>
    );
};

const TaskDisplay: React.FC<{ task: GeneratedTaskInstance; onAnswer: (c: boolean) => void; next: () => void; lang: 'ru' | 'en' }> = ({ task, onAnswer, next, lang }) => {
    const [num, setNum] = useState('');
    const [den, setDen] = useState('');
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const [ok, setOk] = useState(false);

    useEffect(() => { setNum(''); setDen(''); setText(''); setDone(false); }, [task]);

    const check = (e: React.FormEvent) => {
        e.preventDefault(); if (done) return;
        let isOk = false;
        if (task.answerType === 'number') isOk = parseFloat(num) === task.correctAnswer;
        else if (task.answerType === 'comparison' || task.answerType === 'text') isOk = text.trim().toLowerCase() === String(task.correctAnswer).toLowerCase();
        else if (task.answerType === 'fraction') isOk = parseInt(num) === task.correctAnswer.numerator && parseInt(den) === task.correctAnswer.denominator;
        setOk(isOk); setDone(true); onAnswer(isOk);
    };

    // Базовые общие стили для всех типов инпутов, чтобы текст всегда контрастировал ночью
    const inputStyle = "p-2 text-center border-2 border-indigo-500 rounded-xl text-lg font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 shadow-sm";

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-md mx-auto border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-3">
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">G{task.grade} • {task.system}</span>
                <span>{task.topic.toUpperCase()}</span>
            </div>
            <p className="text-lg text-slate-800 dark:text-slate-100 mb-4">{task.question}</p>
            {task.visual && <TaskVisualizer data={task.visual} />}
            <form onSubmit={check} className="space-y-4">
                {!done ? (
                    <div className="flex justify-center items-center gap-2">
                        {task.answerType === 'fraction' ? (
                            <div className="flex items-center gap-1">
                                <input type="number" value={num} onChange={e => setNum(e.target.value)} className={`${inputStyle} w-16`} required />
                                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">/</span>
                                <input type="number" value={den} onChange={e => setDen(e.target.value)} className={`${inputStyle} w-16`} required />
                            </div>
                        ) : task.answerType === 'comparison' ? (
                            <input type="text" maxLength={1} value={text} onChange={e => setText(e.target.value)} className={`${inputStyle} w-20`} placeholder="< >" required />
                        ) : (
                            <input type="number" value={num} onChange={e => setNum(e.target.value)} className={`${inputStyle} w-28`} placeholder="?" required />
                        )}
                        <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow">
                            {lang === 'ru' ? 'Проверить' : 'Check'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className={`p-4 rounded-xl border-2 ${ok ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-950/30 dark:text-green-300' : 'bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-950/30 dark:text-rose-300'}`}>
                            <div className="font-bold text-md">{ok ? '🎉 ' + (lang === 'ru' ? 'Правильно!' : 'Correct!') : '💡 ' + (lang === 'ru' ? 'Объяснение:' : 'Explanation:')}</div>
                            <p className="text-sm mt-1 whitespace-pre-line opacity-90">{task.explanation}</p>
                        </div>
                        <button type="button" onClick={next} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            {lang === 'ru' ? 'Следующее задание →' : 'Next Task →'}
                        </button>
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

    useEffect(() => {
        localStorage.setItem('math_core_config', JSON.stringify(config));
        const el = document.documentElement;
        const dark = config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) el.classList.add('dark'); else el.classList.remove('dark');
    }, [config]);

    useEffect(() => { localStorage.setItem('math_core_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { handleNext(); }, [config.gradeMode.grades, config.schoolSystem, config.lang]);

    const handleNext = () => setTask(generateTask(config.gradeMode.grades, config.schoolSystem, config.lang));
    const handleResult = (ok: boolean) => setStats((p: any) => ({ correct: p.correct + (ok ? 1 : 0), total: p.total + 1, streak: ok ? p.streak + 1 : 0 }));

    return (
        <div className="min-h-screen p-4 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
            <header className="max-w-md mx-auto flex justify-between items-center py-4 mb-2">
                <div>
                    <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider">MATHCORE</h1>
                    <p className="text-xs text-slate-400 font-semibold">{config.studentName}'s Workspace {config.avatarTheme === 'girl' ? '👧' : '👦'}</p>
                </div>
                <button onClick={() => setOpenMenu(!openMenu)} className="px-3 py-1.5 bg-white dark:bg-slate-800 shadow rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    {openMenu ? (config.lang === 'ru' ? '✏️ Задачи' : '✏️ Practice') : (config.lang === 'ru' ? '⚙️ Меню' : '⚙️ Menu')}
                </button>
            </header>
            {!openMenu && (
                <div className="max-w-md mx-auto grid grid-cols-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 text-center text-white shadow-md mb-4 text-xs font-bold">
                    <div><div className="text-base font-black">{stats.correct}</div><div className="opacity-75">{config.lang === 'ru' ? 'Верно' : 'Correct'}</div></div>
                    <div><div className="text-base font-black">{stats.total}</div><div className="opacity-75">{config.lang === 'ru' ? 'Всего' : 'Total'}</div></div>
                    <div><div className="text-base font-black">🔥 {stats.streak}</div><div className="opacity-75">{config.lang === 'ru' ? 'Серия' : 'Streak'}</div></div>
                </div>
            )}
            <main>
                {openMenu ? <SettingsMenu config={config} onConfigChange={setConfig} /> : task && <TaskDisplay task={task} onAnswer={handleResult} next={handleNext} lang={config.lang} />}
            </main>
        </div>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<App />);
