import { describe, it, expect } from 'vitest';
import { 
  ACTIONABLE_ACTIVITIES, 
  MHC_WORKFLOW_SCHEDULE, 
  advanceAutopilotActivity, 
  auditMhcSession,
  getActivityDisplayCode
} from './mhcAutopilotBrain';
import { MHCSession } from '../types';

describe('MHC Autopilot Authoritative Activity Routing & Schedule Integrity', () => {
  it('confirms the authoritative activity schedule ordering and display codes', () => {
    // 06 -> 06_via -> 07 -> 08 -> 09 -> 10
    const code06 = ACTIONABLE_ACTIVITIES.find(a => a.code === '06');
    const code06Via = ACTIONABLE_ACTIVITIES.find(a => a.code === '06_via');
    const code07 = ACTIONABLE_ACTIVITIES.find(a => a.code === '07');
    const code08 = ACTIONABLE_ACTIVITIES.find(a => a.code === '08');
    const code09 = ACTIONABLE_ACTIVITIES.find(a => a.code === '09');
    const code10 = ACTIONABLE_ACTIVITIES.find(a => a.code === '10');

    expect(code06).toBeDefined();
    expect(code06?.title).toBe('Temperature & Evidence');
    expect(code06?.day).toBe('DAY 3');

    expect(code06Via).toBeDefined();
    expect(code06Via?.title).toBe('Product & Process / Via');
    expect(code06Via?.day).toBe('DAY 3');
    expect(getActivityDisplayCode('06_via')).toBe('07');

    expect(code07).toBeDefined();
    expect(code07?.title).toBe('Recommendations & Spare Parts');
    expect(code07?.day).toBe('DAY 4');
    expect(getActivityDisplayCode('07')).toBe('08');

    expect(code08).toBeDefined();
    expect(code08?.title).toBe('MHC Readiness Review');
    expect(code08?.day).toBe('DAY 4');
    expect(getActivityDisplayCode('08')).toBe('09');

    expect(code09).toBeDefined();
    expect(code09?.title).toBe('Report Generation');
    expect(code09?.day).toBe('DAY 4');
    expect(getActivityDisplayCode('09')).toBe('10');

    expect(code10).toBeDefined();
    expect(code10?.title).toBe('Buyoff / Complete');
    expect(code10?.day).toBe('DAY 4');
    expect(getActivityDisplayCode('10')).toBe('11');
  });

  it('correctly sequences advancement from 06 -> 06_via -> 07 -> 08 when activities are completed sequentially', () => {
    let session: MHCSession = {
      id: 'mhc_routing_test',
      machineId: 'M-01',
      customerName: 'Test Semi',
      engineerName: 'Lead Engineer',
      overallStatus: 'IN_PROGRESS',
      autopilotProgress: {
        currentDay: 'DAY 3',
        currentActivityCode: '06',
        activityStatuses: {
          '01': 'COMPLETED',
          '02_power': 'COMPLETED',
          '02_beam': 'COMPLETED',
          '02_findings': 'COMPLETED',
          '04_stage1': 'COMPLETED',
          '04_stage2': 'COMPLETED',
          '03_focus': 'COMPLETED',
          '05_agc1': 'COMPLETED',
          '05_agc2': 'COMPLETED',
          '06': 'IN_PROGRESS',
          '06_via': 'UPCOMING',
          '07': 'UPCOMING',
          '08': 'UPCOMING',
          '09': 'UPCOMING',
          '10': 'UPCOMING'
        }
      }
    } as unknown as MHCSession;

    // Complete 06 Temperature & Evidence -> advances to 06_via
    session = advanceAutopilotActivity(session, '06', 'COMPLETED', 'Thermal test verified');
    expect(session.autopilotProgress?.activityStatuses['06']).toBe('COMPLETED');
    expect(session.autopilotProgress?.currentActivityCode).toBe('06_via');

    // Complete 06_via Product & Process -> advances to 07 Recommendations & Spare Parts
    session = advanceAutopilotActivity(session, '06_via', 'COMPLETED', 'Via quality verified');
    expect(session.autopilotProgress?.activityStatuses['06_via']).toBe('COMPLETED');
    expect(session.autopilotProgress?.currentActivityCode).toBe('07');

    // Complete 07 Recommendations & Spare Parts -> advances to 08 Readiness Review
    session = advanceAutopilotActivity(session, '07', 'COMPLETED', 'Spare parts recorded');
    expect(session.autopilotProgress?.activityStatuses['07']).toBe('COMPLETED');
    expect(session.autopilotProgress?.currentActivityCode).toBe('08');
  });

  it('audits full readiness when all activities 01 through 07 are completed, allowing unlock to 09 Report Generation', () => {
    const session: MHCSession = {
      id: 'mhc_readiness_test',
      machineId: 'M-01',
      customerName: 'Test Semi',
      engineerName: 'Lead Engineer',
      overallStatus: 'IN_PROGRESS',
      stage01_laserHours: [{ component: 'LASER_1', currentHours: 1200, ratedHours: 10000, status: 'NORMAL' }],
      stage03_laserPower: [{ laserHeadId: '1', powerWatts: 15.2, targetWatts: 15.0, status: 'PASS', stabilityPercent: 0.8 }],
      inspectionFindings: {
        lh1: { headId: 'lh1', headName: 'Laser Head 1', decision: 'NO_ISSUE', status: 'COMPLETED', findings: [] }
      },
      stageCalibrationData: { stage1: { devX: 0.5, devY: -0.4, status: 'PASS' } },
      focusOptimizationRecord: { focalPositionMm: 12.4, status: 'OPTIMAL' },
      agcData: { agc1: { baselineGain: 1.02, calibratedGain: 1.0, status: 'PASS' } },
      temperatureEvidenceData: { hasValidTemperatureAnalysis: true, stats: { avg: 24.2, min: 23.8, max: 24.6, stdDev: 0.1 } },
      productProcessRecord: {
        productName: 'MHC-TEST-PROD',
        recipeName: 'REC-01',
        overallResult: 'PASS',
        laser1Via: { topWidthUm: 50.1, bottomWidthUm: 42.3, taperPercent: 84.4, overallPass: true }
      },
      stage07_spareParts: [
        { id: 'SP-1', partName: 'Laser Filter', quantity: 1, action: 'REPLACED', costIndicator: 'CUSTOMER_COST', reason: 'Routine replacement' }
      ],
      autopilotProgress: {
        currentDay: 'DAY 4',
        currentActivityCode: '08',
        activityStatuses: {
          '01': 'COMPLETED',
          '02_power': 'COMPLETED',
          '02_beam': 'COMPLETED',
          '02_findings': 'COMPLETED',
          '04_stage1': 'COMPLETED',
          '04_stage2': 'COMPLETED',
          '03_focus': 'COMPLETED',
          '05_agc1': 'COMPLETED',
          '05_agc2': 'COMPLETED',
          '06': 'COMPLETED',
          '06_via': 'COMPLETED',
          '07': 'COMPLETED',
          '08': 'IN_PROGRESS',
          '09': 'UPCOMING',
          '10': 'UPCOMING'
        }
      }
    } as unknown as MHCSession;

    const audit = auditMhcSession(session);
    expect(audit.blockers.length).toBe(0);
    expect(audit.readinessScore).toBe(100);
    expect(audit.isReadyForReport).toBe(true);
    expect(audit.nextAction.targetCode).toBe('09');
  });
});
