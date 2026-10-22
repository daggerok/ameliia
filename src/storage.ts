import { type GameState, normalize } from './engine/game';

// Progress lives on her device: localStorage for a fast start, IndexedDB as a second copy.
// Each copy carries savedAt, the newer one wins. Both may be missing (private mode), the game still works.
const KEY = 'math_quest_v1';
const DB = 'math-quest';
const STORE = 'state';

type Saved = { savedAt: number; state: GameState };

const wrap = (state: GameState): Saved => ({ savedAt: Date.now(), state });
const unwrap = (raw: unknown): Saved | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Partial<Saved> & { version?: number };
    // the first build stored the bare state
    if (r.state) return { savedAt: Number(r.savedAt) || 0, state: normalize(r.state) };
    if (r.version) return { savedAt: 0, state: normalize(r) };
    return null;
};

export const loadLocal = (): Saved | null => {
    try { const s = localStorage.getItem(KEY); return s ? unwrap(JSON.parse(s)) : null; } catch { return null; }
};

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

export const loadDb = async (): Promise<Saved | null> => {
    try {
        const db = await openDb();
        return await new Promise(resolve => {
            const req = db.transaction(STORE, 'readonly').objectStore(STORE).get('main');
            req.onsuccess = () => resolve(unwrap(req.result));
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
};

let pending: ReturnType<typeof setTimeout> | null = null;

export const save = (state: GameState) => {
    const saved = wrap(state);
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* full or private mode */ }
    // IndexedDB is written a moment later so quick changes do not pile up
    if (pending) clearTimeout(pending);
    pending = setTimeout(async () => {
        try {
            const db = await openDb();
            db.transaction(STORE, 'readwrite').objectStore(STORE).put(saved, 'main');
        } catch { /* IndexedDB not available */ }
    }, 800);
};

// ask the browser not to clear the data when space runs low (Safari still clears after 7 days unused unless on the Home Screen)
export const askPersistent = async () => {
    try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
};

export const newer = (a: Saved | null, b: Saved | null) => (!a ? b : !b ? a : b.savedAt > a.savedAt ? b : a);

export const exportFile = (state: GameState) => {
    const blob = new Blob([JSON.stringify(wrap(state), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `math-quest-progress-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export const importFile = async (file: File): Promise<GameState | null> => {
    try { return unwrap(JSON.parse(await file.text()))?.state ?? null; } catch { return null; }
};
