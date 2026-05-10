# AI Insights Module

> **Scope:** AI-generated analytical insights, key findings, and predictions. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

The AI Insights module provides a high-level analytical overview of the entire dataset. It generates narrative insights, a list of bulleted key findings, and future-looking predictions based on the uploaded data. Users can toggle "Gemini Research Max" for grounded reasoning that includes industry benchmarks.

## Entry Points

- **UI Component:** `src/components/dashboard/InsightsPanel.tsx`
- **Server Action:** `src/ai/flows/ai-generated-data-insights.ts`
- **Trigger:** `src/app/page.tsx` → `handleDataLoaded()` (automatically triggered after upload)

## Server Action: aiGeneratedDataInsights

- **Flow name:** `aiGeneratedDataInsightsFlow`
- **Input:** `{ dataset: string, groundingEnabled: boolean }`
- **Output:** `{ insights: string, keyFindings: string[], predictions: string `
- **Model:** googleai/gemini-2.5-flash
- **Behavior:** 
  - Uses `dataToCompactTable()` to format the dataset as a markdown table.
  - If `groundingEnabled` is true, the prompt allows for industry-specific context.
  - Returns structured JSON for narrative sections and bullet points.

## Key Components

### InsightsPanel
- **Path:** `src/components/dashboard/InsightsPanel.tsx`
- **Purpose:** Displays the AI-generated narrative results in a structured accordion/card layout.
- **Props:** `insights: AiGeneratedDataInsightsOutput | null`, `isLoading: boolean`, `groundingEnabled: boolean`, `onToggleGrounding: () => void`
- **Client-side:** Yes
- **Sections:**
  - **Analytical Insights:** Narrative paragraphs.
  - **Key Findings:** Bulleted list of concise facts.
  - **Predictions:** Future trends or forecasts.
  - **Grounding Toggle:** Switch to enable/disable external knowledge grounding.

## Data Lifecycle

1. Data is uploaded and cleaned.
2. `handleDataLoaded` calls `generateInsights()`.
3. Dataset is truncated to token budget and converted to markdown table.
4. Server action is called; results are stored in the main page state.
5. `InsightsPanel` renders the results or a skeleton loader.

## Edge Cases

- **Small Datasets:** If < 3 rows, AI notes limited insights.
- **Low Variance:** AI identifies columns with identical values as unusable for trends.
- **Missing Data:** AI identifies all-null columns as gaps in analysis.

AGENT NOTE: Insights are re-generated if the "Grounding" toggle is flipped, as this changes the prompt instructions.

## Related Docs

- [docs/api/ai-flows.md] — Flow implementation details
- [docs/modules/visualization-recommendations.md] — Runs in parallel with insights
- [docs/lib/prompt-format.md] — How dataset is formatted for the prompt
