import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({
        textModel: {
            baseUrl: process.env.TEXT_MODEL_BASE_URL || process.env.ANTHROPIC_BASE_URL || '',
            apiKey: process.env.TEXT_MODEL_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '',
            model: process.env.TEXT_MODEL_NAME || 'claude-opus-4-6',
        },
        imageModel: {
            baseUrl: process.env.IMAGE_MODEL_BASE_URL || '',
            apiKey: process.env.IMAGE_MODEL_API_KEY || '',
            model: process.env.IMAGE_MODEL_NAME || '',
        },
    });
});

export default router;
