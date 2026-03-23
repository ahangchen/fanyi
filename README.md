# LLM Web Translator

<div align="center">
  <img src="icons/icon128.png" alt="Logo" width="128" height="128">
  
  <h3>使用自定义 LLM 接口智能翻译网页内容</h3>
  
  <p>
    <a href="#特性">特性</a> •
    <a href="#安装">安装</a> •
    <a href="#使用">使用</a> •
    <a href="#配置">配置</a> •
    <a href="#开发">开发</a>
  </p>
</div>

---

## 📖 项目简介

LLM Web Translator 是一个 Chrome 扩展，利用大语言模型（LLM）对网页内容进行智能翻译。与传统的机器翻译不同，它能够：

- 🎯 **智能识别**: 只翻译页面显示的文本，保留 HTML 标签和代码块
- 🤖 **LLM 驱动**: 使用 GPT-4、Claude 等大模型，翻译更自然、准确
- ⚙️ **高度可定制**: 支持自定义 API 端点，兼容多种 LLM 服务
- 🚀 **快速便捷**: 右键菜单、快捷键，多种翻译方式

---

## ✨ 特性

### 核心功能

- ✅ **智能文本识别**: 自动识别页面可见文本，排除代码和标签
- ✅ **多 LLM 支持**: OpenAI、Anthropic、本地模型（Ollama）
- ✅ **多种翻译模式**: 
  - 选中文字翻译
  - 段落翻译
  - 全页面翻译
- ✅ **对照显示**: 原文和译文对照，方便学习
- ✅ **隐私保护**: 本地处理，不上传敏感数据

### 计划功能

- 🔜 翻译历史记录
- 🔜 自定义术语表
- 🔜 批量翻译优化
- 🔜 多语言支持

---

## 🚀 安装

### 从 Chrome Store 安装（推荐）

*待发布*

### 从源码安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/ahangchen/fanyi.git
   cd fanyi
   ```

2. **加载扩展**
   - 打开 Chrome，访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `fanyi` 目录

3. **配置 API**
   - 点击扩展图标
   - 进入设置页面
   - 填写 API 端点和密钥

---

## 📖 使用

### 基础使用

#### 1. 翻译选中文字

1. 在网页上选中要翻译的文字
2. 右键点击 → "LLM 翻译: 翻译选中文字"
3. 等待翻译完成

#### 2. 翻译整个页面

1. 点击扩展图标
2. 点击"翻译当前页面"按钮
3. 等待翻译完成

#### 3. 悬停翻译

1. 鼠标悬停在翻译后的文字上
2. 自动显示原文

### 快捷键

- `Ctrl+Shift+T` (Windows/Linux)
- `Cmd+Shift+T` (macOS)
  
  翻译当前选中文字

---

## ⚙️ 配置

### API 配置

#### OpenAI

```
API 端点: https://api.openai.com/v1/chat/completions
API Key: sk-xxxxx
模型: gpt-4
```

#### Anthropic (Claude)

```
API 端点: https://api.anthropic.com/v1/messages
API Key: sk-ant-xxxxx
模型: claude-3-5-sonnet-20241022
```

#### 本地模型 (Ollama)

```
API 端点: http://localhost:11434/api/chat
API Key: (留空)
模型: llama2
```

#### 自定义 API

```
API 端点: https://your-api-endpoint.com/v1/chat
API Key: your-api-key
模型: your-model-name
```

### 翻译设置

- **目标语言**: 选择翻译的目标语言
- **翻译模式**: 
  - 标准: 直接替换文本
  - 对照: 显示原文和译文
- **触发方式**:
  - 右键菜单
  - 快捷键
  - 自动翻译

---

## 🛠️ 开发

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/ahangchen/fanyi.git
cd fanyi

# 安装依赖（如果有）
npm install

# 构建（如果有构建步骤）
npm run build

# 在 Chrome 中加载
# 访问 chrome://extensions/
# 加载 fanyi 目录
```

### 项目结构

```
fanyi/
├── manifest.json          # 扩展配置
├── background.js         # 后台脚本
├── content.js            # 内容脚本
├── popup/                # 弹出窗口
├── options/              # 设置页面
├── lib/                  # 工具库
├── styles/               # 样式
├── icons/                # 图标
└── docs/                 # 文档
```

### 调试

1. **查看后台日志**
   - `chrome://extensions/`
   - 找到扩展 → "检查视图: 背景页"

2. **查看内容脚本日志**
   - 在页面上右键 → "检查"
   - Console 标签

---

## 🤝 贡献

欢迎贡献代码、报告 Bug 或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📝 开发计划

查看 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) 了解详细的开发计划和技术设计。

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

- [OpenAI](https://openai.com/) - GPT API
- [Anthropic](https://www.anthropic.com/) - Claude API
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) - 扩展开发文档

---

## 📧 联系方式

- 作者: ahangchen
- Email: cweihang@foxmail.com
- GitHub: [@ahangchen](https://github.com/ahangchen)

---

<div align="center">
  <p>如果这个项目对你有帮助，请给一个 ⭐️ Star！</p>
</div>
