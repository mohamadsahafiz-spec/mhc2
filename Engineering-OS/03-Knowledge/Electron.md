# Electron

# Technology Status

## Current Usage

Not Yet Used

## Adoption Status

Research

## Learning Priority

Medium

## Expected Projects

- FSOS Desktop
- Vault Desktop
- Internal Engineering Tools

## Notes

Electron is a desktop application framework that packages web technologies (HTML, CSS, JavaScript) together with Node.js to create cross-platform desktop applications.

---

# Purpose

This document serves as the Engineering-OS decision guide for Electron.

It focuses on engineering decisions, desktop architecture, deployment considerations, and long-term maintainability.

---

# Overview

Electron enables developers to build desktop applications using web technologies.

Applications run inside a bundled Chromium browser with access to Node.js, allowing the same codebase to target Windows, macOS, and Linux.

Electron powers many widely used applications including Visual Studio Code, Discord, Slack, Postman, and GitHub Desktop.

---

# Primary Responsibilities

Electron should own:

- Desktop application shell
- Native desktop integration
- File system access
- Local application execution
- Cross-platform desktop deployment
- Native menus and windows

Electron should not replace backend services or cloud infrastructure.

---

# When to Use

Use Electron when:

✓ A desktop application is required

✓ Existing web technologies should be reused

✓ Cross-platform support is important

✓ Native operating system integration is required

✓ Development speed is prioritized

---

# When NOT to Use

Avoid Electron when:

✗ Application size must remain minimal

✗ Memory usage is extremely constrained

✗ Maximum runtime efficiency is required

✗ A web application alone satisfies requirements

---

# Best Practices

- Keep the renderer process lightweight.
- Separate frontend and backend responsibilities.
- Use secure IPC communication.
- Disable unnecessary Node.js access in the renderer.
- Keep dependencies updated.
- Follow the principle of least privilege.

---

# Common Mistakes

- Mixing UI and system logic.
- Exposing unrestricted Node.js APIs.
- Loading unnecessary background processes.
- Ignoring application security.
- Packaging unnecessary assets.

---

# Lessons Learned

Reserved for future Engineering-OS experience.

---

# Decision Matrix

Need desktop application?

→ Electron

Need lightweight desktop runtime?

→ Compare with Tauri

Need browser application?

→ React + Pages

Need backend processing?

→ Workers

---

# Related Documents

React.md

SQLite.md

Tauri.md

Git.md

---

# Revision Policy

This document should evolve through Engineering-OS experience.

Capture practical desktop engineering knowledge rather than framework documentation.