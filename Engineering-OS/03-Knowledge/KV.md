# Cloudflare KV

# Technology Status

## Current Usage

Not Yet Used

## Adoption Status

Planned

## Learning Priority

High

## Expected Projects

- FSOS
- Vault
- Future SaaS Platforms

## Notes

Cloudflare KV is intended for globally distributed configuration, lightweight application state, feature flags, and frequently read data.

---

# Purpose

This document serves as the Engineering-OS decision guide for Cloudflare KV.

It focuses on engineering decisions, distributed configuration management, caching strategies, and operational best practices.

---

# Overview

Cloudflare KV is a globally distributed key-value database optimized for extremely fast reads.

Unlike D1, KV is not designed for relational SQL queries.

It stores small pieces of information that can be retrieved quickly across Cloudflare's global network.

---

# Primary Responsibilities

Cloudflare KV should own:

- Application configuration
- Feature flags
- Global settings
- Session tokens (where appropriate)
- Cached metadata
- Read-heavy configuration
- Lookup tables

KV should not replace relational databases.

---

# When to Use

Use KV when:

✓ Configuration is globally shared

✓ Reads greatly exceed writes

✓ Low latency is important

✓ Data structure is simple

✓ SQL relationships are unnecessary

---

# When NOT to Use

Avoid KV when:

✗ Relational queries are required

✗ Complex transactions are required

✗ Frequent updates are expected

✗ Structured reporting is required

Those scenarios are better suited to D1.

---

# Best Practices

- Keep values small.
- Design predictable key naming.
- Version configuration keys.
- Separate configuration from business logic.
- Document every key used by the application.

---

# Common Mistakes

- Treating KV like a SQL database.
- Storing complex relational data.
- Ignoring cache consistency.
- Using unclear key names.
- Overwriting production configuration without versioning.

---

# Lessons Learned

Reserved for future Engineering-OS experience.

---

# Decision Matrix

Need relational SQL?

→ D1

Need object storage?

→ R2

Need configuration or cache?

→ KV

Need backend processing?

→ Workers

Need frontend hosting?

→ Pages

---

# Related Documents

Cloudflare.md

Workers.md

Pages.md

D1.md

R2.md

---

# Revision Policy

This document should evolve through Engineering-OS experience.

Capture practical engineering knowledge rather than vendor documentation.