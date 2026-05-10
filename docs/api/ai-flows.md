# AI Flows (Server Actions)

> **Scope:** All 7 Genkit server actions. **Rendering context:** Server **Last updated:** 2026-05-10

## Overview

The project has 7 Genkit server actions in `src/ai/flows/`. They are the only server-side code. All flows use `googleai/gemini-2.5-flash` and return Zod-validated structured output.

## Genkit Configuration

- **File:** `src/ai/genkit.ts`
- **Plugin:** `@genkit-ai/google-genai`
- **Default model:** `googleai/gemini-2.5-flash`
- **Shared instance:** All flows import `ai` from `src/ai/genkit.ts`

## Shared Schema

- **File:** `src/ai/flows/schemas.ts`
- **ColumnMetadataSchema:** `{ name, dataType, isCategorical, isNumerical, isTemporal, uniqueValuesCount?, min?, max?, avg?, exampleValues? }`

## Flow Catalog

### 1. recommendVisualizations
- **File:** `src/ai/flows/ai-powered-visualization-recommendations.ts`
- **Input:** `{ columnMetadata[], rowCount, datasetDescription? }`
- **Output:** `{ recommendations: { type, title, explanation, columnsUsed }[] }`
- **Purpose:** Recommends up to 9 chart visualizations from 22 supported types
- **Caching:** Cached by metadata hash + rowCount

### 2. aiGeneratedDataInsights
- **File:** `src/ai/flows/ai-generated-data-insights.ts`
- **Input:** `{ dataset (compact table), groundingEnabled }`
- **Output:** `{ insights, keyFindings[], predictions }`
- **Purpose:** Generates analytical insights, key findings, and predictions
- **Caching:** Cached by dataset hash + groundingEnabled

### 3. perChartAnalysis
- **File:** `src/ai/flows/per-chart-analysis.ts`
- **Input:** `{ chartTitle, chartType, columnsUsed[], dataSummary }`
- **Output:** `{ analysis, insights[], recommendation }`
- **Purpose:** Analyzes a single chart's data for patterns and insights
- **Caching:** Cached by chartTitle + chartType + columnsUsed

### 4. naturalLanguageQuery
- **File:** `src/ai/flows/natural-language-query.ts`
- **Input:** `{ query, columnMetadata (JSON string), rowCount }`
- **Output:** `{ chartType, title, xAxis, yAxis, extraSeries?, explanation, filter? }`
- **Purpose:** Converts natural language question into chart configuration
- **Caching:** Cached by query + metadata hash

### 5. generateReport
- **File:** `src/ai/flows/report-generation.ts`
- **Input:** `{ dataset, columnStats, insights?, fileName, rowCount, columnCount }`
- **Output:** `{ executiveSummary, sections[], keyMetrics[], actionItems[], dataQualityNotes }`
- **Purpose:** Generates comprehensive executive report
- **Caching:** Cached by fileName + rowCount + insights hash

### 6. detectAnomaliesAI
- **File:** `src/ai/flows/anomaly-detection.ts`
- **Input:** `{ dataset (100 rows), columnStats, anomalies }`
- **Output:** `{ summary, anomalies[], recommendations[], dataQualityImpact }`
- **Purpose:** Explains statistically detected anomalies with business context
- **Caching:** Not cached (called on demand)

### 7. batchChartAnalysis
- **File:** `src/ai/flows/batch-chart-analysis.ts`
- **Input:** `{ charts: { chartTitle, chartType, columnsUsed, dataSummary }[] }`
- **Output:** `{ results[], crossChartInsights? }`
- **Purpose:** Analyzes multiple charts in one API call
- **Caching:** Not cached

## Common Patterns

- All flows use `'use server'` directive
- All inputs/outputs validated with Zod schemas
- All outputs null-checked: `if (!output) throw new Error(...)`
- Prompt data formatted as compact markdown tables via `src/lib/prompt-format.ts`
- Token budget applied via `src/lib/token-budget.ts`

AGENT NOTE: When adding a new flow, follow the existing pattern: define input/output Zod schemas, create a `ai.definePrompt()` with the prompt string, create a `ai.defineFlow()` that calls the prompt, and export an async wrapper function.

## Related Docs

- [docs/architecture/data-flow.md] — Where AI flows fit in the data lifecycle
- [docs/api/data-utilities.md] — Data formatting utilities used by flows