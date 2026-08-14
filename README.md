# FSOS - Field Services Operating System

FSOS is a web-based engineering operating system designed for field service engineers, machine health diagnostics (Smart MHC), laser engine analysis, and automated cross-device cloud synchronization.

## Features

- **Machine Passport & Field Tasks**: Manage machinery, serial numbers, baselines, and maintenance schedules.
- **Smart MHC & Engineering Report Studio**: Machine health check workspace with modular widgets and continuous report studio.
- **Engineering Engines**: Laser power analysis, beam profiling, temperature log analysis, product process analysis.
- **Automatic Cloud Sync**: Background synchronization between IndexedDB local storage and Cloudflare D1 cloud replica across devices (e.g., `HOME-PC` and `STM-LAPTOP`).
- **Offline-First**: Full offline support with automatic queue resumption when online.

## Deployment to Cloudflare Workers

1. **Build Application**:
   `npm run build`
2. **Create D1 Database** (if not created):
   `npx wrangler d1 create fsos-d1`
3. **Deploy Worker**:
   `npx wrangler deploy`
