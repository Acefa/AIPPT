import { callImageModel, callTextModel } from './aiProxy.js';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 比例 → 像素尺寸映射
 */
const RATIO_DIMENSIONS = {
    '16:9': { width: 1280, height: 720 },
    '4:3': { width: 1024, height: 768 },
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '9:16': { width: 720, height: 1280 },
};

function getDimensions(ratio) {
    return RATIO_DIMENSIONS[ratio] || RATIO_DIMENSIONS['16:9'];
}

/**
 * 图片生成管线
 * 模式1: 使用图片生成模型 (如 Qwen Image / DALL-E)
 * 模式2: 使用文本模型生成 SVG/HTML 然后转换
 */

export async function generatePageImage({
    pageData,
    pageIndex,
    totalPages,
    templateInfo,
    imageModelConfig,
    textModelConfig,
    designStyle,
    sessionId,
    detailLevel,
    ratio,
}) {
    // Build the generation prompt
    const prompt = buildImagePrompt(pageData, pageIndex, totalPages, templateInfo, designStyle, detailLevel, ratio);

    // If image model is configured, use it
    if (imageModelConfig?.apiKey && imageModelConfig?.baseUrl) {
        try {
            const images = await callImageModel({
                ...imageModelConfig,
                prompt,
                size: ratio || '16:9', // Pass ratio (e.g., '16:9') or default
            });

            if (images && images.length > 0) {
                const filename = `page_${sessionId}_${pageIndex}.png`;
                const filepath = path.join(__dirname, '../../generated', filename);
                const localUrl = `/generated/${filename}`;

                if (images[0].b64_json) {
                    // Save base64 image to file
                    writeFileSync(filepath, Buffer.from(images[0].b64_json, 'base64'));
                    return { imageUrl: localUrl, method: 'image_model' };
                } else if (images[0].url) {
                    // Download remote URL to local file
                    try {
                        const imgRes = await fetch(images[0].url);
                        if (imgRes.ok) {
                            const buffer = Buffer.from(await imgRes.arrayBuffer());
                            writeFileSync(filepath, buffer);
                            return { imageUrl: localUrl, method: 'image_model' };
                        }
                    } catch (dlErr) {
                        console.error('Failed to download image, using URL directly:', dlErr.message);
                    }
                    return { imageUrl: images[0].url, method: 'image_model' };
                }
            }
        } catch (err) {
            console.error('Image model failed, falling back to HTML generation:', err.message);
        }
    }

    // Fallback: Use text model to generate an HTML-based slide
    const htmlContent = await generateHTMLSlide(pageData, pageIndex, totalPages, templateInfo, designStyle, textModelConfig, detailLevel, ratio);
    const filename = `page_${sessionId}_${pageIndex}.html`;
    const filepath = path.join(__dirname, '../../generated', filename);
    writeFileSync(filepath, htmlContent);

    return { htmlContent, imageUrl: `/generated/${filename}`, method: 'html_generation' };
}

function buildImagePrompt(pageData, pageIndex, totalPages, templateInfo, designStyle, detailLevel, ratio) {
    const styleDesc = designStyle || '现代商务风格，简洁专业';
    const templateDesc = templateInfo
        ? `设计风格：${templateInfo.name}，主色调：${templateInfo.colors?.join('/')}`
        : '';

    let detailInstructions = '';
    if (detailLevel === 'brief') {
        detailInstructions = '- 内容要点请保持简洁短促\n- 避免大段文字，多用关键词';
    } else if (detailLevel === 'detailed') {
        detailInstructions = '- 内容要点请详细展开\n- 确保信息完整，逻辑严密';
    }

    let prompt = `生成一张PPT幻灯片图片。这是第${pageIndex + 1}页，共${totalPages}页。

标题：${pageData.title}
`;

    if (pageData.keyPoints?.length) {
        prompt += `\n要点：\n${pageData.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    }

    if (pageData.content) {
        prompt += `\n\n内容：${pageData.content}`;
    }

    if (pageData.emphasis) {
        prompt += `\n\n重点强调：${pageData.emphasis}`;
    }

    prompt += `\n\n设计要求：
- 风格：${styleDesc}
- ${templateDesc}
- 布局建议：${pageData.layoutSuggestion || '自动'}
- 使用中文文字
- 幻灯片宽高比 ${ratio || '16:9'}
- 专业的PPT页面设计，图文并茂
${detailInstructions}
${pageIndex === 0 ? '- 这是封面页，需要醒目的大标题' : ''}
${pageIndex === totalPages - 1 ? '- 这是总结页/谢谢页' : ''}`;

    return prompt;
}

async function generateHTMLSlide(pageData, pageIndex, totalPages, templateInfo, designStyle, textModelConfig, detailLevel, ratio) {
    const dims = getDimensions(ratio);
    const colors = templateInfo?.colors || ['#1a1a2e', '#16213e', '#0f3460', '#e94560'];
    const fontFamily = templateInfo?.fontFamily || "'Noto Sans SC', 'Microsoft YaHei', sans-serif";

    let detailInstructions = '内容展示要清晰';
    if (detailLevel === 'brief') {
        detailInstructions = '文本内容要精简，使用要点式表达，避免大段文字';
    } else if (detailLevel === 'detailed') {
        detailInstructions = '文本内容要详实，充分展开论述，确保信息量充足';
    }

    const systemPrompt = `你是一个专业的PPT页面设计师。请生成一个完整的HTML页面，模拟PPT幻灯片的效果。
要求：
1. 页面尺寸固定为 ${dims.width}x${dims.height} 像素（宽高比 ${ratio || '16:9'}）
2. 使用内联CSS样式
3. 设计要现代、专业、美观
4. 主色调：${colors.join(', ')}
5. 字体：${fontFamily}
6. 包含适当的渐变背景、阴影效果
7. 所有文字使用中文
8. 不要使用外部资源（图片可以用CSS渐变/SVG代替）
9. 只返回完整的HTML代码，不要其他文字
10. ${detailInstructions}

这是第${pageIndex + 1}页，共${totalPages}页。
${pageIndex === 0 ? '这是封面页。' : ''}
${pageIndex === totalPages - 1 ? '这是总结/谢谢页。' : ''}`;

    const userMessage = `标题：${pageData.title}
${pageData.keyPoints?.length ? `要点：\n${pageData.keyPoints.join('\n')}` : ''}
${pageData.content ? `内容：${pageData.content}` : ''}
${pageData.emphasis ? `重点：${pageData.emphasis}` : ''}
布局建议：${pageData.layoutSuggestion || '自动'}`;

    const result = await callTextModel({
        ...textModelConfig,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
        maxTokens: 8192,
    });

    // Extract HTML from possible markdown code blocks
    let html = result.trim();
    const htmlMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (htmlMatch) {
        html = htmlMatch[1].trim();
    }

    return html;
}
