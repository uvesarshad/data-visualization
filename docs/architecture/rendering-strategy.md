# Rendering Strategy

> **Scope:** Which rendering modes are used and why. **Rendering context:** Client **Last updated:** 2026-05-15

## Architecture

DataSense uses three rendering tiers:

1. **Frontend UI** — 100% client-side rendering (`'use client'`). The dashboard is a single interactive page that updates without full navigations.
2. **Next.js API Routes** — Server-side REST handlers (`src/app/api/`) for CRUD operations backed by better-sqlite3. No external backend server.
3. **Genkit Server Actions** — 7 AI flows in `src/ai/flows/` (`'use server'`) that call Google Gemini. Invoked directly from client components as async server actions.

## Why CSR for the UI

The dashboard is highly interactive — chart configs change per dataset, AI results stream in, users drag-drop files and ask NL questions. CSR avoids full round-trips on every interaction and keeps transitions smooth.

## Middleware

- **File:** `src/middleware.ts`
- **Scope:** `/api/analyses/:path*`
- **Behavior:** Validates `ds_auth` HttpOnly cookie or `Authorization: Bearer` header against `DATASENSE_API_TOKEN`. When the env var is unset the gate is disabled (dev bypass with a console warning).

## Route Structure

| Route | File | Type | Rendering |
|-------|------|------|-----------|
| `/` | `src/app/page.tsx` | Page | Client-side (`'use client'`) |
| `/api/analyses` | `src/app/api/analyses/route.ts` | API | Server (Node.js) |
| `/api/analyses/[id]` | `src/app/api/analyses/[id]/route.ts` | API | Server (Node.js) |
| `/api/analyses/[id]/reports` | `src/app/api/analyses/[id]/reports/route.ts` | API | Server (Node.js) |
| `/api/auth/login` | `src/app/api/auth/login/route.ts` | API | Server (Node.js) |
| `/api/auth/logout` | `src/app/api/auth/logout/route.ts` | API | Server (Node.js) |
| `/api/auth/me` | `src/app/api/auth/me/route.ts` | API | Server (Node.js) |

## Caching Strategy

- **AI results:** In-memory cache with 10-minute TTL (`src/lib/ai-cache.ts`). Key: `${flowName}:${inputLength}:${prefix400}`.
- **Metadata + stats:** Stored in Zustand (`src/lib/data-store.ts`) after first computation; never recomputed for the same dataset.
- **DB count:** 30-second TTL in-memory cache (`_countCache` in `database.ts`) to avoid repeated `COUNT(*)` queries.
- **HTTP:** API routes return `Cache-Control: private, no-store` (set in `next.config.ts` headers).

## Security Headers

Applied to all responses via `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Strict-Transport-Security` (production only)

## Related Docs

- [docs/architecture/data-flow.md] — How data moves through the system
- [docs/api/ai-flows.md] — The server actions that call Gemini
- [docs/infra/environment.md] — Environment variables including auth token
