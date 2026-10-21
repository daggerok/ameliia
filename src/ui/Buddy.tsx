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

// Pip: a fluffy little owl who loves math and makes funny mistakes
export const Pip: React.FC<{ size?: number; className?: string; wink?: boolean }> = ({ size = 56, className = '', wink = false }) => (
    <svg viewBox="0 0 80 84" width={size} height={size * 84 / 80} className={className} role="img" aria-label="Pip">
        <path d="M14 22 L22 6 L30 20 Z" fill="#8b6b4a" />
        <path d="M66 22 L58 6 L50 20 Z" fill="#8b6b4a" />
        <ellipse cx="40" cy="48" rx="28" ry="32" fill="#a47c56" />
        <ellipse cx="40" cy="56" rx="17" ry="20" fill="#f3e3c8" />
        <path d="M13 46 Q2 62 16 74 Q20 60 18 46 Z" fill="#8b6b4a" />
        <path d="M67 46 Q78 62 64 74 Q60 60 62 46 Z" fill="#8b6b4a" />
        <circle cx="28" cy="34" r="12" fill="#fff" />
        <circle cx="52" cy="34" r="12" fill="#fff" />
        {wink ? <path d="M22 35 Q28 30 34 35" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /> : <circle cx="29" cy="35" r="5.5" fill="#1f2937" />}
        <circle cx="53" cy="35" r="5.5" fill="#1f2937" />
        <circle cx="55" cy="33" r="1.8" fill="#fff" />
        {!wink && <circle cx="31" cy="33" r="1.8" fill="#fff" />}
        <path d="M36 44 L44 44 L40 51 Z" fill="#f59e0b" />
        <path d="M30 80 L34 74 M40 81 L40 75 M50 80 L46 74" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

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
