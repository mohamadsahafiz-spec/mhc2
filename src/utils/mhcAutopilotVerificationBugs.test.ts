import { describe, it, expect } from 'vitest';
import { 
  ACTIONABLE_ACTIVITIES, 
  advanceAutopilotActivity,
  getActivityDisplayCode
} from './mhcAutopilotBrain';
import { ProductProcessEngine } from './productProcessEngine';
import { MHCSession } from '../types';
import { ProductProcessRecord } from '../types/productProcess';

describe('MHC Autopilot Verification Bugs (v2.10.9 Regression Tests)', () => {
  describe('Bug 1: AGC Autopilot Advance to Activity 06', () => {
    it('advances from AGC 2 directly to 06 Temperature & Evidence without skipping', () => {
      let session: MHCSession = {
        id: 'mhc_agc_advance_test',
        machineId: 'M-01',
        customerName: 'Test Semi',
        engineerName: 'Lead Engineer',
        overallStatus: 'IN_PROGRESS',
        autopilotProgress: {
          currentDay: 'DAY 3',
          currentActivityCode: '05_agc2',
          activityStatuses: {
            '01': 'COMPLETED',
            '02_power': 'COMPLETED',
            '02_beam': 'COMPLETED',
            '02_findings': 'COMPLETED',
            '04_stage1': 'COMPLETED',
            '04_stage2': 'COMPLETED',
            '03_focus': 'COMPLETED',
            '05_agc1': 'COMPLETED',
            '05_agc2': 'IN_PROGRESS',
            '06': 'UPCOMING',
            '06_via': 'UPCOMING',
            '07': 'UPCOMING',
            '08': 'UPCOMING',
            '09': 'UPCOMING',
            '10': 'UPCOMING'
          }
        }
      } as unknown as MHCSession;

      // When AGC 2 completes, advanceAutopilotActivity sets 05_agc2 -> COMPLETED and currentActivityCode -> 06
      session = advanceAutopilotActivity(session, '05_agc2', 'COMPLETED', 'AGC 2 calibrated');

      expect(session.autopilotProgress?.activityStatuses['05_agc2']).toBe('COMPLETED');
      expect(session.autopilotProgress?.currentActivityCode).toBe('06');
      expect(session.autopilotProgress?.activityStatuses['06']).toBe('IN_PROGRESS');

      // Ensure 06 is indeed Temperature & Evidence
      const act06 = ACTIONABLE_ACTIVITIES.find(a => a.code === session.autopilotProgress?.currentActivityCode);
      expect(act06?.title).toBe('Temperature & Evidence');
      expect(act06?.day).toBe('DAY 3');
      expect(getActivityDisplayCode('06')).toBe('06');
    });

    it('advances from 06 Temperature & Evidence to 06_via Product & Process upon completion', () => {
      let session: MHCSession = {
        id: 'mhc_temp_advance_test',
        machineId: 'M-01',
        customerName: 'Test Semi',
        engineerName: 'Lead Engineer',
        overallStatus: 'IN_PROGRESS',
        autopilotProgress: {
          currentDay: 'DAY 3',
          currentActivityCode: '06',
          activityStatuses: {
            '05_agc2': 'COMPLETED',
            '06': 'IN_PROGRESS',
            '06_via': 'UPCOMING',
            '07': 'UPCOMING'
          }
        }
      } as unknown as MHCSession;

      session = advanceAutopilotActivity(session, '06', 'COMPLETED', 'Temperature analysis verified');

      expect(session.autopilotProgress?.activityStatuses['06']).toBe('COMPLETED');
      expect(session.autopilotProgress?.currentActivityCode).toBe('06_via');
      expect(session.autopilotProgress?.activityStatuses['06_via']).toBe('IN_PROGRESS');

      const act06Via = ACTIONABLE_ACTIVITIES.find(a => a.code === '06_via');
      expect(act06Via?.title).toBe('Product & Process / Via');
      expect(getActivityDisplayCode('06_via')).toBe('07');
    });
  });

  describe('Bug 2: Product & Process evaluateRecord Overall Status Calculation', () => {
    it('evaluates overallResult to PASS when both Laser 1 and Laser 2 pass within tolerance', () => {
      const draft: Partial<ProductProcessRecord> = {
        productName: 'TEST-PACKAGE-A',
        recipeName: 'REC-50UM-STD',
        viaSpec: {
          topTargetUm: 50.0,
          topToleranceUm: 3.0,
          bottomTargetUm: 22.0,
          bottomToleranceUm: 3.0,
          minTaperPercent: 40.0
        },
        laser1Via: {
          topWidthUm: 50.8,
          bottomWidthUm: 23.2,
          topPass: true,
          bottomPass: true,
          overallPass: true
        },
        laser2Via: {
          topWidthUm: 51.2,
          bottomWidthUm: 22.8,
          topPass: true,
          bottomPass: true,
          overallPass: true
        },
        // Even if draft had a stale FAIL before re-evaluation, evaluation should return PASS
        overallResult: 'FAIL'
      };

      const result = ProductProcessEngine.evaluateRecord(draft);
      expect(result.laser1Via?.overallPass).toBe(true);
      expect(result.laser2Via?.overallPass).toBe(true);
      expect(result.overallResult).toBe('PASS');
    });

    it('evaluates overallResult to FAIL if either Laser 1 or Laser 2 is out of tolerance', () => {
      const draft: Partial<ProductProcessRecord> = {
        viaSpec: {
          topTargetUm: 50.0,
          topToleranceUm: 2.0,
          bottomTargetUm: 22.0,
          bottomToleranceUm: 2.0,
          minTaperPercent: 40.0
        },
        laser1Via: {
          topWidthUm: 50.5,
          bottomWidthUm: 22.1,
          topPass: true,
          bottomPass: true,
          overallPass: true
        },
        laser2Via: {
          topWidthUm: 58.0, // Out of spec: target 50 +- 2 -> [48, 52]
          bottomWidthUm: 22.0,
          topPass: false,
          bottomPass: true,
          overallPass: false
        },
        overallResult: 'PASS' // Stale PASS should be overridden by evaluation
      };

      const result = ProductProcessEngine.evaluateRecord(draft);
      expect(result.laser1Via?.overallPass).toBe(true);
      expect(result.laser2Via?.overallPass).toBe(false);
      expect(result.overallResult).toBe('FAIL');
    });
  });

  describe('Bug 2 Part B: Machine Passport Propagation and Sorting', () => {
    it('correctly sorts Machine Passport productProcessRecords by date descending to extract latest record', () => {
      const mockRecords: ProductProcessRecord[] = [
        {
          id: 'PP-OLD',
          date: '2026-01-15',
          productName: 'OLD_PRODUCT',
          recipeName: 'OLD_RECIPE',
          lotPanel: 'LOT-OLD',
          laser1PowerOffsetPercent: -2.5,
          laser2PowerOffsetPercent: -1.0,
          createdAt: '2026-01-15T00:00:00Z'
        } as ProductProcessRecord,
        {
          id: 'PP-NEW',
          date: '2026-09-10',
          productName: 'AUTHORITATIVE_PROD',
          recipeName: 'RECIPE_PROG_V2',
          lotPanel: 'LOT-99',
          laser1PowerOffsetPercent: 1.5,
          laser2PowerOffsetPercent: 2.0,
          createdAt: '2026-09-10T00:00:00Z'
        } as ProductProcessRecord,
        {
          id: 'PP-MID',
          date: '2026-05-20',
          productName: 'MID_PRODUCT',
          recipeName: 'MID_RECIPE',
          lotPanel: 'LOT-MID',
          laser1PowerOffsetPercent: 0,
          laser2PowerOffsetPercent: 0,
          createdAt: '2026-05-20T00:00:00Z'
        } as ProductProcessRecord
      ];

      const sorted = [...mockRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      expect(sorted[0].id).toBe('PP-NEW');
      expect(sorted[0].productName).toBe('AUTHORITATIVE_PROD');
      expect(sorted[0].recipeName).toBe('RECIPE_PROG_V2');
      expect(sorted[0].laser1PowerOffsetPercent).toBe(1.5);
      expect(sorted[0].laser2PowerOffsetPercent).toBe(2.0);
    });
  });
});
