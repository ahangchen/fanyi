/**
 * Text Extractor - Extract visible text from web pages
 * Filters out code blocks, scripts, styles, and other non-translatable content
 */

const EXCLUDE_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'NOSCRIPT'];
const MIN_TEXT_LENGTH = 2; // Minimum text length to translate

/**
 * Extract all visible text nodes from a DOM tree
 * @param {Element} root - Root element to start extraction
 * @returns {Array} Array of text node objects with metadata
 */
export function extractTextNodes(root = document.body) {
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
        if (text.length < MIN_TEXT_LENGTH) {
          return NodeFilter.FILTER_REJECT;
        }

        // Check if element is visible
        const style = window.getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        // Exclude code blocks with language class
        const parent = node.parentElement;
        if (parent.classList.contains('language-') || 
            parent.closest('pre[class*="language-"]')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let position = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent.trim();

    textNodes.push({
      node: node,
      text: text,
      parent: node.parentElement,
      position: position++,
      xpath: getXPath(node)
    });
  }

  return textNodes;
}

/**
 * Get XPath for a node
 * @param {Node} node - DOM node
 * @returns {string} XPath string
 */
function getXPath(node) {
  const parts = [];
  let current = node;

  while (current && current.nodeType === Node.TEXT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;

    while (sibling) {
      if (sibling.nodeType === Node.TEXT_NODE) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    parts.unshift(`text()[${index + 1}]`);
    current = current.parentNode;
  }

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && 
          sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const indexStr = index > 0 ? `[${index + 1}]` : '';
    parts.unshift(tagName + indexStr);
    current = current.parentNode;
  }

  return '/' + parts.join('/');
}

/**
 * Extract text from selected range
 * @param {Selection} selection - User selection
 * @returns {Object} Selected text with range info
 */
export function extractSelectedText(selection = window.getSelection()) {
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();

  if (!text) {
    return null;
  }

  return {
    text: text,
    range: range,
    startContainer: range.startContainer,
    endContainer: range.endContainer,
    rects: range.getClientRects()
  };
}

/**
 * Batch text nodes for efficient translation
 * @param {Array} textNodes - Array of text node objects
 * @param {number} maxLength - Maximum characters per batch
 * @returns {Array} Array of batched text groups
 */
export function batchTextNodes(textNodes, maxLength = 2000) {
  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  for (const nodeInfo of textNodes) {
    const text = nodeInfo.text;

    if (currentLength + text.length > maxLength && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLength = 0;
    }

    currentBatch.push(nodeInfo);
    currentLength += text.length;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * Check if text contains translatable content
 * @param {string} text - Text to check
 * @returns {boolean} True if text should be translated
 */
export function isTranslatable(text) {
  if (!text || text.length < MIN_TEXT_LENGTH) {
    return false;
  }

  // Check if text contains letters (not just numbers/symbols)
  if (!/[a-zA-Z\u4e00-\u9fa5\u0400-\u04FF]/.test(text)) {
    return false;
  }

  // Check if text is mostly code-like
  const codeIndicators = ['{', '}', '=>', 'function', 'const ', 'let ', 'var '];
  const codeCount = codeIndicators.filter(ind => text.includes(ind)).length;
  
  if (codeCount >= 2) {
    return false;
  }

  return true;
}
