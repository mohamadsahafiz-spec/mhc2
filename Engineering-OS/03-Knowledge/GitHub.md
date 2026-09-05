# GitHub

# Technology Status

## Current Usage

Active

## Adoption Status

Production

## Learning Priority

High

## Expected Projects

- Engineering-OS
- FSOS
- Vault
- Smart Home
- Bird Hunter
- Future Projects

## Notes

GitHub is the primary remote repository platform used by Engineering-OS. It provides centralized collaboration, version hosting, issue tracking, pull requests, releases, and automation capabilities built on Git.

---

# Purpose

This document serves as the Engineering-OS decision guide for GitHub.

It focuses on repository management, engineering collaboration, release workflows, project organization, and long-term maintainability.

---

# Overview

GitHub is a cloud-based platform built around Git.

While Git manages local version history, GitHub provides collaboration, remote storage, code review, project management, release management, and automation.

Engineering-OS uses GitHub as the central source of truth for every project repository.

---

# Primary Responsibilities

GitHub should own:

- Remote repositories
- Collaboration
- Pull Requests
- Code Reviews
- Releases
- Project visibility
- Issue tracking
- Repository documentation
- CI/CD integration
- Engineering history

GitHub should complement Git rather than replace it.

---

# When to Use

Use GitHub when:

✓ Sharing repositories

✓ Collaborating with engineers

✓ Reviewing code

✓ Publishing releases

✓ Managing project documentation

✓ Maintaining engineering history

✓ Automating workflows

---

# When NOT to Use

Avoid GitHub as:

✗ The only project backup

✗ A password vault

✗ A database

✗ A replacement for local version control

Git should always exist locally.

---

# Best Practices

- One repository per project.
- Maintain a clear README.
- Protect the main branch.
- Use Pull Requests for significant changes.
- Review before merging.
- Tag official releases.
- Keep Issues organized.
- Keep documentation synchronized.

---

# Common Mistakes

- Committing directly to production branches.
- Ignoring Pull Requests.
- Poor repository organization.
- Missing README documentation.
- Large unrelated commits.
- Forgetting release notes.
- Treating GitHub as backup instead of collaboration.

---

# Repository Structure

Recommended structure:

Engineering-OS

FSOS

Vault

Smart Home

Bird Hunter

Each project should maintain independent version history while following Engineering-OS standards.

---

# Release Workflow

Development

↓

Commit

↓

Push

↓

Pull Request

↓

Review

↓

Merge

↓

Tag Release

↓

Deploy

Every release should remain traceable.

---

# Lessons Learned

Reserved for future Engineering-OS experience.

---

# Decision Matrix

Need local version history?

→ Git

Need remote collaboration?

→ GitHub

Need automated workflows?

→ GitHub Actions

Need documentation?

→ Repository Wiki or Markdown

Need project planning?

→ GitHub Issues & Projects

---

# Related Documents

Git.md

Release-Template.md

Sprint-Template.md

CTO-Checklist.md

Prompt-Standard.md

---

# Revision Policy

This document should evolve through Engineering-OS experience.

Capture practical repository management knowledge rather than GitHub feature documentation.