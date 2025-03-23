
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
        You are a helpful assistant that answers questions about webpage content.
        
        You have been given the following content from a webpage:
        ---
        ${pageContent.substring(0, 15000)} ${pageContent.length > 15000 ? '... (content truncated)' : ''}
        ---
        
        Please answer the following question about this content. If the content doesn't contain information relevant to the question, say so honestly.
        
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
