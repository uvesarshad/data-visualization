# Report Generation Module

> **Scope:** Executive report generation. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

Users click "Generate Report" to get a comprehensive AI-generated executive report with sections, key metrics, action items, and data quality notes.

## Entry Points

- **UI Component:** `src/components/dashboard/ReportDialog.tsx`
- **Server Action:** `src/ai/flows/report-generation.ts`
- **Trigger:** `handleGenerateReport()` in page.tsx (sidebar button or header button)

## Server Action: generateReport

- **Flow name:** `reportGenerationFlow`
- **Input:** `{ dataset (compact table), columnStats (compact), insights?, fileName, rowCount, columnCount }`
- **Output:** `{ executiveSummary, sections[], keyMetrics[], actionItems[], dataQualityNotes }`
- **Model:** googleai/gemini-2.5-flash
- **AGENT NOTE:** If existing insights are available, they are passed to avoid redundant analysis.

## Output Schema

- `executiveSummary`: 2-3 sentence overview
- `sections`: Array of { title, content (markdown) } covering Overview, Trends, Distribution, Correlations, Anomalies
- `keyMetrics`: Array of { label, value, trend (up/down/neutral), insight }
- `actionItems`: Top 5 actionable recommendations
- `dataQualityNotes`: Assessment of data reliability

## Key Components

### ReportDialog
- **Path:** `src/components/dashboard/ReportDialog.tsx`
- **Purpose:** Full-screen dialog displaying the report with export option
- **Props:** `open`, `onOpenChange`, `report`, `isLoading`, `fileName`, `onExport`
- **Client-side:** Yes

## Related Docs

- [docs/api/ai-flows.md] — Flow implementation
- [docs/modules/ai-insights.md] — Insights reused in report