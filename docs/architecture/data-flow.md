# Data Flow

> **Scope:** How data enters, transforms, and exits the system. **Rendering context:** Client + Server **Last updated:** 2026-05-15

## Overview

Data enters the system via file upload or public URL, is parsed off the main thread in a Web Worker, validated and cleaned, then processed by AI flows on the server. The full lifecycle is:

**upload/fetch → Worker parse → validate/clean → Zustand store → AI recommendation → chart rendering**

## Stage 1: File Upload / URL Fetch

**Entry point:** `src/components/upload/DataUploader.tsx`

- User drops/selects a CSV, JSON, or Excel file — or provides a public HTTPS URL
- **Size guard:** Files >50 MB are rejected with a descriptive error before any parsing
- **URL validation:** `validateImportUrl()` enforces `https:` only; blocks loopback and RFC-1918 ranges
- **Safe JSON parse:** `safeParseJSON()` strips `__proto__`/`prototype`/`constructor` keys via a reviver function and unwraps common wrapper shapes (`{data:[...]}`, `{results:[...]}`, `{items:[...]}`)

## Stage 2: Off-thread Parsing

**Workers:** `src/lib/data-worker.ts` + `src/lib/data-worker-client.ts`

- CSV and Excel files are sent to a Web Worker via `parseCSVAsync()` / `parseExcelAsync()`
- The worker calls `parseCSV()` / `parseExcel()` from `src/app/lib/data-processor.ts`
- If the worker fails to spawn (bundler quirk, older runtime), parsing falls back to the main thread transparently
- Row objects use `Object.create(null)` to prevent prototype pollution

## Stage 3: Validation and Cleaning

**Entry point:** `src/app/page.tsx` → `handleDataLoaded()`

- `cleanData()` removes empty rows, trims strings
- `validateData()` checks column count, row count, data types; returns warnings array
- `setIsProcessing(true)` is set **before** `storeSetData()` to prevent skeleton flash

## Stage 4: Zustand Store + Metadata

**Entry point:** `src/lib/data-store.ts` → `setData()`

- `extractMetadata(data)` iterates all columns using the shared `detectColumnType()` helper (200-sample, 70% threshold)
- Result stored as both `ColumnMetadata[]` and JSON string in the Zustand store
- `columnStats` computed once and stored; downstream components read from the store

## Stage 5: AI Recommendation (Server)

**Boundary:** Client calls server action `recommendVisualizations()`

- Input: column metadata, row count, optional dataset description
- Output: up to 9 chart recommendations (type, title, explanation, columnsUsed)
- All user-controlled strings sanitized by `sanitizeForPrompt()` before entering the prompt
- Results cached for 10 minutes in `src/lib/ai-cache.ts`

## Stage 6: Chart Rendering

**Entry point:** `src/app/page.tsx` → chart grid

- `prepareChartData()` from `src/app/lib/chart-utils.ts` transforms data per chart type (aggregation, slicing, filtering)
- `ChartPanel` handles data preparation, stats, and rendering
- `ChartRenderer` (dynamically imported) renders the actual Recharts chart
- Stable config objects (`preparedCharts`) are memoized in `page.tsx` to prevent unnecessary re-renders

## Stage 7: User Interaction

Users can:
- **Analyze a chart:** Calls `perChartAnalysis()` → shows dialog
- **Batch analyze:** Calls `batchChartAnalysis()` with up to 9 charts in one API call → `BatchAnalysisDialog`
- **Ask a question:** Calls `naturalLanguageQuery()` → renders new chart. Output column names are post-validated against metadata; one corrective retry if invalid.
- **Detect anomalies:** IQR-based client-side detection → `AnomalyPanel`; optional "Explain with AI" calls `detectAnomaliesAI()`
- **Generate report:** Calls `generateReport()` → shows report dialog; POSTs result to `/api/analyses/[id]/reports`
- **Export data:** Generates CSV client-side and triggers download

## Stage 8: Persistence

**Entry point:** `src/app/page.tsx` → `handleSaveAnalysis()`

- POST to `/api/analyses` → gated by `middleware.ts` auth check
- Payload serialized as JSON; if >100 MB, API returns HTTP 413 with descriptive message
- Data stored in `data/datasense.db` (better-sqlite3, WAL mode)
- Previous analyses accessible via `PreviousAnalyses` component with pagination (24/page)

## Data Boundaries (Serialization Points)

| Boundary | Location | Format |
|----------|----------|--------|
| File/URL → Worker | `DataUploader` | Raw text/ArrayBuffer |
| Worker → Client | `data-worker-client.ts` | `any[]` via postMessage |
| Client → Zustand | `data-store.ts` | `any[]` + computed `ColumnMetadata[]` |
| Client → Database | `src/app/api/analyses` | `JSON.stringify` → SQLite TEXT |
| Client → Server (AI) | `src/app/page.tsx` | `sanitizeForPrompt(JSON.stringify(...))` → string |
| Server → Client (AI) | All flows | Zod-validated JSON objects |

## Related Docs

- [docs/architecture/rendering-strategy.md] — Why everything is CSR + API routes
- [docs/api/ai-flows.md] — Server action details
- [docs/api/data-utilities.md] — Data processing utilities
