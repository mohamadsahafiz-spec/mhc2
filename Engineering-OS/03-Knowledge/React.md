# React

# Technology Status

## Current Usage

Active

## Adoption Status

Production

## Learning Priority

High

## Expected Projects

- FSOS
- Vault
- Smart Home
- Bird Hunter
- Future Dashboards

## Notes

React is the primary frontend framework used across Engineering-OS projects for building modern, component-based user interfaces.

---

# Purpose

This document serves as the Engineering-OS decision guide for React.

It focuses on engineering decisions, component architecture, maintainability, and practical frontend development rather than serving as a React tutorial.

---

# Overview

React is a component-based JavaScript library for building user interfaces.

Applications are constructed by composing reusable components, each responsible for a specific part of the interface.

Within Engineering-OS, React is the preferred framework for web-based frontend development.

---

# Primary Responsibilities

React should own:

- User Interface
- Components
- Forms
- Dashboards
- State presentation
- User interaction
- Routing integration
- Client-side rendering

React should not contain backend business logic or direct database responsibilities.

---

# When to Use

Use React when:

✓ Building interactive dashboards

✓ Creating reusable UI components

✓ Developing modern web applications

✓ Managing complex user interfaces

✓ Long-term maintainability is important

---

# When NOT to Use

Avoid React when:

✗ Building backend APIs

✗ Managing database logic

✗ Implementing authentication servers

✗ Running scheduled backend jobs

Those responsibilities belong to backend services such as Cloudflare Workers.

---

# Best Practices

- Design reusable components.
- Keep components focused on a single responsibility.
- Separate UI from business logic.
- Keep state predictable.
- Organize folders consistently.
- Document shared components.
- Minimize unnecessary re-renders.

---

# Common Mistakes

- Creating excessively large components.
- Mixing API logic into presentation components.
- Passing props through many component layers unnecessarily.
- Ignoring component reuse.
- Managing unrelated responsibilities in one component.

---

# Lessons Learned

## Lesson 001

Small reusable components are easier to test, maintain, and extend.

---

## Lesson 002

Business logic should remain outside presentation components whenever practical.

---

## Lesson 003

A predictable component hierarchy reduces future engineering cost.

---

# Decision Matrix

Need a modern frontend?

→ React

Need backend processing?

→ Workers

Need relational database?

→ D1

Need local storage?

→ SQLite

Need object storage?

→ R2

---

# Related Documents

Cloudflare.md

Workers.md

Pages.md

SQLite.md

Git.md

GitHub.md

---

# Revision Policy

This document evolves through Engineering-OS experience.

Capture practical engineering patterns, architectural decisions, and lessons learned rather than framework documentation.