// Initialize connection with Groq API
chrome.runtime.onInstalled.addListener(() => {
  console.log('Page Assistant extension installed/updated.');
});

/**
 * Processes a user's question using the Groq API, providing page context and potentially image URLs.
 * @param {string} question - The user's question.
 * @param {object} context - The structured page context extracted by the content script.
 * @returns {Promise<string>} - The AI's answer.
 */
async function processQuestionWithGroq(question, context) {
  if (!context || !context.url) {
      console.error("Context object is missing or invalid.", context);
      return Promise.reject(new Error("Invalid page context received."));
  }

  console.log("Processing question with context for URL:", context.url);

  try {
    // --- Prepare Prompt & Image Data ---
    const mainText = context.mainContent?.excerpt || context.mainContent?.textContent?.substring(0, 1500) || context.textContentSummary || "No main content could be extracted.";
    const pageTitle = context.title || context.mainContent?.title || context.metadata?.ogTitle || "N/A";
    const headingsSummary = context.headings?.slice(0, 5).map(h => `(${h.level}) ${h.text}`).join('; ') || "N/A";

    // Select relevant images (e.g., first 3 from main content context with valid URLs)
    const relevantImages = (context.imageContext || [])
        .filter(img => img.src && (img.src.startsWith('http:') || img.src.startsWith('https:'))) // Ensure valid, absolute URLs
        .slice(0, 3); // Limit to the first 3 images for brevity/cost

    const imageContextText = relevantImages.length > 0
        ? `Additionally, consider the following ${relevantImages.length} image(s) provided separately: ${relevantImages.map((img, i) => `[Image ${i+1}${img.alt ? ` - Alt: "${img.alt}"` : ''}]`).join(', ')}`
        : "No relevant images were selected for analysis.";

    const systemPrompt = `You are Maverick, a factual AI assistant designed to provide comprehensive, detailed analysis based on web page context.

Personality & Instructions:
- Direct, factual, and professional tone.
- Provide detailed, comprehensive answers using *only* the provided context. Do not hallucinate or make assumptions beyond the context.
- If the context is insufficient to answer, state that clearly.
- Structure answers logically using Markdown (headings, lists, bold text).
- When summarizing (e.g., for "what's this page about?"), focus on the main content identified.
- Cite information by referring to the elements in the context (e.g., "The main heading states...", "The excerpt mentions..."). Do not add external links unless they are explicitly present in the provided context.
- Prioritize accuracy and depth based *solely* on the provided information.`;

    const userPromptText = `Web Page Context:
---
URL: ${context.url}
Page Title: ${pageTitle}
Extracted Main Text Excerpt/Summary:
"${mainText}"
Key Headings: ${headingsSummary}
${context.metadata?.description ? `Meta Description: ${context.metadata.description}` : ''}
${context.youtubeInfo ? `YouTube Info: Title: ${context.youtubeInfo.title || 'N/A'}, Channel: ${context.youtubeInfo.channel || 'N/A'}` : ''}
---
Image Context Overview: ${imageContextText}
---

Based *only* on the context provided above, please give a detailed and comprehensive answer to the following question:

QUESTION: ${question}`;

    // --- Make API Call ---
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_API_KEY_HERE`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPromptText }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error Response:', errorData);
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();
    if (!responseData.choices || responseData.choices.length === 0 || !responseData.choices[0].message?.content) {
        console.error('Groq API Invalid Response Structure:', responseData);
        throw new Error("Received an invalid response structure from the API.");
    }

    console.log("Groq API Success. Choice finish reason:", responseData.choices[0].finish_reason);
    return responseData.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error in processQuestionWithGroq:', error);
    return `# Error Processing Request

An error occurred while communicating with the AI model:

\`\`\`
${error.message}
\`\`\`

**Suggestions:**
*   Set your API key in the extension's popup or options page.
*   Check your internet connection.
*   Try asking the question differently.
*   The page content might be too complex or large.`;
  }
}

/**
 * Analyzes the page context to provide a general summary or key points.
 * @param {object} context - The structured page context.
 * @returns {Promise<string>} - The AI's analysis.
 */
async function analyzePageContext(context) {
    if (!context || !context.url) {
      console.error("Context object is missing or invalid for analysis.", context);
      return Promise.reject(new Error("Invalid page context received for analysis."));
    }
    console.log("Analyzing context for URL:", context.url);

    try {
        // --- Construct Prompt for Analysis ---
        const mainText = context.mainContent?.excerpt || context.mainContent?.textContent?.substring(0, 1500) || context.textContentSummary || "No main content could be extracted.";
        const pageTitle = context.title || context.mainContent?.title || context.metadata?.ogTitle || "N/A";
        const headingsSummary = context.headings?.slice(0, 5).map(h => `(${h.level}) ${h.text}`).join('; ') || "N/A";

        const systemPrompt = `You are an AI assistant specialized in analyzing and summarizing web page content concisely. Focus on identifying the main topic and key takeaways based *only* on the provided context. Use Markdown for clear formatting.`;

        const userPrompt = `Web Page Context:
---
URL: ${context.url}
Page Title: ${pageTitle}
Extracted Main Text Excerpt/Summary:
"${mainText}"
Key Headings: ${headingsSummary}
${context.metadata?.description ? `Meta Description: ${context.metadata.description}` : ''}
---

Based *only* on the context provided above, please provide:
1.  A brief (1-2 sentence) summary of the main topic.
2.  A few key points or takeaways (as a bulleted list).`;

        // --- Make API Call ---
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer YOUR_API_KEY_HERE`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gemma2-9b-it',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API Error Response (Analysis):', errorData);
            throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const responseData = await response.json();
        if (!responseData.choices || responseData.choices.length === 0 || !responseData.choices[0].message?.content) {
            console.error('Groq API Invalid Response Structure (Analysis):', responseData);
            throw new Error("Received an invalid response structure from the API during analysis.");
        }

        console.log("Groq API Analysis Success. Choice finish reason:", responseData.choices[0].finish_reason);
        return responseData.choices[0].message.content.trim();

    } catch (error) {
        console.error('Error in analyzePageContext:', error);
        return `# Error Analyzing Context

An error occurred: \`${error.message}\``;
    }
}

// --- Message Handling ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const senderTabUrl = sender.tab ? sender.tab.url : (sender.url || 'N/A');
  console.log(`Background received '${request.action}' from: ${senderTabUrl}`);

  switch (request.action) {
    case 'processQuestion':
      if (!request.question || !request.context) {
          console.error('Missing question or context for processQuestion');
          sendResponse({ error: 'Invalid request: Missing question or context.' });
          return false;
      }

      processQuestionWithGroq(request.question, request.context)
        .then(answer => {
          console.log('Successfully processed question, sending response.');
          sendResponse({ answer });
        })
        .catch(error => {
          console.error('Caught error processing question:', error);
          sendResponse({ answer: error.message || '# Error\n\nAn unexpected error occurred.' });
        });

      return true;

    case 'analyzePageContext':
      if (!request.context) {
          console.error('Missing context for analyzePageContext');
          sendResponse({ error: 'Invalid request: Missing context.' });
          return false;
      }

      analyzePageContext(request.context)
        .then(contextAnalysis => {
          console.log('Successfully analyzed page context, sending response.');
          sendResponse({ contextAnalysis });
        })
        .catch(error => {
          console.error('Caught error analyzing page context:', error);
          sendResponse({ error: error.message || 'Failed to analyze page context.' });
        });

      return true;

    case 'broadcastOpenAssistant':
      console.log('Broadcasting request to open assistant in relevant tabs');
      chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, function(tabs) {
        let sentCount = 0;
        for (let tab of tabs) {
          if (tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
            chrome.tabs.sendMessage(tab.id, { action: 'openAssistantInTab' })
              .then(() => { sentCount++; })
              .catch(error => {
                console.log(`Could not send 'openAssistantInTab' to tab ${tab.id}: ${error.message}`);
              });
          }
        }
      });
      
      sendResponse({ success: true, message: "Broadcast initiated." });
      return false;

    default:
      console.warn('Background script received unknown action:', request.action);
      sendResponse({ error: `Unknown action: ${request.action}` });
      return false;
  }
});

// --- Error Logging ---

self.addEventListener('error', (event) => {
  console.error('Background Script Error:', event.message, event.filename, event.lineno, event.colno, event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Background Script Unhandled Promise Rejection:', event.reason);
});

console.log("Background service worker started successfully.");
