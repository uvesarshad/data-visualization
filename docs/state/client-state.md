# Client State Management

> **Scope:** All client-side state patterns. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

The project uses a mix of Zustand (global store) and React hooks (local state). No Redux, Jotai, or React Query.

## Zustand Store

### useDataStore
- **File:** `src/lib/data-store.ts`
- **Purpose:** Centralized data state with computed metadata and stats
- **State:** `data`, `fileName`, `metadata`, `metadataJson`, `columnStats`, `validationWarnings`
- **Actions:** `setData()` (computes metadata + stats), `clearData()` (clears all + cache), `getColumnStats(column)`
- **Usage:** Available but page.tsx currently uses local useState + useRef for the same data

AGENT NOTE: The Zustand store exists as an alternative to the useState pattern in page.tsx. Both approaches are valid. If refactoring to use the store, remove the redundant useState/useRef/memo patterns in page.tsx.

## Toast Store

### useToast
- **File:** `src/hooks/use-toast.ts`
- **Pattern:** External store pattern (module-level state, not Zustand)
- **State:** Array of toast objects with id, title, description, action
- **Actions:** `toast(props)`, `dismiss(id)`
- **Used by:** All error/success notifications throughout the app

## Local State in page.tsx

The main dashboard page (`src/app/page.tsx`) manages extensive local state:

| State | Type | Purpose |
|-------|------|---------|
| `data` | `any[] \| null` | The uploaded dataset |
| `fileName` | `string \| null` | Name of uploaded file |
| `isProcessing` | `boolean` | True while AI recommendations are loading |
| `isGeneratingInsights` | `boolean` | True while insights are loading |
| `recommendations` | `RecommendVisualizationsOutput \| null` | AI chart recommendations |
| `insights` | `AiGeneratedDataInsightsOutput \| null` | AI insights results |
| `groundingEnabled` | `boolean` | Whether to use Gemini grounding |
| `chartAnalysisOpen` | `boolean` | Chart analysis dialog visibility |
| `nlQueryChart` | `NLQueryOutput \| null` | NL query result |
| `reportOpen` | `boolean` | Report dialog visibility |

### Cached Refs

| Ref | Purpose |
|-----|---------|
| `cachedMetadataRef` | ColumnMetadata[] cached after first extraction |
| `cachedMetadataJsonRef` | JSON string of metadata for AI prompts |

### Memoized Computations

| Memo | Purpose |
|------|---------|
| `columnStats` | Stats for all numerical columns, computed once |
| `chartDataMap` | Pre-sliced data per chart recommendation |
| `nlQueryFilteredData` | Data filtered by NL query filter expression |

## Hooks

### useIsMobile
- **File:** `src/hooks/use-mobile.tsx`
- **Returns:** `boolean` — true if viewport < 768px
- **Pattern:** matchMedia listener with cleanup

## Related Docs

- [docs/architecture/data-flow.md] — Where state is created and consumed
- [docs/api/data-utilities.md] — Data processing that populates state