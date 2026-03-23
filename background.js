/**
 * Enhanced Background Service Worker
 * Adds keyboard shortcuts support and advanced features
 */

// Configuration
let config = {
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4',
  targetLanguage: '中文',
  maxBatchSize: 2000
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: '翻译选中文本',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'translate-page',
    title: '翻译整个页面',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'toggle-bilingual',
    title: '切换双语显示',
    contexts: ['page']
  });

  // Register keyboard shortcuts
  chrome.commands.onCommand.addListener((command) => {
    handleKeyboardCommand(command);
  });

  console.log('LLM Translator extension installed');
});

/**
 * Handle keyboard commands
 */
async function handleKeyboardCommand(command) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  switch (command) {
    case 'translate-selection':
      chrome.tabs.sendMessage(tab.id, { type: 'translate-selection' });
      break;
    case 'translate-page':
      chrome.tabs.sendMessage(tab.id, { type: 'translate-page' });
      break;
    case 'toggle-bilingual':
      chrome.tabs.sendMessage(tab.id, { type: 'toggle-bilingual' });
      break;
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'translate-selection',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'translate-page') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'translate-page'
    });
  } else if (info.menuItemId === 'toggle-bilingual') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'toggle-bilingual'
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'translate') {
    handleTranslation(request.text)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Translation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.type === 'getConfig') {
    loadConfig().then(config => sendResponse({ config: config }));
    return true;
  }
  
  if (request.type === 'saveConfig') {
    saveConfig(request.config).then(() => sendResponse({ success: true }));
    return true;
  }
});

/**
 * Translate text using LLM API
 */
async function handleTranslation(text) {
  const config = await loadConfig();
  
  if (!config.apiKey) {
    throw new Error('请先在扩展设置中配置 API Key');
  }

  // Build request based on provider
  const requestBody = buildRequestBody(config, text);

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API 请求失败');
  }

  const data = await response.json();
  
  // Extract translation based on provider
  const translation = extractTranslation(config.apiProvider, data);
  
  return {
    translation: translation,
    model: config.model,
    tokens: {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
      total: data.usage?.total_tokens
    }
  };
}

/**
 * Build request body based on API provider
 */
function buildRequestBody(config, text) {
  const provider = config.apiProvider || 'openai';
  
  if (provider === 'anthropic') {
    return {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: `Translate the following text to ${config.targetLanguage}. Keep the original format and structure. Only return the translation, no explanations.\n\n${text}`
        }
      ],
      max_tokens: 4000
    };
  } else {
    // OpenAI and custom APIs
    return {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${config.targetLanguage}. Keep the original format and structure. Only return the translation, no explanations.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    };
  }
}

/**
 * Extract translation from API response
 */
function extractTranslation(provider, data) {
  if (provider === 'anthropic') {
    return data.content?.[0]?.text || data.choices?.[0]?.message?.content;
  } else {
    return data.choices?.[0]?.message?.content;
  }
}

/**
 * Load configuration from Chrome Storage
 */
async function loadConfig() {
  const result = await chrome.storage.sync.get([
    'apiProvider',
    'apiEndpoint', 
    'apiKey',
    'model',
    'targetLanguage'
  ]);
  
  return {
    apiProvider: result.apiProvider || 'openai',
    apiEndpoint: result.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
    apiKey: result.apiKey || '',
    model: result.model || 'gpt-4',
    targetLanguage: result.targetLanguage || '中文'
  };
}

/**
 * Save configuration to Chrome Storage
 */
async function saveConfig(newConfig) {
  await chrome.storage.sync.set(newConfig);
  config = { ...config, ...newConfig };
}

// Keep service worker alive
setInterval(() => {
  console.log('Background service worker heartbeat');
}, 60000);
