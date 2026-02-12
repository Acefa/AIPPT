import { useState } from 'react';
import './ModelConfig.css';

const DEFAULT_PROVIDERS = [
    { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    { label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1' },
    { label: 'Gemini (Google)', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
    { label: '自定义', baseUrl: '' },
];

export default function ModelConfig({ config, onChange, disabled }) {
    const [showTextAdvanced, setShowTextAdvanced] = useState(true);
    const [showImageAdvanced, setShowImageAdvanced] = useState(false);

    const updateConfig = (section, field, value) => {
        onChange({
            ...config,
            [section]: {
                ...config[section],
                [field]: value,
            },
        });
    };

    const handleProviderSelect = (section, provider) => {
        if (provider.baseUrl) {
            updateConfig(section, 'baseUrl', provider.baseUrl);
        }
    };

    return (
        <div className="model-config">
            {/* Text Model Section */}
            <div className="model-section">
                <div className="section-header" onClick={() => setShowTextAdvanced(!showTextAdvanced)}>
                    <span className="section-icon">🧠</span>
                    <span className="section-title">文本模型</span>
                    <span className="badge badge-warning">必填</span>
                    <span className={`chevron ${showTextAdvanced ? 'open' : ''}`}>▾</span>
                </div>

                <div className={`section-body ${showTextAdvanced ? 'expanded' : ''}`}>
                    <div className="provider-chips">
                        {DEFAULT_PROVIDERS.map((p) => (
                            <button
                                key={p.label}
                                className={`chip ${config.textModel?.baseUrl === p.baseUrl && p.baseUrl ? 'active' : ''}`}
                                onClick={() => handleProviderSelect('textModel', p)}
                                disabled={disabled}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="field-group">
                        <label className="label">Base URL</label>
                        <input
                            className="input"
                            placeholder="https://api.example.com/v1"
                            value={config.textModel?.baseUrl || ''}
                            onChange={(e) => updateConfig('textModel', 'baseUrl', e.target.value)}
                            disabled={disabled}
                        />
                        <span className="field-hint">支持任何 OpenAI 兼容格式的 API 地址</span>
                    </div>

                    <div className="field-group">
                        <label className="label">API Key</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="sk-..."
                            value={config.textModel?.apiKey || ''}
                            onChange={(e) => updateConfig('textModel', 'apiKey', e.target.value)}
                            disabled={disabled}
                        />
                    </div>

                    <div className="field-group">
                        <label className="label">模型名称</label>
                        <input
                            className="input"
                            placeholder="输入模型名称，如 claude-opus-4-6, gemini-3-pro, gpt-4o ..."
                            value={config.textModel?.model || ''}
                            onChange={(e) => updateConfig('textModel', 'model', e.target.value)}
                            disabled={disabled}
                        />
                        <span className="field-hint">可输入任意模型名称，与你的 API 提供商支持的模型一致即可</span>
                    </div>
                </div>
            </div>

            {/* Image Model Section */}
            <div className="model-section">
                <div className="section-header" onClick={() => setShowImageAdvanced(!showImageAdvanced)}>
                    <span className="section-icon">🎨</span>
                    <span className="section-title">图片模型</span>
                    <span className="badge badge-info">可选</span>
                    <span className={`chevron ${showImageAdvanced ? 'open' : ''}`}>▾</span>
                </div>

                <div className={`section-body ${showImageAdvanced ? 'expanded' : ''}`}>
                    <p className="hint-text">未配置时将使用文本模型生成 HTML 幻灯片作为替代方案</p>

                    <div className="provider-chips">
                        {DEFAULT_PROVIDERS.map((p) => (
                            <button
                                key={`img-${p.label}`}
                                className={`chip ${config.imageModel?.baseUrl === p.baseUrl && p.baseUrl ? 'active' : ''}`}
                                onClick={() => handleProviderSelect('imageModel', p)}
                                disabled={disabled}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="field-group">
                        <label className="label">Base URL</label>
                        <input
                            className="input"
                            placeholder="https://api.example.com/v1"
                            value={config.imageModel?.baseUrl || ''}
                            onChange={(e) => updateConfig('imageModel', 'baseUrl', e.target.value)}
                            disabled={disabled}
                        />
                        <span className="field-hint">支持任何 OpenAI Images API 兼容格式的地址</span>
                    </div>

                    <div className="field-group">
                        <label className="label">API Key</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="sk-..."
                            value={config.imageModel?.apiKey || ''}
                            onChange={(e) => updateConfig('imageModel', 'apiKey', e.target.value)}
                            disabled={disabled}
                        />
                    </div>

                    <div className="field-group">
                        <label className="label">模型名称</label>
                        <input
                            className="input"
                            placeholder="输入模型名称，如 qwen-image-2.0, dall-e-3, gpt-image-1 ..."
                            value={config.imageModel?.model || ''}
                            onChange={(e) => updateConfig('imageModel', 'model', e.target.value)}
                            disabled={disabled}
                        />
                        <span className="field-hint">可输入任意图片生成模型名称</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
