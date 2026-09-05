# Migration Template

## Purpose

This template defines the standard process for migrating software, infrastructure, databases, platforms, frameworks, or services.

A migration should improve the system while preserving existing functionality, minimizing downtime, and providing a safe rollback path.

---

# Migration Metadata

Project:

Migration Type:

Current Platform:

Target Platform:

Priority:

Risk Level:

Current Version:

Target Version:

Engineer:

Date:

---

# Objective

Describe the purpose of this migration.

Examples:

- Framework upgrade
- Cloud provider migration
- Database migration
- Backend migration
- Infrastructure modernization
- Desktop migration

---

# Current State

Describe the existing environment.

Include:

- architecture
- limitations
- dependencies
- known issues

---

# Target State

Describe the desired environment after migration.

Highlight improvements and expected benefits.

---

# Migration Scope

Included

-

-

-

Out of Scope

-

-

-

---

# Migration Strategy

Phase 1 — Preparation

-

-

Phase 2 — Implementation

-

-

Phase 3 — Validation

-

-

Phase 4 — Cleanup

-

-

Each phase must be independently verifiable.

---

# Compatibility Requirements

Verify compatibility with:

- Existing APIs
- Existing Database
- Existing UI
- Existing Reports
- Existing Integrations
- Existing Workflows

---

# Data Integrity

Verify:

□ Data preserved

□ No duplication

□ No corruption

□ No unexpected deletion

□ Existing identifiers retained

---

# Rollback Strategy

Rollback Trigger

-

Rollback Procedure

-

Recovery Verification

-

---

# Risk Assessment

Potential Risks

-

-

-

Mitigation

-

-

-

---

# Acceptance Criteria

✓ Migration completed

✓ Existing functionality preserved

✓ Data integrity maintained

✓ Performance acceptable

✓ Documentation updated

✓ Build successful

✓ Deployment successful

---

# Failure Conditions

Migration incomplete

Data loss detected

Regression introduced

Rollback unavailable

Acceptance criteria unmet

---

# Verification

□ Verify migrated environment

□ Execute regression testing

□ Validate data integrity

□ Compare before and after behaviour

□ Update documentation

□ Update version

□ Update changelog

---

# Deliverables

Migration report

Updated architecture

Updated documentation

Version update

Changelog

Rollback documentation

---

# Lessons Learned

What made this migration successful?

What risks were discovered?

What should future migrations do differently?

Should Engineering-OS be updated?

If yes,

record a new migration lesson.

---

# Atlas Review

□ Root cause justified migration

□ Target architecture appropriate

□ Rollback verified

□ Data integrity protected

□ Compatibility preserved

□ Documentation complete

□ Engineering lesson captured

A migration is complete only when the new environment is demonstrably more reliable than the old one.