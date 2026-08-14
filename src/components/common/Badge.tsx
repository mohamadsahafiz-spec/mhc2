import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'cyan' | 'indigo' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = true,
  className = ''
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const variantStylesDark = {
    emerald: 'bg-[#7FD4A6]/10 text-[#7FD4A6] border-[#7FD4A6]/30',
    amber: 'bg-[#EFCB7A]/10 text-[#EFCB7A] border-[#EFCB7A]/30',
    rose: 'bg-[#E98A8A]/10 text-[#E98A8A] border-[#E98A8A]/30',
    blue: 'bg-[#8B9DFF]/10 text-[#8B9DFF] border-[#8B9DFF]/30',
    cyan: 'bg-[#8ECDF7]/10 text-[#8ECDF7] border-[#8ECDF7]/30',
    indigo: 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/40',
    gray: 'bg-[#2B323A]/60 text-slate-300 border-[#2B323A]'
  };

  const variantStylesLight = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 font-semibold',
    amber: 'bg-amber-50 text-amber-800 border-amber-300/80 font-semibold',
    rose: 'bg-rose-50 text-rose-800 border-rose-300/80 font-semibold',
    blue: 'bg-indigo-50 text-indigo-800 border-indigo-300/80 font-semibold',
    cyan: 'bg-sky-50 text-sky-800 border-sky-300/80 font-semibold',
    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-300/80 font-semibold',
    gray: 'bg-slate-100 text-slate-800 border-slate-300/80 font-semibold'
  };

  const dotColorsDark = {
    emerald: 'bg-[#7FD4A6]',
    amber: 'bg-[#EFCB7A]',
    rose: 'bg-[#E98A8A]',
    blue: 'bg-[#8B9DFF]',
    cyan: 'bg-[#8ECDF7]',
    indigo: 'bg-[#8B9DFF]',
    gray: 'bg-slate-400'
  };

  const dotColorsLight = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    blue: 'bg-indigo-500',
    cyan: 'bg-sky-500',
    indigo: 'bg-indigo-600',
    gray: 'bg-slate-400'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  const styleMap = isDark ? variantStylesDark : variantStylesLight;
  const dotMap = isDark ? dotColorsDark : dotColorsLight;

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border tracking-wide whitespace-nowrap ${styleMap[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[variant]}`} />}
      {children}
    </span>
  );
};
