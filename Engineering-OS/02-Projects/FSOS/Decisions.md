# FSOS Engineering Decisions

## Document Status

- **Status:** Living Document
- **Verified Version:** v1.1.16 candidate status
- **Owner:** Atlas

## Decision Record Format

Every major decision should include:

- Decision
- Reason/evidence
- Alternatives considered
- Cost/operational impact
- Reversibility
- Date/version
- Status

## Decision 001 — Cloudflare Platform

**Decision:** Cloudflare is the primary FSOS deployment ecosystem.

**Status:** Approved

## Decision 002 — React Frontend

React is the standard FSOS frontend framework.

**Status:** Approved

## Decision 003 — D1 Authoritative Record Storage

D1 is the authoritative server-side source of truth for structured FSOS records.

**Status:** Approved

## Decision 004 — Workers Production Runtime

FSOS production uses Cloudflare Workers. Pages is not the production backend/deployment target.

**Status:** Approved

## Decision 005 — Smart MHC as Primary MHC Workspace

Smart MHC is the primary MHC workspace and the foundation for future automated customer reporting.

**Status:** Approved

## Decision 006 — Structured MHC Data Is the Report Source of Truth

Authoritative structured MHC data must feed Smart MHC presentation, MHC History, and the future Report Engine.

**Status:** Approved

## Decision 007 — Customer Report Evolves the Excel Standard

The legacy customer Excel report is the engineering baseline for coverage and traceability, not the visual destination.

**Status:** Approved

## Decision 008 — Previous vs Current Is First-Class

Customer reporting must support explicit Previous vs Current comparison, especially for Laser Power and Beam Profile.

**Status:** Approved

## Decision 009 — Proven External Engines Are Protected

The proven Temperature and Laser Hour Monitor engines are integrated/migrated before any future enhancement.

**Status:** Approved

## Decision 010 — Temperature Engine Frozen for Current Phase

Do not redesign the Temperature Engine during current Smart MHC report work. A verified saved-record chart defect may be fixed at the affected data/presentation boundary after evidence-based diagnosis.

**Status:** Approved

## Decision 011 — Laser Hours Is Customer-Facing Report Data

Laser Hour Monitoring is a high-value customer report section.

**Status:** Approved

## Decision 012 — Report Visuals Follow Data Meaning

Each engineering parameter should use a visual representation appropriate to its data semantics.

**Status:** Approved design direction

## Decision 013 — Laser Profile and Product Via Quality

Laser Profile primarily communicates inspected customer product/process parameters. Product Via Quality communicates diameter, roundness, taper, and relevant evidence images.

**Status:** Approved

## Decision 014 — Stage & Scanner Calibration / AGC

Customer reporting should communicate Stage & Scanner Calibration / AGC results primarily as within-specification/out-of-specification outcomes with supporting images where useful.

**Status:** Approved

## Decision 015 — Requirement Verification Before Schema Expansion

Do not add engineering fields merely because an audit interprets them as customer requirements.

**Status:** Permanent rule

## Decision 016 — Free-First Infrastructure

FSOS will prefer existing/free/open-source infrastructure before paid services.

**Status:** Approved

## Decision 017 — Image Persistence Deferred

R2 was identified as a technically suitable candidate for durable image storage, but it was not activated because it introduces a usage-based storage dependency.

**Status:** Deferred

## Decision 018 — Future Standalone Client

FSOS may evolve from browser-first to standalone desktop software using a local database and the existing sync architecture.

**Status:** Future

## Decision 019 — Recommended Parts Master Is Authoritative

**Decision:** Recommended Parts Master is the authoritative catalog for selectable service parts and consumables.

**Reason:** Manual recommendations and future MHC Autopilot recommendations must resolve to known part identities rather than inventing catalog entries.

**Status:** Approved — v1.0.34

## Decision 020 — Customer Identity Uses Stable customerId

**Decision:** Customer identity is represented by an authoritative persistent Customer record and stable `customerId`; `customerName` is display data.

**Reason:** Imported-machine customer reconciliation previously exposed a synthetic-customer resurrection path. Stable identity plus cascading name updates prevents duplicates and stale-name regeneration.

**Status:** Approved — v1.0.34

## Decision 021 — MHC Recommendations Remain Engineer-Controlled

**Decision:** MHC Autopilot may suggest existing Recommended Parts based on current findings, but the engineer retains final selection control.

**Reason:** The system should assist engineering judgment without inventing parts or silently creating procurement decisions.

**Status:** Planned — design direction

## Decision 022 — Predictive Maintenance Is Separate Future Scope

**Decision:** Predictive-maintenance part recommendations are a later capability and must not be conflated with current-condition MHC recommendations.

**Reason:** Predictive logic requires accumulated historical evidence and must be conservative.

**Status:** Future

## Decision 023 — Engineering-OS Active-State Precedence

**Decision:** Active Engineering-OS root/governance and `02-Projects/<project>/` current-state documents take precedence over `04-Archive/` historical records.

**Reason:** Prevent historical version/state records from being mistaken for the current baseline during chat migration.

**Status:** Approved — Engineering-OS v1.8.0

## Decision 024 — Atlas Owns Engineering-OS Continuity

**Decision:** Atlas is responsible for maintaining and synchronizing active Engineering-OS documentation across FSOS evolution and chat migrations.

**Reason:** Engineering-OS continuity is a governance responsibility and must not become a Founder maintenance task or be delegated to implementation agents.

**Status:** Approved — Engineering-OS v1.8.0

## Pending Decisions

- Image persistence architecture
- Authentication strategy
- User roles/permissions
- Multi-customer architecture
- Backup/disaster recovery
- Notification system
- Audit logging
- API versioning
- Final unified Report Engine data contract and renderer architecture
- MHC Autopilot recommendation mapping/rules
- Predictive-maintenance evidence model

## Current Runtime Investigation

A saved Temperature Inspection record can currently render a malformed chart with `NaN` time values. The root cause is not yet established.

Required evidence chain:

**persisted record → reload → aggregation/bucketing → chart data → renderer**

Do not redesign the proven temperature engine before this boundary is understood.

## Superseded Decisions

When an approved decision is replaced, retain the original decision, replacement, reason, effective version, and migration impact.
