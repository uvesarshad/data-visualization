# Rendering Strategy

> **Scope:** Which rendering modes are used and why. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

DataSense uses 100% client-side rendering. There is no SSR, SSG, ISR, or server-side page rendering. The single page at `src/app/page.tsx` is marked `'use client'` and all data processing happens in the browser.

## Why CSR Only

The app processes user-uploaded data that exists only in browser memory. There is no server-side database or persistent storage. Server rendering would serve no purpose since there is no data to render on the initial request.

## Server Actions (Not Routes)

The only server-side code consists of 6 Genkit AI flows in `src/ai/flows/`. These are server actions (`'use server'`) called from client components. They do not render HTML — they return structured data (JSON) to the client.

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

AGENT NOTE: Do not add `'use server'` to any component or page file. Only files in `src/ai/flows/` should use server directives.

## Related Docs

- [docs/architecture/data-flow.md] — How data moves through the system
- [docs/api/ai-flows.md] — The server actions that call Gemini