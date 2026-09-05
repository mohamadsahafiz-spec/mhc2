# Cloudflare

## Technology Status

- **Current Usage:** Active across FSOS
- **FSOS Production Runtime:** Cloudflare Workers
- **FSOS Database:** Cloudflare D1
- **FSOS Pages:** Not the production deployment target
- **FSOS R2:** Not activated; under evaluation for image persistence
- **FSOS KV:** Not currently required

## Purpose

This is the Engineering-OS decision guide for Cloudflare. It records practical architecture and operational knowledge rather than reproducing vendor documentation.

## FSOS Deployment Rule

For FSOS, the production chain is:

**GitHub → Cloudflare Workers build/deployment → Worker runtime → workers.dev**

Cloudflare Pages may exist in an account or historical investigation, but a green Pages deployment is not evidence that the FSOS Worker deployment succeeded.

## Deployment Investigation

When Cloudflare behaviour is wrong, first identify the failing pipeline. Then verify:

1. GitHub commit
2. Cloudflare cloned/build commit
3. Build settings and commands
4. Wrangler configuration
5. package.json/package-lock.json
6. Build/deploy logs
7. Worker runtime identity/version
8. Live endpoint/functionality

## Product Mapping

| Requirement | Preferred Cloudflare component |
|---|---|
| Backend/API | Workers |
| Relational data | D1 |
| Object storage | R2, only after cost/need approval |
| Key/value configuration | KV when justified |
| Static frontend hosting | Pages when the project actually uses Pages |

## Cost Rule

Cloudflare services are not assumed to be free merely because a free allowance exists. Before activating a billable service, verify the free limits, billing model, growth behaviour, retention, and migration path, then obtain Founder approval.

## Practical Lessons

- Separate Workers and Pages deployment histories.
- Verify production runtime directly.
- Treat Wrangler configuration as part of the deployment contract.
- Keep bindings and production configuration version-controlled where appropriate.
- Never infer runtime identity from a UI label alone.

## Future Tooling

Cloudflare's official developer documentation and supported agent/MCP setup may be evaluated as a future Engineering-OS capability for current Workers, Wrangler, D1, R2, and deployment guidance. It is optional and must not be introduced during unrelated project recovery.

## Related Documents

- Workers.md
- Pages.md
- D1.md
- R2.md
- KV.md
- GitHub.md
