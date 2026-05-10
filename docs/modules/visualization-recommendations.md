# Visualization Recommendations Module

> **Scope:** AI chart recommendation engine. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

After data upload, the system calls Gemini to recommend up to 9 chart visualizations based on dataset metadata. The AI selects from 22 supported chart types and assigns columns to each chart.

## Entry Points

- **Server Action:** `src/ai/flows/ai-powered-visualization-recommendations.ts`
- **Trigger:** `src/app/page.tsx` → `handleDataLoaded()`

## Server Action: recommendVisualizations

- **Flow name:** `recommendVisualizationsFlow`
- **Input:** `{ columnMetadata: ColumnMetadata[], rowCount: number, datasetDescription?: string }`
- **Output:** `{ recommendations: VisualizationRecommendation[] }`
- **Model:** googleai/gemini-2.5-flash
- **Includes:** Few-shot example showing 5 chart type recommendations

### VisualizationRecommendation Schema

Each recommendation contains:
- `type`: One of 22 chart types
- `title`: Descriptive chart title
- `expl</parameter>
</function_calls>

<invoke name="write_to_file">
<parameter name="path">docs/modules/visualization-recommendations.md</parameter>
<parameter name="content"># Visualization Recommendations Module

> **Scope:** AI chart recommendation engine. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

After data upload, the system calls Gemini to recommend up to 9 chart visualizations based on dataset metadata. The AI selects from 22 supported chart types and assigns columns to each chart.

## Entry Points

- **Server Action:** `src/ai/flows/ai-powered-visualization-recommendations.ts`
- **Trigger:** `src/app/page.tsx` → `handleDataLoaded()`

## Server Action: recommendVisualizations

- **Flow name:** `recommendVisualizationsFlow`
- **Input:** `{ columnMetadata: ColumnMetadata[], rowCount: number, datasetDescription?: string }`
- **Output:** `{ recommendations: VisualizationRecommendation[] }`
- **Model:** googleai/gemini-2.5-flash
- **Includes:** Few-shot example showing 5 chart type recommendations

### Supported Chart Types (22)

bar_chart, line_graph, scatter_plot, pie_chart, area_chart, radar_chart, composed_chart, stacked_bar, donut_chart, radial_bar, horizontal_bar, grouped_bar, stacked_area, bubble_chart, multi_bar, treemap_chart, box_plot, waterfall_chart, histogram, gauge_kpi, forecast_chart, distribution

AGENT NOTE: The prompt lists all 22 types with usage rules for each. If you add a new chart type, update both the Zod enum and the prompt text.

### Recommendation Rules (in prompt)

1. Mix at least 6 different chart types
2. Use exact column names from metadata
3. Scatter/bubble only for numerical columns
4. Pie/donut only for low-cardinality categorical columns (≤12 unique values)
5. Box plot uses multiple numerical columns for distribution comparison
6. Forecast uses temporal columns for X-axis

## Caching

- Cached by: metadata hash + rowCount
- TTL: 10 minutes
- Cleared on: data reset

## Data Flow

1. `handleDataLoaded()` in page.tsx extracts metadata
2. Calls `recommendVisualizations()` server action
3. Result stored in state as `recommendations`
4. `chartDataMap` useMemo pre-slices data for each recommendation
5. Each recommendation renders a `ChartPanel` component

## Related Docs

- [docs/modules/chart-rendering.md] — How recommendations become charts
- [docs/api/ai-flows.md] — Flow implementation details
</parameter>
</write_to_file>