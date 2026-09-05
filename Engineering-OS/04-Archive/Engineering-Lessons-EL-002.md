# EL-002 — Identify the Failing Deployment Pipeline First

## Status

Approved

## Summary

Cloudflare Pages and Cloudflare Workers are separate deployment pipelines. A green deployment in one is not evidence that the other is healthy.

## Lesson

Before changing code during a deployment incident:

1. Identify the actual production target.
2. Identify the failing pipeline.
3. Verify the source commit.
4. Verify the Cloudflare build/deployment commit.
5. Verify runtime identity.
6. Only then investigate build or code differences.

## Reusable Rule

**Never chase a green pipeline when the production pipeline is red.**

## Origin

FSOS deployment recovery, August 2026.
