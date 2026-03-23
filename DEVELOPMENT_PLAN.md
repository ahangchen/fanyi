# LLM 网页翻译插件 - 开发计划

## 📋 项目概述

**项目名称**: LLM Web Translator  
**项目目标**: 开发一个 Chrome 插件，使用自定义 LLM 接口对网页进行智能翻译  
**核心特性**:
- ✅ 只翻译页面显示的文本内容
- ✅ 保留 HTML 标签和代码块不变
- ✅ 支持自定义 LLM API（OpenAI、Claude、本地模型等）
- ✅ 右键菜单快速翻译
- ✅ 选中文字即时翻译
- ✅ 全页面翻译

---

## 🎯 功能需求

### 核心功能

#### 1. **文本识别与过滤**
- 识别页面中的可见文本节点
- 过滤掉以下内容：
  - HTML 标签属性
  - `<script>` 标签内容
  - `<style>` 标签内容
  - 代码块（`<pre>`, `<code>`）
  - 特殊标签（`<textarea>`, `<input>`）
- 只翻译用户可见的文本

#### 2. **LLM 接口集成**
- 支持自定义 API 端点
- 支持多种 LLM 提供商：
  - OpenAI (GPT-3.5/GPT-4)
  - Anthropic (Claude)
  - 本地模型 (Ollama, LM Studio)
  - 自定义 API
- API Key 管理
- 请求频率控制

#### 3. **翻译模式**
- **选中翻译**: 选中文字后右键翻译
- **段落翻译**: 鼠标悬停显示翻译
- **全页翻译**: 一键翻译整个页面
- **对照翻译**: 显示原文和译文对照

#### 4. **用户体验**
- 右键菜单集成
- 快捷键支持
- 翻译进度显示
- 错误提示
- 翻译历史记录

---

## 🏗️ 技术架构

### 项目结构

```
fanyi/
├── manifest.json           # Chrome 扩展配置
├── background.js          # 后台脚本（API 调用）
├── content.js             # 内容脚本（DOM 操作）
├── popup/                 # 弹出窗口
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/               # 设置页面
│   ├── options.html
│   ├── options.js
│   └── options.css
├── lib/                   # 工具库
│   ├── textExtractor.js   # 文本提取
│   ├── translator.js      # 翻译引擎
│   └── domUtils.js        # DOM 工具
├── styles/                # 样式文件
│   └── content.css
├── icons/                 # 图标资源
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── docs/                  # 文档
│   ├── API.md            # API 文档
│   └── USAGE.md          # 使用说明
└── README.md
```

### 技术栈

- **Manifest Version**: V3（最新标准）
- **前端**: Vanilla JavaScript / TypeScript
- **样式**: CSS3
- **API**: Fetch API / Axios
- **存储**: Chrome Storage API
- **消息**: Chrome Runtime API

---

## 📝 详细设计

### 1. 文本提取算法

```javascript
// 需要排除的标签
const EXCLUDE_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'];

// 提取可见文本节点
function extractTextNodes(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // 排除特定标签
        if (EXCLUDE_TAGS.includes(node.parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        // 排除空白文本
        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        // 检查是否可见
        const style = window.getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
}
```

### 2. LLM 翻译接口

```javascript
// 翻译请求
async function translateWithLLM(text, targetLang = 'zh') {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的翻译助手。请将用户提供的文本翻译成中文，保持原有的格式和结构。只返回翻译结果，不要添加任何解释。'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 3. DOM 替换策略

```javascript
// 替换文本节点
function replaceTextNode(node, translatedText) {
  const parent = node.parentNode;
  
  // 保留原始节点作为备份
  const originalNode = node.cloneNode(true);
  originalNode.setAttribute('data-original', node.textContent);
  
  // 创建新节点
  const newNode = document.createElement('span');
  newNode.className = 'llm-translated';
  newNode.textContent = translatedText;
  newNode.setAttribute('data-original-text', node.textContent);
  
  // 添加悬停效果
  newNode.addEventListener('mouseenter', () => {
    // 显示原文
  });
  
  parent.replaceChild(newNode, node);
}
```

---

## 🔌 Chrome 扩展配置

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "LLM Web Translator",
  "version": "1.0.0",
  "description": "使用自定义 LLM 接口智能翻译网页内容",
  "permissions": [
    "activeTab",
    "contextMenus",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["styles/content.css"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options/options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## 🎨 UI/UX 设计

### 弹出窗口 (Popup)

```
┌─────────────────────────────┐
│  LLM 网页翻译器             │
├─────────────────────────────┤
│  当前语言: 自动检测         │
│  目标语言: 中文             │
│                             │
│  [翻译当前页面]             │
│  [翻译选中文字]             │
│                             │
│  API 状态: ✅ 已连接        │
│  模型: GPT-4                │
│                             │
│  [⚙️ 设置]                  │
└─────────────────────────────┘
```

### 设置页面 (Options)

```
┌─────────────────────────────────────┐
│  LLM 翻译器设置                     │
├─────────────────────────────────────┤
│  API 配置                           │
│  ┌─────────────────────────────────┐│
│  │ API 端点: [                    ]││
│  │ API Key:  [••••••••••••]       ││
│  │ 模型:     [GPT-4          ▼]  ││
│  └─────────────────────────────────┘│
│                                     │
│  翻译设置                           │
│  ┌─────────────────────────────────┐│
│  │ 目标语言: [中文            ▼]  ││
│  │ 翻译模式: ○ 全页  ○ 选中       ││
│  │ 显示原文: ☑ 悬停时显示         ││
│  └─────────────────────────────────┘│
│                                     │
│  [测试连接]  [保存设置]             │
└─────────────────────────────────────┘
```

---

## 🚀 开发阶段

### Phase 1: 基础框架 (Week 1)
- [ ] 创建项目结构
- [ ] 配置 manifest.json
- [ ] 实现文本提取功能
- [ ] 基础 UI 框架

### Phase 2: 核心功能 (Week 2)
- [ ] 实现 LLM API 调用
- [ ] 文本翻译功能
- [ ] DOM 替换逻辑
- [ ] 错误处理

### Phase 3: 用户交互 (Week 3)
- [ ] 右键菜单集成
- [ ] 选中文字翻译
- [ ] 全页翻译
- [ ] 进度显示

### Phase 4: 设置与优化 (Week 4)
- [ ] 设置页面
- [ ] API Key 管理
- [ ] 性能优化
- [ ] 用户体验改进

### Phase 5: 测试与发布 (Week 5)
- [ ] 功能测试
- [ ] 兼容性测试
- [ ] 打包发布
- [ ] 文档完善

---

## 📊 技术难点

### 1. **文本节点识别**
- **难点**: 准确识别需要翻译的文本，排除代码和标签
- **方案**: 使用 TreeWalker + 白名单策略

### 2. **保持页面结构**
- **难点**: 翻译后保持原有的 HTML 结构和样式
- **方案**: 只替换文本节点，不修改 DOM 结构

### 3. **API 限流**
- **难点**: 避免频繁调用 API 导致限流
- **方案**: 
  - 批量翻译（合并多个文本节点）
  - 请求队列管理
  - 本地缓存

### 4. **性能优化**
- **难点**: 大型页面翻译性能
- **方案**:
  - 虚拟滚动（只翻译可见区域）
  - 懒加载
  - Web Worker

---

## 🔐 安全考虑

1. **API Key 存储**
   - 使用 Chrome Storage API 加密存储
   - 不在代码中硬编码

2. **内容安全**
   - 使用 CSP (Content Security Policy)
   - 防止 XSS 攻击

3. **隐私保护**
   - 不收集用户数据
   - 本地处理敏感信息

---

## 📦 依赖库

### 必需
- 无（使用原生 JavaScript）

### 可选
- `mark.js` - 文本高亮
- `turndown` - HTML 转 Markdown（用于代码块识别）

---

## 🧪 测试计划

### 单元测试
- 文本提取功能
- API 调用逻辑
- DOM 操作

### 集成测试
- 完整翻译流程
- 多种页面类型（新闻、文档、代码仓库）
- 不同 LLM 提供商

### 用户测试
- 易用性测试
- 性能测试
- 兼容性测试

---

## 📚 参考资源

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)

---

## 🎯 成功指标

1. **功能完整性**
   - ✅ 支持至少 3 种 LLM 提供商
   - ✅ 准确识别并翻译可见文本
   - ✅ 保留 HTML 结构和代码块

2. **性能指标**
   - 单段落翻译 < 2 秒
   - 全页翻译（50 个段落）< 30 秒
   - 内存占用 < 50MB

3. **用户体验**
   - 安装后 5 分钟内完成首次翻译
   - 用户满意度 > 4.5/5.0

---

## 📅 时间线

| 阶段 | 时间 | 里程碑 |
|------|------|--------|
| Phase 1 | Week 1 | 基础框架完成 |
| Phase 2 | Week 2 | 核心功能可用 |
| Phase 3 | Week 3 | 用户交互完成 |
| Phase 4 | Week 4 | 设置页面完成 |
| Phase 5 | Week 5 | 发布到 Chrome Store |

---

## 🤝 贡献指南

待补充...

---

## 📄 许可证

MIT License

---

**创建时间**: 2026-03-23  
**最后更新**: 2026-03-23  
**负责人**: ahangchen
