import './ExportPanel.css';

export default function ExportPanel({ pages, generatedImages, onExport, onExportHTML, onPreviewHTML, exporting }) {
    const totalPages = pages.length;
    const generatedCount = Object.keys(generatedImages || {}).length;
    const allGenerated = totalPages > 0 && generatedCount === totalPages;
    const progress = totalPages > 0 ? (generatedCount / totalPages) * 100 : 0;

    return (
        <div className="export-panel">
            <div className="export-progress-section">
                <div className="export-progress-header">
                    <span className="export-progress-label">生成进度</span>
                    <span className="export-progress-count">{generatedCount}/{totalPages}</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <button
                className="btn btn-primary btn-lg export-btn"
                onClick={onExport}
                disabled={!allGenerated || exporting}
            >
                {exporting ? (
                    <>
                        <div className="spinner" />
                        正在导出...
                    </>
                ) : (
                    <>
                        📥 导出 PDF
                    </>
                )}
            </button>

            <button
                className="btn btn-secondary btn-lg export-btn"
                onClick={onExportHTML}
                disabled={!allGenerated}
                title="导出为网页格式 (支持动画和文本复制)"
            >
                🌐 导出 HTML
            </button>

            <button
                className="btn btn-secondary btn-lg export-btn"
                onClick={onPreviewHTML}
                disabled={!allGenerated}
                title="在应用内预览 HTML"
                style={{ marginLeft: '10px' }}
            >
                👁️ 预览 HTML
            </button>

            {!allGenerated && totalPages > 0 && (
                <p className="export-hint">请先生成所有页面后再导出</p>
            )}
        </div>
    );
}
