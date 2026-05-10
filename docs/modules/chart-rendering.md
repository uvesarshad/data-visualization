# Chart Rendering Module

> **Scope:** 22 chart types, ChartPanel, ChartRenderer. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

ChartPanel is the main chart container component. It handles data preparation, stats computation, and delegates rendering to a dynamically imported ChartRenderer that contains all 22 Recharts chart implementations.

## Key Components

### ChartPanel
- **Path:** `src/components/dashboard/ChartPanel.tsx`
- **Purpose:** Self-contained chart card with header (title, description, stats), AI analysis button, and chart area
- **Props:** `type`, `data`, `title`, `description`, `config { xAxis, yAxis, extraSeries? }`, `onAnalyze?`, `precomputedStats?`
- **Client-side:** Yes
- **Behavior:** Prepares data via `prepareChartData()`, computes stats, delegates rendering to dynamic ChartRenderer
- **AGENT NOTE:** ChartPanel uses `next/dynamic` to import ChartRenderer. Recharts (~400KB) is NOT in the initial bundle.

### ChartRenderer
- **Path:** `src/components/charts/ChartRenderer.tsx`
- **Purpose:** Contains the `switch` statement that renders all 22 chart types using Recharts
- **Props:** `type`, `chartData`, `config`, `stats`, `isValid`, `errorMessage`, `rawData`
- **Client-side:** Yes
- **Default export:** Yes (required for `next/dynamic`)
- **Extracted component:** `TreemapContent` — separate React element for Treemap custom rendering

### ChartSkeleton
- **Path:** `src/components/dashboard/ChartSkeleton.tsx`
- **Purpose:** Loading placeholder shown while ChartRenderer dynamically loads
- **Client-side:** Yes

## Data Preparation

### prepareChartData
- **Path:** `src/app/lib/chart-utils.ts`
- **Purpose:** Transforms raw data into chart-ready format based on chart type
- **Behavior:** Slices to 100 rows, aggregates by category for bar/area/pie charts, filters for scatter, slices for radar

### isNumericColumn
- **Path:** `src/app/lib/chart-utils.ts`
- **Purpose:** Heuristic check — samples 20 rows, returns true if >70% are numeric

## Auto-Detection

If `config.xAxis` or `config.yAxis` columns don't exist in the data, ChartPanel auto-detects:
1. Finds numeric keys and string keys
2. Assigns string key to xAxis, numeric key to yAxis
3. Falls back to first two numeric keys if no string keys found

AGENT NOTE: Auto-detection mutates the config object. If you pass config as a prop, the original reference may be modified.

## Stats Display

ChartPanel shows a mini stats bar (Min, Avg, Max) using `precomputedStats` from parent or `computeStats()` as fallback.

## Related Docs

- [docs/modules/visualization-recommendations.md] — What generates the chart recommendations
- [docs/api/data-utilities.md] — prepareChartData, computeStats details