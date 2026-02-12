import { useState, useRef } from 'react';
import './FileUpload.css';

export default function FileUpload({ onTextLoaded, disabled }) {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [textMode, setTextMode] = useState('file'); // 'file' | 'paste'
    const [pasteText, setPasteText] = useState('');
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        setFileName(file.name);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || '上传失败');
            }

            const data = await res.json();
            onTextLoaded(data.plainText || data.rawMarkdown, file.name);
        } catch (err) {
            alert('文件解析失败: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    };

    const handlePaste = () => {
        if (pasteText.trim()) {
            onTextLoaded(pasteText.trim(), '粘贴文本');
        }
    };

    return (
        <div className="file-upload-container">
            <div className="file-upload-tabs">
                <button
                    className={`tab-btn ${textMode === 'file' ? 'active' : ''}`}
                    onClick={() => setTextMode('file')}
                >
                    📁 上传文件
                </button>
                <button
                    className={`tab-btn ${textMode === 'paste' ? 'active' : ''}`}
                    onClick={() => setTextMode('paste')}
                >
                    📋 粘贴文本
                </button>
            </div>

            {textMode === 'file' ? (
                <div
                    className={`drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md,.txt,.pdf,.docx"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                        style={{ display: 'none' }}
                    />

                    {uploading ? (
                        <div className="upload-status">
                            <div className="spinner" />
                            <p>正在解析 {fileName}...</p>
                        </div>
                    ) : fileName ? (
                        <div className="upload-status success">
                            <span className="upload-icon">✅</span>
                            <p>{fileName}</p>
                            <span className="upload-hint">点击重新上传</span>
                        </div>
                    ) : (
                        <div className="upload-status">
                            <span className="upload-icon">📤</span>
                            <p>拖拽文件到此处</p>
                            <span className="upload-hint">支持 Markdown、Word、PDF 格式</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="paste-zone">
                    <textarea
                        className="input paste-textarea"
                        placeholder="在此粘贴 Markdown 或纯文本内容..."
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        disabled={disabled}
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handlePaste}
                        disabled={!pasteText.trim() || disabled}
                    >
                        确认文本
                    </button>
                </div>
            )}
        </div>
    );
}
