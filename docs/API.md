# API 配置文档

## 支持的 LLM 提供商

### 1. OpenAI (GPT-4)

**API 端点**: `https://api.openai.com/v1/chat/completions`

**请求格式**:
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的翻译助手..."
    },
    {
      "role": "user",
      "content": "要翻译的文本"
    }
  ],
  "temperature": 0.3
}
```

**响应格式**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "翻译结果"
      }
    }
  ]
}
```

---

### 2. Anthropic (Claude)

**API 端点**: `https://api.anthropic.com/v1/messages`

**请求格式**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "要翻译的文本"
    }
  ],
  "system": "你是一个专业的翻译助手..."
}
```

**响应格式**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "翻译结果"
    }
  ]
}
```

---

### 3. 本地模型 (Ollama)

**API 端点**: `http://localhost:11434/api/chat`

**请求格式**:
```json
{
  "model": "llama2",
  "messages": [
    {
      "role": "user",
      "content": "要翻译的文本"
    }
  ],
  "stream": false
}
```

**响应格式**:
```json
{
  "message": {
    "role": "assistant",
    "content": "翻译结果"
  }
}
```

---

## 自定义 API 适配

如果你的 API 格式不同，可以在设置中进行自定义：

### 请求模板

```javascript
{
  "endpoint": "https://your-api.com/v1/chat",
  "headers": {
    "Authorization": "Bearer ${API_KEY}",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "${MODEL}",
    "prompt": "${TEXT}",
    "temperature": 0.3
  }
}
```

### 响应解析

```javascript
{
  "translationPath": "data.result.text"  // JSONPath 到翻译结果
}
```

---

## API 密钥安全

### 存储方式

- 使用 Chrome Storage API 存储
- 数据加密保存
- 仅在本地存储

### 最佳实践

1. **不要在代码中硬编码密钥**
2. **定期更换 API 密钥**
3. **使用最小权限原则**
4. **监控 API 使用量**

---

## 请求优化

### 批量翻译

将多个文本节点合并为一个请求：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "请翻译以下文本（每行一段）：\n\n文本1\n---\n文本2\n---\n文本3"
    }
  ]
}
```

### 缓存策略

- 相同文本使用缓存
- 缓存有效期：24 小时
- 本地存储缓存

### 限流处理

- 请求间隔：500ms
- 并发限制：3 个请求
- 重试机制：最多 3 次

---

## 错误处理

### 常见错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 401 | API Key 无效 | 检查密钥是否正确 |
| 429 | 请求过于频繁 | 等待后重试 |
| 500 | 服务器错误 | 联系 API 提供商 |
| -1 | 网络错误 | 检查网络连接 |

### 错误提示

```javascript
{
  "error": {
    "type": "api_error",
    "message": "API 调用失败: 429 Too Many Requests",
    "suggestion": "请稍后重试"
  }
}
```

---

## 测试 API 连接

### 测试脚本

```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Hello, world!"
      }
    ]
  }'
```

### 在扩展中测试

1. 打开设置页面
2. 填写 API 配置
3. 点击"测试连接"按钮
4. 查看测试结果

---

## 成本估算

### OpenAI GPT-4

- 输入: $0.03 / 1K tokens
- 输出: $0.06 / 1K tokens
- 平均页面（5000 字符）: ~$0.05

### OpenAI GPT-3.5 Turbo

- 输入: $0.0015 / 1K tokens
- 输出: $0.002 / 1K tokens
- 平均页面（5000 字符）: ~$0.002

### 本地模型 (Ollama)

- 免费
- 需要本地计算资源

---

## 常见问题

**Q: 如何获取 OpenAI API Key？**  
A: 访问 https://platform.openai.com/api-keys 创建

**Q: 支持哪些语言？**  
A: 支持 LLM 能识别的所有语言

**Q: 翻译速度如何？**  
A: 取决于 API 响应速度，通常 1-3 秒

**Q: 数据安全吗？**  
A: 文本会发送到配置的 API 端点，请选择可信的服务商
