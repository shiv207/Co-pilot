
import { useState } from 'react';
import { toast } from 'sonner';

// This is a placeholder service for the prototype
// In the actual extension, this would connect to the Groq API

export const useGroqApi = () => {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem('groq_api_key') || null
  );

  const saveApiKey = (key: string) => {
    localStorage.setItem('groq_api_key', key);
    setApiKey(key);
    toast.success('API key saved successfully');
  };

  const processQuestion = (question: string, pageContent: string): string => {
    // This is just a simulation for the prototype
    // In the real extension, we would make an API call to Groq
    
    console.log('Processing question:', question);
    console.log('Page content length:', pageContent.length);
    
    // Simulated responses for the prototype
    const responses = [
      "Based on the page content, it appears that the information you're looking for is related to the main topic discussed in paragraph 3.",
      "The page doesn't explicitly mention that, but it does discuss related concepts in the second section.",
      "According to the content, there are three main points to consider when addressing this question.",
      "The author seems to have a different perspective on this topic, suggesting that...",
      "While the page doesn't directly answer your question, it provides context that suggests...",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return {
    apiKey,
    saveApiKey,
    processQuestion,
  };
};
