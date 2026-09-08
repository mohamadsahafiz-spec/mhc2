import { describe, it } from 'vitest';
import { StorageService } from './persistence';
import { ImageStore } from './imageStore';
import { auditMediaEvidence } from './mediaEvidenceAudit';

describe('Forensic Investigation: Duplicate Media Groups Analysis', () => {
  it('analyzes the duplicate media payload groups in the system', async () => {
    // Collect all local data
    const allData = StorageService.getAllLocalData();
    const branding = StorageService.getBranding();
    const profile = StorageService.getProfile();
    const combinedData = { ...allData, branding, profile };

    // Get all raw stored entries and resolved images
    const rawEntries = await ImageStore.getAllRawStoredEntries();
    const resolvedImages = await ImageStore.getAllImages();
    const report = await auditMediaEvidence(resolvedImages, combinedData);

    console.log('=== FORENSIC MEDIA DIAGNOSTIC REPORT ===');
    console.log('Total Stored Records:', report.summary.totalRecords);
    console.log('Total Storage Bytes:', report.summary.totalStorageBytes);
    console.log('Unique Payloads:', report.summary.uniquePayloadCount);
    console.log('Duplicate Groups Count:', report.summary.duplicateGroupsCount);
    console.log('Duplicate Records:', report.summary.duplicateRecords);
    console.log('Potential Savings Bytes:', report.summary.potentialDuplicateSavingsBytes);

    console.log('\n--- DUPLICATE GROUPS BREAKDOWN ---');
    for (const group of report.duplicates) {
      console.log(`\nGroup [${group.groupId}] - Type: ${group.payloadType}, Size/entry: ${group.byteSizePerEntry} B, Count: ${group.count}, Wasted: ${group.wastedBytes} B`);
      console.log('Keys in group:');
      for (const k of group.keys) {
        const rawVal = rawEntries[k];
        const isRef = typeof rawVal === 'string' && rawVal.startsWith('ref:');
        console.log(`  - ${k} (raw: ${isRef ? rawVal : 'PHYSICAL_PAYLOAD [' + (rawVal?.length || 0) + ' chars]'})`);
      }
    }

    console.log('\n--- ALL RAW ENTRIES ---');
    const rawKeys = Object.keys(rawEntries);
    console.log(`Total raw keys in rawEntries: ${rawKeys.length}`);
    let physicalCount = 0;
    let refCount = 0;
    for (const [k, v] of Object.entries(rawEntries)) {
      if (typeof v === 'string' && v.startsWith('ref:')) {
        refCount++;
      } else {
        physicalCount++;
      }
    }
    console.log(`Physical copies in IDB: ${physicalCount}, Reference pointers (ref:): ${refCount}`);
  });
});
