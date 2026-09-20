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
      className={`border rounded-card shadow-theme-card backdrop-theme-surface transition-all duration-200 bg-surface border-theme-default text-theme-primary ${
        isClickable ? 'cursor-pointer select-none hover:border-theme-strong' : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-theme-subtle">
          <div>
            {title && typeof title === 'string' ? (
              <h3 className="text-base font-theme-heading text-theme-primary">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs mt-0.5 font-theme-label text-theme-muted">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
};
