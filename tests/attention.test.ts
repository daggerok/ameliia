/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { makeRng } from '../src/engine/core';
import { type Attention, IDLE_MS, TICK_MS, attention as A, shuffleWith } from '../src/engine/attention';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// she is active every `every` ms from t0 to t1, the app ticks every TICK_MS; returns the counted seconds
const run = (a0: Attention, t0: number, t1: number, every: number, idleMs = IDLE_MS) => {
    let a = a0, sec = 0;
    for (let t = t0; t <= t1; t += 1000) {
        if (every && (t - t0) % every === 0) a = A.activity(a, t);
        if ((t - t0) % TICK_MS === 0) { const s = A.tick(a, t, idleMs); a = s.a; sec += s.addSec; }
    }
    return { a, sec };
};

describe('study time: the state machine', () => {
    test('A1 start: running, last activity now', () => {
        expect(A.start(1000)).toEqual({ state: 'running', lastActive: 1000, from: 1000 });
    });
    test('A2 no "are you here?" before 60 s without activity, A3 at 60 s', () => {
        const a = A.start(0);
        expect(A.tick(a, IDLE_MS - 1).a.state).toBe('running');
        expect(A.tick(a, IDLE_MS).a.state).toBe('idle-check');
    });
    test('A4 the 60 s count from the last activity', () => {
        let a = A.activity(A.start(0), 59_000);
        expect(A.tick(a, 118_000).a.state).toBe('running');
        a = A.tick(a, 119_000).a;
        expect(a.state).toBe('idle-check');
    });
    test('Q5: a quiet minute that ends in "are you here?" adds nothing', () => {
        // active every second for 2 minutes: 120 s
        const busy = run(A.start(0), 0, 120_000, 1000);
        expect(busy.sec).toBe(120);
        // then quiet: the clock does not grow during the quiet minute, it stays at the last activity
        const quiet = run(busy.a, 121_000, 200_000, 0);
        expect(quiet.sec).toBe(0);
        expect(quiet.a.state).toBe('idle-check');
    });
    test('quiet time between two activities counts when she comes back to it in time (reading a page)', () => {
        let a = A.start(0);
        a = A.activity(a, 45_000);
        const s = A.tick(a, 46_000);
        expect(s.addSec).toBe(45);
        expect(s.a.state).toBe('running');
    });
    test('A5 activity while "are you here?" is open changes nothing', () => {
        let a = A.tick(A.start(0), IDLE_MS).a;
        a = A.activity(a, IDLE_MS + 5000);
        expect(a.state).toBe('idle-check');
        expect(A.tick(a, IDLE_MS + 10_000).addSec).toBe(0);
    });
    test('A6 Yes runs the clock from now; No and I don\'t know stop it', () => {
        const idle = A.tick(A.start(0), IDLE_MS).a;
        expect(A.answer(idle, 'yes', 70_000)).toEqual({ state: 'running', lastActive: 70_000, from: 70_000 });
        expect(A.answer(idle, 'no', 70_000).state).toBe('stopped');
        expect(A.answer(idle, 'dunno', 70_000).state).toBe('stopped');
        // and after Yes the clock really counts again
        expect(run(A.answer(idle, 'yes', 70_000), 70_000, 100_000, 1000).sec).toBe(30);
    });
    test('A7 hidden: nothing is counted, not even after an hour', () => {
        let a = A.activity(A.start(0), 10_000);
        const h = A.hide(a);
        expect(h.addSec).toBe(10);
        a = h.a;
        expect(a.state).toBe('hidden');
        expect(A.tick(a, 3_600_000).addSec).toBe(0);
        expect(A.activity(a, 3_600_000)).toBe(a);
    });
    test('A8 visible again: "Continue / Stop", the clock stands until Continue', () => {
        let a = A.show(A.hide(A.start(0)).a, 5000);
        expect(a.state).toBe('resume-check');
        expect(A.tick(a, 9000).addSec).toBe(0);
        expect(A.activity(a, 9000)).toBe(a);
        a = A.resume(a, 10_000);
        expect(a).toEqual({ state: 'running', lastActive: 10_000, from: 10_000 });
    });
    test('A9 Stop: the clock stands, ticks and activity do nothing, Continue starts it again (Q1)', () => {
        let a = A.stop(A.show(A.hide(A.start(0)).a, 1000), 2000);
        expect(a.state).toBe('stopped');
        expect(A.tick(A.activity(a, 9000), 10_000).addSec).toBe(0);
        a = A.resume(a, 20_000);
        expect(a.state).toBe('running');
    });
    test('A10 hidden while "are you here?" is open: back comes "Continue / Stop"', () => {
        const idle = A.tick(A.start(0), IDLE_MS).a;
        expect(A.show(A.hide(idle).a, 70_000).state).toBe('resume-check');
    });
    test('A11 two hide events (visibilitychange and pagehide) are one; show only from hidden', () => {
        const h1 = A.hide(A.start(0)).a;
        const h2 = A.hide(h1);
        expect(h2.a).toBe(h1);
        expect(h2.addSec).toBe(0);
        const s = A.show(h1, 1000);
        expect(A.show(s, 2000)).toBe(s);
    });
    test('A12 a paused interval never adds the missing minutes at once: only proven activity counts', () => {
        // last activity at 3 s, the next tick comes 47 s later (a throttled timer)
        const a = A.activity(A.start(0), 3000);
        const s = A.tick(a, 50_000);
        expect(s.addSec).toBe(3);
    });
    test('A13 leaving the learning screens stops the clock without a window, coming back starts it', () => {
        let a = A.activity(A.start(0), 8000);
        const l = A.leaveLearning(a, 9000);
        expect(l.addSec).toBe(8);
        a = l.a;
        expect(a.state).toBe('stopped');
        a = A.enterLearning(a, 20_000);
        expect(a).toEqual({ state: 'running', lastActive: 20_000, from: 20_000 });
        // hidden on the home screen: back without "Continue / Stop" (Q4)
        const home = A.leaveLearning(A.start(0), 1000).a;
        expect(A.show(A.hide(home).a, 5000).state).toBe('stopped');
        // leaving while hidden: back without the window too
        const away = A.leaveLearning(A.hide(A.start(0)).a, 2000).a;
        expect(A.show(away, 3000).state).toBe('stopped');
    });
    test('A14 the buttons come in every order, the same rng gives the same order', () => {
        const orders = new Set<string>();
        const rng = makeRng(5);
        for (let i = 0; i < 100; i++) {
            const o = shuffleWith(['yes', 'no', 'dunno'], rng);
            expect([...o].sort()).toEqual(['dunno', 'no', 'yes']);
            orders.add(o.join());
        }
        expect(orders.size).toBe(6);
        expect(shuffleWith([1, 2, 3], makeRng(9))).toEqual(shuffleWith([1, 2, 3], makeRng(9)));
    });
    test('A15 a shorter threshold for checks (?idleMs=5000)', () => {
        expect(A.tick(A.start(0), 4999, 5000).a.state).toBe('running');
        expect(A.tick(A.start(0), 5000, 5000).a.state).toBe('idle-check');
    });
    test('the live clock: counted seconds plus the running part, never more than she proved after a check', () => {
        let a = A.start(0);
        expect(A.liveSec(a, 7500)).toBe(7);
        const s = A.tick(A.activity(a, 7000), 8000);
        a = s.a;
        expect(s.addSec).toBe(7);
        expect(A.liveSec(a, 8000)).toBe(1);
        // after "are you here?" the live part is 0: the clock shows only what was counted
        const idle = A.tick(a, 7000 + IDLE_MS).a;
        expect(A.liveSec(idle, 7000 + IDLE_MS)).toBe(0);
    });
    test('the counting never runs ahead: a long busy session counts exactly its seconds', () => {
        const busy = run(A.start(0), 0, 30 * 60_000, 3000);
        expect(busy.sec).toBe(30 * 60 - 0);
        expect(busy.a.state).toBe('running');
    });
    test('no clock inside the logic', () => {
        expect(readFileSync(join(__dirname, '../src/engine/attention.ts'), 'utf8')).not.toMatch(/Date\.now|performance\.now|new Date/);
    });
});
