export type MachineFamily = 'BMD302W' | 'BMD250WM' | 'OTHER';

export interface RecommendedPart {
  id: string; // Stable persistent UUID
  partNumber: string;
  partName: string;
  description?: string;
  unit: string; // e.g. 'PCS', 'SET', 'UNIT', 'EA'
  quantityPerMachine: number;
  price?: number;
  currency?: string; // e.g. 'USD', 'EUR', 'MYR'
  recommendedLifeSpan?: string; // e.g. '20,000 hrs', '12 months', '30,000 hrs'
  leadTime?: string; // e.g. '4-6 weeks', 'In Stock', '8-12 weeks'
  isCritical: boolean; // Authoritative Critical Part Flag
  remark?: string;
  machineFamily: MachineFamily;
  category?: string; // e.g. 'Optics', 'Laser Source', 'Cooling System', 'Motion / Stage', 'General'
  createdAt: string;
  updatedAt: string;
}

/**
 * Reference model for MHC Session and Report Studio integration.
 * Instead of duplicating part records, MHC recommendations store the stable partId
 * and resolve the authoritative record at render/export time.
 */
export interface MHCRecommendedPartRef {
  partId: string;
  recommendedQuantity?: number;
  urgency?: 'IMMEDIATE' | 'NEXT_PM' | 'MONITOR' | 'ROUTINE';
  justification?: string;
  customRemark?: string;
}

/**
 * Resolved recommendation item combining the reference metadata
 * with the authoritative RecommendedPart record from StorageService.
 */
export interface ResolvedMHCRecommendedPart {
  ref: MHCRecommendedPartRef;
  part: RecommendedPart | null;
  isMissing: boolean;
}
