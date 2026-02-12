import { useState, useRef } from 'react';
import './TemplatePanel.css';

const BUILTIN_TEMPLATES = [
    { id: 'business', name: '商务专业', emoji: '📊', desc: '深蓝配色，简洁专业', colors: ['#0a1628', '#1a365d', '#2b6cb0', '#63b3ed'] },
    { id: 'education', name: '教育培训', emoji: '📚', desc: '明亮色彩，生动活泼', colors: ['#1a1a2e', '#f39c12', '#e74c3c', '#2ecc71'] },
    { id: 'creative', name: '创意设计', emoji: '🎨', desc: '大胆配色，艺术感', colors: ['#0f0f23', '#ff6b6b', '#ffd93d', '#6bcb77'] },
    { id: 'minimal', name: '极简风格', emoji: '⬜', desc: '黑白灰，极简优雅', colors: ['#ffffff', '#f5f5f5', '#333333', '#666666'] },
    { id: 'tech', name: '科技未来', emoji: '🔮', desc: '深色霓虹，科技感', colors: ['#0a0e27', '#1a1a3e', '#00d4ff', '#7c3aed'] },
];

export default function TemplatePanel({ selectedId, onSelect, customTemplates, onAddCustomTemplate, onRemoveCustomTemplate, disabled }) {
    const [showJsonInput, setShowJsonInput] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [jsonError, setJsonError] = useState('');
    const fileInputRef = useRef(null);

    const allTemplates = [...BUILTIN_TEMPLATES, ...(customTemplates || [])];

    const handleAddJson = () => {
        setJsonError('');
        try {
            const parsed = JSON.parse(jsonText);
            // Validate required fields
            if (!parsed.id || !parsed.name) {
                setJsonError('JSON 必须包含 id 和 name 字段');
                return;
            }
            // Ensure no id conflict
            if (allTemplates.some((t) => t.id === parsed.id)) {
                setJsonError(`模版 ID "${parsed.id}" 已存在，请使用不同的 ID`);
                return;
            }
            const template = {
                id: parsed.id,
                name: parsed.name,
                emoji: parsed.emoji || '📄',
                desc: parsed.description || parsed.desc || '自定义模版',
                colors: parsed.colors || ['#333333', '#666666', '#999999', '#cccccc'],
                // Forward all extra fields for AI prompt context
                ...parsed,
            };
            onAddCustomTemplate(template);
            setJsonText('');
            setShowJsonInput(false);
        } catch (e) {
            setJsonError('JSON 格式错误: ' + e.message);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setJsonText(ev.target.result);
            setShowJsonInput(true);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="template-panel">
            {/* No template option */}
            <div
                className={`template-card no-template ${!selectedId ? 'selected' : ''}`}
                onClick={() => !disabled && onSelect(null)}
            >
                <div className="template-preview">
                    <span className="template-emoji">✨</span>
                </div>
                <div className="template-info">
                    <span className="template-name">不使用模版</span>
                    <span className="template-desc">仅根据设计风格描述生成</span>
                </div>
                {!selectedId && <div className="template-check">✓</div>}
            </div>

            <div className="template-grid">
                {allTemplates.map((t) => (
                    <div
                        key={t.id}
                        className={`template-card ${selectedId === t.id ? 'selected' : ''}`}
                        onClick={() => !disabled && onSelect(t.id)}
                    >
                        <div className="template-preview">
                            <div className="template-colors">
                                {(t.colors || []).slice(0, 4).map((c, i) => (
                                    <div key={i} className="color-dot" style={{ background: c }} />
                                ))}
                            </div>
                            <span className="template-emoji">{t.emoji}</span>
                        </div>
                        <div className="template-info">
                            <span className="template-name">{t.name}</span>
                            <span className="template-desc">{t.desc}</span>
                        </div>
                        {selectedId === t.id && <div className="template-check">✓</div>}
                        {/* Delete button for custom templates */}
                        {!BUILTIN_TEMPLATES.some((b) => b.id === t.id) && (
                            <button
                                className="template-delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveCustomTemplate(t.id);
                                    if (selectedId === t.id) onSelect(null);
                                }}
                                title="删除自定义模版"
                            >×</button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add custom template */}
            <div className="template-add-section">
                <div className="template-add-buttons">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowJsonInput(!showJsonInput)}
                        disabled={disabled}
                    >
                        ＋ 输入 JSON
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                    >
                        📂 导入 JSON 文件
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                {showJsonInput && (
                    <div className="json-input-section animate-fadeIn">
                        <textarea
                            className="input json-textarea"
                            value={jsonText}
                            onChange={(e) => { setJsonText(e.target.value); setJsonError(''); }}
                            placeholder={`{
  "id": "my-template",
  "name": "我的模版",
  "emoji": "🌟",
  "description": "自定义风格描述",
  "colors": ["#1a1a2e", "#e94560", "#0f3460", "#533483"],
  "fontFamily": "'Noto Sans SC', sans-serif",
  "layoutStyle": "自由排版",
  "coverStyle": "大标题渐变背景",
  "contentStyle": "卡片式布局"
}`}
                            rows={10}
                        />
                        {jsonError && <p className="json-error">{jsonError}</p>}
                        <div className="json-actions">
                            <button className="btn btn-primary btn-sm" onClick={handleAddJson}>添加模版</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowJsonInput(false); setJsonText(''); setJsonError(''); }}>取消</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
