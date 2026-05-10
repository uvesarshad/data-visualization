# Natural Language Query Module

> **Scope:** NL query bar, filter execution. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

Users type natural language questions about their data and get instant chart visualizations. The AI interprets the query and returns a chart configuration. Filters are parsed and applied client-side.

## Entry Points

- **UI Component:** `src/components/dashboard/NLQueryBar.tsx`
- **Server Action:** `src/ai/flows/natural-language-query.ts`
- **Filter Parser:** `src/lib/filter-parser.ts`
- **Trigger:** `src/app/page.tsx` → `handleNLQuery()`

## Server Action: naturalLanguageQuery

- **Flow name:** `nlQueryFlow`
- **Input:** `{ query: string, columnMetadata: string (JSON), rowCount: number }`
- **Output:** `{ chartType, title, xAxis, yAxis, extraSeries?, explanation, filter? }`
- **Model:** googleai/gemini-2.5-flash

## Key Components

### NLQueryBar
- **Path:** `src/components/dashboard/NLQueryBar.tsx`
- **Purpose:** Text input with suggestion dropdown, submit button, result feedback badge
- **Props:** `onSubmit(query)`, `isLoading`, `result?`, `onClearResult?`
- **Client-side:** Yes
- **AGENT NOTE:** Requires explicit button click to submit. No debounce needed — not auto-triggered on keystroke.

## Filter Execution

When the AI returns a `filter` field (e.g., "region = West"), the filter parser applies it:
- `src/lib/filter-parser.ts` → `parseFilterExpression()` parses operators: =, !=, >, <, >=, <=, contains, not_contains
- `applyFilter()` filters the data array
- Filtered data passed to ChartPanel instead of full dataset
- Active filter shown as a badge in the page header with clear button

AGENT NOTE: The filter field from the AI is a free-text string. The parser uses regex matching. If the AI returns an unparseable filter, it is silently ignored.

## Related Docs

- [docs/modules/chart-rendering.md] — How NL query results become charts
- [docs/api/ai-flows.md] — Flow implementation
