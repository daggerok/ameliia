export type SchoolSystem = 'US' | 'USSR';
export type InputType = 'number' | 'fraction' | 'comparison' | 'text';

export interface VisualData {
    type: 'circle' | 'bar' | 'none';
    totalParts?: number;
    shadedParts?: number;
}

export interface GeneratedTaskInstance {
    id: string;
    grade: number;
    system: SchoolSystem;
    topic: string;
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
    avatarTheme: 'boy' | 'girl';
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
    topicRu: string;
    topicEn: string;
    generateState: () => any;
    render: (state: any, lang: 'ru' | 'en') => {
        question: string;
        explanation: string;
        answerType: InputType;
        correctAnswer: any;
        visual?: VisualData;
    };
}
