import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Eye,
  Trash2,
  X
} from 'lucide-react';
import { Customer, Machine, MHCSession, NavigationTab } from '../../types';
import { StorageService } from '../../utils/persistence';
import { ImageStore } from '../../utils/imageStore';
import { useTheme } from '../../context/ThemeContext';
import {
  createFadeSlideVariants,
  createScaleFadeVariants,
  slidingIndicatorTransition,
  mechanicalPressConfig,
  motionTimings,
  motionEasings
} from '../../theme/motion';
import {
  ACTIONABLE_ACTIVITIES,
  createDefaultAutopilotProgress,
  computeAutopilotReadiness,
  auditMhcSession,
  advanceAutopilotActivity,
  flagDownstreamNeedsReview,
  findLatestResumableMhcSession,
  resolveEffectiveAutopilotSession
} from '../../utils/mhcAutopilotBrain';
import { MhcWorkstationHeader } from './autopilot/MhcWorkstationHeader';
import { MhcWorkstationNavigator } from './autopilot/MhcWorkstationNavigator';
import { MhcWorkstationSetupFlow } from './autopilot/MhcWorkstationSetupFlow';
import { MhcWorkstationActivityHost } from './autopilot/MhcWorkstationActivityHost';

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
  const { isDark } = useTheme();

  // Step state in the Autopilot setup flow - always starts at welcome screen
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');

  // Read-only review mode state
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);

  // Active activity observation note text input
  const [activeNoteText, setActiveNoteText] = useState<string>('');

  // Customer selection state
  const [customers] = useState<Customer[]>(() => StorageService.getCustomers());
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

  // Scroll locking and escape key handling for Review / Completion Modal or Discard Modal
  useEffect(() => {
    if (showReviewCompletionModal || Boolean(sessionToDiscard)) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (showReviewCompletionModal && !isConfirmingCompletion) {
            setShowReviewCompletionModal(false);
          } else if (sessionToDiscard && !isDiscarding) {
            setSessionToDiscard(null);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showReviewCompletionModal, sessionToDiscard, isConfirmingCompletion, isDiscarding]);

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
    setShowReviewCompletionModal(false);
    setIsConfirmingCompletion(false);
  };

  // Handler: Explicitly Complete MHC from modal
  const handleModalConfirmCompleteMhc = () => {
    if (!effectiveSession) return;
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
  }, [progress.currentActivityCode, progress.activityNotes]);

  // Handle Continue Latest Activity (One-Click from Welcome Screen)
  const handleContinueLatestActivity = () => {
    if (!latestResumableSession || !latestResumableMachine) return;

    setLocalSelectedMachine(latestResumableMachine);
    onSelectMachine(latestResumableMachine);

    if (latestResumableCustomer) {
      setSelectedCustomer(latestResumableCustomer);
    }

    const hydratedSession: MHCSession = {
      ...latestResumableSession,
      autopilotProgress: latestResumableSession.autopilotProgress || createDefaultAutopilotProgress()
    };
    onUpdateSession(hydratedSession);

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

  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            variants={createFadeSlideVariants({ direction: 'down', distance: 'micro', prefersReducedMotion: shouldReduceMotion })}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[var(--color-success)] text-slate-950 font-semibold text-xs shadow-xl flex items-center gap-2 border border-emerald-400 pointer-events-auto"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Autopilot Workstation Container */}
      <motion.div
        variants={createFadeSlideVariants({ direction: 'up', distance: 'component', prefersReducedMotion: shouldReduceMotion })}
        initial="hidden"
        animate="visible"
        className={`w-full max-w-7xl min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] my-auto rounded-xl border shadow-xl flex flex-col overflow-hidden ${
          isDark 
            ? 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)] shadow-2xl shadow-black/40' 
            : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)] shadow-lg shadow-slate-200/50'
        }`}
      >
        {/* Workstation Industrial Header */}
        <MhcWorkstationHeader
          currentStep={currentStep}
          effectiveSession={effectiveSession}
          selectedMachine={selectedMachine || localSelectedMachine}
          selectedCustomer={selectedCustomer}
          isReadOnlyMode={isReadOnlyMode}
          setIsReadOnlyMode={setIsReadOnlyMode}
          onSwitchMachine={() => setCurrentStep('machine')}
          onExitWorkstation={() => {
            if (onExitAutopilot) onExitAutopilot();
            else if (onNavigate) onNavigate('start_page');
            else if (onSwitchToCanvas) onSwitchToCanvas();
            else setCurrentStep('welcome');
          }}
          onDiscardSession={setSessionToDiscard}
          isDark={isDark}
        />

        {/* Workstation Body */}
        {currentStep !== 'session_active' ? (
          <MhcWorkstationSetupFlow
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            latestResumableSession={latestResumableSession}
            latestResumableMachine={latestResumableMachine}
            latestResumableCustomer={latestResumableCustomer}
            confirmingWelcomeComplete={confirmingWelcomeComplete}
            setConfirmingWelcomeComplete={setConfirmingWelcomeComplete}
            handleContinueLatestActivity={handleContinueLatestActivity}
            handleConfirmWelcomeComplete={handleConfirmWelcomeComplete}
            setSessionToDiscard={setSessionToDiscard}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            filteredCustomers={filteredCustomers}
            machines={machines}
            localSelectedMachine={localSelectedMachine}
            setLocalSelectedMachine={setLocalSelectedMachine}
            onSelectMachine={onSelectMachine}
            machineSearch={machineSearch}
            setMachineSearch={setMachineSearch}
            filteredMachines={filteredMachines}
            mhcSessions={mhcSessions}
            existingIncompleteSession={existingIncompleteSession}
            handleContinueExisting={handleContinueExisting}
            handleStartNew={handleStartNew}
            handleReviewProgress={handleReviewProgress}
            isDark={isDark}
          />
        ) : effectiveSession && localSelectedMachine ? (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Dominant Inspection Workspace Host */}
            <MhcWorkstationActivityHost
              effectiveSession={effectiveSession}
              localSelectedMachine={localSelectedMachine}
              selectedCustomer={selectedCustomer}
              isReadOnlyMode={isReadOnlyMode}
              setIsReadOnlyMode={setIsReadOnlyMode}
              progress={progress}
              readiness={readiness}
              activeNoteText={activeNoteText}
              setActiveNoteText={setActiveNoteText}
              onUpdateSession={onUpdateSession}
              onUpdateMachine={handleUpdateMachine}
              handleCompleteCurrentActivity={handleCompleteCurrentActivity}
              handleFlagCurrentNeedsReview={handleFlagCurrentNeedsReview}
              handleReopenActivity={handleReopenActivity}
              handleJumpToActivityCode={handleJumpToActivityCode}
              handleProceedToReportGeneration={handleProceedToReportGeneration}
              handleProceedToBuyoff={handleProceedToBuyoff}
              handlePdfGenerated={handlePdfGenerated}
              showNotification={showNotification}
              setCurrentStep={setCurrentStep}
              onSwitchToCanvas={onSwitchToCanvas}
              previousSession={previousSession}
              isDark={isDark}
            />

            {/* Supporting Schedule Navigator */}
            <MhcWorkstationNavigator
              progress={progress}
              readiness={readiness}
              onJumpToActivity={handleJumpToActivityCode}
              onDiscardSession={
                effectiveSession && effectiveSession.completionStatus !== 'COMPLETED'
                  ? () => setSessionToDiscard(effectiveSession)
                  : undefined
              }
              isDiscardVisible={effectiveSession && effectiveSession.completionStatus !== 'COMPLETED'}
              isDark={isDark}
            />
          </div>
        ) : null}
      </motion.div>

      {/* POST-PDF DOWNLOAD REVIEW & EXPLICIT COMPLETION MODAL */}
      <AnimatePresence>
        {showReviewCompletionModal && (
          <motion.div
            id="modal-mhc-review-completion-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTimings.quick }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowReviewCompletionModal(false);
                setIsConfirmingCompletion(false);
              }
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] overflow-y-auto"
          >
            <motion.div
              id="modal-mhc-review-completion-dialog"
              variants={createFadeSlideVariants({ direction: 'up', distance: 'component', prefersReducedMotion: shouldReduceMotion })}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full max-w-lg rounded-xl border shadow-xl p-5 space-y-4 ${
                isDark
                  ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]'
                  : 'bg-white border-slate-300 text-slate-900 shadow-slate-900/10'
              }`}
            >
              {/* Close Button */}
              <motion.button
                id="btn-modal-review-completion-close"
                whileTap={mechanicalPressConfig.subtleTap}
                onClick={() => {
                  setShowReviewCompletionModal(false);
                  setIsConfirmingCompletion(false);
                }}
                className="absolute top-3.5 right-3.5 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-workspace)] transition-colors cursor-pointer"
                title="Dismiss modal and return to workspace"
              >
                <X className="w-4 h-4" />
              </motion.button>

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
                  variants={createFadeSlideVariants({ direction: 'up', distance: 'subtle', prefersReducedMotion: shouldReduceMotion })}
                  initial="hidden"
                  animate="visible"
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
                    <motion.button
                      id="btn-modal-confirm-complete-yes"
                      whileTap={mechanicalPressConfig.subtleTap}
                      onClick={handleModalConfirmCompleteMhc}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Yes, Finalize &amp; Complete MHC</span>
                    </motion.button>
                    <motion.button
                      whileTap={mechanicalPressConfig.subtleTap}
                      onClick={() => setIsConfirmingCompletion(false)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] text-xs border border-[var(--border-default)] cursor-pointer"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              ) : null}

              {/* Primary Modal Action Buttons */}
              {!isConfirmingCompletion && (
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 font-mono">
                  <motion.button
                    id="btn-modal-review-report"
                    whileTap={mechanicalPressConfig.subtleTap}
                    onClick={handleModalReviewReport}
                    className="px-4 py-2 rounded-lg bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>REVIEW REPORT</span>
                  </motion.button>

                  <motion.button
                    id="btn-modal-complete-mhc"
                    whileTap={mechanicalPressConfig.tap}
                    onClick={() => setIsConfirmingCompletion(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>COMPLETE MHC</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCARD DRAFT SESSION CONFIRMATION MODAL */}
      <AnimatePresence>
        {sessionToDiscard && (
          <motion.div
            id="modal-mhc-discard-session-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTimings.quick }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDiscarding) {
                setSessionToDiscard(null);
              }
            }}
          >
            <motion.div
              id="modal-mhc-discard-session-dialog"
              variants={createFadeSlideVariants({ direction: 'up', distance: 'component', prefersReducedMotion: shouldReduceMotion })}
              initial="hidden"
              animate="visible"
              exit="exit"
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
                <motion.button
                  id="btn-cancel-discard-session"
                  type="button"
                  whileTap={mechanicalPressConfig.subtleTap}
                  disabled={isDiscarding}
                  onClick={() => setSessionToDiscard(null)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-secondary)]'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  Cancel
                </motion.button>

                <motion.button
                  id="btn-confirm-discard-session"
                  type="button"
                  whileTap={mechanicalPressConfig.tap}
                  disabled={isDiscarding}
                  onClick={handleConfirmDiscardSession}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDiscarding ? 'Discarding...' : 'Discard Session'}</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
