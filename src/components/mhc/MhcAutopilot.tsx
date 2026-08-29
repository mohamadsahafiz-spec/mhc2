import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  LogOut
} from 'lucide-react';
import { Customer, Machine, MHCSession, NavigationTab } from '../../types';
import { StorageService } from '../../utils/persistence';
import { useTheme } from '../../context/ThemeContext';
import {
  MHC_WORKFLOW_SCHEDULE,
  ACTIONABLE_ACTIVITIES,
  createDefaultAutopilotProgress,
  getParentActivityStatus,
  computeAutopilotReadiness,
  auditMhcSession,
  advanceAutopilotActivity,
  flagDownstreamNeedsReview,
  findLatestResumableMhcSession
} from '../../utils/mhcAutopilotBrain';
import { MhcLaserHoursActivity } from './autopilot/MhcLaserHoursActivity';
import { MhcLaserPowerActivity } from './autopilot/MhcLaserPowerActivity';
import { MhcLaserBeamActivity } from './autopilot/MhcLaserBeamActivity';
import { MhcLaserInspectionActivity } from './autopilot/MhcLaserInspectionActivity';
import { MhcStageCalibrationActivity } from './autopilot/MhcStageCalibrationActivity';
import { MhcAgcActivity } from './autopilot/MhcAgcActivity';
import { MhcTemperatureEvidenceActivity } from './autopilot/MhcTemperatureEvidenceActivity';
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
  onSwitchToCanvas: () => void;
  onExitAutopilot?: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  onUpdateMachine?: (machine: Machine) => void;
}

export type SetupStep = 'welcome' | 'customer' | 'machine' | 'session_check' | 'session_active';

export function createNewMhcSession(machine: Machine, customerName?: string, engineerName?: string): MHCSession {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  return {
    id: `MHC-SESS-${Date.now()}`,
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
    }
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
  onSwitchToCanvas,
  onExitAutopilot,
  onNavigate,
  onUpdateMachine
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Step state in the Autopilot setup flow
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

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
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
      try {
        window.open(generatedPdfBlobUrl, '_blank');
      } catch (err) {
        console.warn('Could not re-open PDF blob URL:', err);
      }
    }
    // Dismiss the modal so user can review the on-screen report or new tab without completing
    setShowReviewCompletionModal(false);
    setIsConfirmingCompletion(false);
  };

  // Handler: Explicitly Complete MHC from modal
  const handleModalConfirmCompleteMhc = () => {
    if (!effectiveSession) return;
    // Advance 08 to COMPLETED and 09 to COMPLETED
    const step1 = advanceAutopilotActivity(effectiveSession, '08', 'COMPLETED');
    const finalizedSession = advanceAutopilotActivity(step1, '09', 'COMPLETED', activeNoteText || 'Report reviewed and finalized after PDF generation');

    onUpdateSession(finalizedSession);
    setShowReviewCompletionModal(false);
    setIsConfirmingCompletion(false);
    showNotification("MHC Session successfully completed & signed off ✓");
  };

  // Sync state if selectedMachine changes externally
  useEffect(() => {
    if (selectedMachine && selectedMachine.id !== localSelectedMachine?.id) {
      setLocalSelectedMachine(selectedMachine);
      const match = customers.find(c => c.id === selectedMachine.customerId || c.name === selectedMachine.customerName);
      if (match) setSelectedCustomer(match);
    }
  }, [selectedMachine]);

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
    let target = activeSession;
    if (target && localSelectedMachine && target.machineId !== localSelectedMachine.id) {
      target = undefined;
    }
    if (!target && localSelectedMachine) {
      target = mhcSessions.find(s => s.machineId === localSelectedMachine.id && s.completionStatus !== 'COMPLETED') ||
               mhcSessions.find(s => s.machineId === localSelectedMachine.id);
    }
    if (!target) return null;
    if (!target.autopilotProgress) {
      return {
        ...target,
        autopilotProgress: createDefaultAutopilotProgress()
      };
    }
    return target;
  }, [activeSession, localSelectedMachine, mhcSessions]);

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

  // Proceed to Report Generation from Readiness Review
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
      '07': 'COMPLETED' as const,
      '08': 'IN_PROGRESS' as const
    };

    const updatedSession: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currProgress,
        activityStatuses: updatedStatuses,
        currentActivityCode: '08',
        currentDay: 'DAY 4',
        lastActiveTimestamp: new Date().toISOString()
      }
    };

    onUpdateSession(updatedSession);
    showNotification("MHC Session Readiness verified! Activity 08 Report Generation unlocked ✓");
  };

  // Proceed to Buyoff / Complete from Report Generation (Activity 08 -> 09)
  const handleProceedToBuyoff = () => {
    if (!effectiveSession) return;
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
    showNotification("Activity 08 Report Generation marked COMPLETED! Proceeding to 09 Buyoff / Complete ✓");
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
      subtext: `Day ${progress.currentDay.replace('DAY ', '')} — ${progress.currentActivityCode}`,
      status: currentStep === 'session_active' ? 'current' : 'upcoming'
    }
  ];

  const currentActionableItem = useMemo(() => {
    return ACTIONABLE_ACTIVITIES.find(a => a.code === progress.currentActivityCode) || ACTIONABLE_ACTIVITIES[0];
  }, [progress.currentActivityCode]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md flex items-start justify-center">
      
      {/* Toast Notification */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs shadow-xl flex items-center gap-2 border border-emerald-400"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Main Autopilot Container */}
      <div className={`w-full max-w-7xl min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] my-auto rounded-2xl border shadow-2xl flex flex-col md:flex-row ${
        isDark 
          ? 'bg-[#0f1319] border-slate-800 text-slate-100 shadow-cyan-950/20' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}>

        {/* LEFT COLUMN: MHC JOURNEY RAIL & SESSION BRAIN */}
        <div className={`w-full md:w-80 shrink-0 p-4 sm:p-5 border-b md:border-b-0 md:border-r flex flex-col justify-between ${
          isDark ? 'bg-[#0b0d11] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">
                    MHC Autopilot
                  </h2>
                  <p className="text-[11px] text-slate-400">Guided Engineering Journey</p>
                </div>
              </div>
            </div>

            {/* SETUP FLOW STEPS (JOURNEY RAIL) */}
            <div className="space-y-3 mb-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
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
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center gap-2.5 border ${
                        step.status === 'current'
                          ? isDark 
                            ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30' 
                            : 'bg-cyan-50 border-cyan-300 text-cyan-900 font-medium'
                          : step.status === 'completed'
                          ? isDark
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 cursor-pointer'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60 cursor-pointer'
                          : isDark
                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed'
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
                          <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 flex items-center justify-center text-[9px] animate-pulse">
                            ◉
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
                        <div className="text-[10px] text-slate-400 truncate">{step.subtext}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE WORKFLOW SCHEDULE ON RAIL (JOURNEY RAIL BRAIN) */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
                <span>WORKFLOW SCHEDULE</span>
                <span className="text-[9px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                  {readiness.readinessScore}% READY
                </span>
              </div>
              
              <div className="space-y-2.5">
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
                                ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200 ring-1 ring-cyan-500/40'
                                : actStatus === 'COMPLETED'
                                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/50 cursor-pointer'
                                : actStatus === 'NEEDS_REVIEW'
                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-950/50 cursor-pointer'
                                : actStatus === 'IN_PROGRESS'
                                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 cursor-pointer'
                                : 'bg-slate-900/30 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {/* Status indicator */}
                              <span className="font-mono text-[10px] font-bold">
                                {actStatus === 'COMPLETED' && <span className="text-emerald-400">✓</span>}
                                {actStatus === 'IN_PROGRESS' && <span className="text-cyan-400 animate-pulse">◉</span>}
                                {actStatus === 'NEEDS_REVIEW' && <span className="text-amber-400 font-bold">⚠</span>}
                                {actStatus === 'UPCOMING' && <span className="text-slate-400">○</span>}
                                {actStatus === 'LOCKED' && <span className="text-slate-600">🔒</span>}
                              </span>
                              <span className="font-mono text-[10px] text-cyan-400/90 font-bold">{dayGroup.code}</span>
                              <span className="truncate font-medium">{dayGroup.title}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">{dayGroup.day}</span>
                          </button>

                          {/* Sub items if present */}
                          {isParent && (
                            <div className="pl-4 space-y-1 pt-0.5 border-l border-slate-800 ml-2">
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
                                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                                        : subStatus === 'COMPLETED'
                                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300 hover:bg-emerald-900/40 cursor-pointer'
                                        : subStatus === 'NEEDS_REVIEW'
                                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:bg-amber-900/40 cursor-pointer'
                                        : subStatus === 'IN_PROGRESS'
                                        ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 cursor-pointer'
                                        : 'bg-slate-950/20 border-slate-800/40 text-slate-600 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-slate-600 font-bold">{isLast ? '└─' : '├─'}</span>
                                      <span className="truncate">{sub.title}</span>
                                    </div>
                                    <span className="shrink-0 font-bold">
                                      {subStatus === 'COMPLETED' && <span className="text-emerald-400">✓</span>}
                                      {subStatus === 'IN_PROGRESS' && <span className="text-cyan-400 animate-pulse">◉</span>}
                                      {subStatus === 'NEEDS_REVIEW' && <span className="text-amber-400">⚠</span>}
                                      {subStatus === 'UPCOMING' && <span className="text-slate-500">○</span>}
                                      {subStatus === 'LOCKED' && <span className="text-slate-700">🔒</span>}
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
          <div className="pt-4 border-t border-slate-800/80">
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
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                isDark 
                  ? 'bg-slate-900 hover:bg-rose-950/40 border-slate-700/80 hover:border-rose-700/80 text-slate-300 hover:text-rose-200' 
                  : 'bg-white hover:bg-rose-50 border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-800'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>EXIT AUTOPILOT</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: FOCUSED AUTOPILOT STEPS */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            
            {/* QUESTION STEP 1: WELCOME & OVERVIEW */}
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 my-auto"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive MHC Autopilot</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Let's build your Machine Health Check.
                  </h1>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                    Autopilot guides you step-by-step through account selection, machine selection, and session tracking across Days 1–4 without losing engineering data.
                  </p>
                </div>

                {/* FEATURE HIGHLIGHTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-xs text-cyan-300">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>Customer & Machine Passport</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Instant synchronization with customer accounts and machine passports.
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-xs text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Session Brain & Recovery</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Auto-detects active incomplete inspections and restores progress seamlessly.
                    </p>
                  </div>
                </div>

                {/* ONE-CLICK CONTINUE LAST ACTIVITY BANNER (IF RESUMABLE ACTIVITY EXISTS) */}
                {latestResumableSession && latestResumableMachine && (
                  <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                    isDark ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-cyan-50/70 border-cyan-300'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                          Resumable Activity Detected
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {latestResumableSession.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-100 dark:text-slate-100 flex items-center gap-2">
                          <span>{latestResumableMachine.model}</span>
                          <span className="text-xs font-normal text-slate-400">
                            ({latestResumableMachine.machineNumber || latestResumableMachine.serialNumber})
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {latestResumableCustomer?.name || latestResumableSession.customerName || latestResumableMachine.customerName || 'Customer'} • {latestResumableMachine.plantName} • {latestResumableSession.autopilotProgress?.currentDay || 'DAY 1'} — {latestResumableSession.autopilotProgress?.currentActivityCode || '01'}
                        </div>
                      </div>

                      <button
                        id="mhc-autopilot-continue-last-btn"
                        onClick={handleContinueLatestActivity}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Continue Last Activity</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PRIMARY ACTION */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-xs text-slate-500 font-mono">Step 1 of 4 • Welcome</span>
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      latestResumableSession
                        ? isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'
                    }`}
                  >
                    <span>{latestResumableSession ? 'Start New / Manual Setup' : 'Start Autopilot Setup'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SELECT CUSTOMER */}
            {currentStep === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Step 2 of 4 • Customer Account
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Which customer account are you servicing today?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select a Customer Passport account to view associated machine assets.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by customer name, industry, or contact..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* CUSTOMER SELECTION LIST */}
                <div className="space-y-2">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const custMachines = machines.filter(m => m.customerId === c.id || m.customerName === c.name);
                    const machineCount = custMachines.length;
                    const hasActiveSessions = custMachines.some(m => 
                      mhcSessions.some(s => s.machineId === m.id && s.completionStatus !== 'COMPLETED')
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
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30'
                            : isDark
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.industry} • {c.contactPerson}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono flex items-center gap-2">
                          {hasActiveSessions && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              <span>Active Job</span>
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {machineCount} Assets
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NEXT ACTION */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-800/60">
                  <button
                    onClick={() => setCurrentStep('welcome')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      Selected: <strong className="text-cyan-300">{selectedCustomer?.name || 'None'}</strong>
                    </span>
                    <button
                      disabled={!selectedCustomer}
                      onClick={() => setCurrentStep('machine')}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <span>Next: Select Machine</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SELECT MACHINE */}
            {currentStep === 'machine' && (
              <motion.div
                key="machine"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Step 3 of 4 • Target Machine
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Select target machine for {selectedCustomer?.name || 'Customer'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Choose the specific machine asset to inspect or continue an active Autopilot session.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    placeholder="Search by model, serial number, plant..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* MACHINE SELECTION LIST */}
                <div className="space-y-2">
                  {filteredMachines.map((m) => {
                    const isSelected = localSelectedMachine?.id === m.id;
                    const hasIncomplete = mhcSessions.some(s => s.machineId === m.id && s.completionStatus !== 'COMPLETED');
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setLocalSelectedMachine(m);
                          onSelectMachine(m);
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30'
                            : isDark
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{m.model}</div>
                            <div className="text-[10px] text-slate-400">
                              SN: {m.serialNumber} • Plant: {m.plantName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          {hasIncomplete ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              <span>Active Session</span>
                            </span>
                          ) : (
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              m.status === 'OPERATIONAL' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
                <div className="pt-3 flex items-center justify-between border-t border-slate-800/60">
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Back: Customers
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      Selected: <strong className="text-cyan-300">{localSelectedMachine?.model} ({localSelectedMachine?.serialNumber})</strong>
                    </span>
                    <button
                      disabled={!localSelectedMachine}
                      onClick={() => setCurrentStep('session_check')}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <span>Check Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SESSION RECOVERY & DETECTION FOR SELECTED MACHINE */}
            {currentStep === 'session_check' && (
              <motion.div
                key="session_check"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Step 4 of 4 • Session Detection
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Session Detection &amp; Brain Recovery
                  </h2>
                  <p className="text-xs text-slate-400">
                    Checking active inspection session history for {localSelectedMachine?.model} ({localSelectedMachine?.machineNumber || localSelectedMachine?.serialNumber}) — {selectedCustomer?.name || localSelectedMachine?.customerName}.
                  </p>
                </div>

                {/* IF INCOMPLETE SESSION EXISTS */}
                {existingIncompleteSession ? (
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-cyan-50/60 border-cyan-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-bold text-xs text-cyan-300 uppercase tracking-wider">Incomplete Session Found</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {existingIncompleteSession.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Start Date</div>
                        <div className="font-semibold text-slate-200">{existingIncompleteSession.startDate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Last Updated</div>
                        <div className="font-semibold text-slate-200">
                          {new Date(existingIncompleteSession.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Engineer</div>
                        <div className="font-semibold text-slate-200">{existingIncompleteSession.engineerName || 'Field Engineer'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Readiness</div>
                        <div className="font-semibold text-cyan-400">
                          {computeAutopilotReadiness(existingIncompleteSession.autopilotProgress).readinessScore}% Complete
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      An active inspection session was detected for this machine. You can continue the existing session without losing data or start a new clean session.
                    </p>

                    {/* ACTIONS */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleContinueExisting}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Continue Existing Session</span>
                      </button>

                      <button
                        onClick={handleStartNew}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Start New Session</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('machine')}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                          isDark 
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>Change Machine</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('customer')}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                          isDark 
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>Change Customer</span>
                      </button>

                      <button
                        onClick={handleReviewProgress}
                        className="px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 font-semibold transition-colors ml-auto flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Review Progress (Read-Only)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* IF NO INCOMPLETE SESSION FOUND */
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Clock className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-200">No Active Session Found for {localSelectedMachine?.model}</div>
                        <div className="text-[11px] text-slate-400">Ready to launch a new Machine Health Check session for this machine.</div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleStartNew}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Create &amp; Start New MHC Session</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('machine')}
                        className={`px-4 py-3 rounded-xl font-semibold text-xs border transition-all ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Select Other Machine</span>
                      </button>

                      <button
                        onClick={() => setCurrentStep('customer')}
                        className={`px-4 py-3 rounded-xl font-semibold text-xs border transition-all ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Change Customer Account</span>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                {/* TOP HEADER & READ-ONLY TOGGLE */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Autopilot Active</span>
                    </div>
                    {isReadOnlyMode && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>READ-ONLY MODE</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs font-mono text-slate-400 hidden md:inline">
                      ID: <strong className="text-slate-200">{effectiveSession?.id}</strong>
                    </span>
                    
                    <button
                      onClick={() => setCurrentStep('customer')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Switch Machine</span>
                    </button>

                    <button
                      onClick={() => setIsReadOnlyMode(!isReadOnlyMode)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border transition-all ${
                        isReadOnlyMode
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isReadOnlyMode ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Enable Editing</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Read-Only Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* MACHINE & CUSTOMER TITLE */}
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {localSelectedMachine.model} ({localSelectedMachine.machineNumber || localSelectedMachine.serialNumber})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Customer: <strong className="text-slate-200">{selectedCustomer?.name || localSelectedMachine.customerName}</strong> • Plant: <strong className="text-slate-200">{localSelectedMachine.plantName}</strong> • Start Date: <strong className="text-slate-200">{effectiveSession?.startDate}</strong>
                  </p>
                </div>

                {/* READ-ONLY BANNER IF ACTIVE */}
                {isReadOnlyMode && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Read-Only Review Mode:</strong> Viewing MHC progress without modifying session data.</span>
                    </div>
                    <button
                      onClick={() => setIsReadOnlyMode(false)}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-100 underline decoration-dotted shrink-0"
                    >
                      Switch to Editing
                    </button>
                  </div>
                )}

                {/* READINESS OVERVIEW BAR */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-400" />
                      <span>MHC Readiness Analysis</span>
                    </span>
                    <span className="font-mono text-cyan-400">{readiness.readinessScore}% Complete</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${readiness.readinessScore}%` }}
                    />
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                      <div className="text-[10px] text-emerald-400/80 font-mono">COMPLETED</div>
                      <div className="font-bold text-xs">{readiness.completedCount} / {readiness.totalCount}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300">
                      <div className="text-[10px] text-cyan-400/80 font-mono">CURRENT DAY</div>
                      <div className="font-bold text-xs">{progress.currentDay}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300">
                      <div className="text-[10px] text-amber-400/80 font-mono">NEEDS REVIEW</div>
                      <div className="font-bold text-xs">{readiness.needsReviewList.length} Items</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-300">
                      <div className="text-[10px] text-slate-400 font-mono">REPORT STATUS</div>
                      <div className="font-bold text-[10px] truncate">
                        {readiness.isReadyForReport ? (
                          <span className="text-emerald-400">✓ READY</span>
                        ) : (
                          <span className="text-amber-400">PENDING CORE</span>
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
                    onUpdateMachine={onUpdateMachine}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    onSwitchToCanvas={onSwitchToCanvas}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '07' || progress.currentActivityCode === '07_review') ? (
                  <MhcReadinessReviewActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isDark={isDark}
                    isReadOnly={isReadOnlyMode}
                    onNavigateToActivity={handleJumpToActivityCode}
                    onProceedToReportGeneration={handleProceedToReportGeneration}
                    onUpdateEngineerNote={(note) => handleUpdateNoteForActivity('07', note)}
                    onUpdateSession={onUpdateSession}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '08' || progress.currentActivityCode === '08_report') ? (
                  <MhcFullPdfRenderer
                    session={effectiveSession!}
                    previousSession={previousSession}
                    isDark={isDark}
                    onProceedToBuyoff={handleProceedToBuyoff}
                    onPdfGenerated={handlePdfGenerated}
                    onBackToAutopilot={() => handleJumpToActivityCode('07')}
                  />
                ) : (progress.currentActivityCode === '09' || progress.currentActivityCode === '09_buyoff') ? (
                  /* ACTIVITY 09: BUYOFF / COMPLETE FINALIZATION VIEW */
                  <div className={`p-5 rounded-2xl border space-y-5 ${
                    effectiveSession?.completionStatus === 'COMPLETED'
                      ? isDark ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50/70 border-emerald-300'
                      : isDark ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-cyan-50/60 border-cyan-200'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          effectiveSession?.completionStatus === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          DAY 4 • 09
                        </span>
                        <h3 className="font-bold text-base text-slate-100">
                          Buyoff &amp; Final MHC Session Acceptance
                        </h3>
                      </div>

                      {/* Status Pill */}
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border ${
                        effectiveSession?.completionStatus === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {effectiveSession?.completionStatus === 'COMPLETED' ? '✓ SESSION COMPLETED' : '◉ IN PROGRESS'}
                      </span>
                    </div>

                    {/* Summary / Confirmation Box */}
                    {effectiveSession?.completionStatus === 'COMPLETED' ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>MHC Inspection Successfully Finalized &amp; Signed Off</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          All 4 days of engineering inspection activities, optical measurements, calibration data, and Section 18 customer buyoff acceptance have been authoritatively completed.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-mono">STATUS</div>
                            <div className="font-bold text-emerald-400">COMPLETED</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-mono">READINESS SCORE</div>
                            <div className="font-bold text-cyan-400">100% Passed</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-mono">ENGINEER</div>
                            <div className="font-bold text-slate-200 truncate">{effectiveSession.engineerName || 'Field Engineer'}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-mono">COMPLETED AT</div>
                            <div className="font-bold text-slate-200 text-[11px] truncate">
                              {effectiveSession.lastUpdated ? new Date(effectiveSession.lastUpdated).toLocaleDateString() : 'Today'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                          <div className="text-xs font-bold text-slate-200">Final Verification Checklist:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>07 Readiness Review (Passed)</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>08 PDF Report Generated</span>
                            </div>
                            <div className="flex items-center gap-2 text-cyan-400">
                              <Award className="w-4 h-4 shrink-0" />
                              <span>09 Buyoff Ready for Sign-Off</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Observation / Buyoff Note Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 font-bold flex items-center justify-between">
                        <span>FINAL BUYOFF &amp; HANDOVER REMARKS</span>
                        <span className="text-[10px] text-slate-500">Persisted in Session Brain</span>
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
                                ['09']: e.target.value
                              }
                            };
                            onUpdateSession(updated);
                          }
                        }}
                        placeholder={isReadOnlyMode ? "Read-only mode active..." : "Enter final customer acceptance remarks or handover notes..."}
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                        }`}
                      />
                    </div>

                    {/* ACTION CONTROLS */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {effectiveSession?.completionStatus !== 'COMPLETED' ? (
                        !isReadOnlyMode ? (
                          <>
                            <button
                              id="btn-mhc-finalize-session"
                              onClick={() => handleCompleteCurrentActivity()}
                              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ring-2 ring-emerald-400/50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Complete MHC Session &amp; Finalize Buyoff ✓</span>
                            </button>

                            <button
                              onClick={() => handleJumpToActivityCode('08')}
                              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                            >
                              <span>← Review Report (08)</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-amber-300 font-mono flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>Action controls locked in Read-Only mode. Toggle "Enable Editing" above to modify.</span>
                          </div>
                        )
                      ) : (
                        <>
                          <button
                            onClick={() => handleJumpToActivityCode('08')}
                            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Full MHC Report (08)</span>
                          </button>

                          <button
                            onClick={() => setCurrentStep('welcome')}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                          >
                            <span>Return to Autopilot Setup</span>
                          </button>

                          {!isReadOnlyMode && (
                            <button
                              onClick={() => handleReopenActivity('09')}
                              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono font-semibold border border-slate-800 ml-auto"
                            >
                              Re-open Buyoff Activity
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-cyan-50/60 border-cyan-200'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {currentActionableItem.day} • {currentActionableItem.code}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-100">
                          {currentActionableItem.title}
                        </h3>
                      </div>

                      {/* Status Pill */}
                      {(() => {
                        const st = progress.activityStatuses[currentActionableItem.code] || 'IN_PROGRESS';
                        return (
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border ${
                            st === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : st === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
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
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 font-bold flex items-center justify-between">
                        <span>ENGINEER OBSERVATION NOTES</span>
                        <span className="text-[10px] text-slate-500">Persisted in Session Brain</span>
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
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                        }`}
                      />
                    </div>

                    {/* ACTION CONTROLS */}
                    {!isReadOnlyMode ? (
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => handleCompleteCurrentActivity()}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Complete & Advance</span>
                        </button>

                        <button
                          onClick={() => handleFlagCurrentNeedsReview()}
                          className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 transition-all"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Flag for Review</span>
                        </button>

                        {progress.activityStatuses[currentActionableItem.code] === 'COMPLETED' && (
                          <button
                            onClick={() => handleReopenActivity(currentActionableItem.code)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold border border-slate-700"
                          >
                            Re-open Activity
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-amber-300 font-mono flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Action controls locked in Read-Only mode. Toggle "Enable Editing" above to modify.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTTOM FOOTER ACTIONS */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Change Machine or Customer
                  </button>

                  <button
                    onClick={onSwitchToCanvas}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open Full Canvas / Workspace</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* POST-PDF DOWNLOAD REVIEW & EXPLICIT COMPLETION MODAL */}
      <AnimatePresence>
        {showReviewCompletionModal && (
          <div
            id="modal-mhc-review-completion-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
          >
            <motion.div
              id="modal-mhc-review-completion-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 ${
                isDark
                  ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-cyan-950/40'
                  : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-900/20'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    PDF EXPORT GENERATED
                  </span>
                  <h3 className="text-lg font-bold text-slate-100">
                    MHC Report Ready for Review
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The official MHC Report PDF has been compiled and downloaded. Please review the generated document before finalizing and closing out this MHC session.
                  </p>
                </div>
              </div>

              {/* Information / Status Box */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">CURRENT SESSION STATUS:</span>
                  <span className="font-bold text-amber-400">IN_PROGRESS (Pending User Sign-Off)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">EQUIPMENT / SERIAL:</span>
                  <span className="text-slate-200 font-semibold">{effectiveSession?.machineModel} • {effectiveSession?.machineSerialNumber}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">CUSTOMER FACILITY:</span>
                  <span className="text-slate-200 font-semibold">{effectiveSession?.customerName} ({effectiveSession?.plantName})</span>
                </div>
              </div>

              {/* Explicit Confirmation Step if User clicks Complete MHC */}
              {isConfirmingCompletion ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Confirm Authoritative Session Completion</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Completing this MHC will finalize Activity 09 Buyoff, set status to <strong className="text-emerald-400">COMPLETED</strong>, and archive the active session. All inspection records, logs, and historical passport data will remain permanently safely stored.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn-modal-confirm-complete-yes"
                      onClick={handleModalConfirmCompleteMhc}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yes, Finalize &amp; Complete MHC</span>
                    </button>
                    <button
                      onClick={() => setIsConfirmingCompletion(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : null}

              {/* Primary Modal Action Buttons */}
              {!isConfirmingCompletion && (
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    id="btn-modal-review-report"
                    onClick={handleModalReviewReport}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>REVIEW REPORT</span>
                  </button>

                  <button
                    id="btn-modal-complete-mhc"
                    onClick={() => setIsConfirmingCompletion(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ring-2 ring-emerald-400/50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>COMPLETE MHC</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
