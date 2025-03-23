
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Code, Zap } from 'lucide-react';
import FloatingButton from '@/components/FloatingButton';
import ChatInterface from '@/components/ChatInterface';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGroqApi } from '@/services/groqService';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-background/80">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container max-w-4xl mx-auto px-4 py-12 md:py-24"
      >
        <motion.div 
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-4"
        >
          Page Assistant
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-xl text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
        >
          Your intelligent companion powered by Groq that helps you understand any web page with zero latency
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="bg-background/50 backdrop-blur-sm border border-border/30">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Instant Answers</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get immediate responses to your questions about page content with zero latency
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur-sm border border-border/30">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Powered by Groq</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Leveraging Groq's ultra-fast LLM inference to provide insights about any web page
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur-sm border border-border/30">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ChevronRight className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Easy to Use</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Simply click the floating button on any page to start a conversation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
        >
          <Card className="bg-background/60 backdrop-blur-md border border-border/30 overflow-hidden">
            <CardHeader className="pb-2">
              <h3 className="text-xl font-semibold">{apiKey ? 'You\'re all set!' : 'Get Started'}</h3>
            </CardHeader>
            <CardContent>
              {!apiKey ? (
                <form onSubmit={handleSaveApiKey} className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your Groq API Key to start exploring the extension's capabilities.
                  </p>
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
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Your Groq API key is set. Click the button below to try out the Page Assistant.
                </p>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30">
              <Button
                onClick={toggleChat}
                className="w-full"
                variant={apiKey ? "default" : "secondary"}
                disabled={!apiKey}
              >
                {apiKey ? "Try Page Assistant" : "Enter API Key to Continue"}
                {apiKey && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.p 
          variants={itemVariants}
          className="text-center text-xs text-muted-foreground mt-12"
        >
          Note: This is a prototype. The final extension will analyze the content of your active Chrome tab.
        </motion.p>
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
