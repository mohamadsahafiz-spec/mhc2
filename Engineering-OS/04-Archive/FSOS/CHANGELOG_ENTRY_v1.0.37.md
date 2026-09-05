# Engineering OS — FSOS Changelog Entry

## FSOS v1.0.37 — 14 Aug 2026

### Fixed
- Temperature Inspection Delete now reaches authoritative `StorageService.saveMachines`.
- Deleted Temperature Inspection telemetry is purged from TempRawStore.
- Deletion persists correctly across reload.

### Verified
- Temperature graph display remains functional.
- Downsampling remains functional.
- Unselected Temperature Inspection records remain intact.
- 8 tests pass.

### Engineering note
The fix was intentionally isolated to the Delete/persistence path. The proven Temperature Engine was not redesigned.

### Next
Temperature chart controls:
- deterministic X-axis major time interval;
- controlled Y-axis major-step/range behavior;
- correct six-channel presentation;
- preservation of raw telemetry and engineering calculations.
