# Chart Analysis Module

> **Scope:** Per-chart AI analysis dialog. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

Users click a brain icon on any chart to get AI-generated analysis of that specific chart's data, including patterns, outliers, correlations, and actionable recommendations.

## Entry Points

- **UI Component:** `src/components/dashboard/ChartAnalysisDialog.tsx`
- **Server Action:** `src/ai/flows/per-chart-analysis.ts``
- **Batch Action:** `src/ai/flows/batch-chart-analysis.ts``
- **Trigger:** ChartPanels "BI Analysis" button → handleChartAnalysis() in page.tsx

## Server Action: perChartAnalysis

- **Flow name:** `perChartAnalysisFlow`
- **Input:** `{ chartTitle, chartType, columnsUsed: string[], dataSummary: string (JSON) }`
- **Output:** `{ analysis: string, insights: string[], recommendation: string }`
- **Model:** googleai/gemini-2.5-flash

## Server Action: batchChartAnalysis

- **Flow name:** `batchChartAnalysisFlow`
- **Input:** `{ charts: Array<{ chartTitle, chartType, columnsUsed, dataSummary > }`
- **Output:** `{ results: Array<{ chartTitle, analysis, insights, recommendation ~>, crossChartInsights?: string[] }`
- **Purpose:** Analyzes multiple charts in one API call instead of separate calls

## Key Components

### ChartAnalysisDialog
- **Path:** `src/components/dashboard/ChartAnalysisDialog.tsx`
- **Purpose:** Modal dialog displaying analysis results, insights list, and recommendation
- **Props:** `open`, `onOpenChange`, `analysis`, `chartTitle`, `chartType`, `isLoading`
- **Client-side:** Yes

## Data Flow

.. code:: text

    1. User clicks brain icon on ChartPanel
    2. handleChartAnalysis() gathers chart metadata and sample data (10 rows)
    3. Computes stats using centralized `columnStats` or fallback `computeStats()`
    4. Calls `perChartAnalysis()` server action
    5. Result displayed in ChartAnalysisDialog

## Caching

- Cached by: chartTitle + chartType + columnsUsed hash
- TTL: 10 minutes

## Related Docs

- [docs/modules/chart-rendering.md] — ChartPanel that triggers analysis
- [docs/api/ai-flows.md] — Flow details