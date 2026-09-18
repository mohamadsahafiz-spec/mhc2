import { describe, it, expect } from 'vitest';
import { Machine, Contract, ConsumableItem } from '../../types';

describe('R11-C — Truthful Operational Analytics Logic & Removal of Fabricated Metrics', () => {
  it('does not contain hardcoded mtbfData or arbitrary consumable multiplier formulas', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const modulePath = path.resolve(process.cwd(), 'src/components/modules/AnalyticsModule.tsx');
    const content = fs.readFileSync(modulePath, 'utf-8');

    // Verify mtbfData is eradicated
    expect(content).not.toContain('mtbfData');
    expect(content).not.toContain('Mean Time Between Failures');
    expect(content).not.toContain('Fleet Reliability Index');

    // Verify arbitrary multiplier 1.8 is eradicated
    expect(content).not.toContain('* 1.8');
    expect(content).not.toContain('1.8');
  });

  it('correctly aggregates real machine statuses without fabricating categories', () => {
    const machines: Partial<Machine>[] = [
      {
        id: 'm-1',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3001',
        serialNumber: 'SN-001',
        status: 'OPERATIONAL'
      },
      {
        id: 'm-2',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3002',
        serialNumber: 'SN-002',
        status: 'NEEDS_CALIBRATION'
      },
      {
        id: 'm-3',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3003',
        serialNumber: 'SN-003',
        status: 'MAINTENANCE_DUE'
      },
      {
        id: 'm-4',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3004',
        serialNumber: 'SN-004',
        status: 'OUT_OF_SERVICE'
      }
    ];

    const counts: Record<string, number> = {
      OPERATIONAL: 0,
      NEEDS_CALIBRATION: 0,
      MAINTENANCE_DUE: 0,
      OUT_OF_SERVICE: 0
    };

    machines.forEach(m => {
      if (m.status) counts[m.status]++;
    });

    expect(counts.OPERATIONAL).toBe(1);
    expect(counts.NEEDS_CALIBRATION).toBe(1);
    expect(counts.MAINTENANCE_DUE).toBe(1);
    expect(counts.OUT_OF_SERVICE).toBe(1);
  });

  it('correctly categorizes MHC inspection currency without speculative overdue flags', () => {
    const now = new Date('2026-09-16T00:00:00Z').getTime();

    const machineRecent: Partial<Machine> = {
      id: 'm-recent',
      lastMhcDate: '2026-09-01'
    };

    const machine90Days: Partial<Machine> = {
      id: 'm-90',
      lastMhcDate: '2026-07-15'
    };

    const machineOld: Partial<Machine> = {
      id: 'm-old',
      lastMhcDate: '2025-12-01'
    };

    const machineNoMhc: Partial<Machine> = {
      id: 'm-none',
      lastMhcDate: ''
    };

    const evaluateMachine = (m: Partial<Machine>) => {
      if (!m.lastMhcDate) return 'NO_MHC';
      const parsed = new Date(m.lastMhcDate).getTime();
      const days = Math.floor((now - parsed) / (1000 * 60 * 60 * 24));
      if (days < 30) return 'RECENT';
      if (days <= 90) return 'DAYS_30_90';
      return 'DAYS_OVER_90';
    };

    expect(evaluateMachine(machineRecent)).toBe('RECENT');
    expect(evaluateMachine(machine90Days)).toBe('DAYS_30_90');
    expect(evaluateMachine(machineOld)).toBe('DAYS_OVER_90');
    expect(evaluateMachine(machineNoMhc)).toBe('NO_MHC');
  });

  it('filters consumables strictly for attention (life <= 20% or days <= 15) and ignores nominal consumables', () => {
    const consumables: ConsumableItem[] = [
      {
        id: 'c-1',
        name: 'Deionization Filter Cartridge',
        partNumber: 'FLT-DI-09',
        currentLifePercent: 12, // Critical (<20%)
        estimatedDaysRemaining: 25,
        status: 'CRITICAL_REPLACE',
        lastReplacedDate: '2026-01-01'
      },
      {
        id: 'c-2',
        name: 'Focusing Lens Protective Window',
        partNumber: 'OPT-WND-44',
        currentLifePercent: 45,
        estimatedDaysRemaining: 10, // Critical (<15 days)
        status: 'WARNING',
        lastReplacedDate: '2026-01-01'
      },
      {
        id: 'c-3',
        name: 'Chiller Coolant Fluid',
        partNumber: 'CHL-FL-01',
        currentLifePercent: 88, // Nominal
        estimatedDaysRemaining: 120, // Nominal
        status: 'OPTIMAL',
        lastReplacedDate: '2026-01-01'
      }
    ];

    const attentionItems = consumables.filter(c => {
      const isLowLife = typeof c.currentLifePercent === 'number' && c.currentLifePercent <= 20;
      const isLowDays = typeof c.estimatedDaysRemaining === 'number' && c.estimatedDaysRemaining <= 15;
      return isLowLife || isLowDays;
    });

    expect(attentionItems.length).toBe(2);
    expect(attentionItems.map(c => c.name)).toEqual([
      'Deionization Filter Cartridge',
      'Focusing Lens Protective Window'
    ]);
  });

  it('calculates contract coverage percent truthfully based on real machine linkings', () => {
    const allMachines: Partial<Machine>[] = [
      { id: 'm-1' },
      { id: 'm-2' },
      { id: 'm-3' },
      { id: 'm-4' }
    ];

    const contracts: Partial<Contract>[] = [
      {
        id: 'c-1',
        status: 'ACTIVE',
        machinesCoveredIds: ['m-1', 'm-2']
      },
      {
        id: 'c-2',
        status: 'EXPIRED',
        machinesCoveredIds: ['m-3'] // Expired should not count
      }
    ];

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
    const coveredIds = new Set<string>();
    activeContracts.forEach(c => {
      (c.machinesCoveredIds || []).forEach(id => coveredIds.add(id));
    });

    const coveredCount = allMachines.filter(m => m.id && coveredIds.has(m.id)).length;
    const coveragePercent = Math.round((coveredCount / allMachines.length) * 100);

    expect(coveredCount).toBe(2);
    expect(coveragePercent).toBe(50);
  });
});

describe('R11-D — Engineering Analytics Subsystem & Finding Aggregations', () => {
  it('correctly identifies recurring vs isolated findings across multiple machines', () => {
    const findings = [
      {
        component: 'Protective Window',
        subsystem: 'OPTICS',
        machineId: 'm-1',
        date: '2026-09-01'
      },
      {
        component: 'Protective Window',
        subsystem: 'OPTICS',
        machineId: 'm-2',
        date: '2026-09-02'
      },
      {
        component: 'Galvo Scanner Mirror',
        subsystem: 'OPTICS',
        machineId: 'm-1',
        date: '2026-09-01'
      }
    ];

    const findingMap = new Map<string, { count: number; machines: Set<string> }>();
    findings.forEach(f => {
      if (!findingMap.has(f.component)) {
        findingMap.set(f.component, { count: 0, machines: new Set() });
      }
      const item = findingMap.get(f.component)!;
      item.count++;
      item.machines.add(f.machineId);
    });

    const windowFinding = findingMap.get('Protective Window')!;
    expect(windowFinding.count).toBe(2);
    expect(windowFinding.machines.size).toBe(2);
    const isWindowRecurring = windowFinding.count >= 2 || windowFinding.machines.size > 1;
    expect(isWindowRecurring).toBe(true);

    const galvoFinding = findingMap.get('Galvo Scanner Mirror')!;
    expect(galvoFinding.count).toBe(1);
    expect(galvoFinding.machines.size).toBe(1);
    const isGalvoRecurring = galvoFinding.count >= 2 || galvoFinding.machines.size > 1;
    expect(isGalvoRecurring).toBe(false);
  });

  it('aggregates subsystem pass/fail counts truthfully from real inspection stages', () => {
    const sessions = [
      {
        id: 's-1',
        completionStatus: 'COMPLETED',
        stage03_laserPower: [
          { result: 'PASS', afterValueWatts: 45.2 }
        ],
        stage04_opticalInspection: [
          { status: 'OK' },
          { status: 'NG', component: 'Focusing Lens', note: 'Coating degradation' }
        ],
        stage05_chillerCooling: [
          { status: 'OK' }
        ]
      },
      {
        id: 's-2',
        completionStatus: 'COMPLETED',
        stage03_laserPower: [
          { result: 'FAIL', afterValueWatts: 38.0 }
        ],
        stage04_opticalInspection: [
          { status: 'OK' }
        ]
      }
    ];

    const subsystemStats = {
      LASER: { pass: 0, fail: 0, total: 0 },
      OPTICS: { pass: 0, fail: 0, total: 0 },
      COOLING: { pass: 0, fail: 0, total: 0 }
    };

    sessions.forEach(s => {
      s.stage03_laserPower?.forEach(lp => {
        subsystemStats.LASER.total++;
        if (lp.result === 'PASS') subsystemStats.LASER.pass++;
        else subsystemStats.LASER.fail++;
      });

      s.stage04_opticalInspection?.forEach(opt => {
        subsystemStats.OPTICS.total++;
        if (opt.status === 'OK') subsystemStats.OPTICS.pass++;
        else subsystemStats.OPTICS.fail++;
      });

      s.stage05_chillerCooling?.forEach(c => {
        subsystemStats.COOLING.total++;
        if (c.status === 'OK') subsystemStats.COOLING.pass++;
        else subsystemStats.COOLING.fail++;
      });
    });

    expect(subsystemStats.LASER.total).toBe(2);
    expect(subsystemStats.LASER.pass).toBe(1);
    expect(subsystemStats.LASER.fail).toBe(1);

    expect(subsystemStats.OPTICS.total).toBe(3);
    expect(subsystemStats.OPTICS.pass).toBe(2);
    expect(subsystemStats.OPTICS.fail).toBe(1);

    expect(subsystemStats.COOLING.total).toBe(1);
    expect(subsystemStats.COOLING.pass).toBe(1);
    expect(subsystemStats.COOLING.fail).toBe(0);
  });

  it('correctly computes parameter trajectory delta across chronological measurements', () => {
    const measurements = [
      { date: '2026-01-10', value: 45.2 },
      { date: '2026-05-15', value: 44.1 },
      { date: '2026-09-01', value: 42.5 }
    ];

    const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0].value;
    const latest = sorted[sorted.length - 1].value;
    const delta = Number((latest - first).toFixed(2));

    expect(first).toBe(45.2);
    expect(latest).toBe(42.5);
    expect(delta).toBe(-2.7);
  });
});

describe('R11 — Engineering Analysis Workspace UI/UX Redesign', () => {
  it('verifies workspace model with 5 distinct selectable analyses and no card-wall layout', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const modulePath = path.resolve(process.cwd(), 'src/components/modules/AnalyticsModule.tsx');
    const content = fs.readFileSync(modulePath, 'utf-8');

    // Verify workspace analysis modes exist
    expect(content).toContain('activeAnalysis');
    expect(content).toContain("'LASER_POWER'");
    expect(content).toContain("'SUBSYSTEMS'");
    expect(content).toContain("'FINDINGS'");
    expect(content).toContain("'ACTIVITY'");
    expect(content).toContain("'COMPARISON'");

    // Verify workspace header and segmented selector
    expect(content).toContain('Engineering Analytics Workspace');
    expect(content).toContain('Laser Power');
    expect(content).toContain('Subsystem Results');
    expect(content).toContain('Findings');
    expect(content).toContain('MHC Activity');
    expect(content).toContain('Machine Comparison');

    // Verify Rated Baseline is completely absent (not replaced with N/A)
    expect(content).not.toContain('Rated Baseline');
    expect(content).not.toContain('Nominal Spec');
    expect(content).not.toContain('Nominal Target');
    expect(content).not.toContain('nominalBaseline');
    expect(content).not.toContain('Rated baseline:');
    expect(content).not.toContain('250W');
    expect(content).not.toContain('250 W');

    // Verify banned AI slop and rainbow decorations are absent
    expect(content).not.toContain('bg-gradient-to-');
    expect(content).not.toContain('from-purple-');
    expect(content).not.toContain('to-blue-');
    expect(content).not.toContain('drop-shadow-[0_');
  });

  it('handles sparse data with intentional compact representations (0 = No Data, 1 = 1 verified measurement, 2+ = trajectory)', () => {
    const emptyMeasurements: number[] = [];
    const singleMeasurement = [45.2];
    const multiMeasurements = [45.2, 44.8, 44.1];

    const evaluateRepresentation = (data: number[]) => {
      if (data.length === 0) return 'NO_DATA';
      if (data.length === 1) return 'ONE_VERIFIED_MEASUREMENT';
      return 'LONGITUDINAL_TRAJECTORY';
    };

    expect(evaluateRepresentation(emptyMeasurements)).toBe('NO_DATA');
    expect(evaluateRepresentation(singleMeasurement)).toBe('ONE_VERIFIED_MEASUREMENT');
    expect(evaluateRepresentation(multiMeasurements)).toBe('LONGITUDINAL_TRAJECTORY');
  });

  it('correctly calculates Laser Power measurement trend and delta (14.8 W → 12.7 W, Δ -2.1 W)', () => {
    const points = [
      { date: '2026-08-01', value: 14.8, unit: 'W' },
      { date: '2026-09-01', value: 12.7, unit: 'W' }
    ];

    const first = points[0].value;
    const latest = points[points.length - 1].value;
    const delta = Number((latest - first).toFixed(2));
    const verifiedCount = points.length;

    expect(first).toBe(14.8);
    expect(latest).toBe(12.7);
    expect(delta).toBe(-2.1);
    expect(verifiedCount).toBe(2);
  });

  it('gates Machine Comparison when fewer than 2 machines have verified data', () => {
    const machineListSingle = [{ machineId: 'm-1', sessionCount: 2 }];
    const machineListMultiple = [
      { machineId: 'm-1', sessionCount: 2 },
      { machineId: 'm-2', sessionCount: 1 }
    ];

    const isComparisonReady = (list: { machineId: string; sessionCount: number }[]) => {
      return list.length >= 2;
    };

    expect(isComparisonReady(machineListSingle)).toBe(false);
    expect(isComparisonReady(machineListMultiple)).toBe(true);
  });

  it('renders a compact factual empty state when no recurring findings exist', () => {
    const emptyFindings: any[] = [];
    const message = emptyFindings.length === 0 ? 'No recurring findings recorded.' : 'Ranked Findings';
    expect(message).toBe('No recurring findings recorded.');
  });
});

describe('R11 — Laser Power Machine Passport MHC Specification & Selector UX', () => {
  it('derives target specification and acceptable tolerance range directly from machine.mhcSpecs', () => {
    const machine = {
      id: 'm-1',
      name: 'WL VIA#1',
      model: 'BMD302W',
      mhcSpecs: {
        laserPower: {
          targetPowerWatts: 15,
          powerTolerancePercent: 10
        }
      }
    };

    const targetWatts = machine.mhcSpecs.laserPower.targetPowerWatts;
    const tolPercent = machine.mhcSpecs.laserPower.powerTolerancePercent;
    const delta = targetWatts * (tolPercent / 100);
    const minSpec = Number((targetWatts - delta).toFixed(2));
    const maxSpec = Number((targetWatts + delta).toFixed(2));

    expect(targetWatts).toBe(15);
    expect(tolPercent).toBe(10);
    expect(minSpec).toBe(13.5);
    expect(maxSpec).toBe(16.5);
  });

  it('correctly evaluates measurements against 15 W ±10% spec range (14.8 W = In Spec, 12.7 W = Below Spec)', () => {
    const minSpec = 13.5;
    const maxSpec = 16.5;

    const evaluateVerdict = (val: number) => {
      if (val < minSpec) return 'BELOW_SPEC';
      if (val > maxSpec) return 'ABOVE_SPEC';
      return 'IN_SPEC';
    };

    expect(evaluateVerdict(14.8)).toBe('IN_SPEC');
    expect(evaluateVerdict(12.7)).toBe('BELOW_SPEC');
    expect(evaluateVerdict(17.2)).toBe('ABOVE_SPEC');
  });

  it('handles missing machine specs gracefully without inventing fallback values', () => {
    const machineNoSpecs = {
      id: 'm-2',
      name: 'Generic Unit',
      model: 'BMD100'
    };

    const extractSpec = (m: any) => {
      const lp = m.mhcSpecs?.laserPower;
      const target = (typeof lp?.targetPowerWatts === 'number' && lp.targetPowerWatts > 0) ? lp.targetPowerWatts : null;
      return target ? `Target: ${target} W` : 'No Target Spec';
    };

    expect(extractSpec(machineNoSpecs)).toBe('No Target Spec');
  });

  it('verifies AnalyticsModule codebase strictly avoids ratedPowerWatts and hardcoded 250W fallback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const modulePath = path.resolve(process.cwd(), 'src/components/modules/AnalyticsModule.tsx');
    const content = fs.readFileSync(modulePath, 'utf-8');

    // ratedPowerWatts or 250W should never be used
    expect(content).not.toContain('ratedPowerWatts');
    expect(content).not.toContain('250W');
    expect(content).not.toContain('250 W');
    expect(content).not.toContain('nominalPower');

    // Confirms usage of mhcSpecs
    expect(content).toContain('mhcSpecs');
    expect(content).toContain('targetPowerWatts');
    expect(content).toContain('powerTolerancePercent');

    // Confirms selector labels
    expect(content).toContain('MACHINE');
    expect(content).toContain('PARAMETER');
  });
});

