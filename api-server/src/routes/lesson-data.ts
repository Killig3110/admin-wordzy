import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/api/lesson-title', async (req: Request, res: Response): Promise<any> => {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!keyword) return res.status(400).json({ error: 'Missing keyword' });

    try {
        const geminiRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Suggest a short English lesson title for the topic "${keyword}". Return only the title, no explanation.`,
                            },
                        ],
                    },
                ],
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const title = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return res.json({ title: title || '' });
    } catch (err: any) {
        console.error('❌ Gemini lesson title error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch title' });
    }
});

export default router;