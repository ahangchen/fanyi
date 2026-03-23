/**
 * Content Script - Injected into web pages
 * Handles text extraction, translation display, and UI interactions
 */

// State
let isProcessing = false;
let isFullPageTranslation = false;
let translationProgress = {
  total: 0,
  completed: 0,
  errors: 0
};

// Initialize
init();

/**
 * Initialize content script
 */
function init() {
  console.log('LLM Translator content script loaded');
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessages(message, sendResponse);
    return true; // Keep the message channel open for async response
  });
}

/**
 * Handle messages from background script
 */
async function handleMessages(message, sendResponse) {
  switch (message.type) {
    case 'translate-selection':
      await translateSelection(message.text);
      sendResponse({ success: true });
      break;
    
    case 'translate-page':
      await translatePage();
      sendResponse({ progress: translationProgress });
      break;
    
    case 'get-selection':
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        sendResponse({
          hasSelection: true,
          text: selection.toString()
        });
      } else {
        sendResponse({ hasSelection: false });
      }
      break;
    
    default:
      console.log('Unknown message type:', message.type);
  }
}

/**
 * Translate selected text
 */
async function translateSelection(selectedText) {
  if (isProcessing) {
    showNotification('Translation is in progress. Please wait...', 'warning');
    return;
  }

  try {
    isProcessing = true;
    
    // Get the selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      showNotification('No text selected', 'error');
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selectedText || selection.toString().trim();
    
    if (!text) {
      showNotification('No text selected', 'error');
      return;
    }

    // Show loading indicator
    const loading = document.createElement('div');
    loading.id = 'llm-translator-loading';
    loading.textContent = '🔄 Translating...';
    loading.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      background: #4CAF50;
      color: white;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      z-index: 10000;
    `;
    document.body.appendChild(loading);

    // Send translation request
    const response = await sendMessageToBackground({
      type: 'translate',
      text: text
    });

    if (response.success) {
      // Create a popup to show the translation
      showTranslationPopup(text, response.data.translation, range);
    } else {
      showNotification(response.error, 'error');
    }

    // Remove loading indicator
    loading.remove();

  } catch (error) {
    console.error('Translation error:', error);
    showNotification('Translation failed: ' + error.message, 'error');
  } finally {
    isProcessing = false;
  }
}

/**
 * Translate entire page
 */
async function translatePage() {
  if (isProcessing) {
    showNotification('Translation is in progress. Please wait...', 'warning');
    return;
  }

  try {
    isProcessing = true;
    isFullPageTranslation = true;
    translationProgress = { total: 0, completed: 0, errors: 0 };

    // Extract all text nodes
    const textNodes = extractTextNodes(document.body);
    
    translationProgress.total = textNodes.length;
    
    // Create progress indicator
    const progress = createProgressIndicator();
    document.body.appendChild(progress);

    // Process each text node
    for (let i = 0; i < textNodes.length; i++) {
      const nodeInfo = textNodes[i];
      
      try {
        const response = await sendMessageToBackground({
          type: 'translate',
          text: nodeInfo.text
        });

        if (response.success) {
          // Replace text node
          await replaceTextNode(nodeInfo.node, response.data.translation);
          translationProgress.completed++;
        } else {
          console.error('Translation failed for node:', response.error);
          translationProgress.errors++;
        }

        // Update progress
        updateProgress(progress, translationProgress);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error('Error processing node:', error);
        translationProgress.errors++;
      }
    }

    // Remove progress indicator
    progress.remove();
    
    // Show completion message
    showCompletionMessage(translationProgress);

  } catch (error) {
    console.error('Full page translation error:', error);
    showNotification('Translation failed: ' + error.message, 'error');
  } finally {
    isProcessing = false;
    isFullPageTranslation = false;
  }
}

/**
 * Extract all visible text nodes
 */
function extractTextNodes(root) {
  const EXCLUDE_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'NOSCRIPT'];
  const textNodes = [];

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Exclude specific tags
        if (EXCLUDE_TAGS.includes(node.parentElement?.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Exclude empty or whitespace-only text
        const text = node.textContent.trim();
        if (text.length < 2) {
          return NodeFilter.FILTER_REJECT;
        }

        // Check if element is visible
        const style = window.getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.ANY_STATUS;
      }
    }
  );

  while (walker.nextNode()) {
    const node = current;
    const text = node.textContent.trim();

    textNodes.push({
      node: node,
      text: text,
      parent: node.parentElement
    });
  }

  return textNodes;
}

/**
 * Replace text node with translated text
 */
async function replaceTextNode(node, translatedText) {
  const span = document.createElement('span');
  span.className = 'llm-translated';
  span.textContent = translatedText;
  span.style.backgroundColor = '#e8f5e9';
  span.style.padding = '2px 4px';
  span.style.borderRadius = '2px';
  
  node.parentNode.replaceChild(span, node);
}

/**
 * Create progress indicator
 */
function createProgressIndicator() {
  const div = document.createElement('div');
  div.id = 'llm-progress-indicator';
  div.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 12px 16px;
    background: #2196F3;
    color: white;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    min-width: 200px;
  `;
  div.innerHTML = `
    <div class="llm-progress-text">🔄 Preparing...</div>
    <div style="background: rgba(255,255,0,0.3); border-radius: 2px; margin-top: 8px;">
      <div class="llm-progress-bar" style="width: 0%; height: 4px; background: #4CAF50; border-radius: 2px;"></div>
    </div>
  `;
  
  return div;
}

/**
 * Update progress indicator
 */
function updateProgress(element, progress) {
  const percent = (progress.completed / progress.total * 100).toFixed(1);
  element.querySelector('.llm-progress-text').textContent = 
    `🔄 Translating: ${progress.completed}/${progress.total} (${percent}%)`;
  element.querySelector('.llm-progress-bar).style.width = `${percent}%`;
}

/**
 * Show translation popup
 */
function showTranslationPopup(original, translation, range) {
  // Remove any existing popup
  const existing = document.getElementById('llm-translation-popup');
  if (existing) existing.remove();

  // Create popup
  const popup = document.createElement('div');
  popup.id = 'llm-translation-popup';
  popup.innerHTML = `
    <div style="padding: 15px; min-width: 300px; max-width: 500px;">
      <div style="font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span>LLM Translator</span>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="border: none; background: none; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <div style="margin-bottom: 12px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Original:</div>
        <div>${escapeHtml(original)}</div>
      </div>
      <div style="padding: 10px; background: #e8f5e9; border-radius: 4px;">
        <div style="font-size: 12px; color: #4CAF50; margin-bottom: 4px;">Translation:</div>
        <div>${escapeHtml(translation)}</div>
      </div>
    </div>
  `;

  // Position the popup
  const rect = range.getBoundingClientRect();
  popup.style.cssText = `
    position: absolute;
    top: ${window.scrollY + rect.bottom + 10}px;
    left: ${window.scrollX + rect.left}px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;

  document.body.appendChild(popup);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'llm-notification';
  notification.textContent = message;
  
  const colors = {
    'info': '#2196F3',
    'success': '#4CAF50',
    'warning': '#ff9800',
    'error': #f44336'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 12px 20px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Show completion message
 */
function showCompletionMessage(progress) {
  const message = document.createElement('div');
  message.innerHTML = `
    <div style="padding: 15px; text-align: center;">
      <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
      <div style="font-weight: bold; margin-bottom: 8px;">Translation Complete</div>
      <div>Translated: ${progress.completed} / ${progress.total}</div>
      ${progress.errors > 0 ? `<div style="color: #f44336; margin-top: 5px;">Errors: ${progress.errors}</div>` : ''}
    </div>
  `;
  
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 3000);
}

/**
 * Send message to background script
 */
function sendMessageToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
