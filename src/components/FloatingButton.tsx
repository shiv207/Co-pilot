
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  isOpen,
  onClick,
  className,
}) => {
  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.button
          onClick={onClick}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full',
            'bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-lg',
            'transition-all duration-300 ease-in-out border border-white/10',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
            'animate-glow',
            className
          )}
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">Open Assistant</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default FloatingButton;
