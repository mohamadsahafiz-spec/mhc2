# SQLite

# Technology Status

## Current Usage

Indirect (Cloudflare D1)

## Adoption Status

Learning

## Learning Priority

High

## Expected Projects

- FSOS Desktop
- Vault
- Offline Applications
- Local Tools

## Notes

SQLite is one of the world's most widely used embedded relational databases. It powers Cloudflare D1 and is commonly used for desktop, mobile, and offline-first applications.

---

# Purpose

This document serves as the Engineering-OS decision guide for SQLite.

It focuses on engineering decisions, embedded database architecture, offline storage strategies, and practical engineering use cases.

---

# Overview

SQLite is a lightweight relational database engine stored entirely within a single file.

Unlike traditional database servers, SQLite requires no separate database service.

Applications communicate directly with the database file.

This makes SQLite ideal for desktop software, embedded systems, mobile applications, and offline-first tools.

---

# Primary Responsibilities

SQLite should own:

- Local application data
- Offline storage
- Configuration databases
- Local caching
- User preferences
- Machine records
- Standalone application databases

SQLite should not be treated as a distributed cloud database.

---

# When to Use

Use SQLite when:

✓ Offline capability is required

✓ Desktop software is being developed

✓ Mobile applications require local storage

✓ Small-to-medium datasets are sufficient

✓ Simplicity is preferred over client/server architecture

---

# When NOT to Use

Avoid SQLite when:

✗ Large multi-server deployments

✗ Extremely high concurrent writes

✗ Enterprise-scale distributed databases

✗ Global replication requirements

Those workloads are better suited to dedicated database servers.

---

# Best Practices

- Normalize database schemas.
- Use transactions where appropriate.
- Create indexes for frequently queried columns.
- Backup database files regularly.
- Version schema changes.
- Validate input before writing.

---

# Common Mistakes

- Treating SQLite as a replacement for enterprise database servers.
- Ignoring schema versioning.
- Skipping backup strategies.
- Storing large binary files inside the database.
- Forgetting transaction management.

---

# Lessons Learned

## Lesson 001

Cloudflare D1 is built on SQLite concepts.

Learning SQLite improves understanding of D1.

---

## Lesson 002

SQLite is expected to become important when Engineering-OS expands into desktop and offline-first applications.

---

# Decision Matrix

Need local relational storage?

→ SQLite

Need cloud SQL?

→ D1

Need object storage?

→ R2

Need configuration?

→ KV

Need backend APIs?

→ Workers

---

# Related Documents

Cloudflare.md

D1.md

Workers.md

Electron.md

Tauri.md

---

# Revision Policy

This document should evolve through Engineering-OS experience.

Capture practical engineering knowledge rather than generic database documentation.