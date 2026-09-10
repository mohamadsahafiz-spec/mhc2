import { describe, it, expect } from 'vitest';
import {
  computeReportSections13To15PaginationPlan,
  buildMhcReportDocument
} from './mhcReportEngine';
import { MHCSession } from '../types';

describe('MHC Report Sections 13–15 Overflow Pagination Architecture', () => {
  const createBaseSession = (): MHCSession => ({
    id: 'test-session-pagination',
    machineId: 'ESI-5330-01',
    machineModel: 'ESI 5330 Flex',
    machineSerialNumber: 'SN-100200',
    machineName: 'Laser Drill Alpha',
    customerId: 'CUST-001',
    customerName: 'Tech PCB Corp',
    plantName: 'Plant 1',
    engineerName: 'Alex Mercer',
    startDate: '2026-09-10',
    startTime: '08:00',
    lastUpdated: '2026-09-10T10:00:00Z',
    completionStatus: 'COMPLETED',
    currentSection: 15,
    sectionStatuses: {},
    inspectionFindings: {
      lh1: {
        decision: 'PASS',
        findings: [
          { id: 'f1', component: 'Optics Mirror', conditions: ['Dusty'], engineerNote: 'Cleaned' }
        ]
      }
    },
    stage07_spareParts: [
      { id: 'p1', partName: 'Optical Filter', quantity: 1, action: 'REPLACED', costIndicator: 'FOC' } as any,
      { id: 'r1', partName: 'Chiller Pump', quantity: 1, action: 'RECOMMENDED', costIndicator: 'BILLABLE' } as any
    ],
    stage08_engineerRemarks: {
      generalFindings: 'All systems operating within acceptable limits',
      recommendations: 'Perform regular inspection every 90 days.'
    },
    customerApproved: true
  });

  it('Standard Report: retains exactly 10 pages with Sections 13, 14, 15 unified on Page 10', () => {
    const session = createBaseSession();
    const doc = buildMhcReportDocument(session);

    expect(doc.metadata.totalPagesCount).toBe(10);
    
    // Check index entries
    const s13Entry = doc.indexEntries.find(e => e.code === '13');
    const s14Entry = doc.indexEntries.find(e => e.code === '14');
    const s15Entry = doc.indexEntries.find(e => e.code === '15');

    expect(s13Entry?.pageNumber).toBe(10);
    expect(s14Entry?.pageNumber).toBe(10);
    expect(s15Entry?.pageNumber).toBe(10);

    const plan = computeReportSections13To15PaginationPlan(
      doc.sections['13']?.data,
      doc.sections['14']?.data,
      doc.sections['15']?.data
    );

    expect(plan.totalPages).toBe(10);
    expect(plan.pages.length).toBe(1);
    expect(plan.pages[0].pageNumber).toBe(10);
    expect(plan.pages[0].hasFindings).toBe(true);
    expect(plan.pages[0].hasSpareParts).toBe(true);
    expect(plan.pages[0].hasBuyoff).toBe(true);
  });

  it('Extreme Findings Overflow: splits large findings across Page 10 and Page 11 safely without clipping', () => {
    const session = createBaseSession();
    // 16 findings
    const findingsList = Array.from({ length: 16 }, (_, i) => ({
      id: `f-${i + 1}`,
      component: `Component ${i + 1}`,
      conditions: ['Observed wear', 'Calibration shift'],
      engineerNote: `Detailed engineering inspection observation for component ${i + 1}. Checked thoroughly.`
    }));

    session.inspectionFindings = {
      lh1: { decision: 'PASS', findings: findingsList.slice(0, 8) },
      lh2: { decision: 'PASS', findings: findingsList.slice(8) }
    };
    if (session.stage08_engineerRemarks) {
      session.stage08_engineerRemarks.generalFindings = 'Multiple subsystems required maintenance and readjustment.';
    }

    const doc = buildMhcReportDocument(session);

    expect(doc.metadata.totalPagesCount).toBeGreaterThanOrEqual(11);
    
    const plan = computeReportSections13To15PaginationPlan(
      doc.sections['13']?.data,
      doc.sections['14']?.data,
      doc.sections['15']?.data
    );

    expect(plan.totalPages).toBe(11);
    expect(plan.pages.length).toBe(2);

    // Page 10 has Section 13 first slice
    expect(plan.pages[0].pageNumber).toBe(10);
    expect(plan.pages[0].hasFindings).toBe(true);
    expect(plan.pages[0].findingsSlice?.isContinued).toBe(false);
    expect(plan.pages[0].findingsSlice?.items.length).toBe(10);

    // Page 11 has Section 13 continuation + Section 14 + Section 15
    expect(plan.pages[1].pageNumber).toBe(11);
    expect(plan.pages[1].hasFindings).toBe(true);
    expect(plan.pages[1].findingsSlice?.isContinued).toBe(true);
    expect(plan.pages[1].findingsSlice?.items.length).toBe(6);
    expect(plan.pages[1].hasSpareParts).toBe(true);
    expect(plan.pages[1].hasBuyoff).toBe(true);
  });

  it('Extreme Multi-Section Overflow: expands to 12 pages with §15 Buyoff inviolably grouped on final page', () => {
    const session = createBaseSession();
    
    // 22 findings
    const findingsList = Array.from({ length: 22 }, (_, i) => ({
      id: `f-${i + 1}`,
      component: `Subsystem Part ${i + 1}`,
      conditions: ['Degradation', 'Out of tolerance'],
      engineerNote: `Extended note for component ${i + 1}`
    }));

    session.inspectionFindings = {
      lh1: { decision: 'PASS', findings: findingsList.slice(0, 11) },
      lh2: { decision: 'PASS', findings: findingsList.slice(11) }
    };

    // 8 consumed parts + 8 recommended parts + long recommendations text
    session.stage07_spareParts = [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `cp-${i}`,
        partName: `Consumed Module ${i + 1}`,
        quantity: i + 1,
        action: 'REPLACED',
        costIndicator: 'BILLABLE'
      } as any)),
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `rp-${i}`,
        partName: `Recommended Spare ${i + 1}`,
        quantity: 2,
        action: 'RECOMMENDED',
        costIndicator: 'BILLABLE',
        reason: 'Critical redundancy'
      } as any))
    ];

    session.stage08_engineerRemarks = {
      generalFindings: 'Full optical and mechanical overhaul performed across both laser paths.',
      recommendations: 'Comprehensive maintenance cycle must be accelerated to 45-day intervals. Optical bench realignment recommended during next scheduled factory downtime.'
    };

    const doc = buildMhcReportDocument(session);

    expect(doc.metadata.totalPagesCount).toBe(12);

    const s13Entry = doc.indexEntries.find(e => e.code === '13');
    const s14Entry = doc.indexEntries.find(e => e.code === '14');
    const s15Entry = doc.indexEntries.find(e => e.code === '15');

    expect(s13Entry?.pageNumber).toBe(10);
    expect(s14Entry?.pageNumber).toBe(12);
    expect(s15Entry?.pageNumber).toBe(12);

    const plan = computeReportSections13To15PaginationPlan(
      doc.sections['13']?.data,
      doc.sections['14']?.data,
      doc.sections['15']?.data
    );

    expect(plan.totalPages).toBe(12);
    expect(plan.pages.length).toBe(3);

    // Page 10: Section 13 Slice 1 (10 items)
    expect(plan.pages[0].pageNumber).toBe(10);
    expect(plan.pages[0].hasFindings).toBe(true);
    expect(plan.pages[0].findingsSlice?.items.length).toBe(10);
    expect(plan.pages[0].hasSpareParts).toBe(false);
    expect(plan.pages[0].hasBuyoff).toBe(false);

    // Page 11: Section 13 Continuation Slice 2 (12 items)
    expect(plan.pages[1].pageNumber).toBe(11);
    expect(plan.pages[1].hasFindings).toBe(true);
    expect(plan.pages[1].findingsSlice?.isContinued).toBe(true);
    expect(plan.pages[1].findingsSlice?.items.length).toBe(12);
    expect(plan.pages[1].hasSpareParts).toBe(false);
    expect(plan.pages[1].hasBuyoff).toBe(false);

    // Page 12: Section 14 Spare Parts + Section 15 Buyoff Inviolable Grouping
    expect(plan.pages[2].pageNumber).toBe(12);
    expect(plan.pages[2].hasFindings).toBe(false);
    expect(plan.pages[2].hasSpareParts).toBe(true);
    expect(plan.pages[2].hasBuyoff).toBe(true);
    expect(plan.pages[2].pageRunningHeader).toContain('SECTIONS 14–15');
  });

  it('Pages 1–9 Invariance: confirms Sections 01 through 12 page numbers are completely untouched', () => {
    const session = createBaseSession();
    const standardDoc = buildMhcReportDocument(session);
    
    // Overflow session
    const overflowSession = {
      ...createBaseSession(),
      inspectionFindings: {
        lh1: {
          decision: 'PASS' as const,
          findings: Array.from({ length: 25 }, (_, i) => ({
            id: `f-${i}`,
            component: `Component ${i}`,
            conditions: ['Alert'],
            engineerNote: 'Checked'
          }))
        }
      }
    };
    const overflowDoc = buildMhcReportDocument(overflowSession);

    for (let code = 1; code <= 12; code++) {
      if (code === 2) continue; // TOC section 02 is not listed in its own index entries
      const codeStr = code < 10 ? `0${code}` : `${code}`;
      const stdEntry = standardDoc.indexEntries.find(e => e.code === codeStr);
      const ovfEntry = overflowDoc.indexEntries.find(e => e.code === codeStr);

      expect(stdEntry?.pageNumber).toBeDefined();
      expect(ovfEntry?.pageNumber).toBe(stdEntry?.pageNumber);
    }
  });
});

