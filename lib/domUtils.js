/**
 * DOM Utilities - Helper functions for DOM manipulation
 */

/**
 * Replace text node with translated content
 * @param {Node} textNode - Original text node
 * @param {string} translatedText - Translated text
 * @returns {Element} Wrapper element with translation
 */
export function replaceTextNode(textNode, translatedText) {
  const parent = textNode.parentNode;
  
  // Create wrapper element
  const wrapper = document.createElement('span');
  wrapper.className = 'llm-translator-wrapper';
  wrapper.setAttribute('data-original', textNode.textContent);
  wrapper.setAttribute('data-translated', translatedText);
  
  // Create translated text element
  const translatedSpan = document.createElement('span');
  translatedSpan.className = 'llm-translator-text';
  translatedSpan.textContent = translatedText;
  
  // Create original text tooltip
  const tooltip = document.createElement('span');
  tooltip.className = 'llm-translator-tooltip';
  tooltip.textContent = textNode.textContent;
  
  wrapper.appendChild(translatedSpan);
  wrapper.appendChild(tooltip);
  
  // Replace original node
  parent.replaceChild(wrapper, textNode);
  
  return wrapper;
}

/**
 * Restore original text
 * @param {Element} wrapper - Wrapper element created by replaceTextNode
 */
export function restoreOriginalText(wrapper) {
  if (!wrapper.classList.contains('llm-translator-wrapper')) {
    return;
  }

  const originalText = wrapper.getAttribute('data-original');
  const textNode = document.createTextNode(originalText);
  wrapper.parentNode.replaceChild(textNode, wrapper);
}

/**
 * Highlight element temporarily
 * @param {Element} element - Element to highlight
 * @param {number} duration - Duration in milliseconds
 */
export function highlightElement(element, duration = 2000) {
  element.classList.add('llm-translator-highlight');
  
  setTimeout(() => {
    element.classList.remove('llm-translator-highlight');
  }, duration);
}

/**
 * Create progress indicator
 * @param {string} message - Progress message
 * @returns {Element} Progress indicator element
 */
export function createProgressIndicator(message = 'Translating...') {
  const indicator = document.createElement('div');
  indicator.className = 'llm-translator-progress';
  indicator.innerHTML = `
    <div class="llm-translator-progress-content">
      <div class="llm-translator-spinner"></div>
      <span class="llm-translator-progress-text">${message}</span>
    </div>
  `;
  
  document.body.appendChild(indicator);
  
  return indicator;
}

/**
 * Update progress indicator
 * @param {Element} indicator - Progress indicator element
 * @param {string} message - New progress message
 */
export function updateProgressIndicator(indicator, message) {
  const textElement = indicator.querySelector('.llm-translator-progress-text');
  if (textElement) {
    textElement.textContent = message;
  }
}

/**
 * Remove progress indicator
 * @param {Element} indicator - Progress indicator element
 */
export function removeProgressIndicator(indicator) {
  if (indicator && indicator.parentNode) {
    indicator.parentNode.removeChild(indicator);
  }
}

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Type: 'success', 'error', 'info'
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `llm-translator-toast llm-translator-toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('llm-translator-toast-show'), 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('llm-translator-toast-show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is visible
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 * @param {Element} element - Element to scroll to
 */
export function scrollIntoViewSmooth(element) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

/**
 * Get selected text and its position
 * @returns {Object} Selection info with position
 */
export function getSelectionInfo() {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  
  if (rects.length === 0) {
    return null;
  }

  const rect = rects[0];
  
  return {
    text: selection.toString().trim(),
    position: {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    }
  };
}
