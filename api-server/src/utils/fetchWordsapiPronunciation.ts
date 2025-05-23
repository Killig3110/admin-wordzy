import axios from 'axios';

const WORDS_API_KEY = 'ff27feaa21msh2ae781ce6cd9dcbp1e9ec9jsndcadbb947c33';
const WORDS_API_HOST = 'wordsapiv1.p.rapidapi.com';

export async function fetchWordsapiPronunciation(word: string): Promise<{ waPron: string, waAudio: string }> {
    const url = `https://${WORDS_API_HOST}/words/${word}/pronunciation`;
    const headers = {
        'X-RapidAPI-Key': WORDS_API_KEY,
        'X-RapidAPI-Host': WORDS_API_HOST,
    };

    try {
        const res = await axios.get(url, { headers });
        let pron = res.data.pronunciation;

        if (typeof pron === 'object') {
            pron = pron.all || Object.values(pron)[0];
        }

        return { waPron: pron || '', waAudio: '' }; // WordsAPI không có audio
    } catch (err) {
        if (err instanceof Error) {
            console.error('❌ WordsAPI fetch failed:', err.message);
        } else {
            console.error('❌ WordsAPI fetch failed:', err);
        }
        return { waPron: '', waAudio: '' };
    }
}
