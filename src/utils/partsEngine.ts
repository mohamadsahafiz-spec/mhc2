import { RecommendedPart, MHCRecommendedPartRef, ResolvedMHCRecommendedPart, MachineFamily } from '../types/parts';
import { StorageService } from './persistence';

/**
 * Authoritative Parts Engine for resolving stable reference IDs in MHC inspections
 * and Report Studio back to the latest Recommended Parts Master records.
 */
export const PartsEngine = {
  /**
   * Resolves a single MHC recommended part reference to its authoritative part master record.
   */
  resolvePartRef: (ref: MHCRecommendedPartRef): ResolvedMHCRecommendedPart => {
    const part = StorageService.getRecommendedPartById(ref.partId) || null;
    return {
      ref,
      part,
      isMissing: part === null
    };
  },

  /**
   * Resolves a list of part references for an MHC Session or Report Draft.
   */
  resolvePartRefs: (refs: MHCRecommendedPartRef[]): ResolvedMHCRecommendedPart[] => {
    if (!Array.isArray(refs)) return [];
    return refs.map(ref => PartsEngine.resolvePartRef(ref));
  },

  /**
   * Retrieves all available recommended parts for a given machine family.
   */
  getPartsForMachineFamily: (family: MachineFamily | string): RecommendedPart[] => {
    const allParts = StorageService.getRecommendedParts();
    const normalized = family.toUpperCase();
    if (normalized.includes('302')) {
      return allParts.filter(p => p.machineFamily === 'BMD302W' || p.machineFamily === 'OTHER');
    }
    if (normalized.includes('250')) {
      return allParts.filter(p => p.machineFamily === 'BMD250WM' || p.machineFamily === 'OTHER');
    }
    return allParts.filter(p => p.machineFamily === family || p.machineFamily === 'OTHER');
  },

  /**
   * Formats price with currency.
   */
  formatPrice: (price?: number, currency = 'USD'): string => {
    if (price === undefined || price === null || isNaN(price)) return '—';
    return `${currency} ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
