# Cloudflare Workers

## Technology Status

- **Current Usage:** Active
- **FSOS Production:** Yes
- **Adoption:** Production
- **Learning Priority:** High

## Purpose

Workers are the FSOS backend/runtime layer and should remain responsible for API requests, business logic, validation, and access to bound Cloudflare services.

## FSOS Responsibilities

Workers currently provide:

- API endpoints
- D1 persistence and queries
- Synchronization endpoints
- Runtime health/status
- Production deployment target

R2 image storage is not currently active.

## Deployment Identity

A Worker deployment is not considered verified from a successful build alone.

Verify the chain:

**GitHub commit → Cloudflare build/deployment → Worker version metadata → live endpoint**

Runtime metadata should expose enough information to identify the deployed application version and Cloudflare deployment/version identity where practical.

## Best Practices

- Keep Workers stateless.
- Store durable application data in the appropriate bound service.
- Validate requests.
- Return explicit errors; never report false success after a failed persistence operation.
- Keep secrets out of source code.
- Keep configuration and bindings reproducible.
- Verify production independently after deployment.

## Common Mistakes

- Treating Workers as traditional persistent servers.
- Assuming in-memory state is durable.
- Debugging frontend symptoms before checking the API.
- Confusing Pages deployment with Workers deployment.
- Changing package dependencies before proving the build/deployment divergence.

## Lessons Learned

### Deployment Pipeline Separation

Pages and Workers are separate deployment pipelines. Always identify which pipeline is failing before changing code.

### Runtime Verification

A successful deployment must be followed by a runtime/API check when the deployment affects production behaviour.

## Decision Matrix

Need backend API? → Workers

Need SQL storage? → D1

Need object storage? → R2 after approval

Need frontend hosting? → Pages only when that project uses Pages

## Related Documents

Cloudflare.md

Pages.md

D1.md

R2.md
