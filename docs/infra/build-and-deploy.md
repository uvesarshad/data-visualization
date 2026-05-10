# Build and Deployment

> **Scope:** Build process, next.config.ts, deployment. **Rendering context:** N/A **Last updated:** 2026-05-10

## Overview

The project uses Next.js 15 with Turbopack for development and standard `next build` for production.

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server on port 9002 with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm run genkit:dev` | Genkit dev server for AI flow testing |
| `npm run genkit:watch` | Genkit dev server with file watching |
| `[backend command]` | Start the backend server on port 3008 (depends on backend setup) |

## next.config.ts

- **File:** `next.config.ts`
- **TypeScript errors:** Not suppressed (build fails on TS errors)
- **ESLint:** Not suppressed (build fails on lint errors)
- **Images:** Remote patterns configured for placehold.co, unsplash.com, picsum.photos (currently unused)

AGENT NOTE: The `ignoreBuildErrors` and `ignoreDuringBuilds` flags have been removed. All TypeScript and ESLint errors must be fixed before building.

## Deployment Target

The project is currently configured for local development. This requires:
1. PostgreSQL database running locally.
2. Backend server running on port 3008.
3. Next.js dev server running on port 9002.
4. Genkit dev server (optional, for AI flow testing).

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.9 | Framework |
| react | 19.2.1 | UI library |
| genkit | 1.28.0 | AI framework |
| @genkit-ai/google-genai | 1.28.0 | Google AI plugin |
| recharts | 2.15.1 | Chart library |
| zustand | 5.0.13 | State management |
| @tanstack/react-virtual | 3.13.24 | Table virtualization |
| xlsx | 0.18.5 | Excel parsing (dynamically imported) |
| zod | 3.24.2 | Schema validation |

## Bundle Optimization

- Recharts (~400KB) is code-split via `next/dynamic` in ChartPanel
- XLSX (~300KB) is dynamically imported only when Excel files are uploaded
- Firebase and patch-package were removed as unused dependencies

## Related Docs

- [docs/infra/environment.md] — Environment variables
- [docs/architecture/rendering-strategy.md] — Why CSR only