/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { FIRST_SET, MAGIC_SET, NEW_SET, PAINTINGS, magicOpen, openPaintings } from '../src/ui/Paintings';

const FIRST = [0, 1, 2, 3, 4, 5];

describe('pictures to paint', () => {
    test('18 pictures: the first six, the magic six, the wizard school six appended at the end', () => {
        expect(PAINTINGS.length).toBe(18);
        expect(FIRST_SET).toBe(6);
        expect(MAGIC_SET).toEqual([6, 7, 8, 9, 10, 11]);
        expect(NEW_SET).toEqual([12, 13, 14, 15, 16, 17]);
        // saved progress keeps indexes: the old pictures stay where they were
        expect(PAINTINGS[0].name.en).toBe('Sunset over the George Washington Bridge');
        expect(PAINTINGS[6].name.en).toBe('A magic castle by the lake at night');
        expect(PAINTINGS[11].name.en).toBe('The golden snitch');
    });
    test('the new set is open from the start and comes first, the magic six stay locked until each of the first six is painted', () => {
        expect(openPaintings([])).toEqual([...NEW_SET, ...FIRST]);
        expect(magicOpen([])).toBe(false);
        // the same picture twice is not all six, and the new ones do not count
        expect(openPaintings([0, 1, 2, 3, 4, 4, 12, 13, 14, 15, 16, 17])).toEqual([...NEW_SET, ...FIRST]);
        expect(magicOpen([0, 1, 2, 3, 4, 4])).toBe(false);
        expect(openPaintings([5, 4, 3, 2, 1, 0])).toEqual([...NEW_SET, ...FIRST, ...MAGIC_SET]);
        expect(openPaintings([0, 1, 2, 3, 4, 5, 7])).toEqual([...NEW_SET, ...FIRST, ...MAGIC_SET]);
        for (const done of [[], [0, 1, 2, 3, 4, 5]]) {
            const open = openPaintings(done);
            expect(new Set(open).size).toBe(open.length);
            for (const i of open) expect(PAINTINGS[i]).toBeDefined();
        }
    });
    test('every picture has enough parts to paint and a name in both languages', () => {
        for (const p of PAINTINGS) {
            expect(p.regions.length).toBeGreaterThanOrEqual(18);
            expect(p.name.en.trim().length).toBeGreaterThan(5);
            expect(/[А-Яа-яЁё]/.test(p.name.en)).toBe(false);
            expect(/[А-Яа-яЁё]/.test(p.name.ru)).toBe(true);
            for (const r of p.regions) expect(r.color).toMatch(/^#[0-9a-f]{6}$/);
        }
        expect(new Set(PAINTINGS.map(p => p.name.en)).size).toBe(PAINTINGS.length);
    });
});
