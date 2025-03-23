
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, X, CornerDownLeft, Sparkles } from 'lucide-react';
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
  const { processQuestion } = useGroqApi();
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
    
    const userMessage = { type: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // For the prototype, we'll simulate a response
      // In the real extension, we would call the Groq API
      
      setTimeout(() => {
        const response = processQuestion(input, pageContent);
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          content: response
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error processing question:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
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
            'w-[380px] h-[520px] rounded-2xl overflow-hidden',
            'glass-morphism flex flex-col shadow-2xl'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Page Assistant</h3>
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
          <div className="flex-1 overflow-y-auto p-2">
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <span className="block h-3 w-3 animate-pulse-subtle rounded-full bg-white/80"></span>
                </div>
                <div className="ml-3 flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse-subtle"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse-subtle delay-150"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse-subtle delay-300"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border p-4">
            <div className="relative flex items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this page..."
                className="pr-10 focus-visible:ring-1 focus-visible:ring-primary/30"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-1 h-8 w-8 rounded-full"
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  input.trim() ? <SendHorizontal className="h-4 w-4" /> : <CornerDownLeft className="h-4 w-4" />
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
