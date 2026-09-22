import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Cpu, 
  Play, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Sparkles,
  Layers,
  Activity,
  Check,
  Calendar,
  User,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Customer, Machine, MHCSession } from '../../../types';
import { SetupStep } from '../MhcAutopilot';
import { 
  computeAutopilotReadiness, 
  hasMeaningfulMhcProgress, 
  MHC_WORKFLOW_SCHEDULE,
  getActivityDisplayCode
} from '../../../utils/mhcAutopilotBrain';

export interface MhcWorkstationSetupFlowProps {
  currentStep: SetupStep;
  setCurrentStep: (step: SetupStep) => void;
  latestResumableSession: MHCSession | null;
  latestResumableMachine: Machine | null;
  latestResumableCustomer: Customer | null;
  confirmingWelcomeComplete: boolean;
  setConfirmingWelcomeComplete: (val: boolean) => void;
  handleContinueLatestActivity: () => void;
  handleConfirmWelcomeComplete: () => void;
  setSessionToDiscard: (s: MHCSession | null) => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer) => void;
  customerSearch: string;
  setCustomerSearch: (s: string) => void;
  filteredCustomers: Customer[];
  machines: Machine[];
  localSelectedMachine: Machine | undefined;
  setLocalSelectedMachine: (m: Machine) => void;
  onSelectMachine: (m: Machine) => void;
  machineSearch: string;
  setMachineSearch: (s: string) => void;
  filteredMachines: Machine[];
  mhcSessions: MHCSession[];
  existingIncompleteSession: MHCSession | undefined;
  handleContinueExisting: () => void;
  handleStartNew: () => void;
  handleReviewProgress: () => void;
  isDark: boolean;
}

export const MhcWorkstationSetupFlow: React.FC<MhcWorkstationSetupFlowProps> = ({
  currentStep,
  setCurrentStep,
  latestResumableSession,
  latestResumableMachine,
  latestResumableCustomer,
  confirmingWelcomeComplete,
  setConfirmingWelcomeComplete,
  handleContinueLatestActivity,
  handleConfirmWelcomeComplete,
  setSessionToDiscard,
  selectedCustomer,
  setSelectedCustomer,
  customerSearch,
  setCustomerSearch,
  filteredCustomers,
  machines,
  localSelectedMachine,
  setLocalSelectedMachine,
  onSelectMachine,
  machineSearch,
  setMachineSearch,
  filteredMachines,
  mhcSessions,
  existingIncompleteSession,
  handleContinueExisting,
  handleStartNew,
  handleReviewProgress,
  isDark
}) => {
  // Step sequence configuration
  const setupStepsConfig: { id: SetupStep; num: string; label: string; sub: string }[] = [
    { id: 'welcome', num: '01', label: 'INITIALIZER', sub: 'Protocol & Resume Desk' },
    { id: 'customer', num: '02', label: 'CUSTOMER BINDING', sub: 'Facility Account' },
    { id: 'machine', num: '03', label: 'EQUIPMENT ASSET', sub: 'Target Machine' },
    { id: 'session_check', num: '04', label: 'STATE VERIFICATION', sub: 'Session Status' }
  ];

  const currentStepIndex = setupStepsConfig.findIndex(s => s.id === currentStep);

  // Filter machines belonging specifically to selectedCustomer
  const customerMachines = selectedCustomer
    ? machines.filter(m => m.customerId === selectedCustomer.id || m.customerName === selectedCustomer.name)
    : [];

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-[var(--surface-workspace)]">
      {/* WORKSTATION SETUP HEADER & PROGRESS TRACKER */}
      <div className="px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-[var(--border-default)] bg-[var(--surface-surface)] flex items-center justify-center font-mono font-bold text-xs text-[var(--text-primary)]">
            MHC
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] tracking-wider uppercase">
              WORKSTATION INITIALIZATION FLOW
            </div>
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span>Machine Health Check Inspection Preparation</span>
              {selectedCustomer && (
                <span className="text-[10px] font-mono font-normal text-[var(--text-muted)] hidden md:inline">
                  • Bound: <strong className="text-[var(--text-primary)]">{selectedCustomer.name}</strong>
                  {localSelectedMachine && <span> → {localSelectedMachine.model}</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STEP BREADCRUMB / TRACKER */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-[10px]">
          {setupStepsConfig.map((stepItem, idx) => {
            const isCurrent = stepItem.id === currentStep;
            const isCompleted = currentStepIndex > idx;
            return (
              <div 
                key={stepItem.id} 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
                  isCurrent 
                    ? 'bg-[var(--surface-surface)] border-[var(--color-primary)] text-[var(--text-primary)] font-bold ring-1 ring-[var(--color-primary)]' 
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--surface-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] opacity-60'
                }`}
              >
                <span className={`px-1 py-0.2 rounded font-mono text-[9px] ${
                  isCurrent 
                    ? 'bg-[var(--color-primary)] text-white font-bold' 
                    : isCompleted 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold' 
                    : 'bg-[var(--border-default)] text-[var(--text-muted)]'
                }`}>
                  {isCompleted ? '✓' : stepItem.num}
                </span>
                <span className="whitespace-nowrap">{stepItem.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WORKSPACE BODY - FULL WIDTH & DENSE LAYOUT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* STEP 1: WELCOME & PROTOCOL OVERVIEW */}
        {currentStep === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-7xl mx-auto space-y-6"
          >
            {/* 2-COLUMN WORKSTATION INITIALIZER GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT PRIMARY PANEL (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Introduction & Workstation Purpose */}
                <div className="p-5 rounded-lg border space-y-3 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border-default)] bg-[var(--surface-surface)] text-[var(--text-secondary)] font-bold">
                      INSPECTION DESK INITIALIZER
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      STANDARD 4-DAY CYCLE
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      Machine Health Check Workstation
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
                      Authoritative engineering environment for optical laser profiling, 2-axis stage accuracy, thermal chiller stability, and final buyoff sign-off.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
                    <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                      <div className="text-[10px] text-[var(--text-muted)]">EQUIPMENT SCOPE</div>
                      <div className="font-bold text-[var(--text-primary)]">Dual/Single Laser</div>
                    </div>
                    <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                      <div className="text-[10px] text-[var(--text-muted)]">CORE ACTIVITIES</div>
                      <div className="font-bold text-[var(--text-primary)]">9 Modules (01–09)</div>
                    </div>
                    <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-[var(--text-muted)]">OUTPUT REPORT</div>
                      <div className="font-bold text-cyan-400">Authoritative PDF</div>
                    </div>
                  </div>
                </div>

                {/* ACTIVE RESUMABLE SESSION DESK OR CLEAN STATE */}
                {latestResumableSession && latestResumableMachine ? (
                  <div className="p-5 rounded-lg border space-y-4 transition-all bg-[var(--surface-surface)] border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          Active Resumable Session Detected
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                        ID: {latestResumableSession.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
                        <div className="text-[10px] text-[var(--text-muted)]">EQUIPMENT TARGET</div>
                        <div className="font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{latestResumableMachine.model}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          SN: {latestResumableMachine.serialNumber || latestResumableMachine.machineNumber} • {latestResumableMachine.plantName}
                        </div>
                      </div>

                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
                        <div className="text-[10px] text-[var(--text-muted)]">CURRENT PHASE &amp; PROGRESS</div>
                        <div className="font-bold text-cyan-400 mt-0.5">
                          {latestResumableSession.autopilotProgress?.currentDay || 'DAY 1'} — Act {latestResumableSession.autopilotProgress?.currentActivityCode || '01'}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {computeAutopilotReadiness(latestResumableSession.autopilotProgress).readinessScore}% Checklist Readiness
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] font-mono">
                      Facility: <strong className="text-[var(--text-primary)]">{latestResumableCustomer?.name || latestResumableSession.customerName || 'Customer Account'}</strong>
                      {latestResumableSession.lastUpdated && (
                        <span> • Last Active: {new Date(latestResumableSession.lastUpdated).toLocaleDateString()} {new Date(latestResumableSession.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-[var(--border-subtle)]">
                      <button
                        id="mhc-autopilot-continue-last-btn"
                        onClick={handleContinueLatestActivity}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue Last Activity</span>
                      </button>

                      <button
                        id="mhc-autopilot-welcome-complete-btn"
                        onClick={() => setConfirmingWelcomeComplete(true)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete MHC</span>
                      </button>

                      <button
                        id="mhc-autopilot-welcome-discard-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDiscard(latestResumableSession);
                        }}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Discard this draft session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('customer')}
                        className="px-3 py-2 rounded-lg font-mono text-xs border transition-all cursor-pointer ml-auto bg-[var(--surface-raised)] hover:bg-[var(--surface-surface)] text-[var(--text-secondary)] border-[var(--border-default)]"
                      >
                        <span>Manual Setup →</span>
                      </button>
                    </div>

                    {/* Inline Explicit Confirmation for Welcome Complete */}
                    {confirmingWelcomeComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 space-y-2.5"
                      >
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Confirm Completion for Session {latestResumableSession.id}?</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          This will finalize Activity 09 Buyoff, set status to <strong className="text-emerald-600 dark:text-emerald-400">COMPLETED</strong>, and archive it from active resume detection. All inspection records, logs, and historical data remain safely preserved.
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            id="btn-welcome-confirm-complete-yes"
                            onClick={handleConfirmWelcomeComplete}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Yes, Complete MHC</span>
                          </button>
                          <button
                            onClick={() => setConfirmingWelcomeComplete(false)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border-default)] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* NO RESUMABLE SESSION DETECTED */
                  <div className="p-5 rounded-lg border space-y-4 bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-[var(--border-default)] bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-muted)]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">Ready for Equipment Binding</div>
                        <div className="text-[11px] text-[var(--text-muted)]">No active in-progress draft sessions detected. Begin by selecting a Customer Account.</div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">STEP 01 OF 04 COMPLETE</span>
                      <button
                        onClick={() => setCurrentStep('customer')}
                        className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span>Select Customer Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT REFERENCE PANEL (5 Cols) - AUTHORITATIVE PROTOCOL SCHEDULE */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-lg border space-y-3 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      AUTHORITATIVE INSPECTION SCHEDULE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                      9 MODULES
                    </span>
                  </div>

                  <div className="space-y-2">
                    {MHC_WORKFLOW_SCHEDULE.map((activity) => (
                      <div 
                        key={activity.code}
                        className="p-2.5 rounded border text-xs flex items-center justify-between font-mono bg-[var(--surface-surface)] border-[var(--border-subtle)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-primary)] shrink-0">
                            {activity.displayCode || activity.code}
                          </span>
                          <span className="font-medium text-[var(--text-primary)] truncate text-[11px]">
                            {activity.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 font-normal">
                          {activity.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
                    Inspection telemetry, sensor readings, and laser life curves are recorded directly into authoritative state and compiled into the final sign-off PDF.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SELECT CUSTOMER ACCOUNT (FULL-WIDTH 2-PANE WORKSPACE) */}
        {currentStep === 'customer' && (
          <motion.div
            key="customer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-7xl mx-auto space-y-4"
          >
            {/* WORKSPACE 2-PANE GRID: LEFT SELECTION DIRECTORY (7 Cols) / RIGHT DETAILS (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT PANE: CUSTOMER DIRECTORY & SEARCH */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      Customer Passport Accounts
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Select facility account to view and bind registered machine assets.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                    {filteredCustomers.length} Accounts
                  </span>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by customer name, industry, or contact..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs outline-none transition-all bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* CUSTOMER DIRECTORY LIST */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[var(--border-default)] rounded-lg text-xs text-[var(--text-muted)] font-mono">
                      No matching customer accounts found.
                    </div>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isSelected = selectedCustomer?.id === c.id;
                      const custMachines = machines.filter(m => m.customerId === c.id || m.customerName === c.name);
                      const machineCount = custMachines.length;
                      const hasActiveSessions = custMachines.some(m => 
                        mhcSessions.some(s => s.machineId === m.id && hasMeaningfulMhcProgress(s))
                      );

                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            if (custMachines.length > 0) {
                              if (!localSelectedMachine || !custMachines.some(m => m.id === localSelectedMachine.id)) {
                                setLocalSelectedMachine(custMachines[0]);
                                onSelectMachine(custMachines[0]);
                              }
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--surface-raised)] border-[var(--color-primary)] text-[var(--text-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                              : 'bg-[var(--surface-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-default)]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                              isSelected 
                                ? 'bg-[var(--surface-surface)] border-[var(--color-primary)] text-[var(--color-primary)]' 
                                : 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-muted)]'
                            }`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[var(--text-primary)] truncate">{c.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                                {c.industry} {c.contactPerson ? `• ${c.contactPerson}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono flex items-center gap-2 shrink-0">
                            {hasActiveSessions && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span>Active Job</span>
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                              {machineCount} {machineCount === 1 ? 'Machine' : 'Machines'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANE: BOUND CUSTOMER DETAILS & ASSET PREVIEW */}
              <div className="lg:col-span-5 space-y-4">
                {selectedCustomer ? (
                  <div className="p-5 rounded-lg border space-y-4 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        BOUND CUSTOMER ACCOUNT
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        SELECTED
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {selectedCustomer.name}
                      </h3>
                      <div className="text-xs text-[var(--text-muted)] font-mono">
                        {selectedCustomer.industry} • Contact: {selectedCustomer.contactPerson || 'N/A'}
                      </div>
                      {selectedCustomer.email && (
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          Email: {selectedCustomer.email}
                        </div>
                      )}
                    </div>

                    {/* REGISTERED MACHINES PREVIEW */}
                    <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">REGISTERED ASSETS ({customerMachines.length})</span>
                      </div>

                      {customerMachines.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-[var(--border-default)] rounded text-[11px] text-[var(--text-muted)] font-mono">
                          No machines registered for this customer.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                          {customerMachines.map((m) => (
                            <div 
                              key={m.id}
                              className="p-2 rounded border text-xs flex items-center justify-between font-mono bg-[var(--surface-surface)] border-[var(--border-subtle)]"
                            >
                              <div className="flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="font-bold text-[var(--text-primary)]">{m.model}</span>
                                <span className="text-[10px] text-[var(--text-muted)] font-normal">({m.serialNumber || m.machineNumber})</span>
                              </div>
                              <span className="text-[10px] text-[var(--text-muted)]">{m.plantName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <button
                        onClick={() => setCurrentStep('welcome')}
                        className="px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Initializer</span>
                      </button>

                      <button
                        disabled={!selectedCustomer}
                        onClick={() => setCurrentStep('machine')}
                        className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span>Select Target Machine</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-lg border border-dashed text-xs text-[var(--text-muted)] font-mono border-[var(--border-default)]">
                    Select a customer account from the left directory.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SELECT TARGET MACHINE (FULL-WIDTH 2-PANE WORKSPACE) */}
        {currentStep === 'machine' && (
          <motion.div
            key="machine"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-7xl mx-auto space-y-4"
          >
            {/* WORKSPACE 2-PANE GRID: LEFT MACHINE DIRECTORY (7 Cols) / RIGHT PASSPORT PREVIEW (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT PANE: MACHINE DIRECTORY */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      Target Equipment Assets
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Assets registered for <strong className="text-[var(--text-primary)]">{selectedCustomer?.name || 'Customer'}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                    {filteredMachines.length} Assets
                  </span>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    placeholder="Search by model, serial number, plant..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs outline-none transition-all bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* MACHINE DIRECTORY LIST */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredMachines.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[var(--border-default)] rounded-lg text-xs text-[var(--text-muted)] font-mono">
                      No matching machine assets found for this customer account.
                    </div>
                  ) : (
                    filteredMachines.map((m) => {
                      const isSelected = localSelectedMachine?.id === m.id;
                      const hasActiveSession = mhcSessions.some(s => s.machineId === m.id && hasMeaningfulMhcProgress(s));

                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setLocalSelectedMachine(m);
                            onSelectMachine(m);
                          }}
                          className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--surface-raised)] border-[var(--color-primary)] text-[var(--text-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                              : 'bg-[var(--surface-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-default)]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                              isSelected 
                                ? 'bg-[var(--surface-surface)] border-[var(--color-primary)] text-[var(--color-primary)]' 
                                : 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-muted)]'
                            }`}>
                              <Cpu className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[var(--text-primary)] truncate">{m.model}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                                SN: {m.serialNumber} {m.machineNumber ? `• Unit: ${m.machineNumber}` : ''} • Plant: {m.plantName}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-2 font-mono shrink-0">
                            {hasActiveSession ? (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span>Active Session</span>
                              </span>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                m.status === 'OPERATIONAL' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              }`}>
                                {m.status || 'OPERATIONAL'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANE: TARGET EQUIPMENT PASSPORT PREVIEW */}
              <div className="lg:col-span-5 space-y-4">
                {localSelectedMachine ? (
                  <div className="p-5 rounded-lg border space-y-4 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        TARGET EQUIPMENT PASSPORT
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                        TARGET ASSET
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[var(--color-primary)]" />
                        <span>{localSelectedMachine.model}</span>
                      </h3>
                      <div className="text-xs text-[var(--text-muted)] font-mono">
                        Serial: {localSelectedMachine.serialNumber} • Plant: {localSelectedMachine.plantName}
                      </div>
                    </div>

                    {/* EQUIPMENT SPECIFICATION METRICS */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[var(--border-subtle)]">
                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                        <div className="text-[10px] text-[var(--text-muted)]">CUSTOMER FACILITY</div>
                        <div className="font-bold text-[var(--text-primary)] truncate">
                          {selectedCustomer?.name || localSelectedMachine.customerName}
                        </div>
                      </div>

                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                        <div className="text-[10px] text-[var(--text-muted)]">LASER SYSTEM</div>
                        <div className="font-bold text-[var(--text-primary)]">
                          {localSelectedMachine.laserHeads?.length === 1 ? 'Single Head' : 'Dual Head (LH1 + LH2)'}
                        </div>
                      </div>

                      {localSelectedMachine.laserHeads && localSelectedMachine.laserHeads.length > 0 && (
                        <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5 col-span-2">
                          <div className="text-[10px] text-[var(--text-muted)]">LASER HEAD IDENTIFIERS</div>
                          <div className="text-[11px] text-[var(--text-secondary)] space-y-0.5">
                            {localSelectedMachine.laserHeads.map((lh, i) => (
                              <div key={lh.id || i} className="flex justify-between">
                                <span>Head {i + 1}: {lh.model || 'Laser Head'}</span>
                                <span className="text-[var(--text-muted)]">SN: {lh.serialNumber || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <button
                        onClick={() => setCurrentStep('customer')}
                        className="px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Customer</span>
                      </button>

                      <button
                        disabled={!localSelectedMachine}
                        onClick={() => setCurrentStep('session_check')}
                        className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span>Check Session State</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-lg border border-dashed text-xs text-[var(--text-muted)] font-mono border-[var(--border-default)]">
                    Select a target machine asset from the left directory.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: SESSION DETECTION & STATE RECOVERY (FULL-WIDTH WORKSPACE) */}
        {currentStep === 'session_check' && (
          <motion.div
            key="session_check"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-7xl mx-auto space-y-6"
          >
            {/* BOUND EQUIPMENT SUMMARY BANNER */}
            <div className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded border border-[var(--color-primary)]/40 bg-[var(--surface-surface)] flex items-center justify-center text-[var(--color-primary)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    VERIFYING SESSION STATE FOR ASSET
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span>{localSelectedMachine?.model}</span>
                    <span className="text-xs text-[var(--text-muted)] font-normal">
                      (SN: {localSelectedMachine?.serialNumber || localSelectedMachine?.machineNumber})
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="text-[10px] text-[var(--text-muted)]">FACILITY</div>
                <div className="font-bold text-[var(--text-primary)]">{selectedCustomer?.name || localSelectedMachine?.customerName}</div>
              </div>
            </div>

            {/* SESSION DETECTION RESULT */}
            {existingIncompleteSession ? (
              /* CASE A: INCOMPLETE ACTIVE SESSION FOUND */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* PRIMARY OPTION: RESUME SESSION (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-lg border space-y-4 bg-[var(--surface-surface)] border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                          Active Incomplete Session Found
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                        ID: {existingIncompleteSession.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] space-y-0.5">
                        <div className="text-[10px] text-[var(--text-muted)]">START DATE</div>
                        <div className="font-bold text-[var(--text-primary)]">{existingIncompleteSession.startDate}</div>
                      </div>
                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] space-y-0.5">
                        <div className="text-[10px] text-[var(--text-muted)]">LAST UPDATED</div>
                        <div className="font-bold text-[var(--text-primary)]">
                          {new Date(existingIncompleteSession.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] space-y-0.5">
                        <div className="text-[10px] text-[var(--text-muted)]">ENGINEER</div>
                        <div className="font-bold text-[var(--text-primary)] truncate">{existingIncompleteSession.engineerName || 'Field Engineer'}</div>
                      </div>
                      <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] space-y-0.5">
                        <div className="text-[10px] text-[var(--text-muted)]">READINESS</div>
                        <div className="font-bold text-cyan-400">
                          {computeAutopilotReadiness(existingIncompleteSession.autopilotProgress).readinessScore}% Done
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      An active inspection session was detected for this equipment. Continuing this session will restore recorded telemetry, laser measurements, and observation notes without data loss.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={handleContinueExisting}
                        className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue Existing Session</span>
                      </button>

                      <button
                        onClick={handleReviewProgress}
                        className="px-3.5 py-2.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)] rounded-lg bg-[var(--surface-raised)]"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Review Progress (Read-Only)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECONDARY / ALTERNATIVE ACTIONS (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-lg border space-y-3 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] pb-2 border-b border-[var(--border-subtle)]">
                      ALTERNATIVE PATHWAYS
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-2">
                        <div className="text-xs font-bold text-[var(--text-primary)]">Start Fresh Session</div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Create a brand new inspection session for this machine.
                        </p>
                        <button
                          onClick={handleStartNew}
                          className="px-3.5 py-1.5 rounded bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] font-mono text-xs font-semibold cursor-pointer"
                        >
                          Start New Session
                        </button>
                      </div>

                      <div className="p-3 rounded border border-rose-500/20 bg-rose-500/5 space-y-2">
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Discard Incomplete Draft</div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Remove this uncompleted session if created by error.
                        </p>
                        <button
                          id="mhc-session-check-discard-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDiscard(existingIncompleteSession);
                          }}
                          className="px-3.5 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Discard Draft Session</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => setCurrentStep('machine')}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        ← Change Machine
                      </button>
                      <button
                        onClick={() => setCurrentStep('customer')}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Change Customer →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CASE B: NO INCOMPLETE SESSION - READY TO LAUNCH NEW SESSION */
              <div className="p-6 rounded-lg border space-y-5 bg-[var(--surface-raised)] border-[var(--border-default)] shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Ready to Initialize New Machine Health Check Session
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                      No prior incomplete inspection sessions found for {localSelectedMachine?.model} ({localSelectedMachine?.serialNumber}). A new session will be created with Day 1 Activity 01 (Laser Hours) initialized.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-[var(--border-subtle)]">
                  <div className="p-3 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">BOUND TARGET</div>
                    <div className="font-bold text-[var(--text-primary)]">{localSelectedMachine?.model}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">SN: {localSelectedMachine?.serialNumber}</div>
                  </div>

                  <div className="p-3 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">CUSTOMER FACILITY</div>
                    <div className="font-bold text-[var(--text-primary)]">{selectedCustomer?.name || localSelectedMachine?.customerName}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Plant: {localSelectedMachine?.plantName}</div>
                  </div>

                  <div className="p-3 rounded border border-[var(--border-subtle)] bg-[var(--surface-surface)] space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">STARTING PHASE</div>
                    <div className="font-bold text-cyan-400">DAY 1 — Act 01</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Laser Hours Verification</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStep('machine')}
                      className="px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Select Other Machine</span>
                    </button>
                    <button
                      onClick={() => setCurrentStep('customer')}
                      className="px-3 py-2 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      Change Customer
                    </button>
                  </div>

                  <button
                    onClick={handleStartNew}
                    className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create &amp; Start MHC Session</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
