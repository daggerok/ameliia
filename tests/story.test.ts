/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { CHAPTERS } from '../src/engine/story';

// a small independent checker for every "a op b = c" in the story (mirrors checkMath in engine.test.ts)
const num = (s: string) => Number(s.replace(/[,\s$]/g, ''));
const joinGroups = (s: string) => { let out = s; for (let i = 0; i < 3; i++) out = out.replace(/(\d)[  ](\d{3})(?!\d)/g, '$1$2'); return out; };
const evaluate = (expr: string): number => {
    const tokens = expr.match(/\d[\d,]*|[×÷+−()]/g) ?? [];
    let i = 0;
    const atom = (): number => { const t = tokens[i++]; if (t === '(') { const v = sum(); i++; return v; } return num(t); };
    const prod = (): number => { let v = atom(); while (tokens[i] === '×' || tokens[i] === '÷') { const op = tokens[i++]; const r = atom(); v = op === '×' ? v * r : v / r; } return v; };
    const sum = (): number => { let v = prod(); while (tokens[i] === '+' || tokens[i] === '−') { const op = tokens[i++]; const r = prod(); v = op === '+' ? v + r : v - r; } return v; };
    return sum();
};
const EXPR = String.raw`\(?\$?\d[\d,]*\)?(?:\s*[×÷+−]\s*\(?\$?\d[\d,]*\)?)*`;
const CHAIN = new RegExp(`(${EXPR})((?:\\s*=\\s*${EXPR})+)`, 'g');
const wrongMath = (text: string): string[] => {
    const bad: string[] = [];
    for (const m of Array.from(joinGroups(text).matchAll(CHAIN))) {
        const parts = m[0].split('=').map(s => s.trim());
        if (!parts.some(p => /[×÷+−]/.test(p))) continue;
        const values = parts.map(evaluate);
        if (values.some(v => Math.abs(v - values[0]) > 1e-9)) bad.push(m[0]);
    }
    return bad;
};
// English words the Russian text may keep (the iPad)
const ALLOWED_LATIN = ['ipad'];

describe('story chapters', () => {
    test('the checker catches a wrong equation', () => {
        expect(wrongMath('2,400 ÷ 6 = 40')).toEqual(['2,400 ÷ 6 = 40']);
        expect(wrongMath('2 400 ÷ 6 = 400, 200 + 80 + 30 + 12 = 322')).toEqual([]);
    });
    test('15 chapters, each with a title, an icon and paragraphs in both languages', () => {
        expect(CHAPTERS.length).toBe(15);
        for (const c of CHAPTERS) {
            expect(c.icon.trim().length).toBeGreaterThan(0);
            expect(c.text.length).toBeGreaterThanOrEqual(3);
            for (const l of [c.title, ...c.text]) {
                expect(l.en.trim().length).toBeGreaterThan(0);
                expect(l.ru.trim().length).toBeGreaterThan(0);
                expect(l.en).not.toMatch(/[А-Яа-яЁё]/);
                expect(l.ru).toMatch(/[А-Яа-яЁё]/);
                const latin = (l.ru.match(/[A-Za-z]{3,}/g) ?? []).filter(w => !ALLOWED_LATIN.includes(w.toLowerCase()));
                expect(latin).toEqual([]);
            }
        }
        expect(new Set(CHAPTERS.map(c => c.title.en)).size).toBe(CHAPTERS.length);
    });
    test('every equation in every chapter is right, in English and in Russian', () => {
        for (const c of CHAPTERS) for (const l of [c.title, ...c.text]) {
            expect(wrongMath(l.en)).toEqual([]);
            expect(wrongMath(l.ru)).toEqual([]);
        }
    });
});
