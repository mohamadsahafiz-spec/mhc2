# Engineering OS v1.6.0
## FSOS Engineering & Agent Operating Rules — Update

Previous: v1.4.0  
New: v1.5.0

This is an amendment to Engineering OS v1.4.0. Existing architecture, protected areas, decisions, and operating principles remain in force unless current evidence proves them outdated.

## 1. Mikasa Token Economy

Token efficiency applies to both prompt input and completion output.

### Prompt rules
- Focus on the current task.
- Include only evidence and constraints materially required.
- Do not repeat established architecture/history unless directly relevant.
- Do not repeat decisions Mikasa already knows.
- Avoid unnecessary narrative.
- Prefer compact bullets and precise instructions.
- Multiple logically related tasks may be combined when efficient.
- Include enough precision to prevent ambiguity, but no more.

**Objective: maximum engineering effectiveness per token.**

### Completion rules
Mikasa's response must be the minimum necessary output:
- status;
- material changes/files;
- verification;
- version/changelog;
- material risks.

Do not repeat the prompt, dump code, or provide unnecessary narrative.

The existing 50-word completion rule is a **ceiling, not a target**. Prefer less when possible.

Exceed it only for a genuine blocker, architectural conflict, migration/data-integrity warning, unexpected regression, important uncertainty, or evidence requiring explanation.

## 2. Evidence Discipline

Always distinguish:

**PROVEN** — directly reproduced or verified through source, runtime, or test evidence.

**NOT PROVEN** — hypothesis, assumption, or suspected cause.

Never present an assumed root cause as fact.

## 3. UI/UX Defect Two-Stage Rule

For a meaningful new UI/UX defect:

### Stage 1 — ALERT / INVESTIGATE
Mikasa must reproduce/inspect the issue, identify the responsible boundary, assess impact, report evidence, distinguish PROVEN from NOT PROVEN, and recommend a fix direction.

**No implementation during investigation.**

### Stage 2 — FIX
After Atlas/Founder approval, implement the smallest verified fix, preserve architecture, avoid unrelated changes, add focused regression coverage where appropriate, and runtime-verify the reported scenario.

Preferred flow:

**Alert → Investigate → Decision → Fix → Verify**

Trivial cosmetic defects may be fixed directly when there is no meaningful behavioral or architectural uncertainty.

## 4. General Defect Workflow

Use the same Alert → Investigate → Decision → Fix workflow for meaningful:
- runtime defects;
- persistence/data issues;
- integration failures;
- reporting discrepancies;
- synchronization failures;
- workflow/state-machine failures.

## 5. Smallest Verified Boundary

When a defect is proven:
1. Identify the responsible boundary.
2. Prefer the smallest change that corrects it.
3. Do not weaken engineering validation to hide workflow problems.
4. Do not add duplicate state/persistence paths without justification.
5. Protect unrelated stable modules.
6. Verify successful and relevant failure/edge paths.

## 6. Engineering Workflow Integrity

Recording a bad measurement is not automatically the same as blocking the workflow.

A legitimate out-of-spec result may need to be:
- recorded;
- marked FAIL;
- preserved as evidence;
- routed to NEEDS_REVIEW;
- followed by the next engineering activity.

Whether FAIL blocks progression must come from actual engineering requirements and existing system contracts, not assumption.

## 7. Data Integrity

When relevant, verify the complete lifecycle:

**Input → calculation/evaluation → state → persistence → reload/revisit → UI → report/consumer**

Immediate display is not proof of persistence.

For stateful workflows, verify navigation/revisit, reload when applicable, PASS, FAIL/NEEDS_REVIEW, incomplete states, and downstream consumers where relevant.

## 8. Version Discipline

FSOS application versioning remains centralized through the established authoritative version source.

Do not create redundant visible version displays.

For releases:
- update the authoritative version;
- synchronize required application references;
- update the changelog;
- preserve genuinely independent subsystem/engine versions.

Do not invent a versioning decision.

## 9. Atlas Decision Gate

Atlas must obtain Founder approval when an investigation reveals a materially better approach that changes architecture, data model, persistence contracts, engineering semantics, workflow behavior, protected boundaries, or release strategy.

Atlas should not silently replace an established decision with a new architectural direction.

---

# v1.5.0 Changelog

### Added
- Mikasa Token Economy for both prompt input and completion output.
- 50-word completion rule clarified as a ceiling, not a target.
- UI/UX Alert → Investigate → Fix workflow.
- General Defect Alert → Investigate → Decision → Fix workflow.
- PROVEN vs NOT PROVEN evidence discipline.
- Stronger smallest-verified-boundary rule.
- Engineering distinction between recording FAIL and blocking progression.
- Full engineering data lifecycle verification guidance.

### Preserved
- Engineering OS v1.4.0 architecture and operating principles.
- Existing protected-area rules.
- Existing version discipline.
- Founder approval gate for material architectural changes.

**Engineering OS version: v1.5.0**
