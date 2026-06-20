export type SchoolSystem = 'US' | 'USSR';
export type InputType = 'number' | 'fraction' | 'comparison' | 'text';
export type Gender = 'boy' | 'girl' | 'none';

export interface VisualData {
    type: 'circle' | 'bar' | 'none';
    totalParts?: number;
    shadedParts?: number;
}

export interface StudentProfile {
    name: string;
    gender: Gender;
}

export interface GeneratedTaskInstance {
    id: string;
    grade: number;
    system: SchoolSystem;
    topic: string; // Локализованная тема, которая покажется в конце
    question: string;
    explanation: string;
    answerType: InputType;
    correctAnswer: any;
    visual: VisualData;
}

export interface AppConfig {
    studentName: string;
    lang: 'ru' | 'en';
    theme: 'light' | 'dark' | 'system';
    avatarTheme: Gender;
    emoji: string;
    schoolSystem: 'US' | 'USSR' | 'both';
    gradeMode: {
        type: 'single' | 'range';
        grades: number[];
    };
    order: 'sequential' | 'shuffle';
}

export interface TaskGeneratorModule {
    id: string;
    grade: number;
    system: SchoolSystem;
    topicRu: string; // Тема на русском
    topicEn: string; // Тема на английском
    generateState: () => any;
    render: (state: any, lang: 'ru' | 'en', profile: StudentProfile) => {
        question: string;
        explanation: string;
        answerType: InputType;
        correctAnswer: any;
        visual?: VisualData;
    };
}
