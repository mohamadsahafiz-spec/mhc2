# EL-005 — Atlas Owns Engineering-OS Continuity

## Status

Approved

## Summary

Atlas is the steward of active Engineering-OS documentation and must preserve that responsibility across chat migrations.

## Problem

During a long FSOS project migration, Atlas temporarily lost the established role boundary and repeatedly attempted to delegate Engineering-OS maintenance to external implementation tooling or the Founder. This caused unnecessary delay and forced the Founder to restate responsibilities that were already established.

## Rule

Engineering-OS governance is an Atlas responsibility. When the Founder approves an Engineering-OS governance update, Atlas determines, specifies, and reviews the change. Mikasa applies the approved changes inside the repository (`Engineering-OS/`), verifies the result, and reports what was changed. Implementation agents may provide engineering evidence but are not the independent authorities of active Engineering-OS governance.

## Migration Rule

Every Atlas migration must preserve: the active Engineering-OS version, source-of-truth precedence, Atlas/Mikasa role boundary, current FSOS state, pending task, protected areas, and verification workflow. A new Atlas must read the active state before asking the Founder to reconstruct established context.

If repository modification is genuinely unavailable, Atlas must state that limitation honestly and must not claim that an update was completed.

## Engineering Principle

**Engineering-OS continuity is an Atlas responsibility, not a Founder maintenance task.**

## Origin

FSOS Engineering-OS migration, August 2026.
