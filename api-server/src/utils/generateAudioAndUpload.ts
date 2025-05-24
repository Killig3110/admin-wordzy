import axios from 'axios';
import ImageKit from 'imagekit';

import dotenv from 'dotenv';
dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function generateAudioAndUpload(text: string, fileName: string): Promise<string> {
    try {
        const voiceIds = [
            'wAGzRVkxKEs8La0lmdrE', // Giọng nam 1
            'dXtC3XhB9GtPusIpNtQx', // Giọng nam 2
        ];

        const randomVoiceId = voiceIds[Math.floor(Math.random() * voiceIds.length)];
        const apiKey = process.env.ELEVENTLABS_API_KEY!;

        // 1. Gọi ElevenLabs để tạo audio buffer
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${randomVoiceId}`,
            {
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                responseType: 'arraybuffer',
            }
        );

        const audioBuffer = Buffer.from(response.data);

        // 2. Upload lên ImageKit để lấy URL công khai
        const result = await imagekit.upload({
            file: audioBuffer,
            fileName: `${fileName}.mp3`,
            folder: '/tts-audio',
            useUniqueFileName: true,
        });

        return result.url;
    } catch (error) {
        console.error('Error generating audio and uploading:', error);
        throw new Error('Failed to generate audio and upload');
    }
}
