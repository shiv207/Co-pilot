
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveApiKeyButton = document.getElementById('save-api-key');
  const toggleAssistantButton = document.getElementById('toggle-assistant');
  
  // Load saved API key
  chrome.storage.local.get(['groq_api_key'], function(result) {
    if (result.groq_api_key) {
      apiKeyInput.value = result.groq_api_key;
      apiKeyInput.type = 'password';
      toggleAssistantButton.disabled = false;
      toggleAssistantButton.textContent = 'Open Assistant';
    } else {
      toggleAssistantButton.disabled = true;
      toggleAssistantButton.textContent = 'Enter API Key to Continue';
    }
  });
  
  // Save API key
  saveApiKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ 'groq_api_key': apiKey }, function() {
        toggleAssistantButton.disabled = false;
        toggleAssistantButton.textContent = 'Open Assistant';
        alert('API key saved successfully!');
      });
    }
  });
  
  // Toggle assistant
  toggleAssistantButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleAssistant"});
    });
  });
});
