# Build and Deployment

> **Scope:** Build process, next.config.ts, deployment. **Rendering context:** N/A **Last updated:** 2026-05-15

## Overview

The project uses Next.js 15 with Turbopack for development and standard `next build` for production. No external backend server is required — persistence is handled by better-sqlite3 directly in the Next.js process.

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server on port 9002 with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm run test` | Run Vitest test suite (41 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run genkit:dev` | Genkit dev server for AI flow testing |
| `npm run genkit:watch` | Genkit dev server with file watching |

## next.config.ts

- **File:** `next.config.ts`
- **TypeScript errors:** Not suppressed (build fails on TS errors)
- **ESLint:** Not suppressed (build fails on lint errors)
- **`serverExternalPackages`:** `['better-sqlite3']` — keeps the native SQLite binding out of the edge runtime bundle
- **Security headers:** Applied to all responses via the async `headers()` export (see below)
- **Images:** Remote patterns configured for placehold.co, unsplash.com, picsum.photos

## Security Headers (next.config.ts)

Applied to `/:path*`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (production only)

Applied additionally to `/api/:path*`:
- `Cache-Control: private, no-store, max-age=0`

## Database

- **Engine:** better-sqlite3 (synchronous, file-based)
- **File path:** `data/datasense.db` (created automatically on first run)
- **Mode:** WAL (`PRAGMA journal_mode = WAL`) — non-blocking reads
- **Foreign keys:** Enabled (`PRAGMA foreign_keys = ON`)
- **Schema:** Auto-migrated on first `getDb()` call via `CREATE TABLE IF NOT EXISTS`

AGENT NOTE: `better-sqlite3` is a native Node.js addon and must NOT run in Edge runtime. The `serverExternalPackages` setting in next.config.ts prevents Next.js from bundling it.

## Deployment Target

The project runs as a standard Node.js Next.js app. Requirements:
1. Node.js 20+ (tested on v24)
2. Writable filesystem for `data/datasense.db`
3. `GOOGLE_GENAI_API_KEY` (or equivalent) environment variable
4. Optional: `DATASENSE_API_TOKEN` for API auth gate

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.9 | Framework |
| react | 19.2.1 | UI library |
| genkit | 1.28.0 | AI framework |
| @genkit-ai/google-genai | 1.28.0 | Google AI plugin |
| better-sqlite3 | — | SQLite persistence |
| recharts | 2.15.1 | Chart library |
| zustand | 5.0.13 | State management |
| xlsx | 0.18.5 | Excel parsing (dynamically imported) |
| zod | 3.24.2 | Schema validation |
| vitest | — | Test framework |

## Bundle Optimization

- Recharts (~400 KB) is code-split via `next/dynamic` — loaded only when charts first render
- XLSX (~300 KB) is dynamically imported only when Excel files are uploaded
- CSV/Excel parsing runs in a Web Worker (`src/lib/data-worker.ts`) to keep the main thread responsive

## Related Docs

- [docs/infra/environment.md] — Environment variables
- [docs/architecture/rendering-strategy.md] — CSR + API routes + middleware
