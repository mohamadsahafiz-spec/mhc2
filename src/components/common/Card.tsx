import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  padding = 'md',
  id
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  return (
    <div
      id={id}
      className={`border rounded-2xl transition-all duration-200 ${
        isDark 
          ? 'bg-[#20252B] border-[#2B323A] text-[#F3F4F6]' 
          : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
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
    </div>
  );
};
