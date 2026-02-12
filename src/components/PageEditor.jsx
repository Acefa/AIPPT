import { useState } from 'react';
import './PageEditor.css';

export default function PageEditor({
    pageData,
    pageIndex,
    totalPages,
    imageInfo,
    isGenerating,
    onUpdate,
    onRegenerate,
    onGenerate,
}) {
    const [customPrompt, setCustomPrompt] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState(null);

    if (!pageData) {
        return (
            <div className="page-editor empty">
                <div className="empty-state">
                    <span className="empty-icon">👈</span>
                    <p>选择左侧页面进行编辑</p>
                </div>
            </div>
        );
    }

    const handleStartEdit = () => {
        setEditMode(true);
        setEditData({ ...pageData });
    };

    const handleSaveEdit = () => {
        if (editData) {
            onUpdate(editData);
        }
        setEditMode(false);
        setEditData(null);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditData(null);
    };

    const data = editMode ? editData : pageData;

    return (
        <div className="page-editor">
            {/* Header */}
            <div className="editor-header">
                <div className="editor-title-row">
                    <span className="editor-page-badge">第 {pageIndex + 1}/{totalPages} 页</span>
                    {!editMode ? (
                        <button className="btn btn-ghost btn-sm" onClick={handleStartEdit}>
                            ✏️ 编辑
                        </button>
                    ) : (
                        <div className="edit-actions">
                            <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>保存</button>
                            <button className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>取消</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            <div className="editor-preview">
                {isGenerating ? (
                    <div className="preview-loading">
                        <div className="spinner spinner-lg" />
                        <p>AI 正在生成页面...</p>
                    </div>
                ) : imageInfo?.imageUrl ? (
                    imageInfo.method === 'html_generation' ? (
                        <iframe
                            srcDoc={imageInfo.htmlContent}
                            className="preview-iframe"
                            sandbox=""
                            title={`Preview page ${pageIndex + 1}`}
                        />
                    ) : (
                        <img src={imageInfo.imageUrl} alt={`Page ${pageIndex + 1}`} className="preview-img" />
                    )
                ) : (
                    <div className="preview-placeholder">
                        <p>尚未生成图片</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => onGenerate(pageIndex)}
                            disabled={isGenerating}
                        >
                            🎨 生成此页
                        </button>
                    </div>
                )}
            </div>

            {/* Content Fields */}
            <div className="editor-fields">
                <div className="field-group">
                    <label className="label">标题</label>
                    {editMode ? (
                        <input
                            className="input"
                            value={data.title || ''}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        />
                    ) : (
                        <p className="field-value">{data.title}</p>
                    )}
                </div>

                <div className="field-group">
                    <label className="label">要点</label>
                    {editMode ? (
                        <textarea
                            className="input"
                            value={(data.keyPoints || []).join('\n')}
                            onChange={(e) =>
                                setEditData({ ...editData, keyPoints: e.target.value.split('\n').filter(Boolean) })
                            }
                            placeholder="每行一个要点"
                            rows={4}
                        />
                    ) : (
                        <ul className="field-points">
                            {(data.keyPoints || []).map((p, i) => (
                                <li key={i}>{p}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="field-group">
                    <label className="label">内容</label>
                    {editMode ? (
                        <textarea
                            className="input"
                            value={data.content || ''}
                            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                            rows={4}
                        />
                    ) : (
                        <p className="field-value content-value">{data.content}</p>
                    )}
                </div>

                <div className="field-group">
                    <label className="label">强调重点</label>
                    {editMode ? (
                        <input
                            className="input"
                            value={data.emphasis || ''}
                            onChange={(e) => setEditData({ ...editData, emphasis: e.target.value })}
                        />
                    ) : (
                        <p className="field-value emphasis-value">{data.emphasis}</p>
                    )}
                </div>

                <div className="field-group">
                    <label className="label">布局建议</label>
                    {editMode ? (
                        <input
                            className="input"
                            value={data.layoutSuggestion || ''}
                            onChange={(e) => setEditData({ ...editData, layoutSuggestion: e.target.value })}
                        />
                    ) : (
                        <p className="field-value">{data.layoutSuggestion || '自动'}</p>
                    )}
                </div>
            </div>

            {/* Regenerate */}
            {imageInfo && (
                <div className="editor-regenerate">
                    <div className="divider" />
                    <label className="label">重新生成提示词（可选）</label>
                    <textarea
                        className="input"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="添加额外要求，如：增加更多图表、更改配色..."
                        rows={2}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => onRegenerate(pageIndex, customPrompt)}
                        disabled={isGenerating}
                    >
                        🔄 重新生成
                    </button>
                </div>
            )}
        </div>
    );
}
