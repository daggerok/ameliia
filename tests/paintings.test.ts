/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { FIRST_SET, PAINTINGS, openPaintings } from '../src/ui/Paintings';

describe('magic pictures', () => {
    test('the six magic pictures open after each of the first six is painted', () => {
        expect(PAINTINGS.length).toBe(12);
        expect(openPaintings([])).toBe(FIRST_SET);
        // the same picture twice is not all six
        expect(openPaintings([0, 1, 2, 3, 4, 4])).toBe(FIRST_SET);
        expect(openPaintings([5, 4, 3, 2, 1, 0])).toBe(12);
        expect(openPaintings([0, 1, 2, 3, 4, 5, 7])).toBe(12);
    });
    test('every picture has enough parts to paint and a name in both languages', () => {
        for (const p of PAINTINGS) {
            expect(p.regions.length).toBeGreaterThanOrEqual(18);
            expect(p.name.en.trim().length).toBeGreaterThan(5);
            expect(/[А-Яа-яЁё]/.test(p.name.ru)).toBe(true);
            for (const r of p.regions) expect(r.color).toMatch(/^#[0-9a-f]{6}$/);
        }
    });
});
