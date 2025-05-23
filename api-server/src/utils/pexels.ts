import axios from 'axios';

export async function getImageUrlFromPexels(query: string): Promise<string> {
    const apiKey = process.env.PEXELS_API_KEY;
    try {
        const res = await axios.get('https://api.pexels.com/v1/search', {
            headers: { Authorization: apiKey },
            params: { query, per_page: 1 },
        });
        return res.data?.photos?.[0]?.src?.medium || '';
    } catch (e) {
        if (e instanceof Error) {
            console.error('❌ Pexels error:', e.message);
        } else {
            console.error('❌ Pexels error:', e);
        }
        return '';
    }
}
