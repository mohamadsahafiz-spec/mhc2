# FSOS Current State — v1.2.1

## Verified baseline

FSOS is currently at **v1.2.1**.

FSOS is a production-oriented Field Service Operations System for:
- Machine Health Check;
- laser calibration;
- Machine Passport;
- engineering measurements and evidence;
- customer reporting;
- contracts and scheduling/planning;
- Recommended Parts Master;
- future operational intelligence.

## Completed stability work

### Customer identity

Customer is an authoritative persistent entity.

- `customerId` is relationship identity.
- `customerName` is display data only.
- Imported machines reconcile to authoritative Customers.
- One authoritative Customer is maintained per imported identity.
- Associated machines retain the stable `customerId`.
- Customer rename cascades to associated machines.
- Synthetic customer resurrection has been removed.

Verified behavior includes import, rename, reload, duplicate prevention, ghost-customer prevention, and manual rename.

### Zero-state / ghost-data cleanup

The major zero-state cleanup is complete.

Verified:
- no fixture operational data is generated at runtime;
- no known ghost customer/machine resurrection path remains;
- zero-state works;
- authoritative StorageService architecture remains intact.

Do not reopen this architecture without new regression evidence.

### Recommended Parts Master

Implemented and verified:
- CRUD;
- CSV/JSON import;
- validation preview;
- explicit confirmation;
- duplicate detection;
- machineFamily + partNumber identity;
- BMD302W / BMD250WM separation;
- search/filtering;
- sorting and personalized views;
- presets;
- duration/lifespan parsing;
- persistence;
- zero-state;
- post-import manual CRUD.

Actual customer/engineering parts documents remain the source of truth. Do not invent parts.

### Temperature Inspection

The saved Temperature Inspection graph/reload defect has been fixed.

The subsequent Delete defect was fixed in v1.0.37.

Verified:
- saved Temperature Inspection records can be deleted;
- deletion purges TempRawStore telemetry and authoritative storage;
- deletion remains deleted after reload;
- Temperature graphs remain functional;
- downsampling remains functional;
- unselected records remain intact;
- all 8 reported tests passed.

Root cause of the Delete defect:
`handleDeleteSavedRecord` lacked a direct authoritative `StorageService.saveMachines` dispatch.

The fix was intentionally narrow and did not redesign the Temperature Engine.

## Protected engineering areas

Treat these as protected unless evidence requires change:
- MHC engines;
- Temperature Engine;
- Laser Hours engine;
- Machine Passport;
- SyncEngine;
- authoritative persistence;
- Customer identity architecture;
- Recommended Parts identity model.

## Current next priority

### Full MHC PDF QA

Sprint 01 repair work has completed the confirmed repair batches. The next phase is **QA, not speculative feature development**.

QA scope:
1. Review the complete Full MHC PDF page-by-page.
2. Verify section presence and numbering.
3. Verify TOC ↔ actual section ↔ page mapping.
4. Check data presentation, readability, pagination, clipping, headers, footers, and evidence.
5. Record only confirmed findings as PROVEN; do not guess.
6. Group confirmed defects into small, focused repair batches.

### Sprint 01 verified repair state

| Item | Status |
|---|---|
| Batch A — §07/§08/§09 restoration | PASS / locked |
| Batch B — §12 restoration | PASS / locked |
| Batch C — §13/§14 restoration | PASS / locked |
| Batch D — §18 numbering repair | PASS / locked |
| Batch E — Autopilot individual engineer disposition | PASS / locked |
| Batch F — §06 comparison presentation | PASS / locked |
| Item #1 — Autopilot exit control | Implemented; final destination verification pending |
| Current Autopilot label | `EXIT AUTOPILOT` |
| Intended exit destination | Canvas / Workspace |
| Current FSOS application version | **v1.2.1** |
| Next QA phase | **Full MHC PDF QA** |

### Versioning rule

FSOS application numeric version components are capped at **10**. When a component reaches 10, roll over to the next component instead of creating values above 10.

Example:
`v1.1.10 → v1.2.0`

Every implementation release must update the application version source/metadata and project changelog; the in-app/System Settings changelog must also be updated where applicable.

## Reporting / intelligence roadmap

Next major areas after chart-control stabilization:
1. Study the actual customer MHC report.
2. Compare report requirements against Smart MHC and Report Studio.
3. Identify genuine engineering/traceability gaps.
4. Design current-condition MHC Autopilot recommendations.
5. Resolve every automatic part suggestion to an existing authoritative Recommended Parts record.
6. Keep predictive maintenance parked until the foundation is stable.

Predictive maintenance is not part of the current implementation scope.
