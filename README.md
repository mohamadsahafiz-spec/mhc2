# FSOS - Field Services Operating System

FSOS is a web-based engineering operating system designed for field service engineers, machine health diagnostics (Smart MHC), laser engine analysis, and automated cross-device cloud synchronization.

## Features

- **Machine Passport & Field Tasks**: Manage machinery, serial numbers, baselines, and maintenance schedules.
- **Smart MHC & Engineering Report Studio**: Machine health check workspace with modular widgets and continuous report studio.
- **Engineering Engines**: Laser power analysis, beam profiling, temperature log analysis, product process analysis.
- **Automatic Cloud Sync**: Background synchronization between IndexedDB local storage and Cloudflare D1 cloud replica across devices (e.g., `HOME-PC` and `STM-LAPTOP`).
- **Offline-First**: Full offline support with automatic queue resumption when online.

## Repository Architecture & Engineering-OS Governance

FSOS is a unified engineering repository containing both the application runtime and the authoritative **Engineering-OS** governance framework:
- `src/`: FSOS application source code (React, TypeScript, Tailwind, Lucide).
- `migrations/`: Cloudflare D1 SQL schema migrations.
- `Engineering-OS/`: Authoritative engineering governance, decision templates, constitutional guidelines, project blueprints, and institutional knowledge base:
  - `00-Core/`: Constitutional rules, CTO checklists, prompt standards, and decision workflows.
  - `01-Templates/`: Sprint, architecture review, refactor, migration, and release templates.
  - `02-Projects/`: Project specifications, architectures, and state tracking.
  - `03-Knowledge/`: Technical knowledge cards (Cloudflare Workers, D1, KV, SQLite, React, etc.).
  - `04-Archive/`: Historical records and sprint logs.

## Deployment to Cloudflare Workers

1. **Build Application**:
   `npm run build`
2. **Create D1 Database** (if not created):
   `npx wrangler d1 create fsos-d1`
3. **Deploy Worker**:
   `npx wrangler deploy`
