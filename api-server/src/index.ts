import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import wordDataRoute from './routes/word-data';
import lessonDataRoute from './routes/lesson-data';

dotenv.config();

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(wordDataRoute);
app.use(lessonDataRoute);

app.get('/api/image', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : '';
    const apiKey = process.env.PEXELS_API_KEY;

    if (!keyword) {
        return res.status(400).json({ error: 'Missing keyword' });
    }

    try {
        const result = await axios.get('https://api.pexels.com/v1/search', {
            headers: { Authorization: apiKey },
            params: { query: keyword, per_page: 5 },
        });

        const photos = result.data.photos;
        const random = photos[Math.floor(Math.random() * photos.length)];
        const imageUrl = random?.src?.medium || '';

        return res.json({ imageUrl });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to fetch image' });
    }
});

app.get('/api/description', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : '';
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!keyword) {
        return res.status(400).json({ error: 'Missing keyword' });
    }

    try {
        const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Write a short (1–2 sentence) English description for a vocabulary topic named "${keyword}".`,
                            },
                        ],
                    },
                ],
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const output = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return res.json({ description: output || '' });
    } catch (err: any) {
        console.error('❌ Gemini error:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to fetch description' });
    }
});




app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
