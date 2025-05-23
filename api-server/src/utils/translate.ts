import axios from 'axios';

export async function translateToVi(text: string): Promise<string> {
    try {
        const res = await axios.get(
            'https://script.google.com/macros/s/AKfycbz8rGXnHGGIoQghisd46hX9eLdwzkWpO8axn7h-nc5HWWs0IQjQ7VoUCA6J4VVhHLwS/exec',
            {
                params: {
                    q: text,
                    sl: 'en',
                    tl: 'vi',
                },
            }
        );
        return res.data || '';
    } catch (e: any) {
        console.error('❌ Translate error:', e.message);
        return '';
    }
}
