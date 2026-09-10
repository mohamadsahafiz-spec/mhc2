import { describe, it, expect } from 'vitest';
import { 
  hasMeaningfulMhcProgress, 
  resolveEffectiveAutopilotSession, 
  findLatestResumableMhcSession 
} from './mhcAutopilotBrain';
import { createNewMhcSession } from '../components/mhc/MhcAutopilot';
import { Machine } from '../types';

describe('FSOS Step 6B: MHC Active Session Indicator & Meaningful Progress Determination', () => {
  const mockMachineA: Machine = {
    id: 'MACH-001',
    model: 'EO DrillMaster 5000',
    serialNumber: 'SN-DM5000-001',
    machineNumber: 'MC-01',
    customerName: 'Advanced Semiconductor Inc',
    customerId: 'CUST-001',
    plantId: 'PLANT-001',
    plantName: 'Cleanroom Fab 1',
    productionLineId: 'LINE-001',
    productionLineName: 'Line 1',
    status: 'OPERATIONAL',
    lastMhcDate: '2026-08-01',
    nextMhcDate: '2026-11-01',
    installationDate: '2025-01-01',
    baselineDate: '2025-01-15',
    healthScore: 98,
    photos: [],
    consumables: [],
    laserHeads: [
      {
        id: 'lh1',
        model: 'Coherent Avia 355-14',
        serialNumber: 'SN-LH1-001',
        runningHours: 1200,
        maxRecommendedHours: 10000,
        remainingHours: 8800,
        estimatedReplacementDate: '2027-01-01',
        powerOutputWatts: 14,
        ratedPowerWatts: 14,
        wavelengthNm: 355,
        beamQualityM2: 1.1,
        healthScore: 99
      },
      {
        id: 'lh2',
        model: 'Coherent Avia 355-14',
        serialNumber: 'SN-LH2-002',
        runningHours: 1200,
        maxRecommendedHours: 10000,
        remainingHours: 8800,
        estimatedReplacementDate: '2027-01-01',
        powerOutputWatts: 14,
        ratedPowerWatts: 14,
        wavelengthNm: 355,
        beamQualityM2: 1.1,
        healthScore: 99
      }
    ]
  };

  const mockMachineB: Machine = {
    id: 'MACH-002',
    model: 'EO DrillMaster 3000',
    serialNumber: 'SN-DM3000-002',
    machineNumber: 'MC-02',
    customerName: 'Advanced Semiconductor Inc',
    customerId: 'CUST-001',
    plantId: 'PLANT-001',
    plantName: 'Cleanroom Fab 1',
    productionLineId: 'LINE-002',
    productionLineName: 'Line 2',
    status: 'OPERATIONAL',
    lastMhcDate: '2026-08-05',
    nextMhcDate: '2026-11-05',
    installationDate: '2025-02-01',
    baselineDate: '2025-02-15',
    healthScore: 95,
    photos: [],
    consumables: [],
    laserHeads: [
      {
        id: 'lh1',
        model: 'Trumpf TruMicro',
        serialNumber: 'SN-TR-001',
        runningHours: 800,
        maxRecommendedHours: 10000,
        remainingHours: 9200,
        estimatedReplacementDate: '2027-06-01',
        powerOutputWatts: 20,
        ratedPowerWatts: 20,
        wavelengthNm: 532,
        beamQualityM2: 1.2,
        healthScore: 97
      }
    ]
  };

  it('1. Fresh Session: newly initialized IN_PROGRESS session with 0 inspection data does NOT show Active Session', () => {
    const freshSession = createNewMhcSession(mockMachineA, 'Advanced Semiconductor Inc', 'Field Engineer Lead');

    expect(freshSession.completionStatus).toBe('IN_PROGRESS');
    expect(freshSession.autopilotProgress?.readinessScore).toBe(0);
    expect(freshSession.stage01_laserHours).toHaveLength(0);
    expect(freshSession.stage03_laserPower).toHaveLength(0);
    
    // Core test: hasMeaningfulMhcProgress must return false
    expect(hasMeaningfulMhcProgress(freshSession)).toBe(false);
  });

  it('2. Meaningful Progress: IN_PROGRESS session with recorded inspection data or activity progress DOES show Active Session', () => {
    const sessionWithLaserHours = createNewMhcSession(mockMachineA);
    sessionWithLaserHours.stage01_laserHours = [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        recordedLaserHour: 1540,
        readingDate: '2026-09-10',
        readingTime: '10:00',
        calculatedCurrentHour: 1540,
        warningThreshold: 8000,
        criticalThreshold: 10000,
        runtimeStatus: 'NORMAL',
        verifiedHour: 1540
      }
    ];
    expect(hasMeaningfulMhcProgress(sessionWithLaserHours)).toBe(true);

    const sessionWithCompletedActivity = createNewMhcSession(mockMachineA);
    if (sessionWithCompletedActivity.autopilotProgress) {
      sessionWithCompletedActivity.autopilotProgress.activityStatuses['01'] = 'COMPLETED';
      sessionWithCompletedActivity.autopilotProgress.readinessScore = 8;
    }
    expect(hasMeaningfulMhcProgress(sessionWithCompletedActivity)).toBe(true);

    const sessionWithInspectionFindings = createNewMhcSession(mockMachineA);
    sessionWithInspectionFindings.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: []
      }
    };
    expect(hasMeaningfulMhcProgress(sessionWithInspectionFindings)).toBe(true);

    const sessionWithEngineerRemarks = createNewMhcSession(mockMachineA);
    sessionWithEngineerRemarks.stage08_engineerRemarks = {
      generalFindings: 'Optical bench aligned within nominal tolerances.',
      observedIssues: '',
      correctiveActions: '',
      recommendations: '',
      followUpRequired: false,
      productionReleaseVerdict: 'APPROVED'
    };
    expect(hasMeaningfulMhcProgress(sessionWithEngineerRemarks)).toBe(true);
  });

  it('3. Completed Session: COMPLETED session does NOT show Active Session badge', () => {
    const completedSession = createNewMhcSession(mockMachineA);
    completedSession.completionStatus = 'COMPLETED';
    completedSession.stage01_laserHours = [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        recordedLaserHour: 2000,
        readingDate: '2026-09-10',
        readingTime: '10:00',
        calculatedCurrentHour: 2000,
        warningThreshold: 8000,
        criticalThreshold: 10000,
        runtimeStatus: 'NORMAL',
        verifiedHour: 2000
      }
    ];
    if (completedSession.autopilotProgress) {
      completedSession.autopilotProgress.readinessScore = 100;
    }

    expect(hasMeaningfulMhcProgress(completedSession)).toBe(false);
  });

  it('4. Resume Preservation: Fresh empty session remains discoverable and resumable by Autopilot resolution engines', () => {
    const freshSession = createNewMhcSession(mockMachineA);
    const sessions = [freshSession];

    // resolveEffectiveAutopilotSession still resolves the in-progress draft for the machine
    const resolved = resolveEffectiveAutopilotSession(null, mockMachineA.id, sessions);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe(freshSession.id);
    expect(resolved?.machineId).toBe(mockMachineA.id);

    // findLatestResumableMhcSession still identifies the draft across the fleet
    const latestResumable = findLatestResumableMhcSession(sessions, [mockMachineA, mockMachineB]);
    expect(latestResumable).not.toBeNull();
    expect(latestResumable?.session.id).toBe(freshSession.id);
    expect(latestResumable?.machine.id).toBe(mockMachineA.id);
  });

  it('5. Machine Isolation: Meaningful progress on Machine A does NOT activate Active Session badge on Machine B', () => {
    const sessionMachineA = createNewMhcSession(mockMachineA);
    sessionMachineA.stage01_laserHours = [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        recordedLaserHour: 1200,
        readingDate: '2026-09-10',
        readingTime: '10:00',
        calculatedCurrentHour: 1200,
        warningThreshold: 8000,
        criticalThreshold: 10000,
        runtimeStatus: 'NORMAL',
        verifiedHour: 1200
      }
    ];

    const freshSessionMachineB = createNewMhcSession(mockMachineB);

    const allSessions = [sessionMachineA, freshSessionMachineB];

    // Machine A has active session
    const machineAHasActive = allSessions.some(
      s => s.machineId === mockMachineA.id && hasMeaningfulMhcProgress(s)
    );
    expect(machineAHasActive).toBe(true);

    // Machine B does NOT have active session
    const machineBHasActive = allSessions.some(
      s => s.machineId === mockMachineB.id && hasMeaningfulMhcProgress(s)
    );
    expect(machineBHasActive).toBe(false);
  });
});
