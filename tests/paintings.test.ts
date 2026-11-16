/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import type * as React from 'react';
import { FIRST_SET, MAGIC_SET, MATH_FACTS, MATH_SET, NEW_SET, PAINTINGS, magicOpen, mathPainting, openPaintings } from '../src/ui/Paintings';

const FIRST = [0, 1, 2, 3, 4, 5];

describe('pictures to paint', () => {
    test('30 pictures: the first six, the magic six, the wizard school six, then the twelve math pictures appended at the end', () => {
        expect(PAINTINGS.length).toBe(30);
        expect(MATH_SET).toEqual([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);
        expect(PAINTINGS[18].name.en).toBe('Fact family 6, 7 and 42');
        expect(FIRST_SET).toBe(6);
        expect(MAGIC_SET).toEqual([6, 7, 8, 9, 10, 11]);
        expect(NEW_SET).toEqual([12, 13, 14, 15, 16, 17]);
        // saved progress keeps indexes: the old pictures stay where they were
        expect(PAINTINGS[0].name.en).toBe('Sunset over the George Washington Bridge');
        expect(PAINTINGS[6].name.en).toBe('A magic castle by the lake at night');
        expect(PAINTINGS[11].name.en).toBe('The golden snitch');
    });
    test('the new set is open from the start and comes first, the magic six stay locked until each of the first six is painted', () => {
        expect(openPaintings([])).toEqual([...NEW_SET, ...MATH_SET, ...FIRST]);
        expect(magicOpen([])).toBe(false);
        // the same picture twice is not all six, and the new ones do not count
        expect(openPaintings([0, 1, 2, 3, 4, 4, 12, 13, 14, 15, 16, 17])).toEqual([...NEW_SET, ...MATH_SET, ...FIRST]);
        expect(magicOpen([0, 1, 2, 3, 4, 4])).toBe(false);
        expect(openPaintings([5, 4, 3, 2, 1, 0])).toEqual([...NEW_SET, ...MATH_SET, ...FIRST, ...MAGIC_SET]);
        expect(openPaintings([0, 1, 2, 3, 4, 5, 7])).toEqual([...NEW_SET, ...MATH_SET, ...FIRST, ...MAGIC_SET]);
        for (const done of [[], [0, 1, 2, 3, 4, 5]]) {
            const open = openPaintings(done);
            expect(new Set(open).size).toBe(open.length);
            for (const i of open) expect(PAINTINGS[i]).toBeDefined();
        }
    });
    test('every picture has enough parts to paint and a name in both languages', () => {
        for (const [i, p] of PAINTINGS.entries()) {
            // a math poster has fewer, bigger parts, so it is painted faster
            expect(p.regions.length).toBeGreaterThanOrEqual(MATH_SET.includes(i) ? 12 : 18);
            expect(p.name.en.trim().length).toBeGreaterThan(5);
            expect(/[А-Яа-яЁё]/.test(p.name.en)).toBe(false);
            expect(/[А-Яа-яЁё]/.test(p.name.ru)).toBe(true);
            for (const r of p.regions) expect(r.color).toMatch(/^#[0-9a-f]{6}$/);
        }
        expect(new Set(PAINTINGS.map(p => p.name.en)).size).toBe(PAINTINGS.length);
    });
    test('a math picture is a fact family that blinks: the array of the fact, the divisions ask first, the multiplications answer first', () => {
        const svg = (el: React.ReactNode) => JSON.stringify(el);
        for (const [a, b] of MATH_FACTS) {
            const p = mathPainting(a, b), rows = Math.max(a, b), cols = Math.min(a, b);
            const dots = p.regions.map(r => (svg(r.el('#000', '#000')).match(/"cx"/g) ?? []).length).filter(Boolean);
            expect(dots).toEqual(Array(rows).fill(cols));
            const texts = p.regions.map(r => svg(r.el('#000', '#000'))).filter(x => x.includes('"children"'));
            const division = texts.find(x => x.includes(`${a * b} ÷ ${b} =`)), product = texts.find(x => x.includes(`${a} × ${b} =`));
            expect(division).toBeDefined(); expect(product).toBeDefined();
            // the answer of a division shows "?" in phase 1 and the number in phase 2, a product the other way round
            const asks = texts.filter(x => x.includes('"?"')).map(x => x.match(/"className":"(math-p[12])"[^]*?"children":"\?"/)?.[1]);
            expect(asks.filter(x => x === 'math-p1').length).toBe(a === b ? 1 : 2);
            expect(asks.filter(x => x === 'math-p2').length).toBe(a === b ? 1 : 2);
            expect(p.name.ru).toContain(`${a * b}`);
        }
    });
});
