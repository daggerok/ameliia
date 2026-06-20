import { GeneratedTaskInstance, StudentProfile } from './types';
import { registry } from './taskRegistry';

export const generateTask = (
    grades: number[],
    chosenSystem: 'US' | 'USSR' | 'both',
    lang: 'ru' | 'en',
    profile: StudentProfile,
    forceModuleId?: string // Добавили параметр для Retry
): GeneratedTaskInstance => {

    // Если передан конкретный ID модуля (нажали Retry), берем строго его
    let selectedModule = forceModuleId ? registry.find(m => m.id === forceModuleId) : null;

    // Если ID не передан или модуль не найден, выбираем случайно по фильтрам
    if (!selectedModule) {
        const availableModules = registry.filter(m => {
            const gradeMatch = grades.includes(m.grade);
            const systemMatch = chosenSystem === 'both' ? true : m.system === chosenSystem;
            return gradeMatch && systemMatch;
        });

        if (availableModules.length === 0) {
            return {
                id: 'fallback',
                grade: 1,
                system: 'US',
                topic: lang === 'ru' ? 'Базовый счет' : 'Basic Math',
                question: '1 + 1 = ?',
                explanation: '1 + 1 = 2',
                answerType: 'number',
                correctAnswer: 2,
                visual: { type: 'none' }
            };
        }
        selectedModule = availableModules[Math.floor(Math.random() * availableModules.length)];
    }

    const taskState = selectedModule.generateState();
    const rendered = selectedModule.render(taskState, lang, profile);

    return {
        // Сохраняем оригинальный ID модуля, чтобы main.tsx знал, что перезапускать при Retry
        id: selectedModule.id,
        grade: selectedModule.grade,
        system: selectedModule.system,
        topic: lang === 'ru' ? selectedModule.topicRu : selectedModule.topicEn,
        question: rendered.question,
        explanation: rendered.explanation,
        answerType: rendered.answerType,
        correctAnswer: rendered.correctAnswer,
        visual: rendered.visual || { type: 'none' }
    };
};
