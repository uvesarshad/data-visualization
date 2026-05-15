# DataSense — Project Overview

> **Scope:** Single entry point for all AI agents working on this codebase. **Rendering context:** Client (primary), Server (AI flows) **Last updated:** 2026-05-15

## Overview

DataSense is an AI-powered data visualization dashboard built with Next.js App Router. Users upload CSV, JSON, or Excel files — or fetch them directly from public HTTPS URLs — and the system automatically generates a multi-chart dashboard using AI recommendations from Google Gemini. The app supports saving/loading analyses, natural language chart queries, per-chart AI analysis, batch chart analysis, anomaly detection, and one-click executive report generation.

## Tech Stack

- **Framework:** Next.js 15.5.9 (App Router, Turbopack dev)
- **Language:** TypeScript 5
- **React:** 19.2.1
- **AI:** Google Gemini 2.5 Flash via Genkit 1.28.0 — 7 server-action flows
- **Database:** better-sqlite3 (WAL mode, `data/datasense.db`)
- **Charts:** Recharts 2.15.1 (22 chart types)
- **Styling:** Tailwind CSS 3.4.1 with CSS custom properties
- **UI Components:** Radix UI primitives (shadcn/ui pattern)
- **State:** Zustand global data store (`src/lib/data-store.ts`)
- **Data Processing:** XLSX (Excel, lazy-loaded), custom robust CSV parser, Web Worker for off-thread parsing with main-thread fallback
- **Testing:** Vitest (41 tests across 3 suites)
- **Font:** Inter (body), Space Grotesk (headlines) via next/font

## Rendering Strategy

- All pages are client-side rendered (`'use client'` directive)
- AI flows are server-side (`'use server'` directive) and called via server actions from client components
- Data persistence is handled directly by Next.js API routes (`/api/analyses`) backed by better-sqlite3
- `src/middleware.ts` gates `/api/analyses/*` behind an optional shared-secret token (`DATASENSE_API_TOKEN`)

## Environment

- **Node:** v24.12.0
- **Next.js:** 15.5.9
- **Required env vars:** `GOOGLE_GENAI_API_KEY` or `GOOGLE_API_KEY` or `GEMINI_API_KEY` (Gemini)
- **Optional env vars:** `DATASENSE_API_TOKEN` (enables API auth gate); `NEXT_PUBLIC_DATASENSE_DISABLE_PII_BANNER` (disables consent banner)

See `docs/infra/environment.md` and `.env.example` for the full list.

## Directory Map

Every file in `/docs/` with a one-line description:

| File | Covers |
|------|--------|
| `docs/overview.md` | This file — project index and mental model |
| `docs/how-to-update-docs.md` | Decision tree for maintaining documentation |
| `docs/architecture/rendering-strategy.md` | Client-only UI + Next.js API routes + better-sqlite3 |
| `docs/architecture/data-flow.md` | Full data lifecycle: upload → store → AI → chart |
| `docs/architecture/folder-structure.md` | Every folder's purpose and naming conventions |
| `docs/modules/data-upload.md` | File upload, URL fetch, Web Worker parsing, validation |
| `docs/modules/ai-insights.md` | AI-generated insights, key findings, predictions, grounding |
| `docs/modules/visualization-recommendations.md` | AI chart recommendation engine |
| `docs/modules/chart-rendering.md` | 22 chart types, ChartPanel, ChartRenderer |
| `docs/modules/natural-language-query.md` | NL query bar, filter execution, Cmd/Ctrl+K shortcut |
| `docs/modules/chart-analysis.md` | Per-chart AI analysis dialog |
| `docs/modules/report-generation.md` | Executive report generation |
| `docs/modules/anomaly-detection.md` | IQR-based client-side detection + AI explanation panel |
| `docs/modules/data-profiler.md` | Data profiler overlay |
| `docs/ui/component-library.md` | Every shared UI component with props |
| `docs/ui/layout-system.md` | Root layout, sidebar, header, panels, mobile sheets |
| `docs/ui/theming.md` | CSS variables, Tailwind config, dark mode |
| `docs/api/ai-flows.md` | All 7 Genkit server actions (the "API") |
| `docs/api/data-utilities.md` | Data processing, statistics, chart utils |
| `docs/state/client-state.md` | Zustand store, React state patterns |
| `docs/infra/environment.md` | Environment variables and configuration |
| `docs/infra/build-and-deploy.md` | Build process, next.config.ts, security headers |

## Key Architectural Decisions

1. **better-sqlite3 for persistence** — Analyses (metadata, insights, chart configs) are saved to a local SQLite file (`data/datasense.db`) via Next.js API routes. WAL mode keeps reads non-blocking during writes.

2. **Server actions as AI gateway** — The 7 Genkit flows in `src/ai/flows/` are the exclusive AI interface. They run server-side, enforce Zod output schemas, sanitize all user inputs with `src/lib/prompt-sanitize.ts`, and apply `maxOutputTokens` budgets to every call.

3. **AI-first visualization** — Charts are not manually configured. The AI recommends up to 9 charts based on dataset metadata, and the renderer auto-detects column roles if needed.

4. **Web Worker for parsing** — CSV and Excel parsing runs in a Web Worker (`src/lib/data-worker.ts`) to keep the UI thread responsive during large file loads. Falls back to main-thread parsing if the worker fails to spawn.

5. **Aggressive in-memory caching** — AI results are cached in memory with a 10-minute TTL (`src/lib/ai-cache.ts`). Metadata and stats are computed once on data load and stored in the Zustand store, reused everywhere.

6. **Dynamic chart loading** — Recharts (~400 KB) is code-split via `next/dynamic` and loaded only when charts first render.

7. **Prompt injection defense (defense-in-depth):**
   - `sanitizeForPrompt` strips control chars and `<user_*>` tag patterns from all user content before it enters a prompt
   - Delimiter wrapping — user data wrapped in `<user_dataset>`, `<user_query>`, etc.
   - `PROMPT_GUARDRAIL` constant prepended to every prompt
   - Genkit's Zod-enforced structured output is the final layer

8. **Prototype pollution prevention** — `JSON.parse` uses a reviver that drops `__proto__`/`prototype`/`constructor` keys. CSV/Excel row objects use `Object.create(null)`.

9. **Optional auth gate** — `middleware.ts` checks a `ds_auth` HttpOnly cookie or `Authorization: Bearer` header against `DATASENSE_API_TOKEN`. When the env var is unset, the gate is disabled (dev bypass with a console warning).

## Cross-Cutting Concerns

- **Auth:** Optional shared-secret token gate (`DATASENSE_API_TOKEN`). `LoginDialog` component blocks the UI until authenticated when the gate is enabled.
- **Error handling:** Each AI call is wrapped in try/catch with user-facing toast notifications. AI flow outputs are null-checked before use. Large payloads throw `PayloadTooLargeError` (caught as HTTP 413).
- **Security headers:** Applied to all responses via `next.config.ts` — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS (prod only), etc.
- **Validation:** `src/app/lib/data-validation.ts` validates uploaded data. Zod schemas validate all AI flow inputs/outputs.
- **PII consent:** `PIIConsentBanner` (bottom-right sticky) informs users before data is sent to Gemini.
- **Persistence:** Full CRUD for analyses via `/api/analyses`. Pagination (24 per page) in `PreviousAnalyses`.

## AI Flows (7 total — all registered in `src/ai/dev.ts`)

| Flow | File | Purpose |
|------|------|---------|
| `aiGeneratedDataInsightsFlow` | `ai-generated-data-insights.ts` | Insights, key findings, predictions. Optional Google Search grounding. |
| `recommendVisualizationsFlow` | `ai-powered-visualization-recommendations.ts` | Recommends up to 9 chart configurations. |
| `nlQueryFlow` | `natural-language-query.ts` | Translates NL query → chart config. Post-validates column names. |
| `perChartAnalysisFlow` | `per-chart-analysis.ts` | Analyzes a single chart. Chart-type-specific focus instructions. |
| `batchChartAnalysisFlow` | `batch-chart-analysis.ts` | Analyzes up to 9 charts in one call with cross-chart insights. |
| `anomalyDetectionFlow` | `anomaly-detection.ts` | Explains pre-detected IQR anomalies with severity and recommendations. |
| `reportGenerationFlow` | `report-generation.ts` | Generates a structured executive report with sections, metrics, and action items. |

## Glossary

| Term | Meaning |
|------|---------|
| **Flow** | A Genkit server action wrapping an AI prompt with typed Zod input/output |
| **ChartPanel** | A self-contained chart card handling data prep, stats, rendering, and per-chart AI |
| **ChartRenderer** | Dynamically imported component containing all 22 Recharts chart implementations |
| **ColumnMetadata** | Schema describing a data column: name, type, uniqueness, min/max/avg |
| **prepareChartData** | Utility that transforms raw data into chart-ready format (aggregation, slicing) |
| **NL Query** | Natural language query — user types a question, AI returns a chart config |
| **Persistence** | Saves analysis state (metadata, insights, chart configs) to better-sqlite3 |
| **PROMPT_GUARDRAIL** | Standard anti-injection instruction prepended to every AI prompt |
| **URL Fetch** | Import data directly from a public HTTPS URL (CSV, JSON, Excel) |
| **AnomalyPanel** | Client-side IQR anomaly detection + "Explain with AI" button |
| **BatchAnalysisDialog** | Analyzes all visible charts in a single AI call |

## Related Docs

- [docs/how-to-update-docs.md] — Documentation maintenance rules
- [docs/architecture/data-flow.md] — Detailed data lifecycle
- [docs/api/ai-flows.md] — All 7 flows with input/output schemas
