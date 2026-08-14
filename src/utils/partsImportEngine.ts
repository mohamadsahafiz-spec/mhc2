import { RecommendedPart, MachineFamily } from '../types/parts';

export interface ImportValidationItem {
  index: number;
  raw: Record<string, any>;
  parsedPart: RecommendedPart | null;
  status: 'VALID_NEW' | 'VALID_DUPLICATE' | 'ERROR';
  errors: string[];
  matchedExistingPart?: RecommendedPart;
}

export interface ImportSummary {
  totalRecords: number;
  validCount: number;
  newCount: number;
  duplicateCount: number;
  errorCount: number;
  items: ImportValidationItem[];
}

/**
 * Standard CSV line parser handling quotes, commas, and escaped quotes.
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Parses raw CSV string into array of object records using headers.
 */
export function parseCSVToObjects(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => 
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] || '';
    });
    records.push(obj);
  }

  return records;
}

/**
 * Normalizes field key lookups against flexible column headers.
 */
function getField(obj: Record<string, any>, ...aliases: string[]): any {
  for (const alias of aliases) {
    const cleanedAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of Object.keys(obj)) {
      const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanedKey === cleanedAlias && obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }
  }
  return undefined;
}

/**
 * Validates and normalizes parsed raw items against existing master catalog.
 */
export function validateImportRecords(
  rawList: Record<string, any>[],
  existingParts: RecommendedPart[],
  defaultFamily?: MachineFamily
): ImportSummary {
  const items: ImportValidationItem[] = [];
  const existingMap = new Map<string, RecommendedPart>();
  
  existingParts.forEach(p => {
    const key = `${p.machineFamily}:::${p.partNumber.trim().toUpperCase()}`;
    existingMap.set(key, p);
  });

  const batchKeySeen = new Set<string>();

  rawList.forEach((raw, idx) => {
    const errors: string[] = [];

    // 1. Machine Family
    let rawFamily = getField(raw, 'machinefamily', 'family', 'machinemodel', 'model');
    let machineFamily: MachineFamily = defaultFamily || 'BMD302W';

    if (rawFamily) {
      const upper = String(rawFamily).trim().toUpperCase();
      if (upper.includes('302')) {
        machineFamily = 'BMD302W';
      } else if (upper.includes('250')) {
        machineFamily = 'BMD250WM';
      } else if (upper === 'OTHER' || upper === 'UNIVERSAL') {
        machineFamily = 'OTHER';
      } else {
        errors.push(`Invalid machine family '${rawFamily}'. Must be BMD302W, BMD250WM, or OTHER.`);
      }
    }

    // 2. Part Number
    const partNumberRaw = getField(raw, 'partnumber', 'partno', 'itemnumber', 'part_number', 'pn', 'partcode');
    const partNumber = partNumberRaw ? String(partNumberRaw).trim() : '';
    if (!partNumber) {
      errors.push('Part Number is required.');
    }

    // 3. Part Name
    const partNameRaw = getField(raw, 'partname', 'name', 'itemname', 'part_name', 'descriptionname');
    const partName = partNameRaw ? String(partNameRaw).trim() : '';
    if (!partName) {
      errors.push('Part Name is required.');
    }

    // 4. Description
    const descriptionRaw = getField(raw, 'description', 'desc', 'specification', 'spec', 'details');
    const description = descriptionRaw ? String(descriptionRaw).trim() : undefined;

    // 5. Unit
    const unitRaw = getField(raw, 'unit', 'uom', 'measureunit');
    const unit = unitRaw ? String(unitRaw).trim().toUpperCase() : 'PCS';

    // 6. Quantity per machine
    const qtyRaw = getField(raw, 'quantitypermachine', 'qty', 'quantity', 'qtypermachine', 'count');
    let quantityPerMachine = 1;
    if (qtyRaw !== undefined && qtyRaw !== '') {
      const parsedQty = parseInt(String(qtyRaw), 10);
      if (isNaN(parsedQty) || parsedQty < 1) {
        errors.push(`Invalid quantity per machine '${qtyRaw}'. Must be an integer >= 1.`);
      } else {
        quantityPerMachine = parsedQty;
      }
    }

    // 7. Price & Currency
    const priceRaw = getField(raw, 'price', 'unitprice', 'cost', 'estimatedprice');
    let price: number | undefined = undefined;
    if (priceRaw !== undefined && priceRaw !== '') {
      const cleanPriceStr = String(priceRaw).replace(/[^0-9.-]/g, '');
      const parsedPrice = parseFloat(cleanPriceStr);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        errors.push(`Invalid price value '${priceRaw}'. Must be a non-negative number.`);
      } else {
        price = parsedPrice;
      }
    }

    const currencyRaw = getField(raw, 'currency', 'curr');
    const currency = currencyRaw ? String(currencyRaw).trim().toUpperCase() : 'USD';

    // 8. Life Span
    const lifeSpanRaw = getField(raw, 'recommendedlifespan', 'lifespan', 'life', 'recommendedlife', 'duration');
    const recommendedLifeSpan = lifeSpanRaw ? String(lifeSpanRaw).trim() : undefined;

    // 9. Lead Time
    const leadTimeRaw = getField(raw, 'leadtime', 'lead', 'deliverytime', 'procurementleadtime');
    const leadTime = leadTimeRaw ? String(leadTimeRaw).trim() : undefined;

    // 10. Critical Part
    const criticalRaw = getField(raw, 'criticalpart', 'critical', 'iscritical', 'criticalflag', 'priority');
    let isCritical = false;
    if (criticalRaw !== undefined) {
      if (typeof criticalRaw === 'boolean') {
        isCritical = criticalRaw;
      } else {
        const cStr = String(criticalRaw).trim().toLowerCase();
        isCritical = ['true', 'yes', 'y', 'critical', '1', 'high'].includes(cStr);
      }
    }

    // 11. Remark & Category
    const remarkRaw = getField(raw, 'remark', 'remarks', 'notes', 'note', 'comment');
    const remark = remarkRaw ? String(remarkRaw).trim() : undefined;

    const categoryRaw = getField(raw, 'category', 'componentcategory', 'module', 'type');
    const category = categoryRaw ? String(categoryRaw).trim() : undefined;

    // Check Duplication
    const compositeKey = `${machineFamily}:::${partNumber.toUpperCase()}`;
    const matchedExisting = existingMap.get(compositeKey);
    const isBatchDuplicate = batchKeySeen.has(compositeKey);
    batchKeySeen.add(compositeKey);

    if (isBatchDuplicate && !matchedExisting) {
      errors.push(`Duplicate item within the same import payload for ${machineFamily} / Part # ${partNumber}.`);
    }

    const now = new Date().toISOString();
    let parsedPart: RecommendedPart | null = null;

    if (errors.length === 0) {
      parsedPart = {
        id: matchedExisting ? matchedExisting.id : `part-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        machineFamily,
        partNumber,
        partName,
        description,
        unit,
        quantityPerMachine,
        price,
        currency,
        recommendedLifeSpan,
        leadTime,
        isCritical,
        remark,
        category,
        createdAt: matchedExisting?.createdAt || now,
        updatedAt: now
      };
    }

    const status: ImportValidationItem['status'] = errors.length > 0 
      ? 'ERROR' 
      : matchedExisting 
      ? 'VALID_DUPLICATE' 
      : 'VALID_NEW';

    items.push({
      index: idx + 1,
      raw,
      parsedPart,
      status,
      errors,
      matchedExistingPart: matchedExisting
    });
  });

  const totalRecords = items.length;
  const validCount = items.filter(i => i.status !== 'ERROR').length;
  const newCount = items.filter(i => i.status === 'VALID_NEW').length;
  const duplicateCount = items.filter(i => i.status === 'VALID_DUPLICATE').length;
  const errorCount = items.filter(i => i.status === 'ERROR').length;

  return {
    totalRecords,
    validCount,
    newCount,
    duplicateCount,
    errorCount,
    items
  };
}
