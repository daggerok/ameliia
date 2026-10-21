import * as React from 'react';

export type Mood = 'happy' | 'think' | 'cheer' | 'care' | 'wow';

// Lina: a slim girl with round glasses, light brown hair and brown eyes. She guides Ameliia.
export const Lina: React.FC<{ mood?: Mood; size?: number; className?: string }> = ({ mood = 'happy', size = 96, className = '' }) => {
    const mouth = {
        happy: <path d="M50 79 Q60 87 70 79" stroke="#9a3412" strokeWidth="2.6" fill="none" strokeLinecap="round" />,
        cheer: <path d="M48 77 Q60 92 72 77 Z" fill="#9a3412" />,
        think: <path d="M53 81 Q60 79 67 81" stroke="#9a3412" strokeWidth="2.6" fill="none" strokeLinecap="round" />,
        care: <path d="M51 80 Q60 85 69 80" stroke="#9a3412" strokeWidth="2.4" fill="none" strokeLinecap="round" />,
        wow: <ellipse cx="60" cy="81" rx="4" ry="5" fill="#9a3412" />,
    }[mood];
    const brows = mood === 'think'
        ? <><path d="M38 52 Q46 47 53 51" stroke="#7c5230" strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d="M67 49 Q74 46 82 50" stroke="#7c5230" strokeWidth="2.4" fill="none" strokeLinecap="round" /></>
        : mood === 'care'
            ? <><path d="M39 51 Q46 49 53 52" stroke="#7c5230" strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d="M67 52 Q74 49 81 51" stroke="#7c5230" strokeWidth="2.4" fill="none" strokeLinecap="round" /></>
            : <><path d="M39 51 Q46 46 53 50" stroke="#7c5230" strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d="M67 50 Q74 46 81 51" stroke="#7c5230" strokeWidth="2.4" fill="none" strokeLinecap="round" /></>;
    return (
        <svg viewBox="0 0 120 140" width={size} height={size * 140 / 120} className={className} role="img" aria-label="Lina">
            {/* hair behind */}
            <path d="M22 62 Q18 20 60 16 Q102 20 98 62 L100 104 Q86 112 80 100 L40 100 Q34 112 20 104 Z" fill="#b98a5e" />
            {/* body */}
            <path d="M34 140 Q34 108 60 106 Q86 108 86 140 Z" fill="#6366f1" />
            <path d="M52 106 L60 118 L68 106" fill="#e0e7ff" />
            <rect x="54" y="92" width="12" height="16" rx="5" fill="#f2cdb4" />
            {/* face */}
            <ellipse cx="60" cy="64" rx="27" ry="31" fill="#f6d7c3" />
            <ellipse cx="33" cy="66" rx="4" ry="6" fill="#f2cdb4" />
            <ellipse cx="87" cy="66" rx="4" ry="6" fill="#f2cdb4" />
            {/* bangs */}
            <path d="M33 56 Q34 30 60 28 Q88 30 88 56 Q78 40 64 42 Q56 36 46 44 Q38 46 33 56 Z" fill="#c69a6d" />
            <circle cx="84" cy="40" r="4" fill="#f472b6" />
            {brows}
            {/* brown eyes */}
            <circle cx="46" cy="62" r="5.4" fill="#6b3f1d" />
            <circle cx="74" cy="62" r="5.4" fill="#6b3f1d" />
            <circle cx="47.8" cy="60.2" r="1.7" fill="#fff" />
            <circle cx="75.8" cy="60.2" r="1.7" fill="#fff" />
            {/* round glasses */}
            <circle cx="46" cy="62" r="10.5" fill="rgba(255,255,255,0.15)" stroke="#334155" strokeWidth="2.6" />
            <circle cx="74" cy="62" r="10.5" fill="rgba(255,255,255,0.15)" stroke="#334155" strokeWidth="2.6" />
            <path d="M56.5 61 Q60 58.5 63.5 61" stroke="#334155" strokeWidth="2.4" fill="none" />
            <circle cx="40" cy="74" r="4" fill="#fda4af" opacity="0.55" />
            <circle cx="80" cy="74" r="4" fill="#fda4af" opacity="0.55" />
            <path d="M58 70 Q60 72 62 70" stroke="#d6a487" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {mouth}
        </svg>
    );
};

// Pip: a calm capybara who loves math and makes funny mistakes. Every time she shows up she has a new hobby.
export type PipRole = 'orange' | 'piano' | 'flute' | 'artist' | 'scientist' | 'math' | 'gymnast' | 'reader';
export const PIP_ROLES: PipRole[] = ['orange', 'piano', 'flute', 'artist', 'scientist', 'math', 'gymnast', 'reader'];
let nextRole = Math.floor(Math.random() * PIP_ROLES.length);
const takeRole = () => PIP_ROLES[nextRole++ % PIP_ROLES.length];

export const Pip: React.FC<{ size?: number; className?: string; wink?: boolean; role?: PipRole }> = ({ size = 56, className = '', wink = false, role }) => {
    // each new Pip on the screen takes the next hobby, so she keeps changing
    const [r] = React.useState<PipRole>(() => role ?? takeRole());
    const hat = r === 'artist' || r === 'gymnast' ? null : r === 'orange' || r === 'piano' || r === 'reader' ? 'orange' : null;
    return (
        <svg viewBox="0 0 80 84" width={size} height={size * 84 / 80} className={className} role="img" aria-label={`Pip ${r}`} data-pip={r}>
            {/* a slimmer body and head than before */}
            <ellipse cx="40" cy="63" rx="24" ry="19" fill="#a8743f" />
            <rect x="24" y="76" width="9" height="7" rx="3" fill="#7c5230" />
            <rect x="47" y="76" width="9" height="7" rx="3" fill="#7c5230" />
            <circle cx="24" cy="24" r="5" fill="#8b5e34" />
            <circle cx="56" cy="24" r="5" fill="#8b5e34" />
            <circle cx="24" cy="24" r="2.2" fill="#5b3a1e" />
            <circle cx="56" cy="24" r="2.2" fill="#5b3a1e" />
            <rect x="19" y="21" width="42" height="38" rx="18" fill="#c08a58" />
            <ellipse cx="40" cy="47" rx="14" ry="9.5" fill="#a06a3c" />
            <ellipse cx="35" cy="44.5" rx="1.9" ry="1.4" fill="#3f2a17" />
            <ellipse cx="45" cy="44.5" rx="1.9" ry="1.4" fill="#3f2a17" />
            <path d="M36 51 Q40 53.5 44 51" stroke="#3f2a17" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {wink ? <path d="M26 35 Q30 31.5 34 35" stroke="#1f2937" strokeWidth="2.4" fill="none" strokeLinecap="round" /> : <circle cx="30" cy="35" r="3" fill="#1f2937" />}
            <circle cx="50" cy="35" r="3" fill="#1f2937" />
            {!wink && <circle cx="31" cy="34" r="1" fill="#fff" />}
            <circle cx="51" cy="34" r="1" fill="#fff" />
            <circle cx="25" cy="42" r="3" fill="#fda4af" opacity="0.5" />
            <circle cx="55" cy="42" r="3" fill="#fda4af" opacity="0.5" />
            {hat === 'orange' && (<><circle cx="40" cy="15" r="7" fill="#fb923c" /><path d="M40 8 Q45 3 49 6 Q45 10 40 8 Z" fill="#22c55e" /></>)}
            {r === 'piano' && (<g>
                <rect x="4" y="64" width="72" height="16" rx="2" fill="#111827" />
                <rect x="7" y="67" width="66" height="10" fill="#f8fafc" />
                {[13, 21, 33, 41, 49, 61, 69].map(x => <rect key={x} x={x} y="67" width="3" height="6" fill="#111827" />)}
            </g>)}
            {r === 'flute' && (<g>
                <path d="M6 56 L74 44 L75 48 L7 60 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                {[52, 58, 64].map(x => <circle key={x} cx={x} cy={48.5 - (x - 52) * 0.17} r="1.2" fill="#475569" />)}
                <path d="M68 30 L68 20 L74 18 L74 28" stroke="#6366f1" strokeWidth="1.6" fill="none" /><circle cx="66" cy="31" r="2.6" fill="#6366f1" /><circle cx="72" cy="29" r="2.6" fill="#6366f1" />
            </g>)}
            {r === 'artist' && (<g>
                <ellipse cx="40" cy="20" rx="17" ry="6" fill="#dc2626" /><circle cx="40" cy="14" r="2.5" fill="#dc2626" />
                <ellipse cx="66" cy="66" rx="13" ry="9" fill="#fcd34d" stroke="#b45309" strokeWidth="1" />
                <circle cx="61" cy="63" r="2.2" fill="#ef4444" /><circle cx="67" cy="61" r="2.2" fill="#3b82f6" /><circle cx="72" cy="65" r="2.2" fill="#22c55e" /><circle cx="64" cy="70" r="2.2" fill="#a855f7" />
                <path d="M10 74 L24 56" stroke="#92400e" strokeWidth="2.4" strokeLinecap="round" /><path d="M24 56 L27 52" stroke="#ec4899" strokeWidth="3.4" strokeLinecap="round" />
            </g>)}
            {r === 'scientist' && (<g>
                <circle cx="30" cy="35" r="6.5" fill="rgba(186,230,253,0.45)" stroke="#0ea5e9" strokeWidth="2" />
                <circle cx="50" cy="35" r="6.5" fill="rgba(186,230,253,0.45)" stroke="#0ea5e9" strokeWidth="2" />
                <path d="M36.5 35 L43.5 35" stroke="#0ea5e9" strokeWidth="2" />
                <path d="M64 52 L64 60 L56 76 L76 76 L68 60 L68 52 Z" fill="#e0f2fe" stroke="#64748b" strokeWidth="1" />
                <path d="M59 70 L73 70 L76 76 L56 76 Z" fill="#4ade80" /><circle cx="66" cy="47" r="2" fill="#86efac" /><circle cx="70" cy="42" r="1.4" fill="#86efac" />
            </g>)}
            {r === 'math' && (<g>
                <rect x="54" y="52" width="24" height="20" rx="2" fill="#166534" stroke="#92400e" strokeWidth="1.6" />
                <text x="66" y="66" textAnchor="middle" fontSize="11" fontWeight="900" fill="#f8fafc">÷×</text>
                <circle cx="40" cy="15" r="6" fill="#fb923c" /><path d="M40 9 Q45 4 49 7 Q45 11 40 9 Z" fill="#22c55e" />
            </g>)}
            {r === 'gymnast' && (<g>
                <path d="M20 27 Q40 18 60 27 L60 31 Q40 22 20 31 Z" fill="#ec4899" />
                <path d="M62 58 Q78 50 70 40 Q62 32 72 24 Q80 18 76 10" stroke="#f472b6" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <path d="M58 62 L64 56" stroke="#92400e" strokeWidth="2.4" strokeLinecap="round" />
            </g>)}
            {r === 'reader' && (<g>
                <path d="M14 66 L40 70 L66 66 L66 82 L40 84 L14 82 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <path d="M40 70 L40 84" stroke="#b45309" strokeWidth="1" />
                <path d="M19 71 L35 73 M19 75 L35 77 M45 73 L61 71 M45 77 L61 75" stroke="#94a3b8" strokeWidth="1" />
            </g>)}
        </svg>
    );
};

export const Bubble: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`relative bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 shadow-md text-slate-800 dark:text-slate-100 font-bold text-base md:text-lg leading-snug ${className}`}>
        <span className="absolute -left-2 top-6 w-4 h-4 rotate-45 bg-white dark:bg-slate-700 border-l border-b border-slate-200 dark:border-slate-600" />
        <span className="relative">{children}</span>
    </div>
);

export const Guide: React.FC<{ mood?: Mood; children: React.ReactNode; pip?: boolean; testId?: string }> = ({ mood = 'happy', children, pip = false, testId }) => (
    <div className="flex items-start gap-3 animate-fade-in" data-testid={testId}>
        <div className="shrink-0 relative">
            <Lina mood={mood} size={72} />
            {pip && <Pip size={34} className="absolute -bottom-1 -right-3 animate-wiggle" />}
        </div>
        <Bubble className="flex-1 mt-2">{children}</Bubble>
    </div>
);
