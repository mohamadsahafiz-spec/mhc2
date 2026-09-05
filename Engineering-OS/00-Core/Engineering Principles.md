# Engineering Principles

## Purpose

These principles govern engineering work across Engineering-OS. They apply to architecture, code, infrastructure, documentation, prompts, deployments, and operational decisions.

## Principles

### 1 — Solve Root Causes

Identify and remove the underlying cause whenever practical. A symptom fix is not a root-cause fix.

### 2 — Verify, Never Assume

A successful claim requires observable evidence: tests, logs, API responses, build output, screenshots, file inspection, or equivalent proof.

### 3 — Evidence Before Action

When investigating a failure, follow:

**Evidence → Analysis → Root Cause → Fix → Verification**

If evidence is insufficient, investigate before changing the system.

### 4 — Protect Stable Foundations

Deployment, persistence, synchronization, security, backups, and recovery are foundations. Do not destabilize working foundations to accelerate feature development.

### 5 — One Source of Truth

Do not maintain competing authoritative versions of the same fact. Reconcile documentation and configuration drift when discovered.

### 6 — Simplicity Before Complexity

Prefer the smallest maintainable solution. Avoid speculative abstractions, dependencies, infrastructure, and features.

### 7 — Free-First Infrastructure

Use existing and free options before paid services. Before any billable commitment, establish:

- what is free;
- what becomes billable;
- fixed and usage-based pricing;
- how costs grow over time;
- retention/deletion behaviour;
- how the dependency can be removed later.

Paid infrastructure requires explicit Founder approval.

### 8 — Explicit Over Implicit

State requirements, assumptions, inputs, outputs, dependencies, limitations, and acceptance criteria explicitly.

### 9 — Repeatability

A process is not production-ready if success depends on undocumented manual steps or personal memory.

### 10 — Incremental and Reversible Change

Prefer small changes with clear rollback paths. Separate unrelated work.

### 11 — Technical Debt Is Visible

Record meaningful debt, unresolved risks, and deferred architecture decisions. Do not hide them inside optimistic status labels.

### 12 — Maintainability Over Cleverness

Future engineers should understand the system without its original author.

### 13 — Change Control

No unrelated cleanup, speculative refactor, dependency upgrade, schema change, or infrastructure change should be bundled into a focused task without explicit justification.

### 14 — Deployment Identity Matters

For deployment-sensitive work, verify the chain:

**Source commit → Cloudflare build/deployment → runtime version/identity → live endpoint**

Never use a successful Pages deployment as evidence that a Workers deployment succeeded, or vice versa.

### 15 — Cost Is an Architectural Constraint

A technically elegant service can still be the wrong solution if its long-term cost or lock-in violates project constraints.

### 16 — Future Migration Must Remain Possible

When choosing infrastructure, avoid unnecessary coupling that would make a later migration disproportionately expensive.

### 17 — Documentation Must Match Reality

Status labels, architecture diagrams, version numbers, and technology notes must reflect the verified current state.

### 18 — Evidence Status Is Explicit

Material findings must be labelled PROVEN or NOT PROVEN. Hypotheses must not be presented as facts.

### 19 — Verify the State Lifecycle

For stateful workflows, correctness includes the path from input through evaluation, state, persistence, reload/revisit, UI, and downstream report/consumer when relevant.

### 20 — Failures Must Remain Engineering Evidence

A legitimate degraded or out-of-spec result should be recordable and reviewable. A FAIL result must not block progression unless the actual engineering requirement or system contract requires blocking.

### 21 — Protect the Founder From Rushed Engineering

When frustration is high, slow the decision process, clarify facts and uncertainty, protect existing work, and avoid consequential changes until the safest action is clear.

## Engineering Maxim

Optimize for total lifetime cost: engineering time + operational risk + infrastructure cost + future migration cost.

A shortcut that saves five minutes today but creates five hours of future work is not efficient.
