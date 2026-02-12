import { useState } from 'react';
import './SlideGallery.css';

export default function SlideGallery({
    pages,
    selectedIndex,
    onSelect,
    onReorder,
    generatingPages,
    generatedImages,
}) {
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index && onReorder) {
            onReorder(dragIndex, index);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="slide-gallery">
            <div className="gallery-header">
                <h3>📄 页面列表</h3>
                <span className="page-count">{pages.length} 页</span>
            </div>

            <div className="gallery-grid">
                {pages.map((page, index) => {
                    const isGenerating = generatingPages?.has(index);
                    const imageInfo = generatedImages?.[index];
                    const isSelected = selectedIndex === index;

                    return (
                        <div
                            key={index}
                            className={`slide-thumb ${isSelected ? 'selected' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                            onClick={() => onSelect(index)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="thumb-number">{index + 1}</div>
                            <div className="thumb-preview">
                                {isGenerating ? (
                                    <div className="thumb-loading">
                                        <div className="spinner" />
                                        <span>生成中...</span>
                                    </div>
                                ) : imageInfo?.imageUrl ? (
                                    imageInfo.method === 'html_generation' ? (
                                        <iframe
                                            srcDoc={imageInfo.htmlContent}
                                            className="thumb-iframe"
                                            sandbox=""
                                            title={`Page ${index + 1}`}
                                        />
                                    ) : (
                                        <img src={imageInfo.imageUrl} alt={`Page ${index + 1}`} className="thumb-img" />
                                    )
                                ) : (
                                    <div className="thumb-placeholder">
                                        <span className="thumb-title">{page.title}</span>
                                        {page.keyPoints?.length > 0 && (
                                            <ul className="thumb-points">
                                                {page.keyPoints.slice(0, 2).map((p, i) => (
                                                    <li key={i}>{p}</li>
                                                ))}
                                                {page.keyPoints.length > 2 && <li>...</li>}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                            {imageInfo && !isGenerating && (
                                <div className="thumb-status">
                                    <span className="badge badge-success">已生成</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
