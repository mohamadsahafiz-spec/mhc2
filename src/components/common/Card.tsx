import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { mechanicalPressConfig } from '../../theme/motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  padding = 'md',
  id,
  onClick,
  interactive = false
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  const isClickable = interactive || Boolean(onClick);

  return (
    <motion.div
      id={id}
      onClick={onClick}
      whileHover={isClickable && !prefersReducedMotion ? mechanicalPressConfig.hover : undefined}
      whileTap={isClickable && !prefersReducedMotion ? mechanicalPressConfig.subtleTap : undefined}
      className={`border rounded-2xl transition-colors duration-150 ${
        isClickable ? 'cursor-pointer select-none' : ''
      } ${
        isDark 
          ? 'bg-[#20252B] border-[#2B323A] text-[#F3F4F6]' 
          : 'bg-white border-slate-300/80 text-slate-900 shadow-xs'
      } ${paddingStyles[padding]} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
          isDark ? 'border-[#2B323A]/60' : 'border-slate-200'
        }`}>
          <div>
            {title && typeof title === 'string' ? (
              <h3 className={`text-base font-semibold tracking-tight ${isDark ? 'text-[#F3F4F6]' : 'text-slate-900'}`}>{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
};
