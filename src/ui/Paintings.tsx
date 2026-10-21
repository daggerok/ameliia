import * as React from 'react';
import { type L10n, L } from '../engine/core';

// Every star paints one more part of the picture. A finished picture goes to the gallery.
type Region = { el: (fill: string, stroke: string) => React.ReactNode; color: string };
export type Painting = { name: L10n; regions: Region[] };

const rect = (x: number, y: number, w: number, h: number, rx = 0) => (f: string, s: string) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={f} stroke={s} strokeWidth="1" />;
const circle = (cx: number, cy: number, r: number) => (f: string, s: string) => <circle cx={cx} cy={cy} r={r} fill={f} stroke={s} strokeWidth="1" />;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => (f: string, s: string) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={f} stroke={s} strokeWidth="1" />;
const path = (d: string) => (f: string, s: string) => <path d={d} fill={f} stroke={s} strokeWidth="1" />;
const R = (el: Region['el'], color: string): Region => ({ el, color });

export const PAINTINGS: Painting[] = [
    {
        name: L('Sunset over the George Washington Bridge', 'Закат над мостом Джорджа Вашингтона'),
        regions: [
            R(rect(0, 0, 200, 92), '#fdba74'), R(circle(152, 46, 16), '#fde047'), R(ellipse(50, 24, 20, 7), '#fff7ed'), R(ellipse(110, 16, 16, 5), '#ffedd5'),
            R(path('M0 92 Q40 66 80 86 Q120 64 160 84 Q185 74 200 82 L200 92 Z'), '#a78bfa'), R(rect(0, 92, 200, 24), '#60a5fa'),
            R(rect(38, 36, 9, 56), '#94a3b8'), R(rect(150, 36, 9, 56), '#94a3b8'), R(rect(0, 76, 200, 5), '#475569'),
            R(path('M0 50 Q42 74 47 36 Q100 92 150 36 Q156 74 200 50 L200 53 Q156 78 150 40 Q100 96 47 40 Q42 78 0 53 Z'), '#e2e8f0'),
            R(rect(0, 116, 200, 24), '#86efac'), R(rect(16, 96, 30, 22), '#fca5a5'), R(path('M12 97 L31 82 L50 97 Z'), '#b91c1c'),
            R(rect(21, 101, 8, 7), '#fef9c3'), R(rect(34, 104, 7, 14), '#92400e'), R(rect(171, 100, 5, 18), '#78350f'),
            R(circle(173.5, 94, 11), '#22c55e'), R(circle(80, 126, 4), '#f472b6'), R(circle(96, 128, 4), '#facc15'), R(circle(112, 125, 4), '#c084fc'),
        ],
    },
    {
        name: L('A sunny beach in Florida', 'Солнечный пляж во Флориде'),
        regions: [
            R(rect(0, 0, 200, 80), '#7dd3fc'), R(circle(34, 28, 15), '#fde047'), R(ellipse(120, 22, 22, 7), '#f0f9ff'),
            R(rect(0, 80, 200, 26), '#0ea5e9'), R(path('M0 86 Q12 80 24 86 Q36 92 48 86 Q60 80 72 86 L72 90 Q60 84 48 90 Q36 96 24 90 Q12 84 0 90 Z'), '#e0f2fe'),
            R(path('M110 96 Q122 90 134 96 Q146 102 158 96 L158 100 Q146 106 134 100 Q122 94 110 100 Z'), '#e0f2fe'),
            R(path('M0 104 Q60 96 120 102 Q170 98 200 104 L200 140 L0 140 Z'), '#fde68a'),
            R(path('M150 140 Q146 110 156 72 L161 73 Q153 110 158 140 Z'), '#a16207'),
            R(path('M157 72 Q136 60 120 72 Q138 64 157 76 Z'), '#16a34a'), R(path('M158 72 Q178 58 194 70 Q176 64 159 76 Z'), '#22c55e'), R(path('M157 71 Q160 50 176 46 Q164 56 160 74 Z'), '#15803d'),
            R(path('M58 98 Q78 78 98 98 Z'), '#f43f5e'), R(rect(77, 98, 2, 26), '#64748b'), R(circle(112, 124, 6), '#f97316'),
            R(path('M36 128 Q42 118 48 128 Z'), '#fb7185'), R(path('M126 112 L132 130 L138 112 Z'), '#d97706'), R(circle(132, 109, 6), '#a16207'),
            R(path('M70 64 L94 64 L90 70 L74 70 Z'), '#f8fafc'), R(path('M82 42 L82 63 L94 63 Z'), '#fbbf24'),
        ],
    },
    {
        name: L('Visiting Grandma Olga and Grandpa Valeriy in Italy', 'В гостях у бабушки Оли и дедушки Валерия в Италии'),
        regions: [
            R(rect(0, 0, 200, 86), '#bae6fd'), R(circle(168, 26, 14), '#fde047'), R(ellipse(60, 20, 18, 6), '#f8fafc'),
            R(path('M0 86 Q50 50 100 80 Q150 52 200 78 L200 100 L0 100 Z'), '#86efac'), R(path('M0 100 Q60 84 120 98 Q170 90 200 100 L200 140 L0 140 Z'), '#4ade80'),
            R(ellipse(30, 74, 5, 18), '#166534'), R(ellipse(44, 78, 4, 14), '#14532d'),
            R(rect(70, 70, 56, 40), '#fed7aa'), R(path('M64 72 L98 52 L132 72 Z'), '#c2410c'), R(rect(78, 78, 10, 10), '#e0f2fe'), R(rect(108, 78, 10, 10), '#e0f2fe'), R(rect(93, 90, 11, 20), '#7c2d12'),
            R(path('M98 110 L104 110 L130 140 L70 140 Z'), '#e7e5e4'),
            R(path('M150 102 L153 46 L167 47 L166 103 Z'), '#f5f5f4'), R(path('M149 72 L168 73 L168 77 L149 76 Z'), '#a8a29e'),
            R(circle(40, 120, 4), '#ef4444'), R(circle(52, 124, 4), '#facc15'), R(circle(146, 122, 4), '#f472b6'),
        ],
    },
    {
        name: L('Pip the capybara in a warm pond', 'Капибара Пип в тёплом пруду'),
        regions: [
            R(rect(0, 0, 200, 80), '#bae6fd'), R(circle(170, 22, 13), '#fde047'), R(ellipse(52, 20, 18, 6), '#f8fafc'),
            R(ellipse(22, 74, 26, 20), '#4ade80'), R(ellipse(182, 72, 26, 22), '#22c55e'), R(rect(0, 80, 200, 60), '#86efac'),
            R(ellipse(100, 104, 78, 26), '#38bdf8'), R(ellipse(100, 98, 56, 14), '#7dd3fc'),
            R(ellipse(98, 98, 30, 14), '#a8743f'), R(rect(108, 74, 30, 24, 12), '#c08a58'), R(circle(113, 76, 4), '#8b5e34'),
            R(circle(126, 84, 2.5), '#1f2937'), R(ellipse(132, 90, 6, 4), '#a06a3c'), R(circle(122, 68, 6), '#fb923c'),
            R(circle(64, 108, 6), '#fb923c'), R(circle(146, 112, 5), '#fdba74'), R(ellipse(40, 112, 10, 4), '#16a34a'),
            R(circle(26, 128, 4), '#f472b6'), R(circle(176, 126, 4), '#facc15'), R(circle(160, 132, 4), '#c084fc'),
        ],
    },
    {
        name: L('The ice cream cafe', 'Кафе-мороженое'),
        regions: [
            R(rect(0, 0, 200, 140), '#e0f2fe'), R(rect(20, 30, 160, 96), '#fde68a'),
            R(path('M14 30 L38 30 L34 48 L18 48 Z'), '#ef4444'), R(path('M38 30 L62 30 L58 48 L42 48 Z'), '#fef2f2'), R(path('M62 30 L86 30 L82 48 L66 48 Z'), '#ef4444'),
            R(path('M86 30 L110 30 L106 48 L90 48 Z'), '#fef2f2'), R(path('M110 30 L134 30 L130 48 L114 48 Z'), '#ef4444'), R(path('M134 30 L158 30 L154 48 L138 48 Z'), '#fef2f2'),
            R(path('M158 30 L186 30 L182 48 L162 48 Z'), '#ef4444'), R(rect(70, 8, 60, 18, 6), '#f472b6'), R(rect(32, 58, 54, 36, 4), '#bfdbfe'),
            R(rect(130, 66, 34, 60), '#92400e'), R(path('M90 126 L100 92 L110 126 Z'), '#d97706'), R(circle(100, 86, 9), '#f9a8d4'),
            R(circle(100, 72, 8), '#7c2d12'), R(circle(100, 60, 7), '#86efac'), R(circle(100, 51, 3), '#dc2626'),
            R(rect(40, 104, 26, 12, 2), '#78350f'), R(circle(150, 98, 2.5), '#facc15'),
        ],
    },
    {
        name: L('Piano and flute concert', 'Концерт: пианино и флейта'),
        regions: [
            R(rect(0, 0, 200, 110), '#312e81'), R(path('M0 0 L44 0 Q30 60 44 110 L0 110 Z'), '#be123c'), R(path('M200 0 L156 0 Q170 60 156 110 L200 110 Z'), '#be123c'),
            R(path('M80 0 L120 0 L150 110 L50 110 Z'), '#fef08a'), R(rect(0, 110, 200, 30), '#a16207'),
            R(rect(56, 62, 70, 30, 4), '#111827'), R(rect(60, 84, 62, 8), '#f8fafc'), R(rect(66, 84, 3, 5), '#111827'), R(rect(76, 84, 3, 5), '#111827'), R(rect(92, 84, 3, 5), '#111827'),
            R(rect(62, 92, 5, 20), '#1f2937'), R(rect(114, 92, 5, 20), '#1f2937'), R(rect(134, 70, 40, 4, 2), '#cbd5e1'),
            R(circle(40, 36, 5), '#f9a8d4'), R(rect(44, 18, 2, 18), '#f9a8d4'), R(circle(160, 40, 5), '#a5f3fc'), R(rect(164, 22, 2, 18), '#a5f3fc'),
            R(path('M100 14 L104 24 L114 24 L106 30 L109 40 L100 34 L91 40 L94 30 L86 24 L96 24 Z'), '#fde047'),
        ],
    },
];

export const PaintingView: React.FC<{ painting: Painting; filled: number; className?: string }> = ({ painting, filled, className = '' }) => (
    <svg viewBox="0 0 200 140" className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white ${className}`} role="img" aria-label={painting.name.en}>
        {painting.regions.map((r, i) => (
            <g key={i} className={i === filled - 1 ? 'animate-pop' : ''} style={{ transformOrigin: 'center' }}>
                {r.el(i < filled ? r.color : '#ffffff', i < filled ? 'rgba(0,0,0,0.15)' : '#cbd5e1')}
            </g>
        ))}
    </svg>
);
