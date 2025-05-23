import axios from 'axios';

const OXFORD_APP_ID = 'dd5f28b7';
const OXFORD_APP_KEY = 'c4d7f0b46b1a426e7e1a3316cc117177';
const OXFORD_BASE_URL = 'https://od-api-sandbox.oxforddictionaries.com/api/v2';

export async function fetchOxfordPronunciation(word: string): Promise<{ oxPron: string, oxAudio: string }> {
    const url = `${OXFORD_BASE_URL}/entries/en-gb/${word.toLowerCase()}`;
    const headers = {
        app_id: OXFORD_APP_ID,
        app_key: OXFORD_APP_KEY,
    };

    try {
        const res = await axios.get(url, { headers });
        const lexical = res.data.results?.[0]?.lexicalEntries?.[0];
        const pronunciation = lexical?.pronunciations?.[0] || {};

        const oxPron = pronunciation.phoneticSpelling || '';
        const oxAudio = pronunciation.audioFile || '';

        return { oxPron, oxAudio };
    } catch (err) {
        if (err instanceof Error) {
            console.error('❌ Oxford fetch failed:', err.message);
        } else {
            console.error('❌ Oxford fetch failed:', err);
        }
        return { oxPron: '', oxAudio: '' };
    }
}
