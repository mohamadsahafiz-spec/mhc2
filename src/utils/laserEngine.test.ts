/* =====================================================
   LASER ENGINE PARITY TESTS (laserEngine.test.ts)
   ===================================================== */
import { LaserEngine, formatLifeRemainingPercent, MachineDomain } from './laserEngine';

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

  log.push(`\nParity Validation Result: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  return { success: passed, log };
}
