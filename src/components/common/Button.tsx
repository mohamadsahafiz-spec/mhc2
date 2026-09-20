import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { mechanicalPressConfig } from '../../theme/motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  const base = 'inline-flex items-center justify-center font-theme-label rounded-button transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-slate-950 font-bold shadow-theme-glow',
    secondary: 'bg-surface hover:bg-raised text-theme-primary border border-theme-default',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 font-semibold',
    outline: 'border border-theme-default hover:border-theme-strong text-theme-primary hover:bg-surface',
    ghost: 'text-theme-secondary hover:text-theme-primary hover:bg-surface'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold'
  };

  const tapConfig = size === 'sm' ? mechanicalPressConfig.subtleTap : mechanicalPressConfig.tap;

  return (
    <motion.button
      whileTap={disabled || prefersReducedMotion ? undefined : tapConfig}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...(props as any)}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
};
