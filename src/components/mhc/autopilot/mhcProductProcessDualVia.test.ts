import { describe, it, expect } from 'vitest';
import { ProductProcessRecord } from '../../../types/productProcess';
import { ProductProcessEngine } from '../../../utils/productProcessEngine';
import { buildMhcReportDocument } from '../../../utils/mhcReportEngine';

describe('FSOS Autopilot Product & Process Dual-Via Alignment (v3.6.4)', () => {
  it('supports separate Top Via and Bottom Via evidence per laser in Autopilot sessions', () => {
    const sessionRecord: any = {
      id: 'autopilot-pp-01',
      date: '2026-09-23',
      productName: 'FCBGA 12-Layer High Density',
      recipeName: 'REC-ABF-DUAL-VIA',
      lotPanel: 'LOT-2026-X / PNL-09',
      viaSpec: {
        topTargetUm: 50,
        topToleranceUm: 10,
        bottomTargetUm: 25,
        bottomToleranceUm: 10,
        minTaperPercent: 40,
        taperSpecText: '≥ 40%'
      },
      laser1Via: {
        topWidthUm: 52.0,
        bottomWidthUm: 24.5,
        topViaImageDataUrl: 'data:image/svg+xml;base64,mockL1TopViaReal',
        bottomViaImageDataUrl: 'data:image/svg+xml;base64,mockL1BottomViaReal'
      },
      laser2Via: {
        topWidthUm: 49.5,
        bottomWidthUm: 23.8,
        topViaImageDataUrl: 'data:image/svg+xml;base64,mockL2TopViaReal',
        bottomViaImageDataUrl: 'data:image/svg+xml;base64,mockL2BottomViaReal'
      }
    };

    const evaluated = ProductProcessEngine.evaluateRecord(sessionRecord);

    // Verify Laser 1 dual evidence & calculations
    expect(evaluated.laser1Via.topViaImageDataUrl).toBe('data:image/svg+xml;base64,mockL1TopViaReal');
    expect(evaluated.laser1Via.bottomViaImageDataUrl).toBe('data:image/svg+xml;base64,mockL1BottomViaReal');
    expect(evaluated.laser1Via.topPass).toBe(true);
    expect(evaluated.laser1Via.bottomPass).toBe(true);
    expect(evaluated.laser1Via.overallPass).toBe(true);

    // Verify Laser 2 dual evidence & calculations
    expect(evaluated.laser2Via.topViaImageDataUrl).toBe('data:image/svg+xml;base64,mockL2TopViaReal');
    expect(evaluated.laser2Via.bottomViaImageDataUrl).toBe('data:image/svg+xml;base64,mockL2BottomViaReal');
    expect(evaluated.laser2Via.topPass).toBe(true);
    expect(evaluated.laser2Via.bottomPass).toBe(true);
    expect(evaluated.laser2Via.overallPass).toBe(true);

    // Overall verdict
    expect(evaluated.overallResult).toBe('PASS');
  });

  it('maintains backward compatibility with legacy Autopilot sessions having single viaImageDataUrl', () => {
    const legacySessionRecord: any = {
      id: 'legacy-autopilot-pp-01',
      date: '2026-08-15',
      productName: 'Legacy CSP',
      recipeName: 'REC-LEGACY-01',
      lotPanel: 'LOT-LEGACY / PNL-01',
      viaSpec: {
        topTargetUm: 50,
        topToleranceUm: 10,
        bottomTargetUm: 25,
        bottomToleranceUm: 10
      },
      laser1Via: {
        topWidthUm: 51.0,
        bottomWidthUm: 24.0,
        viaImageDataUrl: 'data:image/svg+xml;base64,mockLegacyMicrograph'
      },
      laser2Via: {
        topWidthUm: 49.0,
        bottomWidthUm: 23.5,
        viaImageDataUrl: 'data:image/svg+xml;base64,mockLegacyMicrograph2'
      }
    };

    const evaluated = ProductProcessEngine.evaluateRecord(legacySessionRecord);

    // Legacy single image maps gracefully to topViaImageDataUrl while preserving viaImageDataUrl
    expect(evaluated.laser1Via.viaImageDataUrl).toBe('data:image/svg+xml;base64,mockLegacyMicrograph');
    expect(evaluated.laser1Via.topViaImageDataUrl).toBe('data:image/svg+xml;base64,mockLegacyMicrograph');
    expect(evaluated.laser1Via.bottomViaImageDataUrl).toBeUndefined();
    expect(evaluated.laser1Via.overallPass).toBe(true);
  });

  it('hydrates dual via images into Section 12 of the MHC report document', () => {
    const dummySession = {
      id: 'SESS-DUAL-VIA-REPORT',
      machineSerialNumber: 'MC230040',
      machineModel: 'UV Drill Dual Laser',
      customer: 'ASE Kaohsiung',
      leadEngineer: 'Mikasa Ackerman',
      startDate: '2026-09-23',
      completedDate: '2026-09-23',
      status: 'COMPLETED',
      productProcessRecord: {
        id: 'pp-report-01',
        productName: 'FCBGA 14-Layer',
        recipeName: 'REC-BGA-14L',
        lotPanel: 'LOT-99A / PNL-01',
        phase1: { powerWatts: 5.5, frequencyKhz: 50, shotCount: 2, maskMm: 2.0, defocusMm: 0.0 },
        phase2: { powerWatts: 8.0, frequencyKhz: 60, shotCount: 4, maskMm: 2.2, defocusMm: 0.1 },
        viaSpec: {
          topTargetUm: 50,
          topToleranceUm: 8,
          bottomTargetUm: 25,
          bottomToleranceUm: 8,
          minTaperPercent: 45
        },
        laser1Via: {
          topWidthUm: 51.0,
          bottomWidthUm: 24.8,
          topViaImageDataUrl: 'data:image/png;base64,L1TopEvidenceData',
          bottomViaImageDataUrl: 'data:image/png;base64,L1BottomEvidenceData',
          topPass: true,
          bottomPass: true,
          overallPass: true
        },
        laser2Via: {
          topWidthUm: 49.2,
          bottomWidthUm: 23.9,
          topViaImageDataUrl: 'data:image/png;base64,L2TopEvidenceData',
          bottomViaImageDataUrl: 'data:image/png;base64,L2BottomEvidenceData',
          topPass: true,
          bottomPass: true,
          overallPass: true
        },
        overallResult: 'PASS',
        engineerRemarks: 'Both Top and Bottom via geometry nominal.'
      }
    } as any;

    const reportDoc = buildMhcReportDocument(dummySession);
    const sec12 = reportDoc.sections['12'].data;

    expect(sec12.productName).toBe('FCBGA 14-Layer');
    expect(sec12.laser1Via?.topViaImageDataUrl).toBe('data:image/png;base64,L1TopEvidenceData');
    expect(sec12.laser1Via?.bottomViaImageDataUrl).toBe('data:image/png;base64,L1BottomEvidenceData');
    expect(sec12.laser2Via?.topViaImageDataUrl).toBe('data:image/png;base64,L2TopEvidenceData');
    expect(sec12.laser2Via?.bottomViaImageDataUrl).toBe('data:image/png;base64,L2BottomEvidenceData');
    expect(sec12.overallResult).toBe('PASS');
  });
});
