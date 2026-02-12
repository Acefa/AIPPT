import { Router } from 'express';
import { mergeImagesToPDF } from '../services/pdfMerge.js';

const router = Router();

/**
 * POST /api/export/pdf
 * 将多张页面图片合并为 PDF 下载
 */
router.post('/pdf', async (req, res) => {
    try {
        const { imagePaths } = req.body;

        if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
            return res.status(400).json({ error: '请提供页面图片路径列表' });
        }

        const pdfBuffer = await mergeImagesToPDF(imagePaths);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="presentation.pdf"');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
