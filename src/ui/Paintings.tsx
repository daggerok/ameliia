/// <reference lib="esnext" />
import * as React from 'react';
import { type L10n, L } from '../engine/core';

// Every star paints one more part of the picture. A finished picture goes to the gallery.
type Region = { el: (fill: string, stroke: string) => React.ReactNode; color: string };
export type Painting = { name: L10n; regions: Region[] };

const rect = (x: number, y: number, w: number, h: number, rx = 0) => (f: string, s: string) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={f} stroke={s} strokeWidth="1" />;
const circle = (cx: number, cy: number, r: number) => (f: string, s: string) => <circle cx={cx} cy={cy} r={r} fill={f} stroke={s} strokeWidth="1" />;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => (f: string, s: string) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={f} stroke={s} strokeWidth="1" />;
const path = (d: string) => (f: string, s: string) => <path d={d} fill={f} stroke={s} strokeWidth="1" />;
const text = (x: number, y: number, label: string, size: number) => (f: string, s: string) => <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="900" fill={f} stroke={s} strokeWidth="0.4">{label}</text>;
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
    // the magic set: opens once she has painted each of the first six (she and Mom love Harry Potter)
    {
        name: L('A magic castle by the lake at night', 'Волшебный замок у озера ночью'),
        regions: [
            R(rect(0, 0, 200, 96), '#1e1b4b'), R(circle(166, 24, 12), '#fef9c3'), R(circle(30, 18, 2), '#fde68a'), R(circle(70, 30, 1.6), '#fde68a'), R(circle(120, 14, 2), '#fde68a'),
            R(path('M0 96 L30 64 L58 86 L96 56 L140 88 L170 66 L200 90 L200 96 Z'), '#312e81'),
            R(rect(64, 50, 76, 46), '#64748b'), R(rect(56, 34, 16, 62), '#475569'), R(rect(94, 24, 18, 72), '#475569'), R(rect(132, 38, 16, 58), '#475569'),
            R(path('M54 34 L64 14 L74 34 Z'), '#7c3aed'), R(path('M92 24 L103 2 L114 24 Z'), '#7c3aed'), R(path('M130 38 L140 18 L150 38 Z'), '#7c3aed'),
            R(rect(61, 46, 5, 7), '#fbbf24'), R(rect(100, 40, 6, 8), '#fbbf24'), R(rect(137, 52, 5, 7), '#fbbf24'), R(rect(80, 66, 6, 8), '#fbbf24'), R(rect(118, 66, 6, 8), '#fbbf24'),
            R(rect(0, 96, 200, 44), '#1e3a8a'), R(ellipse(100, 112, 46, 6), '#3b82f6'), R(path('M30 124 L60 124 L54 132 L36 132 Z'), '#92400e'), R(circle(45, 118, 3), '#fde047'),
        ],
    },
    {
        name: L('An owl brings a letter', 'Сова несёт письмо'),
        regions: [
            R(rect(0, 0, 200, 140), '#bae6fd'), R(circle(30, 26, 14), '#fde047'), R(ellipse(150, 22, 24, 8), '#f8fafc'), R(ellipse(110, 40, 16, 5), '#f8fafc'),
            R(path('M0 116 Q100 100 200 120 L200 126 Q100 108 0 122 Z'), '#78350f'), R(ellipse(26, 108, 14, 6), '#22c55e'), R(ellipse(176, 114, 14, 6), '#16a34a'),
            R(ellipse(100, 80, 30, 34), '#a16207'), R(ellipse(100, 90, 18, 22), '#fde68a'),
            R(path('M70 76 Q56 96 74 108 Z'), '#78350f'), R(path('M130 76 Q144 96 126 108 Z'), '#78350f'),
            R(circle(89, 64, 9), '#ffffff'), R(circle(111, 64, 9), '#ffffff'), R(circle(89, 64, 4), '#1f2937'), R(circle(111, 64, 4), '#1f2937'),
            R(path('M96 72 L104 72 L100 80 Z'), '#f59e0b'), R(path('M82 42 L88 54 L76 50 Z'), '#78350f'), R(path('M118 42 L112 54 L124 50 Z'), '#78350f'),
            R(rect(84, 104, 32, 20, 2), '#fef3c7'), R(path('M84 104 L100 116 L116 104'), '#fde68a'), R(circle(100, 116, 3.5), '#dc2626'),
        ],
    },
    {
        name: L('The train from platform 9¾', 'Поезд с платформы 9¾'),
        regions: [
            R(rect(0, 0, 200, 96), '#b45309'), R(rect(0, 20, 200, 3), '#92400e'), R(rect(0, 48, 200, 3), '#92400e'), R(rect(0, 76, 200, 3), '#92400e'),
            R(rect(150, 8, 40, 18, 3), '#1e3a8a'), R(rect(154, 12, 32, 10, 2), '#f8fafc'), R(text(170, 20.5, '9¾', 9), '#1e3a8a'),
            R(circle(40, 22, 9), '#e5e7eb'), R(circle(54, 14, 7), '#f3f4f6'), R(circle(66, 8, 5), '#f9fafb'),
            R(rect(34, 30, 10, 20), '#1f2937'), R(rect(20, 50, 96, 40, 4), '#b91c1c'), R(rect(96, 36, 38, 54, 3), '#991b1b'),
            R(rect(102, 44, 12, 12, 2), '#fde68a'), R(rect(118, 44, 12, 12, 2), '#fde68a'), R(rect(30, 58, 70, 6), '#facc15'),
            R(path('M8 90 L20 70 L20 90 Z'), '#facc15'), R(circle(38, 94, 9), '#111827'), R(circle(66, 94, 9), '#111827'), R(circle(114, 94, 9), '#111827'),
            R(rect(0, 102, 200, 6), '#4b5563'), R(rect(0, 108, 200, 32), '#9ca3af'), R(rect(150, 112, 26, 18, 2), '#7c2d12'), R(circle(186, 124, 5), '#f8fafc'),
        ],
    },
    {
        name: L('A flying broom over the quidditch pitch', 'Метла над полем для квиддича'),
        regions: [
            R(rect(0, 0, 200, 96), '#93c5fd'), R(ellipse(40, 22, 22, 7), '#f8fafc'), R(ellipse(150, 16, 18, 6), '#f8fafc'),
            R(rect(0, 70, 60, 26), '#dc2626'), R(rect(140, 70, 60, 26), '#2563eb'), R(rect(0, 96, 200, 44), '#22c55e'),
            R(rect(158, 40, 3, 60), '#d4d4d8'), R(rect(172, 30, 3, 70), '#d4d4d8'), R(rect(186, 46, 3, 54), '#d4d4d8'),
            R(circle(159.5, 36, 7), '#facc15'), R(circle(173.5, 26, 7), '#facc15'), R(circle(187.5, 42, 7), '#facc15'),
            R(circle(159.5, 36, 4), '#93c5fd'), R(circle(173.5, 26, 4), '#93c5fd'), R(circle(187.5, 42, 4), '#93c5fd'),
            R(path('M30 70 L112 46 L113 50 L31 74 Z'), '#92400e'), R(path('M20 68 Q6 74 4 88 Q22 80 34 74 Z'), '#d97706'),
            R(path('M70 52 Q84 30 98 46 L92 58 Q82 48 76 60 Z'), '#b91c1c'), R(path('M76 56 L94 52 L92 58 L76 62 Z'), '#facc15'), R(circle(86, 34, 7), '#fcd34d'),
        ],
    },
    {
        name: L('Magic books, a wand and candles', 'Волшебные книги, палочка и свечи'),
        regions: [
            R(rect(0, 0, 200, 140), '#7c2d12'), R(rect(10, 10, 180, 6), '#451a03'), R(rect(10, 52, 180, 6), '#451a03'),
            R(rect(16, 18, 10, 34), '#dc2626'), R(rect(28, 22, 12, 30), '#16a34a'), R(rect(42, 16, 9, 36), '#2563eb'), R(rect(53, 24, 14, 28), '#facc15'),
            R(rect(120, 20, 11, 32), '#7c3aed'), R(rect(133, 16, 9, 36), '#0f766e'), R(rect(144, 24, 13, 28), '#be123c'), R(rect(159, 18, 10, 34), '#1d4ed8'),
            R(rect(0, 100, 200, 40), '#92400e'), R(path('M50 96 Q75 86 100 96 Q125 86 150 96 L150 108 Q125 98 100 108 Q75 98 50 108 Z'), '#fef3c7'),
            R(rect(20, 74, 10, 26), '#fef9c3'), R(path('M25 62 Q31 70 25 74 Q19 70 25 62 Z'), '#f97316'), R(rect(170, 70, 10, 30), '#fef9c3'), R(path('M175 58 Q181 66 175 70 Q169 66 175 58 Z'), '#f97316'),
            R(path('M60 124 L140 112 L141 115 L61 127 Z'), '#78350f'), R(path('M146 104 L149 110 L156 111 L151 115 L152 122 L146 118 L140 122 L141 115 L136 111 L143 110 Z'), '#fde047'),
        ],
    },
    {
        name: L('The golden snitch', 'Золотой снитч'),
        regions: [
            R(rect(0, 0, 200, 140), '#7dd3fc'), R(ellipse(36, 24, 22, 7), '#f8fafc'), R(ellipse(166, 30, 18, 6), '#f8fafc'),
            R(path('M0 140 L0 112 Q60 96 110 114 Q160 98 200 110 L200 140 Z'), '#4ade80'), R(path('M0 140 L0 126 Q80 112 200 130 L200 140 Z'), '#22c55e'),
            R(path('M86 70 Q50 40 18 52 Q46 58 30 72 Q60 66 52 84 Q74 72 86 76 Z'), '#f8fafc'), R(path('M114 70 Q150 40 182 52 Q154 58 170 72 Q140 66 148 84 Q126 72 114 76 Z'), '#f8fafc'),
            R(path('M40 56 Q60 60 80 70'), '#e2e8f0'), R(path('M160 56 Q140 60 120 70'), '#e2e8f0'),
            R(circle(100, 72, 16), '#facc15'), R(path('M86 66 Q100 60 114 66'), '#ca8a04'), R(path('M86 78 Q100 84 114 78'), '#ca8a04'), R(circle(94, 66, 4), '#fef08a'),
            R(circle(40, 100, 2.5), '#fde047'), R(circle(160, 96, 2.5), '#fde047'), R(circle(70, 30, 2), '#fde047'), R(circle(132, 28, 2), '#fde047'),
            R(path('M20 108 Q70 92 120 104'), '#fef08a'),
        ],
    },
    // the wizard school set (2026-11-12): open from the start, shown with a "New" badge
    {
        name: L('The talking sorting hat', 'Говорящая шляпа-распределитель'),
        regions: [
            R(rect(0, 0, 200, 140), '#57534e'), R(path('M18 70 L18 34 Q32 16 46 34 L46 70 Z'), '#1e3a8a'), R(path('M154 70 L154 34 Q168 16 182 34 L182 70 Z'), '#1e3a8a'), R(circle(36, 44, 6), '#fef9c3'),
            R(path('M60 0 L80 0 L80 40 L70 32 L60 40 Z'), '#b91c1c'), R(path('M120 0 L140 0 L140 40 L130 32 L120 40 Z'), '#ca8a04'), R(circle(70, 16, 4), '#facc15'), R(circle(130, 16, 4), '#7f1d1d'),
            R(rect(0, 112, 200, 28), '#78350f'), R(ellipse(100, 124, 60, 10), '#991b1b'), R(rect(84, 100, 4, 22), '#451a03'), R(rect(112, 100, 4, 22), '#451a03'), R(rect(78, 94, 44, 8, 3), '#92400e'),
            R(ellipse(100, 90, 40, 7), '#a16207'), R(path('M74 90 Q84 70 92 58 Q96 40 108 26 Q118 20 124 30 Q112 34 110 46 Q118 70 126 90 Z'), '#92400e'),
            R(path('M88 66 Q94 61 99 66 Q94 69 88 66 Z'), '#451a03'), R(path('M104 64 Q110 59 115 64 Q110 67 104 64 Z'), '#451a03'), R(path('M90 80 Q101 73 112 80 Q101 85 90 80 Z'), '#451a03'), R(rect(104, 44, 8, 8, 1), '#b45309'),
            R(rect(20, 96, 6, 16), '#fef3c7'), R(path('M23 85 Q28 91 23 95 Q18 91 23 85 Z'), '#f97316'), R(rect(174, 96, 6, 16), '#fef3c7'), R(path('M177 85 Q182 91 177 95 Q172 91 177 85 Z'), '#f97316'),
            R(circle(150, 52, 2), '#fde047'), R(circle(54, 58, 2), '#fde047'),
        ],
    },
    {
        name: L('Potions class: bubbling cauldrons', 'Урок зелий: кипящие котлы'),
        regions: [
            R(rect(0, 0, 200, 140), '#334155'), R(rect(10, 10, 30, 14, 2), '#475569'), R(rect(56, 20, 30, 14, 2), '#475569'), R(rect(6, 44, 26, 12, 2), '#475569'),
            R(rect(110, 40, 80, 4), '#78350f'), R(rect(118, 26, 8, 14, 2), '#22c55e'), R(rect(132, 22, 8, 18, 2), '#a855f7'), R(rect(146, 28, 8, 12, 2), '#f43f5e'), R(rect(160, 24, 8, 16, 2), '#38bdf8'),
            R(rect(0, 110, 200, 30), '#1e293b'), R(ellipse(70, 96, 30, 20), '#111827'), R(ellipse(70, 78, 30, 6), '#374151'), R(ellipse(70, 78, 26, 4), '#4ade80'),
            R(path('M84 80 L100 50 L103 52 L87 81 Z'), '#a16207'), R(circle(62, 68, 4), '#86efac'), R(circle(76, 62, 5), '#bbf7d0'), R(circle(68, 50, 3), '#dcfce7'),
            R(path('M46 128 Q52 112 58 128 Q64 110 70 128 Q76 112 82 128 Q88 114 94 128 Z'), '#f97316'), R(path('M58 128 Q64 118 70 128 Q76 118 82 128 Z'), '#fde047'),
            R(ellipse(152, 104, 20, 13), '#111827'), R(ellipse(152, 92, 20, 4), '#374151'), R(ellipse(152, 92, 17, 3), '#c084fc'), R(circle(150, 83, 3), '#e9d5ff'), R(circle(158, 76, 2), '#f3e8ff'),
        ],
    },
    {
        name: L('The great hall with floating candles', 'Большой зал с парящими свечами'),
        regions: [
            R(rect(0, 0, 200, 90), '#1e1b4b'), R(circle(70, 12, 1.6), '#fde68a'), R(circle(140, 8, 1.6), '#fde68a'), R(circle(112, 60, 1.6), '#fde68a'),
            R(path('M0 0 L30 0 L30 120 L0 140 Z'), '#57534e'), R(path('M200 0 L170 0 L170 120 L200 140 Z'), '#57534e'), R(rect(9, 24, 12, 36, 6), '#fde68a'), R(rect(179, 24, 12, 36, 6), '#fde68a'),
            R(path('M30 90 L170 90 L200 140 L0 140 Z'), '#78716c'), R(path('M50 96 L80 96 L66 140 L22 140 Z'), '#92400e'), R(path('M120 96 L150 96 L178 140 L134 140 Z'), '#92400e'), R(rect(70, 84, 60, 8, 2), '#7c2d12'),
            R(path('M42 8 L56 8 L56 40 L49 34 L42 40 Z'), '#b91c1c'), R(path('M144 8 L158 8 L158 40 L151 34 L144 40 Z'), '#ca8a04'),
            R(rect(68, 30, 4, 12), '#fef9c3'), R(path('M70 22 Q74 26 70 29 Q66 26 70 22 Z'), '#f97316'), R(rect(96, 20, 4, 12), '#fef9c3'), R(path('M98 12 Q102 16 98 19 Q94 16 98 12 Z'), '#f97316'),
            R(rect(124, 34, 4, 12), '#fef9c3'), R(path('M126 26 Q130 30 126 33 Q122 30 126 26 Z'), '#f97316'), R(rect(86, 50, 4, 12), '#fef9c3'), R(path('M88 42 Q92 46 88 49 Q84 46 88 42 Z'), '#f97316'),
            R(ellipse(48, 112, 5, 2.5), '#f8fafc'), R(ellipse(152, 116, 5, 2.5), '#f8fafc'),
        ],
    },
    {
        name: L('A silver capybara spell in the moonlight', 'Серебряная капибара-заклинание при луне'),
        regions: [
            R(rect(0, 0, 200, 100), '#0f172a'), R(circle(160, 24, 12), '#f8fafc'), R(circle(30, 18, 1.6), '#fde68a'), R(circle(90, 12, 1.6), '#fde68a'),
            R(path('M0 100 L14 50 L28 100 Z'), '#14532d'), R(path('M20 100 L36 40 L52 100 Z'), '#166534'), R(path('M168 100 L182 52 L196 100 Z'), '#14532d'),
            R(rect(0, 100, 200, 40), '#1e3a8a'), R(ellipse(102, 80, 56, 36), '#1e40af'), R(ellipse(102, 120, 40, 6), '#93c5fd'),
            R(ellipse(96, 84, 32, 18), '#e2e8f0'), R(rect(74, 94, 8, 12, 3), '#cbd5e1'), R(rect(104, 94, 8, 12, 3), '#cbd5e1'), R(rect(110, 58, 32, 26, 13), '#f1f5f9'),
            R(circle(116, 60, 4), '#cbd5e1'), R(circle(132, 68, 2.5), '#60a5fa'), R(ellipse(138, 76, 6, 4), '#cbd5e1'), R(circle(126, 52, 7), '#fdba74'),
            R(circle(60, 40, 2.5), '#e0f2fe'), R(circle(72, 30, 2), '#e0f2fe'), R(circle(48, 56, 2), '#e0f2fe'),
        ],
    },
    {
        name: L('A ribbon dance in a red and gold scarf', 'Танец с лентой в красно-золотом шарфе'),
        regions: [
            R(rect(0, 0, 200, 100), '#fce7f3'), R(rect(20, 22, 30, 40, 4), '#bae6fd'), R(rect(150, 22, 30, 40, 4), '#bae6fd'),
            R(path('M64 0 L80 0 L72 12 Z'), '#f59e0b'), R(path('M92 0 L108 0 L100 12 Z'), '#22c55e'), R(path('M120 0 L136 0 L128 12 Z'), '#8b5cf6'),
            R(rect(0, 100, 200, 40), '#60a5fa'), R(rect(0, 100, 200, 4), '#3b82f6'),
            R(path('M78 34 Q60 10 40 30 Q24 48 44 62 Q64 76 52 92 Q42 104 30 98 L30 102 Q46 108 56 94 Q68 74 48 60 Q30 46 42 34 Q60 16 76 36 Z'), '#a855f7'),
            R(path('M78 34 L72 24 L74 23 L80 33 Z'), '#78350f'), R(path('M102 80 L126 66 L128 70 L104 84 Z'), '#fcd7b6'), R(path('M95 80 L86 108 L91 109 L100 82 Z'), '#fcd7b6'),
            R(path('M92 54 L108 54 L106 82 L94 82 Z'), '#e11d48'), R(rect(93, 51, 14, 5, 2), '#facc15'), R(path('M93 56 L78 34 L82 32 L96 54 Z'), '#fcd7b6'), R(path('M107 56 L120 44 L123 47 L108 60 Z'), '#fcd7b6'),
            R(circle(100, 43, 9), '#fcd7b6'), R(path('M91 42 Q92 32 100 33 Q109 32 110 42 Q104 36 91 42 Z'), '#92400e'), R(circle(100, 31, 4), '#92400e'),
            R(circle(40, 30, 2), '#fde047'), R(circle(52, 92, 2), '#fde047'), R(circle(160, 114, 8), '#fde047'),
        ],
    },
    {
        name: L('The street of wizard shops', 'Улица волшебных лавок'),
        regions: [
            R(rect(0, 0, 200, 140), '#fdba74'), R(circle(170, 10, 2), '#fef9c3'),
            R(path('M4 120 L6 40 L54 36 L56 120 Z'), '#7c3aed'), R(path('M0 42 L30 14 L60 38 Z'), '#4c1d95'),
            R(path('M60 120 L62 30 L118 34 L116 120 Z'), '#0f766e'), R(path('M56 36 L90 6 L122 36 Z'), '#134e4a'),
            R(path('M122 120 L124 44 L194 40 L196 120 Z'), '#b91c1c'), R(path('M118 46 L160 18 L200 42 Z'), '#7f1d1d'),
            R(rect(14, 60, 32, 26, 2), '#fde68a'), R(rect(72, 54, 34, 28, 2), '#fde68a'), R(rect(134, 62, 30, 24, 2), '#fde68a'),
            R(rect(22, 94, 14, 26, 6), '#451a03'), R(rect(84, 92, 12, 28, 6), '#451a03'), R(rect(172, 92, 14, 28, 6), '#451a03'),
            R(path('M20 84 L28 64 L36 84 Z'), '#1e1b4b'), R(rect(78, 70, 22, 6, 1), '#78350f'), R(circle(149, 74, 7), '#a16207'), R(circle(146, 72, 2), '#fef3c7'), R(circle(152, 72, 2), '#fef3c7'), R(rect(70, 40, 38, 9, 2), '#facc15'),
            R(rect(0, 120, 200, 20), '#a8a29e'), R(circle(119, 70, 4), '#fef08a'),
        ],
    },
];

// the first six are open from the start, and so is the wizard school set; the magic set opens once each of the first six is painted
export const FIRST_SET = 6;
export const MAGIC_SET = [6, 7, 8, 9, 10, 11];
export const NEW_SET = [12, 13, 14, 15, 16, 17];
export const magicOpen = (done: number[]) => Array.from({ length: FIRST_SET }, (_, i) => i).every(i => done.includes(i));
// the indexes she can choose from, in gallery order: the new set first (so she sees it at once), the first six, then the magic set once it is open
export const openPaintings = (done: number[]): number[] => [...NEW_SET, ...Array.from({ length: FIRST_SET }, (_, i) => i), ...(magicOpen(done) ? MAGIC_SET : [])];

// half: the next part already has a star and waits for one more: a pulsing dashed outline, the color stays a surprise
export const PaintingView: React.FC<{ painting: Painting; filled: number; half?: boolean; className?: string }> = ({ painting, filled, half = false, className = '' }) => (
    <svg viewBox="0 0 200 140" className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white ${className}`} role="img" aria-label={painting.name.en}>
        {painting.regions.map((r, i) => (
            <g key={i} className={i === filled - 1 ? 'animate-pop' : ''} style={{ transformOrigin: 'center' }}>
                {r.el(i < filled ? r.color : '#ffffff', i < filled ? 'rgba(0,0,0,0.15)' : '#cbd5e1')}
            </g>
        ))}
        {half && filled < painting.regions.length && (
            <g data-testid="half-part" className="animate-pulse" style={{ strokeDasharray: '3 2' }}>{painting.regions[filled].el('rgba(129,140,248,0.18)', '#6366f1')}</g>
        )}
    </svg>
);
