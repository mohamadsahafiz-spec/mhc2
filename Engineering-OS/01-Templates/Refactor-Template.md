# Refactor Template

## Purpose

This template defines the standard process for refactoring existing software.

Refactoring improves the internal quality of a system without changing its external behaviour.

The objective is to improve maintainability, readability, reliability, and long-term engineering quality while preserving functionality.

---

# Refactor Metadata

Project:

Module:

Priority:

Estimated Risk:

Current Version:

Target Version:

Engineer:

Date:

---

# Objective

Clearly describe why this refactor is being performed.

Examples:

- Reduce complexity
- Improve readability
- Remove duplication
- Improve architecture
- Improve maintainability

---

# Current State

Describe the existing implementation.

Include:

- strengths
- weaknesses
- known technical debt
- current limitations

---

# Desired State

Describe the target architecture after refactoring.

The desired behaviour should remain functionally equivalent unless explicitly stated.

---

# Scope

Included

-

-

-

Out of Scope

-

-

-

---

# Technical Debt Addressed

List every technical debt item this sprint removes.

-

-

-

---

# Refactor Strategy

Phase 1

Phase 2

Phase 3

Phase 4

Each phase should remain independently verifiable.

---

# Compatibility

Verify compatibility with:

- Existing API
- Existing UI
- Existing workflows
- Existing database
- Existing reports
- Existing integrations

---

# Risk Assessment

Regression Risk

Low / Medium / High

Potential Impacts

-

-

-

Rollback Strategy

-

-

-

---

# Acceptance Criteria

✓ Existing behaviour preserved

✓ Architecture improved

✓ Complexity reduced

✓ Duplicate logic removed

✓ Documentation updated

✓ Build successful

✓ Tests successful

---

# Failure Conditions

Refactor changes expected behaviour

Regression introduced

Architecture becomes more complex

Technical debt increases

Rollback impossible

---

# Verification

□ Compare behaviour before refactor

□ Compare behaviour after refactor

□ Execute regression testing

□ Validate performance (if applicable)

□ Update documentation

□ Update version

---

# Deliverables

Refactored source code

Architecture notes

Updated documentation

Version update

Changelog

---

# Lessons Learned

What engineering improvements were achieved?

What technical debt remains?

Should Engineering-OS be updated?

If yes,

record a new engineering lesson.

---

# Atlas Review

□ Behaviour preserved

□ Complexity reduced

□ Technical debt reduced

□ Risks acceptable

□ Rollback available

□ Documentation complete

□ Engineering lesson captured

Refactoring is complete only when maintainability has improved without reducing functionality.