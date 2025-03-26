document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveApiKeyButton = document.getElementById('save-api-key');
  const toggleAssistantButton = document.getElementById('toggle-assistant');
  
  // Function to get API key from Chrome storage
  async function getApiKey() {
    const storageData = await chrome.storage.local.get(['groq_api_key']);
    return storageData.groq_api_key;
  }

  // Check if API key exists in storage
  getApiKey().then(apiKey => {
    if (apiKey) {
      apiKeyInput.value = apiKey;
      apiKeyInput.type = 'password';
      toggleAssistantButton.disabled = false;
      toggleAssistantButton.textContent = 'Open Assistant';
      
      // Show success indicators when API key is present
      document.querySelector('.api-key-input').classList.add('has-key');
      apiKeyInput.placeholder = '••••••••••••••••';
    } else {
      toggleAssistantButton.disabled = true;
      toggleAssistantButton.textContent = 'Enter API Key to Continue';
    }
  });
  
  // Add a reveal/hide password feature
  const toggleShowPassword = () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      // Show option to add an eye icon here if desired
    } else {
      apiKeyInput.type = 'password';
    }
  };
  
  apiKeyInput.addEventListener('dblclick', toggleShowPassword);
  
  // Save API key to Chrome storage
  saveApiKeyButton.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      // Save to storage
      await chrome.storage.local.set({ 'groq_api_key': apiKey });
      
      // Update UI
      const saveStatus = document.getElementById('save-status');
      saveStatus.textContent = 'API key saved!';
      setTimeout(() => {
        saveStatus.textContent = '';
      }, 2000);
      
      toggleAssistantButton.disabled = false;
      toggleAssistantButton.textContent = 'Open Assistant';
      
      // Add success indication and visual feedback
      saveApiKeyButton.textContent = 'Saved!';
      saveApiKeyButton.classList.add('success');
      
      setTimeout(() => {
        saveApiKeyButton.textContent = 'Save';
        saveApiKeyButton.classList.remove('success');
      }, 2000);
      
      apiKeyInput.type = 'password';
      showToast('API key saved successfully!');
    } else {
      showToast('Please enter a valid API key', 'error');
    }
  });
  
  // Toggle assistant
  toggleAssistantButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleAssistant"});
      window.close(); // Close the popup after toggling
    });
  });
  
  // Simple toast notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remove after display
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // Add the toast styles dynamically
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10000;
    }
    
    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    .toast.success {
      background-color: #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    
    .toast.error {
      background-color: #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }
    
    .success {
      background-color: #10b981 !important;
      color: white !important;
    }
    
    .api-key-input.has-key input {
      border-color: #10b981;
    }
  `;
  document.head.appendChild(style);
});
