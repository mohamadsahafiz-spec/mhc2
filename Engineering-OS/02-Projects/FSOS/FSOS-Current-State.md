# FSOS Current State — Current Working State

## Verified baseline

The archived v1.0.37 record is historical. The current working FSOS line is v1.1.x, with the latest verified working state at v1.1.16 candidate status.

Engineering-OS version: v1.8.0.

**Version rule:** FSOS numeric version components must not exceed 10. The next release version must reconcile this rule rather than blindly incrementing a component beyond 10.

This document is the current-state synchronization point for migration continuity; archived FSOS v1.0.37 records remain historical evidence and are not the current baseline.

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

Temperature chart visualization controls are the next focused enhancement.

Desired capability:
- deterministic X-axis time intervals such as 1h, 2h, 3h, 6h, etc.;
- deterministic Y-axis major-step/range behavior instead of unwanted automatic/random-looking scaling;
- clear controls placed in the Temperature workspace;
- support for all available temperature channels, not an accidental CH1-only presentation.

Important architectural boundary:
The new chart controls should be treated as visualization/display behavior unless source evidence proves that the existing Temperature Engine aggregation layer must change.

Raw telemetry must remain authoritative and unmodified by display-only controls.

The existing resampling/aggregation model must be inspected before implementation. Do not blindly replace the existing Resample Bucket behavior.

## Reporting / intelligence roadmap

Next major areas after chart-control stabilization:
1. Study the actual customer MHC report.
2. Compare report requirements against Smart MHC and Report Studio.
3. Identify genuine engineering/traceability gaps.
4. Design current-condition MHC Autopilot recommendations.
5. Resolve every automatic part suggestion to an existing authoritative Recommended Parts record.
6. Keep predictive maintenance parked until the foundation is stable.

Predictive maintenance is not part of the current implementation scope.


## Current MHC / Autopilot State

### Verified stable areas

- MHC Autopilot multi-machine session detection/recovery is verified.
- Activity 02 multi-head completion and Activity 02/03 routing are verified; both laser heads must be addressed before progression.
- Autopilot OOM/runtime regressions previously found in session handling were fixed and verified.
- Machine Passport and MHC History remain protected core workflows.
- Full PDF report generation and review are operational after forensic restoration of authoritative machine identity, thermal, laser-head, telemetry, evidence, and pagination behavior.
- Legacy UI cleanup Phase 1 removed six obsolete standalone modules while preserving Operations and the core MHC ecosystem.

### Current PDF state

The Full PDF pipeline has been substantially restored and verified. Remaining evolution is presentation/detail refinement rather than a known core data-integrity blocker.

### Legacy cleanup state

Operations remains intentionally preserved for future evolution:
- Customers & Plants
- Contracts
- Analytics

Removed legacy standalone UI modules:
- Workflow Guide (SOP)
- Laser Calibration
- Baseline Checks
- Quality Investigation
- Execution Planner
- Knowledge Base

Legacy fixture and ghost-data sources have been forensically identified. Active core persistence and MHC data paths must not be deleted merely because old fixtures exist; cleanup must follow dependency evidence.

## Immediate Pending Task

Remove **Mission Control** completely from the UI/navigation and delete its genuinely orphaned module/route code, while leaving **Daily Work** as the only item under the DAILY WORK section.

Protected during this task:
- MHC Autopilot
- Canvas / Workspace
- MHC History
- Machine Passport
- Operations
- StorageService / SyncEngine
- MHC session architecture
- Report Engine / Full PDF

Verification required after implementation:
- Vitest
- TypeScript/typecheck
- production build
- Daily Work remains functional
- core MHC workflows initialize successfully

## Migration Continuity Checkpoint

A new Atlas should resume from the Immediate Pending Task above. Do not restart the historical FSOS investigation. Use this document for current project state; consult `04-Archive` only for historical evidence.
