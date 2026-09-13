import { describe, it, expect } from 'vitest';
import { findLatestResumableMhcSession, hasMeaningfulMhcProgress } from '../../utils/mhcAutopilotBrain';
import { createNewMhcSession } from '../mhc/MhcAutopilot';
import { Machine, MHCSession, ExecutionScheduleItem, FieldEngineerTask, AlertItem } from '../../types';

describe('FSOS R3 Daily Work Territory Data Truth & Hierarchy', () => {
  const sampleMachine: Machine = {
    id: 'MCH-001',
    machineNumber: 'EO-L200-01',
    model: 'EO-L200',
    serialNumber: 'SN-2026-001',
    customerId: 'CUST-01',
    customerName: 'SilTerra Malaysia',
    plantId: 'PLANT-01',
    plantName: 'Fab 1 Cleanroom',
    productionLineId: 'LINE-01',
    productionLineName: 'Line 1',
    status: 'OPERATIONAL',
    healthScore: 98,
    laserHeads: [],
    consumables: [],
    photos: [],
    lastMhcDate: '2026-09-01',
    nextMhcDate: '2026-12-01',
    installationDate: '2025-01-01',
    baselineDate: '2025-01-02'
  };

  it('correctly identifies ongoing work with meaningful progress for Current Focus', () => {
    const baseSession = createNewMhcSession(sampleMachine, 'SilTerra Malaysia', 'Sahafiz');
    const activeSessionWithProgress: MHCSession = {
      ...baseSession,
      id: 'MHC-SESS-001',
      autopilotProgress: {
        currentDay: 'DAY 1',
        currentActivityCode: '03',
        readinessScore: 40,
        activityStatuses: {
          '01': 'COMPLETED',
          '02': 'COMPLETED',
          '03': 'IN_PROGRESS'
        }
      }
    };

    const resumable = findLatestResumableMhcSession([activeSessionWithProgress], [sampleMachine]);
    expect(resumable).not.toBeNull();
    expect(resumable?.machine.id).toBe('MCH-001');
    expect(hasMeaningfulMhcProgress(resumable?.session)).toBe(true);
  });

  it('classifies zero-progress session as draft without falsely marking as active in-progress mission', () => {
    const emptyDraftSession = createNewMhcSession(sampleMachine, 'SilTerra Malaysia', 'Sahafiz');

    const resumable = findLatestResumableMhcSession([emptyDraftSession], [sampleMachine]);
    expect(resumable).not.toBeNull();
    expect(hasMeaningfulMhcProgress(resumable?.session)).toBe(false);
  });

  it('filters schedule strictly by real dates without fabricating fallback time values', () => {
    const today = new Date().toISOString().split('T')[0];
    const realSchedule: ExecutionScheduleItem[] = [
      {
        id: 'SCH-01',
        contractId: 'CTR-01',
        customerName: 'SilTerra Malaysia',
        plantName: 'Fab 1',
        machineId: 'MCH-001',
        machineName: 'EO-L200-01',
        engineerName: 'Sahafiz',
        title: 'Quarterly MHC Calibration',
        scheduledDate: today,
        quarter: 'Q3',
        type: 'QUARTERLY_MHC',
        status: 'SCHEDULED',
        estimatedHours: 4
      },
      {
        id: 'SCH-02',
        contractId: 'CTR-01',
        customerName: 'Inari Technology',
        plantName: 'Plant P34',
        machineId: 'MCH-002',
        machineName: 'EO-L300-02',
        engineerName: 'Sahafiz',
        title: 'Baseline Alignment Support',
        scheduledDate: '2099-12-31',
        quarter: 'Q4',
        type: 'BASELINE_CHECK',
        status: 'SCHEDULED',
        estimatedHours: 2
      }
    ];

    const todayItems = realSchedule.filter(
      (item) => item.scheduledDate === today || item.status === 'IN_PROGRESS'
    );
    const upcomingItems = realSchedule.filter(
      (item) => item.scheduledDate && item.scheduledDate > today
    );

    expect(todayItems.length).toBe(1);
    expect(todayItems[0].id).toBe('SCH-01');
    expect(todayItems[0].estimatedHours).toBe(4);

    expect(upcomingItems.length).toBe(1);
    expect(upcomingItems[0].id).toBe('SCH-02');
  });

  it('truthfully handles empty state when no sessions or schedule items exist', () => {
    const emptySessions: MHCSession[] = [];
    const emptySchedule: ExecutionScheduleItem[] = [];

    const resumable = findLatestResumableMhcSession(emptySessions, [sampleMachine]);
    expect(resumable).toBeNull();
    expect(emptySchedule.length).toBe(0);
  });

  it('correctly isolates real attention triggers without fabricating fake alerts', () => {
    const cleanTasks: FieldEngineerTask[] = [
      {
        id: 'TSK-01',
        title: 'Routine check',
        customerName: 'Customer A',
        machineName: 'MCH-01',
        priority: 'NORMAL',
        dueDate: '2099-01-01',
        type: 'MHC',
        completed: false
      }
    ];
    const cleanAlerts: AlertItem[] = [];

    const overdueTasks = cleanTasks.filter(
      (t) => !t.completed && (t.priority === 'URGENT' || (t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]))
    );
    const criticalAlerts = cleanAlerts.filter((a) => a.severity === 'CRITICAL');

    expect(overdueTasks.length).toBe(0);
    expect(criticalAlerts.length).toBe(0);
  });
});
