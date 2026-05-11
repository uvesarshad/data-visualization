# Data Upload Module

> **Scope:** File upload, URL fetching, parsing, validation, and cleaning. **Rendering context:** Client **Last updated:** 2026-05-11

## Overview

Users upload CSV, JSON, or Excel files via a drag-and-drop interface or by providing a public URL. Data is fetched and parsed client-side, validated, cleaned, and loaded into memory. This module ensures high-quality data enters the visualization pipeline.

## Entry Points

- **Component:** `src/components/upload/DataUploader.tsx`
- **Trigger:** `src/app/page.tsx` → `handleDataLoaded()` callback

## Key Components

### DataUploader
- **Path:** `src/components/upload/DataUploader.tsx`
- **Purpose:** Drag-and-drop file upload with sample dataset selection
- **Props:** `onDataLoaded(data, fileName)`, `isLoading`
- **Client-side:** Yes
- **Behavior:** Accepts `.csv`, `.json`, `.xlsx`, `.xls` files. Supports drag-and-drop, file browsing, and URL fetching. Dynamically imports parsers. Also provides built-in sample datasets.
- **URL Fetching:** Uses the browser `fetch` API to retrieve datasets from public endpoints. Detects format via `Content-Type` headers or file extensions.

## Key Utilities

### parseCSV
- **Path:** `src/app/lib/data-processor.ts`
- **Purpose:** Robust CSV parser handling quoted fields, escaped quotes, commas in quotes
- **Client-side:** Yes

### parseExcel
- **Path:** `src/app/lib/data-processor.ts`
- **Purpose:** Parses Excel files using dynamically imported XLSX library
- **Capabilities:** Automatically detects the "best" sheet (heuristic based on row/column density) and identifies the header row by scanning the first 20 rows.
- **Client-side:** Yes
- **AGENT NOTE:** XLSX is dynamically imported to keep it out of the initial bundle (~300KB)

### cleanData
- **Path:** `src/app/lib/data-validation.ts`
- **Purpose:** Removes empty rows, trims whitespace from string values
- **Options:** `removeEmptyRows`, `trimStrings`

### validateData
- **Path:** `src/app/lib/data-validation.ts`
- **Purpose:** Checks column count, row count, data types; returns warnings array
- **Output:** `{ valid: boolean, warnings: string[] }`

## External Services

None. All parsing is client-side.

## State Management

- Uploaded data stored in `src/app/page.tsx` via `useState`
- Also available in Zustand store (`src/lib/data-store.ts`) via `setData()`
- Metadata cached in `useRef` after extraction

## Edge Cases

- AGENT NOTE: `parseCSV` handles quoted fields containing commas and escaped quotes. It now uses a robust state-machine parser.
- AGENT NOTE: `parseExcel` handles multi-sheet files by selecting the most populated sheet automatically.
- AGENT NOTE: `extractMetadata` uses iterative min/max calculations to prevent stack overflow on large datasets (100k+ rows).
- Files with fewer than 2 rows trigger an edge case guard that skips AI analysis.

## Related Docs

- [docs/architecture/data-flow.md] — Stage 1 and 2 of data lifecycle
- [docs/api/data-utilities.md] — Parser and validation implementation details