export type SchoolSystem = 'US' | 'USSR';
export type InputType = 'number' | 'fraction' | 'comparison' | 'text';

export interface Task {
    id: string;
    grade: number;
    system: SchoolSystem;
    topic: string;
    question: string;         // Уже на нужном языке
    explanation: string;      // На нужном языке
    answerType: InputType;
    correctAnswer: any;       // number, string или { numerator: number, denominator: number }
    renderVisual?: () => React.ReactNode; // Динамический SVG для компонента
}

export interface AppConfig {
    studentName: string;
    lang: 'ru' | 'en';
    theme: 'light' | 'dark' | 'system';
    avatarTheme: 'boy' | 'girl';
    schoolSystem: 'US' | 'USSR' | 'both';
    gradeMode: {
        type: 'single' | 'range';
        grades: number[]; // e.g. [1, 2] или [3]
    };
}
