
import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageType = 'user' | 'assistant';

export interface MessageProps {
  type: MessageType;
  content: string;
  isLast?: boolean;
}

const Message: React.FC<MessageProps> = ({ type, content, isLast = false }) => {
  const isUser = type === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 px-2 py-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/95 text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}
      
      <div
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary/75 text-secondary-foreground'
        )}
      >
        {content}
      </div>
      
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
};

export default Message;
