
import { useState, useEffect } from 'react';

export const usePageContent = () => {
  const [content, setContent] = useState<string>('');
  
  useEffect(() => {
    // In a real Chrome extension, this would access the DOM of the active tab
    // For our prototype, we'll use the current page content
    
    const extractPageContent = () => {
      // Get text content from the page
      const pageText = document.body.innerText;
      // Get meta description
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      // Get headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent).join(' ');
      
      // Combine all content
      return `Page Title: ${document.title}\nMeta Description: ${metaDescription}\nHeadings: ${headings}\nContent: ${pageText}`;
    };
    
    setContent(extractPageContent());
    
    // In a real extension, we would need to update the content when the page changes
    // This is just a simulation for the prototype
  }, []);
  
  return content;
};
