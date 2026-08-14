/* =====================================================
   AUTOPILOT LASER POWER PROGRESSION TESTS (laserPowerProgression.test.ts)
   ===================================================== */
import { describe, it, expect } from 'vitest';
import { LaserPowerEngine } from './laserPowerEngine';
import { LaserPowerCheckRecord } from '../types/laserPower';
import { 
  advanceAutopilotActivity, 
  auditMhcSession, 
  createDefaultAutopilotProgress 
} from './mhcAutopilotBrain';
import { MHCSession } from '../types';

describe('Laser Power Autopilot Progression & Out-of-Spec Validation', () => {
  const nominalDraftRecord: Partial<LaserPowerCheckRecord> = {
    date: '2026-08-14',
    frequencyKhz: 50,
    engineerRemarks: 'Nominal baseline test',
    laserSource: {
      specText: '15W ±10% (13.5–16.5W)',
      minWatts: 13.5,
      maxWatts: 16.5,
      headA: 15.0,
      headB: 15.2,
      passA: true,
      passB: true,
    },
    opticsTopHat: {
      specText: '15W ±10% (13.5–16.5W)',
      minWatts: 13.5,
      maxWatts: 16.5,
      headA: 14.8,
      headB: 14.9,
      passA: true,
      passB: true,
    },
    workingZoneMasks: [
      { maskSize: '2.2mm', specText: '≥3.1W', minWatts: 3.1, headA: 3.5, headB: 3.6, passA: true, passB: true },
      { maskSize: '2.0mm', specText: '≥2.5W', minWatts: 2.5, headA: 2.8, headB: 2.9, passA: true, passB: true },
      { maskSize: '1.8mm', specText: '≥1.9W', minWatts: 1.9, headA: 2.2, headB: 2.3, passA: true, passB: true },
      { maskSize: '1.3mm', specText: '≥1.0W', minWatts: 1.0, headA: 1.2, headB: 1.3, passA: true, passB: true },
      { maskSize: '1.1mm', specText: '≥0.7W', minWatts: 0.7, headA: 0.9, headB: 0.95, passA: true, passB: true },
      { maskSize: '0.9mm', specText: '≥0.4W', minWatts: 0.4, headA: 0.5, headB: 0.52, passA: true, passB: true },
    ]
  };

  it('1. Evaluates all 16 points PASS to overallResult PASS', () => {
    const evaluated = LaserPowerEngine.evaluateRecord(nominalDraftRecord);
    expect(evaluated.overallResult).toBe('PASS');
    expect(evaluated.laserSource.passA).toBe(true);
    expect(evaluated.laserSource.passB).toBe(true);
    expect(evaluated.opticsTopHat.passA).toBe(true);
    expect(evaluated.opticsTopHat.passB).toBe(true);
  });

  it('2. Evaluates out-of-spec point as pass=false and overallResult FAIL', () => {
    const failDraft = JSON.parse(JSON.stringify(nominalDraftRecord)) as Partial<LaserPowerCheckRecord>;
    // Make Head A Optics Top Hat out of spec (12.0W < 13.5W min)
    failDraft.opticsTopHat!.headA = 12.0;

    const evaluated = LaserPowerEngine.evaluateRecord(failDraft);
    expect(evaluated.overallResult).toBe('FAIL');
    expect(evaluated.opticsTopHat.passA).toBe(false);
    expect(evaluated.opticsTopHat.passB).toBe(true);
  });

  it('3. Advances Autopilot with NEEDS_REVIEW when power results contain FAIL', () => {
    const session: Partial<MHCSession> = {
      id: 'test-session-1',
      machineId: 'm1',
      machineModel: 'Laser Model X',
      machineSerialNumber: 'SN-1001',
      machineName: 'Machine 1',
      customerId: 'c1',
      customerName: 'Customer A',
      plantName: 'Facility A',
      engineerName: 'Engineer 1',
      startDate: '2026-08-14',
      startTime: '08:00',
      lastUpdated: new Date().toISOString(),
      completionStatus: 'IN_PROGRESS',
      currentSection: 2,
      sectionStatuses: {},
      stage01_laserHours: [],
      stage02_laserProfile: {} as any,
      stage04_opticsBeam: {} as any,
      stage05_cooling: {} as any,
      stage06_productQuality: {} as any,
      stage07_spareParts: [],
      stage08_engineerRemarks: {} as any,
      stage03_laserPower: [
        {
          laserId: 'lh1',
          laserIdentifier: 'Laser Head 1',
          ratedPowerWatts: 250,
          referenceValueWatts: 15.0,
          beforeValueWatts: 0.45,
          afterValueWatts: 13.5, // degraded reading
          stabilityPercent: 98.5,
          result: 'FAIL',
          notes: 'Laser Head 1 Power Check OUT OF SPEC (7/8 points passed)',
          evidenceImages: []
        },
        {
          laserId: 'lh2',
          laserIdentifier: 'Laser Head 2',
          ratedPowerWatts: 250,
          referenceValueWatts: 15.0,
          beforeValueWatts: 0.46,
          afterValueWatts: 14.6,
          stabilityPercent: 99.2,
          result: 'PASS',
          notes: 'Laser Head 2 Power Check PASS (8/8 points passed)',
          evidenceImages: []
        }
      ],
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        currentActivityCode: '02_power'
      }
    };

    // Advance Head 1 (FAIL -> NEEDS_REVIEW) and Head 2 (PASS -> COMPLETED)
    let updated = advanceAutopilotActivity(session as MHCSession, '02_power', 'NEEDS_REVIEW', 'Flagged for review (Out of spec points)');
    updated = advanceAutopilotActivity(updated, '03_power', 'COMPLETED', 'Completed in side-by-side Power Workspace');
    
    // Journey rail moves to 02_beam
    if (updated.autopilotProgress) {
      updated.autopilotProgress.currentActivityCode = '02_beam';
      updated.autopilotProgress.activityStatuses['02_beam'] = 'IN_PROGRESS';
    }

    expect(updated.autopilotProgress?.activityStatuses['02_power']).toBe('NEEDS_REVIEW');
    expect(updated.autopilotProgress?.activityStatuses['03_power']).toBe('COMPLETED');
    expect(updated.autopilotProgress?.currentActivityCode).toBe('02_beam');

    // Audit check: auditMhcSession detects Head 1 FAIL and registers blocker
    const audit = auditMhcSession(updated);
    const head1Audit = audit.auditItems.find(i => i.code === '02_power');
    expect(head1Audit?.status).toBe('NEEDS_REVIEW');
    expect(head1Audit?.isBlocker).toBe(true);
    expect(head1Audit?.detail).toContain('Out of Spec');
  });

  it('4. Preserves all laser power measurements and state when session is saved', () => {
    const rawRecordA = LaserPowerEngine.evaluateRecord(nominalDraftRecord);
    const rawRecordB = LaserPowerEngine.evaluateRecord(nominalDraftRecord);

    const laserPowerRecordA = {
      laserId: 'lh1',
      laserIdentifier: 'Laser Head 1',
      ratedPowerWatts: 250,
      referenceValueWatts: 15.0,
      beforeValueWatts: 15.0,
      afterValueWatts: 14.8,
      stabilityPercent: 99.2,
      result: 'PASS' as const,
      notes: 'Laser Head 1 Power Check PASS (8/8 points passed)',
      evidenceImages: [],
      powerRecord: rawRecordA
    };

    const laserPowerRecordB = {
      laserId: 'lh2',
      laserIdentifier: 'Laser Head 2',
      ratedPowerWatts: 250,
      referenceValueWatts: 15.0,
      beforeValueWatts: 15.2,
      afterValueWatts: 14.9,
      stabilityPercent: 99.1,
      result: 'PASS' as const,
      notes: 'Laser Head 2 Power Check PASS (8/8 points passed)',
      evidenceImages: [],
      powerRecord: rawRecordB
    };

    const session: Partial<MHCSession> = {
      id: 'session-persist-test',
      stage03_laserPower: [laserPowerRecordA, laserPowerRecordB],
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        currentActivityCode: '02_power'
      }
    };

    let updatedSession = advanceAutopilotActivity(
      session as MHCSession,
      '02_power',
      'COMPLETED',
      'Laser Head 1 Power Checked'
    );

    updatedSession = advanceAutopilotActivity(
      updatedSession,
      '03_power',
      'COMPLETED',
      'Laser Head 2 Power Checked'
    );

    // Verify stage03_laserPower is intact and populated with both heads
    expect(updatedSession.stage03_laserPower).toBeDefined();
    expect(updatedSession.stage03_laserPower?.length).toBe(2);
    expect(updatedSession.stage03_laserPower?.[0].laserIdentifier).toBe('Laser Head 1');
    expect(updatedSession.stage03_laserPower?.[0].result).toBe('PASS');
    expect(updatedSession.stage03_laserPower?.[0].powerRecord).toBeDefined();
    expect(updatedSession.stage03_laserPower?.[1].laserIdentifier).toBe('Laser Head 2');
    expect(updatedSession.stage03_laserPower?.[1].result).toBe('PASS');
    expect(updatedSession.stage03_laserPower?.[1].powerRecord).toBeDefined();
  });
});
