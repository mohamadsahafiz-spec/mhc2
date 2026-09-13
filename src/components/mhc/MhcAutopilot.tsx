import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Building2, 
  Cpu, 
  Play, 
  RefreshCw, 
  FileText, 
  Search, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Check, 
  Lock,
  Eye,
  Edit3,
  Calendar,
  Layers,
  Award,
  LogOut,
  Trash2,
  X
} from 'lucide-react';
import { Customer, Machine, MHCSession, NavigationTab } from '../../types';
import { StorageService } from '../../utils/persistence';
import { ImageStore } from '../../utils/imageStore';
import { useTheme } from '../../context/ThemeContext';
import {
  MHC_WORKFLOW_SCHEDULE,
  ACTIONABLE_ACTIVITIES,
  getActivityDisplayCode,
  createDefaultAutopilotProgress,
  getParentActivityStatus,
  computeAutopilotReadiness,
  auditMhcSession,
  advanceAutopilotActivity,
  flagDownstreamNeedsReview,
  findLatestResumableMhcSession,
  resolveEffectiveAutopilotSession,
  hasMeaningfulMhcProgress
} from '../../utils/mhcAutopilotBrain';
import { MhcLaserHoursActivity } from './autopilot/MhcLaserHoursActivity';
import { MhcLaserPowerActivity } from './autopilot/MhcLaserPowerActivity';
import { MhcLaserBeamActivity } from './autopilot/MhcLaserBeamActivity';
import { MhcLaserInspectionActivity } from './autopilot/MhcLaserInspectionActivity';
import { MhcStageCalibrationActivity } from './autopilot/MhcStageCalibrationActivity';
import { MhcFocusOptimizationActivity } from './autopilot/MhcFocusOptimizationActivity';
import { MhcAgcActivity } from './autopilot/MhcAgcActivity';
import { MhcTemperatureEvidenceActivity } from './autopilot/MhcTemperatureEvidenceActivity';
import { MhcProductProcessActivity } from './autopilot/MhcProductProcessActivity';
import { MhcRecommendationsSparePartsActivity } from './autopilot/MhcRecommendationsSparePartsActivity';
import { MhcReadinessReviewActivity } from './autopilot/MhcReadinessReviewActivity';
import { MhcFullPdfRenderer } from './report/MhcFullPdfRenderer';

export interface MhcAutopilotProps {
  machines: Machine[];
  selectedMachine: Machine;
  activeSession?: MHCSession;
  mhcSessions: MHCSession[];
  onSelectMachine: (machine: Machine) => void;
  onUpdateSession: (session: MHCSession) => void;
  onSaveNewSession: (session: MHCSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onSwitchToCanvas?: () => void;
  onExitAutopilot?: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  onUpdateMachine?: (machine: Machine) => void;
}

export type SetupStep = 'welcome' | 'customer' | 'machine' | 'session_check' | 'session_active';

export function createNewMhcSession(machine: Machine, customerName?: string, engineerName?: string): MHCSession {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
  const rand = Math.random().toString(36).substring(2, 7);

  return {
    id: `MHC-SESS-${Date.now()}-${rand}`,
    machineId: machine.id,
    machineModel: machine.model,
    machineSerialNumber: machine.serialNumber,
    machineName: `${machine.model} (${machine.machineNumber || machine.serialNumber})`,
    customerId: machine.customerId || 'CUST-01',
    customerName: customerName || machine.customerName || 'Customer',
    plantName: machine.plantName || 'Main Plant',
    productionLineName: machine.productionLineName || '',
    zone: machine.zone || '',
    engineerName: engineerName || 'Field Service Engineer',
    startDate: dateStr,
    startTime: timeStr,
    lastUpdated: now.toISOString(),
    completionStatus: 'IN_PROGRESS',
    currentSection: 1,
    mhcSpecs: machine.mhcSpecs,
    sectionStatuses: {
      '01': 'IN_PROGRESS',
      '02': 'NOT_STARTED',
      '03': 'NOT_STARTED',
      '04': 'NOT_STARTED',
      '05': 'NOT_STARTED',
      '06': 'NOT_STARTED',
      '07': 'NOT_STARTED',
      '08': 'NOT_STARTED',
    },
    autopilotProgress: createDefaultAutopilotProgress(),
    stage01_laserHours: [],
    stage02_laserProfile: {
      laserId: 'LASER-01',
      productName: 'Standard Optical Profile',
      recipeProgram: 'RECIPE-01',
      profileInfo: 'Gaussian Optical Beam Profile',
      measurementInfo: 'Initial Baseline Test',
      supportingEvidence: '',
      images: []
    },
    stage03_laserPower: [],
    stage04_opticsBeam: {
      cleanlinessScore: 100,
      beamWaistMm: 0.1,
      focusOffsetMm: 0,
      symmetryRatio: 0.98,
      m2Value: 1.1,
      beforeCondition: 'Clean',
      afterCondition: 'Clean',
      inspectionResult: 'PASS',
      images: [],
      notes: ''
    },
    stage05_cooling: {
      chillerTempCelsius: 20.0,
      chillerFlowLpm: 15.0,
      diConductivityUs: 1.2,
      coolingCondition: 'Optimal',
      thermalCondition: 'Stable',
      beforeCondition: 'Normal',
      afterCondition: 'Normal',
      result: 'PASS',
      notes: ''
    },
    stage06_productQuality: {
      sampleId: 'SAMP-001',
      viaDiameterUm: 100,
      viaShape: 'CIRCULAR',
      viaOffsetUm: 0,
      padQuality: 'EXCELLENT',
      visualVerification: 'CLEAN',
      beforeInspectionNotes: '',
      afterInspectionNotes: '',
      beforeImages: [],
      afterImages: [],
      result: 'PASS',
      notes: ''
    },
    stage07_spareParts: [],
    stage08_engineerRemarks: {
      generalFindings: '',
      observedIssues: '',
      correctiveActions: '',
      recommendations: '',
      followUpRequired: false,
      productionReleaseVerdict: 'APPROVED'
    },
    productProcessRecord: undefined,
    focusOptimizationRecord: undefined,
    focusExecutionState: undefined,
    focusSkippedReason: undefined
  };
}

export const MhcAutopilot: React.FC<MhcAutopilotProps> = ({
  machines,
  selectedMachine,
  activeSession,
  mhcSessions,
  onSelectMachine,
  onUpdateSession,
  onSaveNewSession,
  onDeleteSession,
  onSwitchToCanvas,
  onExitAutopilot,
  onNavigate,
  onUpdateMachine
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Step state in the Autopilot setup flow - always starts at welcome screen
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');

  // Read-only review mode state
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);

  // Active activity observation note text input
  const [activeNoteText, setActiveNoteText] = useState<string>('');

  // Customer selection state
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    if (selectedMachine) {
      const match = customers.find(c => c.id === selectedMachine.customerId || c.name === selectedMachine.customerName);
      if (match) return match;
    }
    return customers[0] || null;
  });
  const [customerSearch, setCustomerSearch] = useState('');

  // Machine search state
  const [machineSearch, setMachineSearch] = useState('');
  const [localSelectedMachine, setLocalSelectedMachine] = useState<Machine | undefined>(selectedMachine || machines[0]);

  // Toast / Status Message
  const [notification, setNotification] = useState<string | null>(null);

  // Post-PDF Download Review & Explicit Completion Modal State
  const [showReviewCompletionModal, setShowReviewCompletionModal] = useState<boolean>(false);
  const [generatedPdfBlobUrl, setGeneratedPdfBlobUrl] = useState<string | null>(null);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState<boolean>(false);

  // Welcome banner quick-access completion state
  const [confirmingWelcomeComplete, setConfirmingWelcomeComplete] = useState<boolean>(false);

  // Draft session discard state
  const [sessionToDiscard, setSessionToDiscard] = useState<MHCSession | null>(null);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);

  // Scroll locking for Review / Completion Modal or Discard Modal
  useEffect(() => {
    if (showReviewCompletionModal || Boolean(sessionToDiscard)) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showReviewCompletionModal, sessionToDiscard]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handler: Confirm Discard Draft Session
  const handleConfirmDiscardSession = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!sessionToDiscard || isDiscarding) return;
    if (sessionToDiscard.completionStatus === 'COMPLETED') {
      showNotification("Completed sessions are historical records and cannot be discarded.");
      setSessionToDiscard(null);
      return;
    }

    setIsDiscarding(true);
    const targetId = sessionToDiscard.id;

    try {
      if (onDeleteSession) {
        onDeleteSession(targetId);
      } else {
        const updatedList = mhcSessions.filter(s => s.id !== targetId);
        StorageService.saveMhcSessions(updatedList);
        await ImageStore.deleteImagesForRecord(targetId);
      }

      showNotification(`MHC draft session ${targetId} discarded.`);
      setSessionToDiscard(null);

      // If we were actively viewing or checking this discarded session, reset to welcome
      if (effectiveSession?.id === targetId || currentStep === 'session_active' || currentStep === 'session_check') {
        setCurrentStep('welcome');
      }
    } catch (err) {
      console.error('Error discarding draft session:', err);
      showNotification("Failed to discard session. Please try again.");
    } finally {
      setIsDiscarding(false);
    }
  };

  // Triggered when PDF is generated and downloaded
  const handlePdfGenerated = (pdfBlobUrl?: string) => {
    if (pdfBlobUrl) {
      setGeneratedPdfBlobUrl(pdfBlobUrl);
    }
    setShowReviewCompletionModal(true);
    showNotification("MHC Official Report PDF generated. Please review and explicitly confirm completion.");
  };

  // Handler: Review Report action from modal
  const handleModalReviewReport = () => {
    if (generatedPdfBlobUrl) {
      const urlToOpen = generatedPdfBlobUrl;
      setTimeout(() => {
        try {
          window.open(urlToOpen, '_blank');
        } catch (err) {
          console.warn('Could not re-open PDF blob URL:', err);
        }
      }, 20);
    }
    // Dismiss the modal so user can review the on-screen report or new tab without completing
    setShowReviewCompletionModal(false);
    setIsConfirmingCompletion(false);
  };

  // Handler: Explicitly Complete MHC from modal
  const handleModalConfirmCompleteMhc = () => {
    if (!effectiveSession) return;
    // Advance 09 to COMPLETED and 10 to COMPLETED
    const step1 = advanceAutopilotActivity(effectiveSession, '09', 'COMPLETED');
    const finalizedSession = advanceAutopilotActivity(step1, '10', 'COMPLETED', activeNoteText || 'Report reviewed and finalized after PDF generation');

    onUpdateSession(finalizedSession);
    setShowReviewCompletionModal(false);
    setIsConfirmingCompletion(false);
    showNotification("MHC Session successfully completed & signed off ✓");
  };

  // Handler: Welcome Quick-Access Complete MHC
  const handleConfirmWelcomeComplete = () => {
    if (!latestResumableSession) return;
    const finalizedSession = advanceAutopilotActivity(
      latestResumableSession,
      '10',
      'COMPLETED',
      'Completed via Welcome Quick-Access'
    );
    onUpdateSession(finalizedSession);
    setConfirmingWelcomeComplete(false);
    showNotification("MHC Session successfully completed & archived ✓");
  };

  // Sync state if selectedMachine changes externally
  useEffect(() => {
    if (selectedMachine) {
      setLocalSelectedMachine(selectedMachine);
      const match = customers.find(c => c.id === selectedMachine.customerId || c.name === selectedMachine.customerName);
      if (match) setSelectedCustomer(match);
    }
  }, [selectedMachine, customers]);

  const handleUpdateMachine = useCallback((updated: Machine) => {
    setLocalSelectedMachine(updated);
    if (onUpdateMachine) {
      onUpdateMachine(updated);
    }
  }, [onUpdateMachine]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const term = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.industry.toLowerCase().includes(term) ||
      c.contactPerson.toLowerCase().includes(term)
    );
  }, [customers, customerSearch]);

  // Filtered machines for selected customer
  const customerMachines = useMemo(() => {
    if (!selectedCustomer) return machines;
    const match = machines.filter(m => m.customerId === selectedCustomer.id || m.customerName === selectedCustomer.name);
    return match.length > 0 ? match : machines;
  }, [machines, selectedCustomer]);

  const filteredMachines = useMemo(() => {
    if (!machineSearch.trim()) return customerMachines;
    const term = machineSearch.toLowerCase();
    return customerMachines.filter(m =>
      m.model.toLowerCase().includes(term) ||
      m.serialNumber.toLowerCase().includes(term) ||
      (m.machineNumber && m.machineNumber.toLowerCase().includes(term)) ||
      m.plantName.toLowerCase().includes(term)
    );
  }, [customerMachines, machineSearch]);

  // Latest valid resumable activity across the entire fleet
  const latestResumableData = useMemo(() => {
    return findLatestResumableMhcSession(mhcSessions, machines);
  }, [mhcSessions, machines]);

  const latestResumableSession = latestResumableData?.session || null;
  const latestResumableMachine = latestResumableData?.machine || null;

  const latestResumableCustomer = useMemo(() => {
    if (!latestResumableMachine && !latestResumableSession) return null;
    const custId = latestResumableMachine?.customerId || latestResumableSession?.customerId;
    const custName = latestResumableMachine?.customerName || latestResumableSession?.customerName;
    return customers.find(c => (custId && c.id === custId) || (custName && c.name === custName)) || null;
  }, [latestResumableMachine, latestResumableSession, customers]);

  // Existing session for selected machine
  const existingIncompleteSession = useMemo(() => {
    if (!localSelectedMachine) return undefined;
    return mhcSessions.find(s => s.machineId === localSelectedMachine.id && s.completionStatus !== 'COMPLETED');
  }, [mhcSessions, localSelectedMachine]);

  // Effective Active Session with Session Brain Progress initialized
  const effectiveSession = useMemo(() => {
    return resolveEffectiveAutopilotSession(activeSession, localSelectedMachine?.id, mhcSessions);
  }, [activeSession, localSelectedMachine?.id, mhcSessions]);

  const progress = useMemo(() => {
    return effectiveSession?.autopilotProgress || createDefaultAutopilotProgress();
  }, [effectiveSession]);

  // Compute Readiness Analysis Report
  const readiness = useMemo(() => {
    return computeAutopilotReadiness(progress, effectiveSession);
  }, [progress, effectiveSession]);

  // Previous completed session for baseline comparison in PDF report
  const previousSession = useMemo(() => {
    if (!effectiveSession) return undefined;
    return mhcSessions.find(s => 
      s.machineId === effectiveSession.machineId && 
      s.id !== effectiveSession.id && 
      s.completionStatus === 'COMPLETED'
    );
  }, [mhcSessions, effectiveSession]);

  // Sync activeNoteText when currentActivityCode changes
  useEffect(() => {
    const currentCode = progress.currentActivityCode;
    const savedNote = progress.activityNotes?.[currentCode] || '';
    setActiveNoteText(savedNote);
  }, [progress.currentActivityCode, progress.activityNotes?.[progress.currentActivityCode]]);

  // Handle Continue Latest Activity (One-Click from Welcome Screen)
  const handleContinueLatestActivity = () => {
    if (!latestResumableSession || !latestResumableMachine) return;

    // 1. Set machine
    setLocalSelectedMachine(latestResumableMachine);
    onSelectMachine(latestResumableMachine);

    // 2. Set customer
    if (latestResumableCustomer) {
      setSelectedCustomer(latestResumableCustomer);
    }

    // 3. Hydrate session
    const hydratedSession: MHCSession = {
      ...latestResumableSession,
      autopilotProgress: latestResumableSession.autopilotProgress || createDefaultAutopilotProgress()
    };
    onUpdateSession(hydratedSession);

    // 4. Directly resume at active activity view
    setIsReadOnlyMode(false);
    setCurrentStep('session_active');

    const activityCode = hydratedSession.autopilotProgress?.currentActivityCode || '01';
    showNotification(`Resumed ${latestResumableMachine.model} (${latestResumableSession.id}) at Activity ${activityCode}`);
  };

  // Handle Continue Existing Session
  const handleContinueExisting = () => {
    if (existingIncompleteSession && localSelectedMachine) {
      onSelectMachine(localSelectedMachine);
      const hydratedSession: MHCSession = {
        ...existingIncompleteSession,
        autopilotProgress: existingIncompleteSession.autopilotProgress || createDefaultAutopilotProgress()
      };
      onUpdateSession(hydratedSession);
      setIsReadOnlyMode(false);
      setCurrentStep('session_active');
      showNotification(`Restored active session for ${localSelectedMachine.model} (${existingIncompleteSession.id})`);
    }
  };

  // Handle Start New Session
  const handleStartNew = () => {
    if (!localSelectedMachine) return;
    onSelectMachine(localSelectedMachine);
    const newSession = createNewMhcSession(
      localSelectedMachine,
      selectedCustomer?.name || localSelectedMachine.customerName,
      'Field Service Engineer'
    );
    onSaveNewSession(newSession);
    setIsReadOnlyMode(false);
    setCurrentStep('session_active');
    showNotification(`Created new MHC session (${newSession.id}) for ${localSelectedMachine.model}`);
  };

  // Handle Review Progress (Read-Only Mode)
  const handleReviewProgress = () => {
    if (existingIncompleteSession && localSelectedMachine) {
      onSelectMachine(localSelectedMachine);
      const hydratedSession: MHCSession = {
        ...existingIncompleteSession,
        autopilotProgress: existingIncompleteSession.autopilotProgress || createDefaultAutopilotProgress()
      };
      onUpdateSession(hydratedSession);
    }
    setIsReadOnlyMode(true);
    setCurrentStep('session_active');
    showNotification(`Entered Read-Only Review Mode`);
  };

  // Handle Action: Mark Complete & Advance
  const handleCompleteCurrentActivity = (
    latestSession?: MHCSession,
    targetCodeOverride?: string,
    statusOverride?: 'COMPLETED' | 'NEEDS_REVIEW'
  ) => {
    const isAuthenticSession = Boolean(
      latestSession &&
      typeof latestSession === 'object' &&
      typeof (latestSession as any).id === 'string' &&
      (latestSession as any).id.length > 0 &&
      !('_reactName' in (latestSession as any)) &&
      !('nativeEvent' in (latestSession as any)) &&
      !('view' in (latestSession as any))
    );
    const sessToAdvance = isAuthenticSession ? latestSession : effectiveSession;
    if (isReadOnlyMode || !sessToAdvance) return;
    const currentCode = (typeof targetCodeOverride === 'string' ? targetCodeOverride : undefined) || sessToAdvance.autopilotProgress?.currentActivityCode || progress.currentActivityCode;
    const finalStatus = (statusOverride === 'COMPLETED' || statusOverride === 'NEEDS_REVIEW') ? statusOverride : 'COMPLETED';
    let updated = advanceAutopilotActivity(sessToAdvance, currentCode, finalStatus, activeNoteText);

    // If completing 02_power (Laser Power Laser 1 & 2), advance side-by-side power checks preserving pass/fail review status
    if (currentCode === '02_power' || currentCode === '03_power') {
      const power1 = sessToAdvance.stage03_laserPower?.find(p => p.laserId === 'lh1' || p.laserId === 'head1' || p.laserIdentifier?.includes('1'));
      const power2 = sessToAdvance.stage03_laserPower?.find(p => p.laserId === 'lh2' || p.laserId === 'head2' || p.laserIdentifier?.includes('2'));
      const status1 = power1?.result === 'FAIL' ? 'NEEDS_REVIEW' : 'COMPLETED';
      const status2 = power2?.result === 'FAIL' ? 'NEEDS_REVIEW' : 'COMPLETED';
      const combinedStatus = (status1 === 'NEEDS_REVIEW' || status2 === 'NEEDS_REVIEW') ? 'NEEDS_REVIEW' : 'COMPLETED';

      updated = advanceAutopilotActivity(sessToAdvance, '02_power', combinedStatus, activeNoteText || (combinedStatus === 'COMPLETED' ? 'Completed in side-by-side Power Workspace' : 'Flagged for review (Out of spec points)'));
      if (updated.autopilotProgress) {
        updated.autopilotProgress.currentActivityCode = '02_beam';
        if (updated.autopilotProgress.activityStatuses['02_beam'] === 'LOCKED' || updated.autopilotProgress.activityStatuses['02_beam'] === 'UPCOMING') {
          updated.autopilotProgress.activityStatuses['02_beam'] = 'IN_PROGRESS';
        }
      }
    }

    // If completing 02_beam (Beam Profile / Mode Laser 1 & 2), advance to 02_findings
    if (currentCode === '02_beam' || currentCode === '03_beam') {
      const beamRecord = sessToAdvance.stage02_laserProfile?.beamProfileRecord;
      const beamStatus = beamRecord?.overallResult === 'FAIL' ? 'NEEDS_REVIEW' : 'COMPLETED';
      updated = advanceAutopilotActivity(sessToAdvance, '02_beam', beamStatus, activeNoteText || 'Completed in side-by-side Beam Profile Workspace');
      if (updated.autopilotProgress) {
        updated.autopilotProgress.currentActivityCode = '02_findings';
        if (updated.autopilotProgress.activityStatuses['02_findings'] === 'LOCKED' || updated.autopilotProgress.activityStatuses['02_findings'] === 'UPCOMING') {
          updated.autopilotProgress.activityStatuses['02_findings'] = 'IN_PROGRESS';
        }
      }
    }

    // If completing 02_findings (Optics Inspection Laser 1 & 2), aggregate both heads and advance to Day 2 (04_stage1)
    if (currentCode === '02_findings' || currentCode === '03_findings') {
      const inspFindings = sessToAdvance.inspectionFindings || {};
      const h1 = inspFindings['lh1'] || inspFindings['head1'];
      const h2 = inspFindings['lh2'] || inspFindings['head2'];
      const hasReview = (h1?.findings || []).some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement') ||
        (h2?.findings || []).some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement') ||
        statusOverride === 'NEEDS_REVIEW';

      const combinedInspStatus: 'COMPLETED' | 'NEEDS_REVIEW' = hasReview ? 'NEEDS_REVIEW' : 'COMPLETED';
      updated = advanceAutopilotActivity(sessToAdvance, '02_findings', combinedInspStatus, activeNoteText || 'Completed Optics and Mechanical Inspection');
      if (updated.autopilotProgress) {
        updated.autopilotProgress.currentActivityCode = '04_stage1';
        updated.autopilotProgress.currentDay = 'DAY 2';
        if (updated.autopilotProgress.activityStatuses['04_stage1'] === 'LOCKED' || updated.autopilotProgress.activityStatuses['04_stage1'] === 'UPCOMING') {
          updated.autopilotProgress.activityStatuses['04_stage1'] = 'IN_PROGRESS';
        }
      }
    }

    onUpdateSession(updated);
    showNotification(`Activity ${currentCode} marked COMPLETED ✓`);
  };

  // Handle Action: Flag for Review
  const handleFlagCurrentNeedsReview = () => {
    if (isReadOnlyMode || !effectiveSession) return;
    const currentCode = progress.currentActivityCode;
    const updated = flagDownstreamNeedsReview(effectiveSession, currentCode);
    const withNote = advanceAutopilotActivity(updated, currentCode, 'NEEDS_REVIEW', activeNoteText);
    onUpdateSession(withNote);
    showNotification(`Activity ${currentCode} flagged for review ⚠`);
  };

  // Handle Action: Re-open Activity for Editing
  const handleReopenActivity = (code: string) => {
    if (isReadOnlyMode || !effectiveSession) return;
    const updated = flagDownstreamNeedsReview(effectiveSession, code);
    const withStatus = advanceAutopilotActivity(updated, code, 'IN_PROGRESS');
    onUpdateSession(withStatus);
    showNotification(`Activity ${code} re-opened for editing`);
  };

  // Update note for specific activity
  const handleUpdateNoteForActivity = (code: string, note: string) => {
    if (isReadOnlyMode || !effectiveSession) return;
    const currP = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const updated: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currP,
        activityNotes: {
          ...(currP.activityNotes || {}),
          [code]: note
        }
      }
    };
    onUpdateSession(updated);
  };

  // Proceed to Report Generation from Readiness Review (Activity 08 -> 09)
  const handleProceedToReportGeneration = () => {
    if (!effectiveSession) return;
    const audit = auditMhcSession(effectiveSession);
    if (!audit.isReadyForReport) {
      showNotification("Cannot proceed: Active readiness blockers remain. Please resolve all blockers first.");
      return;
    }

    const currProgress = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const updatedStatuses = {
      ...currProgress.activityStatuses,
      '08': 'COMPLETED' as const,
      '09': 'IN_PROGRESS' as const
    };

    const updatedSession: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currProgress,
        activityStatuses: updatedStatuses,
        currentActivityCode: '09',
        currentDay: 'DAY 4',
        lastActiveTimestamp: new Date().toISOString()
      }
    };

    onUpdateSession(updatedSession);
    showNotification("MHC Session Readiness verified! Activity 09 Report Generation unlocked ✓");
  };

  // Proceed to Buyoff / Complete from Report Generation (Activity 09 -> 10)
  const handleProceedToBuyoff = () => {
    if (!effectiveSession) return;
    const currProgress = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const updatedStatuses = {
      ...currProgress.activityStatuses,
      '09': 'COMPLETED' as const,
      '10': 'IN_PROGRESS' as const
    };

    const updatedSession: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currProgress,
        activityStatuses: updatedStatuses,
        currentActivityCode: '10',
        currentDay: 'DAY 4',
        lastActiveTimestamp: new Date().toISOString()
      }
    };

    onUpdateSession(updatedSession);
    showNotification("Activity 09 Report Generation marked COMPLETED! Proceeding to 10 Buyoff / Complete ✓");
  };

  // Handle Activity Navigation Jump
  const handleJumpToActivityCode = (code: string) => {
    if (!effectiveSession) return;
    const currProgress = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const targetActivity = ACTIONABLE_ACTIVITIES.find(a => a.code === code);
    
    const currentStatus = currProgress.activityStatuses[code] || 'LOCKED';
    const updatedStatuses = { ...currProgress.activityStatuses };

    // If jumping to a locked or upcoming activity directly from Readiness Review, initialize as IN_PROGRESS
    if (currentStatus === 'LOCKED' || currentStatus === 'UPCOMING') {
      updatedStatuses[code] = 'IN_PROGRESS';
    }

    const updatedSession: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currProgress,
        activityStatuses: updatedStatuses,
        currentActivityCode: code,
        currentDay: targetActivity?.day || currProgress.currentDay,
        lastActiveTimestamp: new Date().toISOString()
      }
    };
    onUpdateSession(updatedSession);
  };

  // Journey Rail Step Items definition for Setup
  const journeyRailSteps = [
    {
      id: 'welcome' as SetupStep,
      title: 'Autopilot Setup',
      subtext: 'Welcome & Overview',
      status: currentStep === 'welcome' 
        ? 'current' 
        : ['customer', 'machine', 'session_check', 'session_active'].includes(currentStep) 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'customer' as SetupStep,
      title: 'Customer Passport',
      subtext: selectedCustomer ? selectedCustomer.name : 'Select Account',
      status: currentStep === 'customer' 
        ? 'current' 
        : ['machine', 'session_check', 'session_active'].includes(currentStep) 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'machine' as SetupStep,
      title: 'Machine Passport',
      subtext: localSelectedMachine ? `${localSelectedMachine.model}` : 'Select Machine',
      status: currentStep === 'machine' 
        ? 'current' 
        : ['session_check', 'session_active'].includes(currentStep) 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'session_check' as SetupStep,
      title: 'Session Detection',
      subtext: existingIncompleteSession ? 'Session Found' : 'Detection & Recovery',
      status: currentStep === 'session_check' 
        ? 'current' 
        : currentStep === 'session_active' 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'session_active' as SetupStep,
      title: 'MHC Journey Rail',
      subtext: `Day ${progress.currentDay.replace('DAY ', '')} — ${getActivityDisplayCode(progress.currentActivityCode)}`,
      status: currentStep === 'session_active' ? 'current' : 'upcoming'
    }
  ];

  const currentActionableItem = useMemo(() => {
    return ACTIONABLE_ACTIVITIES.find(a => a.code === progress.currentActivityCode) || ACTIONABLE_ACTIVITIES[0];
  }, [progress.currentActivityCode]);

  return (
    <div className={`fixed inset-0 z-50 p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center ${
      showReviewCompletionModal ? 'overflow-hidden' : 'overflow-y-auto'
    }`}>
      
      {/* Toast Notification */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[var(--color-success)] text-slate-950 font-semibold text-xs shadow-xl flex items-center gap-2 border border-emerald-400"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Main Autopilot Container */}
      <div className={`w-full max-w-7xl min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] my-auto rounded-xl border shadow-xl flex flex-col md:flex-row ${
        isDark 
          ? 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)] shadow-2xl shadow-black/40' 
          : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)] shadow-lg shadow-slate-200/50'
      }`}>

        {/* LEFT COLUMN: MHC JOURNEY RAIL & SESSION BRAIN */}
        <div className={`w-full md:w-80 shrink-0 p-4 sm:p-5 border-b md:border-b-0 md:border-r flex flex-col justify-between ${
          isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-[var(--border-default)]'
        }`}>
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  isDark 
                    ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--color-primary)]' 
                    : 'bg-white border-slate-300 text-indigo-600 shadow-xs'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    MHC Autopilot
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">Inspection Workstation</p>
                </div>
              </div>
            </div>

            {/* SETUP FLOW STEPS (JOURNEY RAIL) */}
            <div className="space-y-2 mb-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold px-1">
                SETUP SEQUENCE
              </div>
              
              <div className="space-y-1">
                {journeyRailSteps.map((step) => {
                  const isClickable = step.status === 'completed';
                  return (
                    <button
                      key={step.id}
                      disabled={!isClickable && step.status !== 'current'}
                      onClick={() => {
                        if (isClickable) setCurrentStep(step.id);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-2.5 border ${
                        step.status === 'current'
                          ? isDark 
                            ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] ring-1 ring-slate-600 font-medium' 
                            : 'bg-white border-slate-300 text-slate-900 font-medium shadow-xs'
                          : step.status === 'completed'
                          ? isDark
                            ? 'bg-[var(--surface-surface)]/40 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-surface)] cursor-pointer'
                            : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-white cursor-pointer'
                          : isDark
                          ? 'bg-transparent border-transparent text-[var(--text-subtle)] cursor-not-allowed opacity-50'
                          : 'bg-transparent border-transparent text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {step.status === 'completed' && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                        )}
                        {step.status === 'current' && (
                          <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 flex items-center justify-center text-[9px]">
                            ●
                          </div>
                        )}
                        {step.status === 'upcoming' && (
                          <div className="w-4 h-4 rounded-full bg-slate-800/40 border border-slate-700/50 text-slate-500 flex items-center justify-center text-[9px]">
                            ○
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[11px] truncate">{step.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">{step.subtext}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE WORKFLOW SCHEDULE ON RAIL (JOURNEY RAIL BRAIN) */}
            <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold px-1 flex items-center justify-between">
                <span>SCHEDULE</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--surface-surface)] text-[var(--text-secondary)]">
                  {readiness.readinessScore}% READY
                </span>
              </div>
              
              <div className="space-y-1.5">
                {MHC_WORKFLOW_SCHEDULE.map((dayGroup) => (
                  <div key={dayGroup.code + dayGroup.day} className="space-y-1">
                    {/* Activity Code Item */}
                    {(() => {
                      const isParent = dayGroup.subItems && dayGroup.subItems.length > 0;
                      const actStatus = isParent 
                        ? getParentActivityStatus(dayGroup.code, progress.activityStatuses)
                        : (progress.activityStatuses[dayGroup.code] || 'LOCKED');
                      
                      const isCurrentActive = progress.currentActivityCode === dayGroup.code;

                      return (
                        <div className="space-y-1">
                          <button
                            disabled={actStatus === 'LOCKED'}
                            onClick={() => {
                              if (!isParent) handleJumpToActivityCode(dayGroup.code);
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
                              {/* Status indicator */}
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
                          </button>

                          {/* Sub items if present */}
                          {isParent && (
                            <div className="pl-4 space-y-1 pt-0.5 border-l border-[var(--border-default)] ml-2">
                              {dayGroup.subItems?.map((sub, sIdx) => {
                                const subStatus = progress.activityStatuses[sub.code] || 'LOCKED';
                                const isSubActive = progress.currentActivityCode === sub.code;
                                const isLast = sIdx === (dayGroup.subItems?.length || 0) - 1;

                                return (
                                  <button
                                    key={sub.code}
                                    disabled={subStatus === 'LOCKED'}
                                    onClick={() => handleJumpToActivityCode(sub.code)}
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
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AUTOPILOT EXIT CONTROL */}
          <div className="pt-4 border-t border-[var(--border-default)]">
            <button
              id="mhc-autopilot-exit-btn"
              onClick={() => {
                if (onExitAutopilot) {
                  onExitAutopilot();
                } else if (onNavigate) {
                  onNavigate('start_page');
                } else {
                  onSwitchToCanvas();
                }
              }}
              title="Exit Autopilot and return to Daily Work"
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]' 
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-xs'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>EXIT WORKSTATION</span>
            </button>

            {currentStep === 'session_active' && effectiveSession && effectiveSession.completionStatus !== 'COMPLETED' && (
              <button
                id="mhc-autopilot-rail-discard-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionToDiscard(effectiveSession);
                }}
                title="Discard this unwanted draft session"
                className="w-full mt-2 py-2 px-3 rounded-lg border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Discard Draft Session</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FOCUSED AUTOPILOT STEPS */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
          
          <>
            
            {/* QUESTION STEP 1: WELCOME & OVERVIEW */}
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 my-auto"
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-secondary)] text-xs font-mono">
                  <span>FSOS // MHC WORKSTATION INITIALIZER</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Machine Health Check Inspection
                  </h1>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xl">
                    Structured 4-day guided inspection environment for equipment maintenance, optical laser profiling, thermal validation, and customer buyoff.
                  </p>
                </div>

                {/* FEATURE HIGHLIGHTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className={`p-3.5 rounded-lg border space-y-1 ${
                    isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text-primary)]">
                      <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>Customer &amp; Machine Identity</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Direct binding with equipment passports, laser heads, and historical baseline records.
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-lg border space-y-1 ${
                    isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text-primary)]">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Deterministic State Recovery</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Auto-detects active incomplete inspections and restores progress without data loss.
                    </p>
                  </div>
                </div>

                {/* ONE-CLICK CONTINUE LAST ACTIVITY BANNER (IF RESUMABLE ACTIVITY EXISTS) */}
                {latestResumableSession && latestResumableMachine && (
                  <div className={`p-4 rounded-lg border space-y-3 transition-all ${
                    isDark ? 'bg-[var(--surface-raised)] border-[var(--border-strong)]' : 'bg-slate-50 border-slate-300 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          Active Draft Session Detected
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                        {latestResumableSession.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                          <span>{latestResumableMachine.model}</span>
                          <span className="text-xs font-mono font-normal text-[var(--text-muted)]">
                            ({latestResumableMachine.machineNumber || latestResumableMachine.serialNumber})
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-mono">
                          {latestResumableCustomer?.name || latestResumableSession.customerName || latestResumableMachine.customerName || 'Customer'} • {latestResumableMachine.plantName} • {latestResumableSession.autopilotProgress?.currentDay || 'DAY 1'} — {latestResumableSession.autopilotProgress?.currentActivityCode || '01'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
                          className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                          className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-mono font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Discard this unwanted draft session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Discard</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Explicit Confirmation for Welcome Complete */}
                    {confirmingWelcomeComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-2.5"
                      >
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Confirm Completion for Session {latestResumableSession.id}?</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          This will finalize Activity 09 Buyoff, set status to <strong className="text-emerald-400">COMPLETED</strong>, and archive it from active resume detection. All inspection records, logs, and historical data remain safely preserved.
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            id="btn-welcome-confirm-complete-yes"
                            onClick={handleConfirmWelcomeComplete}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
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
                )}

                {/* PRIMARY ACTION */}
                <div className="pt-4 flex items-center justify-between border-t border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)] font-mono">Step 1 of 4 • Welcome</span>
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className={`px-5 py-2.5 rounded-lg font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      latestResumableSession
                        ? isDark
                          ? 'bg-[var(--surface-raised)] hover:bg-[var(--surface-workspace)] text-[var(--text-primary)] border border-[var(--border-default)]'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                        : 'bg-[var(--color-primary)] hover:opacity-90 text-white shadow-xs'
                    }`}
                  >
                    <span>{latestResumableSession ? 'Manual Setup / New Machine' : 'Start Autopilot Setup'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SELECT CUSTOMER */}
            {currentStep === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Step 2 of 4 • Customer Account
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Select Customer Account
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Choose a Customer Passport account to view associated machine assets.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by customer name, industry, or contact..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  />
                </div>

                {/* CUSTOMER SELECTION LIST */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCustomers.map((c) => {
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
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] ring-1 ring-slate-600'
                              : 'bg-slate-100 border-slate-400 text-slate-900'
                            : isDark
                            ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-default)]'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
                            isSelected 
                              ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]' 
                              : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-muted)]'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--text-primary)]">{c.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.industry} • {c.contactPerson}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono flex items-center gap-2">
                          {hasActiveSessions && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span>Active Job</span>
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                            {machineCount} Assets
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NEXT ACTION */}
                <div className="pt-3 flex items-center justify-between border-t border-[var(--border-default)]">
                  <button
                    onClick={() => setCurrentStep('welcome')}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
                      Selected: <strong className="text-[var(--text-primary)]">{selectedCustomer?.name || 'None'}</strong>
                    </span>
                    <button
                      disabled={!selectedCustomer}
                      onClick={() => setCurrentStep('machine')}
                      className="px-5 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Next: Select Machine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SELECT MACHINE */}
            {currentStep === 'machine' && (
              <motion.div
                key="machine"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Step 3 of 4 • Target Equipment
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Select Target Machine for {selectedCustomer?.name || 'Customer'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Choose the specific machine asset to inspect or continue an active Autopilot session.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    placeholder="Search by model, serial number, plant..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  />
                </div>

                {/* MACHINE SELECTION LIST */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredMachines.map((m) => {
                    const isSelected = localSelectedMachine?.id === m.id;
                    const hasActiveSession = mhcSessions.some(s => s.machineId === m.id && hasMeaningfulMhcProgress(s));
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setLocalSelectedMachine(m);
                          onSelectMachine(m);
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] ring-1 ring-slate-600'
                              : 'bg-slate-100 border-slate-400 text-slate-900'
                            : isDark
                            ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-default)]'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
                            isSelected 
                              ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]' 
                              : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-muted)]'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--text-primary)]">{m.model}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              SN: {m.serialNumber} • Plant: {m.plantName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2 font-mono">
                          {hasActiveSession ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span>Active Session</span>
                            </span>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              m.status === 'OPERATIONAL' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {m.status}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NEXT ACTION */}
                <div className="pt-3 flex items-center justify-between border-t border-[var(--border-default)]">
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    ← Back: Customers
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
                      Selected: <strong className="text-[var(--text-primary)]">{localSelectedMachine?.model} ({localSelectedMachine?.serialNumber})</strong>
                    </span>
                    <button
                      disabled={!localSelectedMachine}
                      onClick={() => setCurrentStep('session_check')}
                      className="px-5 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Check Session</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SESSION RECOVERY & DETECTION FOR SELECTED MACHINE */}
            {currentStep === 'session_check' && (
              <motion.div
                key="session_check"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Step 4 of 4 • Session State Verification
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Session Detection &amp; Recovery
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Inspecting active history for {localSelectedMachine?.model} ({localSelectedMachine?.machineNumber || localSelectedMachine?.serialNumber}) — {selectedCustomer?.name || localSelectedMachine?.customerName}.
                  </p>
                </div>

                {/* IF INCOMPLETE SESSION EXISTS */}
                {existingIncompleteSession ? (
                  <div className={`p-4 rounded-lg border space-y-4 ${
                    isDark ? 'bg-[var(--surface-raised)] border-[var(--border-strong)]' : 'bg-slate-50 border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">Incomplete Session Found</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                        {existingIncompleteSession.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Start Date</div>
                        <div className="font-semibold text-[var(--text-primary)]">{existingIncompleteSession.startDate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Last Updated</div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {new Date(existingIncompleteSession.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Engineer</div>
                        <div className="font-semibold text-[var(--text-primary)]">{existingIncompleteSession.engineerName || 'Field Engineer'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Readiness</div>
                        <div className="font-semibold text-cyan-400">
                          {computeAutopilotReadiness(existingIncompleteSession.autopilotProgress).readinessScore}% Complete
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      An active inspection session was detected for this machine. You can continue the existing session without losing data or start a new clean session.
                    </p>

                    {/* ACTIONS */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={handleContinueExisting}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue Existing Session</span>
                      </button>

                      <button
                        onClick={handleStartNew}
                        className={`px-3.5 py-2 rounded-lg font-mono font-semibold text-xs border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-primary)] border-[var(--border-default)]' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Start New Session</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('machine')}
                        className={`px-3 py-2 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>Change Machine</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('customer')}
                        className={`px-3 py-2 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>Change Customer</span>
                      </button>

                      <button
                        id="mhc-session-check-discard-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDiscard(existingIncompleteSession);
                        }}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-mono font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Discard this draft session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard Draft</span>
                      </button>

                      <button
                        onClick={handleReviewProgress}
                        className="px-3 py-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-auto flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Review Progress (Read-Only)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* IF NO INCOMPLETE SESSION FOUND */
                  <div className={`p-4 rounded-lg border space-y-4 ${
                    isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3 text-[var(--text-muted)]">
                      <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                      <div>
                        <div className="font-bold text-xs text-[var(--text-primary)]">No Active Session Found for {localSelectedMachine?.model}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Ready to launch a new Machine Health Check inspection for this equipment.</div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={handleStartNew}
                        className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Create &amp; Start New MHC Session</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('machine')}
                        className={`px-3.5 py-2.5 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-[var(--border-default)]' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Select Other Machine</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('customer')}
                        className={`px-3.5 py-2.5 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-[var(--border-default)]' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Change Customer</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: SESSION BRAIN ACTIVE INSPECTION VIEW */}
            {currentStep === 'session_active' && (
              <motion.div
                key="session_active"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 my-auto"
              >
                {/* TOP HEADER & READ-ONLY TOGGLE */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-default)]">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>INSPECTION ACTIVE</span>
                    </div>
                    {isReadOnlyMode && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>READ-ONLY</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <span className="text-xs font-mono text-[var(--text-muted)] hidden md:inline">
                      SESSION ID: <strong className="text-[var(--text-primary)]">{effectiveSession?.id}</strong>
                    </span>
                    
                    <button
                      onClick={() => setCurrentStep('customer')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-workspace)] hover:text-[var(--text-primary)]' 
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Switch Machine</span>
                    </button>

                    <button
                      onClick={() => setIsReadOnlyMode(!isReadOnlyMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isReadOnlyMode
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                          : isDark
                          ? 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-workspace)]'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isReadOnlyMode ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Enable Editing</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Read-Only Mode</span>
                        </>
                      )}
                    </button>

                    {effectiveSession && effectiveSession.completionStatus !== 'COMPLETED' && (
                      <button
                        id="mhc-autopilot-discard-draft-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDiscard(effectiveSession);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                        title="Discard this unwanted draft session"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Discard</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* MACHINE & CUSTOMER TITLE */}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {localSelectedMachine.model} <span className="font-mono text-base font-normal text-[var(--text-muted)]">({localSelectedMachine.machineNumber || localSelectedMachine.serialNumber})</span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Customer: <strong className="text-[var(--text-primary)]">{selectedCustomer?.name || localSelectedMachine.customerName}</strong> • Plant: <strong className="text-[var(--text-primary)]">{localSelectedMachine.plantName}</strong> • Start: <strong className="text-[var(--text-primary)]">{effectiveSession?.startDate}</strong>
                  </p>
                </div>

                {/* READ-ONLY BANNER IF ACTIVE */}
                {isReadOnlyMode && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Read-Only Review:</strong> Inspection session is locked against accidental edits.</span>
                    </div>
                    <button
                      onClick={() => setIsReadOnlyMode(false)}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-200 underline decoration-dotted shrink-0 cursor-pointer"
                    >
                      Enable Editing
                    </button>
                  </div>
                )}

                {/* READINESS OVERVIEW BAR */}
                <div className={`p-3.5 rounded-lg border space-y-3 ${
                  isDark ? 'bg-[var(--surface-raised)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono font-semibold">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>MHC INSPECTION READINESS</span>
                    </span>
                    <span className="text-[var(--color-primary)] font-bold">{readiness.readinessScore}% Complete</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-[var(--surface-workspace)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${readiness.readinessScore}%` }}
                    />
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-muted)]">COMPLETED</div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{readiness.completedCount} / {readiness.totalCount}</div>
                    </div>

                    <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-muted)]">CURRENT DAY</div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{progress.currentDay}</div>
                    </div>

                    <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-muted)]">NEEDS REVIEW</div>
                      <div className="font-bold text-xs text-amber-400">{readiness.needsReviewList.length} Items</div>
                    </div>

                    <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-muted)]">REPORT STATUS</div>
                      <div className="font-bold text-xs truncate">
                        {readiness.isReadyForReport ? (
                          <span className="text-emerald-400">✓ READY</span>
                        ) : (
                          <span className="text-amber-400">PENDING</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOCUSED JOURNEY ACTIVITY CONTROL ("SESSION BRAIN") */}
                {progress.currentActivityCode === '01' ? (
                  <MhcLaserHoursActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '02_power' || progress.currentActivityCode === '03_power') ? (
                  <MhcLaserPowerActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onUpdateMachine={handleUpdateMachine}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '02_beam' || progress.currentActivityCode === '03_beam') ? (
                  <MhcLaserBeamActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onUpdateMachine={handleUpdateMachine}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '02_findings' || progress.currentActivityCode === '03_findings') ? (
                  <MhcLaserInspectionActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onUpdateMachine={handleUpdateMachine}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '04_stage1' || progress.currentActivityCode === '04_stage2' || progress.currentActivityCode === '04') ? (
                  <MhcStageCalibrationActivity
                    session={effectiveSession!}
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
                    session={effectiveSession!}
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
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : progress.currentActivityCode === '06' ? (
                  <MhcTemperatureEvidenceActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onUpdateMachine={handleUpdateMachine}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    onSwitchToCanvas={onSwitchToCanvas}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '06_via' || progress.currentActivityCode === '06_process') ? (
                  <MhcProductProcessActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : progress.currentActivityCode === '07' ? (
                  <MhcRecommendationsSparePartsActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isDark={isDark}
                    isReadOnly={isReadOnlyMode}
                    onNavigateToActivity={handleJumpToActivityCode}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    onUpdateSession={onUpdateSession}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '08' || progress.currentActivityCode === '08_review') ? (
                  <MhcReadinessReviewActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isDark={isDark}
                    isReadOnly={isReadOnlyMode}
                    onNavigateToActivity={handleJumpToActivityCode}
                    onProceedToReportGeneration={handleProceedToReportGeneration}
                    onUpdateEngineerNote={(note) => handleUpdateNoteForActivity('08', note)}
                    onUpdateSession={onUpdateSession}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '09' || progress.currentActivityCode === '09_report') ? (
                  <MhcFullPdfRenderer
                    session={effectiveSession!}
                    previousSession={previousSession}
                    isDark={isDark}
                    onProceedToBuyoff={handleProceedToBuyoff}
                    onPdfGenerated={handlePdfGenerated}
                    onBackToAutopilot={() => handleJumpToActivityCode('08')}
                  />
                ) : (progress.currentActivityCode === '10' || progress.currentActivityCode === '10_buyoff') ? (
                  /* ACTIVITY 10: BUYOFF / COMPLETE FINALIZATION VIEW */
                  <div className={`p-4 rounded-lg border space-y-4 ${
                    effectiveSession?.completionStatus === 'COMPLETED'
                      ? isDark ? 'bg-[var(--surface-raised)] border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-300'
                      : isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          effectiveSession?.completionStatus === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          DAY 4 • 10
                        </span>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">
                          Buyoff &amp; Final MHC Session Acceptance
                        </h3>
                      </div>

                      {/* Status Pill */}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        effectiveSession?.completionStatus === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {effectiveSession?.completionStatus === 'COMPLETED' ? '✓ SESSION COMPLETED' : '◉ IN PROGRESS'}
                      </span>
                    </div>

                    {/* Summary / Confirmation Box */}
                    {effectiveSession?.completionStatus === 'COMPLETED' ? (
                      <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>MHC Inspection Successfully Finalized &amp; Signed Off</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          All 4 days of engineering inspection activities, optical measurements, calibration data, and customer buyoff acceptance have been completed.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
                          <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                            <div className="text-[10px] text-[var(--text-muted)]">STATUS</div>
                            <div className="font-bold text-emerald-400">COMPLETED</div>
                          </div>
                          <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                            <div className="text-[10px] text-[var(--text-muted)]">READINESS</div>
                            <div className="font-bold text-cyan-400">100% Passed</div>
                          </div>
                          <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                            <div className="text-[10px] text-[var(--text-muted)]">ENGINEER</div>
                            <div className="font-bold text-[var(--text-primary)] truncate">{effectiveSession.engineerName || 'Field Engineer'}</div>
                          </div>
                          <div className="p-2 rounded border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
                            <div className="text-[10px] text-[var(--text-muted)]">COMPLETED</div>
                            <div className="font-bold text-[var(--text-primary)] text-[11px] truncate">
                              {effectiveSession.lastUpdated ? new Date(effectiveSession.lastUpdated).toLocaleDateString() : 'Today'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-subtle)] space-y-2">
                          <div className="text-xs font-mono font-bold text-[var(--text-primary)]">Final Verification Checklist:</div>
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
                            <button
                              id="btn-mhc-finalize-session"
                              onClick={() => handleCompleteCurrentActivity()}
                              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete MHC Session &amp; Finalize Buyoff ✓</span>
                            </button>

                            <button
                              onClick={() => handleJumpToActivityCode('09')}
                              className="px-3.5 py-2.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)] text-xs font-mono cursor-pointer"
                            >
                              <span>← Review Report (09)</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-amber-300 font-mono flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Action controls locked in Read-Only mode. Toggle "Enable Editing" above to modify.</span>
                          </div>
                        )
                      ) : (
                        <>
                          <button
                            onClick={() => handleJumpToActivityCode('09')}
                            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Full MHC Report (09)</span>
                          </button>

                          <button
                            onClick={() => setCurrentStep('welcome')}
                            className="px-3.5 py-2 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)] text-xs font-mono cursor-pointer"
                          >
                            <span>Return to Autopilot Setup</span>
                          </button>

                          {!isReadOnlyMode && (
                            <button
                              onClick={() => handleReopenActivity('10')}
                              className="px-3 py-1.5 rounded-lg bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono border border-[var(--border-subtle)] ml-auto cursor-pointer"
                            >
                              Re-open Buyoff Activity
                            </button>
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
                        <button
                          onClick={() => handleCompleteCurrentActivity()}
                          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Mark Complete & Advance</span>
                        </button>

                        <button
                          onClick={() => handleFlagCurrentNeedsReview()}
                          className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Flag for Review</span>
                        </button>

                        {progress.activityStatuses[currentActionableItem.code] === 'COMPLETED' && (
                          <button
                            onClick={() => handleReopenActivity(currentActionableItem.code)}
                            className="px-3 py-2 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono border border-[var(--border-subtle)] cursor-pointer"
                          >
                            Re-open Activity
                          </button>
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

                {/* BOTTOM FOOTER ACTIONS */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)]">
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    ← Change Machine or Customer
                  </button>

                  {onSwitchToCanvas && (
                    <button
                      onClick={onSwitchToCanvas}
                      className="px-4 py-2 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-primary)] font-mono font-semibold text-xs border border-[var(--border-default)] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Open Full Workspace</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </>
        </div>

      </div>

      {/* POST-PDF DOWNLOAD REVIEW & EXPLICIT COMPLETION MODAL */}
      {showReviewCompletionModal && (
        <div
          id="modal-mhc-review-completion-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReviewCompletionModal(false);
              setIsConfirmingCompletion(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            id="modal-mhc-review-completion-dialog"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.15 }}
            className={`relative w-full max-w-lg rounded-xl border shadow-xl p-5 space-y-4 ${
              isDark
                ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]'
                : 'bg-white border-slate-300 text-slate-900 shadow-slate-900/10'
            }`}
          >
            {/* Close Button */}
            <button
              id="btn-modal-review-completion-close"
              onClick={() => {
                setShowReviewCompletionModal(false);
                setIsConfirmingCompletion(false);
              }}
              className="absolute top-3.5 right-3.5 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-workspace)] transition-colors cursor-pointer"
              title="Dismiss modal and return to workspace"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 pr-6">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  PDF EXPORT GENERATED
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  MHC Report Ready for Review
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  The official MHC Report PDF has been compiled. Please review the generated document before finalizing this MHC session.
                </p>
              </div>
            </div>

            {/* Information / Status Box */}
            <div className={`p-3 rounded border text-xs space-y-1.5 font-mono ${
              isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">CURRENT STATUS:</span>
                <span className="font-bold text-amber-400">IN_PROGRESS (Pending Sign-Off)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">EQUIPMENT:</span>
                <span className="text-[var(--text-primary)] font-semibold">{effectiveSession?.machineModel} • {effectiveSession?.machineSerialNumber}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">FACILITY:</span>
                <span className="text-[var(--text-primary)] font-semibold">{effectiveSession?.customerName} ({effectiveSession?.plantName})</span>
              </div>
            </div>

            {/* Explicit Confirmation Step if User clicks Complete MHC */}
            {isConfirmingCompletion ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Confirm Authoritative Session Completion</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Completing this MHC will finalize Buyoff, set status to <strong className="text-emerald-400">COMPLETED</strong>, and archive the active session.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono">
                  <button
                    id="btn-modal-confirm-complete-yes"
                    onClick={handleModalConfirmCompleteMhc}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Yes, Finalize &amp; Complete MHC</span>
                  </button>
                  <button
                    onClick={() => setIsConfirmingCompletion(false)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] text-xs border border-[var(--border-default)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* Primary Modal Action Buttons */}
            {!isConfirmingCompletion && (
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 font-mono">
                <button
                  id="btn-modal-review-report"
                  onClick={handleModalReviewReport}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>REVIEW REPORT</span>
                </button>

                <button
                  id="btn-modal-complete-mhc"
                  onClick={() => setIsConfirmingCompletion(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>COMPLETE MHC</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* DISCARD DRAFT SESSION CONFIRMATION MODAL */}
      {sessionToDiscard && (
        <div
          id="modal-mhc-discard-session-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDiscarding) {
              setSessionToDiscard(null);
            }
          }}
        >
          <motion.div
            id="modal-mhc-discard-session-dialog"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.15 }}
            className={`w-full max-w-lg rounded-xl border shadow-xl p-5 space-y-4 ${
              isDark
                ? 'bg-[var(--surface-surface)] border-rose-900/50 text-[var(--text-primary)]'
                : 'bg-white border-rose-200 text-slate-900 shadow-slate-900/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  DRAFT SESSION REMOVAL
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Discard this MHC draft session?
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  The session progress will be removed and cannot be resumed.
                </p>
              </div>
            </div>

            {/* Information / Progress Box */}
            <div className={`p-3 rounded border text-xs space-y-1.5 font-mono ${
              isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">SESSION ID:</span>
                <span className="font-bold text-[var(--text-primary)]">{sessionToDiscard.id}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">EQUIPMENT:</span>
                <span className="text-[var(--text-primary)] font-semibold">{sessionToDiscard.machineModel} ({sessionToDiscard.machineSerialNumber})</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">CUSTOMER:</span>
                <span className="text-[var(--text-primary)] font-semibold">{sessionToDiscard.customerName} • {sessionToDiscard.plantName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">STARTED:</span>
                <span className="text-[var(--text-secondary)]">{sessionToDiscard.startDate} {sessionToDiscard.startTime}</span>
              </div>

              {(() => {
                const audit = auditMhcSession(sessionToDiscard);
                const readinessScore = computeAutopilotReadiness(sessionToDiscard.autopilotProgress).readinessScore;
                const hasData = readinessScore > 0 || (sessionToDiscard.stage01_laserHours && sessionToDiscard.stage01_laserHours.length > 0) || (sessionToDiscard.stage03_laserPower && sessionToDiscard.stage03_laserPower.length > 0);
                return hasData ? (
                  <div className="pt-2 border-t border-rose-500/20 text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>Warning:</strong> This session contains recorded inspection data ({readinessScore}% readiness, {audit.completedRequiredCount} of {audit.totalRequiredCount} required activities completed). Discarding will permanently remove this draft.
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                    Empty session with no recorded inspection data.
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 font-mono">
              <button
                id="btn-cancel-discard-session"
                type="button"
                disabled={isDiscarding}
                onClick={() => setSessionToDiscard(null)}
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-secondary)]'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                Cancel
              </button>

              <button
                id="btn-confirm-discard-session"
                type="button"
                disabled={isDiscarding}
                onClick={handleConfirmDiscardSession}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDiscarding ? 'Discarding...' : 'Discard Session'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
