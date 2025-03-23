
// Initialize connection with Groq API
chrome.runtime.onInstalled.addListener(() => {
  console.log('Page Assistant extension installed.');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processQuestion') {
    processQuestionWithGroq(request.question, request.pageContent)
      .then(answer => {
        sendResponse({ answer });
      })
      .catch(error => {
        console.error('Error processing question:', error);
        sendResponse({ error: 'Failed to process question' });
      });
    
    // Return true to indicate that the response is asynchronous
    return true;
  }
});

// Function to process a question with Groq API
async function processQuestionWithGroq(question, pageContent) {
  try {
    // Get the API key from storage
    const data = await chrome.storage.local.get(['groq_api_key']);
    const apiKey = data.groq_api_key;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set your Groq API key in the extension popup.');
    }

    // In a real implementation, this would make an API call to Groq
    // For the prototype, we'll simulate a response
    return simulateGroqResponse(question, pageContent);
  } catch (error) {
    console.error('Error in processQuestionWithGroq:', error);
    throw error;
  }
}

// Function to simulate a Groq API response (for prototype)
function simulateGroqResponse(question, pageContent) {
  console.log('Question:', question);
  console.log('Page content length:', pageContent.length);
  
  // Extract a relevant snippet from the page content to make it seem like RAG
  const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
  let relevantContent = '';
  
  if (keywords.length > 0) {
    const contentParagraphs = pageContent.split('\n').filter(p => p.trim().length > 0);
    for (const paragraph of contentParagraphs) {
      if (keywords.some(keyword => paragraph.toLowerCase().includes(keyword))) {
        relevantContent = paragraph;
        break;
      }
    }
  }

  // If we couldn't find anything relevant, use a generic response
  if (!relevantContent) {
    const responses = [
      "Based on the page content, I can say that the information you're looking for isn't explicitly mentioned. The page focuses more on different topics.",
      "The page doesn't directly address your question, but it does discuss related concepts that might be helpful.",
      "From analyzing the page, I can tell you that there are several key points that might help answer your question indirectly.",
      "The content of this page is primarily about different subjects, but I can try to extract relevant information that might help with your question.",
      "While your specific question isn't addressed, the page contains information about related topics that might provide context."
    ];
    return Promise.resolve(responses[Math.floor(Math.random() * responses.length)]);
  }
  
  // Craft a response that seems like it's using the content
  const responseTemplates = [
    `Based on the page content, ${relevantContent.substring(0, 100)}...`,
    `According to the information on this page: "${relevantContent.substring(0, 120)}..."`,
    `I found this relevant section that might answer your question: "${relevantContent.substring(0, 100)}..."`,
    `The page mentions that ${relevantContent.substring(0, 120)}...`,
    `From the content, I can see that "${relevantContent.substring(0, 100)}..." This might help answer your question.`
  ];
  
  return Promise.resolve(responseTemplates[Math.floor(Math.random() * responseTemplates.length)]);
}
