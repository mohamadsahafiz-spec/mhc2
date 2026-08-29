import { describe, it, expect, vi } from 'vitest';
import {
  ACTIONABLE_ACTIVITIES,
  createDefaultAutopilotProgress,
  findLatestResumableMhcSession
} from './mhcAutopilotBrain';
import { createNewMhcSession } from '../components/mhc/MhcAutopilot';
import { Machine, MHCSession } from '../types';

describe('MHC Draft Session Discard & Removal Logic', () => {
  const sampleMachine: Machine = {
    id: 'mach-sir-5000',
    model: 'SIR-5000',
    serialNumber: 'SN-SIR5000-01',
    machineNumber: 'M-01',
    plantName: 'Plant Alpha',
    customerName: 'Customer Test',
    customerId: 'cust-test'
  } as unknown as Machine;

  const sampleMachine2: Machine = {
    id: 'mach-mc-2000',
    model: 'MC-2000',
    serialNumber: 'SN-MC2000-02',
    machineNumber: 'M-02',
    plantName: 'Plant Beta',
    customerName: 'Customer Test 2',
    customerId: 'cust-test-2'
  } as unknown as Machine;

  it('correctly creates an initial draft session', () => {
    const session = createNewMhcSession(sampleMachine, 'Customer Test', 'Engineer John');
    expect(session.id).toMatch(/^MHC-SESS-/);
    expect(session.completionStatus).toBe('IN_PROGRESS');
    expect(session.machineId).toBe('mach-sir-5000');
  });

  it('removes accidentally started empty draft session from sessions array', () => {
    const emptyDraft = createNewMhcSession(sampleMachine, 'Customer Test', 'Engineer John');
    let mhcSessions: MHCSession[] = [emptyDraft];

    expect(findLatestResumableMhcSession(mhcSessions, [sampleMachine])?.session.id).toBe(emptyDraft.id);

    // Discard draft logic: filter out target session ID
    const targetId = emptyDraft.id;
    mhcSessions = mhcSessions.filter(s => s.id !== targetId);

    expect(mhcSessions).toHaveLength(0);
    expect(findLatestResumableMhcSession(mhcSessions, [sampleMachine])).toBeNull();
  });

  it('safely discards a draft session while leaving completed historical sessions untouched', () => {
    const completedSession: MHCSession = {
      id: 'MHC-HISTORICAL-COMPLETED-01',
      machineId: sampleMachine.id,
      machineModel: sampleMachine.model,
      machineSerialNumber: sampleMachine.serialNumber,
      machineName: sampleMachine.machineNumber,
      customerId: sampleMachine.customerId,
      customerName: sampleMachine.customerName,
      plantName: sampleMachine.plantName,
      engineerName: 'Lead Engineer',
      startDate: '2026-01-15',
      startTime: '08:00',
      lastUpdated: '2026-01-15T10:00:00Z',
      completionStatus: 'COMPLETED',
      autopilotProgress: createDefaultAutopilotProgress(),
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

    const draftSession = createNewMhcSession(sampleMachine, 'Customer Test', 'Engineer John');
    let mhcSessions: MHCSession[] = [draftSession, completedSession];

    // Discard draft session
    const targetId = draftSession.id;
    mhcSessions = mhcSessions.filter(s => s.id !== targetId);

    expect(mhcSessions).toHaveLength(1);
    expect(mhcSessions[0].id).toBe('MHC-HISTORICAL-COMPLETED-01');
    expect(mhcSessions[0].completionStatus).toBe('COMPLETED');
    // Completed session should not be picked up by resume detection
    expect(findLatestResumableMhcSession(mhcSessions, [sampleMachine])).toBeNull();
  });

  it('protects completed sessions from accidental draft deletion filter', () => {
    const completedSession: MHCSession = {
      id: 'MHC-COMPLETED-LOCKED-01',
      machineId: sampleMachine.id,
      machineModel: sampleMachine.model,
      machineSerialNumber: sampleMachine.serialNumber,
      machineName: sampleMachine.machineNumber,
      customerId: sampleMachine.customerId,
      customerName: sampleMachine.customerName,
      plantName: sampleMachine.plantName,
      engineerName: 'Lead Engineer',
      startDate: '2026-01-15',
      startTime: '08:00',
      lastUpdated: '2026-01-15T10:00:00Z',
      completionStatus: 'COMPLETED',
      autopilotProgress: createDefaultAutopilotProgress(),
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

    // Deletion guard
    function safeDeleteDraft(sessions: MHCSession[], idToDelete: string): MHCSession[] {
      const target = sessions.find(s => s.id === idToDelete);
      if (!target || target.completionStatus === 'COMPLETED') {
        return sessions; // Protected: do not delete
      }
      return sessions.filter(s => s.id !== idToDelete);
    }

    const sessions = [completedSession];
    const result = safeDeleteDraft(sessions, 'MHC-COMPLETED-LOCKED-01');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('MHC-COMPLETED-LOCKED-01');
  });

  it('keeps other active machine draft sessions intact when discarding one machine draft', () => {
    const draftMachine1 = createNewMhcSession(sampleMachine, 'Customer Test', 'Engineer A');
    const draftMachine2 = createNewMhcSession(sampleMachine2, 'Customer Test 2', 'Engineer B');

    let mhcSessions = [draftMachine1, draftMachine2];

    // Discard draftMachine1
    mhcSessions = mhcSessions.filter(s => s.id !== draftMachine1.id);

    expect(mhcSessions).toHaveLength(1);
    expect(mhcSessions[0].id).toBe(draftMachine2.id);
    expect(mhcSessions[0].machineId).toBe('mach-mc-2000');

    // Resume detection now points to machine 2
    const resumable = findLatestResumableMhcSession(mhcSessions, [sampleMachine, sampleMachine2]);
    expect(resumable?.session.id).toBe(draftMachine2.id);
    expect(resumable?.machine.id).toBe('mach-mc-2000');
  });
});
