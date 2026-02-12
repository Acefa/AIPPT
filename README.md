# ⚡ AI PPT 工作台

> 上传文字材料，AI 自动生成精美演示文稿。

AI PPT 工作台是一款基于大语言模型的智能 PPT 生成工具。你只需上传文档或粘贴文本，选择设计风格，AI 就会为你自动拆分内容并逐页生成高质量的演示文稿页面，最终导出为 PDF 或 HTML。

## ✨ 功能特性

- **📄 多格式文档导入** — 支持 PDF、DOCX、TXT 文件上传，也可直接粘贴文本
- **🤖 AI 智能拆分** — 大模型自动分析内容结构，按指定页数智能拆分为幻灯片大纲
- **🎨 逐页生成** — 每页独立生成 HTML 页面或 AI 配图，支持单页生成 / 全部生成
- **🔄 灵活重新生成** — 对任意页面可输入自定义提示词重新生成，精细调控输出
- **🎭 模版与风格系统** — 内置多种设计模版，支持自定义模版上传（PPTX），可自由描述设计风格
- **📐 多种宽高比** — 支持 16:9、4:3、1:1、3:4、9:16 等多种比例
- **📊 内容详略控制** — 简要 / 详细两档，适配不同场景需求
- **🖼️ 幻灯片画廊** — 缩略图预览、拖拽排序、一键选页编辑
- **📤 多格式导出** — PDF 导出、HTML 导出、HTML 在线预览
- **⚙️ 模型配置持久化** — API Key、Base URL、模型名称保存在 localStorage，重启不丢失

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite 7 |
| 后端服务 | Express (Node.js) |
| 文档解析 | mammoth (DOCX)、pdf-parse (PDF) |
| 图片处理 | sharp |
| PDF 合并 | pdf-lib |
| AI 文本模型 | OpenAI 兼容格式 / Anthropic 原生格式，自动检测 |
| AI 图片模型 | OpenAI 兼容 / DashScope / ModelScope，自动检测 |

## 🚀 快速开始

### 前置要求

- **Node.js** ≥ 18
- **npm** ≥ 9
- 一个可用的 AI 文本模型 API（OpenAI 兼容格式或 Anthropic 格式）

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd AIPPT
```

### 2. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd server
npm install
cd ..
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

```env
# 服务端口
PORT=3001

# 文本模型配置 (OpenAI 兼容格式)
TEXT_MODEL_BASE_URL=https://api.openai.com/v1
TEXT_MODEL_API_KEY=your-api-key-here
TEXT_MODEL_NAME=gpt-4

# 图片生成模型配置 (可选)
IMAGE_MODEL_BASE_URL=https://api.openai.com/v1
IMAGE_MODEL_API_KEY=your-api-key-here
IMAGE_MODEL_NAME=dall-e-3
```

> **💡 提示**：也可以在应用内通过右上角 **⚙️ 模型设置** 面板实时配置，配置会自动保存到浏览器 localStorage。

### 4. 启动项目

```bash
# 同时启动前端和后端
npm run dev:all
```

或分别启动：

```bash
# 终端 1 — 前端 (默认 http://localhost:5173)
npm run dev

# 终端 2 — 后端 (默认 http://localhost:3001)
npm run dev:server
```

## 📖 使用流程

```
上传文档 / 粘贴文本
       ↓
选择模版 & 设计风格
       ↓
设置页数、详略、比例
       ↓
  🚀 开始生成
       ↓
AI 拆分内容为大纲
       ↓
逐页生成 / 全部生成
       ↓
 编辑、排序、重新生成
       ↓
导出 PDF / HTML
```

## 📁 项目结构

```
AIPPT/
├── src/                    # 前端源码
│   ├── App.jsx             # 主应用组件
│   ├── components/
│   │   ├── FileUpload      # 文件上传组件
│   │   ├── ModelConfig     # 模型配置面板
│   │   ├── TemplatePanel   # 模版选择面板
│   │   ├── SlideGallery    # 幻灯片缩略图画廊
│   │   ├── PageEditor      # 单页编辑器
│   │   └── ExportPanel     # 导出面板
│   └── services/api.js     # API 请求封装
├── server/                 # 后端服务
│   └── src/
│       ├── index.js        # Express 入口
│       ├── routes/         # API 路由
│       │   ├── ai.js       # AI 生成相关接口
│       │   ├── files.js    # 文件上传解析
│       │   ├── export.js   # PDF 导出
│       │   └── config.js   # 配置接口
│       └── services/       # 业务逻辑
│           ├── aiProxy.js  # AI 模型调用代理
│           ├── imageGen.js # 图片生成服务
│           ├── splitter.js # 内容拆分服务
│           ├── pdfMerge.js # PDF 合并
│           └── template.js # 模版管理
├── .env.example            # 环境变量模板
├── package.json            # 前端依赖
└── vite.config.js          # Vite 配置
```

## 🔌 支持的 AI 服务

### 文本模型
- ✅ OpenAI 兼容格式（GPT、DeepSeek、通义千问等）
- ✅ Anthropic 原生格式（Claude 系列）

### 图片模型
- ✅ OpenAI 兼容格式（DALL·E 等）
- ✅ 阿里云 DashScope（通义万相等）
- ✅ ModelScope（Z-Image 等）

## 📜 License

MIT
