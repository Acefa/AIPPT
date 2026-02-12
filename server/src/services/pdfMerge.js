import { PDFDocument } from 'pdf-lib';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * PDF 合并服务
 * 将多张页面图片按顺序合并为单个 PDF 文件
 */
export async function mergeImagesToPDF(imagePaths) {
    const pdfDoc = await PDFDocument.create();

    for (const imgPath of imagePaths) {
        let fullPath = imgPath;

        // If it's a relative URL path like /generated/xxx.png
        if (imgPath.startsWith('/generated/')) {
            fullPath = path.join(__dirname, '../../', imgPath);
        }

        if (!existsSync(fullPath)) {
            console.warn(`Image not found: ${fullPath}, skipping.`);
            continue;
        }

        const imageBytes = readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();

        let image;
        if (ext === '.png') {
            image = await pdfDoc.embedPng(imageBytes);
        } else if (ext === '.jpg' || ext === '.jpeg') {
            image = await pdfDoc.embedJpg(imageBytes);
        } else {
            console.warn(`Unsupported image format: ${ext}, skipping.`);
            continue;
        }

        // PPT slide ratio: 4:3 => 1024x768 in points
        const pageWidth = 1024;
        const pageHeight = 768;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Scale image to fit the page
        const { width: imgW, height: imgH } = image;
        const scale = Math.min(pageWidth / imgW, pageHeight / imgH);

        const drawWidth = imgW * scale;
        const drawHeight = imgH * scale;
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        page.drawImage(image, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
        });
    }

    if (pdfDoc.getPageCount() === 0) {
        throw new Error('无法导出 PDF：没有有效的图片页面。当前页面可能为 HTML 格式（图片生成失败导致的回退）。请检查图片模型配置，并在工作区点击【重新生成】以获取图片。');
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
