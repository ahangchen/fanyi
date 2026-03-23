/**
 * Translator - LLM API integration for translation
 */

/**
 * Translate text using LLM API
 * @param {string} text - Text to translate
 * @param {Object} config - API configuration
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, config) {
  const {
    apiEndpoint,
    apiKey,
    model,
    targetLanguage = '中文',
    maxRetries = 3
  } = config;

  const systemPrompt = `你是一个专业的翻译助手。请将用户提供的文本翻译成${targetLanguage}。

要求：
1. 保持原有的格式和结构
2. 只返回翻译结果，不要添加任何解释或注释
3. 准确传达原文的意思
4. 保持专业术语的准确性
5. 如果原文已经是${targetLanguage}，直接返回原文`;

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: Math.max(text.length * 2, 1000)
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }

      throw new Error('Invalid API response format');

    } catch (error) {
      lastError = error;
      console.error(`Translation attempt ${attempt + 1} failed:`, error);

      // Wait before retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Translation failed after retries');
}

/**
 * Batch translate multiple texts
 * @param {Array<string>} texts - Array of texts to translate
 * @param {Object} config - API configuration
 * @returns {Promise<Array<string>>} Array of translated texts
 */
export async function batchTranslate(texts, config) {
  const { batchSize = 10, delayBetweenBatches = 1000 } = config;
  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Translate batch in parallel
    const batchPromises = batch.map(text => translateText(text, config));
    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults);

    // Delay between batches to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {string} Detected language code
 */
export function detectLanguage(text) {
  // Simple heuristic-based detection
  // For more accurate detection, consider using a library like franc

  const sample = text.substring(0, 100);

  // Chinese characters
  if (/[\u4e00-\u9fa5]/.test(sample)) {
    return 'zh';
  }

  // Japanese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) {
    return 'ja';
  }

  // Korean
  if (/[\uAC00-\uD7AF]/.test(sample)) {
    return 'ko';
  }

  // Russian/Cyrillic
  if (/[\u0400-\u04FF]/.test(sample)) {
    return 'ru';
  }

  // Default to English for Latin script
  if (/[a-zA-Z]/.test(sample)) {
    return 'en';
  }

  return 'unknown';
}

/**
 * Estimate token count (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  // Rough estimation: ~4 characters per token for English
  // ~2 characters per token for Chinese
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;

  return Math.ceil(chineseChars / 2 + otherChars / 4);
}
