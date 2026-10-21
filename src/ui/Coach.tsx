import * as React from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Lina, Pip } from './Buddy';

// A guided tour: the screen goes dark, the block it talks about stays lit, Lina explains it next to it.
// A step without a target (or with a target that is not on the screen) is shown in the middle.
export type CoachStep = { target?: string; icon: string; title: string; body: string };

type Rect = { top: number; left: number; width: number; height: number };

export const Coach: React.FC<{ steps: CoachStep[]; testId: string; labels: { next: string; back: string; skip: string; start: string }; onDone: () => void; extra?: React.ReactNode }> = ({ steps, testId, labels, onDone, extra }) => {
    const [i, setI] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);
    const s = steps[i];
    const last = i === steps.length - 1;

    useLayoutEffect(() => {
        const el = s.target ? document.querySelector<HTMLElement>(`[data-testid="${s.target}"]`) : null;
        if (!el) { setRect(null); return; }
        el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        const measure = () => { const r = el.getBoundingClientRect(); setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 }); };
        measure();
        const t = setTimeout(measure, 120);
        return () => clearTimeout(t);
    }, [i, s.target]);
    useEffect(() => {
        const update = () => {
            const el = s.target ? document.querySelector<HTMLElement>(`[data-testid="${s.target}"]`) : null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
        };
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
    }, [s.target]);

    // the bubble goes below the lit block when there is room, otherwise above it
    const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
    const below = rect ? rect.top + rect.height + 12 : 0;
    const placeBelow = rect ? vh - below > 260 : false;
    const bubbleStyle: React.CSSProperties = rect
        ? placeBelow ? { top: below } : { bottom: vh - rect.top + 12 }
        : { top: '50%', transform: 'translateY(-50%)' };

    return (
        <div className="fixed inset-0 z-50" data-testid={testId}>
            {rect
                ? <div className="absolute rounded-3xl pointer-events-none transition-all duration-300 ring-4 ring-amber-300" style={{ ...rect, boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)' }} />
                : <div className="absolute inset-0 bg-slate-900/72" style={{ background: 'rgba(15, 23, 42, 0.72)' }} />}
            <div className="absolute left-0 right-0 px-4 flex justify-center" style={bubbleStyle}>
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-4 space-y-3 animate-bounce-in" key={i}>
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 relative"><Lina mood={last ? 'cheer' : 'happy'} size={rect ? 56 : 80} /><Pip size={rect ? 30 : 44} className="absolute -bottom-1 -right-4" /></div>
                        <div className="flex-1">
                            <div className="flex gap-1 mb-1">{steps.map((_, k) => <div key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>
                            <h2 className="text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400" data-testid={`${testId}-title`}>{s.icon} {s.title}</h2>
                        </div>
                    </div>
                    <p className="text-base md:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-200">{s.body}</p>
                    {i === 0 && extra}
                    <div className="grid grid-cols-2 gap-2">
                        {i > 0
                            ? <button onClick={() => setI(i - 1)} className="py-3 rounded-2xl font-black bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">◀ {labels.back}</button>
                            : <button data-testid={`${testId}-skip`} onClick={onDone} className="py-3 rounded-2xl font-black bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">{labels.skip}</button>}
                        {last
                            ? <button data-testid={`${testId}-start`} onClick={onDone} className="py-3 rounded-2xl font-black bg-indigo-600 text-white text-lg active:scale-95">{labels.start} 🚀</button>
                            : <button data-testid={`${testId}-next`} onClick={() => setI(i + 1)} className="py-3 rounded-2xl font-black bg-indigo-600 text-white text-lg active:scale-95">{labels.next} ▶</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};
