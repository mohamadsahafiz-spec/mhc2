import React from 'react';

interface HealthGaugeProps {
  score: number; // 0 - 100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  score,
  label,
  size = 'md',
  showBar = true
}) => {
  const getScoreColor = (val: number) => {
    if (val >= 90) return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30' };
    if (val >= 75) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30' };
    return { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/30' };
  };

  const colors = getScoreColor(score);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg font-bold'
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
        <span className={`font-mono font-semibold ${colors.text} ${sizeClasses[size]}`}>
          {score}%
        </span>
      </div>
      {showBar && (
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bg}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  );
};
