# Client State Management

> **Scope:** All client-side state patterns. **Rendering context:** Client **Last updated:** 2026-05-15

## Overview

The project uses Zustand as the primary global state container for data and derived metadata, with React `useState` for local UI state in `page.tsx`. No Redux, Jotai, or React Query.

## Zustand Store — useDataStore

- **File:** `src/lib/data-store.ts`
- **Purpose:** Single source of truth for the uploaded dataset and all derived state
- **Imported by:** `src/app/page.tsx` (primary consumer)

### State Shape

| Field | Type | Description |
|-------|------|-------------|
| `data` | `any[] \| null` | The uploaded/loaded dataset |
| `fileName` | `string \| null` | Name of the uploaded file |
| `metadata` | `ColumnMetadata[] \| null` | Per-column type metadata (computed by `extractMetadata`) |
| `metadataJson` | `string \| null` | JSON string of metadata for AI prompt injection |
| `columnStats` | `Record<string, ColumnStats> \| null` | Numeric stats per column |
| `validationWarnings` | `string[]` | Warnings from `validateData()` |

### Actions

| Action | Behavior |
|--------|----------|
| `setData(data, fileName, metadata, metadataJson, columnStats, validationWarnings)` | Sets all fields atomically |
| `loadAnalysisData(analysis)` | Pre-populates store from a saved analysis (load path) |
| `clearData()` | Resets all fields + clears AI cache |
| `getColumnStats(column)` | Returns stats for a specific column |

### Usage Pattern in page.tsx

```ts
const { data, fileName, metadata, metadataJson, columnStats, validationWarnings } = useDataStore();
const storeSetData = useDataStore(s => s.setData);
const storeClearData = useDataStore(s => s.clearData);
const storeLoadAnalysis = useDataStore(s => s.loadAnalysisData);
```

## Toast Store — useToast

- **File:** `src/hooks/use-toast.ts`
- **Pattern:** Module-level state (not Zustand) with external store pattern
- **State:** Array of toast objects with id, title, description, action
- **Actions:** `toast(props)`, `dismiss(id)`
- **Used by:** All error/success notifications throughout the app

## Local State in page.tsx

After the Zustand migration, `page.tsx` uses `useState` only for UI-level state (not dataset state):

| State | Type | Purpose |
|-------|------|---------|
| `isProcessing` | `boolean` | True while AI recommendations are loading |
| `isGeneratingInsights` | `boolean` | True while insights are loading |
| `recommendations` | `RecommendVisualizationsOutput \| null` | AI chart recommendations |
| `insights` | `AiGeneratedDataInsightsOutput \| null` | AI insights results |
| `groundingEnabled` | `boolean` | Whether to use Gemini Google Search grounding |
| `chartAnalysisOpen` | `boolean` | Per-chart analysis dialog visibility |
| `nlQueryChart` | `NLQueryOutput \| null` | NL query result chart config |
| `reportOpen` | `boolean` | Report dialog visibility |
| `showAnomalies` | `boolean` | Anomaly panel visibility |
| `anomalyResult` | `AnomalyDetectionOutput \| null` | AI anomaly explanation result |
| `batchOpen` | `boolean` | Batch analysis dialog visibility |
| `batchResult` | `BatchChartAnalysisOutput \| null` | Batch analysis result |
| `authChecked` | `boolean` | Whether auth state has been checked |
| `authenticated` | `boolean` | Whether user has authenticated |
| `authGateEnabled` | `boolean` | Whether `DATASENSE_API_TOKEN` is set |
| `mobileNavOpen` | `boolean` | Mobile sidebar Sheet open state |
| `mobileInsightsOpen` | `boolean` | Mobile insights Sheet open state |
| `resetConfirmOpen` | `boolean` | "New Dataset" confirm AlertDialog |
| `warningsExpanded` | `boolean` | Validation warnings expander |

## Stable Memoized Computations

| Memo | Purpose |
|------|---------|
| `preparedCharts` | Stable config objects per chart recommendation — prevents `ChartPanel` from re-running `prepareChartData` on every parent render |
| `nlQueryFilteredData` | Data filtered by NL query filter expression |

## Hooks

### useIsMobile
- **File:** `src/hooks/use-mobile.tsx`
- **Returns:** `boolean` — true if viewport < 768px
- **Pattern:** `matchMedia` listener with cleanup

## Related Docs

- [docs/architecture/data-flow.md] — Where state is created and consumed
- [docs/api/data-utilities.md] — Data processing that populates state
