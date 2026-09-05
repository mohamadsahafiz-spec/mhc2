# Engineering-OS v1.10.0 — Atlas Engineering Operating System

## Purpose

Engineering-OS is the permanent engineering governance, decision, prompt, template, project, and knowledge system used by Atlas and implementation agents such as Mikasa.

It is designed to protect engineering time, project stability, Founder resources, and long-term maintainability.

## Core Operating Model

    Founder / User
        ↓
    Atlas — governance, investigation, decisions, prompts, review
        ↓
    Mikasa / implementation agents — implementation + technical evidence
        ↓
    Founder verification / acceptance where required

Engineering-OS governance is authored and stewarded by **Atlas**, while approved implementation changes within `Engineering-OS/` are applied and verified by **Mikasa**. Implementation agents must not independently modify active Engineering-OS governance.

    User Intent
        ↓
    Evidence
        ↓
    Analysis
        ↓
    Root Cause
        ↓
    Decision Gate
        ↓
    Enhanced Prompt / Implementation
        ↓
    Verification
        ↓
    Documentation

## Repository Structure

    Engineering-OS/
    ├── README.md
    ├── CHANGELOG.md
    ├── metadata.json
    ├── 00-Core/
    │   ├── Atlas-Constitution.md
    │   ├── CTO-Checklist.md
    │   ├── Decision-Making.md
    │   ├── Engineering Principles.md
    │   └── Prompt-Standard.md
    ├── 01-Templates/
    │   ├── Sprint-Template.md
    │   ├── Bugfix-Template.md
    │   ├── Refactor-Template.md
    │   ├── Migration-Template.md
    │   ├── Architecture-Review.md
    │   └── Release-Template.md
    ├── 02-Projects/
    │   └── FSOS/
    ├── 03-Knowledge/
    └── 04-Archive/

## Canonical Active Surface

The active Engineering-OS is defined by `README.md`, `CHANGELOG.md`, `metadata.json`, `00-Core/`, `01-Templates/`, `02-Projects/`, and `03-Knowledge/`. `04-Archive/` contains historical evidence and is not an active source of truth.

Historical migration/update material must not become a competing active instruction set. Before changing Engineering-OS, Atlas must inspect the current canonical active surface and use historical/archive material only when historical context is required.

## Core Governance

Read `00-Core/` before making a material engineering decision. Core rules define evidence discipline, cost control, prompt quality, change control, and decision gates.

## Templates

Use `01-Templates/` for repeatable sprint, bugfix, migration, architecture, refactor, and release workflows.

## Projects

Project-specific architecture and roadmap information lives in `02-Projects/`. Projects inherit Core governance but maintain their own implementation details.

## Knowledge

`03-Knowledge/` contains practical technology guidance. Status labels must reflect verified current usage rather than historical assumptions.

## Archive

`04-Archive/` preserves completed work and reusable engineering lessons. Historical records should not be rewritten except to correct factual errors.

## Versioning

Engineering-OS follows Semantic Versioning:

* MAJOR — governance or structural overhaul.
* MINOR — new capabilities, rules, templates, or knowledge areas.
* PATCH — corrections and maintenance.

## Contribution Workflow

1. Identify the objective.
2. Inspect the current source of truth.
3. Establish evidence.
4. Propose or perform the smallest justified change.
5. Verify the result.
6. Update documentation/versioning when applicable.
7. Record reusable lessons.

## Focused Execution & Continuity

For active FSOS implementation work, use the smallest verified boundary:

**Known issue → focused batch → implementation → evidence → Founder verification → lock → next batch**

Do not combine unrelated repairs merely for convenience. After each material task, keep the active state explicit so chat migration or context loss cannot silently change the plan.

For Atlas continuity, maintain a compact running state summary covering:
- completed/locked batches;
- current task;
- pending verification;
- current FSOS application version;
- next priority.

The active project state is authoritative; historical/archive records must not override verified current state.

## Current Engineering Focus

FSOS is currently focused on Smart MHC as the primary MHC workspace and the foundation for a unified customer-facing report engine.

The report direction is an evolution of the legacy Excel standard, not a visual copy. Customer Excel remains the engineering baseline for coverage and traceability; FSOS may reorganize, automate, calculate, compare, and visualize the same engineering meaning in a clearer modern format.

Planned report outputs:
* Full PDF
* Compact one-page PDF
* PPTX presentation

Core report principles:
* Previous vs Current comparison is a first-class requirement, especially for Laser Power and Beam Profile.
* Visual presentation should match the meaning of each data type rather than forcing every parameter into tables.
* Proven external engineering engines are integrated before they are enhanced.
* Actual customer workflow and report evidence take precedence over inferred requirements.

### Active Surface Rule

Future Atlas sessions should begin with the active Core rules and the current project state. `04-Archive` is historical evidence and should be consulted only when historical context is required. Redundant README/state copies should not become competing sources of truth.

### Project Versioning Boundary

FSOS is governed by this Engineering-OS but maintains its own authoritative project/application version and release history inside `02-Projects/FSOS/`. Engineering-OS does not duplicate a live FSOS version number in the root README.

### Planned intelligence direction

* MHC Autopilot may recommend existing parts from the authoritative Recommended Parts Master based on current MHC findings.
* Predictive-maintenance part recommendations are a later capability based on accumulated history and must remain conservative.
* Neither capability should invent catalog parts or replace engineer control.

## Current Version

v1.9.0
