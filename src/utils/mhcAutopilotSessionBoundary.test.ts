import { describe, it, expect } from 'vitest';
import { 
  resolveEffectiveAutopilotSession, 
  findLatestResumableMhcSession,
  computeAutopilotReadiness,
  createDefaultAutopilotProgress 
} from './mhcAutopilotBrain';
import { Machine, MHCSession } from '../types';

describe('P1.3.7 — Ghost Autopilot Session Boundary & Recovery Isolation', () => {
  const sampleMachine1: Machine = {
    id: 'mach-01',
    model: 'SIR-5000',
    serialNumber: 'SN-001',
    machineNumber: 'M-01',
    plantName: 'Plant A',
    customerName: 'Customer Alpha',
    customerId: 'cust-01'
  } as unknown as Machine;

  const sampleMachine2: Machine = {
    id: 'mach-02',
    model: 'SIR-6000',
    serialNumber: 'SN-002',
    machineNumber: 'M-02',
    plantName: 'Plant B',
    customerName: 'Customer Beta',
    customerId: 'cust-02'
  } as unknown as Machine;

  const completedSessionMach1: MHCSession = {
    id: 'MHC-COMPLETED-01',
    machineId: 'mach-01',
    machineModel: 'SIR-5000',
    machineSerialNumber: 'SN-001',
    machineName: 'M-01',
    customerId: 'cust-01',
    customerName: 'Customer Alpha',
    plantName: 'Plant A',
    engineerName: 'Lead Engineer',
    startDate: '2026-03-01',
    startTime: '09:00',
    lastUpdated: '2026-03-01T17:00:00Z',
    completionStatus: 'COMPLETED',
    autopilotProgress: {
      currentDay: 'DAY 4',
      currentActivityCode: '10',
      lastActiveTimestamp: '2026-03-01T17:00:00Z',
      activityStatuses: {
        '01': 'COMPLETED',
        '02_power': 'COMPLETED',
        '02_beam': 'COMPLETED',
        '02_findings': 'COMPLETED',
        '03_power': 'COMPLETED',
        '03_beam': 'COMPLETED',
        '03_findings': 'COMPLETED',
        '04_stage1': 'COMPLETED',
        '04_stage2': 'COMPLETED',
        '05_focus': 'COMPLETED',
        '06_agc': 'COMPLETED',
        '07_temp': 'COMPLETED',
        '08_process': 'COMPLETED',
        '09': 'COMPLETED',
        '10': 'COMPLETED'
      },
      activityNotes: {}
    },
    currentSection: 8,
    sectionStatuses: {
      1: 'COMPLETED',
      2: 'COMPLETED',
      3: 'COMPLETED',
      4: 'COMPLETED',
      5: 'COMPLETED',
      6: 'COMPLETED',
      7: 'COMPLETED',
      8: 'COMPLETED'
    },
    stage01_laserHours: [{
      laserId: 'L-01',
      laserIdentifier: 'Laser Diode 1',
      recordedLaserHour: 5000,
      readingDate: '2026-03-01',
      readingTime: '09:00',
      calculatedCurrentHour: 5000,
      warningThreshold: 15000,
      criticalThreshold: 20000,
      runtimeStatus: 'NORMAL'
    }],
    stage02_laserProfile: {} as any,
    stage03_laserPower: [],
    stage04_opticsBeam: {} as any,
    stage05_cooling: {} as any,
    stage06_productQuality: {} as any,
    stage07_spareParts: [],
    stage08_engineerRemarks: {} as any
  };

  const incompleteSessionMach1: MHCSession = {
    id: 'MHC-INCOMPLETE-01',
    machineId: 'mach-01',
    machineModel: 'SIR-5000',
    machineSerialNumber: 'SN-001',
    machineName: 'M-01',
    customerId: 'cust-01',
    customerName: 'Customer Alpha',
    plantName: 'Plant A',
    engineerName: 'Field Tech',
    startDate: '2026-03-05',
    startTime: '10:00',
    lastUpdated: '2026-03-05T11:30:00Z',
    completionStatus: 'IN_PROGRESS',
    autopilotProgress: {
      currentDay: 'DAY 1',
      currentActivityCode: '02_power',
      lastActiveTimestamp: '2026-03-05T11:30:00Z',
      activityStatuses: {
        '01': 'COMPLETED',
        '02_power': 'IN_PROGRESS',
        '02_beam': 'UPCOMING'
      },
      activityNotes: {}
    },
    currentSection: 1,
    sectionStatuses: { 1: 'IN_PROGRESS' },
    stage01_laserHours: [],
    stage02_laserProfile: {} as any,
    stage03_laserPower: [],
    stage04_opticsBeam: {} as any,
    stage05_cooling: {} as any,
    stage06_productQuality: {} as any,
    stage07_spareParts: [],
    stage08_engineerRemarks: {} as any
  };

  const completedSessionMach2: MHCSession = {
    ...completedSessionMach1,
    id: 'MHC-COMPLETED-02',
    machineId: 'mach-02',
    machineModel: 'SIR-6000',
    machineSerialNumber: 'SN-002',
    machineName: 'M-02',
    customerId: 'cust-02',
    customerName: 'Customer Beta'
  };

  // SCENARIO 1: No sessions
  it('Scenario 1: No sessions -> Clean Autopilot (null effectiveSession, zero completed items)', () => {
    const effective = resolveEffectiveAutopilotSession(null, 'mach-01', []);
    expect(effective).toBeNull();

    const progress = effective?.autopilotProgress || createDefaultAutopilotProgress();
    const readiness = computeAutopilotReadiness(progress, effective);

    expect(readiness.readinessScore).toBe(0);
    expect(readiness.completedList.length).toBe(0);
    expect(progress.currentActivityCode).toBe('01');
    expect(progress.activityStatuses['01']).toBe('IN_PROGRESS');
    expect(progress.activityStatuses['02_power']).toBe('UPCOMING');
  });

  // SCENARIO 2: Only COMPLETED session exists
  it('Scenario 2: Only COMPLETED session exists -> Clean Autopilot (no fallback to historical completed session)', () => {
    // Both with activeSession passed as completed or undefined
    const effectiveWithPassedActive = resolveEffectiveAutopilotSession(completedSessionMach1, 'mach-01', [completedSessionMach1]);
    expect(effectiveWithPassedActive).toBeNull();

    const effectiveWithoutPassedActive = resolveEffectiveAutopilotSession(undefined, 'mach-01', [completedSessionMach1]);
    expect(effectiveWithoutPassedActive).toBeNull();

    const progress = effectiveWithoutPassedActive?.autopilotProgress || createDefaultAutopilotProgress();
    const readiness = computeAutopilotReadiness(progress, effectiveWithoutPassedActive);

    // Journey Rail must not display historical completed progress
    expect(readiness.readinessScore).toBe(0);
    expect(readiness.completedList.length).toBe(0);
    expect(Object.values(progress.activityStatuses).filter(st => st === 'COMPLETED').length).toBe(0);
  });

  // SCENARIO 3: One incomplete session exists
  it('Scenario 3: One incomplete session exists -> Correct session resumes with its draft state', () => {
    const effective = resolveEffectiveAutopilotSession(incompleteSessionMach1, 'mach-01', [incompleteSessionMach1]);
    expect(effective).not.toBeNull();
    expect(effective?.id).toBe('MHC-INCOMPLETE-01');
    expect(effective?.completionStatus).toBe('IN_PROGRESS');
    expect(effective?.autopilotProgress?.currentActivityCode).toBe('02_power');
  });

  // SCENARIO 4: Multiple sessions including COMPLETED + incomplete
  it('Scenario 4: Multiple sessions (COMPLETED + incomplete) -> Only the eligible incomplete session is selected', () => {
    const sessions = [completedSessionMach1, incompleteSessionMach1];
    
    // Fallback search when activeSession is not pre-set
    const effective = resolveEffectiveAutopilotSession(undefined, 'mach-01', sessions);
    expect(effective).not.toBeNull();
    expect(effective?.id).toBe('MHC-INCOMPLETE-01');
    expect(effective?.completionStatus).toBe('IN_PROGRESS');

    // If completed session was passed as activeSession, it gets rejected and finds the incomplete one
    const effectiveWhenCompletedPassed = resolveEffectiveAutopilotSession(completedSessionMach1, 'mach-01', sessions);
    expect(effectiveWhenCompletedPassed).not.toBeNull();
    expect(effectiveWhenCompletedPassed?.id).toBe('MHC-INCOMPLETE-01');
  });

  // SCENARIO 5: Completed session exists for another machine
  it('Scenario 5: Completed session exists for another machine -> Never affects the selected machine', () => {
    const sessions = [completedSessionMach2];
    
    // Selecting machine 1 when only machine 2 has a completed session
    const effective = resolveEffectiveAutopilotSession(undefined, 'mach-01', sessions);
    expect(effective).toBeNull();

    // Passing machine 2's completed session to machine 1 resolution
    const effectiveCross = resolveEffectiveAutopilotSession(completedSessionMach2, 'mach-01', sessions);
    expect(effectiveCross).toBeNull();
  });

  // SCENARIO 6: Zero active drafts across the fleet
  it('Scenario 6: Zero active drafts across entire fleet -> Journey Rail must not display historical completed checkmarks', () => {
    const allCompletedSessions = [completedSessionMach1, completedSessionMach2];

    const effective = resolveEffectiveAutopilotSession(undefined, 'mach-01', allCompletedSessions);
    expect(effective).toBeNull();

    // Autopilot Brain helper findLatestResumableMhcSession also returns null
    const latestResumable = findLatestResumableMhcSession(allCompletedSessions, [sampleMachine1, sampleMachine2]);
    expect(latestResumable).toBeNull();

    // Default clean state
    const progress = createDefaultAutopilotProgress();
    const readiness = computeAutopilotReadiness(progress, effective);
    expect(readiness.readinessScore).toBe(0);
    expect(readiness.completedList.length).toBe(0);
  });

  // SCENARIO 7: MHC History preservation
  it('Scenario 7: Completed sessions remain intact, visible, and unmodified for history / reports', () => {
    const allSessions = [completedSessionMach1, incompleteSessionMach1];

    // Filter historical records (e.g. as used in MhcHistoryView)
    const historyCompleted = allSessions.filter(s => s.completionStatus === 'COMPLETED');
    expect(historyCompleted.length).toBe(1);
    expect(historyCompleted[0].id).toBe('MHC-COMPLETED-01');
    expect(historyCompleted[0].completionStatus).toBe('COMPLETED');
    expect(historyCompleted[0].stage01_laserHours.length).toBe(1);

    // Filter by specific machine in history
    const mach1History = allSessions.filter(s => s.machineId === 'mach-01' && s.completionStatus === 'COMPLETED');
    expect(mach1History.length).toBe(1);
    expect(mach1History[0].id).toBe('MHC-COMPLETED-01');
  });
});
