# DataSense — Project Overview

> **Scope:** Single entry point for all AI agents working on this codebase. **Rendering context:** Client (primary), Server (AI flows) **Last updated:** 2026-05-10

## Overview

DataSense is an AI-powered data visualization dashboard built with Next.js App Router. Users upload CSV, JSON, or Excel files, and the system automatically generates a multi-chart dashboard using AI recommendations from Google Gemini. The app also supports natural language queries, per-chart AI analysis, anomaly detection, and one-click executive report generation.

## Tech Stack

- **Framework:** Next.js 15.5.9 (App Router, Turbopack dev)
- **Language:** TypeScript 5
- **React:** 19.2.1
- **AI:** Google Gemini 2.5 Flash via Genkit 1.28.0
- **Charts:** Recharts 2.15.1 (22 chart types)
- **Styling:** Tailwind CSS 3.4.1 with CSS custom properties
- **UI Components:** Radix UI primitives (shadcn/ui pattern)
- **State:** Zustand (global data store), React useState/useRef/useMemo (local)
- **Data Processing:** XLSX (Excel), custom CSV parser, custom statistics engine
- **Font:** Inter (body), Space Grotesk (headlines) via next/font

## Rendering Strategy

- All pages are client-side rendered (`'use client'` directive)
- AI flows are server-side (`'use server'` directive) and called from client components
- No SSR, SSG, or ISR — the app is a single-page dashboard
- No middleware.ts exists
- No API routes exist — all backend logic lives in server actions (Genkit flows)

## Environment

- **Node:** [PLACEHOLDER: check with `node -v`]
- **Next.js:** 15.5.9
- **Deployment target:** Not configured (local development only)
- **Required env vars:** `GOOGLE_GENAI_API_KEY` (server-only, for Gemini)

AGENT NOTE: This project has no database, no authentication, no middleware, and no API routes. All data lives in client memory. The only server-side code is the 6 Genkit AI flows.

## Directory Map

Every file in `/docs/` with a one-line description:

| File | Covers |
|------|--------|
| `docs/overview.md` | This file — project index and mental model |
| `docs/how-to-update-docs.md` | Decision tree for maintaining documentation |
| `docs/architecture/rendering-strategy.md` | Why everything is CSR, no SSR/SSG |
| `docs/architecture/data-flow.md` | Full data lifecycle: upload → AI → chart → user |
| `docs/architecture/folder-structure.md` | Every folder's purpose and naming conventions |
| `docs/modules/data-upload.md` | File upload, parsing, validation, cleaning |
| `docs/modules/ai-insights.md` | AI-generated insights, key findings, predictions |
| `docs/modules/visualization-recommendations.md` | AI chart recommendation engine |
| `docs/modules/chart-rendering.md` | 22 chart types, ChartPanel, ChartRenderer |
| `docs/modules/natural-language-query.md` | NL query bar, filter execution |
| `docs/modules/chart-analysis.md` | Per-chart AI analysis dialog |
| `docs/modules/report-generation.md` | Executive report generation |
| `docs/modules/anomaly-detection.md` | Statistical anomaly detection flow |
| `docs/modules/data-profiler.md` | Data profiler overlay |
| `docs/ui/component-library.md` | Every shared UI component with props |
| `docs/ui/layout-system.md` | Root layout, sidebar, header, panels |
| `docs/ui/theming.md` | CSS variables, Tailwind config, dark mode |
| `docs/api/ai-flows.md` | All 6 Genkit server actions (the "API") |
| `docs/api/data-utilities.md` | Data processing, statistics, chart utils |
| `docs/state/client-state.md` | Zustand store, React state patterns |
| `docs/infra/environment.md` | Environment variables and configuration |
| `docs/infra/build-and-deploy.md` | Build process, next.config.ts |

## Key Architectural Decisions

1. **No SSR** — The entire dashboard is a single `'use client'` page. Data is loaded into browser memory on upload. This simplifies the architecture but means all data processing happens client-side.

2. **Server actions as AI gateway** — The 6 Genkit flows in `src/ai/flows/` are the only server-side code. They act as thin wrappers around Gemini API calls with structured Zod schemas for input/output.

3. **AI-first visualization** — Charts are not manually configured. The AI recommends up to 9 charts based on dataset metadata, and the renderer auto-detects column roles if needed.

4. **Compact AI prompts** — Data sent to AI is formatted as markdown tables (not JSON) to minimize token usage. A token budget utility truncates oversized inputs.

5. **Aggressive caching** — AI results are cached in memory with a 10-minute TTL. Metadata and stats are computed once on data load and reused everywhere.

6. **Dynamic chart loading** — Recharts (~400KB) is code-split via `next/dynamic` and loaded only when charts first render.

## Cross-Cutting Concerns

- **Auth:** None. No authentication system exists.
- **Error handling:** Each AI call is wrapped in try/catch with user-facing toast notifications. AI flow outputs are null-checked before use.
- **Data fetching:** No HTTP fetching. Data enters via file upload. AI calls use Genkit server actions.
- **Styling:** Tailwind CSS utility classes. CSS custom properties for theming. `cn()` utility for conditional class merging.
- **Validation:** `src/app/lib/data-validation.ts` validates uploaded data. Zod schemas validate AI flow inputs/outputs.

## Glossary

| Term | Meaning |
|------|---------|
| **Flow** | A Genkit server action that wraps an AI prompt with typed input/output |
| **ChartPanel** | A self-contained chart card that handles data preparation, stats, and rendering |
| **ChartRenderer** | Dynamically imported component containing all Recharts chart implementations |
| **ColumnMetadata** | Schema describing a data column: name, type, uniqueness, min/max/avg |
| **prepareChartData** | Utility that transforms raw data into chart-ready format (aggregation, slicing) |
| **NL Query** | Natural language query — user types a question, AI returns chart config |
| **Token budget** | Maximum characters allowed in an AI prompt to control costs |

## Related Docs

- [docs/how-to-update-docs.md] — Documentation maintenance rules
- [docs/architecture/data-flow.md] — Detailed data lifecycle