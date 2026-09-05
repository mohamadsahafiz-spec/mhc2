# FSOS Project

## Identity

**Project:** Field Service Operations System (FSOS)  
**Current verified version:** v1.1.16 candidate status  
**Engineering governance:** Engineering-OS v1.8.0

FSOS is a real field-service engineering operating system, not a demo application.

## Purpose

FSOS supports:
- Machine Health Check;
- laser calibration;
- Machine Passport;
- engineering measurements;
- evidence capture;
- customer reporting;
- contracts and planning;
- Recommended Parts Master;
- future operational intelligence.

## Current verified foundation

### Data integrity

The authoritative persistence model is established and protected.

Customer identity is relationship-based through `customerId`. Display names do not create customer identity.

Zero-state/ghost-data cleanup has been completed and verified.

### Machine Passport

Machine Passport is a protected engineering module covering machine identity, customer relationship, laser lifecycle/runtime, laser power, temperature, beam profile, product/process information, and MHC history.

### Smart MHC

Smart MHC is the primary MHC workspace and the intended authoritative engineering record.

Relevant engineering data includes:
- Laser Power;
- Beam Profile;
- Temperature;
- Laser Hours;
- Product / Process;
- Focus Optimization;
- Power Offset;
- Stage / Scanner Calibration / AGC;
- Product / Via Quality;
- Findings;
- Actions;
- Evidence.

### Recommended Parts Master

Recommended Parts Master is implemented and verified. It is authoritative for future Autopilot recommendations.

Autopilot must never invent a part.

## Historical v1.0.37 foundation work

Temperature Inspection Delete was fixed.

Root cause:
`handleDeleteSavedRecord` did not directly dispatch authoritative `StorageService.saveMachines`.

Verification:
- deletion purges TempRawStore telemetry and storage;
- record remains deleted after reload;
- graphs and downsampling remain intact;
- unselected records remain intact;
- all 8 tests passed.

## Current engineering state

The active FSOS state is maintained in `FSOS-Current-State.md`. This document preserves the project identity and architectural foundation; it must not be treated as a competing current-state ledger.

Current verified direction:
- MHC Autopilot and Machine Passport remain protected core workflows.
- Full MHC PDF pipeline is substantially restored and verified.
- Legacy UI cleanup Phase 1 is complete; Operations remains intentionally preserved.
- Current immediate task: remove Mission Control while leaving Daily Work as the only DAILY WORK entry.

## Out of scope

Unless separately approved:
- Temperature Engine rewrite;
- Customer identity redesign;
- Machine Passport refactor;
- predictive-maintenance implementation;
- unrelated persistence changes;
- speculative part creation;
- broad UI refactoring.

## Source-of-truth rule

Customer/engineering PDFs and actual MHC evidence take precedence over assumptions.

The actual full customer MHC PDF, BMD302W parts PDF, and BMD250WM parts PDF are required source material for report/catalog decisions.
