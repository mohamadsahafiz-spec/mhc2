import { describe, it, expect } from 'vitest';
import { advanceAutopilotActivity, auditMhcSession } from './mhcAutopilotBrain';
import { safeJsonStringify } from './persistence';
import { MHCSession } from '../types';

describe('MHC Inspection & Findings Progression & Persistence', () => {
  const createMockSession = (): MHCSession => (({
    id: 'mhc_test_101',
    machineId: 'M-TEST',
    customerName: 'Acme Semi',
    engineerName: 'Lead Eng',
    overallStatus: 'IN_PROGRESS',
    stage01_readiness: { completed: true, status: 'PASS', date: '2026-08-15' },
    stage02_laserProfile: {
      productName: 'Product A',
      recipeProgram: 'RCP-01',
      beamProfileRecord: {
        id: 'BP-01',
        machineId: 'M-TEST',
        date: '2026-08-15',
        laserHeadIds: ['6A', '6B'],
        readings: {} as any,
        overallResult: 'PASS',
        status: 'COMPLETED'
      } as any
    } as any,
    stage03_laserPower: [],
    stage04_temperature: { completed: true, status: 'PASS', date: '2026-08-15' },
    stage05_stageCalibration: { completed: true, status: 'PASS', date: '2026-08-15' },
    stage06_agc: { completed: true, status: 'PASS', date: '2026-08-15' },
    autopilotProgress: {
      currentDay: 'DAY 1',
      currentActivityCode: '02_findings',
      activityStatuses: {
        '01': 'COMPLETED',
        '02_hours': 'COMPLETED',
        '03_hours': 'COMPLETED',
        '02_power': 'COMPLETED',
        '03_power': 'COMPLETED',
        '02_beam': 'COMPLETED',
        '03_beam': 'COMPLETED',
        '02_findings': 'IN_PROGRESS',
        '03_findings': 'UPCOMING'
      }
    },
    inspectionFindings: {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      }
    }
  }) as unknown as MHCSession);

  it('advances 02_findings -> 03_findings when NO_ISSUE is recorded and completed', () => {
    const session = createMockSession();
    const advanced = advanceAutopilotActivity(session, '02_findings', 'COMPLETED');
    expect(advanced.autopilotProgress?.activityStatuses['02_findings']).toBe('COMPLETED');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('03_findings');
  });

  it('advances 02_findings with findings and recommendation without blocking report readiness', () => {
    const session = createMockSession();
    session.inspectionFindings!.lh1 = {
      headId: 'lh1',
      headName: 'Laser Head 1',
      decision: 'ISSUE_FOUND',
      status: 'NEEDS_REVIEW',
      findings: [
        {
          id: 'f1',
          headId: 'lh1',
          headName: 'Laser Head 1',
          component: 'TC lens',
          isCustomComponent: false,
          conditions: ['Burn mark'],
          actionRecommendation: 'Replacement required',
          createdAt: '2026-08-15T00:00:00.000Z',
          evidenceImage: 'idb:img_finding_1'
        }
      ],
      updatedAt: '2026-08-15T00:00:00.000Z'
    };

    const advanced = advanceAutopilotActivity(session, '02_findings', 'NEEDS_REVIEW');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('03_findings');

    // Head 2 also completed with findings
    session.inspectionFindings!.lh2 = {
      headId: 'lh2',
      headName: 'Laser Head 2',
      decision: 'ISSUE_FOUND',
      status: 'COMPLETED',
      findings: [
        {
          id: 'f2',
          headId: 'lh2',
          headName: 'Laser Head 2',
          component: 'Mirrors / reflective optics',
          isCustomComponent: false,
          conditions: ['Contamination'],
          actionRecommendation: 'Clean',
          createdAt: '2026-08-15T00:00:00.000Z'
        }
      ],
      updatedAt: '2026-08-15T00:00:00.000Z'
    };

    const audit = auditMhcSession(session);
    const head1Item = audit.auditItems.find(i => i.code === '02_findings');
    const head2Item = audit.auditItems.find(i => i.code === '03_findings');

    expect(head1Item?.isBlocker).toBe(false);
    expect(head2Item?.isBlocker).toBe(false);
    expect(head1Item?.status).toBe('NEEDS_REVIEW');
    expect(head2Item?.status).toBe('COMPLETE');
  });

  it('safeJsonStringify safely serializes circular objects without throwing', () => {
    const circularObj: any = { id: 'test', label: 'circular' };
    circularObj.self = circularObj;
    circularObj.nested = { parent: circularObj };

    expect(() => {
      const json = safeJsonStringify(circularObj);
      expect(json).toContain('"id":"test"');
      expect(json).toContain('"label":"circular"');
    }).not.toThrow();
  });
});
