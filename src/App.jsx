import { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload.jsx';
import ModelConfig from './components/ModelConfig.jsx';
import TemplatePanel from './components/TemplatePanel.jsx';
import SlideGallery from './components/SlideGallery.jsx';
import PageEditor from './components/PageEditor.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import * as api from './services/api.js';

export default function App() {
  // Global state
  const [sourceText, setSourceText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [pageCount, setPageCount] = useState(8);
  const [pages, setPages] = useState([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [templateId, setTemplateId] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [designStyle, setDesignStyle] = useState('');
  const [detailLevel, setDetailLevel] = useState('brief');
  const [aspectRatio, setAspectRatio] = useState('16:9'); // 'brief' | 'detailed'
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatingPages, setGeneratingPages] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'generate' | 'review'
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sessionIdRef = useRef(Date.now().toString());

  /* Load config from localStorage on init */
  const [modelConfig, setModelConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('aippt_model_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load config', e);
    }
    return {
      textModel: {
        baseUrl: '',
        apiKey: '',
        model: 'claude-opus-4-6',
      },
      imageModel: {
        baseUrl: '',
        apiKey: '',
        model: '',
      },
    };
  });

  /* Save config to localStorage on change */
  useEffect(() => {
    localStorage.setItem('aippt_model_config', JSON.stringify(modelConfig));
  }, [modelConfig]);

  /* Load env config from backend on mount */
  useEffect(() => {
    const loadBackendConfig = async () => {
      try {
        const backendConfig = await api.getConfig();
        setModelConfig(prev => ({
          textModel: {
            ...prev.textModel,
            baseUrl: prev.textModel.baseUrl || backendConfig.textModel.baseUrl || '',
            apiKey: prev.textModel.apiKey || backendConfig.textModel.apiKey || '',
            model: prev.textModel.model || backendConfig.textModel.model || 'claude-opus-4-6',
          },
          imageModel: {
            ...prev.imageModel,
            baseUrl: prev.imageModel.baseUrl || backendConfig.imageModel.baseUrl || '',
            apiKey: prev.imageModel.apiKey || backendConfig.imageModel.apiKey || '',
            model: prev.imageModel.model || backendConfig.imageModel.model || '',
          }
        }));
      } catch (err) {
        // Backend might not support config endpoint yet or network error
        console.warn('Backend config not available:', err);
      }
    };
    loadBackendConfig();
  }, []); // Run once on mount

  // Check if minimum config is set
  const isConfigured = modelConfig.textModel?.apiKey && modelConfig.textModel?.baseUrl && modelConfig.textModel?.model;

  // Custom template handlers
  const handleAddCustomTemplate = useCallback((template) => {
    setCustomTemplates((prev) => [...prev, template]);
  }, []);

  const handleRemoveCustomTemplate = useCallback((id) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handlers
  const handleTextLoaded = useCallback((text, name) => {
    setSourceText(text);
    setSourceName(name);
    setError('');
  }, []);

  const handleSplit = useCallback(async () => {
    if (!sourceText.trim()) return;
    if (!isConfigured) {
      setError('请先点击右上角 ⚙️ 设置 配置文本模型的 API Key、Base URL 和模型名称');
      setSettingsOpen(true);
      return;
    }

    setSplitting(true);
    setError('');

    try {
      const result = await api.splitContent({
        text: sourceText,
        pageCount,
        textModelConfig: modelConfig.textModel,
        templateId,
        detailLevel,
      });

      if (!result || !Array.isArray(result.pages)) {
        throw new Error('返回数据格式错误，请重试');
      }

      setPages(result.pages);
      setSelectedPageIndex(0);
      setGeneratedImages({});
      setGeneratingPages(new Set());
      sessionIdRef.current = Date.now().toString();
      setStep('generate');
    } catch (err) {
      setError('内容拆分失败: ' + err.message);
    } finally {
      setSplitting(false);
    }
  }, [sourceText, pageCount, modelConfig.textModel, templateId, isConfigured, detailLevel]);

  const handleGeneratePage = useCallback(async (index) => {
    setGeneratingPages((prev) => new Set(prev).add(index));
    setError('');

    try {
      const result = await api.generatePage({
        pageData: pages[index],
        pageIndex: index,
        totalPages: pages.length,
        templateId,
        imageModelConfig: modelConfig.imageModel,
        textModelConfig: modelConfig.textModel,
        designStyle,
        sessionId: sessionIdRef.current,
        detailLevel,
        ratio: aspectRatio,
      });

      setGeneratedImages((prev) => ({ ...prev, [index]: result }));
    } catch (err) {
      setError(`第 ${index + 1} 页生成失败: ${err.message}`);
    } finally {
      setGeneratingPages((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, [pages, templateId, modelConfig, designStyle, detailLevel]);

  const handleGenerateAll = useCallback(async () => {
    setStep('review');
    for (let i = 0; i < pages.length; i++) {
      if (!generatedImages[i]) {
        await handleGeneratePage(i);
      }
    }
  }, [pages, generatedImages, handleGeneratePage]);

  const handleRegeneratePage = useCallback(async (index, customPrompt) => {
    setGeneratingPages((prev) => new Set(prev).add(index));
    setError('');

    try {
      const result = await api.regeneratePage({
        pageData: pages[index],
        pageIndex: index,
        totalPages: pages.length,
        templateId,
        imageModelConfig: modelConfig.imageModel,
        textModelConfig: modelConfig.textModel,
        designStyle,
        sessionId: sessionIdRef.current,
        customPrompt,
        detailLevel,
        ratio: aspectRatio,
      });

      setGeneratedImages((prev) => ({ ...prev, [index]: result }));
    } catch (err) {
      setError(`第 ${index + 1} 页重新生成失败: ${err.message}`);
    } finally {
      setGeneratingPages((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, [pages, templateId, modelConfig, designStyle]);

  const handleUpdatePage = useCallback((updatedData) => {
    setPages((prev) => {
      const next = [...prev];
      next[selectedPageIndex] = updatedData;
      return next;
    });
  }, [selectedPageIndex]);

  const handleReorderPages = useCallback((from, to) => {
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setGeneratedImages((prev) => {
      const entries = Object.entries(prev);
      const newMap = {};
      entries.forEach(([key, val]) => {
        let idx = parseInt(key, 10);
        if (idx === from) idx = to;
        else if (from < to && idx > from && idx <= to) idx--;
        else if (from > to && idx >= to && idx < from) idx++;
        newMap[idx] = val;
      });
      return newMap;
    });
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError('');

    try {
      const imagePaths = Object.keys(generatedImages)
        .sort((a, b) => a - b)
        .map((idx) => generatedImages[idx].imageUrl);

      const blob = await api.exportPDF(imagePaths);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const filename = `${sourceName || 'presentation'}_${timestamp}.pdf`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('PDF 导出失败: ' + err.message);
    } finally {
      setExporting(false);
    }
  }, [generatedImages]);

  /* Helper to extract body content and styles from full HTML string */
  const extractBodyContent = (htmlString) => {
    if (!htmlString) return '';
    let content = htmlString;

    // 1. Remove markdown code blocks if present
    content = content
      .trim()
      .replace(/^```html\s*/i, '')
      .replace(/```\s*$/, '');

    // 2. Extract styles
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? `<style>${styleMatch[1]}</style>` : '';

    // 3. Extract body content
    // Try to find content between <body ...> and </body>
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    let bodyContent = '';
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    } else {
      // If no body tag, assume the whole content is the body (minus html/head tags if random shards exist)
      // But safer to just take everything if no body tag found, acting as fallback
      // Ideally remove <html...>, <head...>, <!DOCTYPE...> if they exist but no body tag.
      bodyContent = content
        .replace(/<!DOCTYPE[^>]*>/i, '')
        .replace(/<html[^>]*>/i, '')
        .replace(/<\/html>/i, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/i, '')
        .replace(/<body[^>]*>/i, '') // cleanup stray tags
        .replace(/<\/body>/i, '');
    }

    return styles + bodyContent;
  };

  /* Helper to generate the full HTML string */
  const generateFullHtml = useCallback(() => {
    const sortedKeys = Object.keys(generatedImages).sort((a, b) => a - b);
    if (sortedKeys.length === 0) return null;

    let slidesHtml = '';
    sortedKeys.forEach((key, index) => {
      const pageData = generatedImages[key];
      let content = '';

      if (pageData.htmlContent) {
        content = extractBodyContent(pageData.htmlContent);
      } else if (pageData.imageUrl) {
        content = `<img src="${pageData.imageUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />`;
      }

      slidesHtml += `
          <div class="slide" id="slide-${index}" style="display: ${index === 0 ? 'flex' : 'none'}">
            ${content}
          </div>
        `;
    });

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sourceName || 'AI Presentation'}</title>
  <style>
    body { margin: 0; padding: 0; background: #1a1a1a; font-family: sans-serif; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    .slide-container { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
    .slide { width: 1024px; height: 768px; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
    .controls { height: 60px; background: #000; display: flex; align-items: center; justify-content: center; gap: 20px; color: white; }
    button { padding: 8px 16px; cursor: pointer; background: #333; color: white; border: 1px solid #555; border-radius: 4px; }
    button:hover { background: #444; }
  </style>
</head>
<body>
  <div class="slide-container">
    ${slidesHtml}
  </div>
  <div class="controls">
    <button onclick="prevSlide()">❮ 上一页</button>
    <span id="page-num">1 / ${sortedKeys.length}</span>
    <button onclick="nextSlide()">下一页 ❯</button>
  </div>
  <script>
    let current = 0;
    const total = ${sortedKeys.length};
    
    function showSlide(index) {
        document.querySelectorAll('.slide').forEach(el => el.style.display = 'none');
        document.getElementById('slide-' + index).style.display = 'flex';
        document.getElementById('page-num').innerText = (index + 1) + ' / ' + total;
        current = index;
    }
    
    function nextSlide() {
        if (current < total - 1) showSlide(current + 1);
    }
    
    function prevSlide() {
        if (current > 0) showSlide(current - 1);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;
  }, [generatedImages, sourceName]);

  const handleExportHTML = useCallback(() => {
    try {
      const fullHtml = generateFullHtml();
      if (!fullHtml) return;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const filename = `${sourceName || 'presentation'}_${timestamp}.html`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('HTML 导出失败: ' + err.message);
    }
  }, [generateFullHtml]);

  /* Preview HTML Logic */
  const [previewHtml, setPreviewHtml] = useState(null);

  const handlePreviewHTML = useCallback(() => {
    try {
      const fullHtml = generateFullHtml();
      if (!fullHtml) return;
      setPreviewHtml(fullHtml);
    } catch (err) {
      setError('预览失败: ' + err.message);
    }
  }, [generateFullHtml]);


  const handleReset = () => {
    setSourceText('');
    setSourceName('');
    setPages([]);
    setSelectedPageIndex(0);
    setGeneratedImages({});
    setGeneratingPages(new Set());
    setStep('upload');
    setError('');
  };

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">AI PPT 工作台</span>
          </div>
        </div>
        <div className="header-center">
          <div className="step-indicator">
            {['准备材料', '生成与导出'].map((label, i) => {
              const currentIdx = step === 'upload' ? 0 : 1;
              return (
                <div key={i} className={`step-dot ${i <= currentIdx ? 'active' : ''} ${i === currentIdx ? 'current' : ''}`}>
                  <span className="dot">{i < currentIdx ? '✓' : i + 1}</span>
                  <span className="step-label">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="header-right">
          {step !== 'upload' && (
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              🔄 重新开始
            </button>
          )}
          <button
            className={`btn btn-ghost btn-sm settings-btn ${settingsOpen ? 'active' : ''} ${!isConfigured ? 'unconfigured' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            ⚙️ 模型设置
            {!isConfigured && <span className="config-dot" />}
          </button>
        </div>
      </header>

      {/* Settings Drawer — Model config only */}
      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)} />
      )}
      <div className={`settings-drawer ${settingsOpen ? 'open' : ''}`}>
        <div className="settings-drawer-header">
          <h2>⚙️ 模型配置</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setSettingsOpen(false)}>✕</button>
        </div>
        <div className="settings-drawer-body">
          <ModelConfig
            config={modelConfig}
            onChange={setModelConfig}
            disabled={false}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner animate-fadeIn">
          <span>⚠️ {error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '90%', height: '90%', background: 'white', borderRadius: '8px',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '10px 20px', background: '#333', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>HTML 预览</span>
              <button
                onClick={() => setPreviewHtml(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <iframe
              title="Preview"
              srcDoc={previewHtml}
              style={{ flex: 1, border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {/* Step 1: Upload + Template + Style */}
        {step === 'upload' && (
          <div className="step-content upload-step animate-fadeIn">
            <div className="step-hero">
              <h1>创建你的 AI 演示文稿</h1>
              <p>上传文字材料，选择设计风格，AI 将为你生成精美的演示文稿</p>
              {!isConfigured && (
                <div className="config-alert" onClick={() => setSettingsOpen(true)}>
                  ⚠️ 请先点击右上角 <strong>⚙️ 模型设置</strong> 配置 AI 模型
                </div>
              )}
            </div>

            <div className="upload-main-layout">
              {/* Left: Upload + Design Style + Page count + Generate */}
              <div className="upload-left">
                <div className="card">
                  <h3 className="card-title">📄 上传材料</h3>
                  <FileUpload onTextLoaded={handleTextLoaded} disabled={false} />

                  {sourceText && (
                    <div className="source-loaded animate-fadeIn">
                      <div className="source-info">
                        <span className="badge badge-success">已加载</span>
                        <span className="source-name">{sourceName}</span>
                        <span className="char-count">{sourceText.length.toLocaleString()} 字符</span>
                      </div>
                      <div className="material-preview">
                        {sourceText.substring(0, 300)}...
                      </div>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 className="card-title">🎨 设计风格</h3>
                  <div className="field-group">
                    <textarea
                      className="input"
                      placeholder="描述你期望的 PPT 设计风格，如：现代商务、清新教育、暗色科技、极简扁平、中国风...&#10;&#10;此描述将指导 AI 生成页面的视觉风格，可搭配右侧模版使用"
                      value={designStyle}
                      onChange={(e) => setDesignStyle(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {sourceText && (
                  <div className="upload-actions animate-fadeIn">
                    <div className="page-count-section">
                      <label className="label">PPT 页数</label>
                      <div className="page-count-control">
                        <button className="btn btn-ghost btn-sm" onClick={() => setPageCount(Math.max(2, pageCount - 1))}>−</button>
                        <input
                          type="number"
                          className="input page-count-input"
                          value={pageCount}
                          min={2}
                          max={50}
                          onChange={(e) => setPageCount(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                        />
                        <button className="btn btn-ghost btn-sm" onClick={() => setPageCount(Math.min(50, pageCount + 1))}>+</button>
                      </div>
                    </div>

                    <div className="page-count-section" style={{ marginTop: '16px' }}>
                      <label className="label">内容详略</label>
                      <div className="page-count-control" style={{ background: 'var(--bg-input)', borderRadius: '6px', padding: '4px' }}>
                        <button
                          className={`btn btn-sm ${detailLevel === 'brief' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setDetailLevel('brief')}
                          style={{ flex: 1 }}
                        >
                          简要
                        </button>
                        <button
                          className={`btn btn-sm ${detailLevel === 'detailed' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setDetailLevel('detailed')}
                          style={{ flex: 1 }}
                        >
                          详细
                        </button>
                      </div>
                    </div>

                    <div className="page-count-section" style={{ marginTop: '16px' }}>
                      <label className="label">图片比例</label>
                      <div className="page-count-control" style={{ background: 'var(--bg-input)', borderRadius: '6px', padding: '4px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        {['16:9', '4:3', '1:1', '3:4', '9:16'].map(r => (
                          <button
                            key={r}
                            className={`btn btn-sm ${aspectRatio === r ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setAspectRatio(r)}
                            style={{ fontSize: '12px' }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-lg start-btn"
                      onClick={handleSplit}
                      disabled={splitting || !sourceText.trim()}
                    >
                      {splitting ? (
                        <><div className="spinner" /> AI 正在分析内容...</>
                      ) : (
                        <>🚀 开始生成</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Template selection */}
              <div className="upload-right">
                <div className="card">
                  <h3 className="card-title">🎭 设计模版</h3>
                  <TemplatePanel
                    selectedId={templateId}
                    onSelect={setTemplateId}
                    customTemplates={customTemplates}
                    onAddCustomTemplate={handleAddCustomTemplate}
                    onRemoveCustomTemplate={handleRemoveCustomTemplate}
                    disabled={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 & 3: Generate & Review */}
        {(step === 'generate' || step === 'review') && (
          <div className="step-content workspace-step animate-fadeIn">
            <div className="workspace-layout">
              <div className="workspace-left">
                <SlideGallery
                  pages={pages}
                  selectedIndex={selectedPageIndex}
                  onSelect={setSelectedPageIndex}
                  onReorder={handleReorderPages}
                  generatingPages={generatingPages}
                  generatedImages={generatedImages}
                />
              </div>
              <div className="workspace-right">
                <PageEditor
                  pageData={pages[selectedPageIndex]}
                  pageIndex={selectedPageIndex}
                  totalPages={pages.length}
                  imageInfo={generatedImages[selectedPageIndex]}
                  isGenerating={generatingPages.has(selectedPageIndex)}
                  onUpdate={handleUpdatePage}
                  onRegenerate={handleRegeneratePage}
                  onGenerate={handleGeneratePage}
                />
              </div>
            </div>

            {/* Fixed bottom action bar */}
            <div className="workspace-bottom-bar">
              <div className="bottom-bar-left">
                <ExportPanel
                  pages={pages}
                  generatedImages={generatedImages}
                  onExport={handleExport}
                  onExportHTML={handleExportHTML}
                  onPreviewHTML={handlePreviewHTML}
                  exporting={exporting}
                />
              </div>
              <div className="bottom-bar-right">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleGenerateAll}
                  disabled={generatingPages.size > 0}
                >
                  {generatingPages.size > 0 ? (<><div className="spinner" /> 生成中...</>) : '⚡ 全部生成'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
