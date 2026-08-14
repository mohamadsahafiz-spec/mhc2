import React from 'react';
import { useTheme } from '../../context/ThemeContext';

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

  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: isDark 
      ? 'bg-[#8B9DFF] hover:bg-[#A3B2FF] text-slate-950 font-bold shadow-xs' 
      : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm',
    secondary: isDark
      ? 'bg-[#1A1D21] hover:bg-[#20252B] text-slate-100 border border-[#2B323A]'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300/80 font-semibold',
    danger: isDark
      ? 'bg-[#E98A8A]/20 hover:bg-[#E98A8A]/30 text-[#E98A8A] border border-[#E98A8A]/40 font-semibold'
      : 'bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm',
    outline: isDark
      ? 'border border-[#2B323A] hover:border-[#8B9DFF]/50 text-slate-200 hover:bg-[#1A1D21]'
      : 'border border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-100/90 font-medium',
    ghost: isDark
      ? 'text-slate-400 hover:text-slate-100 hover:bg-[#1A1D21]'
      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-medium'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold'
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
