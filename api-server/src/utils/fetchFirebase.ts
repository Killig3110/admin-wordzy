import { db } from '../firebase';
import { DialogueTurn } from '../types/dialogueTurn';
import { QuestionData } from '../types/questionData';
import { VocabularyWord } from '../types/vocabularyWord';
import { collection, query, where, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY;

export const fetchAllWordsInLesson = async (lessonId: string): Promise<VocabularyWord[]> => {
    const q = query(collection(db, 'vocabulary_words'), where('lessonId', '==', lessonId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ wordId: doc.id, ...doc.data() } as VocabularyWord));
};

export const fetchGeminiExample = async (word: string): Promise<string> => {
    try {
        const body = {
            contents: [
                {
                    parts: [
                        { text: `Write a natural English sentence of at least 6 words using the word: "${word}"` }
                    ]
                }
            ]
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            console.error(`❌ Gemini API failed: ${res.status} ${res.statusText}`);
            const errText = await res.text();
            console.error('Raw response:', errText);
            return '';
        }

        const data = await res.json();

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return text.trim();
    } catch (error) {
        console.error('Error fetching example sentence:', error);
        return '';
    }
};

export const fetchSynonymQuestionFromGemini = async (word: string): Promise<QuestionData | null> => {
    const body = {
        contents: [
            {
                parts: [{
                    text: `I am making a vocabulary quiz.\n\nPlease help me generate 1 question based on the English word: "${word}".\n\nReturn in JSON format:\n{\n"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..." }\n\nInclude 1 synonym, 1 antonym, 1 unrelated word, and 1 distractor.`
                }]
            }
        ]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    try {
        const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = jsonText.replace(/```json|```/g, '').trim();
        const parsed: QuestionData = JSON.parse(cleaned);
        return parsed;
    } catch {
        return null;
    }
};

export const fetchMainIdeaQuestionFromGemini = async (words: string[]): Promise<QuestionData | null> => {
    const joinedWords = words.join(', ');
    const prompt = `I am creating a short reading comprehension question.
Write a short paragraph (3-5 sentences) using these words: ${joinedWords}.
Then give 4 short options for the main idea (max 5 words each), with one correct.
Return as JSON: {
  "paragraph": "...",
  "options": ["...", "...", "...", "..."],
  "correctAnswer": "..."
}`;

    const body = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ]
    };

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }
    );

    const data = await res.json();
    try {
        const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = jsonText.replace(/```json|```/g, '').trim();
        const parsed: QuestionData = JSON.parse(cleaned);
        return parsed;
    } catch {
        return null;
    }
};

export const fetchDialogueForWord = async (word: string, definition: string): Promise<DialogueTurn[]> => {
    const prompt = `Generate a short English conversation (3 turns) using the word "${word}" (which means "${definition}").\n` +
        `Format output as JSON array of turns like this:\n` +
        `[\n  { "speaker": "Bot", "text": "..." },\n  { "speaker": "User", "text": "..." },\n  { "speaker": "Bot", "text": "..." }\n]`;

    const body = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    try {
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed as DialogueTurn[];
    } catch {
        return [];
    }
};
