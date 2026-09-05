/* =====================================================
   LASER ENGINE PARITY TESTS (laserEngine.test.ts)
   ===================================================== */
import { describe, it, expect } from 'vitest';
import { LaserEngine, formatLifeRemainingPercent, MachineDomain } from './laserEngine';

describe('LaserEngine', () => {
  it('passes all parity assertions', () => {
    const res = runLaserEngineParityTests();
    expect(res.success).toBe(true);
  });

  describe('Authoritative Backup Topology & Identity Precedence (Scenarios A-E)', () => {
    it('Scenario A: existing corrupted machine identity + correct backup -> correct identity', () => {
      const corruptedExisting = [
        {
          id: 'WD-19926',
          machineNo: 'WLVIA#RND',
          machineNumber: 'WLVIA#RND',
          serialNo: 'MC230023',
          model: 'UNKNOWN',
          lasers: [
            { id: 'WD-19926-L1', serialNo: 'MC230023-L1', baseLaserHour: 1000 }
          ]
        }
      ];

      const backupJson = JSON.stringify({
        machines: [
          {
            id: 'WD-19926',
            machineNumber: 'WLVIA#2',
            model: 'BMD250WM',
            serialNo: 'MC230023',
            lasers: [
              { id: 'WD-19926-L1', name: 'Laser Head 1', serialNo: 'MC230023-L1', baseLaserHour: 1200 },
              { id: 'WD-19926-L3868', name: 'Laser Head 2', serialNo: 'MC230023-L3868', baseLaserHour: 800 }
            ]
          }
        ]
      });

      const res = LaserEngine.parseAndMapLaserMonitorJson(backupJson, corruptedExisting, []);
      expect(res.mappedMachines.length).toBe(1);
      const m = res.mappedMachines[0];
      expect(m.machineNumber).toBe('WLVIA#2');
      expect(m.machineNo).toBe('WLVIA#2');
      expect(m.model).toBe('BMD250WM');
      expect(m.serialNo).toBe('MC230023');
      expect(m.lasers.length).toBe(2);
    });

    it('Scenario B: existing 2-head stale machine + authoritative 1-head backup -> exactly 1 head', () => {
      const staleExisting = [
        {
          id: 'WD-81810',
          machineNumber: 'WLVIA#002',
          serialNo: 'MC240005',
          lasers: [
            { id: 'WD-81810-L1', name: 'Laser Head 1', serialNo: 'MC240005-L1', baseLaserHour: 5000 },
            { id: 'WD-81810-L2-STALE', name: 'Stale Phantom Head', serialNo: 'MC240005-L2', baseLaserHour: 9999 }
          ]
        }
      ];

      const backupJson = JSON.stringify({
        machines: [
          {
            id: 'WD-81810',
            machineNumber: 'WLVIA#002',
            model: 'BMD250WM',
            serialNo: 'MC240005',
            lasers: [
              { id: 'WD-81810-L1', name: 'Laser Head 1', serialNo: 'MC240005-L1', baseLaserHour: 5100 }
            ]
          }
        ]
      });

      const res = LaserEngine.parseAndMapLaserMonitorJson(backupJson, staleExisting, []);
      expect(res.mappedMachines.length).toBe(1);
      const m = res.mappedMachines[0];
      expect(m.lasers.length).toBe(1);
      expect(m.lasers[0].id).toBe('WD-81810-L1');
      expect(m.lasers[0].baseLaserHour).toBe(5100);
      expect(m.lasers.some((l: any) => l.id === 'WD-81810-L2-STALE')).toBe(false);
    });

    it('Scenario C: existing 1-head machine + authoritative 2-head backup -> exactly 2 heads', () => {
      const singleHeadExisting = [
        {
          id: 'WD-77972',
          machineNumber: 'WLVIA#1',
          serialNo: 'MC23006',
          lasers: [
            { id: 'WD-77972-L1', name: 'Laser Head 1', serialNo: 'MC23006-L1', baseLaserHour: 8000 }
          ]
        }
      ];

      const backupJson = JSON.stringify({
        machines: [
          {
            id: 'WD-77972',
            machineNumber: 'WLVIA#1',
            model: 'BMD250WM',
            serialNo: 'MC23006',
            lasers: [
              { id: 'WD-77972-L1', name: 'Laser Head 1', serialNo: 'MC23006-L1', baseLaserHour: 8200 },
              { id: 'WD-77972-L9491', name: 'Laser Head 2', serialNo: 'MC23006-L9491', baseLaserHour: 4100 }
            ]
          }
        ]
      });

      const res = LaserEngine.parseAndMapLaserMonitorJson(backupJson, singleHeadExisting, []);
      expect(res.mappedMachines.length).toBe(1);
      const m = res.mappedMachines[0];
      expect(m.lasers.length).toBe(2);
      expect(m.lasers[0].id).toBe('WD-77972-L1');
      expect(m.lasers[1].id).toBe('WD-77972-L9491');
    });

    it('Scenario D: correct existing machine + same backup -> no duplicate heads and deduplicated cal history', () => {
      const existing = [
        {
          id: 'WD-44367',
          machineNumber: 'WLVIA#3',
          serialNo: 'MC230038',
          lasers: [
            {
              id: 'WD-44367-L1',
              name: 'Laser Head 1',
              serialNo: 'MC230038-L1',
              baseLaserHour: 15000,
              calibrationHistory: [
                { date: '2026-01-01', actualHour: 15000, estimatedHour: 14990, difference: 10, reason: 'Check', rating: 'Excellent' }
              ]
            },
            {
              id: 'WD-44367-L6293',
              name: 'Laser Head 2',
              serialNo: 'MC230038-L6293',
              baseLaserHour: 12000,
              calibrationHistory: []
            }
          ]
        }
      ];

      const backupJson = JSON.stringify({
        machines: [
          {
            id: 'WD-44367',
            machineNumber: 'WLVIA#3',
            model: 'BMD302W',
            serialNo: 'MC230038',
            lasers: [
              {
                id: 'WD-44367-L1',
                name: 'Laser Head 1',
                serialNo: 'MC230038-L1',
                baseLaserHour: 15500,
                calibrationHistory: [
                  { date: '2026-01-01', actualHour: 15000, estimatedHour: 14990, difference: 10, reason: 'Check', rating: 'Excellent' },
                  { date: '2026-02-01', actualHour: 15500, estimatedHour: 15495, difference: 5, reason: 'Monthly', rating: 'Excellent' }
                ]
              },
              {
                id: 'WD-44367-L6293',
                name: 'Laser Head 2',
                serialNo: 'MC230038-L6293',
                baseLaserHour: 12500,
                calibrationHistory: []
              }
            ]
          }
        ]
      });

      const res = LaserEngine.parseAndMapLaserMonitorJson(backupJson, existing, []);
      expect(res.mappedMachines.length).toBe(1);
      const m = res.mappedMachines[0];
      expect(m.lasers.length).toBe(2);
      expect(m.lasers[0].calibrationHistory.length).toBe(2);
      expect(m.lasers[0].baseLaserHour).toBe(15500);
    });

    it('Scenario E: all six supplied backup records survive import with correct identity, model, and head count', () => {
      const sixMachinesBackup = {
        version: '0.9.0',
        machines: [
          {
            id: 'WD-77972',
            machineNumber: 'WLVIA#1',
            model: 'BMD250WM',
            serialNo: 'MC23006',
            lasers: [
              { id: 'WD-77972-L1', name: 'Laser Head 1', serialNo: 'MC23006-L1', baseLaserHour: 10000 },
              { id: 'WD-77972-L9491', name: 'Laser Head 2', serialNo: 'MC23006-L9491', baseLaserHour: 9500 }
            ]
          },
          {
            id: 'WD-19926',
            machineNumber: 'WLVIA#2',
            model: 'BMD250WM',
            serialNo: 'MC230023',
            lasers: [
              { id: 'WD-19926-L1', name: 'Laser Head 1', serialNo: 'MC230023-L1', baseLaserHour: 11000 },
              { id: 'WD-19926-L3868', name: 'Laser Head 2', serialNo: 'MC230023-L3868', baseLaserHour: 10500 }
            ]
          },
          {
            id: 'WD-81810',
            machineNumber: 'WLVIA#002',
            model: 'BMD250WM',
            serialNo: 'MC240005',
            lasers: [
              { id: 'WD-81810-L1', name: 'Laser Head 1', serialNo: 'MC240005-L1', baseLaserHour: 4000 }
            ]
          },
          {
            id: 'WD-44367',
            machineNumber: 'WLVIA#3',
            model: 'BMD302W',
            serialNo: 'MC230038',
            lasers: [
              { id: 'WD-44367-L1', name: 'Laser Head 1', serialNo: 'MC230038-L1', baseLaserHour: 13000 },
              { id: 'WD-44367-L6293', name: 'Laser Head 2', serialNo: 'MC230038-L6293', baseLaserHour: 12800 }
            ]
          },
          {
            id: 'WD-35189',
            machineNumber: 'WLVIA#4',
            model: 'BMD302W',
            serialNo: 'MC230039',
            lasers: [
              { id: 'WD-35189-L1', name: 'Laser Head 1', serialNo: 'MC230039-L1', baseLaserHour: 14000 },
              { id: 'WD-35189-L7801', name: 'Laser Head 2', serialNo: 'MC230039-L7801', baseLaserHour: 13900 }
            ]
          },
          {
            id: 'WD-70784',
            machineNumber: 'WLVIA#5',
            model: 'BMD250WM',
            serialNo: 'MC250005',
            lasers: [
              { id: 'WD-70784-L1', name: 'Laser Head 1', serialNo: 'MC250005-L1', baseLaserHour: 3000 },
              { id: 'WD-70784-L8145', name: 'Laser Head 2', serialNo: 'MC250005-L8145', baseLaserHour: 2900 }
            ]
          }
        ]
      };

      const res = LaserEngine.parseAndMapLaserMonitorJson(JSON.stringify(sixMachinesBackup), [], []);
      expect(res.machinesFound).toBe(6);
      expect(res.mappedMachines.length).toBe(6);

      const byNo = new Map(res.mappedMachines.map((m: any) => [m.machineNumber, m]));
      expect(byNo.get('WLVIA#1')?.model).toBe('BMD250WM');
      expect(byNo.get('WLVIA#1')?.lasers.length).toBe(2);

      expect(byNo.get('WLVIA#2')?.model).toBe('BMD250WM');
      expect(byNo.get('WLVIA#2')?.lasers.length).toBe(2);

      expect(byNo.get('WLVIA#002')?.model).toBe('BMD250WM');
      expect(byNo.get('WLVIA#002')?.lasers.length).toBe(1);

      expect(byNo.get('WLVIA#3')?.model).toBe('BMD302W');
      expect(byNo.get('WLVIA#3')?.lasers.length).toBe(2);

      expect(byNo.get('WLVIA#4')?.model).toBe('BMD302W');
      expect(byNo.get('WLVIA#4')?.lasers.length).toBe(2);

      expect(byNo.get('WLVIA#5')?.model).toBe('BMD250WM');
      expect(byNo.get('WLVIA#5')?.lasers.length).toBe(2);
    });
  });
});

export function runLaserEngineParityTests(): { success: boolean; log: string[] } {
  const log: string[] = [];
  let passed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      log.push(`✅ PASS: ${message}`);
    } else {
      log.push(`❌ FAIL: ${message}`);
      passed = false;
    }
  }

  // 1. formatLifeRemainingPercent
  assert(formatLifeRemainingPercent(53.2) === '53%', 'formatLifeRemainingPercent >= 10% rounds to whole %');
  assert(formatLifeRemainingPercent(4.8) === '4.8%', 'formatLifeRemainingPercent between 1% and 10% format 1 decimal');
  assert(formatLifeRemainingPercent(0.5) === '0.5%', 'formatLifeRemainingPercent between 0% and 1% format 1 decimal');
  assert(formatLifeRemainingPercent(0) === '0%', 'formatLifeRemainingPercent 0 is 0%');
  assert(formatLifeRemainingPercent(-5) === '0%', 'formatLifeRemainingPercent negative is 0%');

  // 2. Estimated Hour Calculation (continuous 24h daily operation)
  const baseTs = '2026-01-01T00:00:00.000Z';
  const evalTs = '2026-01-02T12:00:00.000Z'; // 36 hours later
  const estHour = LaserEngine.calculateEstimatedHour(1000, baseTs, evalTs);
  assert(estHour === 1036, `calculateEstimatedHour: expected 1036, got ${estHour}`);

  // 3. Status determination & thresholds
  assert(LaserEngine.calculateLaserStatus(12000, 25000, 20000) === 'SAFE', 'Laser status SAFE (< warningLife)');
  assert(LaserEngine.calculateLaserStatus(21000, 25000, 20000) === 'WARNING', 'Laser status WARNING (>= warningLife)');
  assert(LaserEngine.calculateLaserStatus(25000, 25000, 20000) === 'ALARM', 'Laser status ALARM (>= ratedLife)');

  // 4. Missing baseline -> BASELINE_REQUIRED
  const missingBaseMetrics = LaserEngine.calculateLaserMetrics({
    id: 'L-1',
    name: 'Laser 1',
    serialNo: 'SN-1',
    baseLaserHour: null,
    baseTimestamp: null,
    ratedLife: 25000,
    warningLife: 20000
  }, evalTs);
  assert(missingBaseMetrics.status === 'BASELINE_REQUIRED', 'Missing baseline returns BASELINE_REQUIRED');
  assert(missingBaseMetrics.baselineRequired === true, 'baselineRequired flag is true');

  // 5. Single Laser Head Metrics
  const validMetrics = LaserEngine.calculateLaserMetrics({
    id: 'L-1',
    name: 'Laser 1',
    serialNo: 'SN-1',
    baseLaserHour: 10000,
    baseTimestamp: '2026-01-01T00:00:00.000Z',
    ratedLife: 25000,
    warningLife: 20000,
    lastRecalibrationDate: '2026-01-01T00:00:00.000Z'
  }, '2026-01-01T00:00:00.000Z');

  assert(validMetrics.currentHour === 10000, 'Current hour equals baseLaserHour at baseTimestamp');
  assert(validMetrics.remainingTotal === 15000, 'Remaining total hours = ratedLife - currentHour');
  assert(validMetrics.status === 'SAFE', 'Status is SAFE at 10k hours');
  assert(validMetrics.lifeRemainingPercent === 60, 'Life remaining % is 60%');

  // 6. Worst State Machine Aggregation (ALARM > BASELINE_REQUIRED > WARNING > SAFE)
  const testMachine: MachineDomain = {
    id: 'M-1',
    machineNo: 'WD-101',
    lasers: [
      {
        id: 'L-1',
        name: 'Laser Head 1',
        serialNo: 'SN-1',
        baseLaserHour: 10000,
        baseTimestamp: baseTs,
        ratedLife: 25000,
        warningLife: 20000
      },
      {
        id: 'L-2',
        name: 'Laser Head 2',
        serialNo: 'SN-2',
        baseLaserHour: 25000, // ALARM
        baseTimestamp: baseTs,
        ratedLife: 25000,
        warningLife: 20000
      }
    ]
  };

  const machineMetrics = LaserEngine.calculateMachineMetrics(testMachine, baseTs);
  assert(machineMetrics.status === 'ALARM', 'Machine worst state wins (L-2 is ALARM)');
  assert(machineMetrics.mostCriticalLaser.id === 'L-2', 'Most critical laser identified as L-2');

  // 7. Recalibration Transaction
  const recalResult = LaserEngine.executeRecalibration(testMachine, 'L-1', 10005, 'Routine Verification', baseTs);
  assert(recalResult.analysis.actualHour === 10005, 'Recalibration actual hour recorded');
  assert(recalResult.analysis.difference === 5, 'Deviation calculation = actual - estimated (10005 - 10000 = 5)');
  assert(recalResult.analysis.ratingInfo.label === 'Excellent', 'Deviation <= 10 hrs yields Excellent rating');
  assert(recalResult.updatedMachine.lasers![0].baseLaserHour === 10005, 'Base laser hour updated to physical meter reading');
  assert(recalResult.updatedMachine.lasers![0].calibrationHistory!.length === 1, 'Calibration history entry recorded');

  // 8. Lifecycle Recommendation Wording & Status Consistency
  const rated = 25000;
  const warn = 20000;
  const testCases = [
    { hr: 5000, expectedStatus: 'SAFE', mustInclude: ['Nominal tube health', 'below warning threshold'], mustNotInclude: ['Approaching warning threshold', 'Warning threshold reached/exceeded', 'lifespan reached'] },
    { hr: 19000, expectedStatus: 'SAFE', mustInclude: ['Mid-to-late life phase', 'below warning threshold'], mustNotInclude: ['Approaching warning threshold', 'Warning threshold reached/exceeded', 'lifespan reached'] },
    { hr: 20000, expectedStatus: 'WARNING', mustInclude: ['Warning threshold reached/exceeded', 'approaching rated EOL'], mustNotInclude: ['Approaching warning threshold', 'below warning threshold', 'lifespan reached'] },
    { hr: 21688.9, expectedStatus: 'WARNING', mustInclude: ['Warning threshold reached/exceeded', 'approaching rated EOL'], mustNotInclude: ['Approaching warning threshold', 'below warning threshold'] },
    { hr: 22375.7, expectedStatus: 'WARNING', mustInclude: ['Warning threshold reached/exceeded', 'approaching rated EOL'], mustNotInclude: ['Approaching warning threshold', 'below warning threshold'] },
    { hr: 24000, expectedStatus: 'WARNING', mustInclude: ['Warning threshold reached/exceeded', 'approaching rated EOL'], mustNotInclude: ['Approaching warning threshold', 'below warning threshold'] },
    { hr: 25000, expectedStatus: 'ALARM', mustInclude: ['Rated operating lifespan reached/exceeded', 'refurbishment or swap'], mustNotInclude: ['approaching', 'below warning threshold'] },
    { hr: 26000, expectedStatus: 'ALARM', mustInclude: ['Rated operating lifespan reached/exceeded', 'refurbishment or swap'], mustNotInclude: ['approaching', 'below warning threshold'] }
  ];

  for (const tc of testCases) {
    const status = LaserEngine.calculateLaserStatus(tc.hr, rated, warn);
    assert(status === tc.expectedStatus, `LaserEngine status for ${tc.hr}h is ${tc.expectedStatus}`);
    const rec = LaserEngine.calculateLaserLifecycleRecommendation({
      currentHour: tc.hr,
      ratedLife: rated,
      warningLife: warn,
      estimatedEolDate: '2026-12-31'
    });
    for (const inc of tc.mustInclude) {
      assert(rec.includes(inc), `Recommendation for ${tc.hr}h (${status}) includes "${inc}"`);
    }
    for (const notInc of tc.mustNotInclude) {
      assert(!rec.includes(notInc), `Recommendation for ${tc.hr}h (${status}) does NOT include "${notInc}"`);
    }
  }

  log.push(`\nParity Validation Result: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  return { success: passed, log };
}
