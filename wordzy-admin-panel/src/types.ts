
export interface VocabularyQuestion {
    questionType: string;
    questionText: string;
    correctAnswer: string;
    explanation?: string;
    options?: string[];
    audio?: string;
    image?: string;
    wordId?: string;
    lessonId: string;
}

export interface Topic {
    id: string;
    name: string;
    createdAt: Date;
}

export interface Lesson {
    id: string;
    name: string;
    topicId: string;
    createdAt: Date;
}

export interface Word {
    wordId: string;
    word: string;
    wordType: string;
    definition: string;
    pronunciation: string;
    pronunciationAudio: string;
    exampleSentence: string;
    viTranslationDefinition: string;
    viTranslation: string;
    image: string;
    lessonId: string;
    createdAt: Date;
}
