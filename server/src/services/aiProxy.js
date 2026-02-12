/**
 * AI 代理服务 — 多格式支持
 * 
 * 文本模型：
 *   - 自动检测 Anthropic 代理 → 使用 /v1/messages 格式
 *   - 其他 → OpenAI 兼容格式 /chat/completions
 *
 * 图片模型：
 *   - 自动检测 DashScope (阿里云/千问) → 原生格式
 *   - 其他 → OpenAI 兼容格式 /images/generations
 */

// =============================================
//  文本模型
// =============================================

/**
 * 判断是否为 Anthropic 原生格式的代理
 * 这类代理使用 /v1/messages 端点
 */
function isAnthropicProxy(baseUrl, model) {
    // 常见的 Anthropic 代理特征
    if (model && model.toLowerCase().includes('claude')) return true;
    if (baseUrl.includes('anthropic.com')) return true;
    if (baseUrl.includes('claude')) return true;
    return false;
}

/**
 * Anthropic Messages API 格式调用
 */
async function callAnthropicTextModel({ baseUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 4096 }) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/v1/messages`;
    console.log(`[AI Proxy] Anthropic text request → ${url} (model: ${model})`);

    // 分离 system 消息和对话消息 (Anthropic 格式要求)
    let system = '';
    const filteredMessages = [];
    for (const msg of messages) {
        if (msg.role === 'system') {
            system += (system ? '\n' : '') + msg.content;
        } else {
            filteredMessages.push({ role: msg.role, content: msg.content });
        }
    }

    const body = {
        model,
        max_tokens: maxTokens,
        messages: filteredMessages,
        temperature,
    };
    if (system) {
        body.system = system;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI Proxy] Anthropic text error (${res.status}):`, errText);
        throw new Error(`文本模型 API 错误 (${res.status}): ${errText}\n请求地址: ${url}`);
    }

    const data = await res.json();

    // Anthropic 响应格式: { content: [{ type: "text", text: "..." }] }
    if (data.content && Array.isArray(data.content)) {
        return data.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('');
    }
    return data.content || '';
}

/**
 * OpenAI 兼容格式调用
 */
async function callOpenAITextModel({ baseUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 4096 }) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/chat/completions`;
    console.log(`[AI Proxy] OpenAI text request → ${url} (model: ${model})`);

    const body = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI Proxy] OpenAI text error (${res.status}):`, errText);
        throw new Error(`文本模型 API 错误 (${res.status}): ${errText}\n请求地址: ${url}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * 统一文本模型调用入口 — 自动检测 API 格式
 */
/**
 * 重试包装器
 */
async function withRetry(fn, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            console.warn(`[AI Proxy] Request failed (attempt ${i + 1}/${retries}): ${err.message}`);
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay * (i + 1))); // Exponential backoff-ish
            }
        }
    }
    throw lastError;
}

/**
 * 统一文本模型调用入口 — 自动检测 API 格式
 */
export async function callTextModel({ baseUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 4096 }) {
    return withRetry(async () => {
        if (isAnthropicProxy(baseUrl, model)) {
            return await callAnthropicTextModel({ baseUrl, apiKey, model, messages, temperature, maxTokens });
        }
        return await callOpenAITextModel({ baseUrl, apiKey, model, messages, temperature, maxTokens });
    });
}

// =============================================
//  图片模型
// =============================================

function isDashScope(baseUrl) {
    return baseUrl.includes('dashscope.aliyuncs.com');
}

function isModelScope(baseUrl) {
    return baseUrl.includes('modelscope.cn');
}

/**
 * ModelScope 异步图片生成 (Tongyi-MAI/Z-Image)
 */
async function callModelScopeImage({ baseUrl, apiKey, model, prompt, size = '1024x768' }) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/v1/images/generations`;
    console.log(`[AI Proxy] ModelScope image request → ${url} (model: ${model})`);

    const resolutionMap = {
        '16:9': '1664*928',
        '4:3': '1472*1104',
        '1:1': '1328*1328',
        '3:4': '1104*1472',
        '9:16': '928*1664'
    };

    // If size is a ratio key (e.g. "16:9"), map it; otherwise use as-is (e.g. "1024x768" or default)
    // For ModelScope Z-Image, default to 16:9 (1664*928) if not specified or unknown
    const mappedSize = resolutionMap[size] || (size.includes('*') ? size : '1664*928');

    const body = {
        model, // e.g., 'Tongyi-MAI/Z-Image'
        prompt,
        parameters: {
            size: mappedSize
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-ModelScope-Async-Mode': 'true', // Async mode
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI Proxy] ModelScope image error (${res.status}):`, errText);
        throw new Error(`ModelScope 图片 API 错误 (${res.status}): ${errText}\n请求地址: ${url}`);
    }

    const data = await res.json();
    const taskId = data.task_id;

    if (!taskId) {
        throw new Error('ModelScope 响应未包含 task_id');
    }

    console.log(`[AI Proxy] ModelScope async task started: ${taskId}`);
    return await pollModelScopeTask(cleanBase, apiKey, taskId);
}

async function pollModelScopeTask(baseUrl, apiKey, taskId) {
    const taskUrl = `${baseUrl}/v1/tasks/${taskId}`;

    // Poll for up to 2 minutes
    for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const res = await fetch(taskUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-ModelScope-Task-Type': 'image_generation'
            },
        });

        if (!res.ok) {
            console.warn(`[AI Proxy] Poll failed (${res.status}), retrying...`);
            continue;
        }

        const data = await res.json();
        const status = data.task_status;

        if (status === 'SUCCEED') {
            if (data.output_images && data.output_images.length > 0) {
                return [{ url: data.output_images[0] }];
            }
            throw new Error('ModelScope 任务成功但未返回图片 URL');
        } else if (status === 'FAILED') {
            throw new Error(`ModelScope 任务失败: ${data.message || '未知原因'}`);
        }

        console.log(`[AI Proxy] ModelScope task ${taskId}: ${status} (${i + 1})`);
    }
    throw new Error('ModelScope 任务超时');
}

/**
 * DashScope 原生格式调用 (千问 Qwen Image)
 */
async function callDashScopeImage({ baseUrl, apiKey, model, prompt, size = '1024x768' }) {
    const url = baseUrl.replace(/\/+$/, '');
    console.log(`[AI Proxy] DashScope image request → ${url} (model: ${model})`);

    const body = {
        model,
        input: {
            messages: [
                {
                    role: 'user',
                    content: [{ text: prompt }],
                }
            ],
        },
        parameters: {
            size: size.replace('x', '*'),
        },
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI Proxy] DashScope image error (${res.status}):`, errText);
        throw new Error(`DashScope 图片 API 错误 (${res.status}): ${errText}\n请求地址: ${url}`);
    }

    const data = await res.json();
    console.log(`[AI Proxy] DashScope response keys:`, JSON.stringify(Object.keys(data)));

    // 格式 1: output.choices[].message.content[].image
    if (data.output?.choices) {
        const content = data.output.choices[0]?.message?.content;
        if (Array.isArray(content)) {
            for (const item of content) {
                if (item.image) return [{ url: item.image }];
            }
        }
    }

    // 格式 2: output.results[].url
    if (data.output?.results) {
        return data.output.results.map((r) => ({
            url: r.url || undefined,
            b64_json: r.b64_image || undefined,
        }));
    }

    // 格式 3: async task → poll
    if (data.output?.task_id) {
        console.log(`[AI Proxy] DashScope async task: ${data.output.task_id}`);
        return await pollDashScopeTask(apiKey, data.output.task_id);
    }

    console.warn('[AI Proxy] Unknown DashScope response:', JSON.stringify(data).substring(0, 500));
    throw new Error('无法解析 DashScope 响应格式');
}

async function pollDashScopeTask(apiKey, taskId) {
    const taskUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch(taskUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const status = data.output?.task_status;
        if (status === 'SUCCEEDED' && data.output?.results) {
            return data.output.results.map((r) => ({
                url: r.url || undefined,
                b64_json: r.b64_image || undefined,
            }));
        } else if (status === 'FAILED') {
            throw new Error(`DashScope 任务失败: ${data.output?.message || '未知'}`);
        }
        console.log(`[AI Proxy] DashScope task ${taskId}: ${status} (${i + 1})`);
    }
    throw new Error('DashScope 任务超时');
}

/**
 * OpenAI 兼容图片格式调用
 */
async function callOpenAIImage({ baseUrl, apiKey, model, prompt, size = '1024x768', n = 1 }) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/images/generations`;
    console.log(`[AI Proxy] OpenAI image request → ${url} (model: ${model})`);

    const body = { model, prompt, size, n, response_format: 'b64_json' };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI Proxy] OpenAI image error (${res.status}):`, errText);
        throw new Error(`图片模型 API 错误 (${res.status}): ${errText}\n请求地址: ${url}`);
    }

    const data = await res.json();
    return data.data;
}

/**
 * 统一图片模型调用入口 — 自动检测 API 格式
 */
export async function callImageModel({ baseUrl, apiKey, model, prompt, size = '1024x768', n = 1 }) {
    if (isDashScope(baseUrl)) {
        return await callDashScopeImage({ baseUrl, apiKey, model, prompt, size });
    }
    if (isModelScope(baseUrl)) {
        return await callModelScopeImage({ baseUrl, apiKey, model, prompt, size });
    }
    return await callOpenAIImage({ baseUrl, apiKey, model, prompt, size, n });
}
