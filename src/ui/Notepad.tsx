/// <reference lib="esnext" />
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Coach, type CoachStep } from './Coach';

// A scratch pad for solving with a finger: grid paper, three pens, an eraser, undo and clear.
// The strokes belong to one task: the parent keeps them while the task lasts and drops them with the task.
// The page is endless: the hand tool moves it, + and − zoom around the middle, 1:1 goes back to the start.
// Points are page coordinates; the view maps them to the screen: screen = page × z + (x, y).
export type Stroke = { color: string; width: number; points: [number, number][] };
export type View = { x: number; y: number; z: number };
export const START_VIEW: View = { x: 0, y: 0, z: 1 };
// the tour of the tools, shown over the open notepad the first time
export type PadTour = { steps: CoachStep[]; labels: { next: string; back: string; skip: string; start: string }; onDone: () => void };

const PENS = ['#1e293b', '#2563eb', '#dc2626'];
const ERASER = 'eraser';
const HAND = 'hand';
const GRID = 28;
const ZMIN = 0.5, ZMAX = 3, ZSTEP = 1.25;

export const Notepad: React.FC<{ strokes: Stroke[]; setStrokes: (s: Stroke[]) => void; view: View; setView: (v: View) => void; prompt: string; onClose: () => void; closing?: boolean; tour?: PadTour; labels: { done: string; clear: string; undo: string; eraser: string; title: string; move: string; zoomIn: string; zoomOut: string; zoomReset: string } }> = ({ strokes, setStrokes, view, setView, prompt, onClose, closing, tour, labels }) => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [pen, setPen] = useState(PENS[0]);
    const drawing = useRef<Stroke | null>(null);
    const panning = useRef<{ sx: number; sy: number; x: number; y: number } | null>(null);
    // one finger at a time: a palm or a second finger on the screen must not join or break the line being drawn
    const active = useRef<number | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    // points are stored in CSS pixels, the canvas is scaled for sharp lines on the iPad
    const redraw = (list: Stroke[]) => {
        const c = canvas.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.setTransform(dpr * view.z, 0, 0, dpr * view.z, dpr * view.x, dpr * view.y);
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
    useEffect(() => { redraw(strokes); }, [strokes, size, view]);
    // every button here is type="button": the pad lives inside the answer form, and a submit button would send the answer
    // or raise "fill in all the boxes" on Done (owner, 2026-10-30)
    // Esc closes the pad like the Done button (owner, 2026-10-29)
    useEffect(() => {
        const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [onClose]);

    // no text selection or long-press menu anywhere while the notepad is open
    useEffect(() => {
        const root = document.documentElement.style as CSSStyleDeclaration & { webkitUserSelect: string; webkitTouchCallout: string };
        const before = [root.userSelect, root.webkitUserSelect, root.webkitTouchCallout];
        root.userSelect = root.webkitUserSelect = 'none';
        root.webkitTouchCallout = 'none';
        const stop = (e: Event) => e.preventDefault();
        document.addEventListener('selectstart', stop);
        window.getSelection()?.removeAllRanges();
        return () => {
            [root.userSelect, root.webkitUserSelect, root.webkitTouchCallout] = before;
            document.removeEventListener('selectstart', stop);
        };
    }, []);

    const screenAt = (e: React.PointerEvent): [number, number] => {
        const r = canvas.current!.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    const at = (e: React.PointerEvent): [number, number] => {
        const [sx, sy] = screenAt(e);
        return [(sx - view.x) / view.z, (sy - view.y) / view.z];
    };
    const down = (e: React.PointerEvent) => {
        e.preventDefault();
        if (active.current !== null) return;
        active.current = e.pointerId;
        canvas.current?.setPointerCapture(e.pointerId);
        if (pen === HAND) { const [sx, sy] = screenAt(e); panning.current = { sx, sy, x: view.x, y: view.y }; return; }
        // the line looks the same on the screen at any zoom
        drawing.current = { color: pen, width: (pen === ERASER ? 26 : 3.5) / view.z, points: [at(e)] };
        redraw([...strokes, drawing.current]);
    };
    const move = (e: React.PointerEvent) => {
        if (e.pointerId !== active.current) return;
        if (panning.current) {
            const [sx, sy] = screenAt(e), p = panning.current;
            setView({ ...view, x: p.x + sx - p.sx, y: p.y + sy - p.sy });
            return;
        }
        if (!drawing.current) return;
        drawing.current.points.push(at(e));
        redraw([...strokes, drawing.current]);
    };
    const up = (e: React.PointerEvent) => {
        if (e.pointerId !== active.current) return;
        active.current = null;
        panning.current = null;
        if (!drawing.current) return;
        setStrokes([...strokes, drawing.current]);
        drawing.current = null;
    };
    // zoom around the middle of the page, so what she looks at stays in place
    const zoom = (f: number) => {
        const z = Math.min(ZMAX, Math.max(ZMIN, view.z * f));
        const cx = size.w / 2, cy = size.h / 2;
        setView({ z, x: cx - ((cx - view.x) * z) / view.z, y: cy - ((cy - view.y) * z) / view.z });
    };

    const tool = (active: boolean) => `w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-black ${active ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-600'}`;
    return (
        <div className={`fixed inset-0 z-50 bg-slate-900/70 flex flex-col p-2 md:p-4 select-none ${closing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }} data-testid="notepad" data-closing={String(!!closing)} data-view={`${Math.round(view.x)},${Math.round(view.y)},${view.z.toFixed(2)}`}>
            <div className={`flex flex-col flex-1 min-h-0 ${closing ? 'animate-pad-out' : 'animate-pad-in'}`}>
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl p-3 flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-black text-indigo-600 dark:text-indigo-400 mr-1">✏️ {labels.title}</span>
                <span className="flex gap-2" data-testid="notepad-pens">{PENS.map(c => <button type="button" key={c} aria-label={c} onClick={() => setPen(c)} className={tool(pen === c)}><span className="w-6 h-6 rounded-full" style={{ background: c }} /></button>)}</span>
                <button type="button" data-testid="notepad-eraser" aria-label={labels.eraser} onClick={() => setPen(ERASER)} className={tool(pen === ERASER)}>🧽</button>
                <button type="button" data-testid="notepad-hand" aria-label={labels.move} title={labels.move} onClick={() => setPen(HAND)} className={tool(pen === HAND)}>✋</button>
                <span className="flex gap-2" data-testid="notepad-zooms">
                <button type="button" data-testid="notepad-zoom-out" aria-label={labels.zoomOut} onClick={() => zoom(1 / ZSTEP)} disabled={view.z <= ZMIN} className={`${tool(false)} disabled:opacity-30`}>−</button>
                <button type="button" data-testid="notepad-zoom-reset" aria-label={labels.zoomReset} onClick={() => setView(START_VIEW)} className={`${tool(false)} !w-auto px-2 text-sm`}>{Math.round(view.z * 100)}%</button>
                <button type="button" data-testid="notepad-zoom-in" aria-label={labels.zoomIn} onClick={() => zoom(ZSTEP)} disabled={view.z >= ZMAX} className={`${tool(false)} disabled:opacity-30`}>+</button>
                </span>
                <span className="flex gap-2" data-testid="notepad-edit">
                <button type="button" data-testid="notepad-undo" onClick={() => setStrokes(strokes.slice(0, -1))} disabled={!strokes.length} className={`${tool(false)} disabled:opacity-30`} aria-label={labels.undo}>↩️</button>
                <button type="button" data-testid="notepad-clear" onClick={() => setStrokes([])} disabled={!strokes.length} className={`${tool(false)} disabled:opacity-30`} aria-label={labels.clear}>🗑️</button>
                </span>
                <button type="button" data-testid="notepad-close" onClick={onClose} className="ml-auto px-5 h-11 rounded-xl bg-indigo-600 text-white font-black active:scale-95">{labels.done} ✓</button>
            </div>
            <div className="bg-amber-50 dark:bg-slate-900 px-4 py-2 text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 whitespace-pre-line max-h-28 overflow-y-auto border-b border-amber-200 dark:border-slate-700">{prompt}</div>
            <div ref={box} className="relative flex-1 bg-white rounded-b-3xl overflow-hidden" style={{ backgroundImage: 'linear-gradient(#e0e7ff 1px, transparent 1px), linear-gradient(90deg, #e0e7ff 1px, transparent 1px)', backgroundSize: `${GRID * view.z}px ${GRID * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px` }}>
                <canvas ref={canvas} data-testid="notepad-canvas" data-strokes={strokes.length} className={`absolute inset-0 touch-none ${pen === HAND ? 'cursor-grab' : 'cursor-crosshair'}`} style={{ touchAction: 'none' }}
                    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} onLostPointerCapture={up} />
            </div>
            </div>
            {tour && <Coach testId="padtour" steps={tour.steps} labels={tour.labels} onDone={tour.onDone} />}
        </div>
    );
};
