import React from 'react';
import { ProgressBar, ProgressBarVariant } from './ProgressBar';

interface HealthGaugeProps {
  score: number; // 0 - 100
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  className?: string;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  score,
  label,
  showLabel = true,
  size = 'md',
  showBar = true,
  className = ''
}) => {
  const getScoreVariant = (val: number): { variant: ProgressBarVariant; text: string } => {
    if (val >= 90) return { variant: 'success', text: 'text-emerald-400' };
    if (val >= 75) return { variant: 'warning', text: 'text-amber-400' };
    return { variant: 'danger', text: 'text-rose-400' };
  };

  const { variant, text } = getScoreVariant(score);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg font-bold'
  };

  const barSizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
          <span className={`font-mono font-semibold ${text} ${sizeClasses[size]}`}>
            {score}%
          </span>
        </div>
      )}
      {showBar && (
        <ProgressBar
          value={score}
          variant={variant}
          size={barSizes[size]}
          animated={true}
        />
      )}
    </div>
  );
};
