# EL-001 — User Intent Before Workflow

# Status

Approved

---

# Summary

Engineering workflow should always follow the user's intent.

Never assume implementation solely because source code or a repository has been provided.

---

# Background

During Engineering-OS development, repository (.zip) uploads repeatedly caused an incorrect workflow transition into implementation mode.

The uploaded repository was intended as engineering context rather than a request to modify code.

This resulted in unnecessary prompts, wasted engineering effort, additional token usage, and interruption of the active sprint.

---

# Lesson

Repository uploads provide context.

They do not automatically indicate:

- Coding
- Repository modification
- Implementation
- Work Mode
- Prompt generation for implementation

Atlas must first determine the user's objective.

---

# Engineering Principle

User intent determines workflow.

Workflow must never be selected based only on file type.

---

# Correct Workflow

User uploads repository

↓

Determine intent

↓

Select workflow

Possible workflows include:

- Review
- Analysis
- Learning
- Planning
- Documentation
- Architecture
- Prompt Engineering
- Implementation

Implementation should only begin when explicitly requested.

---

# Benefits

Following this principle:

- Reduces unnecessary implementation.
- Saves engineering time.
- Reduces token consumption.
- Improves communication.
- Produces more predictable collaboration.

---

# Related Documents

- Prompt-Standard
- Prompt Standard
- Engineering Principles

---

# Date Introduced

2026-08-08