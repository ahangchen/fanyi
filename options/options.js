/**
 * Enhanced Options page script
 * Adds advanced settings and keyboard shortcuts configuration
 */

document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  setupEventListeners();
  loadKeyboardShortcuts();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings();
  });
  
  document.getElementById('testConnection').addEventListener('click', async () => {
    await testConnection();
  });
  
  document.getElementById('apiProvider').addEventListener('change', (e) => {
    updateDefaultEndpoint(e.target.value);
  });
  
  // Add keyboard shortcuts info
  document.getElementById('shortcutsInfo').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

/**
 * Load keyboard shortcuts
 */
function loadKeyboardShortcuts() {
  chrome.commands.getAll((commands) => {
    const shortcutsDiv = document.getElementById('shortcutsList');
    shortcutsDiv.innerHTML = commands.map(cmd => `
      <div style="display: flex; justify-content: space-between; padding: 8px; background: #f5f5f5; margin-bottom: 8px; border-radius: 4px;">
        <span>${cmd.description}</span>
        <span style="font-family: monospace; background: white; padding: 2px 8px; border-radius: 4px;">${cmd.shortcut || '未设置'}</span>
      </div>
    `).join('');
  });
}

/**
 * Load saved settings from Chrome storage
 */
async function loadSettings() {
  const data = await chrome.storage.sync.get([
    'apiProvider',
    'apiEndpoint',
    'apiKey',
    'model',
    'targetLanguage',
    'maxBatchSize'
  ]);
  
  if (data.apiProvider) document.getElementById('apiProvider').value = data.apiProvider;
  if (data.apiEndpoint) document.getElementById('apiEndpoint').value = data.apiEndpoint;
  if (data.apiKey) document.getElementById('apiKey').value = data.apiKey;
  if (data.model) document.getElementById('model').value = data.model;
  if (data.targetLanguage) document.getElementById('targetLanguage').value = data.targetLanguage;
  if (data.maxBatchSize) document.getElementById('maxBatchSize').value = data.maxBatchSize;
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings() {
  const settings = {
    apiProvider: document.getElementById('apiProvider').value,
    apiEndpoint: document.getElementById('apiEndpoint').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('model').value,
    targetLanguage: document.getElementById('targetLanguage').value,
    maxBatchSize: parseInt(document.getElementById('maxBatchSize').value)
  };
  
  try {
    await chrome.storage.sync.set(settings);
    showStatus('✅ 设置已保存！', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('❌ 保存失败: ' + error.message, 'error');
  }
}

/**
 * Test API connection
 */
async function testConnection() {
  const config = {
    apiEndpoint: document.getElementById('apiEndpoint').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('model').value,
    apiProvider: document.getElementById('apiProvider').value
  };
  
  if (!config.apiKey) {
    showStatus('❌ 请输入 API Key', 'error');
    return;
  }
  
  showStatus('🔄 测试连接中...', 'info');
  
  try {
    const requestBody = config.apiProvider === 'anthropic' ? {
      model: config.model,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    } : {
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a translator.' },
        { role: 'user', content: 'Hello' }
      ],
      max_tokens: 5
    };
    
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      showStatus('✅ 连接成功！', 'success');
    } else {
      const error = await response.json();
      showStatus('❌ 连接失败: ' + (error.error?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    showStatus('❌ 连接失败: ' + error.message, 'error');
  }
}

/**
 * Update default endpoint based on provider
 */
function updateDefaultEndpoint(provider) {
  const endpoints = {
    'openai': 'https://api.openai.com/v1/chat/completions',
    'anthropic': 'https://api.anthropic.com/v1/messages',
    'custom': ''
  };
  
  if (endpoints[provider]) {
    document.getElementById('apiEndpoint').value = endpoints[provider];
  }
  
  const modelSelect = document.getElementById('model');
  if (provider === 'openai') {
    modelSelect.innerHTML = `
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
      <option value="gpt-4-turbo">GPT-4 Turbo</option>
    `;
  } else if (provider === 'anthropic') {
    modelSelect.innerHTML = `
      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
    `;
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}
