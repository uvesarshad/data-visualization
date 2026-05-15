# Folder Structure

> **Scope:** Every top-level folder's purpose and naming conventions. **Rendering context:** N/A **Last updated:** 2026-05-15

## Overview

All frontend and backend source code lives in `src/`. Documentation lives in `docs/`. Temporary files (audit reports, task lists) live in `temp/` (gitignored). There is no external backend server — persistence is handled by better-sqlite3 via Next.js API routes.

## Top-Level Folders

| Folder | Purpose |
|--------|---------|
| `src/ai/` | Genkit AI configuration and server-side flows |
| `src/app/` | Next.js App Router: pages, API routes, layouts, global styles, data utilities |
| `src/components/` | All React components (UI primitives, dashboard, charts, upload, auth) |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Shared utilities (AI cache, filter parser, data store, worker client, prompt sanitizer, math helpers) |
| `docs/` | AI-readable documentation |
| `temp/` | Temporary files — gitignored |
| `data/` | SQLite database file (`datasense.db`) — gitignored |

## `src/ai/` Structure

| File | Purpose |
|------|---------|
| `src/ai/genkit.ts` | Initializes Genkit instance with Google AI plugin and default model |
| `src/ai/dev.ts` | Development entry point — registers all 7 flows for the Genkit dev server |
| `src/ai/flows/schemas.ts` | Shared Zod schemas (`ColumnMetadataSchema`) |
| `src/ai/flows/chart-types.ts` | Single source of truth: `CHART_TYPES` const array (22 types), `ChartType` union, `ChartTypeSchema` |
| `src/ai/flows/ai-generated-data-insights.ts` | Server action: insights, key findings, predictions (optional Google Search grounding) |
| `src/ai/flows/ai-powered-visualization-recommendations.ts` | Server action: recommends up to 9 chart types |
| `src/ai/flows/anomaly-detection.ts` | Server action: explains pre-detected IQR anomalies with severity and business context |
| `src/ai/flows/natural-language-query.ts` | Server action: NL query → chart config; post-validates column names |
| `src/ai/flows/per-chart-analysis.ts` | Server action: analyzes a single chart with type-specific focus |
| `src/ai/flows/report-generation.ts` | Server action: generates executive report (sections, keyMetrics, actionItems) |
| `src/ai/flows/batch-chart-analysis.ts` | Server action: analyzes up to 9 charts in one call with cross-chart insights |

## `src/app/` Structure

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout: fonts, ThemeProvider, Toaster |
| `src/app/page.tsx` | Main dashboard page (the app's single page) |
| `src/app/globals.css` | Global styles and CSS custom properties |
| `src/app/lib/chart-utils.ts` | Chart data transformation, aggregation (`aggregateMultipleByCategory`), auto-detect |
| `src/app/lib/chart-utils.test.ts` | Vitest tests for chart utilities |
| `src/app/lib/data-processor.ts` | File parsing (CSV, Excel), `detectColumnType`, `extractMetadata` |
| `src/app/lib/data-processor.test.ts` | Vitest tests for data processor |
| `src/app/lib/data-validation.ts` | Data validation, cleaning, profiling |
| `src/app/lib/sample-data.ts` | Built-in sample datasets for demo |
| `src/app/lib/statistics.ts` | Statistical functions: box plot, histogram, regression, `forecastTimeAware`, `parseTimestamp` |
| `src/app/api/analyses/route.ts` | `GET` (list with pagination) / `POST` (save analysis) |
| `src/app/api/analyses/[id]/route.ts` | `GET` (load) / `DELETE` (delete) single analysis |
| `src/app/api/analyses/[id]/reports/route.ts` | `GET` / `POST` saved reports for an analysis |
| `src/app/api/auth/login/route.ts` | `POST` — validates token, sets `ds_auth` HttpOnly cookie |
| `src/app/api/auth/logout/route.ts` | `POST` — clears `ds_auth` cookie |
| `src/app/api/auth/me/route.ts` | `GET` — returns `{ authenticated, gateEnabled }` |

## `src/components/` Structure

| Folder/File | Purpose |
|------------|---------|
| `src/components/ui/` | shadcn/ui primitives (Button, Card, Table, Badge, AlertDialog, Sheet, etc.) |
| `src/components/dashboard/AnomalyPanel.tsx` | IQR anomaly panel with "Explain with AI" → `detectAnomaliesAI` |
| `src/components/dashboard/BatchAnalysisDialog.tsx` | Dialog for batch chart analysis via `batchChartAnalysis` |
| `src/components/dashboard/ChartPanel.tsx` | Self-contained chart card with data prep, stats, per-chart AI trigger |
| `src/components/dashboard/DataProfiler.tsx` | Data profiler overlay with close button |
| `src/components/dashboard/NLQueryBar.tsx` | Natural language query input with Cmd/Ctrl+K shortcut, data-aware suggestions |
| `src/components/dashboard/PIIConsentBanner.tsx` | Sticky consent banner; localStorage ack; env-var bypass |
| `src/components/dashboard/PreviousAnalyses.tsx` | Saved analyses list with pagination, AlertDialog confirm, keyboard nav |
| `src/components/dashboard/StatsOverview.tsx` | Key stats cards with temporal-aware trend badges |
| `src/components/charts/ChartRenderer.tsx` | All 22 Recharts chart implementations + native SVG `BoxPlotSVG` |
| `src/components/upload/DataUploader.tsx` | Drag-drop upload, URL fetch, sample datasets, size/URL validation |
| `src/components/auth/LoginDialog.tsx` | Modal token entry; blocks UI until authenticated when gate is enabled |
| `src/components/theme-provider.tsx` | next-themes wrapper |

## `src/lib/` Structure

| File | Purpose |
|------|---------|
| `src/lib/ai-cache.ts` | In-memory AI result cache (10-min TTL, collision-safe key) |
| `src/lib/data-store.ts` | Zustand store: `data`, `fileName`, `metadata`, `columnStats`, `validationWarnings` |
| `src/lib/data-worker.ts` | Web Worker — off-thread CSV/Excel parsing |
| `src/lib/data-worker-client.ts` | Worker client — lazy init, message tracking, main-thread fallback |
| `src/lib/database.ts` | better-sqlite3 CRUD (analyses, reports), `PayloadTooLargeError`, count cache |
| `src/lib/filter-parser.ts` | Parses and applies NL query filter expressions |
| `src/lib/filter-parser.test.ts` | Vitest tests for filter parser |
| `src/lib/math-iter.ts` | `iterMin`, `iterMax`, `iterMinMax` — safe for 100k+ element arrays |
| `src/lib/prompt-sanitize.ts` | Input sanitizer + `PROMPT_GUARDRAIL` constant |
| `src/lib/utils.ts` | `cn()` utility for conditional class merging |

## `src/middleware.ts`

Auth gate for `/api/analyses/:path*`. Validates `ds_auth` cookie or `Authorization: Bearer` header against `DATASENSE_API_TOKEN`. Disabled when env var is unset.

## Test Files

| File | Tests |
|------|-------|
| `src/lib/filter-parser.test.ts` | 14 tests: parse operators, quote styles, apply/filter functions |
| `src/app/lib/chart-utils.test.ts` | 12 tests: aggregation, prepareChartData per type, autoDetect |
| `src/app/lib/data-processor.test.ts` | 15 tests: parseCSV edge cases, detectColumnType, extractMetadata |

Run with `npm run test` (Vitest, configured in `vitest.config.ts`).

## Naming Conventions

- **Components:** PascalCase files and exports (e.g., `ChartPanel.tsx`)
- **Utilities/hooks:** camelCase files and exports (e.g., `filterData`, `useIsMobile`)
- **AI flows:** kebab-case files, camelCase exports (e.g., `anomaly-detection.ts` exports `detectAnomaliesAI`)
- **UI components:** kebab-case files (e.g., `alert-dialog.tsx`)
- **Types:** PascalCase (e.g., `ColumnMetadata`, `NLQueryOutput`)

## Related Docs

- [docs/overview.md] — Project index
- [docs/architecture/data-flow.md] — How data moves between these folders
