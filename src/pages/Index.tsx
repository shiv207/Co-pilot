
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import FloatingButton from '@/components/FloatingButton';
import ChatInterface from '@/components/ChatInterface';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGroqApi } from '@/services/groqService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pageContent = usePageContent();
  const { apiKey, saveApiKey } = useGroqApi();
  const [inputApiKey, setInputApiKey] = useState('');

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputApiKey.trim()) {
      saveApiKey(inputApiKey.trim());
      setInputApiKey('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full text-center space-y-6"
      >
        <div className="mb-10 space-y-2">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Sparkles className="h-8 w-8" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold tracking-tight"
          >
            Page Assistant
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground"
          >
            Your intelligent companion powered by Groq
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Experience an AI assistant that analyzes page content and answers your questions with zero latency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the floating button in the bottom-right corner to start a conversation with the assistant. The assistant will analyze the content of the current page and help answer your questions.
              </p>
              
              {!apiKey && (
                <form onSubmit={handleSaveApiKey} className="space-y-2">
                  <p className="text-sm font-medium">Enter your Groq API Key:</p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      placeholder="sk-xxxxxxxxxxxxx"
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!inputApiKey.trim()}>
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </form>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={toggleChat}
                className="w-full"
                variant={apiKey ? "default" : "secondary"}
                disabled={!apiKey}
              >
                {apiKey ? "Open Assistant" : "Enter API Key to Continue"}
              </Button>
            </CardFooter>
          </Card>

          <div className="flex justify-center">
            <p className="text-xs text-muted-foreground">
              Note: This is a prototype. The final extension will analyze the content of your active Chrome tab.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <FloatingButton isOpen={isOpen} onClick={toggleChat} />
      <ChatInterface 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        pageContent={pageContent}
      />
    </div>
  );
};

export default Index;
