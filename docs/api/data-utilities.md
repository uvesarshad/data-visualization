# Data Utilities

> **Scope:** Data processing, statistics, chart utilities. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

The project has a comprehensive set of client-side data processing utilities in `src/app/lib/`. These handle file parsing, metadata extraction, validation, statistical computation, and chart data preparation.

## Data Processing (src/app/lib/data-processor.ts)

- **parseCSV(csv)** — Robust CSV parser handling quoted fields, escaped quotes, commas in quotes, newlines. Returns `any[]`.
- **parseExcel(buffer)** — Async function. Dynamically imports XLSX library, parses ArrayBuffer to `any[]`. Returns `Promise<any[]>`.
- **extractMetadata(data)** — Iterates all columns, determines type (number/date/boolean/string), computes uniqueValuesCount, min, max, avg, exampleValues. Returns `ColumnMetadata[]`.

### ColumnMetadata Schema (from src/ai/flows/schemas.ts)

Fields: `name` (string), `dataType` (string|number|boolean|date), `isCategorical` (boolean), `isNumerical` (boolean), `isTemporal` (boolean), `uniqueValuesCount?` (number), `min?` (number), `max?` (number), `avg?` (number), `exampleValues?` (string[])

AGENT NOTE: `extractMetadata` uses iterative min/max (not `Math.min(...spread)`) to prevent stack overflow on large datasets.

## Data Validation (src/app/lib/data-validation.ts)

- **cleanData(data, options)** — Removes empty rows, trims string values. Options: `removeEmptyRows`, `trimStrings`.
- **validateData(data)** — Checks column count, row count, data types. Returns `{ valid: boolean, warnings: string[] }`.

## Chart Utilities (src/app/lib/chart-utils.ts)

- **aggregateByCategory(data, categoryCol, valueCol, aggregation)** — Groups data by category, aggregates values using sum/avg/count/min/max.
- **pivotData(data, groupCol, categoryCol, valueCol, aggregation)** — Pivots data for multi-series charts.
- **getNumericValues(data, column)** — Safely extracts numeric values, filtering NaN/Infinity.
- **computeStats(data, column)** — Computes: count, sum, mean, median, min, max, stdDev, q1, q3. Returns stats object or null.
- **getUniqueValues(data, column)** — Returns unique values from a column.
- **prepareChartData(data, chartType, xAxis, yAxis, extraSeries?)** — Transforms raw data for specific chart type. Handles aggregation, slicing, filtering per chart type.
- **isNumericColumn(data, column)** — Samples 20 rows, returns true if >70% are numeric.
- **isCategoricalColumn(data, column)** — True if unique values < 50% of rows and ≤ 50 unique values.

## Statistics (src/app/lib/statistics.ts)

- **computeBoxPlot(values)** — Returns min, q1, median, q3, max, mean, outliers.
- **computeHistogram(values, binCount)** — Returns bins array with label, min, max, count.
- **linearRegression(xValues, yValues)** — Returns slope, intercept, r2.
- **forecastLinear(values, periods)** — Returns forecast values and confidence intervals.

## Prompt Formatting (src/lib/prompt-format.ts)

- **dataToCompactTable(data, maxRows)** — Converts data to markdown table format for AI prompts.
- **metadataToCompactFormat(metadata)** — Converts ColumnMetadata to compact text.
- **statsToCompactFormat(stats)** — Converts stats object to compact text.

## Token Budget (src/lib/token-budget.ts)

- **estimateTokens(text)** — Rough estimate: text.length / 4.
- **truncateToTokenBudget(text, maxTokens)** — Truncates text at newline boundary if exceeds budget. Default: 8000 tokens.

## Filter Parser (src/lib/filter-parser.ts)

- **parseFilterExpression(expr)** — Parses "column operator value" expressions. Supports: =, !=, >, <, >=, <=, contains, not_contains.
- **applyFilter(data, filter)** — Filters data array by parsed filter.
- **filterData(data, filterExpr)** — One-step parse and apply.

## Sample Data (src/app/lib/sample-data.ts)

Contains 3 built-in sample datasets for demo purposes, each with `name`, `description`, `icon`, and `data` fields.

## Related Docs

- [docs/modules/data-upload.md] — Uses parseCSV, parseExcel, cleanData, validateData
- [docs/modules/chart-rendering.md] — Uses prepareChartData, computeStats
- [docs/api/ai-flows.md] — Uses prompt-format and token-budget