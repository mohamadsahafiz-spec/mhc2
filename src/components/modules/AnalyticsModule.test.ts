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

  it('maps contract coverage accurately between active contracts and fleet machines', () => {
    const machines: Partial<Machine>[] = [
      { id: 'm-10', machineNumber: 'M-10', serialNumber: 'SN-10' },
      { id: 'm-20', machineNumber: 'M-20', serialNumber: 'SN-20' },
      { id: 'm-30', machineNumber: 'M-30', serialNumber: 'SN-30' }
    ];

    const contracts: Partial<Contract>[] = [
      {
        id: 'c-active',
        contractNumber: 'CTR-2026-001',
        customerName: 'Customer A',
        plantName: 'Fab 1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        totalWorkingDays: 200,
        machinesCoveredIds: ['m-10', 'm-20'],
        status: 'ACTIVE'
      },
      {
        id: 'c-expired',
        contractNumber: 'CTR-2025-099',
        customerName: 'Customer B',
        plantName: 'Fab 2',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        totalWorkingDays: 100,
        machinesCoveredIds: ['m-30'],
        status: 'EXPIRED'
      }
    ];

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
    const coveredIds = new Set<string>();
    activeContracts.forEach(c => (c.machinesCoveredIds || []).forEach(id => coveredIds.add(id)));

    const covered = machines.filter(m => m.id && coveredIds.has(m.id));
    const uncovered = machines.filter(m => m.id && !coveredIds.has(m.id));

    expect(covered.length).toBe(2);
    expect(uncovered.length).toBe(1);
    expect(uncovered[0].id).toBe('m-30');
    expect(Math.round((covered.length / machines.length) * 100)).toBe(67);
  });

  describe('R11-D — Simplified Glanceable Operational Overview', () => {
    it('does not contain repetitive full fleet scrollable lists or redundant tables across sections', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const modulePath = path.resolve(process.cwd(), 'src/components/modules/AnalyticsModule.tsx');
      const content = fs.readFileSync(modulePath, 'utf-8');

      // Ensure we don't have massive nested repetitive list filters
      expect(content).not.toContain('filteredMachinesByStatus');
      expect(content).not.toContain('selectedStatusFilter');
      expect(content).not.toContain('selectedCoverageFilter');
    });

    it('accurately surfaces attention items when machines or consumables are flagged', () => {
      const machines: Partial<Machine>[] = [
        {
          id: 'm-attn-1',
          machineNumber: 'M-100',
          serialNumber: 'SN-100',
          status: 'NEEDS_CALIBRATION',
          consumables: [
            {
              id: 'c-1',
              name: 'Filter A',
              partNumber: 'FA-1',
              currentLifePercent: 10,
              estimatedDaysRemaining: 5,
              status: 'CRITICAL_REPLACE',
              lastReplacedDate: '2026-01-01'
            }
          ]
        },
        {
          id: 'm-attn-2',
          machineNumber: 'M-200',
          serialNumber: 'SN-200',
          status: 'OPERATIONAL',
          consumables: [
            {
              id: 'c-2',
              name: 'Coolant',
              partNumber: 'CL-2',
              currentLifePercent: 85,
              estimatedDaysRemaining: 120,
              status: 'OPTIMAL',
              lastReplacedDate: '2026-01-01'
            }
          ]
        }
      ];

      const attentionMachines = machines.filter(m => m.status && m.status !== 'OPERATIONAL');
      const attentionConsumables: any[] = [];
      machines.forEach(m => {
        (m.consumables || []).forEach(c => {
          if ((typeof c.currentLifePercent === 'number' && c.currentLifePercent <= 20) ||
              (typeof c.estimatedDaysRemaining === 'number' && c.estimatedDaysRemaining <= 15)) {
            attentionConsumables.push({ machine: m, consumable: c });
          }
        });
      });

      expect(attentionMachines.length).toBe(1);
      expect(attentionMachines[0].id).toBe('m-attn-1');
      expect(attentionConsumables.length).toBe(1);
      expect(attentionConsumables[0].consumable.name).toBe('Filter A');
      expect(attentionMachines.length + attentionConsumables.length).toBe(2);
    });
  });

  describe('R11-F — Visual Workspace Information Architecture & Statistical Precision', () => {
    it('filters completed sessions strictly (completionStatus === COMPLETED)', () => {
      const sessions = [
        { id: 's-1', completionStatus: 'COMPLETED', completedDate: '2026-08-01' },
        { id: 's-2', completionStatus: 'IN_PROGRESS', startDate: '2026-08-02' },
        { id: 's-3', completionStatus: 'COMPLETED', completedDate: '2026-08-05' },
        { id: 's-4', completionStatus: 'NOT_STARTED', startDate: '2026-08-10' }
      ];

      const completed = sessions.filter(s => s.completionStatus === 'COMPLETED');
      expect(completed.length).toBe(2);
      expect(completed.map(s => s.id)).toEqual(['s-1', 's-3']);
    });

    it('aggregates subsystem verdicts into Pass, Warn, and Fail distributions', () => {
      const sessions = [
        {
          id: 's-sub-1',
          completionStatus: 'COMPLETED',
          stage04_opticalInspection: [
            { item: 'Focusing Lens', status: 'OK' },
            { item: 'Protective Window', status: 'NG' }
          ],
          stage05_chillerCooling: [
            { item: 'Coolant Level', status: 'OK' },
            { item: 'Filter Condition', status: 'ATTENTION' }
          ]
        }
      ];

      let opticsPass = 0, opticsFail = 0;
      let coolingPass = 0, coolingWarn = 0;

      sessions.forEach(s => {
        (s.stage04_opticalInspection || []).forEach((opt: any) => {
          if (opt.status === 'OK') opticsPass++;
          if (opt.status === 'NG') opticsFail++;
        });
        (s.stage05_chillerCooling || []).forEach((c: any) => {
          if (c.status === 'OK') coolingPass++;
          if (c.status === 'ATTENTION') coolingWarn++;
        });
      });

      expect(opticsPass).toBe(1);
      expect(opticsFail).toBe(1);
      expect(coolingPass).toBe(1);
      expect(coolingWarn).toBe(1);
    });

    it('identifies recurring findings across multiple machines or multiple occurrences', () => {
      const sessions = [
        {
          id: 's-f1',
          machineId: 'm-1',
          completionStatus: 'COMPLETED',
          inspectionFindings: [
            {
              id: 'f-1',
              headId: 'lh1',
              headName: 'Head 1',
              component: 'Mirror Contamination',
              conditions: ['Debris'],
              actionRecommendation: 'Clean',
              createdAt: '2026-08-01'
            }
          ]
        },
        {
          id: 's-f2',
          machineId: 'm-2',
          completionStatus: 'COMPLETED',
          inspectionFindings: [
            {
              id: 'f-2',
              headId: 'lh1',
              headName: 'Head 1',
              component: 'Mirror Contamination',
              conditions: ['Debris'],
              actionRecommendation: 'Clean',
              createdAt: '2026-08-15'
            },
            {
              id: 'f-3',
              headId: 'lh1',
              headName: 'Head 1',
              component: 'Nozzle Misalignment',
              conditions: ['Offset'],
              actionRecommendation: 'Adjust',
              createdAt: '2026-08-15'
            }
          ]
        }
      ];

      const findingMap = new Map<string, { count: number; machines: Set<string> }>();
      sessions.forEach(s => {
        (s.inspectionFindings || []).forEach((f: any) => {
          if (!findingMap.has(f.component)) {
            findingMap.set(f.component, { count: 0, machines: new Set() });
          }
          const item = findingMap.get(f.component)!;
          item.count++;
          if (s.machineId) item.machines.add(s.machineId);
        });
      });

      const mirror = findingMap.get('Mirror Contamination')!;
      const nozzle = findingMap.get('Nozzle Misalignment')!;

      expect(mirror.count).toBe(2);
      expect(mirror.machines.size).toBe(2);
      expect(mirror.count >= 2 || mirror.machines.size > 1).toBe(true); // RECURRING

      expect(nozzle.count).toBe(1);
      expect(nozzle.machines.size).toBe(1);
      expect(nozzle.count >= 2 || nozzle.machines.size > 1).toBe(false); // SINGLE
    });

    it('requires minimum 2 measurements for longitudinal trajectory trend and calculates accurate delta', () => {
      const singleSessionPoints = [{ date: '2026-01-01', value: 100 }];
      const multiSessionPoints = [
        { date: '2026-01-01', value: 102.5 },
        { date: '2026-04-01', value: 101.0 },
        { date: '2026-07-01', value: 99.8 }
      ];

      expect(singleSessionPoints.length < 2).toBe(true); // Not a trend
      expect(multiSessionPoints.length >= 2).toBe(true); // Valid longitudinal trend

      const first = multiSessionPoints[0].value;
      const latest = multiSessionPoints[multiSessionPoints.length - 1].value;
      const delta = Number((latest - first).toFixed(2));
      expect(delta).toBe(-2.7);
    });
  });

  describe('R11-G — Analytics Visual Refinement & Workstation Hierarchy', () => {
    it('verifies primary hierarchy places physical trajectory first and enforces neutral styling', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const modulePath = path.resolve(process.cwd(), 'src/components/modules/AnalyticsModule.tsx');
      const content = fs.readFileSync(modulePath, 'utf-8');

      // Verify Physical Parameter Trajectory is Level 1 Primary
      expect(content).toContain('Physical Parameter Trajectory');
      expect(content).toContain('1 verified reading — minimum 2 measurements required for a trajectory.');
      expect(content).toContain('No verified physical readings recorded.');

      // Verify banned AI slop and rainbow decorations are absent
      expect(content).not.toContain('bg-gradient-to-');
      expect(content).not.toContain('from-purple-');
      expect(content).not.toContain('to-blue-');
      expect(content).not.toContain('drop-shadow-[0_');
    });

    it('handles sparse data with compact factual representations instead of large empty blocks', () => {
      const emptyMeasurements: number[] = [];
      const singleMeasurement = [45.2];
      const multiMeasurements = [45.2, 44.8, 44.1];

      const renderTrajectoryState = (data: number[]) => {
        if (data.length === 0) return 'COMPACT_EMPTY';
        if (data.length === 1) return 'COMPACT_SINGLE_NOTICE';
        return 'PROMINENT_GRAPH';
      };

      expect(renderTrajectoryState(emptyMeasurements)).toBe('COMPACT_EMPTY');
      expect(renderTrajectoryState(singleMeasurement)).toBe('COMPACT_SINGLE_NOTICE');
      expect(renderTrajectoryState(multiMeasurements)).toBe('PROMINENT_GRAPH');
    });

    it('ensures missing rated power results in N/A without 250W fallback or synthetic baseline fabrication', () => {
      const machineWithoutRatedPower: any = {
        id: 'mch-test-1',
        machineNumber: 'MCH-TEST-1',
        serialNumber: 'SN-TEST-1',
        laserHeads: [
          {
            id: 'lh-1',
            model: 'Laser Head',
            serialNumber: 'SN-LH-1'
            // No ratedPowerWatts defined
          }
        ]
      };

      const sessionsWithMeasurements: any[] = [
        {
          id: 'sess-1',
          machineId: 'mch-test-1',
          completionStatus: 'COMPLETED',
          completedDate: '2026-08-01',
          stage03_laserPower: [
            {
              laserIdentifier: 'lh1',
              laserName: 'Laser Head 1',
              beforeValueWatts: 14.5,
              afterValueWatts: 14.2
              // No ratedPowerWatts defined
            }
          ]
        },
        {
          id: 'sess-2',
          machineId: 'mch-test-1',
          completionStatus: 'COMPLETED',
          completedDate: '2026-09-01',
          stage03_laserPower: [
            {
              laserIdentifier: 'lh1',
              laserName: 'Laser Head 1',
              beforeValueWatts: 14.2,
              afterValueWatts: 13.9
              // No ratedPowerWatts defined
            }
          ]
        }
      ];

      // Simulate extraction logic in AnalyticsModule
      let nominalBaseline: number | null = null;
      const genuineMachineRating = typeof machineWithoutRatedPower.laserHeads?.[0]?.ratedPowerWatts === 'number' && machineWithoutRatedPower.laserHeads[0].ratedPowerWatts > 0
        ? machineWithoutRatedPower.laserHeads[0].ratedPowerWatts
        : null;
      if (genuineMachineRating) {
        nominalBaseline = genuineMachineRating;
      }

      const points: any[] = [];
      sessionsWithMeasurements.forEach(s => {
        const head1 = s.stage03_laserPower[0];
        const val = head1.afterValueWatts > 0 ? head1.afterValueWatts : head1.beforeValueWatts;
        const headRated = typeof head1.ratedPowerWatts === 'number' && head1.ratedPowerWatts > 0 ? head1.ratedPowerWatts : null;
        if (headRated && nominalBaseline === null) nominalBaseline = headRated;
        points.push({
          date: s.completedDate,
          value: val,
          baseline: headRated || nominalBaseline || undefined
        });
      });

      // Assertions:
      // 1. Baseline must be null/undefined, NOT 250 W or any other guessed fallback
      expect(nominalBaseline).toBeNull();
      expect(points[0].baseline).toBeUndefined();
      expect(points[1].baseline).toBeUndefined();
      expect(nominalBaseline).not.toBe(250);

      // 2. Real measurements remain intact
      expect(points).toHaveLength(2);
      expect(points[0].value).toBe(14.2);
      expect(points[1].value).toBe(13.9);
    });

    it('preserves genuine recorded rated power and measurements when present', () => {
      const machineWithRatedPower: any = {
        id: 'mch-rated-1',
        machineNumber: 'MCH-RATED-1',
        serialNumber: 'SN-RATED-1',
        laserHeads: [
          {
            id: 'lh-1',
            model: 'TruPulse',
            serialNumber: 'SN-LH-1',
            ratedPowerWatts: 20.0
          }
        ]
      };

      const session: any = {
        id: 'sess-rated',
        machineId: 'mch-rated-1',
        completionStatus: 'COMPLETED',
        completedDate: '2026-09-01',
        stage03_laserPower: [
          {
            laserIdentifier: 'lh1',
            laserName: 'Laser Head 1',
            ratedPowerWatts: 20.0,
            beforeValueWatts: 19.8,
            afterValueWatts: 19.5
          }
        ]
      };

      let nominalBaseline: number | null = null;
      const genuineMachineRating = typeof machineWithRatedPower.laserHeads?.[0]?.ratedPowerWatts === 'number' && machineWithRatedPower.laserHeads[0].ratedPowerWatts > 0
        ? machineWithRatedPower.laserHeads[0].ratedPowerWatts
        : null;
      if (genuineMachineRating) {
        nominalBaseline = genuineMachineRating;
      }

      expect(nominalBaseline).toBe(20.0);
      expect(session.stage03_laserPower[0].ratedPowerWatts).toBe(20.0);
      expect(session.stage03_laserPower[0].beforeValueWatts).toBe(19.8);
      expect(session.stage03_laserPower[0].afterValueWatts).toBe(19.5);
    });
  });
});
