import { describe, it, expect } from 'vitest';
import { 
  findLatestResumableMhcSession, 
  getMhcSessionTimestamp, 
  createDefaultAutopilotProgress 
} from './mhcAutopilotBrain';
import { Machine, MHCSession } from '../types';

describe('MHC Autopilot - findLatestResumableMhcSession', () => {
  const sampleMachines: Machine[] = [
    {
      id: 'mach-01',
      model: 'SIR-5000',
      serialNumber: 'SN-001',
      machineNumber: 'M-01',
      plantName: 'Plant A',
      customerName: 'Customer Alpha',
      customerId: 'cust-01'
    } as unknown as Machine,
    {
      id: 'mach-02',
      model: 'SIR-6000',
      serialNumber: 'SN-002',
      machineNumber: 'M-02',
      plantName: 'Plant B',
      customerName: 'Customer Beta',
      customerId: 'cust-02'
    } as unknown as Machine
  ];

  it('returns null if no sessions or no machines exist', () => {
    expect(findLatestResumableMhcSession([], sampleMachines)).toBeNull();
    expect(findLatestResumableMhcSession([], [])).toBeNull();
  });

  it('excludes completed sessions from resumable candidates', () => {
    const sessions: MHCSession[] = [
      {
        id: 'MHC-01',
        machineId: 'mach-01',
        machineModel: 'SIR-5000',
        machineSerialNumber: 'SN-001',
        machineName: 'M-01',
        customerId: 'cust-01',
        customerName: 'Customer Alpha',
        plantName: 'Plant A',
        engineerName: 'Engineer',
        startDate: '2026-03-01',
        startTime: '09:00',
        lastUpdated: '2026-03-01T10:00:00Z',
        completionStatus: 'COMPLETED',
        currentSection: 1,
        sectionStatuses: {},
        stage01_laserHours: [],
        stage02_laserProfile: {} as any,
        stage03_laserPower: [],
        stage04_opticsBeam: {} as any,
        stage05_cooling: {} as any,
        stage06_productQuality: {} as any,
        stage07_spareParts: [],
        stage08_engineerRemarks: {} as any
      }
    ];

    expect(findLatestResumableMhcSession(sessions, sampleMachines)).toBeNull();
  });

  it('excludes sessions whose machine is deleted or not found in machines fleet', () => {
    const sessions: MHCSession[] = [
      {
        id: 'MHC-99',
        machineId: 'mach-nonexistent',
        machineModel: 'SIR-9999',
        machineSerialNumber: 'SN-999',
        machineName: 'M-99',
        customerId: 'cust-99',
        customerName: 'Customer Ghost',
        plantName: 'Plant Ghost',
        engineerName: 'Engineer',
        startDate: '2026-03-01',
        startTime: '09:00',
        lastUpdated: '2026-03-01T10:00:00Z',
        completionStatus: 'IN_PROGRESS',
        currentSection: 1,
        sectionStatuses: {},
        stage01_laserHours: [],
        stage02_laserProfile: {} as any,
        stage03_laserPower: [],
        stage04_opticsBeam: {} as any,
        stage05_cooling: {} as any,
        stage06_productQuality: {} as any,
        stage07_spareParts: [],
        stage08_engineerRemarks: {} as any
      }
    ];

    expect(findLatestResumableMhcSession(sessions, sampleMachines)).toBeNull();
  });

  it('picks the latest valid resumable session when multiple incomplete sessions exist', () => {
    const olderSession: MHCSession = {
      id: 'MHC-OLDER',
      machineId: 'mach-01',
      machineModel: 'SIR-5000',
      machineSerialNumber: 'SN-001',
      machineName: 'M-01',
      customerId: 'cust-01',
      customerName: 'Customer Alpha',
      plantName: 'Plant A',
      engineerName: 'Engineer',
      startDate: '2026-02-01',
      startTime: '09:00',
      lastUpdated: '2026-02-01T10:00:00Z',
      completionStatus: 'IN_PROGRESS',
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        lastActiveTimestamp: '2026-02-01T10:00:00Z'
      },
      currentSection: 1,
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

    const newerSession: MHCSession = {
      id: 'MHC-NEWER',
      machineId: 'mach-02',
      machineModel: 'SIR-6000',
      machineSerialNumber: 'SN-002',
      machineName: 'M-02',
      customerId: 'cust-02',
      customerName: 'Customer Beta',
      plantName: 'Plant B',
      engineerName: 'Engineer',
      startDate: '2026-03-01',
      startTime: '09:00',
      lastUpdated: '2026-03-01T14:30:00Z',
      completionStatus: 'IN_PROGRESS',
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        currentDay: 'DAY 2',
        currentActivityCode: '04_stage1',
        lastActiveTimestamp: '2026-03-01T14:30:00Z'
      },
      currentSection: 2,
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

    const result = findLatestResumableMhcSession([olderSession, newerSession], sampleMachines);
    expect(result).not.toBeNull();
    expect(result?.session.id).toBe('MHC-NEWER');
    expect(result?.machine.id).toBe('mach-02');
    expect(result?.session.autopilotProgress?.currentDay).toBe('DAY 2');
    expect(result?.session.autopilotProgress?.currentActivityCode).toBe('04_stage1');
  });

  it('correctly parses timestamps from various session date/time fields', () => {
    const s1: MHCSession = {
      id: 'MHC-1',
      lastUpdated: '2026-03-05T12:00:00Z'
    } as any;
    expect(getMhcSessionTimestamp(s1)).toBe(new Date('2026-03-05T12:00:00Z').getTime());

    const s2: MHCSession = {
      id: 'MHC-2',
      startDate: '2026-03-06',
      startTime: '08:30'
    } as any;
    expect(getMhcSessionTimestamp(s2)).toBe(new Date('2026-03-06T08:30').getTime());

    const s3: MHCSession = {
      id: 'MHC-SESS-1740000000000'
    } as any;
    expect(getMhcSessionTimestamp(s3)).toBe(1740000000000);
  });
});
