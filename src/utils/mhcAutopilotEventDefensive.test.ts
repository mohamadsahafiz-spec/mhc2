import { describe, it, expect, beforeEach } from 'vitest';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from './mhcAutopilotBrain';
import { StorageService } from './persistence';
import { MHCSession } from '../types';

describe('MHC Autopilot Event Injection & Defensive Sanitation', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear()
    };
  });

  it('strips DOM and React SyntheticEvent attributes when advancing an activity', () => {
    const fakeEvent: any = {
      _reactName: 'onClick',
      type: 'click',
      target: { tagName: 'BUTTON', nodeType: 1 },
      currentTarget: { tagName: 'BUTTON' },
      nativeEvent: { isTrusted: true },
      view: { window: 'fake-window' },
      id: 'MHC-TEST-123',
      machineId: 'EQ-01',
      date: '2026-08-16',
      autopilotProgress: {
        currentDay: 1,
        currentActivityCode: '01',
        activityStatuses: { '01': 'IN_PROGRESS' },
        activityNotes: {},
        lastActiveTimestamp: ''
      }
    };

    const advanced = advanceAutopilotActivity(fakeEvent as MHCSession, '01', 'COMPLETED');
    expect(advanced.id).toBe('MHC-TEST-123');
    expect(advanced.autopilotProgress?.activityStatuses['01']).toBe('COMPLETED');
    expect((advanced as any)._reactName).toBeUndefined();
    expect((advanced as any).nativeEvent).toBeUndefined();
    expect((advanced as any).view).toBeUndefined();
    expect((advanced as any).target).toBeUndefined();
    expect((advanced as any).currentTarget).toBeUndefined();
  });

  it('filters out malformed non-sessions in StorageService save and get', () => {
    const malformed = {
      _reactName: 'onClick',
      nativeEvent: {},
      view: {}
    };
    const validSession = {
      id: 'MHC-VALID-999',
      machineId: 'EQ-02',
      machineModel: 'FX-200',
      machineSerialNumber: 'SN-001',
      machineName: 'Equipment 2',
      customerId: 'CUST-1',
      customerName: 'Customer 1',
      plantName: 'Plant 1',
      engineerName: 'Engineer',
      startDate: '2026-08-16',
      startTime: '08:00',
      lastUpdated: '2026-08-16T08:00:00Z',
      completionStatus: 'IN_PROGRESS',
      currentSection: 1,
      sectionStatuses: {},
      stage01_laserHours: [],
      stage02_laserProfile: { findings: [] }
    } as unknown as MHCSession;

    StorageService.saveMhcSessions([malformed as any, validSession]);
    const retrieved = StorageService.getMhcSessions();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe('MHC-VALID-999');
  });
});
