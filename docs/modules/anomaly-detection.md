# Anomaly Detection Module

> **Scope:** Client-side statistical detection + AI explanation panel. **Rendering context:** Client + Server **Last updated:** 2026-05-15

## Overview

Anomaly detection runs in two stages: fast client-side IQR detection that doesn't require an API call, followed by an optional AI explanation step that adds business context and severity classifications.

## Stage 1: Client-side IQR Detection

**Function:** `detectAnomalies(values)` in `src/app/lib/statistics.ts`

- Uses the Tukey IQR method: `lower fence = Q1 − 1.5×IQR`, `upper fence = Q3 + 1.5×IQR`
- Runs per numeric column without any API call
- Returns `{ normal[], anomalies[], threshold: { lower, upper } }`
- Requires at least 4 values; returns empty anomalies array otherwise

## Stage 2: AI Explanation

**Server action:** `detectAnomaliesAI(input)` in `src/ai/flows/anomaly-detection.ts`

- **Input:** `{ dataset (first 100 rows JSON), columnStats, anomalies (IQR-detected JSON) }`
- **Output:** `{ summary, anomalies[]: { column, value, expectedRange, severity, explanation }[], recommendations[], dataQualityImpact }`
- **Model:** `googleai/gemini-2.5-flash`
- **Token budget:** `maxOutputTokens: 1500`
- Triggered on demand — not called automatically on data load

## UI: AnomalyPanel

**File:** `src/components/dashboard/AnomalyPanel.tsx`

- Shows/hides via the "Anomalies" toggle in the sidebar
- **Client-side pass:** Runs IQR detection on all numeric columns immediately; displays anomaly cards with column, value, and expected range
- **Severity badges:** `low` / `medium` / `high` / `critical` (classified by the AI; default `medium` before AI runs)
- **"Explain with AI" button:** Calls `detectAnomaliesAI()` and updates each card with the AI explanation
- **Recommendations list:** AI-generated recommended actions
- **Data quality impact:** AI assessment of how anomalies affect analysis reliability

## Severity Classification

The AI assigns severity based on:
- How many standard deviations / IQR multiples the value is from normal
- Implied business impact (e.g., a 10× spike in revenue vs. a 1.5× spike in a low-signal column)

## Related Docs

- [docs/api/ai-flows.md] — `detectAnomaliesAI` flow details
- [docs/api/data-utilities.md] — `detectAnomalies`, `computePercentiles` statistical functions
