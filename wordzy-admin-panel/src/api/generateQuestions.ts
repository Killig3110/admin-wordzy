import { VocabularyQuestion, Word } from "../types";

export async function generateQuestions(wordData: Word): Promise<VocabularyQuestion[]> {
    const res = await fetch('http://localhost:8080/api/generate-all-questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word: wordData.word,
            wordId: wordData.wordId,
            lessonId: wordData.lessonId,
            definition: wordData.definition,
            audio: wordData.pronunciationAudio,
            exampleSentence: wordData.exampleSentence,
            image: wordData.image
        })
    });

    if (!res.ok) throw new Error("Failed to generate questions");
    const data = await res.json();
    return data.questions;
}
