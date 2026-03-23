/**
 * Popup script
 * Handles user interactions in the extension popup
 */

document.addEventListener('DOMContentLoaded', function() {
  const translatePageBtn = document.getElementById('translatePage');
  const translateSelectionBtn = document.getElementById('translateSelection');
  const settingsBtn = document.getElementById('settings');
  const statusDiv = document.getElementById('status');
  
  // Check for selected text
  checkForSelection();
  
  // Handle translate page button
  translatePageBtn.addEventListener('click', async () => {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, { type: 'translate-page' });
      
      // Show status
      showStatus('正在翻译页面...', 'info');
      
      // Wait for 2 seconds then close popup
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      showStatus('启动翻译失败: ' + error.message, 'error');
    }
  });
  
  // Handle translate selection button
  translateSelectionBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, { type: 'get-selection' });
      
      // Close popup after initiating translation
      window.close();
      
    } catch (error) {
      console.error('Error:', error);
      showStatus('翻译失败: ' + error.message, 'error');
    }
  });
  
  // Handle settings button
  settingsBtn.addEventListener('click', () => {
    // Open options page
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getUrl('options/options.html'));
    }
  });
  
  /**
   * Check if there is selected text on the page
   */
  async function checkForSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Request selection from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'get-selection' });
      
      if (response && response.hasSelection) {
        translateSelectionBtn.disabled = false;
      } else {
        translateSelectionBtn.disabled = true;
      }
      
    } catch (error) {
      // Content script might not be loaded yet
      console.error('Error checking selection:', error);
      translateSelectionBtn.disabled = true;
    }
  }
  
  /**
   * Show status message
   */
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
});
