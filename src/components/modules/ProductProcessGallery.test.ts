import { describe, it, expect } from 'vitest';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { ProductProcessRecord } from '../../types/productProcess';

describe('FSOS Product & Process Dual Via Image Gallery Contract (v3.6.3)', () => {
  const mockRecord: ProductProcessRecord = {
    id: 'test-pp-1',
    date: '2026-09-23',
    productName: 'FCBGA 2-2-2 High Density',
    recipeName: 'ABF-GX92-DUAL-PASS',
    lotPanel: 'LOT-2026-92A / PNL-04',
    laser1PowerOffsetPercent: 1.5,
    laser2PowerOffsetPercent: -0.5,
    viaSpec: {
      topTargetUm: 51,
      topToleranceUm: 10,
      bottomTargetUm: 23,
      bottomToleranceUm: 10,
      minTaperPercent: 40,
      taperSpecText: '≥ 40%'
    },
    phase1: {
      powerWatts: 5.8,
      frequencyKhz: 50,
      shotCount: 2,
      maskMm: 2.0,
      defocusMm: 0.0
    },
    phase2: {
      powerWatts: 8.2,
      frequencyKhz: 60,
      shotCount: 4,
      maskMm: 2.2,
      defocusMm: 0.1
    },
    laser1Via: {
      topWidthUm: 52.3,
      bottomWidthUm: 24.1,
      topViaImageDataUrl: 'data:image/svg+xml;base64,mockLaser1Top',
      bottomViaImageDataUrl: 'data:image/svg+xml;base64,mockLaser1Bottom',
      viaImageDataUrl: 'data:image/svg+xml;base64,mockLaser1Legacy',
      topPass: true,
      bottomPass: true,
      overallPass: true
    },
    laser2Via: {
      topWidthUm: 50.8,
      bottomWidthUm: 22.9,
      topViaImageDataUrl: 'data:image/svg+xml;base64,mockLaser2Top',
      bottomViaImageDataUrl: 'data:image/svg+xml;base64,mockLaser2Bottom',
      topPass: true,
      bottomPass: true,
      overallPass: true
    },
    overallResult: 'PASS'
  };

  it('evaluates dual-via evidence correctly and preserves both Top & Bottom images', () => {
    const evaluated = ProductProcessEngine.evaluateRecord(mockRecord);

    // Laser 1 evaluation
    expect(evaluated.laser1Via.topPass).toBe(true);
    expect(evaluated.laser1Via.bottomPass).toBe(true);
    expect(evaluated.laser1Via.overallPass).toBe(true);
    expect(evaluated.laser1Via.topViaImageDataUrl).toBe('data:image/svg+xml;base64,mockLaser1Top');
    expect(evaluated.laser1Via.bottomViaImageDataUrl).toBe('data:image/svg+xml;base64,mockLaser1Bottom');

    // Laser 2 evaluation
    expect(evaluated.laser2Via.topPass).toBe(true);
    expect(evaluated.laser2Via.bottomPass).toBe(true);
    expect(evaluated.laser2Via.overallPass).toBe(true);
    expect(evaluated.laser2Via.topViaImageDataUrl).toBe('data:image/svg+xml;base64,mockLaser2Top');
    expect(evaluated.laser2Via.bottomViaImageDataUrl).toBe('data:image/svg+xml;base64,mockLaser2Bottom');

    // Overall record verdict
    expect(evaluated.overallResult).toBe('PASS');
  });

  it('maintains full backward compatibility with legacy single-image records', () => {
    const legacyRecord = {
      date: '2026-09-01',
      productName: 'Legacy FCBGA',
      recipeName: 'REC-01',
      lotPanel: 'PNL-01',
      viaSpec: {
        topTargetUm: 50,
        topToleranceUm: 10,
        bottomTargetUm: 25,
        bottomToleranceUm: 10
      },
      laser1Via: {
        topWidthUm: 50.0,
        bottomWidthUm: 25.0,
        viaImageDataUrl: 'data:image/svg+xml;base64,mockLegacySingleImage'
      },
      laser2Via: {
        topWidthUm: 48.0,
        bottomWidthUm: 24.0,
        viaImageDataUrl: 'data:image/svg+xml;base64,mockLegacySingleImage2'
      }
    };

    const evaluated = ProductProcessEngine.evaluateRecord(legacyRecord);
    expect(evaluated.laser1Via.viaImageDataUrl).toBe('data:image/svg+xml;base64,mockLegacySingleImage');
    expect(evaluated.laser1Via.topViaImageDataUrl).toBe('data:image/svg+xml;base64,mockLegacySingleImage');
    expect(evaluated.laser1Via.bottomViaImageDataUrl).toBeUndefined();
    expect(evaluated.laser1Via.overallPass).toBe(true);
  });

  it('correctly generates synthetic via diagrams for top, bottom, and overview views', () => {
    const topSvg = ProductProcessEngine.generateSyntheticViaSvg('Laser 1', 52, 24, '#f59e0b', 'top');
    expect(topSvg).toContain('TOP%20VIA');

    const bottomSvg = ProductProcessEngine.generateSyntheticViaSvg('Laser 1', 52, 24, '#f59e0b', 'bottom');
    expect(bottomSvg).toContain('BOTTOM%20VIA');

    const bothSvg = ProductProcessEngine.generateSyntheticViaSvg('Laser 2', 50, 23, '#38bdf8', 'both');
    expect(bothSvg).toContain('CROSS%20SECTION');
  });

  it('correctly calculates specification constraints in evaluateVia', () => {
    const reading = ProductProcessEngine.evaluateVia(
      50,
      25,
      undefined,
      {
        topTargetUm: 50,
        topToleranceUm: 5,
        bottomTargetUm: 25,
        bottomToleranceUm: 5
      }
    );

    expect(reading.topPass).toBe(true);
    expect(reading.bottomPass).toBe(true);
    expect(reading.overallPass).toBe(true);
  });

  it('fails reading when measured diameter is out of specification limit', () => {
    const failedReading = ProductProcessEngine.evaluateVia(
      65, // Spec: 51 ± 10 (max 61) -> 65 FAIL
      23,
      undefined,
      {
        topTargetUm: 51,
        topToleranceUm: 10,
        bottomTargetUm: 23,
        bottomToleranceUm: 10
      }
    );

    expect(failedReading.topPass).toBe(false);
    expect(failedReading.bottomPass).toBe(true);
    expect(failedReading.overallPass).toBe(false);
  });
});
