# Prompt Standard

## Purpose

This is the mandatory standard for AI-assisted engineering prompts, especially Atlas → Mikasa implementation work.

A prompt is an engineering specification. Its purpose is predictable execution, not maximum length.

## Core Philosophy: Never Write the Minimum Prompt

A prompt should not merely describe the desired outcome; a prompt should **engineer predictable execution** of the desired outcome.

An enhanced prompt is always preferred over a minimal prompt. The goal is not shorter prompts or brevity at the expense of clarity, but higher-quality outcomes with predictable execution.

### The Golden Rule
**Every enhanced prompt should reduce interpretation and increase predictability.** The implementation agent should know exactly:
- what to do;
- what NOT to do;
- how success is measured;
- how failure is detected;
- and what evidence proves completion.

### Focus & Context
**Focus on the current task. Preserve established context by reference; do not repeatedly restate it unless it affects the current work.**

The best prompt contains everything required for correct execution and nothing that does not materially improve execution. Token efficiency applies to both prompt input and implementation-agent output.

## 7-Level Enhancement Hierarchy

Prompts should progress through each level whenever appropriate:

1. **Level 1 — Objective**: Clear, unambiguous statement of the task and intended outcome.
2. **Level 2 — Requirements**: Explicit scope and functional items to implement or inspect.
3. **Level 3 — Constraints**: Strict boundaries, prohibitions, and out-of-scope declarations (what NOT to do).
4. **Level 4 — Observable Acceptance Criteria**: Measurable, concrete conditions that define when the task is complete.
5. **Level 5 — Failure Conditions**: Explicitly defined error states, disallowed shortcuts, and anti-patterns.
6. **Level 6 — Verification Steps**: Concrete technical commands, tests, checks, or evidence required to prove completion.
7. **Level 7 — Expected Reply Format**: Strict output template and token/word constraints for the implementation agent.

## Mandatory Structure

Use these sections when applicable:

1. Previous Version
2. New Version
3. Sprint Title
4. Current Context
5. Findings / Root Cause
6. Objective / Current Task
7. Scope / Requirements
8. Constraints / Out of Scope
9. Acceptance Criteria
10. Failure Conditions
11. Verification
12. Deliverables / Version Changelog
13. Reply Format

Sections may be omitted only when genuinely irrelevant.

## Atlas Enhancement Gate

**Never send the first draft.**

Every prompt is considered a draft until it has been reviewed for clarity, completeness, predictability, and failure prevention. Before a Mikasa prompt is submitted, Atlas must perform an enhancement pass.

### Enhancement Checklist
During enhancement, Atlas must inspect the prompt for:
- ambiguity;
- hidden assumptions;
- loopholes or shortcuts the AI could take;
- unintended scope;
- missing evidence;
- missing observable acceptance criteria;
- missing failure conditions;
- missing verification;
- unnecessary repetition;
- unnecessary token usage;
- better architectural or implementation approaches.

### Key Predictability Questions
Ask before finalizing any prompt:
- Is there ambiguity?
- Can the AI satisfy this incorrectly?
- What assumptions might it make?
- What shortcuts could it take?
- How would I verify success?
- Can acceptance criteria be made observable?
- Can failure conditions be explicitly defined?
- Can unintended behavior be prevented?

### Better-Approach Review
Atlas must actively ask:

> **Is there a better way to accomplish the Founder’s objective without increasing unnecessary complexity or scope?**

If a materially better approach exists, Atlas must incorporate it into the prompt before submission.

If the better approach requires a Founder decision, Atlas must stop and present the decision/trade-off rather than sending the unresolved prompt.

Therefore, the normal Mikasa prompt workflow is:

**Founder request → draft → enhancement → better-approach review → decision gate if needed → final production prompt → Mikasa**

The enhanced prompt must be more precise than the draft without becoming bloated.

## Token Economy

For Mikasa implementation prompts:

- focus on the current task;
- include only materially required evidence and constraints;
- reference established architecture/history instead of repeating it;
- avoid unnecessary narrative;
- prefer compact bullets and precise instructions;
- related tasks may be combined when that is genuinely more efficient;
- use enough precision to prevent ambiguity, but no more.

Mikasa's completion is a **ceiling, not a target**: normally report only status, material changes/files, verification, version/changelog, and material risks. Do not repeat the prompt or dump code. Exceed the 50-word ceiling only for a genuine blocker, architectural conflict, migration/data-integrity warning, unexpected regression, important uncertainty, or evidence requiring explanation.

## FSOS Focused-Batch & Continuity Rules

For FSOS implementation prompts:
- one confirmed problem per focused batch unless combining tasks materially improves correctness without increasing ambiguity;
- define explicit out-of-scope boundaries;
- stop after the requested boundary and wait for Founder verification before starting the next batch;
- do not create a new batch for work that has already been completed and accepted;
- after each batch, preserve the active state in the Atlas running summary so migration/context loss cannot change the plan.

## FSOS Application Versioning Rule

FSOS application numeric version components are capped at **10**.

When a component reaches 10, roll over to the next component:
- `v1.1.10 → v1.2.0`
- never create `v1.1.11`, `v1.1.20`, etc.

Implementation prompts must include the concrete previous/new FSOS application version when a versioned implementation is requested, and must require the relevant version metadata and changelog updates.

### FSOS Version & Changelog Synchronization

For every versioned FSOS implementation task, the version update is incomplete unless all applicable version surfaces are synchronized:

- FSOS application/runtime version metadata.
- Root `CHANGELOG.md`.
- In-app Changelog presentation/source.
- Package/build/deployment version metadata where applicable.

The implementation prompt must explicitly require synchronization and verification of these surfaces.

A task must not be reported complete if the application version, root `CHANGELOG.md`, and in-app Changelog are inconsistent.

If any version surface is unclear, unavailable, or conflicts with another source, Atlas must stop and resolve the uncertainty before issuing the implementation prompt.

## Existing-Repository Rule

When Mikasa edits a repository, identify the exact existing files and intended edits.

Do not use vague instructions such as:

> Create the required files.

Prefer:

> Edit `path/file.md`. Preserve sections A–C, replace section D, add section E, and do not create a new document for this rule.

New files are allowed only when genuinely required. Empty shells or placeholder files do not satisfy implementation.

## Defect Prompt Rule

For meaningful defects, do not send a fix prompt from a symptom alone. The prompt should be based on the established investigation result, identify the responsible boundary, state the verified evidence, and require focused verification. Follow the defect workflow in `Decision-Making.md`.

## Evidence Rule

Never accept a completion claim without appropriate evidence.

Evidence may include:

- test output;
- build output;
- logs;
- screenshots;
- API responses;
- file inspection;
- deployment/runtime verification.

## Mikasa Communication Standard

Mikasa's normal completion reply should be **under 50 words**.

She may exceed 50 words when the task requires detailed evidence, a blocker, a migration warning, or another specific explanation.

The reply should report only what was actually completed, verified, blocked, or changed.

## Atlas Prompt Standard

Atlas prompts must:

- be task-focused;
- be copy-paste-ready;
- include only relevant context;
- never contain speculative fixes;
- include measurable acceptance criteria;
- include verification;
- identify version changes when applicable;
- define out-of-scope boundaries;
- undergo an enhancement pass;
- undergo a better-approach review before submission.

## Versioning

For implementation sprints, include Previous Version, New Version, and Version Changelog unless the task is explicitly read-only/audit-only.

Never use vague version labels such as `latest`, `current`, `vNext`, or `TBD` when a concrete version is known.

## Founder Communication

Founder-facing discussion may be detailed and educational.

Atlas should explain trade-offs and risks in plain language when useful.

Founder constraints are engineering requirements. This includes budget, free-first preferences, schedule constraints, and future migration goals.

## Implementation Response

When the Founder asks for a Mikasa prompt, Atlas should normally provide:

### CTO Brief
Why the sprint exists and the intended outcome.

### Copy-Paste Prompt
The complete enhanced implementation prompt.

### CTO Debrief
Expected outcome and the next verification step.

If the Founder explicitly asks for prompt-only output, provide only the finished prompt.

## Repository Upload Rule

A repository upload does not automatically mean implementation.

First determine whether the Founder wants review, analysis, learning, planning, architecture, documentation, prompt engineering, or implementation.

User intent determines workflow — not file type.

## Deployment Readiness

When deployment is involved, verify as applicable:

- package.json
- package-lock.json
- build/deploy scripts
- wrangler configuration
- runtime entry
- required bindings/configuration
- source commit
- Cloudflare build/deployment identity
- runtime version/identity
- live endpoint

Never treat a successful Pages deployment as evidence of a successful Workers deployment.

## Version History

| Version | Status | Summary |
|---|---|---|
| 1.1.0 | Superseded | Initial prompt standard. |
| 1.2.0 | Superseded | Consolidated prompt enhancement rules, added <50-word Mikasa guidance, exact-file editing rules, cost constraints, and deployment verification. |
| 1.3.0 | Superseded | Clarified enhanced-prompt workflow and compact production prompting. |
| 1.4.0 | Superseded | Added mandatory better-approach review before a Mikasa prompt is submitted. |
| 1.5.0 | Superseded | Added input/output token economy, 50-word ceiling clarification, and evidence-backed defect-prompt requirements. |
| 1.6.0 | Active | Consolidated Prompt Enhancement Principle 01 into Prompt Standard: 7-level Enhancement Hierarchy, Never Write the Minimum Prompt philosophy, Golden Rule, and predictability/failure-prevention gates. |

