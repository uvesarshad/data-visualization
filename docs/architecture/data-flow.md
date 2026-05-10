# Data Flow

> **Scope:** How data enters, transforms, and exits the system. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

Data enters the system via file upload, is parsed and validated client-side, then processed by AI flows on the server. The full lifecycle is: file upload → parse → validate → clean → extract metadata → AI recommendation → chart rendering → user interaction.

## Stage 1: File Upload

**Entry point:** `src/components/upload/DataUploader.tsx`
- User drops or selects a CSV, JSON, or Excel file
- `DataUploader.handleFile()` dispatches to the correct parser
- CSV files: `parseCSV()` from `src/app/lib/data-processor.ts`
- Excel files: `parseExcel()` (dynamic `await import('xlsx')`) from `src/app/lib/data-processor.ts`
- JSON files: `JSON.parse()` inline

## Stage 2: Validation and Cleaning

**Entry point:** `src/app/page.tsx` → `handleDataLoaded()`
- `cleanData()` from `src/app/lib/data-validation.ts` removes empty rows, trims strings
- `validateData()` from `src/app/lib/data-validation.ts` checks column count, row count, data types
- Validation warnings stored in state and displayed in UI

## Stage 3: Metadata Extraction

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
| File → Client | `DataUploader` | Raw text/Buffer → `any[]` |
| Client → Server (AI) | `src/app/page.tsx` | `dataToCompactTable()` → markdown table string |
| Server → Client (AI) | All flows | Zod-validated JSON objects |

AGENT NOTE: Data is never persisted. All state lives in React component state and is lost on page refresh.

## Related Docs

- [docs/architecture/rendering-strategy.md] — Why everything is CSR
- [docs/api/ai-flows.md] — Server action details
- [docs/api/data-utilities.md] — Data processing utilities