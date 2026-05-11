# DataSense — Project Overview

> **Scope:** Single entry point for all AI agents working on this codebase. **Rendering context:** Client (primary), Server (AI flows) **Last updated:** 2026-05-11

## Overview

DataSense is an AI-powered data visualization dashboard built with Next.js App Router. Users upload CSV, JSON, or Excel files — or fetch them directly from public URLs — and the system automatically generates a multi-chart dashboard using AI recommendations from Google Gemini. The app also supports persistence of analyses, natural language queries, per-chart AI analysis, anomaly detection, and one-click executive report generation.

## Tech Stack

- **Framework:** Next.js 15.5.9 (App Router, Turbopack dev)
- **Language:** TypeScript 5
- **React:** 19.2.1
- **AI:** Google Gemini 2.5 Flash via Genkit 1.28.0
- **Database:** PostgreSQL (system-installed, local)
- **Backend:** Node.js/Express (Port 3008)
- **Charts:** Recharts 2.15.1 (22 chart types)
- **Styling:** Tailwind CSS 3.4.1 with CSS custom properties
- **UI Components:** Radix UI primitives (shadcn/ui pattern)
- **State:** Zustand (global data store), React useState/useRef/useMemo (local)
- **Data Processing:** XLSX (Excel with auto-sheet detection), custom robust CSV parser, custom statistics engine with iterative processing
- **Persistence:** Analysis saving/loading via PostgreSQL (backend) and local SQLite (development)
- **Font:** Inter (body), Space Grotesk (headlines) via next/font

## Rendering Strategy

- All pages are client-side rendered (`'use client'` directive)
- AI flows are server-side (`'use server'` directive) and called from client components
- Backend logic for data persistence and advanced processing lives in the port 3008 server
- No middleware.ts exists

## Environment

- **Node:** v24.12.0
- **Next.js:** 15.5.9
- **Deployment target:** Local development (not configured)
- **Required env vars:** `GOOGLE_GENAI_API_KEY` (Gemini), `DATABASE_URL` (PostgreSQL), `BACKEND_URL` (Port 3008)

AGENT NOTE: This project uses a system-installed PostgreSQL database for persistence. The backend server on port 3008 handles database interactions and data storage.

## Directory Map

Every file in `/docs/` with a one-line description:

| File | Covers |
|------|--------|
| `docs/overview.md` | This file — project index and mental model |
| `docs/how-to-update-docs.md` | Decision tree for maintaining documentation |
| `docs/architecture/rendering-strategy.md` | Hybrid architecture: CSR UI + Backend Persistence |
| `docs/architecture/data-flow.md` | Full data lifecycle: upload → DB → AI → chart |
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
| `docs/api/ai-flows.md` | All 7 Genkit server actions (the "API") |
| `docs/api/data-utilities.md` | Data processing, statistics, chart utils |
| `docs/state/client-state.md` | Zustand store, React state patterns |
| `docs/infra/environment.md` | Environment variables and configuration |
| `docs/infra/build-and-deploy.md` | Build process, next.config.ts |

## Key Architectural Decisions

1. **Client-Server Architecture** — While the UI is a single-page dashboard, data is now persisted in a PostgreSQL database via a dedicated backend server. This allows for persistent datasets across sessions.

2. **Server actions as AI gateway** — The 7 Genkit flows in `src/ai/flows/` remain the primary AI interface, while the backend server handles structured data storage.

3. **AI-first visualization** — Charts are not manually configured. The AI recommends up to 9 charts based on dataset metadata, and the renderer auto-detects column roles if needed.

4. **Compact AI prompts** — Data sent to AI is formatted as markdown tables (not JSON) to minimize token usage. A token budget utility truncates oversized inputs.

5. **Aggressive caching** — AI results are cached in memory with a 10-minute TTL. Metadata and stats are computed once on data load and reused everywhere.

6. **Dynamic chart loading** — Recharts (~400KB) is code-split via `next/dynamic` and loaded only when charts first render.

## Cross-Cutting Concerns

- **Auth:** None. No authentication system exists.
- **Error handling:** Each AI call is wrapped in try/catch with user-facing toast notifications. AI flow outputs are null-checked before use.
- **Data fetching:** Data is uploaded via the UI and persisted to the PostgreSQL database via the backend server.
- **Styling:** Tailwind CSS utility classes. CSS custom properties for theming. `cn()` utility for conditional class merging.
- **Validation:** `src/app/lib/data-validation.ts` validates uploaded data. Zod schemas validate AI flow inputs/outputs.
- **Persistence:** Full CRUD for analyses (saving metadata, insights, and charts) is available via `/api/analyses`.

## Glossary

| Term | Meaning |
|------|---------|
| **Flow** | A Genkit server action that wraps an AI prompt with typed input/output |
| **ChartPanel** | A self-contained chart card that handles data preparation, stats, and rendering |
| **ChartRenderer** | Dynamically imported component containing all Recharts chart implementations |
| **ColumnMetadata** | Schema describing a data column: name, type, uniqueness, min/max/avg |
| **prepareChartData** | Utility that transforms raw data into chart-ready format (aggregation, slicing) |
| **NL Query** | Natural language query — user types a question, AI returns chart config |
| **Persistence** | The layer that saves analysis state (metadata, insights, charts) to the database |
| **Token budget** | Maximum characters allowed in an AI prompt to control costs |
| **URL Fetch** | Ability to import data directly from a public URL (CSV, JSON, Excel) |

## Related Docs

- [docs/how-to-update-docs.md] — Documentation maintenance rules
- [docs/architecture/data-flow.md] — Detailed data lifecycle