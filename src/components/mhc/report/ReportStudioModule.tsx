import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Building2, 
  User, 
  ArrowRight, 
  Eye, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  AlertCircle, 
  Printer, 
  Camera, 
  Database, 
  ExternalLink,
  Zap,
  Gauge,
  Thermometer,
  Microscope,
  Wrench,
  Sparkles,
  FileCheck2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { 
  Machine, 
  MHCSession, 
  NavigationTab,
  Customer,
  MhcReportDocument
} from '../../../types';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Card } from '../../common/Card';
import { StorageService } from '../../../utils/persistence';
import { 
  auditMhcSession, 
  computeAutopilotReadiness, 
  MhcAuditItem,
  ACTIONABLE_ACTIVITIES,
  getActivityDisplayCode
} from '../../../utils/mhcAutopilotBrain';
import { 
  buildMhcReportDocument,
  computeReportSections13To15PaginationPlan 
} from '../../../utils/mhcReportEngine';
import { MhcFullPdfRenderer } from './MhcFullPdfRenderer';
import { ImageStore } from '../../../utils/imageStore';

export interface ReportStudioModuleProps {
  machines: Machine[];
  customers?: Customer[];
  initialMachineId?: string;
  initialSessionId?: string;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenAutopilotForSession?: (sessionId: string, machineId: string, activityCode?: string) => void;
}

type EvidenceSectionTab = 
  | 'ALL' 
  | 'IDENTITY' 
  | 'HEAD1' 
  | 'HEAD2' 
  | 'MOTION' 
  | 'THERMAL' 
  | 'PROCESS' 
  | 'FINDINGS' 
  | 'SPARES' 
  | 'BUYOFF';

export const ReportStudioModule: React.FC<ReportStudioModuleProps> = ({
  machines = [],
  customers = [],
  initialMachineId,
  initialSessionId,
  onNavigate,
  onOpenAutopilotForSession
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // 1. Authoritative persistent sessions load
  const [sessions, setSessions] = useState<MHCSession[]>(() => 
    StorageService.getMhcSessions(true)
  );

  // Sync sessions when component receives focus or storage updates
  useEffect(() => {
    const loaded = StorageService.getMhcSessions(true);
    setSessions(loaded);
  }, []);

  // 2. Selected Machine state
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    if (initialMachineId && machines.some(m => m.id === initialMachineId)) {
      return initialMachineId;
    }
    if (initialSessionId) {
      const match = StorageService.getMhcSessions(true).find(s => s.id === initialSessionId);
      if (match) return match.machineId;
    }
    return machines[0]?.id || '';
  });

  const selectedMachine = useMemo(() => {
    return machines.find(m => m.id === selectedMachineId) || machines[0];
  }, [machines, selectedMachineId]);

  // 3. Machine-associated sessions
  const machineSessions = useMemo(() => {
    if (!selectedMachineId) return [];
    return sessions
      .filter(s => s.machineId === selectedMachineId)
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '') || (b.startTime || '').localeCompare(a.startTime || ''));
  }, [sessions, selectedMachineId]);

  // 4. Selected Session state
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (initialSessionId && sessions.some(s => s.id === initialSessionId)) {
      return initialSessionId;
    }
    const forMachine = sessions.filter(s => s.machineId === (initialMachineId || machines[0]?.id));
    return forMachine[0]?.id || '';
  });

  // Auto-sync selectedSessionId when machine changes
  useEffect(() => {
    if (machineSessions.length > 0) {
      if (!selectedSessionId || !machineSessions.some(s => s.id === selectedSessionId)) {
        setSelectedSessionId(machineSessions[0].id);
      }
    } else {
      setSelectedSessionId('');
    }
  }, [machineSessions, selectedMachineId]);

  const activeSession: MHCSession | undefined = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || machineSessions[0];
  }, [sessions, selectedSessionId, machineSessions]);

  // 5. Previous Session for baseline delta comparison
  const previousSession: MHCSession | undefined = useMemo(() => {
    if (!activeSession) return undefined;
    const completedForMachine = sessions.filter(
      s => s.machineId === activeSession.machineId && 
           s.id !== activeSession.id && 
           s.completionStatus === 'COMPLETED'
    ).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    return completedForMachine[0];
  }, [sessions, activeSession]);

  // 6. View Mode: 'CONTROL_DESK' (evidence overview & readiness audit) vs 'COMPOSE_PDF' (rendered document)
  const [viewMode, setViewMode] = useState<'CONTROL_DESK' | 'COMPOSE_PDF'>('CONTROL_DESK');

  // 7. Active Evidence Category Filter
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<EvidenceSectionTab>('ALL');

  // 8. Derived Authoritative Document & Audit
  const reportDoc: MhcReportDocument | null = useMemo(() => {
    if (!activeSession) return null;
    return buildMhcReportDocument(activeSession, previousSession);
  }, [activeSession, previousSession]);

  const sessionAudit = useMemo(() => {
    if (!activeSession) return null;
    return auditMhcSession(activeSession);
  }, [activeSession]);

  const autopilotReadiness = useMemo(() => {
    if (!activeSession?.autopilotProgress) return null;
    return computeAutopilotReadiness(activeSession.autopilotProgress);
  }, [activeSession]);

  // Customer resolution
  const resolvedCustomer = useMemo(() => {
    if (!selectedMachine) return null;
    return customers.find(c => c.id === selectedMachine.customerId || c.name === selectedMachine.customerName) || null;
  }, [customers, selectedMachine]);

  // Handlers
  const handleJumpToAutopilot = (activityCode?: string) => {
    if (!activeSession) return;
    if (onOpenAutopilotForSession) {
      onOpenAutopilotForSession(activeSession.id, activeSession.machineId, activityCode);
    } else if (onNavigate) {
      onNavigate('mhc_autopilot');
    }
  };

  // If no machines exist in system
  if (!machines || machines.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Card className="p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <Cpu className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-100">No Machines Registered</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Report Studio requires registered machine assets and recorded Machine Health Check sessions. Register a machine in Machine Passport to begin.
            </p>
          </div>
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              icon={<Cpu className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('machines')}
            >
              Go to Machine Passport
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 md:py-4 animate-in fade-in duration-150">
      
      {/* 1. TOP DOCUMENT CONTROL HEADER */}
      <div className={`p-4 md:p-5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]' : 'bg-white border-slate-300 shadow-xs text-slate-900'
      }`}>
        {/* Identity & Scope */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`p-1.5 rounded-lg border shrink-0 ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                ENGINEERING DOCUMENT CONTROL DESK
              </span>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                MHC Report Studio
              </h1>
            </div>
            {activeSession && (
              <Badge variant={activeSession.completionStatus === 'COMPLETED' ? 'success' : 'warning'}>
                {activeSession.completionStatus === 'COMPLETED' ? 'COMPLETED AUDIT' : 'ACTIVE DRAFT INSPECTION'}
              </Badge>
            )}
          </div>

          <p className="text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed">
            Authoritative source verification, inspection readiness audit, and deterministic technical report composition.
          </p>
        </div>

        {/* Global Action Bar & Mode Switcher */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap font-mono">
          {viewMode === 'CONTROL_DESK' ? (
            <>
              {activeSession && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={() => handleJumpToAutopilot()}
                >
                  Open in Autopilot
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                disabled={!activeSession}
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => setViewMode('COMPOSE_PDF')}
              >
                Compose &amp; Preview PDF
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Sliders className="w-3.5 h-3.5" />}
                onClick={() => setViewMode('CONTROL_DESK')}
              >
                Back to Document Desk
              </Button>

              {activeSession && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={() => handleJumpToAutopilot()}
                >
                  Edit in Autopilot
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. MODE: COMPOSE PDF VIEW */}
      {viewMode === 'COMPOSE_PDF' && activeSession ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
              <span className="font-bold text-[var(--text-primary)]">DOCUMENT PREVIEW:</span>
              <span>{activeSession.machineModel} ({activeSession.machineSerialNumber})</span>
              <span>•</span>
              <span>Session {activeSession.id}</span>
            </div>
            <button
              onClick={() => setViewMode('CONTROL_DESK')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Return to Evidence Audit
            </button>
          </div>

          <MhcFullPdfRenderer
            session={activeSession}
            previousSession={previousSession}
            reportDocument={reportDoc || undefined}
            isDark={isDark}
            onBackToAutopilot={() => handleJumpToAutopilot()}
          />
        </div>
      ) : (
        /* 3. MODE: CONTROL DESK (INFORMATION ARCHITECTURE & EVIDENCE AUDIT) */
        <div className="space-y-6">
          
          {/* TIER 1: REPORT SOURCE & READINESS (2-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT: REPORT SOURCE SELECTION & BOUND PASSPORT (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`p-4 rounded-xl border space-y-4 ${
                isDark ? 'bg-[var(--surface-surface)] border-[var(--border-default)]' : 'bg-white border-slate-300 shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      1. REPORT SOURCE BINDING
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {machineSessions.length} Session{machineSessions.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Machine Selection Dropdown */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between">
                    <span>TARGET EQUIPMENT:</span>
                    <span className="text-[10px] text-cyan-400">{machines.length} available</span>
                  </label>
                  <select
                    id="report-studio-machine-select"
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    className={`w-full text-xs rounded-lg px-3 py-2 border font-mono transition-colors ${
                      isDark 
                        ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-cyan-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model} ({m.serialNumber || m.machineNumber || m.id}) — {m.customerName || 'EO Technics'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session Selection Dropdown */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between">
                    <span>INSPECTION SESSION SOURCE:</span>
                    {activeSession && (
                      <span className={`text-[10px] font-bold ${
                        activeSession.completionStatus === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {activeSession.completionStatus}
                      </span>
                    )}
                  </label>

                  {machineSessions.length > 0 ? (
                    <select
                      id="report-studio-session-select"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className={`w-full text-xs rounded-lg px-3 py-2 border font-mono transition-colors ${
                        isDark 
                          ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-cyan-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                      }`}
                    >
                      {machineSessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id} • {s.startDate} ({s.completionStatus})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={`p-3 rounded-lg border text-xs text-center space-y-1 font-mono ${
                      isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <AlertCircle className="w-4 h-4 mx-auto text-amber-400" />
                      <div className="font-semibold">No Inspection Sessions Found</div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Launch an MHC Autopilot session for this machine to create report source data.
                      </p>
                    </div>
                  )}
                </div>

                {/* Session Identity Card Details */}
                {activeSession ? (
                  <div className={`p-3 rounded-lg border text-xs space-y-2 font-mono ${
                    isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">SESSION ID:</span>
                      <span className="font-bold text-[var(--text-primary)]">{activeSession.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">CUSTOMER / PLANT:</span>
                      <span className="font-medium text-[var(--text-secondary)]">{activeSession.customerName} • {activeSession.plantName || 'Fab 1'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">LEAD ENGINEER:</span>
                      <span className="font-medium text-[var(--text-secondary)]">{activeSession.engineerName || 'Field Engineer'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">INSPECTION DATE:</span>
                      <span className="text-[var(--text-secondary)]">{activeSession.startDate} {activeSession.startTime ? `(${activeSession.startTime})` : ''}</span>
                    </div>

                    {/* Baseline Comparison Status */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">PREVIOUS BASELINE:</span>
                      {previousSession ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>{previousSession.id} ({previousSession.startDate})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No prior baseline (First MHC)</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* RIGHT: REPORT READINESS & MISSING EVIDENCE AUDIT (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className={`p-4 rounded-xl border space-y-4 ${
                isDark ? 'bg-[var(--surface-surface)] border-[var(--border-default)]' : 'bg-white border-slate-300 shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-3 border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      2. REPORT READINESS AUDIT
                    </span>
                  </div>

                  {autopilotReadiness && (
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-xs text-[var(--text-muted)]">Readiness:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        autopilotReadiness.readinessScore >= 80 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {autopilotReadiness.readinessScore}%
                      </span>
                    </div>
                  )}
                </div>

                {activeSession && sessionAudit ? (
                  <div className="space-y-3">
                    {/* Readiness Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Completed Checks</div>
                        <div className="text-base font-bold text-emerald-400">
                          {sessionAudit.completedRequiredCount} / {sessionAudit.totalRequiredCount}
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Pending Evidence</div>
                        <div className={`text-base font-bold ${
                          sessionAudit.incompleteRequiredCount > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {sessionAudit.incompleteRequiredCount}
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Review Findings</div>
                        <div className={`text-base font-bold ${
                          sessionAudit.needsReviewCount > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {sessionAudit.needsReviewCount}
                        </div>
                      </div>
                    </div>

                    {/* Missing / Attention Items List */}
                    <div className="space-y-1.5 font-mono">
                      <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        CHECKLIST &amp; EVIDENCE STATUS:
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {sessionAudit.auditItems.map((item) => {
                          const isComplete = item.status === 'COMPLETE';
                          const isNeedsReview = item.status === 'NEEDS_REVIEW';
                          const isIncomplete = item.status === 'INCOMPLETE';

                          return (
                            <div
                              key={item.code}
                              className={`p-2 rounded border text-xs flex items-center justify-between gap-2 transition-colors ${
                                isComplete
                                  ? isDark ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                                  : isNeedsReview
                                    ? isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                                    : isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isComplete ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : isNeedsReview ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                )}
                                <span className="font-bold text-[11px] shrink-0">
                                  {getActivityDisplayCode(item.code)}
                                </span>
                                <span className="truncate text-[11px]">
                                  {item.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.isDispositioned ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    DISPOSITIONED
                                  </span>
                                ) : isComplete ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    READY
                                  </span>
                                ) : isIncomplete ? (
                                  <button
                                    onClick={() => handleJumpToAutopilot(item.code)}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>RECORD</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJumpToAutopilot('08')}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>REVIEW</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono">
                    Select a valid MHC inspection session to perform readiness audit.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TIER 2: STRUCTURED REPORT EVIDENCE OVERVIEW */}
          {activeSession && reportDoc && (() => {
            const s04 = reportDoc.sections['04']?.data;
            const s05 = reportDoc.sections['05']?.data;
            const s06 = reportDoc.sections['06']?.data;
            const s07 = reportDoc.sections['07']?.data;
            const s09 = reportDoc.sections['09']?.data;
            const s10 = reportDoc.sections['10']?.data;
            const s11 = reportDoc.sections['11']?.data;
            const s12 = reportDoc.sections['12']?.data;
            const s13 = reportDoc.sections['13']?.data;
            const s14 = reportDoc.sections['14']?.data;
            const s15 = reportDoc.sections['15']?.data;

            const head1Power = s05?.heads?.find(h => h.headId === 'laser1' || h.headId === 'head_1' || h.headName?.includes('1'));
            const head2Power = s05?.heads?.find(h => h.headId === 'laser2' || h.headId === 'head_2' || h.headName?.includes('2'));

            const head1Beam = s06?.heads?.find(h => h.headId === 'laser1' || h.headId === 'head_1' || h.headName?.includes('1'));
            const head2Beam = s06?.heads?.find(h => h.headId === 'laser2' || h.headId === 'head_2' || h.headName?.includes('2'));

            const head1Focus = s07?.heads?.find(h => h.laserHeadId === 'laser1' || h.laserLabel?.includes('1'));
            const head2Focus = s07?.heads?.find(h => h.laserHeadId === 'laser2' || h.laserLabel?.includes('2'));

            return (
              <div className={`p-5 rounded-xl border space-y-4 ${
                isDark ? 'bg-[var(--surface-surface)] border-[var(--border-default)]' : 'bg-white border-slate-300 shadow-xs'
              }`}>
                {/* Evidence Section Header & Filtering Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      3. AUTHORITATIVE INSPECTION EVIDENCE OVERVIEW
                    </span>
                  </div>

                  {/* Evidence Section Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
                    {[
                      { id: 'ALL', label: 'All Evidence' },
                      { id: 'IDENTITY', label: 'Identity & Hours' },
                      { id: 'HEAD1', label: 'Head 1 Optics' },
                      { id: 'HEAD2', label: 'Head 2 Optics' },
                      { id: 'MOTION', label: 'Motion / AGC' },
                      { id: 'THERMAL', label: 'Thermal' },
                      { id: 'PROCESS', label: 'Via Process' },
                      { id: 'FINDINGS', label: 'Findings' },
                      { id: 'SPARES', label: 'Spare Parts' },
                      { id: 'BUYOFF', label: 'Buyoff' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveEvidenceTab(tab.id as EvidenceSectionTab)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          activeEvidenceTab === tab.id
                            ? isDark 
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                              : 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold'
                            : isDark
                              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categorized Evidence Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* 1. IDENTITY & LASER HOURS */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'IDENTITY') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Section 04 • Laser Hours</span>
                        </span>
                        <Badge variant="success">RECORDED</Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        {s04?.laserHours?.map((h, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">{h.laserIdentifier}:</span>
                            <span className="font-bold text-[var(--text-primary)]">
                              {h.recordedLaserHour != null ? `${h.recordedLaserHour} hrs` : `${h.currentLaserHour} hrs`}
                            </span>
                          </div>
                        )) || (
                          <div className="text-slate-400 italic">No laser hour records</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. LASER HEAD 1 EVIDENCE */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'HEAD1') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Laser Head 1 Optics</span>
                        </span>
                        <Badge variant={head1Power?.current.measuredWatts ? 'success' : 'warning'}>
                          {head1Power?.current.measuredWatts ? 'CALIBRATED' : 'INCOMPLETE'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Power Output:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {head1Power?.current.measuredWatts ? `${head1Power.current.measuredWatts} W` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Beam Size:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {head1Beam?.current.beamSizeMm ? `${head1Beam.current.beamSizeMm} mm` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Focus Baseline:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {head1Focus?.baseline || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. LASER HEAD 2 EVIDENCE */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'HEAD2') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Laser Head 2 Optics</span>
                        </span>
                        <Badge variant={head2Power?.current.measuredWatts ? 'success' : 'warning'}>
                          {head2Power?.current.measuredWatts ? 'CALIBRATED' : 'INCOMPLETE'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Power Output:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {head2Power?.current.measuredWatts ? `${head2Power.current.measuredWatts} W` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Beam Size:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {head2Beam?.current.beamSizeMm ? `${head2Beam.current.beamSizeMm} mm` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Focus Baseline:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {head2Focus?.baseline || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. MOTION & AUTO GAP CONTROL (AGC) */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'MOTION') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-sky-400" />
                          <span>Motion &amp; Scanner AGC</span>
                        </span>
                        <Badge variant={s10?.overallVerdict === 'PASS' ? 'success' : 'warning'}>
                          {s10?.overallVerdict || 'NOT_COLLECTED'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Stage Calibration:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s09?.overallVerdict || 'Not recorded'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">AGC Tolerance:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            ±{s10?.specToleranceUm || 3.0} µm
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Scanner Deviation:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s10?.agcs?.[0]?.overallMaxDevUm != null ? `${s10.agcs[0].overallMaxDevUm} µm` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. TEMPERATURE & THERMAL TELEMETRY */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'THERMAL') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                          <span>Section 11 • Thermal Audit</span>
                        </span>
                        <Badge variant={s11?.hasValidTemperatureAnalysis ? 'success' : 'warning'}>
                          {s11?.hasValidTemperatureAnalysis ? 'LOG RECORDED' : 'PENDING'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Mean Temperature:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s11?.stats?.avg != null ? `${s11.stats.avg.toFixed(2)} °C` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Chiller Temperature:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s11?.chillerTempCelsius != null ? `${s11.chillerTempCelsius} °C` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">DI Water Flow:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s11?.chillerFlowLpm != null ? `${s11.chillerFlowLpm} L/min` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. PRODUCT PROCESS & VIA QUALITY */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'PROCESS') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Microscope className="w-3.5 h-3.5 text-purple-400" />
                          <span>Section 12 • Microvia Quality</span>
                        </span>
                        <Badge variant={s12?.overallResult === 'PASS' ? 'success' : 'warning'}>
                          {s12?.overallResult || 'NOT_COLLECTED'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Target Diameter:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s12?.viaDiameterUm != null ? `${s12.viaDiameterUm} µm` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Head 1 Microvia:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s12?.laser1Via?.topWidthUm != null ? `${s12.laser1Via.topWidthUm} µm` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Head 2 Microvia:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s12?.laser2Via?.topWidthUm != null ? `${s12.laser2Via.topWidthUm} µm` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. FINDINGS & OBSERVATIONS */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'FINDINGS') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Section 13 • Hardware Findings</span>
                        </span>
                        <Badge variant="neutral">
                          {s13?.heads?.reduce((sum, h) => sum + (h.findingsList?.length || 0), 0) || 0} Recorded
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        {s13?.heads?.map((h, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">{h.headName}:</span>
                            <span className="font-medium text-[var(--text-secondary)]">
                              {h.findingsList && h.findingsList.length > 0 
                                ? `${h.findingsList.length} items (${h.findingsList[0].component})` 
                                : 'No anomalies'}
                            </span>
                          </div>
                        )) || (
                          <div className="text-slate-400 italic">No findings recorded</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 8. SPARE PARTS & RECOMMENDATIONS */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'SPARES') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Section 14 • Parts &amp; Consumables</span>
                        </span>
                        <Badge variant="neutral">
                          {(s14?.consumedParts?.length || 0) + (s14?.recommendedParts?.length || 0)} Parts
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Consumed Spares:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s14?.consumedParts?.length || 0} items
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Recommended Spares:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s14?.recommendedParts?.length || 0} items
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 9. BUYOFF & CUSTOMER ACCEPTANCE */}
                  {(activeEvidenceTab === 'ALL' || activeEvidenceTab === 'BUYOFF') && (
                    <div className={`p-3.5 rounded-lg border space-y-2.5 font-mono text-xs ${
                      isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Section 15 • Buyoff &amp; Sign-off</span>
                        </span>
                        <Badge variant={s15?.productionReleaseVerdict === 'APPROVED' ? 'success' : 'warning'}>
                          {s15?.productionReleaseVerdict || 'PENDING'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Customer Representative:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s15?.customerSignoff?.name || 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">Service Engineer:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {s15?.engineerSignoff?.name || activeSession.engineerName || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TIER 3: COMPOSITION & NEXT ACTIONS CONTROL DECK */}
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark ? 'bg-[var(--surface-surface)] border-[var(--border-strong)]' : 'bg-white border-slate-300 shadow-xs'
          }`}>
            <div className="space-y-0.5 text-center sm:text-left font-mono">
              <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Ready to Compose Official Technical Report?</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Authoritative 10–15 page PDF generation compliant with customer technical audit standards.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono">
              {activeSession && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={() => handleJumpToAutopilot()}
                >
                  Edit Session Data
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                disabled={!activeSession}
                icon={<Eye className="w-4 h-4" />}
                onClick={() => setViewMode('COMPOSE_PDF')}
              >
                Compose &amp; Generate Report PDF
              </Button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
