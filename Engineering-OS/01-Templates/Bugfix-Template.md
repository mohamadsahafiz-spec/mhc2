# Bugfix Template

## Purpose

This template standardizes bugfix implementation across all Engineering-OS projects.

Bugfixes should eliminate the root cause while minimizing regression risk and preserving existing functionality.

The objective is not merely to make the bug disappear.

The objective is to prevent the bug from returning.

---

# Bug Metadata

Project:

Module:

Severity:

Priority:

Reported By:

Date:

Version Found:

Target Version:

---

# Problem Statement

Describe the observed issue.

Avoid assumptions.

State only verified facts.

---

# Expected Behaviour

Describe the expected system behaviour.

---

# Actual Behaviour

Describe the observed behaviour.

Include:

- logs
- screenshots
- error messages
- reproduction

---

# Root Cause Analysis

Immediate Cause

-

Underlying Cause

-

Why was this possible?

-

Could this occur elsewhere?

-

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

# Reproduction Steps

1.

2.

3.

4.

---

# Implementation Plan

Step 1

Step 2

Step 3

Step 4

---

# Regression Risk

Low

Medium

High

Dependencies

-

Rollback Plan

-

---

# Acceptance Criteria

✓ Bug eliminated

✓ Existing functionality preserved

✓ No new regression

✓ Build successful

✓ Tests pass

✓ Documentation updated (if required)

---

# Failure Conditions

Bug still reproducible

Regression introduced

Root cause unresolved

Acceptance criteria unmet

---

# Verification

□ Reproduce original bug

□ Apply fix

□ Repeat reproduction

□ Confirm issue resolved

□ Execute regression tests

□ Review logs

□ Update version

---

# Deliverables

Source code

Test evidence

Documentation

Version update

Changelog

---

# Lessons Learned

What allowed this bug to exist?

What engineering improvement prevents similar bugs?

Should Engineering-OS be updated?

If yes,

create a Lesson Learned entry.

---

# Atlas Review

□ Root cause identified

□ Symptom not mistaken for cause

□ Existing behaviour protected

□ Regression risk acceptable

□ Verification complete

□ Engineering lesson captured

Only then is the bugfix complete.