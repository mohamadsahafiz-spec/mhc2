import {
  FOCUS_WAFER_POSITIONS,
  FocusOptimizationRecord,
  FocusWaferPosition,
  LaserFocusEvidence,
  WaferPositionEvidence
} from '../types/focusOptimization';

export class FocusOptimizationEngine {
  /**
   * Generates a synthetic microscope wafer drill inspection SVG
   * showing laser ablation spot on a silicon test wafer for a given position.
   */
  static generateSyntheticWaferDrillSvg(
    headLabel: string,
    position: FocusWaferPosition,
    accentColor: string = '#38bdf8'
  ): string {
    const posNum = parseInt(position.replace('+', ''), 10);
    const absPos = Math.abs(posNum);

    // Optical properties based on defocus distance
    const holeRadius = 12 + absPos * 4.5;
    const haloRadius = 16 + absPos * 7.5;
    const haloOpacity = Math.max(0.15, 0.6 - absPos * 0.12);
    const centerCoreOpacity = absPos === 0 ? 0.95 : Math.max(0.3, 0.8 - absPos * 0.15);
    const edgeBlur = absPos === 0 ? 0.5 : absPos * 1.2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="waferBg_${headLabel}_${position.replace(/[^a-zA-Z0-9]/g, '_')}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="85%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <radialGradient id="drillHalo_${headLabel}_${position.replace(/[^a-zA-Z0-9]/g, '_')}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="${centerCoreOpacity}"/>
          <stop offset="30%" stop-color="${accentColor}" stop-opacity="${haloOpacity}"/>
          <stop offset="70%" stop-color="#64748b" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#1e293b" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur_${position.replace(/[^a-zA-Z0-9]/g, '_')}">
          <feGaussianBlur stdDeviation="${edgeBlur}"/>
        </filter>
      </defs>

      <!-- Silicon Wafer Substrate Background -->
      <rect width="120" height="120" rx="8" fill="url(#waferBg_${headLabel}_${position.replace(/[^a-zA-Z0-9]/g, '_')})"/>
      
      <!-- Wafer Surface Texture Rings & Grid -->
      <circle cx="60" cy="60" r="54" stroke="#334155" stroke-width="0.8" stroke-dasharray="3 3" fill="none" opacity="0.5"/>
      <circle cx="60" cy="60" r="38" stroke="#1e293b" stroke-width="0.6" fill="none"/>
      <line x1="60" y1="6" x2="60" y2="114" stroke="#334155" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6"/>
      <line x1="6" y1="60" x2="114" y2="60" stroke="#334155" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6"/>

      <!-- Laser Drill Ablation Spot -->
      <circle cx="60" cy="60" r="${haloRadius}" fill="url(#drillHalo_${headLabel}_${position.replace(/[^a-zA-Z0-9]/g, '_')})" filter="url(#blur_${position.replace(/[^a-zA-Z0-9]/g, '_')})"/>
      <circle cx="60" cy="60" r="${holeRadius}" fill="#020617" stroke="${absPos === 0 ? '#4ade80' : accentColor}" stroke-width="${absPos === 0 ? '1.5' : '1'}" opacity="0.85"/>
      <circle cx="60" cy="60" r="${Math.max(2, holeRadius * 0.45)}" fill="#000000"/>

      <!-- Position & Head Badges -->
      <rect x="6" y="6" width="38" height="16" rx="3" fill="#0f172a" stroke="#334155" stroke-width="0.6" opacity="0.9"/>
      <text x="25" y="17" text-anchor="middle" fill="${absPos === 0 ? '#4ade80' : '#e2e8f0'}" font-size="9" font-family="monospace" font-weight="bold">${position}</text>

      <text x="60" y="112" text-anchor="middle" fill="#64748b" font-size="7" font-family="sans-serif">${headLabel} Wafer Drill</text>
    </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Initializes a default Focus Optimization record with full 7-step wafer sequences for Laser 1 and Laser 2.
   */
  static createDefaultRecord(dateStr?: string, engineerName?: string): FocusOptimizationRecord {
    const today = dateStr || new Date().toISOString().split('T')[0];

    const createHeadEvidence = (
      laserHeadId: 'laser1' | 'laser2',
      laserLabel: 'Laser 1' | 'Laser 2',
      accentColor: string
    ): LaserFocusEvidence => {
      const positions: Partial<Record<FocusWaferPosition, WaferPositionEvidence>> = {};
      
      FOCUS_WAFER_POSITIONS.forEach((pos) => {
        positions[pos] = {
          position: pos,
          imageDataUrl: FocusOptimizationEngine.generateSyntheticWaferDrillSvg(laserLabel, pos, accentColor),
          drillDiameterUm: pos === '0' ? 24.5 : 24.5 + Math.abs(parseInt(pos.replace('+', ''), 10)) * 5.2,
          notes: pos === '0' ? 'Optimal focus center — crisp circular crater' : `Defocus position ${pos}`,
          capturedAt: today
        };
      });

      return {
        laserHeadId,
        laserLabel,
        maskName: 'Width Square Mask',
        performParam: '2W@50kHz (Working zone) + 2 shots',
        selectedBestFocusPosition: '0',
        positions: positions as Record<FocusWaferPosition, WaferPositionEvidence>
      };
    };

    return {
      id: `FOC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: today,
      engineerName: engineerName || 'EO Technics Field Engineer',
      serviceRecord: 'Laser source optical alignment verified via dummy wafer drill matrix. Focus set to 0.00 position.',
      reason: 'LASER_REPLACEMENT',
      procedure: 'Drill on using wafer (Dummy)',
      specificationText: 'None — This item is for checking and setting machining focus. No numerical specification.',
      laser1: createHeadEvidence('laser1', 'Laser 1', '#f59e0b'),
      laser2: createHeadEvidence('laser2', 'Laser 2', '#06b6d4'),
      overallResult: 'VERIFIED',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Counts total wafer images populated in a Focus Optimization record
   */
  static countTotalImages(record?: FocusOptimizationRecord | null): number {
    if (!record) return 0;
    let count = 0;
    FOCUS_WAFER_POSITIONS.forEach(pos => {
      if (record.laser1?.positions?.[pos]?.imageDataUrl) count++;
      if (record.laser2?.positions?.[pos]?.imageDataUrl) count++;
    });
    return count;
  }
}
