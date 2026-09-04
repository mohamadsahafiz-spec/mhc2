/* =====================================================
   AUTOPILOT BEAM PROFILE PERSISTENCE & WORKFLOW TESTS
   ===================================================== */
import { describe, it, expect } from 'vitest';
import { BeamProfileEngine } from './beamProfileEngine';
import { BeamProfileCheckRecord } from '../types/beamProfile';
import { 
  advanceAutopilotActivity, 
  auditMhcSession, 
  createDefaultAutopilotProgress,
  MHC_WORKFLOW_SCHEDULE,
  ACTIONABLE_ACTIVITIES
} from './mhcAutopilotBrain';
import { MHCSession } from '../types';

describe('MHC Autopilot Beam Profile Persistence & Unified Laser Architecture', () => {
  const nominalBeamDraft: Partial<BeamProfileCheckRecord> = {
    id: 'BP-TEST-001',
    date: '2026-08-16',
    readings: {
      '6A': { checkpointId: '6A', measuredDiameterMm: 3.50, pass: true, imageDataUrl: 'idb:img_6a' },
      '6B': { checkpointId: '6B', measuredDiameterMm: 4.20, pass: true, imageDataUrl: 'idb:img_6b' },
      '6C-2.2mm': { checkpointId: '6C-2.2mm', measuredDiameterMm: 2.22, pass: true },
      '6C-2.0mm': { checkpointId: '6C-2.0mm', measuredDiameterMm: 2.01, pass: true },
      '6C-1.8mm': { checkpointId: '6C-1.8mm', measuredDiameterMm: 1.80, pass: true },
      '6C-1.3mm': { checkpointId: '6C-1.3mm', measuredDiameterMm: 1.31, pass: true },
      '6C-1.1mm': { checkpointId: '6C-1.1mm', measuredDiameterMm: 1.10, pass: true },
      '6C-0.9mm': { checkpointId: '6C-0.9mm', measuredDiameterMm: 0.90, pass: true },

      '7A': { checkpointId: '7A', measuredDiameterMm: 3.50, pass: true },
      '7B': { checkpointId: '7B', measuredDiameterMm: 4.20, pass: true },
      '7C-2.2mm': { checkpointId: '7C-2.2mm', measuredDiameterMm: 2.21, pass: true },
      '7C-2.0mm': { checkpointId: '7C-2.0mm', measuredDiameterMm: 2.02, pass: true },
      '7C-1.8mm': { checkpointId: '7C-1.8mm', measuredDiameterMm: 1.82, pass: true },
      '7C-1.3mm': { checkpointId: '7C-1.3mm', measuredDiameterMm: 1.32, pass: true },
      '7C-1.1mm': { checkpointId: '7C-1.1mm', measuredDiameterMm: 1.11, pass: true },
      '7C-0.9mm': { checkpointId: '7C-0.9mm', measuredDiameterMm: 0.92, pass: true },
    },
    overallResult: 'PASS'
  };

  it('1. Verifies unified Day 1 schedule has no duplicate Laser Head 1 / Laser Head 2 entries', () => {
    const day1Activities = MHC_WORKFLOW_SCHEDULE.filter(a => a.day === 'DAY 1');
    expect(day1Activities.length).toBe(2);
    expect(day1Activities[0].code).toBe('01');
    expect(day1Activities[0].title).toBe('Laser Hours');
    expect(day1Activities[1].code).toBe('02');
    expect(day1Activities[1].title).toBe('Laser System Calibration');
    expect(day1Activities[1].subItems?.map(s => s.code)).toEqual(['02_power', '02_beam', '02_findings']);

    const actionableDay1 = ACTIONABLE_ACTIVITIES.filter(a => a.day === 'DAY 1');
    expect(actionableDay1.map(a => a.code)).toEqual(['01', '02_power', '02_beam', '02_findings']);
  });

  it('2. Evaluates Beam Profile Record and persists to MHCSession stage02_laserProfile', () => {
    const evaluatedRecord = BeamProfileEngine.evaluateRecord(nominalBeamDraft);
    expect(evaluatedRecord.overallResult).toBe('PASS');
    expect(evaluatedRecord.readings['6A'].pass).toBe(true);
    expect(evaluatedRecord.readings['7A'].pass).toBe(true);

    const session: Partial<MHCSession> = {
      id: 'mhc_beam_test',
      machineId: 'M-100',
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        currentActivityCode: '02_beam'
      },
      stage02_laserProfile: {
        productName: 'Silicon Wafer Process',
        recipeProgram: 'RCP-404',
        profileInfo: 'Beam Profile Check Complete (16/16 stations passed)',
        beamProfileRecord: evaluatedRecord
      } as any
    };

    // Complete activity in Journey Rail
    const advanced = advanceAutopilotActivity(session as MHCSession, '02_beam', 'COMPLETED', 'Completed in side-by-side Beam Profile Workspace');

    expect(advanced.autopilotProgress?.activityStatuses['02_beam']).toBe('COMPLETED');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('02_findings');
    expect(advanced.stage02_laserProfile?.beamProfileRecord).toBeDefined();
    expect(advanced.stage02_laserProfile?.beamProfileRecord?.overallResult).toBe('PASS');
    expect(advanced.stage02_laserProfile?.beamProfileRecord?.readings['6A'].measuredDiameterMm).toBe(3.5);
    expect(advanced.stage02_laserProfile?.beamProfileRecord?.readings['7B'].measuredDiameterMm).toBe(4.20);

    // Readiness audit reflects completed beam profile
    const audit = auditMhcSession(advanced);
    const beamAudit = audit.auditItems.find(i => i.code === '02_beam');
    expect(beamAudit?.status).toBe('COMPLETE');
    expect(beamAudit?.isBlocker).toBe(false);
  });

  it('3. Retains beam profile data across simulated report navigation roundtrip', () => {
    const evaluatedRecord = BeamProfileEngine.evaluateRecord(nominalBeamDraft);

    let session: MHCSession = {
      id: 'mhc_roundtrip_test',
      machineId: 'M-100',
      machineModel: 'MHC-9000',
      machineSerialNumber: 'SN-2026-001',
      machineName: 'Line 1 Laser System',
      customerId: 'CUST-001',
      customerName: 'Global Foundry',
      plantName: 'Fab 2',
      engineerName: 'Senior Field Specialist',
      startDate: '2026-08-16',
      startTime: '09:00',
      lastUpdated: new Date().toISOString(),
      completionStatus: 'IN_PROGRESS',
      currentSection: 2,
      sectionStatuses: {},
      stage01_laserHours: [
        {
          laserId: 'lh1',
          laserIdentifier: 'Laser 1',
          recordedLaserHour: 1250,
          readingDate: '2026-08-16',
          readingTime: '09:00',
          calculatedCurrentHour: 1250,
          warningThreshold: 9000,
          criticalThreshold: 10000,
          runtimeStatus: 'NORMAL'
        }
      ],
      stage02_laserProfile: {
        profileInfo: 'Beam Profile & Mode Check Complete',
        beamProfileRecord: evaluatedRecord
      } as any,
      stage03_laserPower: [{ laserId: 'lh1', laserIdentifier: 'Laser 1', result: 'PASS' } as any],
      stage04_opticsBeam: {} as any,
      stage05_cooling: {} as any,
      stage06_productQuality: {} as any,
      stage07_spareParts: [],
      stage08_engineerRemarks: {} as any,
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        currentActivityCode: '02_beam',
        activityStatuses: {
          '01': 'COMPLETED',
          '02_power': 'COMPLETED',
          '02_beam': 'COMPLETED',
          '02_findings': 'COMPLETED',
          '04_stage1': 'COMPLETED',
          '04_stage2': 'COMPLETED',
          '05_agc1': 'COMPLETED',
          '05_agc2': 'COMPLETED',
          '06': 'COMPLETED',
          '07': 'COMPLETED',
          '08': 'IN_PROGRESS',
          '09': 'LOCKED'
        }
      }
    };

    // Engineer navigates to Activity 08 (Report Generation)
    session.autopilotProgress!.currentActivityCode = '08';

    // Simulate session serialization / deserialization as happens during state persistence
    const serialized = JSON.stringify(session);
    const rehydrated: MHCSession = JSON.parse(serialized);

    // Engineer navigates back to Activity 02_beam to inspect measurements
    rehydrated.autopilotProgress!.currentActivityCode = '02_beam';

    expect(rehydrated.stage02_laserProfile?.beamProfileRecord).toBeDefined();
    expect(rehydrated.stage02_laserProfile?.beamProfileRecord?.id).toBe('BP-TEST-001');
    expect(rehydrated.stage02_laserProfile?.beamProfileRecord?.overallResult).toBe('PASS');
    expect(rehydrated.stage02_laserProfile?.beamProfileRecord?.readings['6C-2.2mm'].measuredDiameterMm).toBe(2.22);
    expect(rehydrated.stage02_laserProfile?.beamProfileRecord?.readings['7C-0.9mm'].measuredDiameterMm).toBe(0.92);
  });

  it('4. Allows completing Beam Profile when stations are OUT OF SPEC (advances as NEEDS_REVIEW)', () => {
    // Construct draft with 9 pass and 7 OOS stations
    const oosBeamDraft: Partial<BeamProfileCheckRecord> = {
      id: 'BP-TEST-OOS',
      date: '2026-08-16',
      readings: {
        '6A': { checkpointId: '6A', measuredDiameterMm: 3.50, pass: true },
        '6B': { checkpointId: '6B', measuredDiameterMm: 4.20, pass: true },
        '6C-2.2mm': { checkpointId: '6C-2.2mm', measuredDiameterMm: 2.22, pass: true },
        '6C-2.0mm': { checkpointId: '6C-2.0mm', measuredDiameterMm: 2.01, pass: true },
        '6C-1.8mm': { checkpointId: '6C-1.8mm', measuredDiameterMm: 1.80, pass: true },
        '6C-1.3mm': { checkpointId: '6C-1.3mm', measuredDiameterMm: 1.31, pass: true },
        '6C-1.1mm': { checkpointId: '6C-1.1mm', measuredDiameterMm: 1.10, pass: true },
        '6C-0.9mm': { checkpointId: '6C-0.9mm', measuredDiameterMm: 0.90, pass: true },
        // 9th pass: 7A
        '7A': { checkpointId: '7A', measuredDiameterMm: 3.50, pass: true },
        // Remaining 7 stations OOS (e.g. out of nominal range)
        '7B': { checkpointId: '7B', measuredDiameterMm: 5.80, pass: false },
        '7C-2.2mm': { checkpointId: '7C-2.2mm', measuredDiameterMm: 3.10, pass: false },
        '7C-2.0mm': { checkpointId: '7C-2.0mm', measuredDiameterMm: 2.90, pass: false },
        '7C-1.8mm': { checkpointId: '7C-1.8mm', measuredDiameterMm: 2.60, pass: false },
        '7C-1.3mm': { checkpointId: '7C-1.3mm', measuredDiameterMm: 1.95, pass: false },
        '7C-1.1mm': { checkpointId: '7C-1.1mm', measuredDiameterMm: 1.70, pass: false },
        '7C-0.9mm': { checkpointId: '7C-0.9mm', measuredDiameterMm: 1.50, pass: false },
      },
      overallResult: 'FAIL'
    };

    const evaluatedRecord = BeamProfileEngine.evaluateRecord(oosBeamDraft);
    expect(evaluatedRecord.overallResult).toBe('FAIL');
    expect(evaluatedRecord.readings['6A'].pass).toBe(true);
    expect(evaluatedRecord.readings['7B'].pass).toBe(false);
    expect(evaluatedRecord.readings['7B'].measuredDiameterMm).toBe(5.80);

    const session: Partial<MHCSession> = {
      id: 'mhc_beam_oos_test',
      machineId: 'M-100',
      autopilotProgress: {
        ...createDefaultAutopilotProgress(),
        currentActivityCode: '02_beam'
      },
      stage02_laserProfile: {
        productName: 'Silicon Wafer Process',
        recipeProgram: 'RCP-404',
        profileInfo: 'Beam Profile Check Complete (9/16 stations passed)',
        beamProfileRecord: evaluatedRecord
      } as any
    };

    // Completing Beam Profile activity with OOS stations advances rail as NEEDS_REVIEW
    const advanced = advanceAutopilotActivity(
      session as MHCSession,
      '02_beam',
      'NEEDS_REVIEW',
      'Completed with 7 out-of-spec stations (NEEDS REVIEW)'
    );

    expect(advanced.autopilotProgress?.activityStatuses['02_beam']).toBe('NEEDS_REVIEW');
    expect(advanced.autopilotProgress?.currentActivityCode).toBe('02_findings');
    expect(advanced.stage02_laserProfile?.beamProfileRecord).toBeDefined();
    expect(advanced.stage02_laserProfile?.beamProfileRecord?.overallResult).toBe('FAIL');
    expect(advanced.stage02_laserProfile?.beamProfileRecord?.readings['7B'].pass).toBe(false);
    expect(advanced.stage02_laserProfile?.beamProfileRecord?.readings['7B'].measuredDiameterMm).toBe(5.80);
  });
});
