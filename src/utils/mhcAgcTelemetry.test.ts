import { describe, it, expect } from 'vitest';
import { MHCAgcResult, MHCAgcIndexItem, MHCSession } from '../types';
import { buildMhcReportDocument } from './mhcReportEngine';

describe('AGC Signed Min/Max Telemetry & Persistence', () => {
  it('calculates signed min/max values correctly across positive and negative index readings', () => {
    const rawIndices = [
      { x: -1.2, y: 0.5 },
      { x: 0.8, y: -2.1 },
      { x: -0.4, y: 1.4 },
      { x: 1.1, y: -0.8 },
      { x: -0.9, y: 0.0 },
      { x: 0.2, y: -1.5 },
    ];

    const validXs = rawIndices.map(r => r.x);
    const validYs = rawIndices.map(r => r.y);

    const xMinUm = Math.min(...validXs);
    const xMaxUm = Math.max(...validXs);
    const yMinUm = Math.min(...validYs);
    const yMaxUm = Math.max(...validYs);
    const maxAbsXUm = Math.max(...validXs.map(Math.abs));
    const maxAbsYUm = Math.max(...validYs.map(Math.abs));
    const overallMaxDevUm = Math.max(maxAbsXUm, maxAbsYUm);

    expect(xMinUm).toBe(-1.2);
    expect(xMaxUm).toBe(1.1);
    expect(yMinUm).toBe(-2.1);
    expect(yMaxUm).toBe(1.4);
    expect(maxAbsXUm).toBe(1.2);
    expect(maxAbsYUm).toBe(2.1);
    expect(overallMaxDevUm).toBe(2.1);
  });

  it('correctly maps AGC signed telemetry in buildMhcReportDocument', () => {
    const mockIndices: MHCAgcIndexItem[] = [
      { indexNum: 0, xUm: -1.2, yUm: 0.5, specToleranceUm: 3.0, verdict: 'PASS' },
      { indexNum: 1, xUm: 0.8, yUm: -2.1, specToleranceUm: 3.0, verdict: 'PASS' },
      { indexNum: 2, xUm: -0.4, yUm: 1.4, specToleranceUm: 3.0, verdict: 'PASS' },
      { indexNum: 3, xUm: 1.1, yUm: -0.8, specToleranceUm: 3.0, verdict: 'PASS' },
      { indexNum: 4, xUm: -0.9, yUm: 0.0, specToleranceUm: 3.0, verdict: 'PASS' },
      { indexNum: 5, xUm: 0.2, yUm: -1.5, specToleranceUm: 3.0, verdict: 'PASS' },
    ];

    const mockAgc1: MHCAgcResult = {
      agcId: 'agc1',
      agcName: 'AGC 1',
      indices: mockIndices,
      xMinUm: -1.2,
      xMaxUm: 1.1,
      yMinUm: -2.1,
      yMaxUm: 1.4,
      maxAbsXUm: 1.2,
      maxAbsYUm: 2.1,
      overallMaxDevUm: 2.1,
      specToleranceUm: 3.0,
      verdict: 'PASS',
      status: 'COMPLETED',
      updatedAt: '2026-08-14T00:00:00Z'
    };

    const mockAgc2: MHCAgcResult = {
      agcId: 'agc2',
      agcName: 'AGC 2',
      indices: mockIndices,
      xMinUm: -0.8,
      xMaxUm: 0.9,
      yMinUm: -1.5,
      yMaxUm: 1.2,
      maxAbsXUm: 0.9,
      maxAbsYUm: 1.5,
      overallMaxDevUm: 1.5,
      specToleranceUm: 3.0,
      verdict: 'PASS',
      status: 'COMPLETED',
      updatedAt: '2026-08-14T00:00:00Z'
    };

    const mockSession: MHCSession = {
      id: 'session-test-agc',
      machineId: 'm1',
      machineModel: 'NXE:3400C',
      machineSerialNumber: 'SN-9999',
      machineName: 'Scanner Tool 1',
      customerId: 'c1',
      customerName: 'Test Fab',
      plantName: 'Facility Alpha',
      engineerName: 'Senior Cleanroom Engineer',
      startDate: '2026-08-14',
      startTime: '08:00',
      lastUpdated: new Date().toISOString(),
      completionStatus: 'IN_PROGRESS',
      currentSection: 1,
      sectionStatuses: {},
      stage01_laserHours: [],
      stage02_laserProfile: {} as any,
      stage03_laserPower: [],
      stage04_opticsBeam: {} as any,
      stage05_cooling: {} as any,
      stage06_productQuality: {} as any,
      stage07_spareParts: [],
      stage08_engineerRemarks: {} as any,
      agcData: {
        agc1: mockAgc1,
        agc2: mockAgc2
      }
    };

    const doc = buildMhcReportDocument(mockSession);
    const section10 = doc.sections['10'];
    expect(section10).toBeDefined();
    expect(section10.data.overallVerdict).toBe('PASS');

    const mappedAgc1 = section10.data.agcs.find(a => a.agcId === 'agc1');
    expect(mappedAgc1).toBeDefined();
    expect(mappedAgc1?.xMinUm).toBe(-1.2);
    expect(mappedAgc1?.xMaxUm).toBe(1.1);
    expect(mappedAgc1?.yMinUm).toBe(-2.1);
    expect(mappedAgc1?.yMaxUm).toBe(1.4);
    expect(mappedAgc1?.maxAbsXUm).toBe(1.2);
    expect(mappedAgc1?.maxAbsYUm).toBe(2.1);
    expect(mappedAgc1?.overallMaxDevUm).toBe(2.1);
  });
});
