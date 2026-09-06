import { describe, it, expect } from 'vitest';
import { reconcileMhcSessionIdentities } from './mhcIdentityReconciler';
import { MHCSession, Machine } from '../types';

describe('mhcIdentityReconciler', () => {
  const activeMachines: Machine[] = [
    {
      id: 'WD-44367',
      machineNo: 'WLVIA#3',
      machineNumber: 'WLVIA#3',
      machineName: 'Wafer Driller BMD302W',
      model: 'BMD302W',
      serialNo: 'SN-44367',
      manufacturer: 'EO Technics',
      customerId: 'cust-cleanroom-01',
      customerName: 'Cleanroom Alpha',
      plantName: 'Fab 1',
      status: 'OPERATIONAL',
      lasers: []
    } as unknown as Machine,
    {
      id: 'WD-19926',
      machineNo: 'WLVIA#1',
      machineNumber: 'WLVIA#1',
      machineName: 'Wafer Driller WLVIA',
      model: 'WLVIA',
      serialNo: 'SN-19926',
      manufacturer: 'EO Technics',
      customerId: 'cust-cleanroom-01',
      customerName: 'Cleanroom Alpha',
      plantName: 'Fab 1',
      status: 'OPERATIONAL',
      lasers: []
    } as unknown as Machine,
    {
      id: 'WD-81810',
      machineNo: 'BMD-81810',
      machineNumber: 'BMD-81810',
      machineName: 'Wafer Scribe',
      model: 'BMD101S',
      serialNo: 'SN-81810',
      manufacturer: 'EO Technics',
      customerId: 'cust-cleanroom-02',
      customerName: 'Beta Tech',
      plantName: 'Fab 2',
      status: 'OPERATIONAL',
      lasers: []
    } as unknown as Machine
  ];

  const sampleOrphanedSession: MHCSession = {
    id: 'MHC-2026-08-30-001',
    machineId: 'mach-legacy-44367', // Stale pre-import ID
    machineModel: 'BMD302W',
    machineSerialNumber: 'SN-44367', // Deterministic match for WD-44367
    machineName: 'WLVIA#3',
    customerId: 'cust-cleanroom-01',
    customerName: 'Cleanroom Alpha',
    plantName: 'Fab 1',
    engineerName: 'Sahafiz',
    startDate: '2026-08-30',
    startTime: '09:00',
    lastUpdated: '2026-08-30T10:30:00.000Z',
    completionStatus: 'IN_PROGRESS',
    currentSection: 3,
    sectionStatuses: {
      stage01_laserHours: 'COMPLETED',
      stage02_laserProfile: 'COMPLETED',
      stage03_laserPower: 'IN_PROGRESS'
    },
    autopilotProgress: {
      currentActivityCode: 'LASER_POWER',
      completedActivityCodes: ['LASER_HOURS', 'OPTICS_BEAM'],
      dispositions: {
        LASER_HOURS: 'PASS',
        OPTICS_BEAM: 'PASS'
      }
    } as any,
    stage01_laserHours: [],
    stage02_laserProfile: {} as any,
    stage03_laserPower: [],
    stage04_opticsBeam: {
      evidences: [
        {
          id: 'ev-1',
          caption: 'Beam Profile 1',
          url: 'idb:MHC-2026-08-30-001:beam-1',
          timestamp: '2026-08-30T09:15:00.000Z'
        }
      ]
    } as any,
    stage05_cooling: {} as any,
    stage06_productQuality: {} as any,
    stage07_spareParts: [],
    stage08_engineerRemarks: {} as any
  };

  it('1. Re-links orphaned session to correct active machine via Serial Number match', () => {
    const result = reconcileMhcSessionIdentities([sampleOrphanedSession], activeMachines);

    expect(result.modified).toBe(true);
    expect(result.report.relinkedCount).toBe(1);
    expect(result.report.alreadyCorrectCount).toBe(0);
    expect(result.report.mappings).toHaveLength(1);
    expect(result.report.mappings[0]).toEqual({
      oldMachineId: 'mach-legacy-44367',
      newMachineId: 'WD-44367',
      machineDisplayName: 'WLVIA#3',
      matchedBy: 'SERIAL_NUMBER_MATCH',
      sessionIds: ['MHC-2026-08-30-001'],
      sessionCount: 1
    });

    const relinked = result.sessions[0];
    expect(relinked.machineId).toBe('WD-44367');
    // Content and evidence references preserved
    expect(relinked.id).toBe('MHC-2026-08-30-001');
    expect(relinked.autopilotProgress?.currentActivityCode).toBe('LASER_POWER');
    expect((relinked.stage04_opticsBeam as any).evidences?.[0].url).toBe('idb:MHC-2026-08-30-001:beam-1');
  });

  it('2. Preserves already-correct sessions without modifying them', () => {
    const correctSession: MHCSession = {
      ...sampleOrphanedSession,
      id: 'MHC-CORRECT-001',
      machineId: 'WD-44367'
    };

    const result = reconcileMhcSessionIdentities([correctSession], activeMachines);

    expect(result.modified).toBe(false);
    expect(result.report.alreadyCorrectCount).toBe(1);
    expect(result.report.relinkedCount).toBe(0);
    expect(result.report.mappings).toHaveLength(0);
    expect(result.sessions[0].machineId).toBe('WD-44367');
  });

  it('3. Re-links via Machine ID normalization match (e.g. mach-WD-19926)', () => {
    const sessionWithIdPattern: MHCSession = {
      ...sampleOrphanedSession,
      id: 'MHC-NORM-002',
      machineId: 'mach-WD-19926',
      machineSerialNumber: '', // Empty serial to test level 2
      machineName: 'General Unit'
    };

    const result = reconcileMhcSessionIdentities([sessionWithIdPattern], activeMachines);

    expect(result.modified).toBe(true);
    expect(result.report.relinkedCount).toBe(1);
    expect(result.sessions[0].machineId).toBe('WD-19926');
    expect(result.report.mappings[0].matchedBy).toBe('MACHINE_ID_NORMALIZED_MATCH');
  });

  it('4. Re-links via Machine Name/Number match (e.g. BMD-81810)', () => {
    const sessionWithName: MHCSession = {
      ...sampleOrphanedSession,
      id: 'MHC-NAME-003',
      machineId: 'old-random-id-999',
      machineSerialNumber: '',
      machineName: 'BMD-81810'
    };

    const result = reconcileMhcSessionIdentities([sessionWithName], activeMachines);

    expect(result.modified).toBe(true);
    expect(result.report.relinkedCount).toBe(1);
    expect(result.sessions[0].machineId).toBe('WD-81810');
    expect(result.report.mappings[0].matchedBy).toBe('MACHINE_NAME_MATCH');
  });

  it('5. Re-links multiple sessions under same old ID and groups them in mapping report', () => {
    const session1: MHCSession = {
      ...sampleOrphanedSession,
      id: 'MHC-SESS-1',
      machineId: 'old-mch-44367',
      machineSerialNumber: 'SN-44367'
    };
    const session2: MHCSession = {
      ...sampleOrphanedSession,
      id: 'MHC-SESS-2',
      machineId: 'old-mch-44367',
      machineSerialNumber: 'SN-44367'
    };

    const result = reconcileMhcSessionIdentities([session1, session2], activeMachines);

    expect(result.modified).toBe(true);
    expect(result.report.relinkedCount).toBe(2);
    expect(result.report.mappings).toHaveLength(1);
    expect(result.report.mappings[0].sessionCount).toBe(2);
    expect(result.report.mappings[0].sessionIds).toEqual(['MHC-SESS-1', 'MHC-SESS-2']);
    expect(result.sessions[0].machineId).toBe('WD-44367');
    expect(result.sessions[1].machineId).toBe('WD-44367');
  });

  it('6. Does not guess when ambiguity exists between multiple active machines', () => {
    const duplicateSerialFleet: Machine[] = [
      ...activeMachines,
      {
        id: 'WD-DUPLICATE',
        machineNo: 'DUP#1',
        machineNumber: 'DUP#1',
        machineName: 'Duplicate Machine',
        model: 'BMD302W',
        serialNo: 'SN-44367', // Same serial
        manufacturer: 'EO Technics',
        customerId: 'cust-cleanroom-01',
        customerName: 'Cleanroom Alpha',
        plantName: 'Fab 1',
        status: 'OPERATIONAL',
        lasers: []
      } as unknown as Machine
    ];

    const result = reconcileMhcSessionIdentities([sampleOrphanedSession], duplicateSerialFleet);

    expect(result.modified).toBe(false);
    expect(result.report.relinkedCount).toBe(0);
    expect(result.report.ambiguousCount).toBe(1);
    expect(result.report.ambiguities[0].sessionId).toBe('MHC-2026-08-30-001');
    expect(result.report.ambiguities[0].candidateMachineIds).toEqual(['WD-44367', 'WD-DUPLICATE']);
    expect(result.sessions[0].machineId).toBe('mach-legacy-44367'); // Untouched
  });

  it('7. Idempotency: Re-running reconciliation produces modified: false and zero duplicates', () => {
    const firstPass = reconcileMhcSessionIdentities([sampleOrphanedSession], activeMachines);
    expect(firstPass.modified).toBe(true);
    expect(firstPass.sessions[0].machineId).toBe('WD-44367');

    const secondPass = reconcileMhcSessionIdentities(firstPass.sessions, activeMachines);
    expect(secondPass.modified).toBe(false);
    expect(secondPass.report.relinkedCount).toBe(0);
    expect(secondPass.report.alreadyCorrectCount).toBe(1);
    expect(secondPass.sessions).toEqual(firstPass.sessions);
  });
});
