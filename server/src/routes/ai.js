import { Router } from 'express';
import { splitContent } from '../services/splitter.js';
import { generatePageImage } from '../services/imageGen.js';
import { getTemplateById, getTemplates } from '../services/template.js';

const router = Router();

/**
 * POST /api/ai/split
 * 将文字材料拆分为 N 页内容
 */
router.post('/split', async (req, res) => {
    try {
        const { text, pageCount, textModelConfig, templateId } = req.body;

        if (!text || !pageCount) {
            return res.status(400).json({ error: '请提供文字内容和页数' });
        }

        if (!textModelConfig?.apiKey || !textModelConfig?.baseUrl || !textModelConfig?.model) {
            return res.status(400).json({ error: '请配置文本模型的 API Key、Base URL 和模型名称' });
        }

        const templateInfo = templateId ? getTemplateById(templateId) : null;

        const pages = await splitContent({
            text,
            pageCount: parseInt(pageCount, 10),
            textModelConfig,
            templateInfo,
        });

        res.json({ pages });
    } catch (err) {
        console.error('Split error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/ai/generate-page
 * 为单页生成 PPT 图片
 */
router.post('/generate-page', async (req, res) => {
    try {
        const {
            pageData,
            pageIndex,
            totalPages,
            templateId,
            imageModelConfig,
            textModelConfig,
            designStyle,
            sessionId,
            detailLevel,
        } = req.body;

        if (!pageData) {
            return res.status(400).json({ error: '请提供页面数据' });
        }

        // Need at least one model configured
        if (
            (!imageModelConfig?.apiKey || !imageModelConfig?.baseUrl) &&
            (!textModelConfig?.apiKey || !textModelConfig?.baseUrl)
        ) {
            return res.status(400).json({ error: '请至少配置一个模型（图片模型或文本模型）' });
        }

        const templateInfo = templateId ? getTemplateById(templateId) : null;

        const result = await generatePageImage({
            pageData,
            pageIndex: parseInt(pageIndex, 10),
            totalPages: parseInt(totalPages, 10),
            templateInfo,
            imageModelConfig: imageModelConfig || {},
            textModelConfig: textModelConfig || {},
            designStyle,
            sessionId: sessionId || Date.now().toString(),
            detailLevel,
        });

        res.json(result);
    } catch (err) {
        console.error('Generate page error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/ai/regenerate-page
 * 重新生成指定页面（带自定义提示词）
 */
router.post('/regenerate-page', async (req, res) => {
    try {
        const {
            pageData,
            pageIndex,
            totalPages,
            templateId,
            imageModelConfig,
            textModelConfig,
            designStyle,
            sessionId,
            customPrompt,
            detailLevel,
            ratio,
        } = req.body;

        // Merge custom prompt into page data
        const updatedPageData = { ...pageData };
        if (customPrompt) {
            updatedPageData.content = `${pageData.content}\n\n用户附加要求：${customPrompt}`;
        }

        const templateInfo = templateId ? getTemplateById(templateId) : null;

        const result = await generatePageImage({
            pageData: updatedPageData,
            pageIndex: parseInt(pageIndex, 10),
            totalPages: parseInt(totalPages, 10),
            templateInfo,
            imageModelConfig: imageModelConfig || {},
            textModelConfig: textModelConfig || {},
            designStyle,
            sessionId: sessionId || Date.now().toString(),
            detailLevel,
            ratio,
        });

        res.json(result);
    } catch (err) {
        console.error('Regenerate page error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/ai/templates
 * 获取所有可用模版
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = getTemplates();
        res.json({ templates });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
