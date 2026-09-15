import { describe, it, expect } from 'vitest';
import {
  calculateMhcDayConsumption,
  isSessionInContract,
  getContractMetrics,
  formatContractDuration
} from './contractEngine';
import { Contract, MHCSession, Machine } from '../types';

describe('ContractEngine Unit & Calculation Tests', () => {
  const sampleMachines: Machine[] = [
    {
      id: 'mach-01',
      machineNumber: 'VIA-01',
      model: 'TruMicro 5000',
      serialNumber: 'SN-TM5000-01',
      customerId: 'cust-01',
      customerName: 'FabCorp',
      plantName: 'Fab 1',
      productionLineName: 'Line A',
      status: 'OPERATIONAL'
    } as unknown as Machine,
    {
      id: 'mach-02',
      machineNumber: 'VIA-02',
      model: 'TruMicro 5000',
      serialNumber: 'SN-TM5000-02',
      customerId: 'cust-01',
      customerName: 'FabCorp',
      plantName: 'Fab 1',
      productionLineName: 'Line B',
      status: 'OPERATIONAL'
    } as unknown as Machine,
    {
      id: 'mach-03',
      machineNumber: 'VIA-03',
      model: 'TruMicro 5000',
      serialNumber: 'SN-TM5000-03',
      customerId: 'cust-01',
      customerName: 'FabCorp',
      plantName: 'Fab 2',
      productionLineName: 'Line C',
      status: 'OPERATIONAL'
    } as unknown as Machine
  ];

  const sampleContract: Contract = {
    id: 'cnt-2026-01',
    contractNumber: 'SLA-2026-FABCORP',
    customerId: 'cust-01',
    customerName: 'FabCorp',
    plantName: 'Fab 1',
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    totalWorkingDays: 80,
    machinesCoveredIds: ['mach-01', 'mach-02'],
    status: 'ACTIVE'
  };

  it('calculates real MHC day consumption accurately from startDate to completedDate', () => {
    // 3-day session
    const s3Days: MHCSession = {
      id: 's-1',
      machineId: 'mach-01',
      startDate: '2026-04-10',
      completedDate: '2026-04-12',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(calculateMhcDayConsumption(s3Days)).toBe(3);

    // 2-day session
    const s2Days: MHCSession = {
      id: 's-2',
      machineId: 'mach-01',
      startDate: '2026-06-15',
      completedDate: '2026-06-16',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(calculateMhcDayConsumption(s2Days)).toBe(2);

    // Single day session (completed same day)
    const s1Day: MHCSession = {
      id: 's-3',
      machineId: 'mach-01',
      startDate: '2026-08-01',
      completedDate: '2026-08-01',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(calculateMhcDayConsumption(s1Day)).toBe(1);

    // In-progress session with only startDate
    const sInProgress: MHCSession = {
      id: 's-4',
      machineId: 'mach-01',
      startDate: '2026-09-01',
      completionStatus: 'IN_PROGRESS'
    } as unknown as MHCSession;
    expect(calculateMhcDayConsumption(sInProgress)).toBe(1);
  });

  it('determines if session falls within contract window and machine scope', () => {
    const validSession: MHCSession = {
      id: 's-valid',
      machineId: 'mach-01',
      startDate: '2026-05-10',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(isSessionInContract(validSession, sampleContract)).toBe(true);

    // Uncovered machine
    const uncoveredSession: MHCSession = {
      id: 's-uncovered',
      machineId: 'mach-03', // not in sampleContract.machinesCoveredIds
      startDate: '2026-05-10',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(isSessionInContract(uncoveredSession, sampleContract)).toBe(false);

    // Out of date range (before start)
    const beforeSession: MHCSession = {
      id: 's-before',
      machineId: 'mach-01',
      startDate: '2025-11-20',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(isSessionInContract(beforeSession, sampleContract)).toBe(false);

    // Out of date range (after end)
    const afterSession: MHCSession = {
      id: 's-after',
      machineId: 'mach-01',
      startDate: '2028-02-15',
      completionStatus: 'COMPLETED'
    } as unknown as MHCSession;
    expect(isSessionInContract(afterSession, sampleContract)).toBe(false);
  });

  it('computes aggregated contract metrics, covered machines, consumed and remaining days', () => {
    const sessions: MHCSession[] = [
      {
        id: 's-1',
        machineId: 'mach-01',
        startDate: '2026-03-01',
        completedDate: '2026-03-03', // 3 days
        completionStatus: 'COMPLETED',
        machineModel: 'TruMicro 5000',
        machineSerialNumber: 'SN-TM5000-01',
        engineerName: 'Engineer A'
      } as unknown as MHCSession,
      {
        id: 's-2',
        machineId: 'mach-02',
        startDate: '2026-05-10',
        completedDate: '2026-05-11', // 2 days
        completionStatus: 'COMPLETED',
        machineModel: 'TruMicro 5000',
        machineSerialNumber: 'SN-TM5000-02',
        engineerName: 'Engineer B'
      } as unknown as MHCSession,
      {
        id: 's-3',
        machineId: 'mach-03', // Uncovered machine
        startDate: '2026-06-01',
        completedDate: '2026-06-03',
        completionStatus: 'COMPLETED'
      } as unknown as MHCSession
    ];

    const metrics = getContractMetrics(sampleContract, sessions, sampleMachines);

    expect(metrics.totalWorkingDays).toBe(80);
    expect(metrics.consumedWorkingDays).toBe(5); // 3 + 2
    expect(metrics.remainingWorkingDays).toBe(75); // 80 - 5
    expect(metrics.utilizationPercent).toBe(6); // 5/80 * 100 = 6.25% -> 6%
    expect(metrics.coveredMachines.length).toBe(2);
    expect(metrics.uncoveredMachines.length).toBe(1);
    expect(metrics.timelineEvents.length).toBe(2);
    expect(metrics.timelineEvents[0].sessionId).toBe('s-1');
    expect(metrics.timelineEvents[1].sessionId).toBe('s-2');
  });

  it('formats contract duration cleanly for 2-year periods', () => {
    const label = formatContractDuration('2026-01-01', '2027-12-31');
    expect(label).toContain('2 Years');
  });
});
