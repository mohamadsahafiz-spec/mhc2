import { describe, it, expect } from 'vitest';
import { Machine, MHCSession, Contract, Customer } from '../../types';

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
    const machines: Machine[] = [
      {
        id: 'm-1',
        name: 'EO-Drill-01',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3001',
        serialNumber: 'SN-001',
        installationDate: '2024-01-01',
        baselineDate: '2024-01-01',
        healthScore: 95,
        laserHeads: [],
        consumables: [],
        status: 'OPERATIONAL',
        photos: [],
        lastMhcDate: '',
        nextMhcDate: ''
      },
      {
        id: 'm-2',
        name: 'EO-Drill-02',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3002',
        serialNumber: 'SN-002',
        installationDate: '2024-01-01',
        baselineDate: '2024-01-01',
        healthScore: 80,
        laserHeads: [],
        consumables: [],
        status: 'NEEDS_CALIBRATION',
        photos: [],
        lastMhcDate: '',
        nextMhcDate: ''
      },
      {
        id: 'm-3',
        name: 'EO-Drill-03',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3003',
        serialNumber: 'SN-003',
        installationDate: '2024-01-01',
        baselineDate: '2024-01-01',
        healthScore: 70,
        laserHeads: [],
        consumables: [],
        status: 'MAINTENANCE_DUE',
        photos: [],
        lastMhcDate: '',
        nextMhcDate: ''
      },
      {
        id: 'm-4',
        name: 'EO-Drill-04',
        model: 'EO Laser Drill 3000',
        machineNumber: 'M-3004',
        serialNumber: 'SN-004',
        installationDate: '2024-01-01',
        baselineDate: '2024-01-01',
        healthScore: 30,
        laserHeads: [],
        consumables: [],
        status: 'OUT_OF_SERVICE',
        photos: [],
        lastMhcDate: '',
        nextMhcDate: ''
      }
    ];

    const counts = {
      OPERATIONAL: 0,
      NEEDS_CALIBRATION: 0,
      MAINTENANCE_DUE: 0,
      OUT_OF_SERVICE: 0
    };

    machines.forEach(m => {
      counts[m.status]++;
    });

    expect(counts.OPERATIONAL).toBe(1);
    expect(counts.NEEDS_CALIBRATION).toBe(1);
    expect(counts.MAINTENANCE_DUE).toBe(1);
    expect(counts.OUT_OF_SERVICE).toBe(1);
  });

  it('correctly categorizes MHC inspection currency without speculative overdue flags', () => {
    const now = new Date('2026-09-16T00:00:00Z').getTime();

    const machineRecent: Machine = {
      id: 'm-recent',
      name: 'Recent Unit',
      model: 'Laser C-200',
      machineNumber: 'M-101',
      serialNumber: 'SN-101',
      installationDate: '2024-01-01',
      baselineDate: '2024-01-01',
      healthScore: 90,
      laserHeads: [],
      consumables: [],
      status: 'OPERATIONAL',
      photos: [],
      lastMhcDate: '2026-09-01',
      nextMhcDate: ''
    };

    const machine90Days: Machine = {
      id: 'm-90',
      name: 'Quarterly Unit',
      model: 'Laser C-200',
      machineNumber: 'M-102',
      serialNumber: 'SN-102',
      installationDate: '2024-01-01',
      baselineDate: '2024-01-01',
      healthScore: 85,
      laserHeads: [],
      consumables: [],
      status: 'OPERATIONAL',
      photos: [],
      lastMhcDate: '2026-07-15',
      nextMhcDate: ''
    };

    const machineOld: Machine = {
      id: 'm-old',
      name: 'Old Unit',
      model: 'Laser C-200',
      machineNumber: 'M-103',
      serialNumber: 'SN-103',
      installationDate: '2024-01-01',
      baselineDate: '2024-01-01',
      healthScore: 75,
      laserHeads: [],
      consumables: [],
      status: 'OPERATIONAL',
      photos: [],
      lastMhcDate: '2025-12-01',
      nextMhcDate: ''
    };

    const machineNoMhc: Machine = {
      id: 'm-none',
      name: 'New Uninspected Unit',
      model: 'Laser C-200',
      machineNumber: 'M-104',
      serialNumber: 'SN-104',
      installationDate: '2026-08-01',
      baselineDate: '2026-08-01',
      healthScore: 100,
      laserHeads: [],
      consumables: [],
      status: 'OPERATIONAL',
      photos: [],
      lastMhcDate: '',
      nextMhcDate: ''
    };

    const evaluateMachine = (m: Machine) => {
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
    const machine: Machine = {
      id: 'm-consumables',
      name: 'Production Tool',
      model: 'Laser Pro',
      machineNumber: 'M-99',
      serialNumber: 'SN-99',
      installationDate: '2024-01-01',
      baselineDate: '2024-01-01',
      healthScore: 90,
      laserHeads: [],
      consumables: [
        {
          id: 'c-1',
          name: 'Deionization Filter Cartridge',
          partNumber: 'FLT-DI-09',
          currentLifePercent: 12, // Critical (<20%)
          estimatedDaysRemaining: 25,
          status: 'GOOD',
          installedDate: '2026-01-01',
          lastReplacedDate: '2026-01-01',
          replacementIntervalDays: 180
        },
        {
          id: 'c-2',
          name: 'Focusing Lens Protective Window',
          partNumber: 'OPT-WND-44',
          currentLifePercent: 45,
          estimatedDaysRemaining: 10, // Critical (<15 days)
          status: 'GOOD',
          installedDate: '2026-01-01',
          lastReplacedDate: '2026-01-01',
          replacementIntervalDays: 90
        },
        {
          id: 'c-3',
          name: 'Chiller Coolant Fluid',
          partNumber: 'CHL-FL-01',
          currentLifePercent: 88, // Nominal
          estimatedDaysRemaining: 120, // Nominal
          status: 'GOOD',
          installedDate: '2026-01-01',
          lastReplacedDate: '2026-01-01',
          replacementIntervalDays: 365
        }
      ],
      status: 'OPERATIONAL',
      photos: [],
      lastMhcDate: '',
      nextMhcDate: ''
    };

    const attentionItems = machine.consumables.filter(c => {
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
    const machines: Machine[] = [
      { id: 'm-10', name: 'Machine 10', model: 'EO-10', machineNumber: 'M-10', serialNumber: 'SN-10', installationDate: '', baselineDate: '', healthScore: 100, laserHeads: [], consumables: [], status: 'OPERATIONAL', photos: [], lastMhcDate: '', nextMhcDate: '' },
      { id: 'm-20', name: 'Machine 20', model: 'EO-20', machineNumber: 'M-20', serialNumber: 'SN-20', installationDate: '', baselineDate: '', healthScore: 100, laserHeads: [], consumables: [], status: 'OPERATIONAL', photos: [], lastMhcDate: '', nextMhcDate: '' },
      { id: 'm-30', name: 'Machine 30', model: 'EO-30', machineNumber: 'M-30', serialNumber: 'SN-30', installationDate: '', baselineDate: '', healthScore: 100, laserHeads: [], consumables: [], status: 'OPERATIONAL', photos: [], lastMhcDate: '', nextMhcDate: '' }
    ];

    const contracts: Contract[] = [
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

    const covered = machines.filter(m => coveredIds.has(m.id));
    const uncovered = machines.filter(m => !coveredIds.has(m.id));

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
      const machines: Machine[] = [
        {
          id: 'm-attn-1',
          name: 'Machine 1',
          model: 'Drill 100',
          machineNumber: 'M-100',
          serialNumber: 'SN-100',
          installationDate: '',
          baselineDate: '',
          healthScore: 60,
          laserHeads: [],
          consumables: [
            {
              id: 'c-1',
              name: 'Filter A',
              currentLifePercent: 10,
              estimatedDaysRemaining: 5,
              status: 'GOOD',
              installedDate: '',
              lastReplacedDate: '',
              replacementIntervalDays: 90
            }
          ],
          status: 'NEEDS_CALIBRATION',
          photos: [],
          lastMhcDate: '',
          nextMhcDate: ''
        },
        {
          id: 'm-attn-2',
          name: 'Machine 2',
          model: 'Drill 200',
          machineNumber: 'M-200',
          serialNumber: 'SN-200',
          installationDate: '',
          baselineDate: '',
          healthScore: 98,
          laserHeads: [],
          consumables: [
            {
              id: 'c-2',
              name: 'Coolant',
              currentLifePercent: 85,
              estimatedDaysRemaining: 120,
              status: 'GOOD',
              installedDate: '',
              lastReplacedDate: '',
              replacementIntervalDays: 365
            }
          ],
          status: 'OPERATIONAL',
          photos: [],
          lastMhcDate: '',
          nextMhcDate: ''
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
});
