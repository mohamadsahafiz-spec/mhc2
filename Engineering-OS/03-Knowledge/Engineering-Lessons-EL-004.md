# EL-004 — Active State Must Override Archive During Migration

## Status

Approved

## Summary

Historical Engineering-OS archive records must never be interpreted as the current Engineering-OS or project baseline during chat migration.

## Problem

During an FSOS migration, Atlas incorrectly treated historical v1.6.0/v1.0.37 archive material as evidence of the current active state, even though the active Engineering-OS was v1.7.0 and current FSOS work had advanced into the v1.1.x line.

This created unnecessary reconstruction and forced the Founder to correct the state repeatedly.

## Rule

Source-of-truth precedence is:

1. Active Engineering-OS root / active governance for current Engineering-OS version and governance.
2. `02-Projects/<project>/` for current project state.
3. `03-Knowledge/` for current technology knowledge.
4. `04-Archive/` for historical evidence only.

Archived version numbers, project states, and old roadmaps must never override active state.

## Migration Rule

Before continuing a migrated project:

- identify the active Engineering-OS version from the active root;
- identify the current project baseline from `02-Projects/<project>/`;
- treat archive material as historical context unless the user explicitly asks for historical reconstruction;
- do not infer current state from filenames or version numbers in Archive.

## Engineering Principle

Historical preservation and current-state continuity are separate responsibilities. Preserve history without allowing history to become a competing source of truth.

## Origin

FSOS Engineering-OS migration, August 2026.
