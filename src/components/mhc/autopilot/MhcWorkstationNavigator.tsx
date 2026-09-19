import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { MHCAutopilotSessionProgress } from '../../../types';
import { mechanicalPressConfig } from '../../../theme/motion';
import { 
  MHC_WORKFLOW_SCHEDULE, 
  getActivityDisplayCode, 
  getParentActivityStatus, 
  AutopilotReadinessReport 
} from '../../../utils/mhcAutopilotBrain';

export interface MhcWorkstationNavigatorProps {
  progress: MHCAutopilotSessionProgress;
  readiness: AutopilotReadinessReport;
  onJumpToActivity: (code: string) => void;
  onDiscardSession?: () => void;
  isDiscardVisible?: boolean;
  isDark: boolean;
}

export const MhcWorkstationNavigator: React.FC<MhcWorkstationNavigatorProps> = ({
  progress,
  readiness,
  onJumpToActivity,
  onDiscardSession,
  isDiscardVisible,
  isDark
}) => {
  return (
    <aside className={`w-full md:w-64 lg:w-72 shrink-0 p-4 border-t md:border-t-0 md:border-l flex flex-col justify-between overflow-y-auto ${
      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-[var(--border-default)]'
    }`}>
      <div className="space-y-4">
        {/* Header & Overall Status */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
            SCHEDULE INDEX
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-[var(--border-default)] bg-[var(--surface-surface)] text-[var(--text-primary)]">
            {readiness.readinessScore}% READY
          </span>
        </div>

        {/* Schedule Activity Tree */}
        <div className="space-y-1.5">
          {MHC_WORKFLOW_SCHEDULE.map((dayGroup) => {
            const isParent = dayGroup.subItems && dayGroup.subItems.length > 0;
            const actStatus = isParent 
              ? getParentActivityStatus(dayGroup.code, progress.activityStatuses)
              : (progress.activityStatuses[dayGroup.code] || 'LOCKED');
            
            const isCurrentActive = progress.currentActivityCode === dayGroup.code;

            return (
              <div key={dayGroup.code + dayGroup.day} className="space-y-1">
                <motion.button
                  whileTap={actStatus !== 'LOCKED' ? mechanicalPressConfig.subtleTap : undefined}
                  disabled={actStatus === 'LOCKED'}
                  onClick={() => {
                    if (!isParent) onJumpToActivity(dayGroup.code);
                  }}
                  className={`w-full text-left p-1.5 rounded-lg text-[11px] border flex items-center justify-between transition-all ${
                    isCurrentActive
                      ? isDark
                        ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] ring-1 ring-slate-600'
                        : 'bg-white border-slate-300 text-slate-900 shadow-xs ring-1 ring-slate-400'
                      : actStatus === 'COMPLETED'
                      ? isDark
                        ? 'bg-[var(--surface-surface)]/40 border-[var(--border-subtle)] text-emerald-400 hover:bg-[var(--surface-surface)] cursor-pointer'
                        : 'bg-white border-slate-200 text-emerald-700 hover:bg-slate-50 cursor-pointer'
                      : actStatus === 'NEEDS_REVIEW'
                      ? isDark
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:bg-amber-950/40 cursor-pointer'
                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/60 cursor-pointer'
                      : actStatus === 'IN_PROGRESS'
                      ? isDark
                        ? 'bg-[var(--surface-raised)]/60 border-[var(--border-strong)] text-cyan-300 hover:bg-[var(--surface-raised)] cursor-pointer'
                        : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100/60 cursor-pointer'
                      : 'bg-transparent border-transparent text-[var(--text-subtle)] cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold">
                      {actStatus === 'COMPLETED' && <span className="text-emerald-400">✓</span>}
                      {actStatus === 'IN_PROGRESS' && <span className="text-cyan-400">●</span>}
                      {actStatus === 'NEEDS_REVIEW' && <span className="text-amber-400 font-bold">⚠</span>}
                      {actStatus === 'UPCOMING' && <span className="text-[var(--text-muted)]">○</span>}
                      {actStatus === 'LOCKED' && <span className="text-[var(--text-subtle)]">🔒</span>}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)] font-bold">
                      {dayGroup.displayCode || getActivityDisplayCode(dayGroup.code)}
                    </span>
                    <span className="truncate font-medium">{dayGroup.title}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">{dayGroup.day}</span>
                </motion.button>

                {/* Sub items if present */}
                {isParent && (
                  <div className="pl-3.5 space-y-1 pt-0.5 border-l border-[var(--border-default)] ml-2">
                    {dayGroup.subItems?.map((sub, sIdx) => {
                      const subStatus = progress.activityStatuses[sub.code] || 'LOCKED';
                      const isSubActive = progress.currentActivityCode === sub.code;
                      const isLast = sIdx === (dayGroup.subItems?.length || 0) - 1;

                      return (
                        <motion.button
                          key={sub.code}
                          whileTap={subStatus !== 'LOCKED' ? mechanicalPressConfig.subtleTap : undefined}
                          disabled={subStatus === 'LOCKED'}
                          onClick={() => onJumpToActivity(sub.code)}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono flex items-center justify-between border transition-all ${
                            isSubActive
                              ? isDark
                                ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] font-bold'
                                : 'bg-white border-slate-300 text-slate-900 font-bold shadow-xs'
                              : subStatus === 'COMPLETED'
                              ? 'bg-transparent border-transparent text-emerald-400 hover:bg-[var(--surface-surface)] cursor-pointer'
                              : subStatus === 'NEEDS_REVIEW'
                              ? 'bg-transparent border-transparent text-amber-400 hover:bg-[var(--surface-surface)] cursor-pointer'
                              : subStatus === 'IN_PROGRESS'
                              ? 'bg-transparent border-transparent text-cyan-400 hover:bg-[var(--surface-surface)] cursor-pointer'
                              : 'bg-transparent border-transparent text-[var(--text-subtle)] cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[var(--text-subtle)] font-bold">{isLast ? '└─' : '├─'}</span>
                            <span className="truncate">{sub.title}</span>
                          </div>
                          <span className="shrink-0 font-bold">
                            {subStatus === 'COMPLETED' && <span className="text-emerald-400">✓</span>}
                            {subStatus === 'IN_PROGRESS' && <span className="text-cyan-400">●</span>}
                            {subStatus === 'NEEDS_REVIEW' && <span className="text-amber-400">⚠</span>}
                            {subStatus === 'UPCOMING' && <span className="text-[var(--text-muted)]">○</span>}
                            {subStatus === 'LOCKED' && <span className="text-[var(--text-subtle)]">🔒</span>}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Utility */}
      {isDiscardVisible && onDiscardSession && (
        <div className="pt-4 border-t border-[var(--border-default)]">
          <motion.button
            id="mhc-autopilot-rail-discard-btn"
            whileTap={mechanicalPressConfig.subtleTap}
            onClick={(e) => {
              e.stopPropagation();
              onDiscardSession();
            }}
            title="Discard this unwanted draft session"
            className="w-full py-2 px-3 rounded-lg border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Discard Draft Session</span>
          </motion.button>
        </div>
      )}
    </aside>
  );
};
