import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { motionTimings, motionEasings } from '../../theme/motion';

export type ProgressBarVariant = 'primary' | 'cyan' | 'success' | 'warning' | 'danger' | 'neutral';
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  label?: string;
  valueLabel?: string;
  showLabels?: boolean;
  animated?: boolean;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  id?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  size = 'sm',
  label,
  valueLabel,
  showLabels = false,
  animated = true,
  className = '',
  trackClassName = '',
  fillClassName = '',
  id
}) => {
  const { effectiveTheme } = useTheme();
  const prefersReducedMotion = Boolean(useReducedMotion());

  const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));

  // Size mapping
  const sizeClasses: Record<ProgressBarSize, string> = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3'
  };

  // Semantic variant mapping
  const variantFillClasses: Record<ProgressBarVariant, string> = {
    primary: 'lumen-bar-fill-primary',
    cyan: 'lumen-bar-fill-primary',
    success: 'lumen-bar-fill-success',
    warning: 'lumen-bar-fill-warning',
    danger: 'lumen-bar-fill-danger',
    neutral: 'lumen-bar-fill-neutral'
  };

  const variantTextClasses: Record<ProgressBarVariant, string> = {
    primary: 'text-cyan-400',
    cyan: 'text-cyan-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    neutral: 'text-slate-400'
  };

  return (
    <div id={id} className={`w-full flex flex-col gap-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono">
          {label && <span className="text-theme-muted font-medium">{label}</span>}
          <span className={`font-semibold ${variantTextClasses[variant]}`}>
            {valueLabel || `${clampedValue.toFixed(clampedValue % 1 === 0 ? 0 : 1)}%`}
          </span>
        </div>
      )}

      {/* Recessed Track */}
      <div 
        className={`w-full ${sizeClasses[size]} lumen-bar-track rounded-full overflow-hidden relative ${trackClassName}`}
      >
        {animated && !prefersReducedMotion ? (
          <motion.div
            className={`h-full rounded-full ${variantFillClasses[variant]} relative ${fillClassName}`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: motionTimings.standard, ease: motionEasings.responsive }}
          >
            {/* Luminous Leading Edge Highlight */}
            {clampedValue > 0 && clampedValue < 100 && (
              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/75 rounded-r-full shadow-[0_0_4px_#fff]" />
            )}
          </motion.div>
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ${variantFillClasses[variant]} relative ${fillClassName}`}
            style={{ width: `${clampedValue}%` }}
          >
            {/* Luminous Leading Edge Highlight */}
            {clampedValue > 0 && clampedValue < 100 && (
              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/75 rounded-r-full shadow-[0_0_4px_#fff]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
