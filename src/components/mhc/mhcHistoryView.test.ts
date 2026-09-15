import { describe, it, expect } from 'vitest';
import { MHCSession, Machine, MHCHeadInspectionState, MHCStageCalibrationResult } from '../../types';

describe('R7-D MHC History Calm Industrial Record Logic', () => {
  const mockMachines: Machine[] = [
    {
      id: 'm1',
      customerId: 'c1',
      customerName: 'FabCorp Microelectronics',
      plantId: 'p1',
      plantName: 'Fab 2 Cleanroom',
      productionLineId: 'l1',
      productionLineName: 'Line 3',
      zone: 'Zone B',
      model: 'TRUMPF TruMicro 5000',
      machineNumber: 'MHC-DEV-01',
      serialNumber: 'SN-TRUMPF-9812',
      installationDate: '2024-03-15',
      baselineDate: '2024-03-20',
      healthScore: 94,
      laserHeads: [],
      consumables: [],
      status: 'OPERATIONAL',
      photos: [],
      lastMhcDate: '2026-08-10',
      nextMhcDate: '2026-11-10'
    },
    {
      id: 'm2',
      customerId: 'c2',
      customerName: 'OptoSemiconductor Ltd',
      plantId: 'p2',
      plantName: 'Assembly Plant 1',
      productionLineId: 'l2',
      productionLineName: 'Line 1',
      model: 'HMI-2800 Dual Beam',
      machineNumber: 'MHC-DEV-02',
      serialNumber: 'SN-HMI-4401',
      installationDate: '2023-11-01',
      baselineDate: '2023-11-10',
      healthScore: 78,
      laserHeads: [],
      consumables: [],
      status: 'NEEDS_CALIBRATION',
      photos: [],
      lastMhcDate: '2026-05-20',
      nextMhcDate: '2026-08-20'
    }
  ];

  const mockSessions: MHCSession[] = [
    {
      id: 'MHC-2026-001',
      machineId: 'm1',
      machineModel: 'TRUMPF TruMicro 5000',
      machineName: 'Laser VIA #1',
      machineSerialNumber: 'SN-TRUMPF-9812',
      customerId: 'c1',
      customerName: 'FabCorp Microelectronics',
      plantName: 'Fab 2 Cleanroom',
      productionLineName: 'Line 3',
      engineerName: 'Marcus Vance',
      startDate: '2026-08-10',
      startTime: '09:30',
      completedDate: '2026-08-10',
      completionStatus: 'COMPLETED',
      stage01_laserHours: [{ headName: 'Laser Head 1', laserHours: 3200 }],
      inspectionFindings: {
        head1: {
          headId: 'head1',
          headName: 'Laser Head 1',
          decision: 'ISSUE_FOUND',
          findings: [
            {
              id: 'f1',
              component: 'Protective Window',
              conditions: ['Debris Contamination'],
              actionRecommendation: 'Clean',
              createdAt: '2026-08-10T10:00:00Z'
            }
          ],
          status: 'COMPLETED'
        }
      },
      stage07_spareParts: [
        {
          id: 'sp-1',
          partNumber: 'TR-NOZ-004',
          partName: 'Gas Nozzle Tip',
          quantity: 2,
          wearCondition: 'Worn',
          action: 'RECOMMEND_STOCK'
        }
      ],
      stage08_engineerRemarks: {
        generalRemarks: 'Laser power stable within 1.2% tolerance. Cleaned optic surfaces.',
        dispositionVerdict: 'ACCEPTED'
      }
    } as unknown as MHCSession,
    {
      id: 'MHC-2026-002',
      machineId: 'm1',
      machineModel: 'TRUMPF TruMicro 5000',
      machineName: 'Laser VIA #1',
      machineSerialNumber: 'SN-TRUMPF-9812',
      customerId: 'c1',
      customerName: 'FabCorp Microelectronics',
      plantName: 'Fab 2 Cleanroom',
      productionLineName: 'Line 3',
      engineerName: 'Marcus Vance',
      startDate: '2026-09-01',
      startTime: '14:00',
      completionStatus: 'IN_PROGRESS',
      stage01_laserHours: [{ headName: 'Laser Head 1', laserHours: 3450 }]
    } as unknown as MHCSession,
    {
      id: 'MHC-2026-003',
      machineId: 'm2',
      machineModel: 'HMI-2800 Dual Beam',
      machineName: 'Laser VIA #2',
      machineSerialNumber: 'SN-HMI-4401',
      customerId: 'c2',
      customerName: 'OptoSemiconductor Ltd',
      plantName: 'Assembly Plant 1',
      productionLineName: 'Line 1',
      engineerName: 'Sarah Jenkins',
      startDate: '2026-05-20',
      startTime: '11:15',
      completedDate: '2026-05-20',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession
  ];

  it('correctly filters sessions by machine ID', () => {
    const m1Sessions = mockSessions.filter(s => s.machineId === 'm1');
    expect(m1Sessions.length).toBe(2);
    expect(m1Sessions.map(s => s.id)).toEqual(['MHC-2026-001', 'MHC-2026-002']);

    const m2Sessions = mockSessions.filter(s => s.machineId === 'm2');
    expect(m2Sessions.length).toBe(1);
    expect(m2Sessions[0].id).toBe('MHC-2026-003');
  });

  it('filters sessions by completion status (COMPLETED vs IN_PROGRESS)', () => {
    const completed = mockSessions.filter(s => s.completionStatus === 'COMPLETED');
    expect(completed.length).toBe(2);
    expect(completed.map(s => s.id)).toContain('MHC-2026-001');
    expect(completed.map(s => s.id)).toContain('MHC-2026-003');

    const inProgress = mockSessions.filter(s => s.completionStatus === 'IN_PROGRESS');
    expect(inProgress.length).toBe(1);
    expect(inProgress[0].id).toBe('MHC-2026-002');
  });

  it('filters sessions by search query across ID, model, customer, and engineer', () => {
    const searchById = mockSessions.filter(s => s.id.toLowerCase().includes('002'));
    expect(searchById.length).toBe(1);
    expect(searchById[0].id).toBe('MHC-2026-002');

    const searchByEngineer = mockSessions.filter(s => s.engineerName.toLowerCase().includes('sarah'));
    expect(searchByEngineer.length).toBe(1);
    expect(searchByEngineer[0].id).toBe('MHC-2026-003');

    const searchByCustomer = mockSessions.filter(s => s.customerName.toLowerCase().includes('fabcorp'));
    expect(searchByCustomer.length).toBe(2);
  });

  it('sorts sessions chronologically (Newest First vs Oldest First)', () => {
    const newestFirst = [...mockSessions].sort((a, b) => {
      const timeA = new Date(`${a.startDate} ${a.startTime || '00:00'}`).getTime();
      const timeB = new Date(`${b.startDate} ${b.startTime || '00:00'}`).getTime();
      return timeB - timeA;
    });
    expect(newestFirst.map(s => s.id)).toEqual(['MHC-2026-002', 'MHC-2026-001', 'MHC-2026-003']);

    const oldestFirst = [...mockSessions].sort((a, b) => {
      const timeA = new Date(`${a.startDate} ${a.startTime || '00:00'}`).getTime();
      const timeB = new Date(`${b.startDate} ${b.startTime || '00:00'}`).getTime();
      return timeA - timeB;
    });
    expect(oldestFirst.map(s => s.id)).toEqual(['MHC-2026-003', 'MHC-2026-001', 'MHC-2026-002']);
  });

  it('extracts findings and parts counts accurately without manufacturing values', () => {
    const s1 = mockSessions[0];
    const s1FindingsCount = s1.inspectionFindings
      ? (Object.values(s1.inspectionFindings) as MHCHeadInspectionState[]).reduce((acc, h) => acc + (h.findings?.length || 0), 0)
      : 0;
    expect(s1FindingsCount).toBe(1);

    const s1PartsCount = s1.stage07_spareParts?.length || 0;
    expect(s1PartsCount).toBe(1);

    const s2 = mockSessions[1];
    const s2FindingsCount = s2.inspectionFindings
      ? (Object.values(s2.inspectionFindings) as MHCHeadInspectionState[]).reduce((acc, h) => acc + (h.findings?.length || 0), 0)
      : 0;
    expect(s2FindingsCount).toBe(0);
    expect(s2.stage07_spareParts?.length || 0).toBe(0);
  });
});
