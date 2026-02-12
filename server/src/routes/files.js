import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFile } from '../utils/parsers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/markdown',
            'text/plain',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const ext = file.originalname?.split('.').pop()?.toLowerCase();
        const allowedExts = ['md', 'txt', 'pdf', 'docx'];

        if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`不支持的文件格式: ${file.originalname}`));
        }
    },
});

const router = Router();

/**
 * POST /api/files/upload
 * 上传并解析文件
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传文件' });
        }

        const { buffer, mimetype, originalname } = req.file;
        const result = await parseFile(buffer, mimetype, originalname);

        res.json({
            filename: originalname,
            size: buffer.length,
            ...result,
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/files/parse-text
 * 直接解析粘贴的文本内容 (无需上传文件)
 */
router.post('/parse-text', async (req, res) => {
    try {
        const { text, format } = req.body;
        if (!text) {
            return res.status(400).json({ error: '请提供文本内容' });
        }

        let plainText = text;
        if (format === 'markdown') {
            const result = await parseFile(Buffer.from(text), 'text/markdown', 'input.md');
            plainText = result.plainText;
        }

        res.json({ plainText });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
