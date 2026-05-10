# Folder Structure

> **Scope:** Every top-level folder's purpose and naming conventions. **Rendering context:** N/A **Last updated:** 2026-05-10

## Overview

The project uses Next.js App Router structure. All source code lives in `src/`. Documentation lives in `docs/`. Temporary files live in `temp/`.

## Top-Level Folders

| Folder | Purpose |
|--------|---------|
| `src/ai/` | Genkit AI configuration and server-side flows |
| `src/app/` | Next.js App Router: pages, layouts, global styles, data utilities |
| `src/components/` | All React components (UI primitives, dashboard, charts, upload) |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Shared utilities (AI cache, prompt formatting, filtering, token budget, data store) |
| `docs/` | AI-readable documentation |
| `temp/` | Temporary files (audit reports, TODO lists) |

## `src/ai/` Structure

| File | Purpose |
|------|---------|
| `src/ai/genkit.ts` | Initializes Genkit instance with Google AI plugin and default model |
| `src/ai/dev.ts` | Development entry point for Genkit dev server |
| `src/ai/flows/schemas.ts` | Shared Zod schemas (ColumnMetadataSchema) |
| `src/ai/flows/ai-generated-data-insights.ts` | Server action: generates insights, key findings, predictions |
| `src/ai/flows/ai-powered-visualization-recommendations.ts` | Server action: recommends up to 9 chart types |
| `src/ai/flows/anomaly-detection.ts` | Server action: detects and explains anomalies |
| `src/ai/flows/natural-language-query.ts` | Server action: converts NL query to chart config |
| `src/ai/flows/per-chart-analysis.ts` | Server action: analyzes a single chart |
| `src/ai/flows/report-generation.ts` | Server action: generates executive report |
| `src/ai/flows/batch-chart-analysis.ts` | Server action: analyzes multiple charts in one call |

## `src/app/` Structure

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout: fonts, ThemeProvider, Toaster |
| `src/app/page.tsx` | Main dashboard page (the app's single page) |
| `src/app/globals.css` | Global styles and CSS custom properties |
| `src/app/lib/chart-utils.ts` | Chart data transformation, aggregation, statistics |
| `src/app/lib/data-processor.ts` | File parsing (CSV, Excel), metadata extraction |
| `src/app/lib/data-validation.ts` | Data validation and cleaning |
| `src/app/lib/sample-data.ts` | Built-in sample datasets for demo |
| `src/app/lib/statistics.ts` | Statistical functions (box plot, histogram, linear regression, forecast) |

## `src/components/` Structure

| Folder | Purpose |
|--------|---------|
| `src/components/ui/` | shadcn/ui primitives (Button, Card, Table, Badge, etc.) |
| `src/components/dashboard/` | Dashboard-specific components (ChartPanel, InsightsPanel, NLQueryBar, etc.) |
| `src/components/charts/` | Dynamically imported chart renderer |
| `src/components/upload/` | File upload component |
| `src/components/theme-provider.tsx` | next-themes wrapper |

## `src/lib/` Structure

| File | Purpose |
|------|---------|
| `src/lib/ai-cache.ts` | In-memory AI result cache with TTL |
| `src/lib/prompt-format.ts` | Converts data to compact markdown tables for AI prompts |
| `src/lib/filter-parser.ts` | Parses and applies NL query filter expressions |
| `src/lib/token-budget.ts` | Estimates and truncates prompt token counts |
| `src/lib/data-store.ts` | Zustand store for centralized data state |
| `src/lib/utils.ts` | `cn()` utility for conditional class merging |

## Naming Conventions

- **Components:** PascalCase files and exports (e.g., `ChartPanel.tsx`)
- **Utilities/hooks:** camelCase files and exports (e.g., `computeStats`, `useIsMobile`)
- **AI flows:** kebab-case files, camelCase exports (e.g., `anomaly-detection.ts` exports `detectAnomaliesAI`)
- **UI components:** kebab-case files (e.g., `alert-dialog.tsx`)
- **Types:** PascalCase (e.g., `ColumnMetadata`, `NLQueryOutput`)

## Related Docs

- [docs/overview.md] — Project index
- [docs/architecture/data-flow.md] — How data moves between these folders