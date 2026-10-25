/// <reference lib="esnext" />
import * as React from 'react';
import { useState } from 'react';
import { type Lang, type Leg, type Unit, type Visual, fmt } from '../engine/core';
import { longDivision } from '../engine/division';

type Cell = { ch: string; top?: boolean; bottom?: boolean; hl?: boolean; q?: boolean };

// US long division layout: quotient on top, divisor ) dividend, then product / subtraction rows per step
export const LongDivisionBoard: React.FC<{ dividend: number; divisor: number; lang: Lang; stepByStep?: boolean }> = ({ dividend, divisor, lang, stepByStep = true }) => {
    const { steps, remainder } = longDivision(dividend, divisor);
    const [shown, setShown] = useState(stepByStep ? 1 : steps.length);
    const digits = String(dividend);
    const off = String(divisor).length + 1;
    const cols = off + digits.length + 1;
    const blank = (): Cell[] => Array.from({ length: cols }, () => ({ ch: '' }));
    const put = (row: Cell[], text: string, endCol: number, extra: Partial<Cell> = {}) => {
        for (let i = 0; i < text.length; i++) {
            const c = endCol - (text.length - 1 - i);
            if (c >= 0 && c < cols) row[c] = { ...row[c], ch: text[i], ...extra };
        }
    };
    const quotient = blank();
    steps.slice(0, shown).forEach(s => { quotient[off + s.column] = { ch: String(s.digit), q: true }; });
    const head = blank();
    put(head, String(divisor), off - 2);
    head[off - 1] = { ch: ')' };
    for (let i = 0; i < digits.length; i++) head[off + i] = { ch: digits[i], top: true };
    const rows: Cell[][] = [quotient, head];
    steps.slice(0, shown).forEach((s, k) => {
        const end = off + s.column;
        const prod = blank();
        put(prod, String(s.product), end, { bottom: true });
        const start = end - String(s.product).length;
        if (start >= 0) prod[start] = { ch: '−' };
        // stretch the line under the number we subtract from
        for (let i = end - String(s.part).length + 1; i <= end; i++) if (i >= 0) prod[i] = { ...prod[i], bottom: true };
        rows.push(prod);
        const rest = blank();
        if (s.broughtDown !== undefined && k < shown) {
            put(rest, String(s.rest), end);
            if (k + 1 < shown || shown === steps.length) rest[end + 1] = { ch: String(s.broughtDown), hl: true };
            else rest[end + 1] = { ch: String(s.broughtDown), hl: true };
        } else {
            put(rest, String(s.rest), end, { hl: true });
        }
        rows.push(rest);
    });
    const done = shown >= steps.length;
    return (
        <div className="my-3" data-testid="longdiv">
            <div className="inline-block bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-mono text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 overflow-x-auto max-w-full">
                {rows.map((row, r) => (
                    <div key={r} className="flex leading-tight">
                        {row.map((c, i) => (
                            <span key={i} className={`w-[1.3ch] text-center ${c.top ? 'border-t-[3px] border-slate-700 dark:border-slate-200' : ''} ${c.bottom ? 'border-b-[3px] border-slate-500' : ''} ${c.q ? 'text-indigo-600 dark:text-indigo-400' : ''} ${c.hl ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{c.ch || ' '}</span>
                        ))}
                    </div>
                ))}
                {done && remainder > 0 && <div className="text-base font-bold text-rose-500 mt-1">R {remainder}</div>}
            </div>
            {stepByStep && steps.length > 1 && (
                <div className="flex gap-2 mt-2">
                    <button type="button" disabled={done} onClick={() => setShown(s => Math.min(steps.length, s + 1))} className="px-3 py-2 rounded-xl text-sm font-black bg-indigo-600 text-white disabled:opacity-40 active:scale-95">{lang === 'en' ? 'Next step ▶' : 'Следующий шаг ▶'}</button>
                    <button type="button" disabled={done} onClick={() => setShown(steps.length)} className="px-3 py-2 rounded-xl text-sm font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 active:scale-95">{lang === 'en' ? 'Show all' : 'Показать всё'}</button>
                </div>
            )}
        </div>
    );
};

const PASTEL = ['bg-rose-100 dark:bg-rose-900/40', 'bg-amber-100 dark:bg-amber-900/40', 'bg-emerald-100 dark:bg-emerald-900/40', 'bg-sky-100 dark:bg-sky-900/40', 'bg-violet-100 dark:bg-violet-900/40', 'bg-pink-100 dark:bg-pink-900/40', 'bg-lime-100 dark:bg-lime-900/40', 'bg-cyan-100 dark:bg-cyan-900/40'];

const splitPlaces = (x: number) => String(x).split('').map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i)).filter(v => v > 0);

export const AreaModel: React.FC<{ a: number; b: number; lang: Lang }> = ({ a, b, lang }) => {
    const pa = splitPlaces(a), pb = b < 10 ? [b] : splitPlaces(b);
    const total = a * b;
    let k = 0;
    return (
        <div className="my-3 overflow-x-auto" data-testid="area">
            <table className="border-separate border-spacing-1 text-center font-black text-slate-800 dark:text-slate-100">
                <thead><tr><th className="text-xs text-slate-400 px-1">×</th>{pa.map(x => <th key={x} className="px-2 text-indigo-600 dark:text-indigo-400">{fmt(x, lang)}</th>)}</tr></thead>
                <tbody>
                    {pb.map(y => (
                        <tr key={y}>
                            <th className="px-2 text-indigo-600 dark:text-indigo-400">{y}</th>
                            {pa.map(x => <td key={x} className={`${PASTEL[k++ % PASTEL.length]} rounded-xl px-3 py-3 text-lg`}>{fmt(x * y, lang)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-1 font-bold text-slate-600 dark:text-slate-300">{pb.flatMap(y => pa.map(x => fmt(x * y, lang))).join(' + ')} = <span className="text-emerald-600 dark:text-emerald-400">{fmt(total, lang)}</span></div>
        </div>
    );
};

export const NumberLine: React.FC<{ value: number; low: number; high: number; lang: Lang }> = ({ value, low, high, lang }) => {
    const x = (v: number) => 34 + ((v - low) / (high - low)) * 232;
    const mid = (low + high) / 2;
    const rounded = value - low >= high - value ? high : low;
    return (
        <svg viewBox="0 0 300 86" className="w-full max-w-md my-2" data-testid="numberline">
            <line x1="34" y1="44" x2="266" y2="44" stroke="currentColor" strokeWidth="3" className="text-slate-400" />
            {[low, mid, high].map(v => <line key={v} x1={x(v)} y1="36" x2={x(v)} y2="52" stroke="currentColor" strokeWidth={v === mid ? 2 : 3} className="text-slate-500" />)}
            <text x={x(low)} y="70" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[12px] font-bold">{fmt(low, lang)}</text>
            <text x={x(mid)} y="70" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">{fmt(mid, lang)}</text>
            <text x={x(high)} y="70" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[12px] font-bold">{fmt(high, lang)}</text>
            <circle cx={x(value)} cy="44" r="7" className="fill-rose-500" />
            <text x={x(value)} y="22" textAnchor="middle" className="fill-rose-600 dark:fill-rose-400 text-[13px] font-black">{fmt(value, lang)}</text>
            <path d={`M${x(value)} 30 Q${(x(value) + x(rounded)) / 2} 6 ${x(rounded)} 30`} fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
            <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#10b981" /></marker></defs>
        </svg>
    );
};

const unitShort = (unit: Unit, lang: Lang) => (unit === 'mi' ? (lang === 'en' ? 'mi' : 'миль') : (lang === 'en' ? 'km' : 'км'));
const speedShort = (unit: Unit, lang: Lang) => (unit === 'mi' ? (lang === 'en' ? 'mph' : 'миль/ч') : (lang === 'en' ? 'km/h' : 'км/ч'));

export const TripMap: React.FC<{ legs: Leg[]; unit: Unit; lang: Lang }> = ({ legs, unit, lang }) => (
    <div className="my-3 space-y-2" data-testid="trip">
        {legs.map((l, i) => (
            <div key={i} className="flex items-center gap-2 bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-2xl px-3 py-2">
                <span className="text-2xl">{l.vehicle}</span>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-400 truncate">{l.from} → {l.to}</div>
                    <div className="font-black text-slate-700 dark:text-slate-200">{fmt(l.distance, lang)} {unitShort(unit, lang)} ÷ {l.time} {lang === 'en' ? 'h' : 'ч'} = <span className="text-emerald-600 dark:text-emerald-400">{fmt(l.speed, lang)} {speedShort(unit, lang)}</span></div>
                </div>
            </div>
        ))}
        {legs.length > 1 && legs[0].from !== legs[1].from && (() => {
            const D = legs.reduce((s, l) => s + l.distance, 0), T = legs.reduce((s, l) => s + l.time, 0);
            return <div className="font-black text-indigo-700 dark:text-indigo-300 px-1">{lang === 'en' ? 'Whole trip' : 'Вся поездка'}: {fmt(D, lang)} {unitShort(unit, lang)} ÷ {T} {lang === 'en' ? 'h' : 'ч'} = {Number.isInteger(D / T) ? fmt(D / T, lang) : (D / T).toFixed(1)} {speedShort(unit, lang)}</div>;
        })()}
    </div>
);

export const Groups: React.FC<{ total: number; groups: number; icon: string }> = ({ total, groups, icon }) => {
    const each = Math.floor(total / groups), left = total % groups;
    return (
        <div className="my-3 flex flex-wrap gap-2" data-testid="groups">
            {Array.from({ length: groups }, (_, g) => (
                <div key={g} className="bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl p-2 flex flex-wrap gap-0.5 max-w-[9rem] text-lg leading-none">
                    {Array.from({ length: each }, (_, i) => <span key={i}>{icon}</span>)}
                </div>
            ))}
            {left > 0 && <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 rounded-2xl p-2 text-lg leading-none flex gap-0.5 items-center"><span className="text-xs font-black text-rose-500 mr-1">R</span>{Array.from({ length: left }, (_, i) => <span key={i}>{icon}</span>)}</div>}
        </div>
    );
};

// Bar diagram like the textbook: rows on the same scale (one box = one unit), a brace names the whole row or the part that sticks out
export const BarDiagram: React.FC<{ rows: { label: { en: string; ru: string }; boxes: number; value: string }[]; braces: { row: number; label: { en: string; ru: string }; from?: number }[]; lang: Lang }> = ({ rows, braces, lang }) => {
    const slots = Math.max(...rows.map(r => r.boxes));
    return (
        <div className="my-3 space-y-1" data-testid="bars">
            {rows.map((r, i) => (
                <div key={i}>
                    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 text-right">{r.label[lang]}</span>
                        <div className="flex">
                            {Array.from({ length: slots }, (_, k) => (
                                <div key={k} className={`flex-1 h-9 flex items-center justify-center text-xs sm:text-sm font-black ${k < r.boxes ? `border-2 -ml-[2px] first:ml-0 border-indigo-400 ${i ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-sky-100 dark:bg-sky-900/40'} text-slate-800 dark:text-slate-100` : ''}`}>{k < r.boxes ? r.value : ''}</div>
                            ))}
                        </div>
                    </div>
                    {braces.filter(b => b.row === i).map((b, j) => {
                        const from = b.from ?? 0;
                        return (
                            <div key={j} className="grid grid-cols-[5.5rem_1fr] gap-2">
                                <span />
                                <div className="relative h-8">
                                    <div className="absolute top-1 h-3 border-x-2 border-b-2 rounded-b-lg border-emerald-500" style={{ left: `${(from / slots) * 100}%`, width: `${((r.boxes - from) / slots) * 100}%` }} />
                                    <div className="absolute top-4 text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 whitespace-nowrap -translate-x-1/2" style={{ left: `${((from + r.boxes) / 2 / slots) * 100}%` }}>{b.label[lang]}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export const VisualView: React.FC<{ visual?: Visual; lang: Lang; stepByStep?: boolean }> = ({ visual, lang, stepByStep = true }) => {
    if (!visual) return null;
    if (visual.kind === 'longdiv') return <LongDivisionBoard dividend={visual.dividend} divisor={visual.divisor} lang={lang} stepByStep={stepByStep} />;
    if (visual.kind === 'area') return <AreaModel a={visual.a} b={visual.b} lang={lang} />;
    if (visual.kind === 'numberline') return <NumberLine value={visual.value} low={visual.low} high={visual.high} lang={lang} />;
    if (visual.kind === 'trip') return <TripMap legs={visual.legs} unit={visual.unit} lang={lang} />;
    if (visual.kind === 'bars') return <BarDiagram rows={visual.rows} braces={visual.braces} lang={lang} />;
    return <Groups total={visual.total} groups={visual.groups} icon={visual.icon} />;
};
