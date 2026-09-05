# FSOS CHANGELOG

## v1.4.1 — ENGINEERING-OS STEWARDSHIP ROLE UPDATE (2026-09-05)

### Engineering-OS Governance & Implementation Role Alignment
- **Governance vs. Implementation Role Clarification**: Updated Engineering-OS governance (`Atlas-Constitution.md`, `Engineering-OS/README.md`, `Engineering-Lessons-EL-005.md`) to explicitly reflect the repository workflow:
  - **Atlas**: Functions as the exclusive Engineering-OS governance authority (reviews evidence, determines governance specifications, prepares/approves changes, and protects constitutional integrity).
  - **Mikasa**: Functions as the implementation owner (applies approved Engineering-OS changes inside the repository under `Engineering-OS/`, verifies changes, and reports what was changed).
  - **Founder**: Retains absolute authority and approval for material governance decisions.
- **Authoritative Version Synchronization**: Synchronized all version configurations across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.1`.

## v1.4.0 — ENGINEERING-OS INTO FSOS REPOSITORY (2026-09-05)

### Repository Consolidation & Governance Integration
- **Engineering-OS System Integration**: Consolidated the entire Engineering-OS governance framework directly into the canonical FSOS repository under `Engineering-OS/`, eliminating the requirement for a separate Engineering-OS repository for standard FSOS development and governance.
- **Canonical Structure Preservation**: Fully migrated all 49 active Engineering-OS files and directories intact:
  - `00-Core/`: Constitutional governance (`Atlas-Constitution.md`), CTO checklists, prompt standards, and decision frameworks.
  - `01-Templates/`: Standard engineering templates for sprints, architecture reviews, refactoring, migrations, and releases.
  - `02-Projects/`: Project-specific architectures, roadmap, and state records (`FSOS/`).
  - `03-Knowledge/`: Comprehensive technical knowledge base cards (Cloudflare Workers, D1, KV, SQLite, React, Electron, Tauri).
  - `04-Archive/`: Complete historical sprint archives, amendment records, and retrospective logs.
- **Root Conflict Resolution & Non-Destructive Separation**: Preserved existing FSOS application code, build assets, and release documentation in the repository root while cleanly anchoring Engineering-OS governance under `/Engineering-OS/` with its dedicated README, CHANGELOG, and metadata.
- **Authoritative Version Synchronization**: Synchronized all version configurations across `src/constants/version.ts`, `package.json`, `metadata.json`, `wrangler.toml`, and root `README.md` to `v1.4.0`.

## v1.3.2 — CHANGELOG PARITY NORMALIZATION (2026-09-05)

### Changelog Representation & Parity Normalization
- **Authoritative Changelog Parity**: Synchronized and normalized the representation across all 120 historical releases between the root `CHANGELOG.md` and the in-app Changelog parser (`src/utils/changelogParser.ts`), ensuring 100% exact parity with zero data loss or missing releases.
- **Harmonized Historical Formatting**: Normalized representation for releases `v1.2.7`, `v1.2.6`, `v1.2.3`, `v1.2.2`, `v1.2.1`, `v1.1.21`, `v1.1.20`, `v1.1.19`, `v1.1.18`, `v1.1.17`, `v1.1.12`, `v1.0.15`, `v1.0.14`, `v1.0.1`, `v1.0.0`, and `v0.9.1` using authoritative Markdown headings and rich structured bullet points.
- **Automated Parity Verification**: Expanded test suite in `src/utils/changelogParser.test.ts` to assert presence and structure across all 120 versions, guaranteeing zero duplicate releases and complete chronological ordering.

## v1.3.1 — IN-APP CHANGELOG SYNCHRONIZATION (2026-09-05)

### In-App Changelog Single Source of Truth
- **Direct Authoritative Markdown Integration**: Replaced the static, hardcoded, and divergent in-app changelog dataset in `SettingsModule.tsx` with dynamic parsing of the root `CHANGELOG.md` (`src/utils/changelogParser.ts`), establishing `CHANGELOG.md` as the single authoritative source of truth across both documentation and in-app display.
- **Full Historical & Milestone Coverage**: Rendered all 40+ engineering milestone entries from `v1.3.1` down to initial foundation releases (`v0.9.0` / `v0.1.0`), guaranteeing exact version, date, title, subsection, and wording fidelity without duplication or manual divergence.
- **Theme-Aware Hierarchical Rendering**: Preserved existing card UI and dark/light mode aesthetics while adding clean styling for subsection categories (`### `), bold prefix highlights, and indented sub-bullet points.
- **Automated Verification**: Added unit test coverage (`src/utils/changelogParser.test.ts`) validating authoritative parsing, section structure, and historical version coverage.

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

## v1.2.5 — Laser Terminology Standardization & Physical Head Identifier Alignment (2026-08-24)

### Highlights
- STANDARDIZED LASER TERMINOLOGY: Unified physical laser head references to "Laser Head 1" / "Laser Head 2" (and compact "LH1" / "LH2") across all sections and summaries.
- MACHINE VS LASER IDENTITY SEPARATION: Removed misleading machine serial number suffix patterns (MC230038-LH01/LH02) in favor of genuine laser serial numbers.
- SYSTEM TERMINOLOGY INTEGRITY: Preserved "Laser" for subsystem contexts and unified Executive Summary inspection table to "Laser Power (Laser Head 1 & 2)".

## v1.2.4 — Full PDF Section Metadata Consistency & Running Header Synchronization (2026-08-24)

### Highlights
- AUTHORITATIVE RUNNING HEADERS: Derived all Full PDF running headers from authoritative indexEntries section metadata via getPageRunningHeader.
- STALE HEADER ELIMINATION: Fixed Page 8 running header from stale Section 12 to authoritative Section 11 (Temperature & Thermal Telemetry).
- UNIFIED METADATA ALIGNMENT: Guaranteed perfect alignment across running headers, section headings, Table of Contents, and continuous numbering sequence.

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

## v1.1.15 — MHC Autopilot Multi-Head Inspection Unified Routing & State Preservation (2026-08-16)

### Highlights
- UNIFIED ACTIVITY CODE ROUTING: Consolidated multi-head laser inspection workflow into a single unified 02_findings activity, eliminating dead-end routing through nonexistent 03_findings.
- MULTI-HEAD COMPLETION RULE: Implemented strict dual-head verification requiring both Laser Head 1 and Laser Head 2 to be evaluated before advancing to Day 2 (04_stage1), with automatic NEEDS_REVIEW propagation.
- PERSISTENT HEAD STATE & DISCOVERY: Replaced destructive activeCode tab resets with unaddressed-first head discovery and robust alphanumeric head matching (6A/7B, lh1/lh2).
- INDEPENDENT FINDINGS & RESILIENT EVIDENCE: Ensured independent finding and draft isolation per head and seamless resolution of idb: image pointers upon session rehydration.

## v1.1.14 — MHC Autopilot Activity Completion Event Injection & OOM Elimination (2026-08-16)

### Highlights
- EVENT-ARGUMENT STRIPPING: Wrapped Autopilot and Activity 01 completion callbacks in zero-argument handlers to prevent React click MouseEvents from leaking into the session pipeline.
- DEFENSIVE SESSION VALIDATION: Hardened handleCompleteCurrentActivity and advanceAutopilotActivity to strictly validate session shape and require valid string IDs before updating or advancing.
- CORRUPTION PURGING IN PERSISTENCE: Filtered malformed/DOM-contaminated session entries from getMhcSessions and saveMhcSessions to ensure clean, isolated session storage.

## v1.1.13 — MHC Autopilot Activity Completion Out-of-Memory Freeze Resolution (2026-08-16)

### Highlights
- BATCHED INDEXEDDB WRITE QUEUE: Replaced individual unawaited transaction spawns with a single batched write queue, eliminating transaction queue buildup and IndexedDB out-of-memory lock exhaustion during session state updates.
- REDUNDANT PERSISTENCE FILTERING: Introduced a persisted key registry to skip redundant writes for already stored images, drastically cutting transaction volume and storage thread pressure.
- STRUCTURAL SHARING EXTRACTION & HYDRATION: Refactored ImageStore.extractAndStoreImagesSync and hydrateImagesSync with structural sharing, returning untouched object references when no images are modified and eliminating unnecessary deep object cloning across unchanged session branches.
- ZERO-LATENCY ACTIVITY ADVANCE: Enabled smooth, instantaneous Journey Rail completion and navigation transitions on Activity 01 (Laser Hours) and all downstream Autopilot stages.

## v1.1.12 — MHC Autopilot Multi-Machine Session Detection & Resume UX (2026-08-16)

### Multi-Machine Session Detection & Continuation
- **De-coupled Machine Selection Sequence**: Refactored the Autopilot setup flow into a clear 4-step wizard (`Welcome` → `Customer Passport` → `Machine Passport` → `Session Detection & Recovery`), preventing eager default detection on the first machine (MC#1) before the engineer selects the intended target asset.
- **Accurate Machine-Scoped Session Detection**: Session detection and resumption (`handleContinueExisting`) now reliably match and resume the session belonging strictly to the selected machine.
- **Active Job Indicators**: Added visible "Active Job" badges in Customer selection and "Active Session" pulses in Machine selection to instantly show assets with ongoing incomplete inspections.
- **Quick Machine Switch**: Added a "Switch Machine" action directly in the active Autopilot session header for rapid multi-machine navigation without losing progress.
- **Parent State Alignment**: Fixed `activeSession` calculation in `MachineHealthCheckModule` to strictly filter by `selectedMachineId` without fallback pollution.

## v1.1.11 — MHC Autopilot Temperature Workspace & Scroll Architecture (2026-08-16)

### Highlights
- TEMPERATURE TELEMETRY VISUALIZATION: Integrated the authoritative multi-channel TemperatureGraph directly inside the MHC Autopilot Temperature activity (06), displaying real multi-station thermal data without fake or duplicated values.
- REMOVAL OF MISPLACED EVIDENCE BLOCK: Cleaned up Activity 06 by removing the misplaced generic evidence collection form, keeping the activity strictly focused on machine thermal telemetry log integration.
- NATURAL VIEWPORT SCROLLING: Removed unnecessary nested and internal vertical scroll containers across Autopilot activities, allowing workflow content to expand naturally downward with smooth viewport-level scrolling.
- SEAMLESS THERMAL METRIC DISPATCH: Preserved channelData and thermal statistics across session persistence and autopilot progression pipeline.

## v1.1.10 — MHC Autopilot Laser Workflow Unification & Beam Profile Persistence (2026-08-16)

### Highlights
- UNIFIED LASER WORKSPACE & SCHEDULE: Consolidated Laser 1 & Laser 2 into unified side-by-side matrix workspaces for Laser Power (02_power), Beam Profile (02_beam), and Optical Inspection (02_findings), eliminating duplicate workflow schedule entries.
- CUSTOMER-FACING NOMENCLATURE: Standardized on "Laser 1" and "Laser 2" naming across all workspaces, stage labels, and journey rails, eliminating legacy Head A / Head B terminology.
- BEAM PROFILE PERSISTENCE INTEGRITY: Sealed state persistence for Beam Profile & Mode inspection data, ensuring all 16 measurement points, image references, and evaluation verdicts survive navigation roundtrips to Report Generation and browser reloads with 100% fidelity.
- AUTHORITATIVE SESSION ROUNDTRIP: Connected child activity state dispatches directly into the parent Autopilot progression pipeline to prevent state clobbering and stale React prop re-initialization.

## v1.1.9 — MHC Autopilot Mechanics, Progression & Unified Workspace Architecture (2026-08-16)

### Highlights
- UNIFIED INSPECTION DECISION & PROGRESSION: Streamlined inspection mechanics into a single authoritative flow where both "No Issue Found" (COMPLETED) and "Issue / Recommendation Found" (NEEDS REVIEW) reliably advance the Journey Rail without trapping the engineer.
- CYCLE-SAFE PERSISTENCE HARDENING: Replaced naive global WeakSet tracking with an active ancestor recursion stack in ImageStore and StorageService serialization, ensuring shared non-circular objects and findings survive browser reloads intact.
- UNIFIED LASER POWER WORKSPACE: Standardized Laser 1 and Laser 2 side-by-side matrix terminology, removing legacy Head A/B references and unifying the power measurement experience.
- AUTHORITATIVE SESSION DISPATCH: Ensured completion triggers pass the newly updated session state directly to journey advancement handlers, preventing stale React state race conditions.

## v1.1.8 — MHC Inspection Journey Progression & Image Persistence Engine (2026-08-15)

### Highlights
- SEAMLESS AUTOPILOT ADVANCEMENT: Updated advanceAutopilotActivity to advance the Journey Rail on both COMPLETED and NEEDS_REVIEW finalizations, allowing findings with replacement recommendations to smoothly advance to the next laser head/stage without trapping the engineer.
- MHC SESSION IMAGE OFFLOADING: Integrated ImageStore IndexedDB offloading into saveMhcSessions and getMhcSessions, preventing localStorage QuotaExceededError and preserving all findings/evidence photos across reload.
- CYCLE-SAFE SERIALIZATION & TRAVERSAL: Added WeakSet circular-reference guards to ImageStore image extraction/hydration and unified safe serialization across SyncEngine and Persistence.
- SINGLE AUTHORITATIVE INSPECTION FLOW: Streamlined inspection decision and finding recording into a single, cohesive workflow with direct Save & Complete feedback.

## v1.1.7 — MHC Inspection Workflow, Report Audit & Persistence Hardening (2026-08-15)

### Highlights
- UNBLOCKED FINDINGS PROGRESSION: Completed inspections with issues/recommendations or replacement requirements now advance the Journey Rail smoothly without trapping the engineer on the inspection activity.
- REPORT READINESS INTEGRITY: Findings requiring review or replacement remain fully preserved for engineering and official PDF reporting while unblocking Day 4 Report readiness audits once physical inspection is complete.
- PERSISTENCE CYCLE-SAFE HARDENING: Implemented cycle-safe JSON stringification and WeakSet tracking across StorageService and SyncEngine, eliminating cyclic-object and recursive-traversal exceptions.
- UNIFIED DECISION UX: Eliminated redundant intermediate confirmation banners and synchronized head inspection state transitions directly with the completion gate.

## v1.1.6 — Full MHC PDF — Phase 2 Quality & Laser Lifecycle Fixes (2026-08-15)

### Highlights
- LASER LIFECYCLE PRECISION: Integrated LaserEngine calculations for EACH laser head in the Full PDF report, displaying authoritative current hours, Warning and Error/EOL limits, life remaining percentage, visual life bar, remaining operating hours and days, and estimated EOL dates.
- MACHINE IDENTITY & DATA-DRIVEN METADATA: Added authoritative machine number/source (e.g. WLVIA#3) and fully data-driven/editable Engineer Name, Company, Inspection Date, and System Release Verdict.
- PAGE STRUCTURE REFACTORING: Separated Table of Contents (02) into a dedicated page, giving Machine Information & Configuration (03) a clean dedicated new page.

## v1.1.5 — 🏆 Official MHC PDF Export — Breakthrough (2026-08-15)

### Highlights
- Four PDF export approaches failed before the fifth approach succeeded. Replacing legacy html2canvas 1.4.1 with html2canvas-pro restored reliable Official MHC PDF generation while preserving the existing MHC report architecture, Tailwind v4 styling, OKLCH colors, telemetry charts, and evidence rendering.
- Founder reminder: Do not give up because the first four approaches fail. Investigate, adapt, and keep going.

## v1.1.4 — Laser Power Data Integrity & AGC Signed Telemetry Release (2026-08-14)

### Highlights
- LASER POWER PERSISTENCE INTEGRITY: Eliminated redundant completion dispatch clobbering in MhcLaserPowerActivity, ensuring all 16 Laser Head 1 & Laser Head 2 engineering measurements, out-of-spec findings, and review states persist authoritatively across workspace navigation and reloads.
- AGC SIGNED TELEMETRY EXPANSION: Extended MHCAgcResult and MhcAgcActivity to calculate, persist, and display signed xMinUm, xMaxUm, yMinUm, and yMaxUm alongside max absolute deviations across Indices 0–5.
- REPORT & DASHBOARD INTEGRATION: Integrated AGC signed range telemetry into real-time activity dashboards, executive PDF summary tables, and authoritative cleanroom session storage.

## v1.1.3 — Autopilot Laser Power Progression & Review State Fix (2026-08-14)

### Highlights
- LASER POWER PROGRESSION UNBLOCKED: Updated progression gate to require completeness (all 16 measurement points entered) rather than all-pass, allowing real out-of-spec/degraded findings to be recorded in MHC cleanroom audits.
- NEEDS_REVIEW INTEGRITY: Maintained strict pass: false and overallResult: FAIL for out-of-spec points with complete diagnostic evidence while advancing the activity state as NEEDS_REVIEW.
- JOURNEY RAIL ADVANCEMENT: Enabled seamless progression to downstream activities (Beam Profile, Findings) with explicit out-of-spec diagnostic summaries retained in completion gates.

## v1.1.2 — MHC Autopilot Workflow Blockers Resolution (2026-08-14)

### Highlights
- BLOCKER 1 — LASER POWER INPUT & VALIDATION STABILITY: Modernized numeric input handling with decimal string decoupling to eliminate truncation of fractional entries (e.g. 14.8W, 0.45W), integrated granular engineering failure explanations per measurement point, provided comprehensive out-of-spec feedback lists in completion gates, and implemented bidirectional completion gating across Laser Head 1 and Laser Head 2.
- BLOCKER 2 — AUTOPILOT SPLIT SCROLLING ARCHITECTURE: Resolved long report layout breakage by enforcing a fixed-viewport split layout with a permanently pinned, independently scrollable Journey Rail sidebar and smooth full-height multi-page report preview container.
- VERSION INTEGRITY: Seamlessly bumped authoritative FSOS application version to v1.1.2 while preserving independent subsystem and engine revisions.

## v1.1.1 — Streamlined Single-Version UI Presentation (2026-08-14)

### Highlights
- SINGLE VISIBLE FSOS VERSION: Maintained one authoritative application version badge (v1.1.1) in the primary header/sidebar, eliminating UI clutter.
- REMOVED REDUNDANT VERSION DISPLAYS: Purged duplicate version indicators from the bottom-left sidebar footer, System Settings operational banner, and About System card.
- PROTECTED INDEPENDENT COMPONENT ARCHITECTURES: Preserved internal subsystem engine versioning (Machine Health Check Report Engine, Cloudflare Worker bindings, D1 sync protocols) untouched.
- CONTINUOUS REGRESSION COMPLIANCE: Verified clean builds, full Vitest suite passing, and persistent data integrity across all cleanroom workspaces.

## v1.1.0 — Authoritative FSOS Application Version Consolidation (2026-08-14)

### Highlights
- SINGLE AUTHORITATIVE VERSION ARCHITECTURE: Consolidated all user-facing FSOS application version displays (Sidebar header badge, system footer, Start Page banner, and System Settings) to authoritative v1.1.0.
- ELIMINATED STALE APPLICATION VERSION BADGES: Cleaned up legacy/stale application-level version references (v0.9.x, v1.0.20) across UI cards, headers, and Cloudflare Worker endpoints.
- PRESERVED INDEPENDENT SUBSYSTEM VERSIONS: Retained legitimate independent component versions (Machine Health Check Report Engine v1.0.31.4, schema versions, zero-state migration keys) intact without artificial renaming.
- APPLICATION VERSION PROGRESSION RULE: Established formal MAJOR.MINOR.PATCH versioning rule with patch cap at 10 advancing cleanly to v1.1.0.

## v1.0.37 — In-App Delete Confirmation Modal & Authoritative Persistence Sync (2026-08-14)

### Highlights
- IN-APP CONFIRMATION DIALOG: Replaced native window.confirm() with an FSOS in-app confirmation modal, eliminating sandboxed iframe suppression in AI Studio live preview while preserving production behavior.
- SYNCHRONOUS STORAGE PERSISTENCE: Bound StorageService.saveMachines directly to Temperature Workspace record deletion and creation handlers, guaranteeing immediate disk & cloud sync.
- ISOLATED RECORD PURGING: Deleting a temperature inspection record cleanly purges cached raw telemetry in IndexedDB and updates machine passport history without affecting sibling records.
- PERMANENT RELOAD RETENTION: Verified deleted records remain permanently removed across page reloads and browser restarts with zero data regression.
- PROTECTED ARCHITECTURAL BOUNDARY: Preserved all temperature graphing, downsampling, MHC computations, and customer identity architectures untouched.

## v1.0.36 — Saved Temperature Record Delete Action (2026-08-14)

### Highlights
- SAVED RECORD DELETION: Enabled seamless deletion of selected saved temperature records directly from both the inspection history list and the detail graph modal view.
- PERSISTENCE SYNCHRONIZATION: Removing a temperature inspection record immediately updates machine passport state and purges associated telemetry from persistent storage.
- RELOAD RESILIENCY: Verified deleted temperature records remain permanently deleted across application reloads while preserving remaining inspection records and fleet data.
- PROTECTED ARCHITECTURE: Retained exact temperature parsing, aggregation, downsampling, graph rendering, and multi-channel integrity without modification.

## v1.0.35 — Saved Temperature Inspection Graph NaN Fix (2026-08-14)

### Highlights
- TIMESTAMP REHYDRATION ENGINE: Resolved graph rendering defect where persisted temperature inspection records produced NaN timestamps and collapsed time-series.
- FULL-CYCLE DATE SERIALIZATION: Rehydrates ISO strings, epoch milliseconds, and space-separated datetime formats into valid Date timestamps across save, persistence, and reload cycles.
- ROBUST GRAPH COORDINATES: TemperatureGraph accurately converts all serialized channel timestamps into clean HH:mm:ss X-axis labels and tooltips.
- STATISTICAL & CHANNEL INTEGRITY: Preserved exact MIN, MAX, AVG, and RANGE metrics and multi-channel downsampled profiles without data loss.
- BACKWARD COMPATIBILITY: Fix immediately restores both existing persisted records and newly saved temperature inspections.

## v1.0.34 — Recommended Parts Interactive Column Sorting (2026-08-14)

### Highlights
- COLUMN SORTING ENGINE: Enabled multi-field interactive sorting across all columns (Machine Family, Part Number, Part Name, Quantity, Price, Life Span, Lead Time, and Criticality).
- BI-DIRECTIONAL TOGGLES: Clicking any column header toggles between ascending and descending sort orders with distinct directional indicators.
- DEFAULT SORT ORDER: Standardized initial table view to Part Number natural alphanumeric sorting (A→Z).
- COMPOSABLE FILTERING: Sorting operates seamlessly alongside real-time search queries, category filters, and BMD302W/BMD250WM machine family segregation.
- PRESERVED INTEGRITY: Retained 100% of CRUD operations, structured CSV/JSON import, duplicate detection, and zero-state data compliance.

## v1.0.33 — Recommended Parts Structured Import (2026-08-14)

### Highlights
- STRUCTURED IMPORT ENGINE: Added safe CSV and JSON import workflow for Recommended Parts Master catalog.
- MACHINE FAMILY INTEGRITY: Enforced strict machine family segregation (BMD302W and BMD250WM) with non-destructive duplicate matching and resolution strategies.
- VALIDATION & PREVIEW: Real-time import preview displaying total records, new records, existing matches, and field-level validation errors before confirmation.
- EXPLICIT USER CONFIRMATION: Prevents silent overwrites or unsolicited persistence; records are only committed via StorageService upon explicit user confirmation.
- TEMPLATE DOWNLOADS: Integrated engineering sample CSV schemas for BMD302W and BMD250WM parts with required specification fields.
- ZERO-STATE PRESERVED: Retained zero-state architecture with zero fixture records, maintaining full CRUD and search/filter compatibility.

## v1.0.32 — Recommended Parts Master (2026-08-14)

### Highlights
- RECOMMENDED PARTS MASTER: Established authoritative Recommended Parts catalog separated by machine family (BMD302W, BMD250WM, and Other).
- MACHINE PASSPORT INTEGRATION: Added Recommended Items management entry point with Family/Criticality filtering, search, and full CRUD support.
- PERSISTENT STORAGE: Integrated master parts persistence into authoritative StorageService and SyncEngine without duplicate authorities.
- STABLE REFERENCE RESOLUTION: Formulated PartsEngine resolver for MHC maintenance recommendations and Report Studio lookup by stable part UUIDs.
- ZERO-STATE INTEGRITY: Preserved strict zero-state architecture with zero ghost/fixture records until explicitly created by the user.

## v1.0.31.5 — Start Page Data-Driven Cleanup & Residual Hardcoded Data Removal (2026-08-13)

### Highlights
- DATA-DRIVEN START PAGE: Connected all StartPageModule operational cards directly to authoritative schedule, machines, and tasks props.
- HARDCODED DATA REMOVAL: Fully removed all static operational identities (ASM Eagle XP-01/02/03/04/05, STMicroelectronics Muar) from JSX markup.
- DYNAMIC MISSIONS & SCHEDULE: Today's Schedule, Upcoming Work, and Today's Primary Mission derive strictly from authoritative runtime data.
- ZERO-STATE EMPTY STATES: Start Page renders clean intentional empty states when no machines or scheduled tasks are present without seeding fallback records.
- PROTECTED ARCHITECTURE UNTOUCHED: StorageService, SyncEngine, D1, Customer/Machine Passport, MHC, Canvas, and engineering engines strictly preserved.

## v1.0.31.4 — Complete Operational Data Reset (2026-08-13)

### Highlights
- COMPLETE OPERATIONAL DATA RESET: Fully cleared all runtime operational data (Customers, Machines, MHC Sessions, Reports, Contracts, Schedules, Tasks, Investigations, Plants, Lines, Evidence).
- CLEAN EMPTY STATE: Application starts with zero customer and machine records, ensuring no ghost/fixture data (TSMC, Hyundai, ASML) is ever hydration-seeded.
- ONE-TIME AUTOMATIC PURGE: Executed one-time localStorage and sync queue purge for v1.0.31.4 upgrade, resetting persistent state completely.
- MANUAL ENTRY MANDATE: Customer Passport and Machine Passport render clean empty state prompting explicit manual equipment entry.
- ENGINEERING ENGINES PRESERVED: Temperature Engine, Laser Power Engine, Beam Profile Engine, Calibration, Autopilot, Report Renderer, and calculations fully preserved.

## v1.0.31.3 — Customer Storage Authority Repair (2026-08-13)

### Highlights
- SINGLE AUTHORITATIVE CUSTOMER PERSISTENCE: StorageService is now the single authoritative storage path for Customer data across FSOS.
- REMOVED DUAL STORAGE AUTHORITY: Eliminated MachinePassportModule independent fsos_customer_list state and legacy storage key.
- REMOVED RUNTIME FIXTURE FALLBACK: Discontinued INITIAL_CUSTOMERS runtime fallback; empty Customer store remains empty without generating ghost records.
- SYNC ENGINE TOMBSTONE PROTECTION: Prevented stale fixture lists from enqueuing delete tombstones against legitimate Customer records.
- SAFE DATA MIGRATION: Seamlessly migrated and merged any legitimate records from legacy fsos_customer_list before key removal.

## v1.0.31.2 — MHC Autopilot Render Loop Fix (2026-08-13)

### Highlights
- MHC AUTOPILOT RENDER LOOP FIX: Resolved React infinite update loop caused by object reference dependency on progress.activityNotes in useEffect.
- PRIMITIVE DEPENDENCY STABILIZATION: Updated useEffect dependency to primitive progress.activityNotes?.[currentCode] string.
- FULL SYSTEM STABILITY: Verified startup, normal render, activity note persistence, and Customer/Machine Passport rendering without recursion.

## v1.0.28 — Phase 7 — MHC Readiness Review (Day 4) (2026-08-12)

### Highlights
- MHC AUTHORITATIVE SESSION AUDIT: Performs comprehensive live readiness audit across all Day 1–3 engineering activities (01 through 06) without modifying or duplicating underlying session data.
- DERIVED AUDIT MATRIX: Dynamically evaluates Laser Hours, Head 1 & 2 Power, Beam Profile, Optical Inspections & Findings, Stage 1 & 2 Calibration, AGC 1 & 2, and Temperature Telemetry.
- READINESS STATE CATEGORIZATION: Clearly classifies session status into 🟢 READY FOR REPORT or 🟠 ATTENTION REQUIRED with explicit blocker counts and next actionable steps.
- INTERACTIVE DIRECT NAVIGATION: Every audit row and blocker item is clickable, allowing instant jump navigation back to the relevant activity to resolve issues.
- REPORT GATE ENFORCEMENT: Locks Activity 08 Report Generation until all required engineering activities pass without blockers; automatically unlocks Activity 08 when readiness criteria are satisfied.
- NON-BLOCKING OPTIONAL EVIDENCE: Correctly treats optional attachments as non-blocking items, ensuring engineers are never stuck on optional evidence.

## v1.0.27 — Phase 6 — Temperature & Evidence Integration (Day 3) (2026-08-12)

### Highlights
- PROTECTED TEMPERATURE ENGINE INTEGRATION: Directly connects the proven TemperatureEngine log parser and analysis pipeline into Autopilot without rewriting or duplicating code.
- AUTOMATIC LOG ANALYSIS & PASSPORT RECORDING: Parses raw .log/.txt telemetry files or attaches saved Machine Passport records into the active MHC session.
- AUTHORITATIVE SUMMARY DASHBOARD: Displays concise global thermal statistics (Min, Max, Avg, Delta) and Station 1–6 channel breakdowns inside Autopilot.
- CANVAS JUMP ACTION: Provides direct "Open Interactive Temperature Canvas" action button for deep chart analysis.
- LIGHTWEIGHT AUTHORITATIVE EVIDENCE COLLECTION: Supports attaching and linking inspection images, calibration documents, and temperature evidence to the session.
- DAY 3 COMPLETION & DAY 4 READINESS UNLOCK: Completing Activity 06 automatically unlocks Day 4 MHC Readiness Review (07) while keeping Report Generation locked.

## v1.0.26 — Phase 5 — AGC Autopilot (Day 3) (2026-08-12)

### Highlights
- INDEPENDENT AGC 1 & AGC 2 WORKSPACES: Dedicated final-result entry workspaces for AGC 1 and AGC 2 scanners/laser heads with independent tracking.
- FULL INDEX 0–5 RECORDING: Captures final X and Y deviation results in µm for all 6 indices (Index 0 through 5).
- REAL-TIME ±3.0 µm SPECIFICATION ENGINE: Computes Max Abs X, Max Abs Y, and Overall Max Deviation against the ±3.0 µm tolerance limit.
- POKA-YOKE SPEC ENFORCEMENT: Values outside ±3.0 µm trigger OUT OF SPEC state, block PASS completion, and flag stage as NEEDS_REVIEW.
- SCANNER CONDITION WARNING: Out-of-spec readings flag "Scanner calibration outside specification — scanner condition requires engineering attention" with 2-year planning datum advisory.
- RE-RUN REVISION & OPTIONAL EVIDENCE: Allows re-entry for physical re-run verifications and optional external AGC report image attachment.
- DAY 3 ADVANCEMENT: Dual PASS on AGC 1 & AGC 2 automatically marks 05 AGC COMPLETED and unlocks Day 3 Temperature & Evidence (06).

## v1.0.25 — Phase 4 — Stage Calibration Autopilot (Day 2) (2026-08-12)

### Highlights
- INDEPENDENT STAGE 1 & STAGE 2 WORKSPACES: Authoritative final-result calibration entry workspaces for Stage 1 and Stage 2 with independent status tracking and tab switching.
- X/Y MIN & MAX DEVIATION RECORDING: Captures X Min, X Max, Y Min, and Y Max deviation readings in µm per stage.
- REAL-TIME SPECIFICATION ASSESSMENT (±2.0 µm): Automatically calculates Max Abs X, Max Abs Y, and Overall Max Deviation against the ±2.0 µm tolerance benchmark.
- POKA-YOKE SPEC ENFORCEMENT: Exceeding ±2.0 µm triggers OUT OF SPEC state, marks stage NEEDS_REVIEW, and prevents granting PASS status.
- RE-RUN CORRECTION & OPTIONAL EVIDENCE: Supports physical re-run entry revisions and optional external calibration report image attachment.
- AUTOPILOT DAY 3 ADVANCEMENT: Unlocks Day 3 AGC upon completing both Stage 1 and Stage 2 calibration with PASS.

## v1.0.24 — Day 1 Autopilot Integration + Poka-Yoke Hardening (2026-08-12)

### Highlights
- SESSION RESUME & HYDRATION: Verified seamless session progress, measurements, findings, and Journey Rail state restoration upon reload/reopen.
- HEAD INDEPENDENCE: Strictly decoupled Laser Head 1 and Laser Head 2 inspection findings and completion status; Day 1 requires both heads to satisfy requirements before advancing.
- NEEDS REVIEW PROPAGATION: Reopening or editing earlier completed activities flags downstream dependent steps as NEEDS_REVIEW until re-verified.
- POKA-YOKE HARDENING: Enforced strict validation across required fields, out-of-spec power/beam handling, and material engineering constraints without introducing artificial blockers.
- DAY 1 COMPLETION & DAY 2 TRANSITION: Seamless transition to Day 2 actionable state upon completing all Day 1 activities while keeping Stage Calibration locked until Day 2.

## v1.0.23 — Phase 3D — Optical / Mechanical Inspection + Findings (2026-08-12)

### Highlights
- INDEPENDENT LASER HEAD INSPECTIONS: Allows recording optical/mechanical inspection findings independently for Laser Head 1 and Laser Head 2 with dedicated completion tracking.
- FAST NO-ISSUE PATH & PROGRESSIVE FOLLOW-UPS: Directly completes clean laser heads with one-click "No issue found", or activates progressive component damage follow-ups when an issue is reported.
- RELEVANT OPTICAL COMPONENTS & DAMAGE SELECTION: Supports cameras, TC lens, scanner lenses, transmitting optics, and custom components paired with multi-select damage conditions and action recommendations.
- ENGINEERING RULE ENFORCEMENT: Enforces known constraint that burned transmitting optics cannot be restored by cleaning and require replacement.
- AI FINDING ASSISTANCE: Provides controlled "Generate Finding Wording" assistance to convert facts into editable report-ready summaries without blocking offline execution.

## v1.0.22 — Phase 3C — Beam Profile / Mode Autopilot (2026-08-12)

### Highlights
- SIDE-BY-SIDE BEAM WORKSPACE: Interactive measurement workspace displaying Laser Head 1 and Laser Head 2 side-by-side across 8 measurement stations (Laser Source, After Optics, Index Masks 0–5).
- DATA CAPTURE & HISTORICAL BASELINE: Captures current beam diameters, computes PASS/FAIL against BeamProfileEngine specifications, and calculates Delta mm and Delta % against historical machine records.
- OPTIONAL EVIDENCE IMAGE ATTACHMENT: Preserves real uploaded beam profile evidence images without forcing evidence upload (missing image does not block completion).
- POKA-YOKE & OUT-OF-SPEC VALIDATION: Enforces complete, valid numeric beam diameter measurements for all 16 stations and flags out-of-spec values before allowing Journey Rail advancement.
- AUTHORITATIVE PERSISTENCE: Saves evaluated BeamProfileCheckRecord directly to the active MHC session model and Machine Passport record.

## v1.0.21 — Phase 3B — Laser Power Autopilot (2026-08-12)

### Highlights
- SIDE-BY-SIDE POWER WORKSPACE: Replaced manual report entry with a fast engineering measurement workspace displaying Laser Head 1 and Laser Head 2 side-by-side.
- 8 MEASUREMENT POINTS PER HEAD: Measures Laser Source, After Optics, and Index Masks 0 through 5 using native LaserPowerEngine and MASK_SPECS constants.
- PREVIOUS VS CURRENT BASELINE COMPARISON: Automatically retrieves the most relevant historical MHC record for the machine and displays previous values, Delta W, and Delta %.
- POKA-YOKE & OUT-OF-SPEC VALIDATION: Instantly evaluates entered values, flags out-of-spec or invalid measurements, and enforces complete resolution before marking Activity 02 Power COMPLETED.
- AUTHORITATIVE SESSION PERSISTENCE: Saves validated power check records into the MHC session model and Machine Passport while updating the Journey Rail status.

## v1.0.20 — Phase 3A — Day 1 Laser Hours Autopilot (2026-08-12)

### Highlights
- DAY 1 LASER HOURS INTEGRATION: Connected Machine Passport data and native LaserEngine to Autopilot so Laser Hours becomes the first real engineering activity.
- DUAL LASER HEAD DISCOVERY: Automatically retrieves and displays operating hours, baseline records, operating deltas, and lifecycle health for Laser Head 1 and Laser Head 2.
- ENGINEER VERIFICATION & RECALIBRATION: Allows engineers to confirm retrieved readings or record recalibrated/adjusted operating hours for offline runtime without destroying original source info.
- COMPLETION GATE & JOURNEY RAIL: Requires verification of both laser heads before marking Activity 01 COMPLETED, automatically advancing Autopilot progress and unlocking downstream activities.

## v1.0.19 — MHC Autopilot Session Brain Sprint (2026-08-12)

### Highlights
- SESSION BRAIN ENGINE: Built persistent session/progress layer tracking Customer, Machine, MHC Session ID, Start Date, Current Day, Active Activity, and Readiness Score across Days 1–4.
- ACTIVITY STATE ARCHITECTURE: Tracks atomic status per activity (✓ COMPLETED, ◉ CURRENT / IN PROGRESS, ⚠ NEEDS REVIEW, ○ UPCOMING, 🔒 LOCKED).
- JOURNEY RAIL BRAIN: Interactive Journey Rail displays real-time status tree indicators and supports direct jump navigation to any unlocked or completed activity.
- READINESS MODEL: Lightweight readiness calculator computes completed count, incomplete count, needs review items, next actionable activity, and core engineering report readiness.
- READ-ONLY REVIEW MODE: "Review Progress" allows inspection of session state and readiness without mutating session data.
- SESSION RECOVERY & START NEW: Start New creates genuinely new sessions without overwriting existing sessions, while Continue Existing restores exact progress.

## v1.0.18 — MHC Journey Rail Correction Sprint (2026-08-12)

### Highlights
- JOURNEY RAIL STRUCTURE: Corrected MHC Autopilot Journey Rail labels and hierarchy to reflect the actual multi-day MHC workflow.
- DAY 1: 01 Laser Hours, 02 Laser Head 1 (Power, Beam Profile / Mode, Inspection / Findings), 03 Laser Head 2 (Power, Beam Profile / Mode, Inspection / Findings).
- DAY 2: 04 Stage Calibration (Stage 1, Stage 2).
- DAY 3: 05 AGC (AGC 1, AGC 2), 06 Temperature & Evidence.
- DAY 4: 07 MHC Readiness Review, 08 Report Generation, 09 Buyoff / Complete.
- PLANNED / LOCKED ACTIVITIES: Activities are visually planned/locked on the Journey Rail without adding measurement logic yet, preserving setup flows and canvas engines intact.

## v1.0.17 — MHC Autopilot Foundation Sprint (2026-08-12)

### Highlights
- MHC AUTOPILOT ENTRY: Introduced MHC Autopilot as the primary Machine Health Check experience asking ONE focused question at a time.
- MHC JOURNEY RAIL: Introduced the Journey Rail status model (completed, current, needs review, upcoming) supporting setup and planned activities.
- SESSION RECOVERY & DETECTION: Auto-detects existing incomplete sessions with options to Continue Existing, Start New, or Review Progress without data loss.
- CANVAS INTEGRATION: Retained full Smart MHC Workspace canvas accessibility under "Canvas / Workspace" without modifying existing engines.

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

## v1.0.2 — Cloudflare Workers Migration Finalization & Version Harmonization (2026-08-08)

### Highlights
- CTO STRATEGIC DIRECTIVE: Finalized full migration from legacy Cloud Run container runtime to serverless Cloudflare Workers native edge infrastructure (src/worker.ts) with Cloudflare D1 sqlite database persistence (env.DB) and edge asset delivery (env.ASSETS).
- PRODUCT EVOLUTION FOUNDATION: Native D1 database transactions for background sync and image metadata, eliminating heavy server container dependencies while serving React SPA static assets globally via Cloudflare Edge.
- SYSTEM VERSION HARMONIZATION: Synchronized all in-app version badges, Operational Build Status (CFW-20260808-102), Wrangler deployment configuration (wrangler.toml), and documentation across FSOS.

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

## v0.9.0 — Phase 1.3: Smart MHC Refine & Release (ECO-20260806-038) (2026-08-06)

### Highlights
- CRITICAL WORKSPACE CORRECTION: Expanded Smart MHC across full viewport width while preserving exact A4 210:297 portrait aspect ratio and centering canvas.
- NEW: Canvas View Controls — integrated Zoom -, 100%, Zoom +, and Fit Page auto-scaling to fit A4 document perfectly inside viewport.
- NEW: DOM-Measured A4 Capacity Engine — real-time calculation of rendered document height against standard A4 printable height with visual fill meter.
- NEW: Automated Quality Check & Over-Capacity Guard — blocks PDF export when report height exceeds 1 page and alerts engineer to adjust widget layout.
- NEW: ISO 13374-4 Inspired Condition Monitoring Intelligence — automated Current Condition, Degradation Trend, Health Score, Prognosis Life, and Recommended Actions.
- NEW: Isolated A4 Print & PDF Export Engine — full-screen print preview modal generating clean 1-page A4 PDF output with zero UI chrome.
- NEW: Automatic Previous MHC Historical Comparison — automatically identifies and compares power, beam spot size, and thermal loop against previous machine session.
- NEW: Single Source of Truth Synchronization — inline data edits in Smart MHC sync instantly to active session data and data tray.
- NEW: Strict Separation of Templates & Drafts — Templates store structure/layout only; Drafts store full session measurements, custom fields, and canvas state.

## v0.9.0 Phase 1.2 — Phase 1.2: Smart MHC Core Build (ECO-20260806-037) (2026-08-06)

### Highlights
- NEW: Smart MHC Engine Single Source of Truth — direct bind to Machine Passport static identity, active MHCSession readings, and previous MHC historical data.
- NEW: Functional Data Tray availability engine — real-time AVAILABLE / MISSING / N/A status badges based on machine and session data state.
- NEW: [+ Add Custom Data] — create reusable, bindable MHC fields/measurements with text, number/unit, date/time, status, note, image, or measurement field types.
- NEW: Data-Connected Canvas Widgets — Laser Life, Laser Temp/Thermal Loop, Laser Power Calibration, Beam Comparison, Optics Condition, Process Parameters, Spare Parts, and Recommendations.
- NEW: Inline Missing Data Edit & Sync — fill missing readings directly inside Smart MHC without redirecting to Stage 01–08 forms; changes sync instantly across widgets and session.
- NEW: [+ Create Custom Widget] — build user-defined widgets binding existing or custom Data Tray fields with customizable display types (Cards, Tables, Callouts, Images).
- NEW: Interactive A4 Portrait Canvas — full drag/reorder controls (Move Up/Down, Duplicate, Remove), 1/1, 1/2, 1/3 column layouts, and A4 page fill capacity indicator.
- NEW: ISO 13374-4 Inspired Condition-Monitoring Intelligence — automated Current Condition, Degradation Trend, Overall Health Score, Prognosis Remaining Life, and Recommended Actions.
- NEW: Automatic Previous MHC Historical Comparison — compares current wattage, beam spot size, and thermal loop against previous completed MHC session without manual re-entry.
- NEW: Strict Separation of Templates & Drafts — Templates store structure/layout only (Save/Load/Duplicate); Drafts store actual machine session work, measurements, evidence, and canvas state.

## v0.8.1 — MHC CRUD & Machine Passport UX Refinement (ECO-20260803-035) (2026-08-03)

### Highlights
- FIXED: Machine Passport Customer deletion logic — customer deletion is strictly blocked when machines are assigned.
- FIXED: Machine Passport Machine deletion — deleting the last machine deletes ONLY that machine; customer account remains intact.
- FIXED: Removed duplicate "Machine Actions" dropdown from the Machine Detail panel; retained 3-dot card menu as primary CRUD control.
- NEW: Stage 01 (Current Laser Hour) CRUD controls — added "+ Add Laser" and per-laser "Delete Laser" actions with customizable identifiers.
- NEW: Stage 01 Remaining Hours indicator — calculated dynamic remaining hours with prominent alert badge when ≤500 hrs remaining.
- NEW: Stage 03 (Laser Output & Power) CRUD controls — added "+ Add Power Head" and per-head "Delete Laser Head" actions with customizable identifiers.
- NEW: Stage 03 Evidence Photo Management — added photo upload and thumbnail deletion for each laser power head.
- NEW: Photo evidence upload & instant thumbnail removal for Stages 02, 04, 05, and 06.
- COMPLETED: Version bump to v0.8.1 with complete system documentation harmonization.

## v0.8.0 — MHC Operations Workspace Release (ECO-20260803-034) (2026-08-03)

### Highlights
- NEW: Machine Health Check (MHC) operational workspace promoted to first-class primary category.
- NEW: Saved Report Draft Management featuring Load Draft, Duplicate Draft, and Delete Draft with confirmation.
- NEW: Real CSV Parsing & Data Hydration supporting field mapping with SUCCESS, PARTIAL, and ERROR feedback.
- NEW: Multi-Section CSV Data Export containing complete structured engineering data from Stages 01 through 08.
- NEW: Stage 01 Laser Hour auto-calculation model: Recorded Laser Hour + Reading Date + Reading Time + Elapsed Runtime = Calculated Current Laser Hour.
- NEW: Dynamic Engineer Identity integration removing all remaining hardcoded engineer names across MHC workflows.
- IMPROVED: Live Customer MHC Report Builder preview, document canvas, and executive sign-off blocks.
- COMPLETED: Full Definition of Done for v0.8.0 MHC Operations Workspace.

## v0.7.8 — Machine Passport Stability Sprint (ECO-20260803-032) (2026-08-03)

### Highlights
- NEW: Adopted Engineering Rule #004 (Empty State Recovery) across FSOS.
- IMPROVED: Machine Passport empty-state workflow and recovery.
- IMPROVED: Add Machine creation flow and form state initialization.
- IMPROVED: Machine management usability and layout consistency.
- FIXED: Empty-state Add Machine button not responding when all machines are deleted.
- FIXED: Duplicate "+" button in Add Machine interface.
- KNOWN ISSUES: Machine Health Check workflow improvements scheduled for future sprint.
- KNOWN ISSUES: Workflow Navigator UX refinement deferred.
- KNOWN ISSUES: Google AI Studio Git synchronization may intermittently fail.

## v0.7.7 — Machine Health Check Workflow Sprint (ECO-20260803-031) (2026-08-03)

### Highlights
- NEW: Machine Health Check (MHC) operational workflow overhaul.
- NEW: Active Inspection Target Machine selection grid with real-time status and health score filters.
- NEW: Laser Hour Monitoring & Lifecycle Threshold management (Recorded Hours, Current Reading, Runtime Delta, Warning/Critical Thresholds).
- NEW: Dynamic Laser Output & Power Calibration Check supporting multi-laser configurations (Add/Edit/Delete laser heads).
- NEW: Dynamic Editable Inspection Sections (Optics Cleanliness, Chiller Thermal Loop, Executive Release Verdict).
- NEW: 1-Click Customer MHC Report Generation reusing shared Executive Report engine.
- NEW: Standalone Customer-Ready MHC Report Document View with print, PDF export, sign-off blocks, and Before/After photos.
- FIXED: Customer account deletion following Engineering Rule #001 CRUD consistency with confirmation dialog.
- FIXED: Machine addition workflow keeps engineer inside active customer fleet workspace.
- NEW: Machine Card 3-Dot Action Menu (Edit Specifications, Rename Asset, Duplicate Machine, Delete Machine).
- NEW: Machine Photo Management (Upload, Change, and Remove image support for JPG, PNG, WEBP).

## v0.7.6 — Premium Light Experience (ECO-20260803-030) (2026-08-03)

### Highlights
- NEW: Premium Light Theme refinement milestone.
- NEW: UI polishing phase officially introduced across all system views.
- IMPROVED: Overall visual consistency, typography hierarchy, and enterprise presentation quality.
- IMPROVED: Increased text contrast across headings, body text, and labels for WCAG compliance.
- IMPROVED: Introduced depth between layout layers (off-white bg-slate-50 canvas vs pure white cards).
- IMPROVED: Distinct sidebar surface separation and refined subtle borders.
- IMPROVED: Card hierarchy with consistent spacing, subtle elevation, and stronger hero emphasis.
- FIXED: Visual refinement issues addressed during the Premium Light Experience sprint.
- KNOWN ISSUES: Workflow Navigator UX refinement deferred to a future sprint.
- KNOWN ISSUES: Cloudflare deployment currently requires platform-aware Vite base path configuration.
- KNOWN ISSUES: Google AI Studio Git synchronization may intermittently fail.

## v0.7.5 — Identity Experience Refinement (ECO-20260802-029) (2026-08-03)

### Highlights
- UX REFINEMENT: Centralized Engineer Profile management into dedicated My Profile workspace.
- CLEANUP: Completely removed duplicate profile fields (photo, name, role, email, phone, company, department) from Settings.
- DESKTOP ERGONOMICS: Re-architected My Profile into balanced 2-column layout (Personal Info vs Account Context & Certifications).
- HEADER POLISH: Compacted top header account menu trigger to [Avatar ▼], removing redundant text clutter.
- NAVIGATION HARMONIZATION: Direct profile access links from Sidebar Engineer Card, Header Account Menu, Users Directory, and Profile Panel.
- USERS DIRECTORY REDESIGN: Simplified Users table to 5 core columns with zero horizontal scrolling.
- OVERLAY STANDARDIZATION: Unified outside click, ESC key dismissal, and navigation auto-close across Notification Center and Account Dropdowns.
- FSOS DISCIPLINE: Synchronized system version v0.7.5 across all headers, sidebar, settings, and release documentation.

## v0.7.4 — Engineer Profile Photos & Identity System (ECO-20260802-028) (2026-08-03)

### Highlights
- NEW: Individual Engineer Profile Photos for multi-engineer system readiness.
- NEW: Photo Upload, Change Photo, Remove Photo, and Restore Default Avatar controls in My Profile.
- NEW: Instant photo preview with 5MB file size validation and JPG/JPEG/PNG/WEBP format checks.
- NEW: Automatic system-wide photo propagation across Sidebar, Header Account Menu, Users Directory, Profile Drawer, Activity Log, and Report Studio.
- NEW: Clean Initials Avatar generator fallback (e.g. Sahafiz -> SA) ensuring zero broken image icons.
- NEW: Users Table now begins every engineer row with [Avatar] | Full Name | Role | Company | Department | Status.
- NEW: Report Studio includes engineer avatars beside Prepared By, Approved By, and Reviewed By signatures.
- NEW: Activity Log renders [Avatar] Sahafiz updated Machine Passport for high-fidelity accountability.
- FSOS RULE #001: Enforced CRUD consistency & version synchronization to v0.7.4 across all workspaces.

## v0.7.3 — Identity & User Management (ECO-20260802-027) (2026-08-03)

### Highlights
- NEW: First-class "Users" module positioned in main sidebar above Settings for comprehensive team & identity governance.
- NEW: System Users directory table displaying Avatar, Full Name, Employee ID, Company, Department, Role, Status, and Last Login.
- NEW: Multi-Role hierarchy support with custom styled badges: Administrator, Field Service Engineer, Senior Engineer, Supervisor, Manager, and Viewer.
- NEW: Dynamic Real-time User Status tracking: Online, Offline, On Leave, Busy, and Inactive.
- NEW: Detailed User Profile drawer & editor with contact details, regional timezone/language settings, bio, and identity metadata.
- NEW: Top-right Header User Account menu with avatar, quick identity switch, notifications, appearance, and settings shortcuts.
- NEW: Multi-Engineer foundation enabling seamless active signed-in user switching with zero hardcoded engineer names remaining.
- SYSTEM HARMONIZATION: Version updated to v0.7.3 across Sidebar, Settings, About System, Release Notes, and Product Evolution Log.

## v0.7.2 — Founder Identity & Notification Center (ECO-20260802-026) (2026-08-03)

### Highlights
- NEW: Founder Identity dynamic engineer profile greeting (e.g. "Good Morning, Sahafiz").
- NEW: Functional Notification Center bell with real-time operational notifications, unread badge counter, category tags, and click-to-navigate capabilities.
- NEW: Notification management controls including "Mark as Read", "Mark All as Read", and "Clear All".
- NEW: Configurable Engineer Profile source in System Settings allowing instant customization of Name, Company, Role, and Department.
- IMPROVED: Removed all remaining placeholder/demo engineer names ("Alex") across Machine Health Check, Execution Planner, Quality Investigation, Machine Passport, and Today's Activity Log.
- IMPROVED: Operational realism and user identity continuity across all FSOS workspaces.
- FIXED: Version and system build documentation synchronized to v0.7.2 across Sidebar, Settings, About System, and Report Studio.
- KNOWN ISSUES: Workflow Navigator UX refinement deferred to a future sprint.

## v0.7.1 — Daily Work Orchestration (ECO-20260802-025) (2026-08-02)

### Highlights
- NEW: Daily Work operational entry point serving as the engineer's primary operational home upon opening FSOS.
- NEW: Mission orchestration providing unified visibility into customer (STMicroelectronics Muar), machine status (ASM Eagle XP-01), mission progress, and priority actions.
- NEW: Start Mission workflow for seamless execution initialization on new field service assignments.
- NEW: Continue Mission workflow enabling instant one-click resumption of active on-site work orders.
- NEW: Integrated Today's Schedule timeline and 3-day Upcoming Work outlook directly into the operational home page.
- NEW: Status KPI row tracking Machines Scheduled (2), Contract Days Remaining (68), Reports Pending (1), and Overdue Tasks (0).
- IMPROVED: Quick Access shortcuts providing direct 1-click navigation to Machine Passport, Workflow Guide, Planner, and Report Studio.
- IMPROVED: Navigation flow between existing modules, eliminating manual module searching and cognitive friction.

## v0.7.0 — Daily Work Operational Entry Point (ECO-20260802-025) (2026-08-02)

### Highlights
- NEW: Daily Work operational entry point serving as the engineer's primary operational home upon opening FSOS.
- NEW: Mission orchestration providing unified visibility into customer, machine status, mission progress, and priority actions.
- NEW: Continue Mission workflow enabling instant one-click resumption of active on-site work orders.
- NEW: Start Mission workflow for seamless execution initialization on new field service assignments.
- IMPROVED: Navigation flow between existing modules (Dashboard, Machine Passport, Workflow Guide, Planner, Report Studio).
- IMPROVED: Engineer workflow continuity, eliminating manual module searching and cognitive friction.

## v0.6.8 — Mission Companion Floating Guide Rail Refactor (ECO-20260802-023B) (2026-08-02)

### Highlights
- Floating Scroll-Sync Companion: Refactored Mission Companion container with responsive sticky positioning (`top-3 sm:top-4 z-20`) so the guide rail seamlessly floats along with the screen as engineers scroll down SOP steps.
- Elevated Backdrop Blur Styling: Enhanced Mission Companion container with backdrop blur filter, subtle shadow, and border rings so it visually floats alongside the SOP timeline content stream.
- Cross-Device Scroll Tracking: Ensured mobile, tablet, and desktop viewports all maintain active step scroll syncing and instant jump navigation.
- Cleanroom Operational Ergonomics: Optimized layout for single-column and two-column cleanroom tablet display ergonomics.
- System Version Harmonization: Synchronized v0.6.8 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.

## v0.6.7 — Mission Companion Behaviour Fix (ECO-20260802-023A) (2026-08-02)

### Highlights
- Founder Intent UX Alignment: Corrected Mission Companion behaviour to function as a quiet, ambient guide rail naturally embedded in the Workflow Guide.
- Zero Sidebar Chrome Perception: Removed heavy card borders and floating box aesthetics so engineers perceive guidance as part of the SOP document flow.
- Frameless Ambient Guide Rail: Blended step progress indicators and scroll tracking quietly into the page margin without intrusive visual popups or drawer chrome.
- Continuous Shift Ergonomics: Preserved smooth step jumping, active step scroll sync, and percentage progress indicators for 8-hour cleanroom shifts.
- System Version Harmonization: Synchronized v0.6.7 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.

## v0.6.6 — Mission Companion Integration (ECO-20260802-023) (2026-08-02)

### Highlights
- Product Vision Standard: Officially integrated Mission Companion as an ambient, quiet, and predictable guide rail within the Workflow Guide.
- Zero Visual Friction Execution: Removed explicit sidebar chrome perceptions, letting the Mission Companion visually blend directly into the SOP document flow.
- Continuous Shift Ergonomics: Designed for cleanroom Field Service Engineers operating for 8-hour shifts without cognitive overhead or manual scroll-backs.
- Real-time SOP Synchronization: Preserved precision scroll observer, instant step jumping, progress percentage tracking, and active step highlighting.
- PWA Cross-Platform Packaging: Strengthened Web App Manifest, standalone display mode, and icon support across Windows, macOS, Android, and iOS.

## v0.6.5 — Workflow Companion UX Alignment (ECO-20260801-022E) (2026-08-01)

### Highlights
- Product Engineering UX Analysis: Formulated invisible, ambient Workflow Companion paradigm focusing on cleanroom operational ergonomic flow.
- Zero Visual Friction Principle: Shifted design criteria away from explicit "sticky sidebar" perception toward seamless ambient progress HUD.
- Continuous Operational Sync: Preserved real-time scroll observer, instant step jump, and step status tracking without intrusive UI chrome.
- PWA Foundation Enhancements: Enhanced web app manifest, stand-alone display tags, iOS web app capabilities, and cross-platform mobile icon paths.
- System Version Harmonization: Synchronized v0.6.5 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.

## v0.6.4 — Workflow Navigator Behaviour Correction (ECO-20260801-022D) (2026-08-01)

### Highlights
- Founder Intent UX Alignment: Configured Workflow Navigator as a persistent left-hand working companion (`sticky top-4`) during SOP scrolling.
- Zero-Scroll Jump Navigation: Guaranteed engineers always see Current Step, Completed Steps, Next Steps, and can jump instantly without scrolling back to top.
- Preserved SOP Aesthetics: Maintained clean 2-column SOP timeline flow without redesigning layout or creating unrequested secondary chromes.
- Automatic Step Observer: Real-time scroll detection keeps active step status, completion badges, and progress bar in continuous sync.
- Full PWA Foundation Established: Web App Manifest, standalone display mode, theme settings, and cross-platform mobile icons (Windows, macOS, Android, iOS).

## v0.6.3 — Unified Workflow Layout (ECO-20260801-022C) (2026-08-01)

### Highlights
- Founder Layout Refactor: Completely eliminated the separate Workflow Navigator column, merging navigation and SOP into one continuous engineering document.
- Integrated Inline SOP Sequence Ribbon: Embedded quick-nav roadmap directly inside document flow, eliminating independent floating sidebar perception.
- Maximized Engineering Content Space: Removed left workspace column so SOP section cards expand naturally across full container width.
- Unified Scroll Architecture: Document content and embedded navigation scroll together naturally as a single operational manual.
- PWA Architecture Foundation: Established PWA manifest, theme colors, display standards, and mobile icon configurations.

## v0.6.2 — Workflow Navigator Follow Behaviour (ECO-20260801-022B) (2026-08-01)

### Highlights
- Founder UX Correction: Configured Workflow Navigator to naturally follow the engineer while reading through long SOP sections.
- SOP Working Companion: Styled navigator as a document guide rail (`sticky top-4`) attached to the SOP timeline left margin.
- Eliminated Floating Sidebar Feeling: Preserved lightweight, calm document-rail visual identity without creating a secondary application chrome.
- Unbroken Navigation Access: Guaranteed engineers never need to scroll back to the top to jump between SOP phases.
- Maintained Real-Time Sync: Full support for active step scroll detection, step-jump smooth scrolling, and dark/light themes.

## v0.6.1 — Workflow Navigator Polish & Integration (ECO-20260801-022A) (2026-08-01)

### Highlights
- Established FSOS Workflow Presentation Principle: Every workflow feels like one continuous operational document.
- Refined Workflow Navigator into a sleek, integrated SOP Guide Rail that attaches seamlessly to the timeline content stream.
- Eliminated duplicate navigation headers and redundant step labels to establish single-source visual clarity.
- Subordinated Navigator container styling with lighter footprints, left border indicator pills, and refined typography.
- Optimized desktop spatial grid spacing and responsive mobile guide rail alignment.
- Concluded Workflow Navigator milestone in full preparation for Daily Work Orchestration.

## v0.6.0 — Service Execution Foundation — SOP Navigation Enhancement (ECO-20260801-022) (2026-08-01)

### Highlights
- Established FSOS Workflow Navigation Principle: Exists once, remains visible, reflects progress.
- Replaced top horizontal Mission Progression bar with persistent sticky vertical Workflow Navigator.
- Implemented automatic scroll-position synchronization with real-time active step detection.
- Added visual step indicators for completed (✓), active (►), and upcoming (○) SOP stages.
- Integrated smooth-scroll click jumping across all 6 SOP phases (Mission, Passport, MHC, Planner, Report, Complete).
- Extracted WorkflowNavigator as a reusable component for future execution modules (Calibration, Quality, Reports).

## v0.5.3 — Machine Passport Production Ready (ECO-20260731-021) (2026-07-31)

### Highlights
- Declared Machine Passport feature-complete for Founder Release v0.5.3.
- Validated two-tier workspace interaction standard: Workspace Management vs Selected Object Management.
- Refined Customer & Machine Workspace card visual consistency, dashed creation tiles, and hover states.
- Verified zero modal clipping issues on Machine Hero Cockpit dropdowns across Light and Dark themes.
- Established Machine Passport as the gold-standard reference implementation for upcoming Service Execution and Report Studio milestones.

## v0.5.2 — Workspace Interaction Standardization (ECO-20260731-019) (2026-07-31)

### Highlights
- Established FSOS permanent Workspace Interaction Principle: Creation is a Workspace Action, Management is an Object Action.
- Extracted "Add Machine" from Machine Actions dropdown and implemented dedicated "+ Add Machine" card tile in Machine Workspace grid.
- Maintained strict visual consistency between Customer Workspace cards and Machine Workspace cards (proportions, border-radius, hover transitions, dashed creation tiles).
- Enhanced Managed Laser Fleet header with rich customer account site, asset count, and operational availability status indicators.
- Kept Machine Actions dropdown strictly contextual to the selected machine (Edit, Rename, Duplicate, Archive, Delete).
- Updated version discipline across system sidebar, settings, report studio, and CTO notes.

## v0.5.1 — Customer Workspace Management (ECO-20260731-018) (2026-07-31)

### Highlights
- Resolved MP-001 Machine Hero Cockpit dropdown menu clipping issue by eliminating parent overflow constraints.
- Completed full Customer CRUD suite (Add, Edit Details, Quick Rename, Delete Account) with persistent state.
- Integrated overflow dropdown menu (⋮) on all Layer 1 Customer Cards for inline account management.
- Added Add Customer card to Layer 1 grid for streamlined account creation.
- Enforced full version alignment to v0.5.1 across system sidebar, settings, and release notes.

## v0.5.0 — Customer Workspace Foundation (ECO-20260731-017) (2026-07-31)

### Highlights
- Architected Layer 1 Customer Workspace with high-precision account cards displaying machine counts, average health, PM due, and critical alert badges.
- Architected Layer 2 Machine Workspace displaying filtered laser asset cards for the active customer account.
- Seamlessly bound Layer 3 Machine Hero Cockpit to selected machine cards for unified 3-tier navigation: Customer → Machine → Workspace.
- Preserved all existing CRUD features (Add, Edit, Rename, Duplicate, Archive, Delete) and 8-Point MHC execution workflows.
- Scaled navigation architecture for multi-customer, multi-site, and 100+ machine expansion.
- Updated system version discipline to v0.5.0 across all application modules.

## v0.4.2 — Machine Passport UX Enhancement (ECO-20260730-016) (2026-07-30)

### Highlights
- Redesigned Machine Passport top section into a high-precision industrial hero cockpit.
- Created Fleet Navigator strip with Previous/Next machine controls and active status counts.
- Promoted selected machine to prominent Hero Card displaying core identity, health gauge, and location.
- Grouped all management functions (Add, Edit, Rename, Duplicate, Archive, Delete) into a sleek Machine Actions dropdown.
- Streamlined primary workflow actions (Execute 8-Point MHC, View Reports) for immediate engineer clarity.
- Maintained complete backward compatibility and system version discipline at v0.4.2.

## v0.4.1 — Machine Passport Management (ECO-20260730-015) (2026-07-30)

### Highlights
- Integrated complete Machine Passport Management suite inside MachinePassportModule.
- Added Add Machine feature with complete telemetry baseline, laser heads, and consumable defaults.
- Added Edit Machine feature for updating machine specifications, customer allocations, and health scores.
- Added Rename Machine feature for fast inline re-designation of machine models and IDs.
- Added Delete Machine feature with confirmation dialog and automatic fleet re-selection.
- Positioned high-visibility management toolbar for <5-second discovery in Machine Passport.
- Updated system version discipline to v0.4.1 across sidebar, settings, and release notes.

## v0.3.1 — Theme Consistency (ECO-20260730-013) (2026-07-30)

### Highlights
- Completed system-wide Light Theme compliance audit across all 15 operational modules.
- Standardized shared theme tokens across reusable UI primitives (Card, Button, Badge, Modal, Tables).
- Eliminated hardcoded theme color overrides to ensure automatic theme inheritance.
- Improved readability, font weights, and surface elevation contrast for bright site operations.
- Unified Dark Mode and Light Mode visual fidelity and component behavior.
- Engineering Metrics: 28 Files Reviewed, 14 Files Modified, 112 Hardcoded Theme Colors Converted, 0 Remaining Violations.

## v0.3.0 — Premium Light Experience (ECO-20260730-012) (2026-07-30)

### Highlights
- Rebuilt Light Theme Design System for enhanced clarity, accessibility, and professional polish.
- Elevated text contrast hierarchy across headings, body text, and labels for comfortable reading.
- Improved surface elevation and border separation for clean card visibility across all system views.
- Refined sticky workflow navigation, badges, timeline connectors, and buttons for light mode operations.
- Enhanced sidebar readability with distinct section group titles and active item indicators.
- Dark theme token values strictly preserved and verified.

## v0.2.9 — Information Architecture (ECO-20260730-011) (2026-07-30)

### Highlights
- Sidebar reorganized into workflow-based groups (DAILY WORK, SERVICE EXECUTION, OPERATIONS, SMART TOOLS, SYSTEM).
- Added collapsible navigation sections with auto-expansion for the active workflow tab.
- Reduced navigation complexity and cognitive load for field service engineers.
- Improved engineer workflow discovery following operational journey instead of flat/alphabetical lists.
- Preserved existing module functionality and routing architecture across all 15 system modules.

## v0.2.8 — Guided Navigation (ECO-20260730-010) (2026-07-30)

### Highlights
- Added sticky Mission Progression navigation bar for effortless orientation during field operations.
- Added smooth scroll workflow navigation with stable section anchors (#mission, #passport, #mhc, #planner, #report, #complete).
- Active workflow step now tracks scrolling automatically via IntersectionObserver without layout flashing.
- Improved Workflow Guide usability for new field service engineers entering cleanroom sites.
- Existing workflow architecture, 6-phase SOP journey, and direct quick-action buttons preserved.

## v0.2.7 — Workflow Guide (ECO-20260730-009) (2026-07-30)

### Highlights
- Introduced new Workflow Guide module providing 6-phase Standard Operating Procedure (SOP).
- Standardized step structure: Purpose, What To Do (max 4 bullets), Expected Outcome, Quick Action Buttons.
- Added visual progress indicator bar and end-of-workflow completion badge.

## v0.2.5 — Mission Control Signature Design (ECO-20260730-003) (2026-07-30)

### Highlights
- Transformed Mission Control into an engineer's Operational Desk with signature visual identity.
- Implemented full pastel color language (#111315, #1A1D21, #20252B, #2B323A, #8B9DFF, #7FD4A6, #8ECDF7, #EFCB7A, #E98A8A).
- Implemented complete Theme Engine supporting Dark, Light, and System modes with smooth 250ms transitions.
- Refined Hero Section answering the 5 core operational questions in under 5 seconds.
- Added dedicated compact Machine Snapshot panel (Health, Heads, Cooling, Runtime, Remaining Service Life, SLA Progress).
- Reduced visual noise, softened borders, increased whitespace and mathematical typographic hierarchy.

## v0.2.2 — Mission Control Re-Architecture (ECO-20260729-004) (2026-07-29)

### Highlights
- Re-architected Mission Control from a generic dashboard into a true operational workspace (like opening today's work order).
- Starts immediately with today's operation: Customer, Machine, Purpose, Inspection Stage, and Next Action.
- Split Mission Control into modular components: ActiveWorkOrderHeader, InspectionStageStepper, WorkOrderChecklist, OperationalPrerequisites, TodayActivityLog.
- Removed quick-action buttons grid and statistics charts from Mission Control in favor of sequence-based action flow.
- Embedded contextual AI guidance directly inside active inspection stages.

## v0.2.1 — CTO Design Revision (2026-07-29)

### Highlights
- Shifted interface to calm, quiet, industrial operations workspace for field engineers.
- Implemented intentional Light & Dark theme transition between dark operational workspace and bright customer documents.
- Redesigned Executive Reports & Knowledge Base into crisp, document-oriented light theme.
- Removed artificial stats blocks and glowing visual noise in favor of mission-first hierarchy.
- Enforced strict version discipline across all footers, settings, and documentation.

## v0.2.0 — Core System Expansion (2026-07-15)

### Highlights
- Added 2-Year Execution Planner for long-term contract SLA maintenance scheduling.
- Integrated 8-Point Machine Health Check (MHC) automated score calculator.
- Added Laser Optics Beam Profiler & Galvo Scanner Calibration module.

## v0.1.0 — Initial Platform Release (2026-06-01)

### Highlights
- Initial release of Field Service Operations System with Machine Passport & Contract Tracking.
