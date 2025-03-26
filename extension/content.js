let isAssistantOpen = false;
let assistantContainer = null;
let isProcessing = false;
let popupButton = null;

// Initialize Readability
const Readability = window.Readability;

// Function to extract clean, readable content from the page
function extractPageContent() {
  try {
    // Create a new Readability instance
    const article = new Readability(window).parse();
    
    // Get the main content
    const mainContent = {
      title: article.title,
      contentHtml: article.content, // Cleaned HTML
      textContent: article.textContent, // Plain text
      excerpt: article.excerpt,
      length: article.length,
      siteName: article.siteName
    };

    // Get headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
      level: heading.tagName.toLowerCase(),
      text: heading.textContent.trim()
    }));

    // Get metadata
    const metadata = {};
    Array.from(document.getElementsByTagName('meta')).forEach(meta => {
      if (meta.name) metadata[meta.name] = meta.content;
      if (meta.property) metadata[meta.property] = meta.content;
    });

    // Get OpenGraph data
    const ogTags = Array.from(document.querySelectorAll('meta[property^="og:"]'));
    ogTags.forEach(tag => {
      const property = tag.getAttribute('property').replace('og:', '');
      metadata[`og${property.charAt(0).toUpperCase() + property.slice(1)}`] = tag.content;
    });

    // Get image context
    const imageContext = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      title: img.title
    }));

    // Check if page is probably readable
    const isProbablyReaderable = article.isProbablyReaderable;

    // Get YouTube info if applicable
    const youtubeInfo = {
      title: document.querySelector('meta[itemprop="name"]')?.content,
      channel: document.querySelector('meta[itemprop="author"]')?.content,
      description: document.querySelector('meta[itemprop="description"]')?.content
    };

    return {
      url: window.location.href,
      title: document.title,
      extractedAt: new Date().toISOString(),
      metadata,
      headings,
      mainContent,
      textContentSummary: getSummarizedText(document.body),
      isProbablyReaderable,
      youtubeInfo,
      imageContext
    };

  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      url: window.location.href,
      title: document.title,
      extractedAt: new Date().toISOString(),
      metadata: {},
      headings: [],
      mainContent: null,
      textContentSummary: getSummarizedText(document.body),
      isProbablyReaderable: false,
      youtubeInfo: null,
      imageContext: []
    };
  }
}

// Helper function to get summarized text from an element
function getSummarizedText(element) {
  const fullText = element.innerText;
  if (fullText.length <= 2000) return fullText;
  return fullText.substring(0, 2000) + '...';
}

// Function to process a question
async function processQuestion(userMessage) {
  // Check if we're already processing
  if (isProcessing) return;

  // Show loading indicator
  const loadingElement = createLoadingIndicator();
  const messagesContainer = assistantContainer.querySelector('.page-assistant-messages');
  messagesContainer.appendChild(loadingElement);

  isProcessing = true;
  
  // Get the current page content
  const pageContent = extractPageContent();
  
  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'processQuestion',
    question: userMessage,
    context: pageContent
  }, response => {
    // Remove loading indicator
    loadingElement.remove();
    
    if (response && response.answer) {
      // Add assistant message
      addMessage('assistant', response.answer);
    } else {
      // Add error message
      addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
    }
    
    isProcessing = false;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// Function to create a loading indicator
function createLoadingIndicator() {
  const loadingElement = document.createElement('div');
  loadingElement.className = 'page-assistant-loading';
  loadingElement.innerHTML = `
    <div class="page-assistant-typing-indicator">
      <span class="page-assistant-dot"></span>
      <span class="page-assistant-dot"></span>
      <span class="page-assistant-dot"></span>
    </div>
  `;
  return loadingElement;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggleAssistant") {
    toggleAssistant();
    sendResponse({ success: true });
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
  if (!document.querySelector('.page-assistant-container')) {
    initializeAssistant();
  }
  
  assistantContainer = document.querySelector('.page-assistant-container');
  assistantContainer.style.display = 'flex';
  
  // Remove closing class if it exists and force a reflow
  assistantContainer.classList.remove('closing');
  void assistantContainer.offsetWidth; // Force reflow
  
  // Hide the popup button with animation
  const popupButton = document.querySelector('.page-assistant-popup-button');
  if (popupButton) {
    popupButton.classList.add('hidden');
  }
  
  isAssistantOpen = true;
  
  // Focus on input
  setTimeout(() => {
    const inputElement = assistantContainer.querySelector('.page-assistant-input');
    inputElement.focus();
  }, 100);
}

// Function to close the assistant
function closeAssistant() {
  assistantContainer = document.querySelector('.page-assistant-container');
  if (assistantContainer) {
    // Add the closing class to trigger animation
    assistantContainer.classList.add('closing');
    
    // Show the popup button with animation
    const popupButton = document.querySelector('.page-assistant-popup-button');
    if (popupButton) {
      popupButton.classList.remove('hidden');
    }
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      assistantContainer.style.display = 'none';
    }, 400); // Match the CSS transition duration
  }
  
  isAssistantOpen = false;
}

// Function to initialize the assistant
function initializeAssistant() {
  createAssistantContainer();
}

// Function to create and append the assistant container
function createAssistantContainer() {
  assistantContainer = document.createElement('div');
  assistantContainer.className = 'page-assistant-container';
  assistantContainer.innerHTML = `
    <div class="page-assistant-noise-overlay"></div>
    <div class="page-assistant-header">
      <div class="page-assistant-title">Co-pilot <span class="page-assistant-beta">beta</span></div>
      <button class="page-assistant-close-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="page-assistant-messages">
      <div class="page-assistant-message assistant">
        Hi there! I'm your Co-pilot, an AI assistant. What would you like to know about this page?
      </div>
    </div>
    <form class="page-assistant-input-form">
      <div class="page-assistant-input-wrapper">
        <button type="button" class="page-assistant-plus-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <input type="text" class="page-assistant-input" placeholder="Ask anything">
        <button type="submit" class="page-assistant-send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
        </button>
      </div>
    </form>
    <div class="page-assistant-resize-handle"></div>
  `;
  
  document.body.appendChild(assistantContainer);
  
  handleInitialUI();
  
  return assistantContainer;
}

// Function to handle initial UI setup
function handleInitialUI() {
  const header = assistantContainer.querySelector('.page-assistant-header');
  
  // Initialize dragging functionality
  initDrag(assistantContainer, header);
  
  // Initialize resizing functionality
  const resizeHandle = assistantContainer.querySelector('.page-assistant-resize-handle');
  initResize(assistantContainer, resizeHandle);

  // Add event listener for the form submission
  const form = assistantContainer.querySelector('.page-assistant-input-form');
  form.addEventListener('submit', handleSendMessage);
  
  // Add plus button functionality
  const plusButton = assistantContainer.querySelector('.page-assistant-plus-btn');
  plusButton.addEventListener('click', () => {
    const inputElement = assistantContainer.querySelector('.page-assistant-input');
    inputElement.focus();
  });
  
  // Add close button functionality
  const closeButton = assistantContainer.querySelector('.page-assistant-close-btn');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      closeAssistant();
    });
  }
}

// Function to handle sending a message
function handleSendMessage(e) {
  e.preventDefault();
  
  const inputElement = assistantContainer.querySelector('.page-assistant-input');
  const userMessage = inputElement.value.trim();
  
  if (!userMessage || isProcessing) return;
  
  // Add user message
  addMessage('user', userMessage);
  
  // Clear input
  inputElement.value = '';
  
  processQuestion(userMessage);
}

// Function to add a message to the chat
function addMessage(type, content) {
  const messagesContainer = assistantContainer.querySelector('.page-assistant-messages');
  
  // Create message container
  const messageDiv = document.createElement('div');
  messageDiv.className = `page-assistant-message ${type}`;
  
  // Parse markdown content
  const parsedContent = parseMarkdown(content);
  
  // Set the parsed content
  messageDiv.innerHTML = parsedContent;
  
  // Add to messages container
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  isProcessing = false;
}

// Function to parse markdown content
function parseMarkdown(content) {
  // Replace markdown headings
  content = content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
    const level = hashes.length;
    return `<h${level}>${text}</h${level}>`;
  });
  
  // Replace bold text
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Replace italic text
  content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Replace code blocks
  content = content.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Replace lists
  content = content.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  content = content.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  
  // Replace blockquotes
  content = content.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Replace horizontal rules
  content = content.replace(/^---$/gm, '<hr>');
  
  // Wrap remaining text in paragraphs
  content = content.replace(/^(?!<h|<p|<ul|<ol|<pre|<blockquote|<hr>)(.+)$/gm, '<p>$1</p>');
  
  return content;
}

// Function to make an element draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  // Move from header or whole element if no header
  const header = element.querySelector('.page-assistant-header');
  
  if (header) {
    header.style.cursor = 'move';
    header.onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Compute new position ensuring element stays within viewport
    let newTop = (element.offsetTop - pos2);
    let newLeft = (element.offsetLeft - pos1);
    
    // Check boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    
    // Ensure element doesn't go off-screen
    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    if (newLeft + elementWidth > viewportWidth) newLeft = viewportWidth - elementWidth;
    if (newTop + elementHeight > viewportHeight) newTop = viewportHeight - elementHeight;
    
    // Set the element's new position
    element.style.top = newTop + "px";
    element.style.left = newLeft + "px";
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
  
  // Add resizing functionality via the handle
  const resizeHandle = element.querySelector('.page-assistant-resize-handle');
  if (resizeHandle) {
    resizeHandle.onmousedown = initResize;
  }
  
  function initResize(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Start position
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    document.onmouseup = stopResize;
    document.onmousemove = resize;
  }
  
  function resize(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Calculate change
    const dx = e.clientX - pos3;
    const dy = e.clientY - pos4;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Update element size
    element.style.width = (element.offsetWidth + dx) + 'px';
    element.style.height = (element.offsetHeight + dy) + 'px';
  }
  
  function stopResize() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Function to initialize dragging
function initDrag(element, header) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  header.style.cursor = 'move';
  header.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Compute new position ensuring element stays within viewport
    let newTop = (element.offsetTop - pos2);
    let newLeft = (element.offsetLeft - pos1);
    
    // Check boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    
    // Ensure element doesn't go off-screen
    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    if (newLeft + elementWidth > viewportWidth) newLeft = viewportWidth - elementWidth;
    if (newTop + elementHeight > viewportHeight) newTop = viewportHeight - elementHeight;
    
    // Set the element's new position
    element.style.top = newTop + "px";
    element.style.left = newLeft + "px";
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Function to initialize resizing
function initResize(element, resizeHandle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  resizeHandle.onmousedown = initResizeStart;
  
  function initResizeStart(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Start position
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    document.onmouseup = stopResize;
    document.onmousemove = resize;
  }
  
  function resize(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Calculate change
    const dx = e.clientX - pos3;
    const dy = e.clientY - pos4;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Update element size
    element.style.width = (element.offsetWidth + dx) + 'px';
    element.style.height = (element.offsetHeight + dy) + 'px';
  }
  
  function stopResize() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Function to capture vision data from the page
async function captureVisionData() {
  try {
    // Get all images on the page
    const images = Array.from(document.images);
    
    // Get all visible elements with text
    const visibleElements = Array.from(document.querySelectorAll('body *'))
      .filter(el => 
        window.getComputedStyle(el).display !== 'none' &&
        window.getComputedStyle(el).visibility !== 'hidden' &&
        el.offsetWidth > 0 &&
        el.offsetHeight > 0
      );

    // Get the viewport dimensions
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Get scroll position
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };

    // Get the current viewport content
    const viewportContent = Array.from(document.querySelectorAll('body *'))
      .filter(el => 
        el.getBoundingClientRect().top < window.innerHeight &&
        el.getBoundingClientRect().bottom > 0
      )
      .map(el => ({
        tagName: el.tagName,
        text: el.textContent.trim(),
        rect: el.getBoundingClientRect()
      }));

    // Get the current image in viewport (if any)
    const visibleImage = images.find(img => 
      img.getBoundingClientRect().top < window.innerHeight &&
      img.getBoundingClientRect().bottom > 0
    );

    // Get image metadata
    const imageMetadata = images.map(img => ({
      src: img.src,
      alt: img.alt || '',
      width: img.width,
      height: img.height,
      rect: img.getBoundingClientRect(),
      position: 'visible' || 'hidden',
      context: {
        surroundingText: img.closest('p, div, section')?.textContent.trim() || '',
        container: img.closest('figure, .image-container')?.className || '',
        caption: img.closest('figure')?.querySelector('figcaption')?.textContent || ''
      }
    }));

    return {
      images: imageMetadata,
      visibleElements: visibleElements.map(el => ({
        tagName: el.tagName,
        text: el.textContent.trim(),
        rect: el.getBoundingClientRect()
      })),
      viewport,
      scrollPosition,
      viewportContent,
      visibleImage: visibleImage ? {
        src: visibleImage.src,
        alt: visibleImage.alt || '',
        width: visibleImage.width,
        height: visibleImage.height,
        rect: visibleImage.getBoundingClientRect(),
        context: {
          surroundingText: visibleImage.closest('p, div, section')?.textContent.trim() || '',
          container: visibleImage.closest('figure, .image-container')?.className || '',
          caption: visibleImage.closest('figure')?.querySelector('figcaption')?.textContent || ''
        }
      } : null
    };
  } catch (error) {
    console.error('Error capturing vision data:', error);
    return null;
  }
}

// Function to get YouTube video information
async function getYouTubeVideoInfo(url) {
  try {
    const videoId = url.includes('/shorts/') 
      ? url.split('/shorts/')[1].split(/[?&]/)[0]
      : url.split('v=')[1]?.split(/[?&]/)[0];
    
    if (!videoId) return null;

    // Use YouTube IFrame API to get video information
    const player = new YT.Player('player', {
      videoId: videoId,
      events: {
        'onReady': function(event) {
          const player = event.target;
          const videoInfo = {
            title: player.getVideoData().title,
            channel: player.getVideoData().author,
            duration: player.getDuration(),
            viewCount: player.getVideoData().viewCount,
            likes: player.getVideoData().likes,
            dislikes: player.getVideoData().dislikes,
            publishedAt: player.getVideoData().published,
            description: player.getVideoData().description
          };
          
          // Send video info back to content script
          chrome.runtime.sendMessage({
            action: 'youtubeVideoInfo',
            info: videoInfo
          });
        }
      }
    });
  } catch (error) {
    console.error('Error getting YouTube video info:', error);
    return null;
  }
}

// Initialize YouTube IFrame API
function onYouTubeIframeAPIReady() {
  // Check if we're on a YouTube video page
  if (window.location.href.includes('youtube.com') && (window.location.href.includes('/watch') || window.location.href.includes('/shorts'))) {
    getYouTubeVideoInfo(window.location.href);
  }
}

// Load YouTube IFrame API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    // Get page content
    const pageContent = document.documentElement.outerHTML;
    const url = window.location.href;

    // Check if it's a YouTube video page and get video info
    if (url.includes('youtube.com') && (url.includes('/watch') || url.includes('/shorts'))) {
      getYouTubeVideoInfo(url);
    }

    // Send page content to background script
    chrome.runtime.sendMessage({
      action: 'analyzePageContext',
      pageContent: pageContent,
      url: url
    });
  }
});

// Function to create the popup button
function createPopupButton() {
  if (popupButton) return;
  
  popupButton = document.createElement('div');
  popupButton.className = 'page-assistant-popup-button';
  
  // Classic rocket ship icon
  popupButton.innerHTML = `
    <svg class="page-assistant-popup-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0 5 0 5"></path>
    </svg>
  `;
  
  document.body.appendChild(popupButton);
  
  // Add click event listener
  popupButton.addEventListener('click', openAssistant);
}

// Initialize popup button on page load
document.addEventListener('DOMContentLoaded', function() {
  createPopupButton();
});

// Create popup button even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPopupButton);
} else {
  createPopupButton();
}

// Function to analyze the page and get content
async function analyzePage() {
  try {
    // Get the page URL
    const pageUrl = window.location.href;

    // Get the page title
    const pageTitle = document.title;

    // Get all headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(heading => ({
        text: heading.textContent.trim(),
        level: heading.tagName.toLowerCase(),
        rect: heading.getBoundingClientRect()
      }));

    // Get meta description
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

    // Get structured data
    const structuredData = {
      schemaOrg: Array.from(document.querySelectorAll('[itemtype], [itemprop]')).map(el => ({
        type: el.getAttribute('itemtype'),
        props: Array.from(el.attributes).reduce((acc, attr) => {
          if (attr.name === 'itemprop') {
            acc[attr.value] = el.textContent.trim();
          }
          return acc;
        }, {})
      })),
      metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
        name: meta.getAttribute('name'),
        property: meta.getAttribute('property'),
        content: meta.getAttribute('content')
      })),
      openGraph: Array.from(document.querySelectorAll('meta[property^="og:"]')).map(meta => ({
        property: meta.getAttribute('property'),
        content: meta.getAttribute('content')
      }))
    };

    // Get main content
    const mainContent = Array.from(document.querySelectorAll('main, article, section'))
      .map(section => ({
        tagName: section.tagName,
        text: section.textContent.trim(),
        rect: section.getBoundingClientRect()
      }));

    // Get navigation elements
    const navigation = Array.from(document.querySelectorAll('nav, .nav, .navbar'))
      .map(nav => ({
        tagName: nav.tagName,
        text: nav.textContent.trim(),
        rect: nav.getBoundingClientRect()
      }));

    // Get form elements
    const forms = Array.from(document.querySelectorAll('form'))
      .map(form => ({
        tagName: form.tagName,
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type,
          name: input.name,
          value: input.value,
          placeholder: input.placeholder,
          rect: input.getBoundingClientRect()
        })),
        rect: form.getBoundingClientRect()
      }));

    // Capture vision data
    const visionData = await captureVisionData();

    // Send the analysis back to the background script
    chrome.runtime.sendMessage({
      action: 'analyzePageContext',
      pageUrl,
      pageTitle,
      headings,
      metaDescription,
      structuredData,
      mainContent,
      navigation,
      forms,
      visionData
    });
  } catch (error) {
    console.error('Error analyzing page:', error);
    // Send an error message back to the background script
    chrome.runtime.sendMessage({
      action: 'analyzePageContextError',
      error: error.message
    });
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    analyzePage();
    sendResponse({ success: true });
    return true;
  }
  return false;
});

// Initialize the content script
analyzePage();

// Function to capture webpage content
async function captureWebContent() {
  try {
    // Get basic page info
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      h1: document.querySelector('h1')?.textContent,
      h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent),
      h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent)
    };

    // Get main content
    const mainContent = {
      paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim()),
      links: Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.trim(),
        href: a.href
      })),
      images: Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        title: img.title
      })),
      lists: Array.from(document.querySelectorAll('ul, ol')).map(list => ({
        type: list.tagName.toLowerCase(),
        items: Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim())
      }))
    };

    // Get structured data
    const structuredData = {
      schemaOrg: Array.from(document.querySelectorAll('[itemtype], [itemprop]')).map(el => ({
        type: el.getAttribute('itemtype'),
        props: Array.from(el.attributes).reduce((acc, attr) => {
          if (attr.name === 'itemprop') {
            acc[attr.value] = el.textContent.trim();
          }
          return acc;
        }, {})
      })),
      metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
        name: meta.getAttribute('name'),
        property: meta.getAttribute('property'),
        content: meta.getAttribute('content')
      })),
      openGraph: Array.from(document.querySelectorAll('meta[property^="og:"]')).map(meta => ({
        property: meta.getAttribute('property'),
        content: meta.getAttribute('content')
      }))
    };

    return {
      pageInfo,
      mainContent,
      structuredData
    };
  } catch (error) {
    console.error('Error capturing web content:', error);
    return null;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    // Capture web content
    const webContent = captureWebContent();
    
    // Send content to background script
    chrome.runtime.sendMessage({
      action: 'analyzePageContext',
      webContent: webContent,
      url: window.location.href
    });
  }
});
