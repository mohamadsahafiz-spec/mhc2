# FSOS CHANGELOG

## v1.3.0 — FSOS / GITHUB RECONCILIATION & CONTINUITY (2026-09-05)

### Repository & Version State Synchronization
- **Full FSOS ↔ GitHub State Reconciliation**: Reconciled all file structures, version definitions (`v1.3.0`), and change history between FSOS and GitHub main (`mohamadsahafiz-spec/mhc2`). Verified exact SHA/content parity across all tracked repository files.
- **Evidence-Based Historical Gap Resolution**: Formally resolved the apparent `v1.2.11` gap from verified Git history (commit `d13d238`), documenting the Laser Power check form UX optimization and modal cleanup completed on 2026-09-03.
- **Authoritative Version Unification**: Synchronized all authoritative application version sources (`src/constants/version.ts`, `package.json`, `metadata.json`, `wrangler.toml`) to `v1.3.0` (`CFW-20260905-1530`).

### Autopilot Progression & Stability Enhancements
- **Activity Display Codes & Navigation**: Added standardized `displayCode` definitions to workflow schemas for clean identification in autopilot progression and process notifications.
- **Fail Disposition Flow**: Allowed completion of optical activities with failing measurements by tagging them as `NEEDS_REVIEW` instead of halting the diagnostic workflow.
- **State & Record Integrity**: Synchronized machine state with customer selection, excluded active session records from baseline lookups to avoid self-referencing, and preserved original timestamps during updates.
- **Robust ImageStore Hydration**: Debounced ImageStore hydration to prevent re-render thrashing and stabilized IndexedDB pointer resolution across application startup.
- **Recommendation & Spare Parts Flexibility**: Added source selection toggle (`Existing Passport Item` vs `Custom Item`) for recommended spare parts with optional part numbers for custom field items, fully integrated into report data pipelines and verified with automated test suites.

## v1.2.19 — BATCH B: Improve Information Hierarchy (Temperature, Laser Power, Beam Profile) (2026-09-03)

### Information Hierarchy & Readability Improvements
- **Temperature History**: Reorganized temperature history record rows into four distinct, scannable zones:
  - *Primary Identity*: Prominent title and point count badge.
  - *Subordinated Metadata*: Date, timestamp, sampling interval, and truncated secondary source file names styled with subtle contrast so they no longer visually compete with core results.
  - *Core Engineering Statistics*: High-contrast numeric badges for MIN, MAX, AVG, and RANGE metrics with thematic color accents and dark/light mode balance.
  - *Dedicated Action Zone*: Partitioned "View Graph" button and delete action separated by subtle visual boundary.
- **Laser Power**:
  - *Head 1 / Head 2 Contrast*: Redesigned measurement cells with prominent numeric readings, distinct head identity labels (`HEAD 1 (A)` / `HEAD 2 (B)`), and immediate PASS/FAIL badges with high-contrast background and border styling for both dark and light themes.
  - *Distinct Overall Power Health*: Framed the Overall Power Health card as a dedicated health overview panel with a prominent verdict display and subordinate inspection metadata.
- **Beam Profile**:
  - *Telemetry Measurements Hierarchy*: Restructured checkpoint summary cards with clear laser head labels, high-visibility measured diameter values (`mm`), instant PASS/FAIL status indicators, and subtle specification targets.
  - *Subordinated Latest Record Info*: Styled the record info card as a compact secondary metadata reference that no longer competes with primary optical telemetry data.
- **Verification & Integrity**: All underlying data schemas, calculations, interactions, and report structures remain 100% preserved.

## v1.2.18 — FOCUS OPTIMIZATION: Presentation Cleanup & Thumbnail Flicker Resolution (2026-09-03)

### Focus Optimization Presentation & Stability Refinement
- **Removed Presentation-Only µm Values**: Removed the redundant µm measurement values displayed beneath each wafer drill image in `MachineFocusOptimizationWorkspace.tsx` across both Laser 1 and Laser 2 grids, as well as in the detailed inspection modal. Position labels (+3, +2, +1, 0, -1, -2, -3) and BEST indicators remain fully intact.
- **Resolved Intermittent Thumbnail Flicker**: Traced the root cause to background SyncEngine polls triggering reference changes on `machine.focusOptimizationRecords`, which caused `useEffect` to clobber `hydratedRecords` with sync-unhydrated IDB pointers and evict cached entries from the small 32-item memory LRU cache. Implemented `mergeHydratedRecords` to preserve already-hydrated images across updates and expanded `MAX_MEMORY_CACHE_ITEMS` in `ImageStore` to 128, ensuring completely stable rendering with zero flickering.

## v1.2.17 — BATCH A: Standardize Machine Passport History Ordering (Newest → Oldest) (2026-09-03)

### History Ordering Standardization
- **Universal Newest → Oldest Presentation**: Standardized history lists across all 5 Machine Passport diagnostic modules so that the newest record is consistently presented first at the top of history tables and record lists:
  - **Temperature Workspace**: Sorted `savedRecords` by `createdAt` descending and `manualReadings` by timestamp/createdAt descending; preserved IDB telemetry linkages and raw data caching.
  - **Laser Power Workspace**: Sorted `laserPowerRecords` by `date` descending both in reactive `useMemo` display and on record save.
  - **Beam Profile Workspace**: Sorted `beamProfileRecords` by `date` descending in reactive `useMemo` display and on record save, resolving the issue where older records displayed above newer ones.
  - **Focus Optimization Workspace**: Sorted `focusOptimizationRecords` by `date` descending in reactive `useMemo` display and on record save. Preserved internal engineering focus-position sequences (`+0.300 mm` → `+0.200 mm` → `+0.100 mm` → `0.000 mm` → `-0.100 mm` → `-0.200 mm` → `-0.300 mm`) completely intact.
  - **Product & Process Workspace**: Sorted `productProcessRecords` by `date` descending in reactive `useMemo` display and on record save.
- **Automated Verification**: Added comprehensive unit test suite (`src/utils/historyOrdering.test.ts`) validating newest-first ordering across all five record types and verifying unchanged internal engineering sequences.


## v1.2.16 — BEAM PROFILE CHECKPOINT UI: Redundant Image Remove Button Removal (2026-09-03)

### Beam Profile Checkpoint UI Refinement
- **Removed Redundant Remove Button**: Eliminated the redundant `×` button and its associated absolute positioning and styling from `BeamProfileCheckpointCard.tsx`, completely removing the clipped red/pink corner overlay artifact.
- **Preserved Direct Replace Flow**: Kept the direct click-to-replace behavior on the thumbnail (`onClick` opening the native file picker), hover overlay indicator (`RefreshCw`), preview rendering, and upload storage handling 100% intact.
- **Zero Regression**: Retained full compatibility with all checkpoint card states, specifications, and parent modal / workspace integrations.

## v1.2.15 — MACHINE PASSPORT NAVIGATION UX: Integrated Subsystem Sidebar & Responsive Command Navigation (2026-09-03)

### Machine Passport Navigation UX Redesign
- **Integrated Master-Detail Layout**: Replaced the isolated, floating horizontal sub-category pill bar with an integrated, sticky left-hand subsystem navigation panel positioned alongside the active workspace content (`xl:sticky xl:top-4 w-full xl:w-64 2xl:w-72 self-start`).
- **Eliminated Dead Space & Awkward Composition**: Resolved the ~50% empty horizontal void of the previous bar. On desktop (>=1280px), navigation sits alongside the workspace, grounding the content and remaining accessible on scroll. On tablet and mobile (<1280px), navigation seamlessly transforms into a balanced 3-column banner card (`grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1`).
- **Crystal-Clear Structural Hierarchy**: Unmistakably separated non-interactive category headers (`Health & Lifecycle`, `Optics & Laser`, `Operations & Parts` with subsystem color indicators) from interactive, full-width selectable diagnostic items with active highlights, indicators, and live telemetry record count badges.
- **100% Functional Continuity**: Preserved all 7 destinations, icons, active state handlers, telemetry badge calculations, and underlying engineering logic without modifying any child workspace implementations.

## v1.2.14 — MHC SUMMARY CARDS UX: Compact Self-Fitting Health & Record Summary Layout (2026-09-03)

### MHC Summary Cards UX Optimization
- **Eliminated Vertical Stretching**: Fixed shared summary-card layout behavior across "Overall Power Health" in `MachineLaserPowerWorkspace` and "Latest Record Info" in `MachineBeamProfileWorkspace` by applying `self-start h-fit` to fit their content naturally instead of stretching to match the height of adjacent multi-item telemetry cards.
- **Removed Artificial Vertical Gaps**: Replaced `flex flex-col justify-between h-full` with comfortable `space-y-2.5` rhythmic row spacing and a refined divider line, preventing verdict badges from drifting to the bottom with empty dead space.
- **Visual Alignment & Theme Polish**: Maintained top-edge grid alignment with neighboring measurement cards across desktop and responsive single-column layouts while ensuring dark and light mode contrast parity for labels, values, and status badges.
- **100% Engineering Logic & Data Unchanged**: Kept all dates, frequencies, checkpoint counts, pass/fail indicators, calculations, and underlying records completely untouched.

## v1.2.13 — PRODUCT / PROCESS / VIA CHECK FORM UX: Compact Inspection & Micro-Drilling Modal (2026-09-03)

### Product / Process / Via Entry Modal UX Optimization
- **Compact Field-Service Layout**: Streamlined the Product, Process & Via Check entry modal in `MhcEnterProductProcessModal` with clamped modal sizing and scannable visual hierarchy.
- **Two-Column Process & Offset Matrix**: Compacted Phase 1/Phase 2 parameters and Laser Head 1/Laser Head 2 power offsets into side-by-side comparative inspection cards.
- **Interactive Via Quality Inspection**: Built integrated micro-inspection entry cards with real-time pass/fail evaluation and visual tolerance indicators against authoritative via acceptance specifications.
- **100% Data Integrity Preserved**: Fully preserved all calculations, validation gates, persistence routines, and report exports.

## v1.2.12 — BEAM PROFILE CHECK FORM UX: Compact Field-Service Data Entry Optimization (2026-09-03)

### Beam Profile Check Form UX Optimization
- **Compact Field-Service Layout**: Redesigned the "New Beam Profile Check" and "Edit Beam Profile Check" entry modal across `MhcEnterBeamProfileModal` and `MachineBeamProfileWorkspace` to eliminate full-screen stretching and excessive visual padding. Clamped container width cleanly to standard 4XL dialog bounds.
- **High-Density Checkpoint Cards**: Replaced oversized 160px checkpoint cards with compact ~72px `BeamProfileCheckpointCard` components featuring inline code pills, stage titles, high-contrast monospace specs, and instant real-time PASS/FAIL badges.
- **Optimized Select/Upload → Enter → Verify Flow**: Integrated square 40px image evidence boxes with single-click file selection, replace hover action, and one-click removal alongside comfortable numeric diameter inputs with inline `mm` suffix and smooth tab navigation.
- **Laser Head 1 & 2 Separation & Filtering**: Maintained clear amber (Laser 1 / Head A) and cyan (Laser 2 / Head B) separation with stage groupings (6A/7A Source, 6B/7B Flat Top, 6C/7C Working Zone Masks), live per-head pass counters, and an intuitive quick-filter tab bar (`All Checkpoints`, `Laser 1`, `Laser 2`) for zero-scroll single-head entry.
- **Secondary Remarks & Obvious Verdict Action**: Streamlined Engineer Remarks into a secondary single-line input and anchored a high-contrast footer verdict bar with clear overall result and prominent save action.
- **100% Engineering Logic & Data Integrity Preserved**: Kept all 14 checkpoints, specifications, calculation formulas, validation logic, image storage mechanisms, persistence routines, and report exports completely intact.

## v1.2.11 — LASER POWER CHECK FORM UX: Compact Field-Service Data Entry Optimization & Modal Cleanup (2026-09-03)

### Laser Power Check Form UX Optimization
- **Compact Field-Service Layout**: Streamlined the Laser Power check modal in `MachineLaserPowerWorkspace.tsx` and `SmartMhcWorkspace.tsx` (`MhcEnterLaserPowerModal`) with clamped modal bounds (`maxWidth="xl"`), eliminating excessive viewport stretching.
- **Theme-Aware High-Density Forms**: Refactored measurement input grids for Laser Head 1 and Laser Head 2 with theme-aware background cards, clear numeric badges, and responsive tab indexing.
- **Modal Lifecycle Stability**: Removed redundant and competing `AnimatePresence` wrappers across `MhcAutopilot.tsx` and laser power dialogs to prevent DOM thrashing and ensure clean modal mount/unmount transitions.
- **Preserved Engineering Calculations**: Retained all tolerance rules (15.0W ± 10%), baseline variation calculations, pass/fail thresholds, and IDB persistence pathways intact.

## v1.2.10 — LASER LIFECYCLE: Authoritative Recommendation Engine & Status Alignment (2026-09-02)

### Laser Lifecycle Recommendation & Status Alignment
- **Authoritative Recommendation Derivation**: Introduced `LaserEngine.calculateLaserLifecycleRecommendation()` as the single authoritative source of truth for customer-facing laser lifecycle advisories across the system, report engines, and Full PDF renders.
- **Strict Status & Verdict Consistency**: Resolved semantic contradiction where lasers in WARNING status (e.g. 22,375.7 h > 20,000 h warning limit) displayed "Approaching warning threshold".
  - **SAFE**: Describes operation below warning threshold and prescribes appropriate monitoring / routine scheduled MHC cycles based on remaining life capacity.
  - **WARNING**: Explicitly states warning threshold reached/exceeded, approaching rated EOL, and prescribes replacement source procurement prior to projected EOL date.
  - **ALARM**: Explicitly states rated operating lifespan reached/exceeded and recommends immediate laser source refurbishment or swap.
- **Unified Architecture**: Replaced duplicated recommendation string logic across `mhcReportEngine.ts` and `MhcFullPdfRenderer.tsx` with the unified `LaserEngine` derivation path.
- **Preserved Engineering Telemetry**: 100% preserved dynamic laser hour calculations, domain limits, runtime status badges, EOL projections, and all document layouts.

## v1.2.9 — FULL PDF: Production Scale 2.00 & JPEG 0.90 High-Fidelity Rendering (2026-09-02)

### Production PDF Quality Optimization
- **High-Fidelity Raster Scale 2.00**: Upgraded production Full PDF html2canvas-pro rendering engine from 1.20x (~115 DPI) to approved 2.00x scale (~192 DPI), delivering crisp, razor-sharp typography on 7–9pt labels, precise 1px table borders, and blur-free Recharts analytical charts.
- **Calibrated 0.90 JPEG Quality Encoding**: Set production JPEG compression to 0.90, matching the optical clarity of 0.95 reference rendering while achieving a ~21% reduction in PDF output file size (~2.4 MB for full 10-page document).
- **Preserved Per-Page Memory Reclamation**: Enforced immediate per-page canvas buffer disposal (`canvas.width = 0; canvas.height = 0`) and micro-yield garbage collection pauses, preventing GPU memory bloat and maintaining fast, consistent ~1.3s/page export speed.
- **Strict Page Geometry & Data Integrity**: Maintained 100% of standard ISO 216 A4 dimensions (`210 × 297 mm` / `595.28 × 841.89 pt` MediaBox), exact 10-page pagination, engineering datasets, and sign-off workflows with zero layout breakage or clipping.

## v1.2.8 — FULL PDF: Customer-Facing Readability & Contrast Enhancements (2026-09-02)

### Full PDF Readability & Typography Enhancements
- **Enhanced Document Readability & Visual Hierarchy**: Audited all 10 pages of the customer-facing Full PDF report and refined typography, table contrast, label hierarchy, and spacing.
- **Improved Contrast on Critical Field Labels**: Replaced washed-out light gray labels (`text-slate-400` / `text-slate-300`) with high-contrast, readable slate tones (`text-slate-500` / `text-slate-600` / `font-bold`) across metadata headers, inspection passport blocks, table column headers, and telemetry summaries.
- **Optimized Data Point Typography**: Upgraded microscopic data text (`text-[8px]` / `text-[9px]`) to clean `text-[10px]` / `text-[10.5px]` / `text-[11px]` across diagnostic tables (Laser Power, Optical Alignment, Beam Profile, Focus Optimization, Stage & AGC Calibration, Multi-Channel Thermal Telemetry, Product Process Parameters, Via Quality, Findings, and Spare Parts).
- **Hardened Table Legibility & Alignment**: Elevated table headers across all sections to bold, discernible typography with shaded column backgrounds for effortless scanning at 100% A4 viewing and physical printing.
- **Preserved Exact Content & Logic**: Maintained 100% of authoritative measurements, calculations, section numbers (§01–§15), 10-page structure, and sign-off blocks with zero data loss or layout breakage.

## v1.2.7 — FULL PDF: Clarified Focus Optimization Date Context (2026-09-02)

### Focus Optimization Date Disambiguation
- **Contextual Date Clarification**: Clarified the customer-facing label and context in §08 Focus Optimization to clearly denote the Focus Adjustment Date as a distinct follow-up/adjustment activity rather than the general MHC inspection date.
- **Authoritative Data Integrity**: Preserved the original recorded date value and all focus measurement telemetry.

## v1.2.6 — FULL PDF: Standardized Via Terminology (2026-09-02)

### Terminology Standardization
- **Standardized "Via" Terminology**: Standardized customer-facing terminology in the Full PDF from "Microvia" to "Via" across relevant measured/inspected via feature sections while preserving all underlying data structures, calculations, and specifications.

## v1.2.3 — FSOS SYNC: Safe Local→D1 Reconciliation & Cross-Device Bootstrap (2026-08-24)

### Safe Local→D1 Reconciliation & Cross-Device Sync Bootstrap
- **Idempotent Local Data Provider**: Integrated `StorageService.getAllLocalData` provider into `SyncEngine`, allowing existing operational data stored in local storage to be discovered and registered without destructive resets or fixture injections.
- **Pre-Queue Reconciliation Pipeline**: Added `reconcileLocalData()` to discover valid local operational records (customers, machines, MHC sessions, passports, analytics, etc.) that have never entered the queue and enqueue them for upload.
- **Tracked Synchronized Keys Registry**: Introduced `fsos_synced_keys_v1` persistent key registry (`table:id`) ensuring local records are queued and reconciled once without duplicate queue insertions on successive sync cycles.
- **Cross-Device Clean Pull**: Enabled new or secondary client devices (e.g. work laptop) to pull all authoritative bootstrapped records from D1 without re-uploading them back to the server.
- **Full Offline Resilience & Environment Portability**: Guarded all storage operations with safe environment checks, preventing any runtime crashes during Node.js/Vitest test runs or restricted sandbox contexts.

## v1.2.2 — SPRINT 01 ITEM #1 MICRO-FIX: Autopilot Exit Button Label (2026-08-23)

### Autopilot Exit Button Label Micro-Fix
- **Updated Exit Control Label**: Changed the Autopilot bottom-left navigation button label from `EXIT` to **`EXIT AUTOPILOT`** for optimal semantic clarity while preserving instant return to Canvas/Workspace and full session state retention.

## v1.2.1 — SPRINT 01 ITEM #1: MHC Autopilot Clear Exit Control (2026-08-23)

### MHC Autopilot Clear Exit Control
- **Dedicated Exit Control**: Replaced the ambiguous bottom-left "Canvas / Workspace" escape hatch in the Autopilot wizard sidebar with an unmistakable, high-visibility **EXIT** action button featuring a `LogOut` icon.
- **Immediate Return to MHC Workspace**: Clicking the EXIT button cleanly dismisses the Autopilot overlay and restores the standard FSOS / MHC Smart Workspace without advancing to subsequent Autopilot activities.
- **Authoritative Session & Data Preservation**: Autopilot session data, step progression, and active machine/customer context are strictly preserved during exit, ensuring zero data loss or session reset.

## v1.1.21 — SPRINT 01 BATCH F: §06 Laser Power Comparison Presentation (2026-08-23)

### §06 Laser Power Comparison Redesign
- **Intuitive Baseline vs Measurement Mental Model**: Redesigned §06 on Page 5 with an unmistakable layout:
  - **LEFT**: Historical Baseline (Previous) with attached baseline date.
  - **VS**: Visual comparison connector badge.
  - **RIGHT**: Present Measurement (Current) with active MHC verification date.
  - **VARIATION**: Resulting variance calculation ($\Delta = \text{Current} - \text{Previous}$ in Watts and percentage shift $\Delta\%$).
- **Working Zone Mask Comparison Matrix**: Implemented explicit table columns across both Laser Head 1 and Laser Head 2:
  `Mask Size | Previous (date) | Current (date) | Δ Power | Δ % | Status`
- **Optical Path Comparison**: Added side-by-side historical vs present tracking for Laser Source (Raw) and Optics Top Hat.
- **Authoritative Data Integrity**: Maintained all authoritative power readings, tolerance thresholds, and PASS/FAIL verdict logic with zero fabrication or changes to other PDF sections.

## v1.1.20 — SPRINT 01 RE-RUN BATCH D: Renumber Buyoff Section to §18 (2026-08-23)

### Continuous Section Numbering & Renumbering of Buyoff to §18
- **Renumbered Buyoff Section to §18**: Renumbered the remaining Buyoff & Sign-off section from §19 to **§18**, establishing a continuous, gapless sequence: **§17 → §18**.
- **Synchronized Report Engine Identifiers**: Updated `types/mhcReportDocument.ts` (`MhcReportSectionCode`, `MhcReportSectionMap`) and `utils/mhcReportEngine.ts` (`buyoffSection.code = '18'`, `displayOrder = 18`, `sectionsMap['18']`, `getSectionPageNumber`, `getSectionCategory`).
- **Harmonized PDF & Table of Contents**: Updated `MhcFullPdfRenderer.tsx` with section headers (`SECTION 15–18 — FINDINGS, RECOMMENDATIONS & BUYOFF`, `18 BUYOFF & OFFICIAL APPROVALS`), TOC subtitle (`18 Standard Subsystem Diagnostics & Certification Modules (§01–§18)`), and Table of Contents entries matching section code `18` mapped to Page 10.
- **Continuous 18-Section Document Sequence**: Validated complete sequence of active sections (§01 through §18) across 10 pages with zero content changes to §17 or the Buyoff section, and verified the old §18 evidence section remains cleanly removed.

## v1.1.19 — SPRINT 01 REPAIR BATCH D: §17 Spare Parts & §19 Buyoff Numbering/Layout Integrity (2026-08-23)

### §17 Spare Parts & §19 Buyoff Integrity & Section 18 Removal
- **Seamless §17 → §19 Document Flow**: Permanently excised Section 18 from the report flow and index entries. After §17 (Spare Parts / Recommendations), the document flow and Table of Contents proceed directly and intentionally to §19 (Buyoff & Certification).
- **Accurate §17 Spare Parts & Recommendations Rendering**: Verified and hardened §17 rendering to cleanly display consumed/replaced parts alongside proactive recommended parts from session findings (`stage07_spareParts`, `consumedParts`, and `recommendedParts`), with clean empty state handling when no spare parts are required.
- **TOC & Index Pagination Integrity**: Updated `mhcReportEngine.ts` index generator (`indexEntries`, `orderedSectionsList`, `allOrderedSections`, and `getSectionPageNumber`) to reflect 18 active report sections (§01–§17, §19) mapped across 10 pages, ensuring §17 and §19 are indexed on Page 10 without gaps or broken section anchors.
- **Dedicated Page 10 Final Wrap-up Layout**: Preserved pristine Page 10 layout containing §15 (Optical Findings), §16 (Corrective Actions), §17 (Spare Parts & Recommendations), and §19 (Official Buyoff & Customer Sign-off) with dual sign-off blocks, zero footer collision, and zero blank page insertions.
- **Full Backward Compatibility & Test Suite Verification**: All 27 tests in the FSOS test suite passing, with new dedicated assertions validating §17 → §19 sequencing and total active section counts.

## v1.1.18 — SPRINT 01 REPAIR BATCH C: §13 & §14 MHC PDF Restoration (2026-08-23)

### §13 Laser / Product Profile & §14 Product Via Quality Restoration
- **End-to-End Authoritative Pipeline Integration**: Traced and restored data pipeline for §13 (Laser / Product Profile) and §14 (Product Via Quality) connecting `MHCSession` (`stage02_laserProfile`, `stage06_productQuality`, `stage02_findings`), `MachinePassport`, and `ProductProcessRecord` through `buildMhcReportDocument` directly to `MhcFullPdfRenderer`.
- **Dynamic Recipe Phase Resolution**: Section 13 accurately resolves substrate name, recipe program, lot/panel identifier, laser head allocation (LH1, LH2, or Dual Head), and Phase 1 (Rough Cut) / Phase 2 (Bottom Polish) process parameters (Power, Frequency, Shot Count, Mask Size, Defocus) from session records without hardcoding or synthetic defaults.
- **Microvia Drilling Geometry & Dual-Laser Evaluation**: Section 14 evaluates microvia top/bottom aperture widths, taper percentage, concentricity offset, shape uniformity, and copper landing pad recast against IPC-6012 tolerances via `ProductProcessEngine.evaluateRecord` / `ProductProcessEngine.evaluateVia`.
- **Dedicated Page 9 Product & Process Diagnostics Layout**: Formatted a clean 10-page document structure with §13 and §14 housed on dedicated Page 9, featuring vector cross-section via profile SVG diagrams, dual-head tolerance tables, and process buyoff remarks.
- **Report Index & Pagination Harmonization**: Updated Table of Contents, page numbers, and footers across the 10-page MHC PDF document (`Page X of 10`) ensuring zero clipping, zero overlap, and seamless pagination boundaries.

## v1.1.17 — MHC PDF Section §12 Temperature & Thermal Telemetry Repair (2026-08-23)

### §12 Temperature MHC PDF Restoration & Architecture
- **Multi-Source Authoritative Telemetry Resolution**: Traced and restored the §12 data pipeline across `MHCSession` (`temperatureData`, `temperatureEvidenceData`) and `MachinePassport` (`temperatureRecords`). Telemetry points, 6-channel sensor statistics, global Min/Max/Avg temperatures, and chiller status are accurately resolved without synthetic default fabrication.
- **Dynamic Subsystem Status Assessment**: Section 12 status is dynamically evaluated (`COMPLETE`, `NEEDS_REVIEW`, or `NOT_COLLECTED`) based on measured operating parameters against industrial specifications (20.0°C–24.0°C temperature envelope and chiller loop flow verdict).
- **Dedicated Page 8 Thermal Telemetry Layout**: Expanded MHC PDF report architecture to a dedicated 9-page layout, separating Motion & Scanner Calibration (§10, §11 on Page 7) from Continuous Thermal Telemetry (§12 on Page 8) and Findings/Buyoff (§15, §16, §17, §19 on Page 9) to eliminate layout crowding, page clipping, and footer overlap.
- **Multi-Channel Vector SVG Telemetry Profile**: Rendered high-fidelity vector time-series thermal profile chart with tolerance band visualization, dynamic station error bars, and channel sensor matrix table.
- **TOC & Index Synchronization**: Synchronized Table of Contents page index entries across all 19 subsystem modules to reflect the 9-page report layout.

## v1.1.12 — MHC Autopilot Multi-Machine Session Detection & Resume UX (2026-08-16)

### Multi-Machine Session Detection & Continuation
- **De-coupled Machine Selection Sequence**: Refactored the Autopilot setup flow into a clear 4-step wizard (`Welcome` → `Customer Passport` → `Machine Passport` → `Session Detection & Recovery`), preventing eager default detection on the first machine (MC#1) before the engineer selects the intended target asset.
- **Accurate Machine-Scoped Session Detection**: Session detection and resumption (`handleContinueExisting`) now reliably match and resume the session belonging strictly to the selected machine.
- **Active Job Indicators**: Added visible "Active Job" badges in Customer selection and "Active Session" pulses in Machine selection to instantly show assets with ongoing incomplete inspections.
- **Quick Machine Switch**: Added a "Switch Machine" action directly in the active Autopilot session header for rapid multi-machine navigation without losing progress.
- **Parent State Alignment**: Fixed `activeSession` calculation in `MachineHealthCheckModule` to strictly filter by `selectedMachineId` without fallback pollution.

## v1.0.15 — Client-Side Storage Quota Fix & Raw Telemetry IndexedDB Offloading (2026-08-09)

### Quota Optimization & Local Storage Fix
- **LocalStorage Quota Fix**: Stripped heavy `records` raw telemetry array from `SavedTemperatureRecord` inside `localStorage` and D1 sync payload, reducing per-record JSON footprint from ~60–100MB to ~150KB.
- **IndexedDB Offloading**: Full raw temperature points offloaded to browser IndexedDB (`fsos_temperature_db`), preserving zero-data-loss auditability locally without consuming `localStorage` quota or incurring cloud storage costs.
- **Automatic Machine Sanitization**: Integrated `sanitizeMachine` in `StorageService.getMachines()` and `StorageService.saveMachines()`, automatically downsampling time-series channels exceeding 1500 points and stripping legacy bloated records.

## v1.0.14 — Version Harmonization & Cloudflare Runtime Identity (2026-08-09)

### Version Harmonization & Identity
- **Version Harmonization**: Updated `package.json`, `metadata.json`, and all UI in-app version badges (`Sidebar`, `StartPageModule`, `SettingsModule`) to `v1.0.14`.
- **Cloudflare Runtime Version Identity**: Configured `CF_VERSION_METADATA` binding and `APP_VERSION` variable in `wrangler.toml` and exposed version, `cfVersionId`, `cfVersionTag`, and `cfVersionTimestamp` via `/api/sync/status` and `/api/health`.

## v1.0.13 — D1 Performance Index Migration (2026-08-09)

### D1 Database Indexes
- **Versioned Migration `0001_add_indexes.sql`**: Created idempotent migration script adding `idx_records_updated_at` on `updated_at` and `idx_records_table_name` on `table_name` without altering existing table structures or data.
- **Production Query Optimization**: Accelerates `/api/changes` delta sync queries and `/api/sync` lookups.

## v1.0.12 — Cross-Device Deletion Synchronization (2026-08-09)

### Cross-Device Deletion Sync
- **Deletion Tombstone Generation**: `syncEnqueueList` compares previous local storage state against updated collections to automatically detect deleted items and enqueue `action: "delete"` tombstones.
- **Authoritative D1 Marking**: Cloudflare Worker `/api/sync` persists tombstones to D1 with `is_deleted = 1` and `data = null`.
- **Tombstone Propagation**: `/api/changes` delivers deletion tombstones during both incremental and full synchronization (`since=0`), ensuring deleted records do not resurrect.
- **Offline Deletion Queueing**: Deletions performed offline are queued locally and synchronized to D1 upon network reconnection.

## v1.0.11 — Authoritative D1 Persistence (2026-08-09)

### Production Source of Truth
- **Authoritative D1 Persistence**: Make D1 the authoritative server-side source of truth for FSOS records across `/api/sync`, `/api/changes`, and `/api/record`.
- **Error Handling**: Guaranteed D1 failures or connection outages return HTTP 500 error responses rather than false success.
- **D1 Schema Migration**: Added version-controlled `migrations/0000_init.sql` for D1 `records` table initialization.

## v1.0.10 — Cloudflare Dependency Sync Audit (2026-08-08)

### Audited & Fixed
- **Dependency Classification**: Moved `@tailwindcss/vite` and `@vitejs/plugin-react` from `dependencies` to `devDependencies` to prevent production build tree mismatches.
- **Lockfile Synchronization**: Re-synced `package-lock.json` lockfileVersion 3 and verified `npm ci` and `NODE_ENV=production npm ci` pass with 100% success.


## v1.0.9 — Atlas Lockfile Verification (2026-08-08)

### Verified & Synchronized
- **Lockfile Clean Regeneration**: Deleted `node_modules` and `package-lock.json`, regenerated via `npm install`.
- **Clean Install Verification**: Executed `npm ci` locally with 100% success and 0 errors, guaranteeing lockfile parity for Cloudflare Git builds.

## v1.0.8 — Lockfile Synchronization (2026-08-08)

### Synchronized & Verified
- **Lockfile Regeneration**: Regenerated `package-lock.json` via `npm install`. Verified `vite` is strictly listed under `devDependencies`.

## v1.0.7 — Cloudflare Git Build Audit (2026-08-08)

### Audited & Resolved
- **Duplicate Dependency Clean-up**: Removed duplicate `vite` declaration present in both `dependencies` and `devDependencies` in `package.json`.
- **Lockfile & Build Verification**: Audit confirmed `.gitignore` preserves `package-lock.json` and root path configuration is correct for Cloudflare Git Build.

## v1.0.6 — Git Lockfile Verification (2026-08-08)

### Verified & Verified
- **Local Lockfile Validation**: Executed `npm ci` successfully with zero lockfile mismatches or errors.
- **Git Synchronization**: Verified `package.json` and `package-lock.json` are in complete sync for Cloudflare Workers CI/CD.

## v1.0.5 — Build Lockfile Sync (2026-08-08)

### Synchronized & Fixed
- **Lockfile Synchronization**: Synchronized package-lock.json with package.json for seamless Cloudflare Workers automated builds.

## v1.0.4 — Workers Build Finalization (2026-08-08)

### Finalized & Production Ready
- **Primary Runtime**: Set Cloudflare Workers (`src/worker.ts`) as primary production runtime.
- **Package Scripts**: Added `build:worker` and `deploy` scripts in `package.json`.
- **D1 Production Binding**: Bound production D1 UUID `5121135f-9336-46a6-88cc-9a2c85caae0b` in `wrangler.toml`.
- **Direct GitHub Deploy**: Repository verified ready for direct Cloudflare Workers deployment.

## v1.0.1 — Cloudflare Deployment & Validation (2026-08-08)

### Verified & Documented
- **Wrangler & D1 Binding Verification**: Confirmed `wrangler.toml` assets (`./dist`) and D1 database binding (`DB`).
- **Cloud Run Decoupling**: Application runtime entirely independent of Cloud Run container dependencies.
- **Deployment Documentation**: Complete step-by-step Wrangler deploy instructions provided in `README.md`.

## v1.0.0 — Cloudflare Workers Foundation (2026-08-08)

### Migrated & Architecture
- **Cloudflare Workers Runtime Integration (`src/worker.ts` & `wrangler.toml`)**:
  - Full migration of application runtime and server endpoints to Cloudflare Workers native fetch standard.
  - Native route handling for `/api/health`, `/api/sync`, `/api/changes`, `/api/images`, `/api/record`, and `/api/sync/status`.
  - Configured Cloudflare D1 database binding (`env.DB`) and static asset binding (`env.ASSETS`).
- **Unified Static Asset & API Serving**:
  - Serves compiled React SPA assets directly from `dist` via `env.ASSETS` while routing API queries to native worker handlers.
- **Data Integrity & Robust Machine Lookup**:
  - Hardened Machine Passport and workspace modules against null machine access.

## v0.9.1 — Data Integrity Hotfix (2026-08-07)

### Fixed & Enhanced
- **Time Semantics**: Updated baseline default dates and saved/displayed timestamps to browser-local time (`getLocalDateString`).
- **Laser Power History**: Added `[+ New Current Check]` and `[+ Add Historical Record]` workflows. Records strictly sorted by measurement date; latest = Current, immediately preceding = Previous, "No previous record" rendered when no prior check exists.
- **IndexedDB Image Persistence**: Eliminated `localStorage` quota warnings and silent image payload pruning. Image and blob evidence are stored in IndexedDB (`ImageStore`) with lightweight references in `localStorage`.
- **Product / Process / Via Null-Safety**: Fixed `TypeError: can't access property "phase1", prev is null` across all comparison widgets with optional chaining and fallback empty state.
- **Beam Profile Record Management**: Added reliable record deletion with automatic cleanup of associated IndexedDB blob evidence.
- **Save Transaction Safety**: Atomic save flow ensures state updates occur only after successful persistence. On storage failure, form data is retained with actionable error feedback.

## v0.9.0 Phase 2.1 — Laser Lifecycle Engine Migration (2026-08-06)

### Added & Migrated
- **Native TypeScript Laser Lifecycle Engine (`src/utils/laserEngine.ts`)**:
  - Full deterministic lifecycle calculation formulas: continuous 24h dynamic runtime estimation, remaining operating hours, remaining days, and percentage calculations.
  - Multi-laser domain architecture: `MachineDomain` -> `LaserHeadDomain` -> lifecycle state, calibration history, and worst-state status aggregation (`ALARM` > `BASELINE_REQUIRED` > `WARNING` > `SAFE`).
  - Baseline management: `BASELINE_REQUIRED` status fallback when physical meter reading is missing.
  - Recalibration transaction logic: comparison between calculated estimated hour vs physical meter reading, deviation calculation, accuracy rating scale, and 10-entry calibration history auditing.
  - Evaluation time semantics (`getCurrentEvalTime`).
- **Persistence Adaptation (`src/utils/persistence.ts`)**:
  - Integrated `LaserEngine.normalizeMachines` into `StorageService.getMachines` to ensure multi-laser data schemas are seamlessly restored and normalized.
- **Type Definitions (`src/types/index.ts`)**:
  - Extended `LaserHead` and `Machine` interfaces with multi-laser engine domain properties and exported domain types.
- **Parity Validation Test Suite (`src/utils/laserEngine.test.ts`)**:
  - Verified 100% mathematical and behavioral parity against the source-of-truth Laser Hour Monitor.
