import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

// A scratch pad for solving with a finger: grid paper, three pens, an eraser, undo and clear.
// The strokes belong to one task: the parent keeps them while the task lasts and drops them with the task.
export type Stroke = { color: string; width: number; points: [number, number][] };

const PENS = ['#1e293b', '#2563eb', '#dc2626'];
const ERASER = 'eraser';

export const Notepad: React.FC<{ strokes: Stroke[]; setStrokes: (s: Stroke[]) => void; prompt: string; onClose: () => void; labels: { done: string; clear: string; undo: string; eraser: string; title: string } }> = ({ strokes, setStrokes, prompt, onClose, labels }) => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [pen, setPen] = useState(PENS[0]);
    const drawing = useRef<Stroke | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    // points are stored in CSS pixels, the canvas is scaled for sharp lines on the iPad
    const redraw = (list: Stroke[]) => {
        const c = canvas.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        for (const s of list) {
            ctx.globalCompositeOperation = s.color === ERASER ? 'destination-out' : 'source-over';
            ctx.strokeStyle = s.color === ERASER ? '#000' : s.color;
            ctx.lineWidth = s.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            s.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            if (s.points.length === 1) ctx.lineTo(s.points[0][0] + 0.1, s.points[0][1]);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    };

    useEffect(() => {
        const fit = () => {
            const b = box.current, c = canvas.current;
            if (!b || !c) return;
            const dpr = window.devicePixelRatio || 1;
            const w = b.clientWidth, h = b.clientHeight;
            c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
            c.style.width = `${w}px`; c.style.height = `${h}px`;
            setSize({ w, h });
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, []);
    useEffect(() => { redraw(strokes); }, [strokes, size]);

    const at = (e: React.PointerEvent): [number, number] => {
        const r = canvas.current!.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    const down = (e: React.PointerEvent) => {
        e.preventDefault();
        canvas.current?.setPointerCapture(e.pointerId);
        drawing.current = { color: pen, width: pen === ERASER ? 26 : 3.5, points: [at(e)] };
        redraw([...strokes, drawing.current]);
    };
    const move = (e: React.PointerEvent) => {
        if (!drawing.current) return;
        drawing.current.points.push(at(e));
        redraw([...strokes, drawing.current]);
    };
    const up = () => {
        if (!drawing.current) return;
        setStrokes([...strokes, drawing.current]);
        drawing.current = null;
    };

    const tool = (active: boolean) => `w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-black ${active ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-600'}`;
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex flex-col p-2 md:p-4" data-testid="notepad">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl p-3 flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-black text-indigo-600 dark:text-indigo-400 mr-1">✏️ {labels.title}</span>
                {PENS.map(c => <button key={c} aria-label={c} onClick={() => setPen(c)} className={tool(pen === c)}><span className="w-6 h-6 rounded-full" style={{ background: c }} /></button>)}
                <button aria-label={labels.eraser} onClick={() => setPen(ERASER)} className={tool(pen === ERASER)}>🧽</button>
                <button data-testid="notepad-undo" onClick={() => setStrokes(strokes.slice(0, -1))} disabled={!strokes.length} className={`${tool(false)} disabled:opacity-30`} aria-label={labels.undo}>↩️</button>
                <button data-testid="notepad-clear" onClick={() => setStrokes([])} disabled={!strokes.length} className={`${tool(false)} disabled:opacity-30`} aria-label={labels.clear}>🗑️</button>
                <button data-testid="notepad-close" onClick={onClose} className="ml-auto px-5 h-11 rounded-xl bg-indigo-600 text-white font-black active:scale-95">{labels.done} ✓</button>
            </div>
            <div className="bg-amber-50 dark:bg-slate-900 px-4 py-2 text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 whitespace-pre-line max-h-28 overflow-y-auto border-b border-amber-200 dark:border-slate-700">{prompt}</div>
            <div ref={box} className="relative flex-1 bg-white rounded-b-3xl overflow-hidden" style={{ backgroundImage: 'linear-gradient(#e0e7ff 1px, transparent 1px), linear-gradient(90deg, #e0e7ff 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
                <canvas ref={canvas} data-testid="notepad-canvas" data-strokes={strokes.length} className="absolute inset-0 touch-none" style={{ touchAction: 'none' }}
                    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
            </div>
        </div>
    );
};
