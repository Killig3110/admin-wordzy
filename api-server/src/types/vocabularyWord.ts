export interface VocabularyWord {
    wordId?: string; // Firestore document ID nếu cần
    word: string;
    wordType: string;
    pronunciation: string;
    definition: string;
    viTranslationDefinition: string;
    viTranslation: string;
    exampleSentence: string;
    pronunciationAudio: string;
    image: string;
    lessonId: string;
}
