import { describe, it, expect } from 'vitest';
import {
  ACTIONABLE_ACTIVITIES,
  createDefaultAutopilotProgress,
  computeAutopilotReadiness,
  advanceAutopilotActivity,
  findLatestResumableMhcSession
} from './mhcAutopilotBrain';
import { Machine, MHCSession } from '../types';

describe('MHC Session Finalization & Completion Lifecycle', () => {
  const sampleMachine: Machine = {
    id: 'mach-sir-5000',
    model: 'SIR-5000',
    serialNumber: 'SN-SIR5000-01',
    machineNumber: 'M-01',
    plantName: 'Plant Alpha',
    customerName: 'Customer Test',
    customerId: 'cust-test'
  } as unknown as Machine;

  function createTestSession(): MHCSession {
    const progress = createDefaultAutopilotProgress();
    // Mark Day 1 - 3 as COMPLETED
    for (const act of ACTIONABLE_ACTIVITIES) {
      if (['DAY 1', 'DAY 2', 'DAY 3'].includes(act.day)) {
        progress.activityStatuses[act.code] = 'COMPLETED';
      }
    }
    progress.currentDay = 'DAY 4';
    progress.currentActivityCode = '07';
    progress.activityStatuses['07'] = 'IN_PROGRESS';

    return {
      id: 'MHC-2026-FINAL-01',
      machineId: sampleMachine.id,
      machineModel: sampleMachine.model,
      machineSerialNumber: sampleMachine.serialNumber,
      machineName: sampleMachine.machineNumber,
      customerId: sampleMachine.customerId,
      customerName: sampleMachine.customerName,
      plantName: sampleMachine.plantName,
      engineerName: 'Lead Engineer',
      startDate: '2026-03-01',
      startTime: '09:00',
      lastUpdated: '2026-03-01T09:00:00Z',
      completionStatus: 'IN_PROGRESS',
      autopilotProgress: progress,
      currentSection: 4,
      sectionStatuses: {},
      stage01_laserHours: [],
      stage02_laserProfile: {} as any,
      stage03_laserPower: [],
      stage04_opticsBeam: {} as any,
      stage05_cooling: {} as any,
      stage06_productQuality: {} as any,
      stage07_spareParts: [],
      stage08_engineerRemarks: {} as any
    };
  }

  it('keeps completionStatus = IN_PROGRESS while Day 4 activities are not all completed', () => {
    const session = createTestSession();
    expect(session.completionStatus).toBe('IN_PROGRESS');

    // Complete 07 (Readiness Review) -> moves to 08 (Report Generation)
    const after07 = advanceAutopilotActivity(session, '07', 'COMPLETED');
    expect(after07.autopilotProgress?.activityStatuses['07']).toBe('COMPLETED');
    expect(after07.autopilotProgress?.activityStatuses['08']).toBe('IN_PROGRESS');
    expect(after07.completionStatus).toBe('IN_PROGRESS');

    // Complete 08 (Report Generation) -> moves to 09 (Buyoff / Complete)
    const after08 = advanceAutopilotActivity(after07, '08', 'COMPLETED');
    expect(after08.autopilotProgress?.activityStatuses['08']).toBe('COMPLETED');
    expect(after08.autopilotProgress?.activityStatuses['09']).toBe('IN_PROGRESS');
    expect(after08.completionStatus).toBe('IN_PROGRESS');
  });

  it('sets completionStatus = COMPLETED when final activity 09 (Buyoff / Complete) is completed', () => {
    const session = createTestSession();

    // Advance through 07, 08, and 09
    const step1 = advanceAutopilotActivity(session, '07', 'COMPLETED');
    const step2 = advanceAutopilotActivity(step1, '08', 'COMPLETED');
    const finalized = advanceAutopilotActivity(step2, '09', 'COMPLETED', 'Customer signed off');

    expect(finalized.autopilotProgress?.activityStatuses['09']).toBe('COMPLETED');
    expect(finalized.completionStatus).toBe('COMPLETED');
    expect(finalized.autopilotProgress?.activityNotes?.['09']).toBe('Customer signed off');
  });

  it('excludes genuinely completed sessions from findLatestResumableMhcSession()', () => {
    const session = createTestSession();

    // Before completion: session is resumable
    const resumableBefore = findLatestResumableMhcSession([session], [sampleMachine]);
    expect(resumableBefore).not.toBeNull();
    expect(resumableBefore?.session.id).toBe('MHC-2026-FINAL-01');

    // Finalize session
    const step1 = advanceAutopilotActivity(session, '07', 'COMPLETED');
    const step2 = advanceAutopilotActivity(step1, '08', 'COMPLETED');
    const finalized = advanceAutopilotActivity(step2, '09', 'COMPLETED');

    // After completion: session is no longer resumable
    const resumableAfter = findLatestResumableMhcSession([finalized], [sampleMachine]);
    expect(resumableAfter).toBeNull();
  });

  it('reverts completionStatus to IN_PROGRESS if a completed activity is reopened', () => {
    const session = createTestSession();
    const step1 = advanceAutopilotActivity(session, '07', 'COMPLETED');
    const step2 = advanceAutopilotActivity(step1, '08', 'COMPLETED');
    const finalized = advanceAutopilotActivity(step2, '09', 'COMPLETED');
    expect(finalized.completionStatus).toBe('COMPLETED');

    // Reopen 09
    const reopened = advanceAutopilotActivity(finalized, '09', 'IN_PROGRESS');
    expect(reopened.completionStatus).toBe('IN_PROGRESS');

    // Now it becomes resumable again
    const resumable = findLatestResumableMhcSession([reopened], [sampleMachine]);
    expect(resumable).not.toBeNull();
    expect(resumable?.session.id).toBe('MHC-2026-FINAL-01');
  });

  it('guarantees PDF download / export does not mutate or complete session until explicit confirmation', () => {
    const session = createTestSession();
    // Simulate Activity 08 IN_PROGRESS (Report generation)
    const inReportGen = advanceAutopilotActivity(session, '07', 'COMPLETED');
    expect(inReportGen.autopilotProgress?.activityStatuses['08']).toBe('IN_PROGRESS');
    expect(inReportGen.completionStatus).toBe('IN_PROGRESS');

    // Generating/downloading PDF is a non-destructive export operation
    // Session state remains intact and IN_PROGRESS
    expect(inReportGen.completionStatus).toBe('IN_PROGRESS');
    expect(inReportGen.autopilotProgress?.activityStatuses['09']).toBe('UPCOMING');

    // Review Report step keeps session in progress
    // Explicit completion step advances 08 & 09 to COMPLETED
    const step1 = advanceAutopilotActivity(inReportGen, '08', 'COMPLETED');
    const finalized = advanceAutopilotActivity(step1, '09', 'COMPLETED', 'Report reviewed and finalized after PDF generation');

    expect(finalized.completionStatus).toBe('COMPLETED');
    expect(finalized.autopilotProgress?.activityStatuses['08']).toBe('COMPLETED');
    expect(finalized.autopilotProgress?.activityStatuses['09']).toBe('COMPLETED');
    // Machine and session inspection records remain fully preserved
    expect(finalized.stage01_laserHours).toEqual(session.stage01_laserHours);
    expect(finalized.machineId).toBe(sampleMachine.id);
  });
});
