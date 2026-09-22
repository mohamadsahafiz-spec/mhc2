import React, { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { MHCAutopilotSessionProgress } from '../../../types';
import { mechanicalPressConfig, motionTimings, motionEasings } from '../../../theme/motion';
import { useTheme } from '../../../context/ThemeContext';
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

// Flat ordered sequence of all activities to determine directional travel & track position
const ACTIVITY_PROGRESSION_SEQUENCE: string[] = [
  '01',
  '02',
  '02_power',
  '02_beam',
  '02_findings',
  '03',
  '03_focus',
  '04',
  '04_stage1',
  '04_stage2',
  '05',
  '05_agc1',
  '05_agc2',
  '06',
  '06_via',
  '07',
  '08',
  '09',
  '10'
];

export const MhcWorkstationNavigator: React.FC<MhcWorkstationNavigatorProps> = ({
  progress,
  readiness,
  onJumpToActivity,
  onDiscardSession,
  isDiscardVisible
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { activeTheme } = useTheme();

  // Track previous activity code to establish directional energy vector
  const prevCodeRef = useRef<string>(progress.currentActivityCode);
  const [progressionDirection, setProgressionDirection] = useState<'forward' | 'backward' | 'none'>('none');
  const [lastSettledCode, setLastSettledCode] = useState<string | null>(null);

  const activeIndex = Math.max(0, ACTIVITY_PROGRESSION_SEQUENCE.indexOf(progress.currentActivityCode));
  const totalSequenceSteps = ACTIVITY_PROGRESSION_SEQUENCE.length;
  const progressRatio = totalSequenceSteps > 1 ? activeIndex / (totalSequenceSteps - 1) : 0;

  useEffect(() => {
    if (progress.currentActivityCode !== prevCodeRef.current) {
      const prevIdx = ACTIVITY_PROGRESSION_SEQUENCE.indexOf(prevCodeRef.current);
      const currIdx = ACTIVITY_PROGRESSION_SEQUENCE.indexOf(progress.currentActivityCode);

      if (prevIdx !== -1 && currIdx !== -1) {
        setProgressionDirection(currIdx > prevIdx ? 'forward' : 'backward');
      } else {
        setProgressionDirection('forward');
      }

      setLastSettledCode(prevCodeRef.current);
      prevCodeRef.current = progress.currentActivityCode;
    }
  }, [progress.currentActivityCode]);

  // Distinct Theme Visual Language & Color Identities
  const getThemeVisuals = () => {
    switch (activeTheme) {
      case 'lumen':
        return {
          // Track & Energy Beam
          trackBg: 'bg-slate-800/80',
          trackFilled: 'bg-gradient-to-b from-sky-400 via-cyan-400 to-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]',
          pulseHead: 'bg-sky-300 shadow-[0_0_14px_rgba(56,189,248,1)] ring-2 ring-sky-200/80',
          branchConduit: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
          
          // Active step row
          activeRowBg: 'bg-sky-950/40 border-sky-400/50 shadow-[0_0_14px_rgba(56,189,248,0.18)]',
          activeText: 'text-sky-200 font-semibold drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]',
          activeSecondaryText: 'text-sky-400/90 font-mono',
          activeDayText: 'text-sky-300/80 font-mono',
          activeDot: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)] ring-2 ring-sky-300/50',
          
          // Completed step row
          completedText: 'text-slate-200 font-medium',
          completedSecondaryText: 'text-slate-400 font-mono',
          completedDayText: 'text-slate-500 font-mono',
          completedIcon: 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]',
          completedRowHover: 'hover:bg-slate-900/60',
          
          // Other states
          upcomingText: 'text-slate-400 font-normal',
          lockedText: 'text-slate-600',
          reviewText: 'text-amber-300',
          readinessBadge: 'bg-sky-950/60 border-sky-500/40 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]',
        };

      case 'aero':
        return {
          // Track & Energy Beam
          trackBg: 'bg-slate-200 dark:bg-slate-700/60',
          trackFilled: 'bg-gradient-to-b from-sky-500 to-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.6)]',
          pulseHead: 'bg-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.9)] ring-2 ring-sky-200',
          branchConduit: 'bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]',
          
          // Active step row
          activeRowBg: 'bg-sky-500/10 border-sky-500/45 shadow-[0_1px_8px_rgba(14,165,233,0.15)]',
          activeText: 'text-sky-900 dark:text-sky-100 font-semibold',
          activeSecondaryText: 'text-sky-700 dark:text-sky-300 font-mono',
          activeDayText: 'text-sky-600 dark:text-sky-400 font-mono',
          activeDot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] ring-2 ring-sky-300/60',
          
          // Completed step row
          completedText: 'text-slate-800 dark:text-slate-200 font-medium',
          completedSecondaryText: 'text-slate-500 dark:text-slate-400 font-mono',
          completedDayText: 'text-slate-400 dark:text-slate-500 font-mono',
          completedIcon: 'text-emerald-600 dark:text-emerald-400',
          completedRowHover: 'hover:bg-sky-50/50 dark:hover:bg-slate-800/40',
          
          // Other states
          upcomingText: 'text-slate-500 dark:text-slate-400 font-normal',
          lockedText: 'text-slate-400 dark:text-slate-600',
          reviewText: 'text-amber-600 dark:text-amber-400',
          readinessBadge: 'bg-sky-50 dark:bg-slate-800 border-sky-300 dark:border-sky-600 text-sky-800 dark:text-sky-200',
        };

      case 'precision':
      default:
        return {
          // Track & Energy Beam
          trackBg: 'bg-zinc-800/70',
          trackFilled: 'bg-gradient-to-b from-amber-500 via-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
          pulseHead: 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)] ring-2 ring-amber-300/70',
          branchConduit: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
          
          // Active step row
          activeRowBg: 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.12)]',
          activeText: 'text-amber-300 font-semibold',
          activeSecondaryText: 'text-amber-400/90 font-mono',
          activeDayText: 'text-amber-500/70 font-mono',
          activeDot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)] ring-2 ring-amber-400/50',
          
          // Completed step row
          completedText: 'text-zinc-200 font-medium',
          completedSecondaryText: 'text-zinc-400 font-mono',
          completedDayText: 'text-zinc-500 font-mono',
          completedIcon: 'text-emerald-400',
          completedRowHover: 'hover:bg-zinc-800/50',
          
          // Other states
          upcomingText: 'text-zinc-400 font-normal',
          lockedText: 'text-zinc-600',
          reviewText: 'text-amber-400',
          readinessBadge: 'bg-zinc-900 border-zinc-700 text-zinc-200',
        };
    }
  };

  const visuals = getThemeVisuals();

  return (
    <aside id="mhc-autopilot-navigator" className="mhc-autopilot-navigator w-full md:w-64 lg:w-72 shrink-0 p-4 border-t md:border-t-0 md:border-l flex flex-col justify-between overflow-y-auto bg-[var(--surface-workspace)] border-[var(--border-default)]">
      <div className="space-y-4">
        {/* Header & Overall Readiness Status */}
        <div id="mhc-navigator-header" className="mhc-navigator-header flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center gap-1.5">
            <span>SCHEDULE INDEX</span>
          </div>
          <motion.span 
            key={readiness.readinessScore}
            initial={prefersReducedMotion ? false : { scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: motionTimings.quick }}
            className={`mhc-readiness-badge text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${visuals.readinessBadge}`}
          >
            {readiness.readinessScore}% READY
          </motion.span>
        </div>

        {/* Schedule Activity Tree with Live Vertical Progress Rail */}
        <div className="mhc-schedule-tree relative pl-3.5 space-y-1.5">
          {/* Live Continuous Vertical Progress Track */}
          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] pointer-events-none z-0">
            {/* Base upcoming track */}
            <div className={`w-full h-full rounded-full ${visuals.trackBg}`} />

            {/* Filled active progression line */}
            <motion.div
              className={`absolute top-0 left-0 w-full rounded-full ${visuals.trackFilled}`}
              initial={false}
              animate={{ height: `${Math.min(100, Math.max(4, progressRatio * 100))}%` }}
              transition={
                prefersReducedMotion 
                  ? { duration: 0 } 
                  : { type: 'spring', stiffness: 320, damping: 32 }
              }
            />

            {/* Live Traveling Kinetic Energy Head on Track */}
            {!prefersReducedMotion && (
              <motion.div
                className={`absolute -left-[3px] w-2 h-2 rounded-full pointer-events-none ${visuals.pulseHead}`}
                initial={false}
                animate={{ 
                  top: `calc(${Math.min(100, Math.max(0, progressRatio * 100))}% - 4px)` 
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 28 
                }}
              >
                {/* Micro pulse halo */}
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-inherit"
                />
              </motion.div>
            )}
          </div>

          {/* Schedule Tree Items */}
          {MHC_WORKFLOW_SCHEDULE.map((dayGroup) => {
            const isParent = dayGroup.subItems && dayGroup.subItems.length > 0;
            const actStatus = isParent 
              ? getParentActivityStatus(dayGroup.code, progress.activityStatuses)
              : (progress.activityStatuses[dayGroup.code] || 'LOCKED');
            
            const isCurrentActive = progress.currentActivityCode === dayGroup.code;
            const isParentOfActive = isParent && dayGroup.subItems?.some(s => s.code === progress.currentActivityCode);
            const isRecentlySettled = lastSettledCode === dayGroup.code && actStatus === 'COMPLETED';

            return (
              <div key={dayGroup.code + dayGroup.day} className="space-y-1 relative z-10">
                <motion.button
                  whileTap={actStatus !== 'LOCKED' ? mechanicalPressConfig.subtleTap : undefined}
                  disabled={actStatus === 'LOCKED'}
                  onClick={() => {
                    if (!isParent) onJumpToActivity(dayGroup.code);
                  }}
                  className={`mhc-schedule-item relative w-full text-left p-1.5 rounded-lg text-[11px] border flex items-center justify-between transition-colors overflow-hidden ${
                    isCurrentActive
                      ? `mhc-schedule-item-active ${visuals.activeRowBg}`
                      : actStatus === 'COMPLETED'
                      ? `bg-[var(--surface-surface)]/60 border-[var(--border-subtle)] ${visuals.completedRowHover} cursor-pointer`
                      : actStatus === 'NEEDS_REVIEW'
                      ? 'bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25 cursor-pointer'
                      : actStatus === 'IN_PROGRESS'
                      ? 'bg-cyan-500/15 border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer'
                      : 'bg-transparent border-transparent cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate relative z-10">
                    {/* Node status indicator aligned with live track */}
                    <span className="font-mono text-[10px] font-bold flex items-center justify-center w-3.5 shrink-0">
                      {isCurrentActive ? (
                        <motion.span
                          animate={prefersReducedMotion ? {} : { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className={`inline-block w-2 h-2 rounded-full ${visuals.activeDot}`}
                        />
                      ) : actStatus === 'COMPLETED' ? (
                        <motion.span 
                          initial={isRecentlySettled && !prefersReducedMotion ? { scale: 1.4, opacity: 0.6 } : false}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: motionTimings.quick }}
                          className={visuals.completedIcon}
                        >
                          ✓
                        </motion.span>
                      ) : actStatus === 'IN_PROGRESS' ? (
                        <span className="text-cyan-500 dark:text-cyan-400">●</span>
                      ) : actStatus === 'NEEDS_REVIEW' ? (
                        <span className="text-amber-500 dark:text-amber-400 font-bold">⚠</span>
                      ) : actStatus === 'UPCOMING' ? (
                        <span className="text-[var(--text-muted)]">○</span>
                      ) : (
                        <span className="text-[var(--text-subtle)]">🔒</span>
                      )}
                    </span>

                    {/* Step display code */}
                    <span className={`font-mono text-[10px] font-bold ${
                      isCurrentActive 
                        ? visuals.activeSecondaryText 
                        : actStatus === 'COMPLETED'
                        ? visuals.completedSecondaryText
                        : 'text-[var(--text-muted)]'
                    }`}>
                      {dayGroup.displayCode || getActivityDisplayCode(dayGroup.code)}
                    </span>

                    {/* Title */}
                    <span className={`truncate ${
                      isCurrentActive 
                        ? visuals.activeText 
                        : actStatus === 'COMPLETED'
                        ? visuals.completedText
                        : actStatus === 'NEEDS_REVIEW'
                        ? visuals.reviewText
                        : visuals.upcomingText
                    }`}>
                      {dayGroup.title}
                    </span>
                  </div>

                  {/* Day label */}
                  <span className={`text-[9px] font-mono shrink-0 relative z-10 ${
                    isCurrentActive 
                      ? visuals.activeDayText 
                      : actStatus === 'COMPLETED'
                      ? visuals.completedDayText
                      : 'text-[var(--text-muted)]'
                  }`}>
                    {dayGroup.day}
                  </span>
                </motion.button>

                {/* Sub items if present */}
                {isParent && (
                  <div className="pl-3.5 space-y-1 pt-0.5 border-l border-[var(--border-default)] ml-2 relative">
                    {/* Live active branch spine conduit */}
                    {isParentOfActive && !prefersReducedMotion && (
                      <motion.div 
                        layoutId="mhcAutopilotActiveSpine"
                        className={`absolute -left-[1px] top-0 bottom-0 w-[2px] rounded-full ${visuals.branchConduit}`}
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      />
                    )}

                    {dayGroup.subItems?.map((sub, sIdx) => {
                      const subStatus = progress.activityStatuses[sub.code] || 'LOCKED';
                      const isSubActive = progress.currentActivityCode === sub.code;
                      const isSubRecentlySettled = lastSettledCode === sub.code && subStatus === 'COMPLETED';
                      const isLast = sIdx === (dayGroup.subItems?.length || 0) - 1;

                      return (
                        <motion.button
                          key={sub.code}
                          whileTap={subStatus !== 'LOCKED' ? mechanicalPressConfig.subtleTap : undefined}
                          disabled={subStatus === 'LOCKED'}
                          onClick={() => onJumpToActivity(sub.code)}
                          className={`mhc-schedule-subitem relative w-full text-left px-2 py-1 rounded text-[10px] font-mono flex items-center justify-between border transition-colors overflow-hidden ${
                            isSubActive
                              ? `mhc-schedule-subitem-active ${visuals.activeRowBg}`
                              : subStatus === 'COMPLETED'
                              ? `bg-transparent border-transparent ${visuals.completedRowHover} cursor-pointer`
                              : subStatus === 'NEEDS_REVIEW'
                              ? 'bg-transparent border-transparent text-amber-600 dark:text-amber-400 hover:bg-[var(--surface-surface)] cursor-pointer'
                              : subStatus === 'IN_PROGRESS'
                              ? 'bg-transparent border-transparent text-cyan-600 dark:text-cyan-400 hover:bg-[var(--surface-surface)] cursor-pointer'
                              : 'bg-transparent border-transparent text-[var(--text-subtle)] cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate relative z-10">
                            <span className="text-[var(--text-subtle)] font-bold">{isLast ? '└─' : '├─'}</span>
                            <span className={`truncate ${
                              isSubActive 
                                ? visuals.activeText 
                                : subStatus === 'COMPLETED'
                                ? visuals.completedText
                                : visuals.upcomingText
                            }`}>
                              {sub.title}
                            </span>
                          </div>

                          <span className="shrink-0 font-bold relative z-10 flex items-center justify-center w-3.5">
                            {isSubActive ? (
                              <motion.span
                                animate={prefersReducedMotion ? {} : { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className={`inline-block w-1.5 h-1.5 rounded-full ${visuals.activeDot}`}
                              />
                            ) : subStatus === 'COMPLETED' ? (
                              <motion.span 
                                initial={isSubRecentlySettled && !prefersReducedMotion ? { scale: 1.4, opacity: 0.6 } : false}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: motionTimings.quick }}
                                className={visuals.completedIcon}
                              >
                                ✓
                              </motion.span>
                            ) : subStatus === 'IN_PROGRESS' ? (
                              <span className="text-cyan-500 dark:text-cyan-400">●</span>
                            ) : subStatus === 'NEEDS_REVIEW' ? (
                              <span className="text-amber-500 dark:text-amber-400">⚠</span>
                            ) : subStatus === 'UPCOMING' ? (
                              <span className="text-[var(--text-muted)]">○</span>
                            ) : (
                              <span className="text-[var(--text-subtle)]">🔒</span>
                            )}
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
            className="w-full py-2 px-3 rounded-lg border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[11px] font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Discard Draft Session</span>
          </motion.button>
        </div>
      )}
    </aside>
  );
};

