/**
 * Options page script
 * Handles settings management and API testing
 */

document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
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
});

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

async function testConnection() {
  const config = {
    apiEndpoint: document.getElementById('apiEndpoint').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('model').value
  };
  
  if (!config.apiKey) {
    showStatus('❌ 请输入 API Key', 'error');
    return;
  }
  
  showStatus('🔄 测试连接中...', 'info');
  
  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      showStatus('✅ 连接成功！', 'success');
    } else {
      const error = await response.json();
      showStatus('❌ 连接失败: ' + (error.error?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    showStatus('❌ 连接失败: ' + error.message, 'error');
  }
}

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
    `;
  } else if (provider === 'anthropic') {
    modelSelect.innerHTML = `
      <option value="claude-3-opus">Claude 3 Opus</option>
      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
    `;
  }
}

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
