
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles, LoaderCircle, Globe, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Message, { MessageProps } from '@/components/Message';
import { cn } from '@/lib/utils';
import { useGroqApi } from '@/services/groqService';
import { useToast } from '@/components/ui/use-toast';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  pageContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  pageContent = ''
}) => {
  const [messages, setMessages] = useState<MessageProps[]>([
    { type: 'assistant', content: 'Hi there! How can I help you with this page content? I\'ll provide answers with context from what you\'re looking at.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { processQuestion, apiKey } = useGroqApi();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Groq API key in the extension popup",
        variant: "destructive",
      });
      return;
    }
    
    const userMessage = { type: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await processQuestion(input, pageContent);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: response
      }]);
    } catch (error) {
      console.error('Error processing question:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'w-[420px] h-[580px] rounded-2xl overflow-hidden',
            'bg-black shadow-2xl',
            'border border-white/10 flex flex-col'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="font-medium text-lg">Grok</span>
                <span className="ml-2 text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">beta</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-white/10"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          
          {/* Context Indicator - Removed to match Grok UI */}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <Message
                key={index}
                type={message.type}
                content={message.content}
                isLast={index === messages.length - 1}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start px-4 py-3">
                <div className="ml-3 max-w-[80%] rounded-2xl bg-zinc-800/80 p-4 text-sm">
                  <div className="flex space-x-2">
                    <span className="h-2 w-2 rounded-full bg-white/50 animate-pulse"></span>
                    <span className="h-2 w-2 rounded-full bg-white/50 animate-pulse delay-150"></span>
                    <span className="h-2 w-2 rounded-full bg-white/50 animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
            <div className="relative flex items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the page content..."
                className="pr-12 rounded-full py-6 bg-zinc-800/80 focus:bg-zinc-700/80 focus-visible:ring-0 border-0"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 h-8 w-8 rounded-full bg-white text-black hover:bg-white/90"
              >
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;
