/**
 * Enhanced Content Script with multiple translation modes
 * Supports: selection, paragraph, and full page translation
 */

// State
let isProcessing = false;
let translationMode = 'selection'; // selection, paragraph, full
let translatedElements = new Map();
let hoverTimeout = null;

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
    return true;
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Add hover translation for paragraphs
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  
  // Add double-click to translate word
  document.addEventListener('dblclick', handleDoubleClick);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
  // Ctrl+Shift+T: Toggle translation mode
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    toggleTranslationMode();
  }
  
  // Ctrl+Shift+S: Translate selection
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    translateSelection();
  }
  
  // Ctrl+Shift+P: Translate paragraph under cursor
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    translateParagraphUnderCursor();
  }
  
  // Escape: Close all translation popups
  if (e.key === 'Escape') {
    closeAllPopups();
  }
}

/**
 * Handle mouse over for paragraph translation
 */
function handleMouseOver(e) {
  if (isProcessing) return;
  
  const element = e.target;
  
  // Check if it's a text element
  if (!isTextElement(element)) return;
  
  // Clear previous timeout
  if (hoverTimeout) clearTimeout(hoverTimeout);
  
  // Set new timeout for hover translation
  hoverTimeout = setTimeout(() => {
    showTranslateButton(element);
  }, 500);
}

/**
 * Handle mouse out
 */
function handleMouseOut(e) {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  
  // Hide translate button if mouse leaves
  const button = document.getElementById('llm-hover-button');
  if (button && !button.contains(e.relatedTarget)) {
    setTimeout(() => {
      if (!button.matches(':hover')) {
        button.remove();
      }
    }, 1000);
  }
}

/**
 * Handle double-click to translate word
 */
function handleDoubleClick(e) {
  const selection = window.getSelection();
  if (!selection || selection.toString().trim().length < 2) return;
  
  const text = selection.toString().trim();
  translateSelection(text);
}

/**
 * Show translate button on hover
 */
function showTranslateButton(element) {
  // Remove existing button
  const existing = document.getElementById('llm-hover-button');
  if (existing) existing.remove();
  
  // Create button
  const button = document.createElement('div');
  button.id = 'llm-hover-button';
  button.innerHTML = '🌐';
  button.style.cssText = `
    position: absolute;
    background: #4CAF50;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: all 0.2s;
  `;
  
  // Position button near element
  const rect = element.getBoundingClientRect();
  button.style.top = `${window.scrollY + rect.top - 30}px`;
  button.style.left = `${window.scrollX + rect.left}px`;
  
  // Add click handler
  button.addEventListener('click', () => {
    translateElement(element);
    button.remove();
  });
  
  document.body.appendChild(button);
}

/**
 * Translate specific element
 */
async function translateElement(element) {
  const text = element.textContent.trim();
  if (!text || text.length < 2) return;
  
  if (isProcessing) {
    showNotification('翻译进行中，请稍候...', 'warning');
    return;
  }
  
  try {
    isProcessing = true;
    
    // Show loading
    element.style.opacity = '0.6';
    element.style.position = 'relative';
    
    const loading = document.createElement('div');
    loading.className = 'llm-element-loading';
    loading.innerHTML = '🔄';
    loading.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
    `;
    element.appendChild(loading);
    
    // Translate
    const response = await sendMessageToBackground({
      type: 'translate',
      text: text
    });
    
    // Remove loading
    loading.remove();
    element.style.opacity = '1';
    
    if (response.success) {
      // Create bilingual display
      showBilingualTranslation(element, text, response.data.translation);
    } else {
      showNotification(response.error, 'error');
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    showNotification('翻译失败: ' + error.message, 'error');
  } finally {
    isProcessing = false;
  }
}

/**
 * Show bilingual translation
 */
function showBilingualTranslation(element, original, translation) {
  // Check if already translated
  if (translatedElements.has(element)) {
    // Toggle between original and translation
    const wrapper = translatedElements.get(element);
    const isShowingOriginal = wrapper.dataset.showing === 'original';
    
    if (isShowingOriginal) {
      wrapper.querySelector('.llm-translation').style.display = 'block';
      wrapper.querySelector('.llm-original').style.display = 'none';
      wrapper.dataset.showing = 'translation';
    } else {
      wrapper.querySelector('.llm-translation').style.display = 'none';
      wrapper.querySelector('.llm-original').style.display = 'block';
      wrapper.dataset.showing = 'original';
    }
    return;
  }
  
  // Create wrapper
  const wrapper = document.createElement('span');
  wrapper.className = 'llm-bilingual-wrapper';
  wrapper.dataset.showing = 'translation';
  
  wrapper.innerHTML = `
    <span class="llm-original" style="display: none; color: #666; font-size: 0.9em;">${escapeHtml(original)}</span>
    <span class="llm-translation" style="background: #e8f5e9; padding: 2px 4px; border-radius: 2px;">${escapeHtml(translation)}</span>
    <button class="llm-toggle-btn" style="margin-left: 4px; background: none; border: 1px solid #ddd; border-radius: 2px; cursor: pointer; font-size: 10px; padding: 1px 4px;">切换</button>
  `;
  
  // Add toggle handler
  wrapper.querySelector('.llm-toggle-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const showing = wrapper.dataset.showing;
    if (showing === 'original') {
      wrapper.querySelector('.llm-translation').style.display = 'block';
      wrapper.querySelector('.llm-original').style.display = 'none';
      wrapper.dataset.showing = 'translation';
    } else {
      wrapper.querySelector('.llm-translation').style.display = 'none';
      wrapper.querySelector('.llm-original').style.display = 'block';
      wrapper.dataset.showing = 'original';
    }
  });
  
  // Replace element
  element.parentNode.replaceChild(wrapper, element);
  translatedElements.set(wrapper, { original, translation });
}

/**
 * Translate paragraph under cursor
 */
function translateParagraphUnderCursor() {
  const element = document.elementFromPoint(
    window.innerWidth / 2,
    window.innerHeight / 2
  );
  
  if (!element) return;
  
  // Find the paragraph element
  const paragraph = element.closest('p, div, article, section');
  if (paragraph) {
    translateElement(paragraph);
  }
}

/**
 * Toggle translation mode
 */
function toggleTranslationMode() {
  const modes = ['selection', 'paragraph', 'full'];
  const currentIndex = modes.indexOf(translationMode);
  translationMode = modes[(currentIndex + 1) % modes.length];
  
  showNotification(`翻译模式: ${getModeLabel(translationMode)}`, 'info');
}

/**
 * Get mode label in Chinese
 */
function getModeLabel(mode) {
  const labels = {
    'selection': '选中文本',
    'paragraph': '段落翻译',
    'full': '整页翻译'
  };
  return labels[mode];
}

/**
 * Check if element is text element
 */
function isTextElement(element) {
  const tagName = element.tagName;
  const excludeTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'NOSCRIPT', 'IFRAME'];
  
  if (excludeTags.includes(tagName)) return false;
  
  // Check if has visible text
  const text = element.textContent?.trim();
  return text && text.length >= 2;
}

/**
 * Close all translation popups
 */
function closeAllPopups() {
  const popups = document.querySelectorAll('#llm-translation-popup, #llm-hover-button');
  popups.forEach(popup => popup.remove());
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
    
    case 'toggle-bilingual':
      // Toggle all bilingual elements
      translatedElements.forEach((wrapper) => {
        const btn = wrapper.querySelector('.llm-toggle-btn');
        if (btn) btn.click();
      });
      sendResponse({ success: true });
      break;
    
    default:
      console.log('Unknown message type:', message.type);
  }
}

/**
 * Translate selected text (enhanced)
 */
async function translateSelection(selectedText) {
  if (isProcessing) {
    showNotification('翻译进行中，请稍候...', 'warning');
    return;
  }

  try {
    isProcessing = true;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      showNotification('没有选中文本', 'error');
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selectedText || selection.toString().trim();
    
    if (!text) {
      showNotification('没有选中文本', 'error');
      return;
    }

    // Show loading indicator
    const loading = showLoading('翻译中...');

    // Send translation request
    const response = await sendMessageToBackground({
      type: 'translate',
      text: text
    });

    loading.remove();

    if (response.success) {
      showTranslationPopup(text, response.data.translation, range);
    } else {
      showNotification(response.error, 'error');
    }

  } catch (error) {
    console.error('Translation error:', error);
    showNotification('翻译失败: ' + error.message, 'error');
  } finally {
    isProcessing = false;
  }
}

/**
 * Translate entire page (enhanced with batch processing)
 */
async function translatePage() {
  if (isProcessing) {
    showNotification('翻译进行中，请稍候...', 'warning');
    return;
  }

  try {
    isProcessing = true;
    showNotification('开始翻译页面...', 'info');

    // Extract all text nodes
    const textNodes = extractTextNodes(document.body);
    
    // Create progress indicator
    const progress = createProgressIndicator();
    document.body.appendChild(progress);

    // Process in batches
    const batchSize = 5;
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      
      // Translate batch
      const promises = batch.map(async (nodeInfo) => {
        try {
          const response = await sendMessageToBackground({
            type: 'translate',
            text: nodeInfo.text
          });

          if (response.success) {
            await replaceTextNode(nodeInfo.node, response.data.translation);
            return { success: true };
          } else {
            return { success: false, error: response.error };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      // Update progress
      const completed = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).length;
      
      updateProgress(progress, {
        total: textNodes.length,
        completed: i + batch.length,
        errors: errors
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    progress.remove();
    showNotification('✅ 页面翻译完成！', 'success');

  } catch (error) {
    console.error('Full page translation error:', error);
    showNotification('翻译失败: ' + error.message, 'error');
  } finally {
    isProcessing = false;
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
        if (EXCLUDE_TAGS.includes(node.parentElement?.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.textContent.trim();
        if (text.length < 2) {
          return NodeFilter.FILTER_REJECT;
        }

        const style = window.getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    textNodes.push({
      node: node,
      text: node.textContent.trim()
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
  span.style.cssText = `
    background: linear-gradient(to bottom, transparent 60%, #e8f5e9 60%);
    transition: background 0.3s;
  `;
  
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
    background: rgba(33, 150, 243, 0.95);
    color: white;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    min-width: 250px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  `;
  div.innerHTML = `
    <div class="llm-progress-text" style="margin-bottom: 8px;">🔄 准备中...</div>
    <div style="background: rgba(255,255,255,0.3); border-radius: 4px; height: 6px;">
      <div class="llm-progress-bar" style="width: 0%; height: 100%; background: #4CAF50; border-radius: 4px; transition: width 0.3s;"></div>
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
    `🔄 翻译中: ${progress.completed}/${progress.total} (${percent}%)`;
  element.querySelector('.llm-progress-bar').style.width = `${percent}%`;
}

/**
 * Show translation popup (enhanced)
 */
function showTranslationPopup(original, translation, range) {
  const existing = document.getElementById('llm-translation-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'llm-translation-popup';
  popup.innerHTML = `
    <div style="padding: 16px; min-width: 350px; max-width: 500px;">
      <div style="font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>🌐 LLM 翻译器</span>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="border: none; background: none; font-size: 20px; cursor: pointer; color: #999;">&times;</button>
      </div>
      <div style="margin-bottom: 12px; padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #2196F3;">
        <div style="font-size: 11px; color: #2196F3; margin-bottom: 4px; text-transform: uppercase;">原文</div>
        <div style="line-height: 1.5;">${escapeHtml(original)}</div>
      </div>
      <div style="padding: 12px; background: #e8f5e9; border-radius: 6px; border-left: 3px solid #4CAF50;">
        <div style="font-size: 11px; color: #4CAF50; margin-bottom: 4px; text-transform: uppercase;">译文</div>
        <div style="line-height: 1.5;">${escapeHtml(translation)}</div>
      </div>
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button onclick="copyToClipboard('${escapeHtml(translation)}')" style="flex: 1; padding: 6px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 复制译文</button>
        <button onclick="copyToClipboard('${escapeHtml(original)}')" style="flex: 1; padding: 6px; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 复制原文</button>
      </div>
    </div>
  `;

  const rect = range.getBoundingClientRect();
  popup.style.cssText = `
    position: absolute;
    top: ${window.scrollY + rect.bottom + 10}px;
    left: ${window.scrollX + rect.left}px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;

  document.body.appendChild(popup);
  
  // Auto-close after 30 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      popup.remove();
    }
  }, 30000);
}

/**
 * Show loading indicator
 */
function showLoading(message) {
  const loading = document.createElement('div');
  loading.id = 'llm-loading';
  loading.textContent = message;
  loading.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 12px 20px;
    background: rgba(33, 150, 243, 0.95);
    color: white;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(loading);
  return loading;
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
    'error': '#f44336'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 12px 20px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Copy text to clipboard
 */
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('已复制到剪贴板', 'success');
  }).catch(err => {
    console.error('Copy failed:', err);
    showNotification('复制失败', 'error');
  });
};

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
