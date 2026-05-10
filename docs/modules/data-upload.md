# Data Upload Module

> **Scope:** File upload, parsing, validation, and cleaning. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

Users upload CSV, JSON, or Excel files via a drag-and-drop interface. Files are parsed client-side, validated, cleaned, and loaded into memory. No data is sent to the server during upload.

## Entry Points

- **Component:** `src/components/upload/DataUploader.tsx`
- **Trigger:** `src/app/page.tsx` → `handleDataLoaded()` callback

## Key Components

### DataUploader
- **Path:** `src/components/upload/DataUploader.tsx`
- **Purpose:** Drag-and-drop file upload with sample dataset selection
- **Props:** `onDataLoaded(data, fileName)`, `isLoading`
- **Client-side:** Yes
- **Behavior:** Accepts `.csv`, `.json`, `.xlsx`, `.xls` files. Dynamically imports parsers. Also provides 3 built-in sample datasets.

## Key Utilities

### parseCSV
- **Path:** `src/app/lib/data-processor.ts`
- **Purpose:** Robust CSV parser handling quoted fields, escaped quotes, commas in quotes
- **Client-side:** Yes

### parseExcel
- **Path:** `src/app/lib/data-processor.ts`
- **Purpose:** Parses Excel files using dynamically imported XLSX library
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

- AGENT NOTE: `parseCSV` handles quoted fields containing commas and escaped quotes. It does NOT handle multi-line quoted fields.
- AGENT NOTE: `parseExcel` returns a Promise — callers must `await` it.
- Files with fewer than 2 rows trigger an edge case guard that skips AI analysis.

## Related Docs

- [docs/architecture/data-flow.md] — Stage 1 and 2 of data lifecycle
- [docs/api/data-utilities.md] — Parser and validation implementation details