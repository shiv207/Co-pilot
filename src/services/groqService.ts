
import { useState } from 'react';
import { toast } from 'sonner';

interface GroqCompletionResponse {
  choices: {
    message: {
      content: string;
    }
  }[];
}

export const useGroqApi = () => {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem('groq_api_key') || null
  );

  const saveApiKey = (key: string) => {
    localStorage.setItem('groq_api_key', key);
    setApiKey(key);
    toast.success('API key saved successfully');
  };

  const processQuestion = async (question: string, pageContent: string): Promise<string> => {
    if (!apiKey) {
      toast.error('API key is not set');
      throw new Error('API key not set');
    }

    try {
      const prompt = `
        You are a helpful AI assistant that provides context-aware, accurate answers about webpage content.
        
        You have been given the following content from a webpage:
        ---
        ${pageContent.substring(0, 15000)} ${pageContent.length > 15000 ? '... (content truncated)' : ''}
        ---
        
        Please answer the following question about this content. If the content doesn't contain information relevant to the question, say so honestly.
        
        IMPORTANT GUIDELINES:
        1. Always reference the content when answering.
        2. Use phrases like "According to this page," "The page states," or "Based on the content" to make clear you're referencing the current page.
        3. If answering a general knowledge question, clarify whether your answer is from the page or general knowledge.
        4. Keep answers concise but informative.
        5. Quote relevant sections when appropriate using quotation marks.
        6. If the question asks for opinions or predictions, note that you're providing information based on what's written, not your own opinion.
        
        QUESTION: ${question}
      `;

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
              content: 'You are a helpful, accurate, and context-aware assistant that analyzes web page content and answers questions based on the content. Always indicate when your responses are based on the page content by using phrases like "According to this page," "The content shows," etc.'
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
        toast.error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: GroqCompletionResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error processing question:', error);
      throw error;
    }
  };

  return {
    apiKey,
    saveApiKey,
    processQuestion,
  };
};
