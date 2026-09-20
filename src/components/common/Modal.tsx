import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { 
  createScaleFadeVariants, 
  createFadeVariants, 
  mechanicalPressConfig 
} from '../../theme/motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  id
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-[96vw]'
  };

  const resolvedMaxWidth = maxWidthClasses[maxWidth as keyof typeof maxWidthClasses] || (typeof maxWidth === 'string' && maxWidth.startsWith('max-w-') ? maxWidth : maxWidthClasses['2xl']);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={id}
          variants={createFadeVariants(prefersReducedMotion)}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            variants={createScaleFadeVariants(prefersReducedMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`w-full ${resolvedMaxWidth} border rounded-modal shadow-theme-modal backdrop-theme-surface overflow-hidden flex flex-col max-h-[90vh] bg-raised border-theme-default text-theme-primary`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b bg-surface border-theme-default">
              <div>
                <h2 className="text-lg font-theme-heading text-theme-primary">{title}</h2>
                {subtitle && <p className="text-xs mt-0.5 font-theme-label text-theme-muted">{subtitle}</p>}
              </div>
              <motion.button
                whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
                onClick={onClose}
                className="p-1.5 rounded-button transition-colors text-theme-secondary hover:text-theme-primary hover:bg-surface"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
