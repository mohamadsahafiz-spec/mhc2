## v1.9.0 — Canonical Repository & Continuity Cleanup

### Changed
- Cleaned the Engineering-OS root to keep only the active operating surface and required repository files.
- Removed redundant root-level migration/update artifacts from the active repository surface; historical material remains preserved through the Archive where appropriate.
- Clarified the canonical active source: `README.md`, `CHANGELOG.md`, `metadata.json`, `00-Core/`, `01-Templates/`, `02-Projects/`, and `03-Knowledge/`.
- Clarified that historical/archive material must not override verified current active state.
- Strengthened Atlas continuity guidance so Engineering-OS changes begin by inspecting the canonical active files rather than assuming historical migration documents are authoritative.

### Version
- Engineering-OS active version is now **v1.9.0**.


# Engineering-OS Changelog

## v1.8.0 — FSOS Continuity & Focused Execution Update

### Added
- Focused-batch execution rule for FSOS repair work: known issue → focused batch → implementation → evidence → Founder verification → lock → next batch.
- Active continuity requirement for a compact running state summary covering completed/locked work, current task, pending verification, current FSOS version, and next priority.
- Full-PDF QA gate after the confirmed Sprint 01 repair batches, before speculative new feature work.

### Clarified
- FSOS application versions are project-owned and independent from Engineering-OS versions.
- FSOS numeric version components must not exceed 10; roll over at the boundary (for example `v1.1.10 → v1.2.0`).
- Implementation completion claims remain evidence until Founder verification/acceptance where required.
- Material implementation work must update the relevant project changelog and in-app changelog where applicable.

### Current FSOS checkpoint
- FSOS application version: **v1.2.1**.
- Sprint 01 repair batches A–F: **PASS / locked**.
- Autopilot Item #1: `EXIT AUTOPILOT` label implemented; final Canvas / Workspace destination verification pending.
- Next priority: **Full MHC PDF QA**.


## v1.7.0 — Role Authority & Stewardship

### Added
- Explicit Founder / Atlas / Mikasa responsibility boundaries.
- Atlas designated as the exclusive steward and updater of active Engineering-OS governance.
- Clear rule that implementation-agent completion/verification reports are evidence for review, not automatic Founder acceptance.
- Active-surface guidance: future Atlas sessions start from active Core/project state; Archive is consulted only when historical context is required.

### Changed
- Root README and metadata now identify Engineering-OS v1.8.0.
- Engineering-OS remains separate from project/application versioning.

### Migration continuity clarification
- Active Engineering-OS/project state takes precedence over historical Archive records.
- Atlas owns active Engineering-OS maintenance and continuity across chat migrations.
- A repository/documentation update must not be claimed complete without verified artifact changes.

## v1.6.0 — Consolidated Engineering OS

### Changed
- Consolidated the active Engineering-OS structure into one authoritative operating system.
- Integrated approved v1.5 governance improvements into the active Core.
- Preserved historical versions and amendments in `04-Archive`.
- Confirmed `00-Core/Atlas-Constitution.md` as the highest-level governance document.
- Kept Engineering-OS, FSOS/project, and independent subsystem versioning separate.


## v1.6.0 — Consolidated Engineering Governance

### Added
- Consolidated v1.5 governance into the active Core documents instead of maintaining a separate active amendment.
- Input/output token economy with the 50-word Mikasa completion rule treated as a ceiling, not a target.
- PROVEN vs NOT PROVEN evidence status.
- Alert → Investigate → Decision → Fix → Verify workflow for meaningful defects.
- Smallest verified boundary and full state/persistence/revisit/report lifecycle verification.
- Workflow-integrity rule distinguishing recording FAIL from automatically blocking progression.
- Founder state protection/de-escalation rule for moments of visible frustration or escalation.

### Changed
- Root README and metadata now use one authoritative Engineering-OS version: v1.6.0.
- Removed the stale live FSOS version from the Engineering-OS root README; FSOS keeps its own project/application version source.
- Active Prompt Enhancement Principle content is consolidated into `00-Core/Prompt-Standard.md`.
- Historical v1.5 amendment and superseded Prompt Enhancement document are preserved under `04-Archive/Engineering-OS-History/`.

### Preserved
- Existing Core, Templates, FSOS project, Knowledge, and Archive material.
- Historical v1.2–v1.4 governance and project records.

## v1.4.0

Previous v1.4.0 governance and FSOS project update material preserved as historical source.

## v1.2.0 — Governance & Engineering Discipline Upgrade

### Added
- Evidence → Analysis → Root Cause → Fix → Verification as the standard investigation chain.
- Explicit Workers vs Pages pipeline identification.
- ZIP → GitHub → Cloudflare → Runtime repository/deployment comparison rule.
- Free-first infrastructure and explicit Founder approval for billable services.
- Runtime deployment identity verification guidance.
- Decision gates covering cost, lock-in, reversibility, and migration.
- Concise investigation log format.
- Mikasa normal reply target of under 50 words, with evidence-based exceptions.
- Exact-file editing guidance to prevent empty-shell implementations.
- Cloudflare Docs/MCP as an optional future engineering capability.

### Changed
- Consolidated the previous prompt-enhancement document into `00-Core/Prompt-Standard.md`.
- Strengthened CTO checklist evidence, cost, prompt enhancement, and deployment gates.
- Corrected stale Cloudflare technology status information.
- Corrected FSOS architecture documentation to reflect Workers as the production runtime and R2 as not yet activated.
- Updated FSOS project documentation to the verified v1.0.14 foundation state.
- Clarified that web → standalone desktop is a future architecture path, not current scope.
- Corrected README structure and repository links to match the actual repository.

### Removed
- Redundant `00-Core/Prompt Enhancement Principle 01.md`; its reusable rules are now consolidated into the Prompt Standard.

## v1.1.0

Initial Engineering-OS foundation.
