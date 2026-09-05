# Cloudflare Pages

## Technology Status

- **Current Usage:** Available in the Cloudflare account; not the FSOS production deployment target
- **Adoption:** Project-dependent
- **FSOS Role:** None in the current production deployment chain

## Purpose

Pages is a frontend hosting/deployment platform. This document exists to prevent Pages and Workers deployment histories from being confused.

## Responsibilities

Pages is appropriate for:

- Static frontend hosting
- Compiled frontend assets
- React applications that explicitly use Pages

Pages should not be treated as a backend server.

## FSOS Rule

FSOS production uses **Cloudflare Workers**, not Pages.

A successful Pages build or deployment must never be used as evidence that the FSOS Worker deployment succeeded.

## Investigation Rule

If a Cloudflare incident occurs:

1. Identify whether the failing target is Pages or Workers.
2. Follow only that pipeline first.
3. Compare source commit and deployed commit.
4. Verify the actual runtime/URL.

## Common Mistakes

- Chasing a green Pages deployment while Workers is failing.
- Assuming shared repository history means shared deployment state.
- Treating frontend success as proof of backend success.

## Related Documents

Cloudflare.md

Workers.md

D1.md
