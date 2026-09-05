# FSOS Architecture

## System Status

- **Status:** Active Development
- **Verified Version:** v1.1.16 candidate status
- **Architecture Owner:** Atlas

## Purpose

This document is the architectural source of truth for FSOS structure and responsibility boundaries.

## Design Principles

- Durable server-side source of truth for structured operational records
- Reliable multi-device synchronization
- Offline capability where practical
- Modular workspaces
- Predictable workflows
- Minimal coupling
- Future desktop portability
- Structured engineering data separated from presentation
- Proven engineering engines preserved before future enhancement
- Customer-facing reporting optimized for understanding, not spreadsheet reproduction
- No invented engineering/catalog identities

## High-Level Architecture

```text
                          User
                           │
                    React + Vite UI
                           │
              Cloudflare Worker Runtime
                           │
                  API / Sync / Logic
                           │
                      Cloudflare D1
                           │
               Authoritative structured data
              ┌────────────┼─────────────┐
              ↓            ↓             ↓
          Smart MHC     MHC History   Report Engine
         presentation   & records       future
                                        │
                           ┌────────────┼────────────┐
                           ↓            ↓            ↓
                        Full PDF   Compact PDF     PPTX
```

## Core Modules

### Daily Work
Primary daily-entry surface for active work and MHC navigation.

### Mission Control
Legacy UI surface currently pending removal; its removal must not affect shared core infrastructure or MHC workflows.

### Machine Passport
Machine information, specifications, service history, components, and laser information.

### Smart MHC
Primary MHC workspace for structured inspection data, engineering evidence, calculations, historical comparison, and customer-report preparation.

### MHC History
Historical MHC sessions and access to prior Smart MHC workspaces.

### Recommended Parts Master
Authoritative catalog for service parts and consumables.

Responsibilities:
- CRUD;
- CSV/JSON import;
- validation and duplicate detection;
- machine-family segregation;
- search/filter/sort;
- persistent part identity.

Part identity uses the composite key:

`machineFamily + partNumber`

### Customer Identity

Customer records are authoritative entities.

Machines reference customers through stable `customerId`. `customerName` is display data and must not be treated as the identity key.

Imported machine/customer identities must be reconciled into persistent Customer entities before rename/edit operations can be considered authoritative.

### Sync Engine
Device synchronization, queued changes, conflict handling, offline recovery, and reconciliation.

## Smart MHC Data Authority

The intended direction is:

```text
MHCSession / authoritative structured record
                    │
                    ├── Smart MHC UI
                    ├── MHC History
                    └── Report Engine
```

Canvas widgets are presentation/projection state. They must not become an independent source of engineering truth.

## MHC Recommendation Architecture

Future current-condition recommendation flow:

```text
Current MHC findings
        ↓
MHC Autopilot analysis
        ↓
Existing Recommended Parts Master
        ↓
Engineer accepts/rejects/manual-selects
        ↓
Report recommendation
```

Autopilot must never create an invented part identity.

Future predictive-maintenance flow is separate and should use historical evidence rather than pretending to know exact failure dates.

## Report Architecture Principles

The legacy Excel report remains the engineering coverage baseline, not the final visual design.

Report generation should be deterministic and structured:

**Engineering data → calculations → comparison → interpretation → evidence → visual renderer → output**

Visuals should be selected according to data meaning.

## Proven External Engines

### Temperature

The temperature engine is a proven external engine and must be treated as stable during the current Smart MHC report phase. Integrate/migrate it; do not redesign it unless a verified defect requires intervention.

Historical Temperature chart issues and their v1.0.37 persistence fix remain documented in the archive. Current work should follow the active FSOS current-state document and not treat the archived chart-control roadmap as the active project priority unless explicitly re-approved.

### Laser Hours

The Laser Hour Monitor is a proven external engine and should be integrated into FSOS and the customer report. Do not redesign it during the current Smart MHC report phase.

## Data Ownership

| Data | Authoritative Location |
|---|---|
| Structured operational records | D1 / authoritative FSOS persistence |
| Smart MHC structured records | MHC session / D1-backed FSOS persistence |
| Historical MHC sessions | MHC History / authoritative MHC records |
| Customer identity | Customer record + stable `customerId` relationships |
| Recommended Parts catalog | Recommended Parts Master / authoritative persistence |
| Sync state/queue | Client + Worker/D1 synchronization flow |
| Current image payloads | Browser IndexedDB (temporary limitation) |
| Future image payloads | To be selected after free-first evaluation |
| Desktop local data | Future SQLite |

## Architectural Rules

- Do not use Worker memory as durable state.
- Do not store binary image payloads in D1 unless explicitly justified.
- Do not introduce R2 or another paid-capable storage service without Founder approval.
- Keep UI, API, persistence, and sync responsibilities separated.
- Do not let Canvas presentation state become a competing engineering data store.
- Do not redesign proven external engines during unrelated report work.
- Customer identity is keyed by stable `customerId`, not display name.
- Recommended Parts must resolve to authoritative catalog records.
- Major architectural changes require an explicit decision record.

## Future Desktop Architecture

```text
Standalone Desktop Client
        ↓
Local SQLite
        ↓
Sync Engine
        ↓
Cloudflare Worker
        ↓
D1
```

The desktop migration is a future evolution and must not destabilize the current web deployment.
