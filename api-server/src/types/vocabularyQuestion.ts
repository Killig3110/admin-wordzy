export interface VocabularyQuestion {
    questionType: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string;
    questionText: string;
    audio?: string;
    image?: string;
    practiceSessionId?: string;
    wordId?: string | null;
    lessonId?: string;
}
