# Rendering Strategy

> **Scope:** Which rendering modes are used and why. **Rendering context:** Client **Last updated:** 2026-05-10

## Hybrid Architecture

DataSense uses a hybrid model:
1. **Frontend:** 100% client-side rendering for the UI (`src/app/page.tsx`).
2. **Backend:** A Node.js server on port 3008 for data persistence (PostgreSQL).
3. **AI Gateway:** Genkit server actions for AI logic.

## Why CSR for the UI

The UI remains CSR because it provides a highly interactive, "single-app" experience. While data is now persisted server-side, the dashboard itself is rendered entirely in the browser to ensure smooth transitions and real-time visualization updates.

## Server-Side Components

The project incorporates server-side logic in two ways:
1. **Genkit Flows:** 7 AI flows in `src/ai/flows/` (Server Actions) for Gemini integration.
2. **Backend Server:** An external server on port 3008 that provides a REST API for database operations.

## Route Structure

| Route | File | Type | Rendering |
|-------|------|------|-----------|
| `/` | `src/app/page.tsx` | Page | Client-side (`'use client'`) |

There are no dynamic routes, no route groups, no parallel routes, no intercepting routes, and no catch-all routes.

## Caching Strategy

- AI results: In-memory client cache with 10-minute TTL (`src/lib/ai-cache.ts`)
- Column metadata: Cached in `useRef` after first computation
- Column stats: Computed once in `useMemo`, passed as props
- No HTTP caching, no CDN, no ISR revalidation

AGENT NOTE: While the UI is CSR, always ensure that data-sensitive operations (storage, AI prompts) are handled on the server side (Backend or Genkit flows).

## Related Docs

- [docs/architecture/data-flow.md] — How data moves through the system
- [docs/api/ai-flows.md] — The server actions that call Gemini