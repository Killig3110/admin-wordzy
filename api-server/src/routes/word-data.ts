import express, { Request, Response } from 'express';
import axios from 'axios';
import { translateToVi } from '../utils/translate';
import { getImageUrlFromPexels } from '../utils/pexels';
import { fetchOxfordPronunciation } from '../utils/fetchOxfordPronunciation';
import { fetchWordsapiPronunciation } from '../utils/fetchWordsapiPronunciation';
import { VocabularyQuestion } from '../types/vocabularyQuestion';
import { fetchAllWordsInLesson, fetchDialogueForWord, fetchGeminiExample, fetchMainIdeaQuestionFromGemini, fetchSynonymQuestionFromGemini } from '../utils/fetchFirebase';
import { VocabularyWord } from '../types/vocabularyWord';
import { console } from 'inspector';
import { generateAudioAndUpload } from '../utils/generateAudioAndUpload';

const router = express.Router();

let oxfordUsed = 0;
let wordsapiUsed = 0;

router.get('/api/word-data', async (req: Request, res: Response): Promise<any> => {
    const word = typeof req.query.word === 'string' ? req.query.word : '';
    if (!word) return res.status(400).json({ error: 'Missing word' });

    try {
        // Call DictionaryAPI
        const dictRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const dict = dictRes.data?.[0];

        const meaning = dict?.meanings?.[0];
        const definition = meaning?.definitions?.[0]?.definition || '';
        const wordType = meaning?.partOfSpeech?.toUpperCase() || 'OTHER';
        let pronunciation = dict?.phonetics?.[0]?.text || '';
        let pronunciationAudio = dict?.phonetics?.[0]?.audio || '';

        const exampleSentence = await fetchGeminiExample(word);

        // Translate
        const viTranslation = await translateToVi(word);
        const viTranslationDefinition = await translateToVi(definition);

        // Image from Pexels
        const image = await getImageUrlFromPexels(word);

        if ((!pronunciation || !pronunciationAudio) && oxfordUsed < 500) {
            const { oxPron, oxAudio } = await fetchOxfordPronunciation(word);
            if (oxPron || oxAudio) {
                oxfordUsed++;
                pronunciation = pronunciation || oxPron;
                pronunciationAudio = pronunciationAudio || oxAudio;
            }
        }

        if ((!pronunciation || !pronunciationAudio) && wordsapiUsed < 2500) {
            const { waPron, waAudio } = await fetchWordsapiPronunciation(word);
            if (waPron) {
                wordsapiUsed++;
                pronunciation = pronunciation || waPron;
                pronunciationAudio = pronunciationAudio || waAudio;
            }
        }

        res.json({
            word,
            wordType,
            definition,
            exampleSentence,
            pronunciation,
            pronunciationAudio,
            viTranslation,
            viTranslationDefinition,
            image,
        });
    } catch (err: any) {
        console.error('❌ Word data error:', err.message);
        res.status(500).json({ error: 'Failed to fetch word data' });
    }
});

router.post('/api/generate-all-questions', async (req, res) => {
    try {
        const { word, wordId, lessonId, definition, exampleSentence, image } = req.body;

        const allWords = await fetchAllWordsInLesson(lessonId);
        const defList = allWords.map((w: any) => w.definition);
        const questions: VocabularyQuestion[] = [];
        const audio = req.body.audio || await generateAudioAndUpload(word, `word-${word}`);

        // MULTIPLE_CHOICE
        questions.push({
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is this?',
            correctAnswer: word,
            options: [word, 'banana', 'car', 'happy'],
            explanation: 'This is the correct word.',
            audio,
            image,
            lessonId,
            wordId,
        });

        // LISTEN_REWRITE
        questions.push({
            questionType: 'LISTEN_REWRITE',
            questionText: 'Write what you hear.',
            correctAnswer: word,
            explanation: 'You should rewrite exactly what you hear.',
            audio,
            image,
            lessonId,
            wordId,
            options: null
        });

        // PRONOUNCE
        questions.push({
            questionType: 'PRONOUNCE',
            questionText: 'Say the word aloud.',
            correctAnswer: word,
            explanation: 'Try to pronounce this word correctly.',
            audio,
            image,
            lessonId,
            wordId,
            options: null
        });

        // MATCH_IMAGE
        const generateOptions = (correctWord: string, allWords: VocabularyWord[]): string[] => {
            const pool = allWords.map(w => w.word).filter(w => w !== correctWord);

            if (pool.length < 3) {
                return ['banana', 'car', 'happy', correctWord];
            }

            const distractors = [...new Set(pool)].slice(0, 3);
            const options = [...distractors, correctWord];

            return options.sort(() => Math.random() - 0.5);
        };

        questions.push({
            questionType: 'MATCH_IMAGE',
            questionText: "What's the name of this image?",
            correctAnswer: word,
            options: generateOptions(word, allWords),
            explanation: 'Match the image with the word.',
            image,
            audio,
            lessonId,
            wordId,
        });

        // LISTEN_REORDER
        const example = await fetchGeminiExample(word) || exampleSentence;
        const audioUrl = await generateAudioAndUpload(example, `listen-reorder-${word}`);
        questions.push({
            questionType: 'LISTEN_REORDER',
            questionText: 'Hear the sentence and reorder the words.',
            correctAnswer: example,
            options: example.split(' '),
            explanation: 'Reorder the words to make the correct sentence.',
            lessonId,
            image,
            audio: audioUrl,
            wordId,
        });

        // LISTEN_DEFINITION_WRITE_WORD
        const audioUrlDef = await generateAudioAndUpload(definition, `listen-definition-${word.definition}`);
        questions.push({
            questionType: 'LISTEN_DEFINITION_WRITE_WORD',
            questionText: 'Write the word based on the definition you hear.',
            correctAnswer: word,
            explanation: 'Listen to the definition and write the word.',
            audio: audioUrlDef,
            lessonId,
            wordId,
            options: null
        });

        // WORD_SELECT_DEFINITION
        const defOptions = [definition, ...defList.filter((d: any) => d !== definition).slice(0, 3)];
        if (defOptions.length < 4) {
            defOptions.push('The fruit of a banana plant', 'A type of vehicle', 'A feeling of happiness');
        }
        questions.push({
            questionType: 'WORD_SELECT_DEFINITION',
            questionText: word,
            correctAnswer: definition,
            options: defOptions,
            explanation: 'Choose the correct definition of the word.',
            lessonId,
            wordId,
            audio,
            image,
        });

        // WORD_SELECT_SYNONYM
        const synonymQ = await fetchSynonymQuestionFromGemini(word);
        if (synonymQ) {
            questions.push({
                questionType: 'WORD_SELECT_SYNONYM',
                questionText: 'What is the synonym of ' + word + '?',
                correctAnswer: synonymQ.correctAnswer,
                options: synonymQ.options,
                explanation: 'Choose the synonym of the word.',
                lessonId,
                wordId,
                audio,
                image,
            });
        }

        // READ_PARAGRAPH_SELECT_MAIN_IDEA
        const mainIdeaQ = await fetchMainIdeaQuestionFromGemini([word]);
        const audioUrlMainIdea = await generateAudioAndUpload(mainIdeaQ?.paragraph || '', `main-idea-${mainIdeaQ?.paragraph}`);
        if (mainIdeaQ) {
            questions.push({
                questionType: 'READ_PARAGRAPH_SELECT_MAIN_IDEA',
                questionText: mainIdeaQ.paragraph ?? '',
                correctAnswer: mainIdeaQ.correctAnswer,
                options: mainIdeaQ.options,
                explanation: 'What is the main idea of this paragraph?',
                lessonId,
                wordId,
                audio: audioUrlMainIdea,
                image,
            });
        }

        // DIALOGUE_PRACTICE
        const dialogueTurns = await fetchDialogueForWord(word, definition);

        if (dialogueTurns.length > 0) {
            questions.push({
                questionType: 'DIALOGUE_PRACTICE',
                questionText: JSON.stringify(dialogueTurns),
                correctAnswer: '',
                explanation: 'Read and practice the dialogue.',
                lessonId,
                wordId,
                options: null,
                audio,
                image,
            });
        }

        res.json({ questions });
    } catch (error) {
        // In chi tiet loi ra console
        console.error('Error generating questions:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

export default router;
