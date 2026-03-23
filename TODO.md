# 项目初始化清单

## ✅ 已完成

- [x] 创建项目目录 `/home/cwh/coding/fanyi`
- [x] 编写开发计划 (DEVELOPMENT_PLAN.md)
- [x] 编写项目说明 (README.md)
- [x] 配置 Chrome 扩展 (manifest.json)
- [x] 编写 API 文档 (docs/API.md)
- [x] 初始化 Git 仓库
- [x] 创建初始提交

## 📋 下一步

### 1. 在 GitHub 上创建仓库

访问 https://github.com/new 创建新仓库：
- 仓库名称: `fanyi`
- 描述: LLM Web Translator - Chrome Extension
- 可见性: Public 或 Private（根据需要）
- **不要**勾选 "Initialize this repository with a README"（已本地初始化）

### 2. 推送到 GitHub

创建仓库后，运行：

```bash
cd /home/cwh/coding/fanyi
git remote add origin git@github.com:ahangchen/fanyi.git
git branch -M main
git push -u origin main
```

### 3. 开始开发

参考 `DEVELOPMENT_PLAN.md` 开始实现功能：

#### Phase 1: 基础框架
- [ ] 创建目录结构
  ```bash
  mkdir -p popup options lib styles icons
  ```
- [ ] 创建图标资源
- [ ] 实现文本提取功能 (lib/textExtractor.js)
- [ ] 创建基础 UI

#### Phase 2: 核心功能
- [ ] 实现 LLM API 调用 (lib/translator.js)
- [ ] 实现 DOM 替换逻辑 (lib/domUtils.js)
- [ ] 创建后台脚本 (background.js)
- [ ] 创建内容脚本 (content.js)

#### Phase 3: 用户界面
- [ ] 创建弹出窗口 (popup/)
- [ ] 创建设置页面 (options/)
- [ ] 添加右键菜单
- [ ] 实现快捷键

## 📁 建议的目录结构

```
fanyi/
├── manifest.json           ✅ 已创建
├── DEVELOPMENT_PLAN.md     ✅ 已创建
├── README.md               ✅ 已创建
├── docs/
│   └── API.md             ✅ 已创建
├── background.js          ⏳ 待创建
├── content.js             ⏳ 待创建
├── popup/
│   ├── popup.html         ⏳ 待创建
│   ├── popup.js           ⏳ 待创建
│   └── popup.css          ⏳ 待创建
├── options/
│   ├── options.html       ⏳ 待创建
│   ├── options.js         ⏳ 待创建
│   └── options.css        ⏳ 待创建
├── lib/
│   ├── textExtractor.js   ⏳ 待创建
│   ├── translator.js      ⏳ 待创建
│   └── domUtils.js        ⏳ 待创建
├── styles/
│   └── content.css        ⏳ 待创建
└── icons/
    ├── icon16.png         ⏳ 待创建
    ├── icon48.png         ⏳ 待创建
    └── icon128.png        ⏳ 待创建
```

## 🚀 快速开始命令

```bash
# 创建目录结构
cd /home/cwh/coding/fanyi
mkdir -p popup options lib styles icons

# 创建基础文件
touch background.js content.js
touch popup/popup.html popup/popup.js popup/popup.css
touch options/options.html options/options.js options/options.css
touch lib/textExtractor.js lib/translator.js lib/domUtils.js
touch styles/content.css

# 创建图标（可以使用在线工具生成）
# https://favicon.io/emoji-favicons/
```

## 📚 开发资源

### Chrome 扩展文档
- [Chrome Extensions 官方文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/intro/)

### LLM API 文档
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)

### 示例代码
- [Chrome Extensions Samples](https://github.com/GoogleChrome/chrome-extensions-samples)
- [Translate Extension Example](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/examples/translate)

## ⚡ 开发提示

1. **开发模式加载扩展**
   - Chrome 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `fanyi` 目录

2. **调试技巧**
   - 后台脚本: 扩展页面 → "检查视图: 背景页"
   - 内容脚本: 页面右键 → "检查" → Console
   - 弹出窗口: 右键扩展图标 → "检查弹出内容"

3. **热重载**
   - 修改代码后，在扩展页面点击"刷新"按钮
   - 或使用快捷键 `Ctrl+R` (Windows/Linux) / `Cmd+R` (macOS)

## 🎯 下一个目标

完成 Phase 1 的基础框架搭建，包括：
1. 创建所有必需的目录和文件
2. 实现基础的文本提取功能
3. 创建简单的用户界面
4. 测试扩展是否能正常加载

完成后即可进入 Phase 2，实现核心的翻译功能。
