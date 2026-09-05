import { describe, it, expect, beforeEach } from 'vitest';
import { MHCSession, Machine, MHCSparePartItem } from '../types';
import { buildMhcReportDocument } from './mhcReportEngine';
import { advanceAutopilotActivity } from './mhcAutopilotBrain';
import { StorageService } from './persistence';

function createMockSession(id: string = 'SESS-REC-TEST-01'): MHCSession {
  return {
    id,
    sessionDate: '2026-09-05',
    machineId: 'MACH-MHC-01',
    status: 'IN_PROGRESS',
    stage01_context: {
      siteName: 'EO Advanced Labs',
      customerName: 'Samsung Austin',
      machineModel: 'BMD-302W',
      machineSerial: 'EO-BMD-2024-001',
      engineerName: 'Lead Engineer',
      shift: 'DAY',
      runningHours: 3500
    },
    stage07_spareParts: [],
    autopilotProgress: {
      currentActivityCode: '07',
      currentDay: 'DAY 4',
      completedActivityCodes: ['01', '02_power', '02_beam', '02_findings', '04_stage1', '05_stage2', '06_scanner'],
      activityStatuses: {
        '01': 'COMPLETED',
        '02_power': 'COMPLETED',
        '02_beam': 'COMPLETED',
        '02_findings': 'COMPLETED',
        '04_stage1': 'COMPLETED',
        '05_stage2': 'COMPLETED',
        '06_scanner': 'COMPLETED',
        '07': 'IN_PROGRESS',
        '08': 'UPCOMING',
        '09': 'UPCOMING',
        '10': 'UPCOMING'
      },
      activityNotes: {}
    }
  } as any;
}

describe('Recommended Items: Custom Registration & Passport Separation', () => {
  beforeEach(() => {
    // Reset or ensure catalog has baseline state with in-memory localStorage mock
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear()
    };
  });

  it('1. Allows creating a custom recommendation without requiring a Passport record', () => {
    const session = createMockSession();
    const customRecItem: MHCSparePartItem = {
      id: 'REC-CUSTOM-01',
      partName: 'Exhaust Hepa Filter Assembly',
      // partNumber left undefined for custom item
      category: 'CONSUMABLES',
      quantity: 1,
      reason: 'Filter saturated; replace during next scheduled maintenance',
      action: 'RECOMMENDED',
      costIndicator: 'CUSTOMER_COST',
      sourceType: 'CUSTOM',
      isCustom: true
    };

    session.stage07_spareParts = [customRecItem];

    const doc = buildMhcReportDocument(session);
    const sec14 = doc.sections['14'].data;

    expect(sec14.recommendedParts).toHaveLength(1);
    expect(sec14.recommendedParts[0].id).toBe('REC-CUSTOM-01');
    expect(sec14.recommendedParts[0].partName).toBe('Exhaust Hepa Filter Assembly');
    expect(sec14.recommendedParts[0].partNumber).toBeUndefined();
    expect(sec14.recommendedParts[0].isCustom).toBe(true);
    expect(sec14.recommendedParts[0].sourceType).toBe('CUSTOM');
  });

  it('2. Supports custom recommendation with optional part number populated', () => {
    const session = createMockSession();
    const customRecWithPn: MHCSparePartItem = {
      id: 'REC-CUSTOM-02',
      partName: 'High Precision Chiller Flow Sensor',
      partNumber: 'EXT-FLW-550',
      category: 'MECHANICAL',
      quantity: 2,
      reason: 'Intermittent flow alarms observed during cooling audit',
      action: 'RECOMMENDED',
      costIndicator: 'CUSTOMER_COST',
      sourceType: 'CUSTOM',
      isCustom: true
    };

    session.stage07_spareParts = [customRecWithPn];

    const doc = buildMhcReportDocument(session);
    const sec14 = doc.sections['14'].data;

    expect(sec14.recommendedParts).toHaveLength(1);
    expect(sec14.recommendedParts[0].partName).toBe('High Precision Chiller Flow Sensor');
    expect(sec14.recommendedParts[0].partNumber).toBe('EXT-FLW-550');

    // Section 03 executive summary formats with part number
    const sec03 = doc.sections['03'].data;
    expect(sec03.replacementRecommendations).toContain('High Precision Chiller Flow Sensor (EXT-FLW-550) - RECOMMENDED');
  });

  it('3. Formats executive summary cleanly without empty parentheses when part number is omitted', () => {
    const session = createMockSession();
    const customRecNoPn: MHCSparePartItem = {
      id: 'REC-CUSTOM-03',
      partName: 'Optical Cleaning Solution Kit',
      category: 'OPTICS',
      quantity: 1,
      reason: 'Low stock in facility',
      action: 'RECOMMENDED',
      costIndicator: 'EO_SUPPORT',
      sourceType: 'CUSTOM',
      isCustom: true
    };

    session.stage07_spareParts = [customRecNoPn];

    const doc = buildMhcReportDocument(session);
    const sec03 = doc.sections['03'].data;

    expect(sec03.replacementRecommendations).toContain('Optical Cleaning Solution Kit - RECOMMENDED');
    expect(sec03.replacementRecommendations.some(r => r.includes('()'))).toBe(false);
  });

  it('4. Preserves distinction between service-consumed parts and recommended items', () => {
    const session = createMockSession();
    const consumedPart: MHCSparePartItem = {
      id: 'SP-CONSUMED-01',
      partName: 'Laser Head O-Ring Seal',
      partNumber: 'OR-0992',
      category: 'LASER',
      quantity: 2,
      reason: 'Replaced during beam alignment seal service',
      action: 'REPLACED',
      costIndicator: 'CUSTOMER_COST'
    };
    const customRecommendedItem: MHCSparePartItem = {
      id: 'REC-CUSTOM-04',
      partName: 'Future Galvo Scanner Motor',
      category: 'MECHANICAL',
      quantity: 1,
      reason: 'Trending slight drift at 80C',
      action: 'RECOMMENDED',
      costIndicator: 'WARRANTY',
      sourceType: 'CUSTOM',
      isCustom: true
    };

    session.stage07_spareParts = [consumedPart, customRecommendedItem];

    const doc = buildMhcReportDocument(session);
    const sec14 = doc.sections['14'].data;

    // Consumed parts table receives ONLY consumed parts
    expect(sec14.consumedParts).toHaveLength(1);
    expect(sec14.consumedParts[0].id).toBe('SP-CONSUMED-01');
    expect(sec14.consumedParts[0].action).toBe('REPLACED');

    // Recommended parts table receives ONLY recommended items
    expect(sec14.recommendedParts).toHaveLength(1);
    expect(sec14.recommendedParts[0].id).toBe('REC-CUSTOM-04');
    expect(sec14.recommendedParts[0].action).toBe('RECOMMENDED');

    // A recommended item must NEVER appear as a consumed part
    expect(sec14.consumedParts.some(p => p.id === 'REC-CUSTOM-04')).toBe(false);
  });

  it('5. Existing Passport-linked recommendations continue working unchanged', () => {
    const session = createMockSession();
    const passportRecItem: MHCSparePartItem = {
      id: 'REC-PASSPORT-01',
      partName: 'Standard Mirror Mount 45-Deg',
      partNumber: 'EO-MIR-45D',
      category: 'OPTICS',
      quantity: 1,
      reason: 'Coating scratch noted on secondary reflector',
      action: 'RECOMMENDED',
      costIndicator: 'CUSTOMER_COST',
      sourceType: 'PASSPORT_CATALOG',
      catalogPartId: 'PART-CAT-001',
      isCustom: false
    };

    session.stage07_spareParts = [passportRecItem];

    const doc = buildMhcReportDocument(session);
    const sec14 = doc.sections['14'].data;

    expect(sec14.recommendedParts).toHaveLength(1);
    expect(sec14.recommendedParts[0].partName).toBe('Standard Mirror Mount 45-Deg');
    expect(sec14.recommendedParts[0].partNumber).toBe('EO-MIR-45D');
    expect(sec14.recommendedParts[0].catalogPartId).toBe('PART-CAT-001');
    expect(sec14.recommendedParts[0].sourceType).toBe('PASSPORT_CATALOG');
  });

  it('6. Reopening/resuming an MHC session preserves custom recommendation data intact', () => {
    const session = createMockSession('SESS-RESUME-01');
    session.stage07_spareParts = [
      {
        id: 'REC-CUST-RESUME',
        partName: 'Custom Nitrogen Purge Regulator',
        partNumber: 'N2-REG-CUSTOM',
        category: 'MECHANICAL',
        quantity: 1,
        reason: 'Low pressure stability',
        action: 'RECOMMENDED',
        costIndicator: 'CUSTOMER_COST',
        sourceType: 'CUSTOM',
        isCustom: true,
        notes: 'Lead time 6 weeks'
      }
    ];

    // Simulate JSON persistence cycle (save to storage and reload)
    const serialized = JSON.stringify(session);
    const reloadedSession: MHCSession = JSON.parse(serialized);

    expect(reloadedSession.stage07_spareParts).toHaveLength(1);
    const reloaded = reloadedSession.stage07_spareParts![0];
    expect(reloaded.partName).toBe('Custom Nitrogen Purge Regulator');
    expect(reloaded.partNumber).toBe('N2-REG-CUSTOM');
    expect(reloaded.isCustom).toBe(true);
    expect(reloaded.sourceType).toBe('CUSTOM');
    expect(reloaded.notes).toBe('Lead time 6 weeks');

    // Report generated from resumed session renders correctly
    const doc = buildMhcReportDocument(reloadedSession);
    expect(doc.sections['14'].data.recommendedParts).toHaveLength(1);
    expect(doc.sections['14'].data.recommendedParts[0].partName).toBe('Custom Nitrogen Purge Regulator');
  });

  it('7. Report renders custom recommendation even if Passport catalog is empty or unavailable', () => {
    // Ensure catalog in storage is completely empty
    StorageService.saveRecommendedParts([]);
    expect(StorageService.getRecommendedParts()).toHaveLength(0);

    const session = createMockSession();
    session.stage07_spareParts = [
      {
        id: 'REC-STANDALONE',
        partName: 'Independent Sensor Probe',
        category: 'ELECTRICAL',
        quantity: 3,
        reason: 'Recommended for baseline calibration test',
        action: 'RECOMMENDED',
        costIndicator: 'CUSTOMER_COST',
        sourceType: 'CUSTOM',
        isCustom: true
      }
    ];

    // Generating report document does NOT rely on catalog
    const doc = buildMhcReportDocument(session);
    const rec = doc.sections['14'].data.recommendedParts[0];

    expect(rec.partName).toBe('Independent Sensor Probe');
    expect(rec.quantity).toBe(3);
    expect(rec.reason).toBe('Recommended for baseline calibration test');
  });

  it('8. Completing MHC does not modify Machine Passport catalog', () => {
    // Initial catalog
    const initialParts = [
      {
        id: 'CAT-1',
        partName: 'Catalog Item 1',
        partNumber: 'CAT-PN-1',
        category: 'OPTICS',
        machineFamily: 'BMD302W'
      }
    ];
    StorageService.saveRecommendedParts(initialParts as any);
    const catalogBefore = StorageService.getRecommendedParts();
    expect(catalogBefore).toHaveLength(1);

    const session = createMockSession();
    session.stage07_spareParts = [
      {
        id: 'REC-CUSTOM-IMMUTABLE',
        partName: 'Non-Catalog Prototype Lens',
        category: 'OPTICS',
        quantity: 1,
        reason: 'Customer special request',
        action: 'RECOMMENDED',
        costIndicator: 'CUSTOMER_COST',
        sourceType: 'CUSTOM',
        isCustom: true
      }
    ];

    // Advance 07 to completed
    const step1 = advanceAutopilotActivity(session, '07', 'COMPLETED', 'Recommendations reviewed');
    // Advance final review & signoff to completed
    const finalSession = advanceAutopilotActivity(step1, '10', 'COMPLETED', 'Final report signed off');

    expect(finalSession.autopilotProgress?.activityStatuses['07']).toBe('COMPLETED');
    expect(finalSession.autopilotProgress?.activityStatuses['10']).toBe('COMPLETED');

    // Verify Machine Passport catalog was NOT modified
    const catalogAfter = StorageService.getRecommendedParts();
    expect(catalogAfter).toHaveLength(1);
    expect(catalogAfter[0].id).toBe('CAT-1');
    expect(catalogAfter.some(p => p.partName === 'Non-Catalog Prototype Lens')).toBe(false);
  });
});
