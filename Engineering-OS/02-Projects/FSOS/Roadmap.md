# FSOS Roadmap

## Current: v1.2.1

### Completed

- zero-state / ghost-data cleanup;
- authoritative Customer identity reconciliation;
- Machine Passport foundation;
- Smart MHC engineering foundation;
- Recommended Parts Master;
- Temperature graph reload/display fix;
- Temperature Inspection Delete persistence fix.

## Immediate next

### Full MHC PDF QA

Sprint 01 repair batches A–F are complete and locked. Autopilot Item #1 is implemented; its final destination behavior still requires Founder verification.

The next phase is a page-by-page QA pass of the complete Full MHC PDF before creating further repair batches.

QA sequence:
1. Page 1 → final page, in order.
2. Confirm every active section is present.
3. Confirm numbering and TOC mapping.
4. Confirm authoritative data presentation.
5. Confirm pagination, clipping, overlap, headers, and footers.
6. Record only evidence-backed findings.
7. Convert confirmed defects into small focused repair batches.

### Completed Sprint 01 repair batches

- Batch A — §07, §08, §09 restoration.
- Batch B — §12 Temperature restoration.
- Batch C — §13, §14 restoration.
- Batch D — §18 Buyoff renumbering / continuous numbering.
- Batch E — individual Autopilot engineer disposition.
- Batch F — §06 Previous vs Current comparison presentation.
- Item #1 — Autopilot exit control implemented; final destination verification pending.

## Parked

### Predictive maintenance

Do not implement yet.

Future inputs may include:
- laser hours;
- MHC history;
- drift/trends;
- temperature history;
- beam-profile history;
- replacement history;
- recommended lifespan;
- service history.

The eventual system should provide conservative risk/attention guidance, not pretend to know an exact failure date.
