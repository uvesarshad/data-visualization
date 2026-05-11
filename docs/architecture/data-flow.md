# Data Flow

> **Scope:** How data enters, transforms, and exits the system. **Rendering context:** Client + Server **Last updated:** 2026-05-11

## Overview

Data enters the system via file upload or public URL, is parsed and validated client-side, then processed by AI flows on the server. The full lifecycle is: upload/fetch → parse → validate → clean → persist → extract metadata → AI recommendation → chart rendering.

## Stage 1: File Upload

**Entry point:** `src/components/upload/DataUploader.tsx`
- User drops or selects a CSV, JSON, or Excel file — or provides a public URL
- `DataUploader.handleFile()` or `handleUrlSubmit()` dispatches to the correct parser
- CSV files: `parseCSV()` (robust state-machine) from `src/app/lib/data-processor.ts`
- Excel files: `parseExcel()` (dynamic `await import('xlsx')` with auto-sheet detection) from `src/app/lib/data-processor.ts`
- JSON files: `JSON.parse()` inline

## Stage 2: Validation and Cleaning

**Entry point:** `src/app/page.tsx` → `handleDataLoaded()`
- `cleanData()` from `src/app/lib/data-validation.ts` removes empty rows, trims strings
- `validateData()` from `src/app/lib/data-validation.ts` checks column count, row count, data types
- Validation warnings stored in state and displayed in UI

## Stage 3: Data Persistence

**Entry point:** `src/app/page.tsx` → `handleSaveAnalysis()`
- Analyses (data, metadata, insights, charts) can be persisted to the database
- Backend handles storage in PostgreSQL (via port 3008) or SQLite (development)
- History is accessible via the "Previous Analyses" dashboard on the landing page

## Stage 4: Metadata Extraction

**Entry point:** `src/app/lib/data-processor.ts` → `extractMetadata()`
- Iterates all columns, determines type (number/date/boolean/string)
- Computes: uniqueValuesCount, min, max, avg, exampleValues
- Result cached in `useRef` as both `ColumnMetadata[]` and JSON string
- AGENT SEE: `docs/api/data-utilities.md` for ColumnMetadata schema

## Stage 4: AI Recommendation (Server)

**Boundary:** Client calls server action `recommendVisualizations()`
- Input: column metadata, row count, dataset description
- Output: up to 9 chart recommendations (type, title, explanation, columnsUsed)
- AGENT SEE: `docs/api/ai-flows.md` for full flow details

## Stage 5: Chart Rendering

**Entry point:** `src/app/page.tsx` → chart grid
- `prepareChartData()` from `src/app/lib/chart-utils.ts` transforms data per chart type
- `ChartPanel` component handles data preparation, stats, and rendering
- `ChartRenderer` (dynamically imported) renders the actual Recharts chart

## Stage 6: User Interaction

Users can:
- **Analyze a chart:** Calls `perChartAnalysis()` server action → shows dialog
- **Ask a question:** Calls `naturalLanguageQuery()` → renders new chart with optional filter
- **Generate report:** Calls `generateReport()` → shows report dialog
- **Export data:** Generates CSV client-side and triggers download

## Data Boundaries (Serialization Points)

| Boundary | Location | Format |
|----------|----------|--------|
| File/URL → Client | `DataUploader` | Raw text/Buffer → `any[]` |
| Client → Database | `src/app/api/analyses` | `JSON.stringify` → Database Record |
| Client → Server (AI) | `src/app/page.tsx` | `dataToCompactTable()` → markdown table string |
| Server → Client (AI) | All flows | Zod-validated JSON objects |

AGENT NOTE: Data is persisted in PostgreSQL. Ensure the backend server on port 3008 is running to allow data storage and retrieval.

## Related Docs

- [docs/architecture/rendering-strategy.md] — Why everything is CSR
- [docs/api/ai-flows.md] — Server action details
- [docs/api/data-utilities.md] — Data processing utilities