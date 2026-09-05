# Tauri

# Technology Status

## Current Usage

Not Yet Used

## Adoption Status

Research

## Learning Priority

High

## Expected Projects

- FSOS Desktop
- Vault Desktop
- Future Desktop Applications

## Notes

Tauri is a modern desktop application framework that combines a Rust backend with a native WebView frontend. It provides a lightweight alternative to Electron with significantly smaller application size and lower memory usage.

---

# Purpose

This document serves as the Engineering-OS decision guide for Tauri.

It focuses on engineering decisions, desktop application architecture, deployment strategy, performance considerations, and long-term maintainability.

---

# Overview

Tauri enables developers to build cross-platform desktop applications using standard web technologies for the user interface while leveraging Rust for native functionality.

Unlike Electron, Tauri uses the operating system's native WebView instead of bundling Chromium, resulting in smaller application size and lower resource consumption.

---

# Primary Responsibilities

Tauri should own:

- Desktop application shell
- Native operating system integration
- Secure local execution
- File system access
- Cross-platform desktop deployment
- High-performance native operations

Tauri should not replace backend APIs or cloud infrastructure.

---

# When to Use

Use Tauri when:

✓ Desktop application is required

✓ Small installer size is important

✓ Low memory usage is desired

✓ Better security is a priority

✓ High performance is required

✓ Long-term desktop development is planned

---

# When NOT to Use

Avoid Tauri when:

✗ The development team has no interest in learning Rust

✗ Existing Electron expertise significantly outweighs migration benefits

✗ A web application alone satisfies requirements

Technology should be selected according to project requirements rather than popularity.

---

# Best Practices

- Keep frontend and backend responsibilities separate.
- Minimize privileged Rust commands.
- Validate all IPC communication.
- Follow least-privilege principles.
- Reuse frontend components where possible.
- Keep the desktop shell lightweight.

---

# Common Mistakes

- Treating Tauri like Electron.
- Exposing unnecessary native capabilities.
- Mixing business logic with UI logic.
- Ignoring Rust error handling.
- Skipping security reviews.

---

# Lessons Learned

Reserved for future Engineering-OS experience.

---

# Electron vs Tauri

| Category | Electron | Tauri |
|----------|----------|--------|
| Runtime | Bundled Chromium | Native WebView |
| Memory Usage | Higher | Lower |
| Application Size | Larger | Smaller |
| Performance | Good | Excellent |
| Backend Language | Node.js | Rust |
| Learning Curve | Lower | Higher |
| Security | Good | Excellent |

There is no universally better framework.

Choose according to project requirements.

---

# Decision Matrix

Need fastest development using existing web skills?

→ Electron

Need lightweight desktop application?

→ Tauri

Need browser application?

→ React + Pages

Need offline local database?

→ SQLite

Need cloud synchronization?

→ Workers + D1

---

# Related Documents

Electron.md

React.md

SQLite.md

Git.md

GitHub.md

---

# Revision Policy

This document should evolve through Engineering-OS experience.

Record practical desktop engineering knowledge rather than framework marketing.