import { callTextModel } from './aiProxy.js';

/**
 * 内容拆分服务
 * 使用文本 AI 模型将材料智能拆分为 N 页内容
 */
export async function splitContent({ text, pageCount, textModelConfig, templateInfo, detailLevel }) {
    const templateContext = templateInfo
        ? `\n\n模版风格参考：${templateInfo.name}，配色：${templateInfo.colors?.join(', ')}，布局风格：${templateInfo.layoutStyle}`
        : '';

    let contentRequirement = '3. content: 详细内容（用于在页面上展示的核心文字，请确保内容充实，不要过于简略）';
    if (detailLevel === 'brief') {
        contentRequirement = '3. content: 简要内容（用于在页面上展示的核心文字，请保持简洁，提炼核心观点，避免冗长）';
    } else if (detailLevel === 'detailed') {
        contentRequirement = '3. content: 详细内容（用于在页面上展示的核心文字，请尽可能详细，解释深入，提供充分的论据或描述）';
    }

    const systemPrompt = `你是一个专业的PPT内容策划师。你的任务是将用户提供的文字材料拆分成${pageCount}页PPT的内容。
每一页需要包含：
1. title: 页面标题（简洁有力）
2. keyPoints: 要点列表（3-5个要点）
3. ${contentRequirement}
4. emphasis: 强调重点（该页最重要的一句话或关键词）
5. layoutSuggestion: 布局建议（如"左图右文"、"全图背景+文字覆盖"、"数据图表"等）
6. ${templateContext}

请确保：
- 第1页为封面页，包含主标题和副标题
- 最后1页为总结页
- 内容分配均匀，逻辑连贯
- 所有文字内容使用中文

请以JSON数组格式返回，不要包含其他文字。`;

    const userMessage = `以下是需要拆分为${pageCount}页PPT的文字材料：\n\n${text}`;

    try {
        const result = await callTextModel({
            ...textModelConfig,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            maxTokens: 16384,
        });

        // Parse JSON from the response (handle markdown code blocks and extra text)
        let jsonStr = result.trim();

        // 1. Try to unwrap markdown code blocks first
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
            jsonStr = match[1].trim();
        }

        // 2. Locate the array boundaries directly
        const startIndex = jsonStr.indexOf('[');
        const endIndex = jsonStr.lastIndexOf(']');

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        } else if (startIndex !== -1) {
            // Array was started but not closed (truncated response)
            jsonStr = jsonStr.substring(startIndex);
        }

        // 3. Try parsing directly first
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[Splitter] Direct parse failed, attempting repair:', e.message);
        }

        // 4. Attempt to repair truncated JSON
        const repaired = repairTruncatedJSON(jsonStr);
        try {
            const parsed = JSON.parse(repaired);
            console.log(`[Splitter] JSON repaired successfully, got ${parsed.length} pages`);
            return parsed;
        } catch (e2) {
            throw new Error(`Failed to parse AI response as JSON: ${e2.message}\nResponse (first 500 chars): ${jsonStr.substring(0, 500)}`);
        }
    } catch (error) {
        console.error('Split error:', error);
        console.error('Split error stack:', error.stack);
        if (error.cause) console.error('Split error cause:', error.cause);
        throw error;
    }
}

/**
 * 尝试修复被截断的 JSON 数组
 * 当 AI 返回的 JSON 因 token 限制被截断时：
 * 策略1：截取到最后一个完整对象，并补全括号
 * 策略2：如无完整对象，截取到最后一个完整属性，补全 }]
 */
function repairTruncatedJSON(jsonStr) {
    let str = jsonStr.trim();

    let lastCompleteObj = -1;      // 最后一个完整 {} 对象的 } 位置
    let lastPropertyComma = -1;    // 对象内属性间逗号的位置
    let braceDepth = 0;
    let bracketDepth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (ch === '\\' && inString) {
            escapeNext = true;
            continue;
        }

        if (ch === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (ch === '[') bracketDepth++;
        if (ch === ']') bracketDepth--;
        if (ch === '{') braceDepth++;
        if (ch === '}') {
            braceDepth--;
            if (braceDepth === 0) {
                lastCompleteObj = i;
            }
        }

        // 属性间的逗号 (在顶层数组的对象内部, braceDepth=1, bracketDepth=1)
        if (ch === ',' && braceDepth === 1 && bracketDepth === 1) {
            lastPropertyComma = i;
        }
    }

    // 策略1：存在完整对象 → 截取到最后一个完整对象
    if (lastCompleteObj > 0) {
        str = str.substring(0, lastCompleteObj + 1);
        if (!str.endsWith(']')) {
            str = str.replace(/,\s*$/, '');
            str += ']';
        }
        if (!str.startsWith('[')) {
            str = '[' + str;
        }
        return str;
    }

    // 策略2：无完整对象，但存在完整属性 → 截取到最后一个属性逗号前，补全 }]
    if (lastPropertyComma > 0) {
        console.log(`[Splitter] Repair strategy 2: truncating at property comma position ${lastPropertyComma}`);
        str = str.substring(0, lastPropertyComma);
        str += '}]';
        if (!str.startsWith('[')) {
            str = '[' + str;
        }
        return str;
    }

    return str;
}

