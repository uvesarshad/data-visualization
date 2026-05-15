# Data Upload Module

> **Scope:** File upload, URL fetching, Web Worker parsing, validation, and cleaning. **Rendering context:** Client **Last updated:** 2026-05-15

## Overview

Users upload CSV, JSON, or Excel files via a drag-and-drop interface or by providing a public HTTPS URL. Parsing runs in a Web Worker to keep the UI responsive. Data is validated, cleaned, and loaded into the Zustand store. This module is the first security boundary for untrusted content.

## Entry Points

- **Component:** `src/components/upload/DataUploader.tsx`
- **Callback:** `src/app/page.tsx` → `handleDataLoaded(data, fileName)`

## Key Components

### DataUploader

- **Path:** `src/components/upload/DataUploader.tsx`
- **Props:** `onDataLoaded(data, fileName)`, `isLoading`
- **Accepts:** `.csv`, `.json`, `.xlsx`, `.xls` via drag-drop, file browser, or URL input
- **Sample datasets:** Built-in sample datasets selectable from an expandable panel

## File Size Guard

- **Limit:** 50 MB for both file uploads and URL fetches (`MAX_UPLOAD_BYTES` / `MAX_FETCH_BYTES`)
- Files exceeding the limit are rejected **before parsing** with a descriptive error: `"File is X MB; the upload limit is 50 MB."`
- URL fetches check the `Content-Length` response header as a pre-check (when available)

## URL Validation

`validateImportUrl(input)` enforces before any fetch:
- Only `https://` URLs are allowed (no `http://`, `ftp://`, `file://`, etc.)
- Blocks loopback hosts: `localhost`, `0.0.0.0`, `::1`, `*.local`, `127.x.x.x`
- Blocks RFC-1918 / link-local ranges: `10.x`, `192.168.x`, `172.16–31.x`, `169.254.x`

## Parsing Pipeline

### CSV
1. `DataUploader` reads file as text
2. Sends to `parseCSVAsync()` in `src/lib/data-worker-client.ts`
3. Worker calls `parseCSV()` from `src/app/lib/data-processor.ts`
4. Falls back to main-thread `parseCSV()` if worker fails to spawn

### Excel
1. `DataUploader` reads file as `ArrayBuffer`
2. Sends to `parseExcelAsync()` in `src/lib/data-worker-client.ts`
3. Worker calls `parseExcel()` (dynamic `await import('xlsx')`) from `src/app/lib/data-processor.ts`
4. Falls back to main-thread `parseExcel()` if worker fails to spawn

### JSON
1. Parsed inline using `safeParseJSON()`:
   - Strips `__proto__`/`prototype`/`constructor` keys via a JSON reviver function
   - Unwraps common wrapper shapes: `{data:[...]}`, `{results:[...]}`, `{items:[...]}`
   - Returns the array directly or throws if result is not an array

## Prototype Pollution Protections

All parsers use `Object.create(null)` for row objects so there is no `Object.prototype` chain to poison.

`parseCSV` additionally strips headers whose name is `__proto__`, `prototype`, or `constructor`.

## Validation and Cleaning

After parsing, `page.tsx → handleDataLoaded()` calls:
- `cleanData()` — removes empty rows, trims string values
- `validateData()` — checks column count, row count, data types; returns `warnings[]`

Warnings are displayed in the dashboard with a "Show N more" expander.

## State Flow

```
Upload/URL → parseCSVAsync() / parseExcelAsync() / safeParseJSON()
           → cleanData() + validateData()
           → storeSetData(data, fileName, ...)   ← Zustand store
           → recommendVisualizations(metadata)   ← AI server action
```

## Related Docs

- [docs/architecture/data-flow.md] — Full data lifecycle stages
- [docs/api/data-utilities.md] — parseCSV, parseExcel, detectColumnType, cleanData, validateData
