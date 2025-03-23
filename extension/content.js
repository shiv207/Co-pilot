
let isAssistantOpen = false;
let assistantContainer = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggleAssistant") {
    toggleAssistant();
  }
});

// Function to toggle the assistant
function toggleAssistant() {
  if (isAssistantOpen) {
    closeAssistant();
  } else {
    openAssistant();
  }
}

// Function to open the assistant
function openAssistant() {
  if (assistantContainer) {
    assistantContainer.style.display = 'block';
    isAssistantOpen = true;
    return;
  }

  // Create assistant container
  assistantContainer = document.createElement('div');
  assistantContainer.className = 'page-assistant-container';
  
  // Create assistant content
  const assistantContent = `
    <div class="page-assistant-header">
      <div class="page-assistant-title">
        <div class="page-assistant-icon">✨</div>
        <h3>Page Assistant</h3>
      </div>
      <button class="page-assistant-close">×</button>
    </div>
    <div class="page-assistant-messages">
      <div class="page-assistant-message assistant">
        <div class="page-assistant-avatar">AI</div>
        <div class="page-assistant-bubble">Hi there! How can I help you with this page?</div>
      </div>
    </div>
    <form class="page-assistant-input-form">
      <input type="text" class="page-assistant-input" placeholder="Ask a question about this page..." />
      <button type="submit" class="page-assistant-send">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;
  
  assistantContainer.innerHTML = assistantContent;
  document.body.appendChild(assistantContainer);
  
  // Add floating button
  const floatingButton = document.createElement('button');
  floatingButton.className = 'page-assistant-floating-button';
  floatingButton.innerHTML = '✨';
  floatingButton.title = 'Open Page Assistant';
  document.body.appendChild(floatingButton);
  
  // Add event listeners
  floatingButton.addEventListener('click', toggleAssistant);
  assistantContainer.querySelector('.page-assistant-close').addEventListener('click', closeAssistant);
  assistantContainer.querySelector('.page-assistant-input-form').addEventListener('submit', handleSendMessage);
  
  isAssistantOpen = true;
  
  // Focus on input
  setTimeout(() => {
    assistantContainer.querySelector('.page-assistant-input').focus();
  }, 100);
}

// Function to close the assistant
function closeAssistant() {
  if (assistantContainer) {
    assistantContainer.style.display = 'none';
  }
  isAssistantOpen = false;
}

// Function to handle sending a message
function handleSendMessage(e) {
  e.preventDefault();
  
  const inputElement = assistantContainer.querySelector('.page-assistant-input');
  const userMessage = inputElement.value.trim();
  
  if (!userMessage) return;
  
  // Add user message to chat
  addMessage('user', userMessage);
  inputElement.value = '';
  
  // Extract page content
  const pageContent = extractPageContent();
  
  // Call API (using chrome.runtime.sendMessage to background script)
  chrome.runtime.sendMessage({
    action: 'processQuestion',
    question: userMessage,
    pageContent: pageContent
  }, function(response) {
    if (response && response.answer) {
      addMessage('assistant', response.answer);
    } else {
      addMessage('assistant', 'Sorry, I encountered an error processing your question. Please try again.');
    }
  });
  
  // Show loading indicator
  addLoadingMessage();
}

// Function to add a message to the chat
function addMessage(type, content) {
  const messagesContainer = assistantContainer.querySelector('.page-assistant-messages');
  const messageElement = document.createElement('div');
  messageElement.className = `page-assistant-message ${type}`;
  
  messageElement.innerHTML = `
    <div class="page-assistant-avatar">${type === 'user' ? 'You' : 'AI'}</div>
    <div class="page-assistant-bubble">${content}</div>
  `;
  
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Remove loading indicator if exists
  const loadingIndicator = messagesContainer.querySelector('.page-assistant-loading');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Function to add loading indicator
function addLoadingMessage() {
  const messagesContainer = assistantContainer.querySelector('.page-assistant-messages');
  const loadingElement = document.createElement('div');
  loadingElement.className = 'page-assistant-loading';
  loadingElement.innerHTML = `
    <div class="page-assistant-avatar">AI</div>
    <div class="page-assistant-bubble">
      <div class="page-assistant-typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(loadingElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to extract page content
function extractPageContent() {
  // Get text content from the page
  const pageText = document.body.innerText;
  // Get meta description
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  // Get headings
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent).join(' ');
  
  // Combine all content
  return `Page Title: ${document.title}\nMeta Description: ${metaDescription}\nHeadings: ${headings}\nContent: ${pageText}`;
}
