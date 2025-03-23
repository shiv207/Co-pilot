
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
        sendResponse({ error: error.message || 'Failed to process question' });
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

    // Create a prompt for the model
    const prompt = `
      You are a helpful assistant that answers questions about webpage content.
      
      You have been given the following content from a webpage:
      ---
      ${pageContent.substring(0, 15000)} ${pageContent.length > 15000 ? '... (content truncated)' : ''}
      ---
      
      Please answer the following question about this content. If the content doesn't contain information relevant to the question, say so honestly.
      
      QUESTION: ${question}
    `;

    // Make an API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful, accurate, and concise assistant that analyzes web page content and answers questions based on it.'
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in processQuestionWithGroq:', error);
    throw error;
  }
}
