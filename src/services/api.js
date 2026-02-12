/**
 * 前端 API 封装层
 */

const BASE = '';

export async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE}/api/files/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || '文件上传失败');
    }

    return res.json();
}

export async function parseText(text, format = 'text') {
    const res = await fetch(`${BASE}/api/files/parse-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, format }),
    });

    if (!res.ok) throw new Error('文本解析失败');
    return res.json();
}

export async function splitContent({ text, pageCount, textModelConfig, templateId, detailLevel }) {
    const res = await fetch(`${BASE}/api/ai/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, pageCount, textModelConfig, templateId, detailLevel }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || '内容拆分失败');
    }

    return res.json();
}

export async function generatePage({
    pageData,
    pageIndex,
    totalPages,
    templateId,
    imageModelConfig,
    textModelConfig,
    designStyle,
    sessionId,
    detailLevel,
    ratio,
}) {
    const res = await fetch(`${BASE}/api/ai/generate-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pageData,
            pageIndex,
            totalPages,
            templateId,
            imageModelConfig,
            textModelConfig,
            designStyle,
            sessionId,
            detailLevel,
            ratio,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || '页面生成失败');
    }

    return res.json();
}

export async function regeneratePage({
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
}) {
    const res = await fetch(`${BASE}/api/ai/regenerate-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || '页面重新生成失败');
    }

    return res.json();
}

export async function exportPDF(imagePaths) {
    const res = await fetch(`${BASE}/api/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'PDF 导出失败');
    }

    return res.blob();
}

export async function getTemplates() {
    const res = await fetch(`${BASE}/api/ai/templates`);
    if (!res.ok) throw new Error('获取模版失败');
    return res.json();
}

export async function checkHealth() {
    try {
        const res = await fetch(`${BASE}/api/health`);
        return res.ok;
    } catch {
        return false;
    }
}

export async function getConfig() {
    const res = await fetch(`${BASE}/api/config`);
    if (!res.ok) throw new Error('获取配置失败');
    return res.json();
}
