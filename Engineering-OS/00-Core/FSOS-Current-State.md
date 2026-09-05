# FSOS Current State — v1.0.37

## Verified baseline

FSOS is currently at v1.0.37.

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
