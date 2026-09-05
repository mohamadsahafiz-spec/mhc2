# Engineering-OS v1.6.0 Consolidation Record

## Purpose
This record documents the controlled consolidation from the v1.4 active structure into the v1.5.0 active Engineering-OS.

## Active structure
- `00-Core/` — authoritative governance and operating rules.
- `01-Templates/` — repeatable engineering workflows.
- `02-Projects/` — project-specific source of truth.
- `03-Knowledge/` — technology knowledge.
- `04-Archive/` — historical evidence and reusable lessons.

## Decisions
- KEEP: existing active Core, Templates, Project, Knowledge, and Archive documents where they remain authoritative.
- MERGE: v1.5 amendment rules into the appropriate existing Core documents.
- ARCHIVE: standalone `Prompt Enhancement Principle 01.md` because its reusable rules are already represented by Prompt-Standard.
- ARCHIVE: standalone `Engineering-OS-v1.5.0.md` because v1.5 is now incorporated into the active OS.
- REMOVE FROM ACTIVE ROOT: stale live FSOS version information from Engineering-OS README; FSOS version remains project-owned.
- PRESERVE: FSOS v1.0.37 update evidence as project/archive material.

## Content-loss rule
No historical source document is treated as disposable merely because it is superseded. Superseded governance remains recoverable in `04-Archive/Engineering-OS-History/`.
