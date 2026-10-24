/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { makeRng, sameAnswer } from '../src/engine/core';
import { diagnose } from '../src/engine/diagnose';
import { kindOf } from '../src/engine/game';
import { makeProblem } from '../src/engine/index';
import { BLANKS, DEFINITIONS } from '../src/engine/scienceWords';

describe('science words: fill in the blank', () => {
    test('every word of the Chapter 2 study guide (parts I and II) is asked', () => {
        const words = new Set(BLANKS.map(b => b.word));
        for (const w of ['motion', 'reference point', 'force', 'push', 'pull', 'gravity', 'relative motion', 'vibration', 'rotation', 'direction', 'balanced', 'speed', 'velocity', 'acceleration', 'time', 'distance']) expect(words.has(w)).toBe(true);
        // the definitions are the study guide sentences, word for word
        const text = DEFINITIONS.map(d => d.en).join('\n');
        for (const line of ['Gravity is the force that pulls all objects towards each other.', 'Speed: the rate at which an object changes position.', 'Velocity combines both the speed and direction an object is moving.',
            'Acceleration: any change in the speed or direction of an object\'s motion.', 'Motion: a change in position of an object.', 'A force is any push or pull.',
            'A reference point is a place or object used to determine if an object is in motion.', 'Relative motion is the change of one object\'s position compared with another object\'s position.',
            'All forces have size and direction.', 'equal in size but act in opposite directions, we say that they are balanced forces.', 'back and forth as a vibration, or as a rotation.']) expect(text).toContain(line);
        expect(DEFINITIONS.length).toBe(new Set(DEFINITIONS.map(d => d.en)).size);
        // every sentence has exactly one blank and a Russian translation with the same blank
        for (const b of BLANKS) { expect(b.en.split('___').length).toBe(2); expect(b.ru.split('___').length).toBe(2); }
        expect(new Set(BLANKS.map(b => b.key)).size).toBe(BLANKS.length);
    });
    test('both kinds are made on request; the word bank holds the right word once among 4 different words', () => {
        for (let seed = 1; seed <= 300; seed++) {
            const typed = makeProblem('sci-words', makeRng(seed), 'type');
            expect(kindOf(typed)).toBe('type');
            expect(typed.answer.kind).toBe('word');
            const bank = makeProblem('sci-words', makeRng(seed), 'bank');
            expect(kindOf(bank)).toBe('bank');
            if (bank.answer.kind !== 'choice') throw new Error('choice expected');
            const words = bank.answer.options.map(o => o.en);
            expect(new Set(words).size).toBe(4);
            const b = BLANKS.find(x => x.key === bank.data.key)!;
            expect(words[bank.answer.correct]).toBe(b.word);
            // the prompt in both languages shows the English sentence with the blank
            expect(bank.prompt.ru).toContain(b.en);
            expect(bank.prompt.ru).toContain(b.ru);
        }
    });
    test('what went wrong with a word: a spelling slip, or another science word', () => {
        const byKey = (key: string) => { for (let s = 1; s < 2000; s++) { const p = makeProblem('sci-words', makeRng(s), 'type'); if (p.data.key === key) return p; } throw new Error(key); };
        const g = byKey('def-gravity');
        expect(sameAnswer(g.answer, { text: 'Gravity' })).toBe(true);
        expect(diagnose(g, { text: 'gravaty' })?.en).toBe('Almost! Check the spelling: gravity.');
        expect(diagnose(g, { text: 'rotation' })?.en).toMatch(/^"rotation" is a science word too, but it means something else: .*rotation.* This sentence needs another word\.$/);
        expect(diagnose(g, { text: 'banana' })).toBeNull();
        expect(diagnose(g, { text: 'gravity' })).toBeNull();
        const acc = byKey('def-acceleration');
        expect(diagnose(acc, { text: 'accelaration' })?.en).toBe('Almost! Check the spelling: acceleration.');
        const ref = byKey('def-reference');
        expect(sameAnswer(ref.answer, { text: 'a reference point' })).toBe(true);
        expect(sameAnswer(ref.answer, { text: 'reference points' })).toBe(true);
        expect(sameAnswer(ref.answer, { text: 'reference' })).toBe(false);
        const bal = byKey('def-balanced');
        expect(sameAnswer(bal.answer, { text: 'balanced forces' })).toBe(true);
    });
});
