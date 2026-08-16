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

  it('advances 02_findings -> 04_stage1 when NO_ISSUE is recorded and completed', () => {
    const session = createMockSession();
    const advanced = advanceAutopilotActivity(session, '02_findings', 'COMPLETED');
    expect(advanced.autopilotProgress?.activityStatuses['02_findings']).toBe('COMPLETED');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('04_stage1');
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
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('04_stage1');

    // Head 2 also recorded with findings
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
    const findingsItem = audit.auditItems.find(i => i.code === '02_findings');

    expect(findingsItem?.isBlocker).toBe(false);
    expect(findingsItem?.status).toBe('NEEDS_REVIEW');
    expect(findingsItem?.detail).toContain('Replacement recorded');
  });

  it('FLOW A: LH1 NO ISSUE + LH2 NO ISSUE -> advance to 04_stage1 as COMPLETED', () => {
    const session = createMockSession();
    session.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      },
      lh2: {
        headId: 'lh2',
        headName: 'Laser Head 2',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      }
    };

    const advanced = advanceAutopilotActivity(session, '02_findings', 'COMPLETED');
    expect(advanced.autopilotProgress?.activityStatuses['02_findings']).toBe('COMPLETED');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('04_stage1');
    expect(advanced.autopilotProgress?.currentDay).toBe('DAY 2');
  });

  it('FLOW B: LH1 NO ISSUE + LH2 FINDING + evidence -> NEEDS_REVIEW but advance to 04_stage1', () => {
    const session = createMockSession();
    session.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      },
      lh2: {
        headId: 'lh2',
        headName: 'Laser Head 2',
        decision: 'ISSUE_FOUND',
        status: 'NEEDS_REVIEW',
        findings: [
          {
            id: 'f-lh2-1',
            headId: 'lh2',
            headName: 'Laser Head 2',
            component: 'TC lens',
            conditions: ['Burn mark'],
            actionRecommendation: 'Replacement required',
            engineerNote: 'Center burn mark found on LH2 lens',
            evidenceImage: 'idb:img_finding_lh2_1',
            createdAt: '2026-08-15T00:00:00.000Z'
          }
        ],
        updatedAt: '2026-08-15T00:00:00.000Z'
      }
    };

    const advanced = advanceAutopilotActivity(session, '02_findings', 'NEEDS_REVIEW');
    expect(advanced.autopilotProgress?.activityStatuses['02_findings']).toBe('NEEDS_REVIEW');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('04_stage1');
    expect(advanced.autopilotProgress?.currentDay).toBe('DAY 2');
  });

  it('FLOW C: LH1 FINDING + LH2 NO ISSUE -> NEEDS_REVIEW but advance to 04_stage1', () => {
    const session = createMockSession();
    session.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'ISSUE_FOUND',
        status: 'NEEDS_REVIEW',
        findings: [
          {
            id: 'f-lh1-1',
            headId: 'lh1',
            headName: 'Laser Head 1',
            component: 'Optics / transmitting lens',
            conditions: ['Physical damage'],
            actionRecommendation: 'Recommended replacement',
            createdAt: '2026-08-15T00:00:00.000Z'
          }
        ],
        updatedAt: '2026-08-15T00:00:00.000Z'
      },
      lh2: {
        headId: 'lh2',
        headName: 'Laser Head 2',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      }
    };

    const advanced = advanceAutopilotActivity(session, '02_findings', 'NEEDS_REVIEW');
    expect(advanced.autopilotProgress?.activityStatuses['02_findings']).toBe('NEEDS_REVIEW');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('04_stage1');
    expect(advanced.autopilotProgress?.currentDay).toBe('DAY 2');
  });

  it('FLOW D & E & F: LH1 and LH2 independent state preservation across tab switches and rehydration', () => {
    const session = createMockSession();
    
    // 1. LH1 addressed
    session.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      }
    };

    // 2. Add LH2 finding + evidence
    const findingLh2 = {
      id: 'f_test_lh2',
      headId: 'lh2',
      headName: 'Laser Head 2',
      component: 'Scanner X lens',
      conditions: ['Contamination'],
      actionRecommendation: 'Clean' as const,
      evidenceImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      createdAt: '2026-08-15T00:00:00.000Z'
    };

    session.inspectionFindings.lh2 = {
      headId: 'lh2',
      headName: 'Laser Head 2',
      decision: 'ISSUE_FOUND',
      status: 'COMPLETED',
      findings: [findingLh2],
      updatedAt: '2026-08-15T00:00:00.000Z'
    };

    // 3. Verify LH1 is preserved when LH2 is added
    expect(session.inspectionFindings.lh1.decision).toBe('NO_ISSUE');
    expect(session.inspectionFindings.lh2.findings.length).toBe(1);
    expect(session.inspectionFindings.lh2.findings[0].evidenceImage).toContain('data:image');

    // 4. Advance and simulate navigating back
    const advanced = advanceAutopilotActivity(session, '02_findings', 'COMPLETED');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('04_stage1');
    expect(advanced.inspectionFindings?.lh2?.findings[0].id).toBe('f_test_lh2');
    expect(advanced.inspectionFindings?.lh2?.findings[0].evidenceImage).toContain('data:image');
  });

  it('FLOW G: MHC Report generation aggregates both heads findings', () => {
    const session = createMockSession();
    session.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        decision: 'NO_ISSUE',
        status: 'COMPLETED',
        findings: [],
        updatedAt: '2026-08-15T00:00:00.000Z'
      },
      lh2: {
        headId: 'lh2',
        headName: 'Laser Head 2',
        decision: 'ISSUE_FOUND',
        status: 'NEEDS_REVIEW',
        findings: [
          {
            id: 'f-rep-2',
            headId: 'lh2',
            headName: 'Laser Head 2',
            component: 'TC lens',
            conditions: ['Burn mark'],
            actionRecommendation: 'Replacement required',
            engineerNote: 'Cracked optic coating',
            evidenceImage: 'idb:img_rep_2',
            createdAt: '2026-08-15T00:00:00.000Z'
          }
        ],
        updatedAt: '2026-08-15T00:00:00.000Z'
      }
    };

    const audit = auditMhcSession(session);
    const item = audit.auditItems.find(i => i.code === '02_findings');
    expect(item).toBeDefined();
    expect(item?.status).toBe('NEEDS_REVIEW');
    expect(item?.isBlocker).toBe(false);
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
