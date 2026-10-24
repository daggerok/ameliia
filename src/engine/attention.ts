// Study time is counted only while Ameliia is really studying. One state machine, pure functions,
// the time always comes in as `now` (no clock inside), so every rule is tested with fake time.
//
//   running       the clock counts: a learning screen is open, the page is visible, she was active lately
//   idle-check    no activity for idleMs: "Ameliia, are you here?" (Yes / No / I don't know), the clock stands
//   hidden        the page is not visible (other tab, other app, locked screen), the clock stands
//   resume-check  the page is visible again: "Continue / Stop", the clock stands until she taps Continue
//   stopped       the clock stands: after Stop, after No / I don't know, or outside the learning screens
//
// Only time she proved with activity is counted: the seconds from `from` up to her last activity.
// The quiet time after the last activity is never counted, so a minute without activity that ends in
// "are you here?" adds nothing (the clock shows 20:01 before that minute and 20:01 after it).

export type AttentionState = 'running' | 'idle-check' | 'hidden' | 'resume-check' | 'stopped';
export type Attention = { state: AttentionState; lastActive: number; from: number; hiddenFrom?: AttentionState };
export type Step = { a: Attention; addSec: number };

export const IDLE_MS = 60_000;
export const TICK_MS = 5_000;

const none = (a: Attention): Step => ({ a, addSec: 0 });
const runningAt = (now: number): Attention => ({ state: 'running', lastActive: now, from: now });

// whole seconds of proven study since `from`; the rest of a second stays for the next commit
const commit = (a: Attention): Step => {
    const sec = Math.max(0, Math.floor((a.lastActive - a.from) / 1000));
    return { a: { ...a, from: a.from + sec * 1000 }, addSec: sec };
};

export const attention = {
    start: (now: number): Attention => runningAt(now),
    stopped: (now: number): Attention => ({ state: 'stopped', lastActive: now, from: now }),

    // a touch, a key, a scroll, a stroke in the notepad; only counts while the clock runs
    activity: (a: Attention, now: number): Attention => (a.state === 'running' && now > a.lastActive ? { ...a, lastActive: now } : a),

    // every tick: count what activity proved; after idleMs without activity ask "are you here?"
    tick: (a: Attention, now: number, idleMs = IDLE_MS): Step => {
        if (a.state !== 'running') return none(a);
        const c = commit(a);
        return now - a.lastActive >= idleMs ? { a: { ...c.a, state: 'idle-check' }, addSec: c.addSec } : c;
    },

    // the moment before a topic change: count it for the old topic
    flush: (a: Attention): Step => (a.state === 'running' ? commit(a) : none(a)),

    // hidden from any state; a second hide (visibilitychange and pagehide) changes nothing
    hide: (a: Attention): Step => {
        if (a.state === 'hidden') return none(a);
        const c = a.state === 'running' ? commit(a) : none(a);
        return { a: { ...c.a, state: 'hidden', hiddenFrom: a.state }, addSec: c.addSec };
    },

    // visible again: always "Continue / Stop" when she was studying, even after one second away
    show: (a: Attention, now: number): Attention => {
        if (a.state !== 'hidden') return a;
        return a.hiddenFrom === 'stopped' ? { state: 'stopped', lastActive: now, from: now } : { state: 'resume-check', lastActive: now, from: now };
    },

    // "are you here?": Yes runs the clock again from now, No / I don't know stop it (the app saves and closes)
    answer: (a: Attention, choice: 'yes' | 'no' | 'dunno', now: number): Attention => {
        if (a.state !== 'idle-check') return a;
        return choice === 'yes' ? runningAt(now) : { state: 'stopped', lastActive: now, from: now };
    },

    // Continue after a break, or the Continue button after Stop
    resume: (a: Attention, now: number): Attention => (a.state === 'resume-check' || a.state === 'stopped' ? runningAt(now) : a),
    stop: (a: Attention, now: number): Attention => (a.state === 'resume-check' || a.state === 'running' ? { state: 'stopped', lastActive: now, from: now } : a),

    // Home, settings, progress: the clock stands without any window; a learning screen starts it again
    leaveLearning: (a: Attention, now: number): Step => {
        if (a.state === 'hidden') return none({ ...a, hiddenFrom: 'stopped' });
        const c = a.state === 'running' ? commit(a) : none(a);
        return { a: { state: 'stopped', lastActive: now, from: now }, addSec: c.addSec };
    },
    enterLearning: (a: Attention, now: number): Attention => (a.state === 'stopped' ? runningAt(now) : a),

    // the live clock: the counted seconds plus the time since `from` while it runs
    liveSec: (a: Attention, now: number): number => (a.state === 'running' ? Math.max(0, Math.floor((now - a.from) / 1000)) : 0),
};

// a new random order of the answer buttons for every new window
export const shuffleWith = <T>(xs: readonly T[], rng: () => number): T[] => {
    const out = [...xs];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};
