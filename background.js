/**
 * Background Service Worker for Chrome Extension
 * Handles context menu, API calls, and message passing
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

  console.log('LLM Translator extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection') {
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'translate-selection',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'translate-page') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'translate-page'
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
    return true; // Keep the message channel open for async response
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
    throw new Error('Please configure your API key in the extension settings');
  }

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${config.targetLanguage}.
          Keep the original format and structure. Only return the translation, no explanations.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return {
    translation: data.choices[0].message.content,
    model: config.model,
    tokens: {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
      total: data.usage?.total_tokens
    }
  });
}

/**
 * Load configuration from Chrome Storage
 */
async function loadConfig() {
  const result = await chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'model', 'targetLanguage']);
  
  return {
    apiEndpoint: result.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
    apiKey: result.apiKey || '',
    model: result.model || 'gpt-4',
    targetLanguage: context.targetLanguage || '中文'
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
