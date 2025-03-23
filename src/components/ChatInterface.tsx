
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles, LoaderCircle } from 'lucide-react';
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
    { type: 'assistant', content: 'Hi there! How can I help you with this page?' }
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
            'bg-background/80 backdrop-blur-xl shadow-2xl',
            'border border-border/40 flex flex-col'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium text-lg">Page Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                </div>
                <div className="ml-3 max-w-[80%] rounded-2xl bg-secondary p-4 text-sm">
                  <div className="flex space-x-2">
                    <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse"></span>
                    <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse delay-150"></span>
                    <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border/30 p-4">
            <div className="relative flex items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the page content..."
                className="pr-12 rounded-full py-6 bg-background/50 focus:bg-background focus-visible:ring-1 focus-visible:ring-primary/50 border-border/50"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
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
