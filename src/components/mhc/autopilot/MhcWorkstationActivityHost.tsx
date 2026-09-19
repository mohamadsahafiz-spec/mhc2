import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Award, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Check, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Customer, Machine, MHCSession, MHCAutopilotSessionProgress } from '../../../types';
import { SetupStep } from '../MhcAutopilot';
import {
  createFadeSlideVariants,
  mechanicalPressConfig,
  motionTimings,
  motionEasings
} from '../../../theme/motion';
import { 
  ACTIONABLE_ACTIVITIES, 
  getActivityDisplayCode, 
  AutopilotReadinessReport,
  createDefaultAutopilotProgress
} from '../../../utils/mhcAutopilotBrain';

import { MhcLaserHoursActivity } from './MhcLaserHoursActivity';
import { MhcLaserPowerActivity } from './MhcLaserPowerActivity';
import { MhcLaserBeamActivity } from './MhcLaserBeamActivity';
import { MhcLaserInspectionActivity } from './MhcLaserInspectionActivity';
import { MhcStageCalibrationActivity } from './MhcStageCalibrationActivity';
import { MhcFocusOptimizationActivity } from './MhcFocusOptimizationActivity';
import { MhcAgcActivity } from './MhcAgcActivity';
import { MhcTemperatureEvidenceActivity } from './MhcTemperatureEvidenceActivity';
import { MhcProductProcessActivity } from './MhcProductProcessActivity';
import { MhcRecommendationsSparePartsActivity } from './MhcRecommendationsSparePartsActivity';
import { MhcReadinessReviewActivity } from './MhcReadinessReviewActivity';
import { MhcFullPdfRenderer } from '../report/MhcFullPdfRenderer';

export interface MhcWorkstationActivityHostProps {
  effectiveSession: MHCSession;
  localSelectedMachine: Machine;
  selectedCustomer: Customer | null;
  isReadOnlyMode: boolean;
  setIsReadOnlyMode: (val: boolean) => void;
  progress: MHCAutopilotSessionProgress;
  readiness: AutopilotReadinessReport;
  activeNoteText: string;
  setActiveNoteText: (val: string) => void;
  onUpdateSession: (session: MHCSession) => void;
  onUpdateMachine?: (machine: Machine) => void;
  handleCompleteCurrentActivity: (
    latestSession?: MHCSession,
    targetCodeOverride?: string,
    statusOverride?: 'COMPLETED' | 'NEEDS_REVIEW'
  ) => void;
  handleFlagCurrentNeedsReview: () => void;
  handleReopenActivity: (code: string) => void;
  handleJumpToActivityCode: (code: string) => void;
  handleProceedToReportGeneration: () => void;
  handleProceedToBuyoff: () => void;
  handlePdfGenerated: (blobUrl?: string) => void;
  showNotification: (msg: string) => void;
  setCurrentStep: (step: SetupStep) => void;
  onSwitchToCanvas?: () => void;
  previousSession?: MHCSession;
  isDark: boolean;
}

export const MhcWorkstationActivityHost: React.FC<MhcWorkstationActivityHostProps> = ({
  effectiveSession,
  localSelectedMachine,
  selectedCustomer,
  isReadOnlyMode,
  setIsReadOnlyMode,
  progress,
  readiness,
  activeNoteText,
  setActiveNoteText,
  onUpdateSession,
  onUpdateMachine,
  handleCompleteCurrentActivity,
  handleFlagCurrentNeedsReview,
  handleReopenActivity,
  handleJumpToActivityCode,
  handleProceedToReportGeneration,
  handleProceedToBuyoff,
  handlePdfGenerated,
  showNotification,
  setCurrentStep,
  onSwitchToCanvas,
  previousSession,
  isDark
}) => {
  const shouldReduceMotion = useReducedMotion();
  const currentActionableItem = ACTIONABLE_ACTIVITIES.find(a => a.code === progress.currentActivityCode) || ACTIONABLE_ACTIVITIES[0];
  
  // Calculate next activity title for contextual sub-strip
  const currentIndex = ACTIONABLE_ACTIVITIES.findIndex(a => a.code === progress.currentActivityCode);
  const nextItem = currentIndex >= 0 && currentIndex < ACTIONABLE_ACTIVITIES.length - 1 
    ? ACTIONABLE_ACTIVITIES[currentIndex + 1] 
    : null;

  return (
    <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        
        {/* 1. CONTEXTUAL WORK SUB-STRIP */}
        <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[var(--surface-raised)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Active Context Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-surface)] border border-[var(--border-default)] text-[var(--color-primary)] shrink-0">
              {progress.currentDay}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] truncate">
              {getActivityDisplayCode(progress.currentActivityCode)} {currentActionableItem.title}
            </span>
          </div>

          {/* Contextual Next & Progress Metric */}
          <div className="flex items-center gap-3 shrink-0 ml-auto font-mono text-xs">
            {nextItem && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] border-r border-[var(--border-default)] pr-3">
                <span>Next:</span>
                <span className="text-[var(--text-secondary)] font-medium truncate max-w-[160px]">
                  {getActivityDisplayCode(nextItem.code)} {nextItem.title}
                </span>
                <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">Progress:</span>
              <span className="font-bold text-[var(--text-primary)] text-xs">
                {readiness.completedCount} / {readiness.totalCount} ({readiness.readinessScore}%)
              </span>
            </div>
          </div>
        </div>

        {/* 2. ACTIVE INSPECTION ACTIVITY (PRIMARY VISUAL CENTER) */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={progress.currentActivityCode}
            variants={createFadeSlideVariants({ direction: 'up', distance: 'component', prefersReducedMotion: shouldReduceMotion })}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-w-0 relative"
          >
            {/* Engineering Inspection Calibrated Focus Alignment Sweep */}
            {!shouldReduceMotion && (
              <motion.div
                key={`datum-alignment-${progress.currentActivityCode}`}
                initial={{ scaleX: 0, opacity: 0.8 }}
                animate={{ scaleX: 1, opacity: 0 }}
                transition={{ duration: motionTimings.standard, ease: motionEasings.responsive }}
                className="absolute -top-1 left-0 right-0 h-[2px] bg-indigo-500/70 origin-left pointer-events-none z-10"
              />
            )}
            {progress.currentActivityCode === '01' ? (
              <MhcLaserHoursActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
              />
            ) : (progress.currentActivityCode === '02_power' || progress.currentActivityCode === '03_power') ? (
              <MhcLaserPowerActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onUpdateMachine={onUpdateMachine}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
              />
            ) : (progress.currentActivityCode === '02_beam' || progress.currentActivityCode === '03_beam') ? (
              <MhcLaserBeamActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onUpdateMachine={onUpdateMachine}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
              />
            ) : (progress.currentActivityCode === '02_findings' || progress.currentActivityCode === '03_findings') ? (
              <MhcLaserInspectionActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onUpdateMachine={onUpdateMachine}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
                activeCode={progress.currentActivityCode}
              />
            ) : (progress.currentActivityCode === '04_stage1' || progress.currentActivityCode === '04_stage2' || progress.currentActivityCode === '04') ? (
              <MhcStageCalibrationActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
                activeCode={progress.currentActivityCode}
              />
            ) : (progress.currentActivityCode === '03_focus' || progress.currentActivityCode === '03') ? (
              <MhcFocusOptimizationActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
                activeCode={progress.currentActivityCode}
              />
            ) : (progress.currentActivityCode === '05_agc1' || progress.currentActivityCode === '05_agc2' || progress.currentActivityCode === '05') ? (
              <MhcAgcActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
                activeCode={progress.currentActivityCode}
              />
            ) : (progress.currentActivityCode === '06_temp1' || progress.currentActivityCode === '06_temp2' || progress.currentActivityCode === '06') ? (
              <MhcTemperatureEvidenceActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
                activeCode={progress.currentActivityCode}
              />
            ) : (progress.currentActivityCode === '06_via' || progress.currentActivityCode === '07_via1' || progress.currentActivityCode === '07_via2') ? (
              <MhcProductProcessActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                isDark={isDark}
                showNotification={showNotification}
                activeCode={progress.currentActivityCode}
              />
            ) : (progress.currentActivityCode === '07' || progress.currentActivityCode === '07_spares' || progress.currentActivityCode === '07_spare1' || progress.currentActivityCode === '07_spare2') ? (
              <MhcRecommendationsSparePartsActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onCompleteActivity={handleCompleteCurrentActivity}
                onNavigateToActivity={handleJumpToActivityCode}
                isDark={isDark}
                showNotification={showNotification}
              />
            ) : progress.currentActivityCode === '08' ? (
              <MhcReadinessReviewActivity
                session={effectiveSession}
                machine={localSelectedMachine}
                isReadOnly={isReadOnlyMode}
                onUpdateSession={onUpdateSession}
                onNavigateToActivity={handleJumpToActivityCode}
                onProceedToReportGeneration={handleProceedToReportGeneration}
                isDark={isDark}
                showNotification={showNotification}
              />
            ) : progress.currentActivityCode === '09' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Official MHC Report Generation (Activity 09)
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Deterministic 8-stage audit compilation with real machine baselines and evidence charts.
                    </p>
                  </div>
                  {effectiveSession.autopilotProgress?.activityStatuses['09'] === 'COMPLETED' && (
                    <motion.button
                      whileTap={mechanicalPressConfig.subtleTap}
                      onClick={handleProceedToBuyoff}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Proceed to 10 Buyoff / Complete</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>

                <MhcFullPdfRenderer
                  session={effectiveSession}
                  machine={localSelectedMachine}
                  customer={selectedCustomer || undefined}
                  previousSession={previousSession}
                  onPdfGenerated={handlePdfGenerated}
                />
              </div>
            ) : progress.currentActivityCode === '10' ? (
              <div className={`p-5 rounded-xl border space-y-4 ${
                isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      DAY 4 • ACTIVITY 10
                    </span>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                      Final Buyoff, Customer Handover &amp; Session Completion
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Confirm customer acceptance, record final handover notes, and archive this inspection session.
                  </p>
                </div>

                {/* Status Banner */}
                {effectiveSession.completionStatus === 'COMPLETED' ? (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1 font-mono">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MHC SESSION COMPLETED &amp; SIGNED OFF</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      This inspection is officially finalized. Records, PDF reports, and telemetry baselines are archived in historical logs.
                    </p>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg border space-y-3 ${
                    isDark ? 'bg-[var(--surface-raised)] border-[var(--border-strong)]' : 'bg-white border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[var(--text-primary)]">SESSION AUDIT SUMMARY</span>
                      <span className="text-emerald-400 font-bold">{readiness.readinessScore}% READINESS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>08 Readiness Review</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>09 PDF Generated</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>10 Ready for Sign-Off</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observation / Buyoff Note Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-muted)] font-semibold flex items-center justify-between">
                    <span>FINAL BUYOFF &amp; HANDOVER REMARKS</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">Session Brain Persisted</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnlyMode}
                    value={activeNoteText}
                    onChange={(e) => {
                      setActiveNoteText(e.target.value);
                      if (!isReadOnlyMode && effectiveSession) {
                        const updated = { ...effectiveSession };
                        const currP = updated.autopilotProgress || createDefaultAutopilotProgress();
                        updated.autopilotProgress = {
                          ...currP,
                          activityNotes: {
                            ...(currP.activityNotes || {}),
                            ['10']: e.target.value
                          }
                        };
                        onUpdateSession(updated);
                      }
                    }}
                    placeholder={isReadOnlyMode ? "Read-only mode active..." : "Enter final customer acceptance remarks or handover notes..."}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  />
                </div>

                {/* ACTION CONTROLS */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  {effectiveSession?.completionStatus !== 'COMPLETED' ? (
                    !isReadOnlyMode ? (
                      <>
                        <motion.button
                          id="btn-mhc-finalize-session"
                          whileTap={mechanicalPressConfig.tap}
                          onClick={() => handleCompleteCurrentActivity()}
                          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete MHC Session &amp; Finalize Buyoff ✓</span>
                        </motion.button>

                        <motion.button
                          whileTap={mechanicalPressConfig.subtleTap}
                          onClick={() => handleJumpToActivityCode('09')}
                          className="px-3.5 py-2.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)] text-xs font-mono cursor-pointer"
                        >
                          <span>← Review Report (09)</span>
                        </motion.button>
                      </>
                    ) : (
                      <div className="text-xs text-amber-300 font-mono flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Action controls locked in Read-Only mode. Toggle "Enable Editing" above to modify.</span>
                      </div>
                    )
                  ) : (
                    <>
                      <motion.button
                        whileTap={mechanicalPressConfig.subtleTap}
                        onClick={() => handleJumpToActivityCode('09')}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Full MHC Report (09)</span>
                      </motion.button>

                      <motion.button
                        whileTap={mechanicalPressConfig.subtleTap}
                        onClick={() => setCurrentStep('welcome')}
                        className="px-3.5 py-2 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)] text-xs font-mono cursor-pointer"
                      >
                        <span>Return to Autopilot Setup</span>
                      </motion.button>

                      {!isReadOnlyMode && (
                        <motion.button
                          whileTap={mechanicalPressConfig.subtleTap}
                          onClick={() => handleReopenActivity('10')}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono border border-[var(--border-subtle)] ml-auto cursor-pointer"
                        >
                          Re-open Buyoff Activity
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-lg border space-y-4 ${
                isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {currentActionableItem.day} • {getActivityDisplayCode(currentActionableItem.code)}
                    </span>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">
                      {currentActionableItem.title}
                    </h3>
                  </div>

                  {/* Status Pill */}
                  {(() => {
                    const st = progress.activityStatuses[currentActionableItem.code] || 'IN_PROGRESS';
                    return (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        st === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : st === 'NEEDS_REVIEW'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {st === 'COMPLETED' && '✓ COMPLETED'}
                        {st === 'IN_PROGRESS' && '◉ IN PROGRESS'}
                        {st === 'NEEDS_REVIEW' && '⚠ NEEDS REVIEW'}
                        {st === 'UPCOMING' && '○ UPCOMING'}
                      </span>
                    );
                  })()}
                </div>

                {/* Observation Note Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-muted)] font-semibold flex items-center justify-between">
                    <span>ENGINEER OBSERVATION NOTES</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">Session Brain Persisted</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnlyMode}
                    value={activeNoteText}
                    onChange={(e) => {
                      setActiveNoteText(e.target.value);
                      if (!isReadOnlyMode && effectiveSession) {
                        const updated = { ...effectiveSession };
                        const currP = updated.autopilotProgress || createDefaultAutopilotProgress();
                        updated.autopilotProgress = {
                          ...currP,
                          activityNotes: {
                            ...(currP.activityNotes || {}),
                            [currentActionableItem.code]: e.target.value
                          }
                        };
                        onUpdateSession(updated);
                      }
                    }}
                    placeholder={isReadOnlyMode ? "Read-only mode active..." : "Add quick measurement notes or findings..."}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  />
                </div>

                {/* ACTION CONTROLS */}
                {!isReadOnlyMode ? (
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <motion.button
                      whileTap={mechanicalPressConfig.tap}
                      onClick={() => handleCompleteCurrentActivity()}
                      className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Mark Complete &amp; Advance</span>
                    </motion.button>

                    <motion.button
                      whileTap={mechanicalPressConfig.subtleTap}
                      onClick={() => handleFlagCurrentNeedsReview()}
                      className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Flag for Review</span>
                    </motion.button>

                    {progress.activityStatuses[currentActionableItem.code] === 'COMPLETED' && (
                      <motion.button
                        whileTap={mechanicalPressConfig.subtleTap}
                        onClick={() => handleReopenActivity(currentActionableItem.code)}
                        className="px-3 py-2 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono border border-[var(--border-subtle)] cursor-pointer"
                      >
                        Re-open Activity
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 text-xs text-amber-300 font-mono flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Action controls locked in Read-Only mode. Toggle "Enable Editing" above to modify.</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. BOTTOM FOOTER UTILITIES */}
      <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)]">
        <motion.button
          whileTap={mechanicalPressConfig.subtleTap}
          onClick={() => setCurrentStep('customer')}
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          ← Change Machine or Customer
        </motion.button>

        {onSwitchToCanvas && (
          <motion.button
            whileTap={mechanicalPressConfig.subtleTap}
            onClick={onSwitchToCanvas}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-primary)] font-mono font-semibold text-xs border border-[var(--border-default)] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Open Full Workspace</span>
          </motion.button>
        )}
      </div>
    </main>
  );
};
