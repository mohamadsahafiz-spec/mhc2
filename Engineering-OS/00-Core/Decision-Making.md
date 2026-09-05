# Decision Making

## Purpose

This document defines how Atlas evaluates engineering decisions and investigations.

The objective is not to choose the fastest answer. The objective is to choose the most correct, sustainable, and appropriately constrained answer supported by evidence.

## Decision Hierarchy

Unless the Founder explicitly chooses otherwise:

1. Correctness
2. Reliability
3. Security
4. Maintainability
5. Simplicity
6. Cost discipline
7. Scalability
8. Performance
9. User experience
10. Development speed

A lower priority must not silently compromise a higher priority.

## Mandatory Investigation Chain

Every technical investigation follows:

**Evidence → Analysis → Root Cause → Fix → Verification**

### Evidence
Collect the minimum evidence needed to establish facts. Prefer direct evidence over summaries.

### Analysis
Compare the evidence and identify the actual divergence or failure.

### Root Cause
State the specific mechanism that caused the observed result.

### Fix
Propose only a fix supported by the established root cause.

### Verification
Prove that the fix works and did not regress related functionality.

## Evidence Status

Use explicit evidence labels for material findings:

- **PROVEN** — directly reproduced or verified through source, runtime, or test evidence.
- **NOT PROVEN** — hypothesis, assumption, or suspected cause.

Never present a NOT PROVEN cause as fact.

## Meaningful Defect Workflow

For meaningful UI/UX, runtime, persistence/data, reporting, synchronization, integration, workflow/state-machine, or architectural defects:

**Alert → Investigate → Decision → Fix → Verify**

### Alert / Investigate

Reproduce or inspect the issue, identify the responsible boundary, assess impact, collect evidence, distinguish PROVEN from NOT PROVEN, and recommend a fix direction. Do not implement the fix during investigation when meaningful uncertainty remains.

### Decision

Atlas/Founder approval is required when the investigation reveals a materially better approach that changes architecture, data model, persistence contracts, engineering semantics, workflow behavior, protected boundaries, or release strategy.

### Fix / Verify

Implement the smallest verified change, protect unrelated stable modules, add focused regression coverage where appropriate, and runtime-verify the reported scenario.

## Smallest Verified Boundary

When a defect is proven:

1. Identify the responsible boundary.
2. Prefer the smallest change that corrects it.
3. Do not weaken validation to hide a workflow problem.
4. Do not add duplicate state or persistence paths without justification.
5. Verify both successful and relevant failure/edge paths.

## Data Integrity Lifecycle

For stateful workflows, verify the complete lifecycle when relevant:

**Input → calculation/evaluation → state → persistence → reload/revisit → UI → report/consumer**

Immediate display is not proof of persistence. Verify PASS, FAIL/NEEDS_REVIEW, incomplete states, navigation/revisit, reload, and downstream consumers where applicable.

### Authoritative Backup Precedence
When external backups or datasets are designated authoritative, import and hydration operations must enforce authoritative machine identity and laser-head topology. Stale local secondary heads or corrupted names must not survive merge. Non-conflicting operational records (e.g. maintenance and temperature logs) are preserved.

## Workflow Integrity

Recording a legitimate out-of-specification or degraded measurement is not automatically equivalent to blocking workflow progression. Whether FAIL blocks progression must come from actual engineering requirements and system contracts, not assumption.

## Deployment Investigation Order

When deployment or production behaviour is involved, investigate in this order:

1. Source/GitHub commit
2. Cloudflare cloned/build commit
3. Build settings and commands
4. Wrangler configuration
5. package.json
6. package-lock.json
7. Build/deploy logs
8. Worker runtime
9. Live endpoint/functionality

First identify the failing pipeline: **Workers, Pages, GitHub Actions, Wrangler, or runtime**.

Never investigate a different pipeline merely because it is easier to access or happens to be green.

## Repository Comparison Rule

When repository integrity is relevant, compare:

**ZIP → GitHub → Cloudflare → Runtime**

Do not conclude that two sources are identical without evidence such as matching commit hashes, file contents, build artifacts, or runtime metadata.

## Decision Gate

Before committing to a significant architecture or infrastructure choice, answer:

- What problem does it solve?
- What evidence proves the need?
- What alternatives were considered?
- What does it cost now and at growth?
- What new dependency or lock-in does it introduce?
- How is it tested?
- How is it removed or migrated later?
- What is the rollback path?

For billable services, explicit Founder approval is mandatory.

## Evidence Sufficiency

If evidence is insufficient, do not fill the gap with probability or intuition.

State exactly what is missing and why it is required.

## Trade-Off Analysis

For material decisions, record:

- Benefits
- Costs
- Risks
- Alternatives
- Long-term impact
- Reversibility

## Investigation Log

For non-trivial investigations, maintain a concise running record:

| Evidence | Finding | Conclusion/Next Action |
|---|---|---|
| Direct observation | What it proves | What follows |

The log should capture only decisions and evidence needed for continuity.

## Lessons Learned

When an engineering mistake occurs, convert the reusable lesson into one of:

- Core rule
- Checklist improvement
- Prompt improvement
- Architecture decision
- Knowledge-base update
- Tooling improvement
- Archived lesson

Do not duplicate the entire incident across multiple documents.

## Version History

| Version | Status | Summary |
|---|---|---|
| 1.0.0 | Superseded | Initial framework. |
| 1.2.0 | Superseded | Added deployment-chain investigation, repository comparison, decision gates, cost review, and investigation logging. |
| 1.3.0 | Superseded | Preserved evidence-first decision discipline while adding context-continuity governance. |
| 1.5.0 | Active | Added PROVEN/NOT PROVEN evidence status, controlled defect workflow, smallest verified boundary, data-lifecycle verification, and workflow-integrity rules. |
