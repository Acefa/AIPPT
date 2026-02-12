import { marked } from 'marked';

/**
 * 文件解析工具
 * 支持 Markdown, Word (.docx), PDF 格式
 */

export async function parseMarkdown(buffer) {
    const text = buffer.toString('utf-8');
    // Strip markdown formatting to get plain text for AI processing
    const html = marked(text);
    // Simple HTML to text conversion
    const plainText = html
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return { rawMarkdown: text, plainText };
}

export async function parseWord(buffer) {
    const mammoth = await import('mammoth');
    const result = await mammoth.default.extractRawText({ buffer });
    return { plainText: result.value };
}

export async function parsePDF(buffer) {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return { plainText: data.text };
}

export async function parseFile(buffer, mimetype, originalname) {
    const ext = originalname?.split('.').pop()?.toLowerCase();

    if (mimetype === 'text/markdown' || ext === 'md') {
        return parseMarkdown(buffer);
    }

    if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        ext === 'docx'
    ) {
        return parseWord(buffer);
    }

    if (mimetype === 'application/pdf' || ext === 'pdf') {
        return parsePDF(buffer);
    }

    // Try as plain text
    if (mimetype?.startsWith('text/') || ext === 'txt') {
        return { plainText: buffer.toString('utf-8') };
    }

    throw new Error(`Unsupported file format: ${mimetype || ext}`);
}
