import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 模版引擎
 * 加载 JSON 模版定义，将模版信息融入生成提示词
 */

// 内置模版定义
const builtinTemplates = {
    business: {
        id: 'business',
        name: '商务专业',
        description: '深蓝配色，简洁专业的商务风格',
        colors: ['#0a1628', '#1a365d', '#2b6cb0', '#63b3ed', '#ffffff'],
        fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
        layoutStyle: '对称均衡，留白充足，数据可视化',
        coverStyle: '大标题居中，副标题下方，渐变背景',
        contentStyle: '左侧标题栏 + 右侧内容区',
        thumbnail: '📊',
    },
    education: {
        id: 'education',
        name: '教育培训',
        description: '明亮色彩，生动活泼的教育风格',
        colors: ['#1a1a2e', '#f39c12', '#e74c3c', '#2ecc71', '#ffffff'],
        fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
        layoutStyle: '图文混排，多色块分区，互动感强',
        coverStyle: '活泼的标题设计，配合图标或插画',
        contentStyle: '卡片式布局，要点突出',
        thumbnail: '📚',
    },
    creative: {
        id: 'creative',
        name: '创意设计',
        description: '大胆配色，不规则排版的创意风格',
        colors: ['#0f0f23', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'],
        fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
        layoutStyle: '不规则排版，大面积色块，艺术感',
        coverStyle: '冲击力强的视觉设计，大字体',
        contentStyle: '自由排版，创意图形元素',
        thumbnail: '🎨',
    },
    minimal: {
        id: 'minimal',
        name: '极简风格',
        description: '黑白灰为主，极简优雅',
        colors: ['#ffffff', '#f5f5f5', '#333333', '#666666', '#000000'],
        fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
        layoutStyle: '大面积留白，极简排版',
        coverStyle: '纯文字，极简设计',
        contentStyle: '单栏排版，文字为主',
        thumbnail: '⬜',
    },
    tech: {
        id: 'tech',
        name: '科技未来',
        description: '深色背景，霓虹色调的科技风格',
        colors: ['#0a0e27', '#1a1a3e', '#00d4ff', '#7c3aed', '#10b981'],
        fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
        layoutStyle: '网格+光效，数据可视化风格',
        coverStyle: '深色背景+发光文字效果',
        contentStyle: '卡片+网格布局，渐变高亮',
        thumbnail: '🔮',
    },
};

export function getTemplates() {
    // Return builtin templates
    return Object.values(builtinTemplates);
}


export function getTemplateById(id) {
    return builtinTemplates[id] || null;
}

export function getTemplatePromptContext(template) {
    if (!template) return '';

    return `
PPT模版设计规范：
- 模版名称：${template.name}
- 设计描述：${template.description}
- 主色调：${template.colors.join(', ')}
- 字体：${template.fontFamily}
- 布局风格：${template.layoutStyle}
- 封面风格：${template.coverStyle}
- 内页风格：${template.contentStyle}

请严格按照以上模版规范来设计每一页的视觉效果，保持统一的设计风格。`;
}
