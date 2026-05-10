# Anomaly Detection Module

> **Scope:** Statistical anomaly detection flow. **Rendering context:** Client + Server **Last updated:** 2026-05-10

## Overview

The system detects statistical anomalies in the dataset and has the AI explain them with business context. Anomalies are detected client-side using statistical methods, then sent to the AI for explanation.

## Server Action: detectAnomaliesAI

- **Flow name:** `anomalyDetectionFlow`
- **Path:** `src/ai/flows/anomaly-detection.ts`
- **Input:** `{ dataset (first 100 rows), columnStats, anomalies }`
- **Output:** `{ summary, anomalies[], recommendations[], dataQualityImpact }`
- **Model:** googleai/gemini-2.5-flash

## AnomalyItem Schema

Each anomaly contains: `column`, `value`, `expectedRange`, `severity` (low/medium/high/critical), `explanation`

## Related Docs

- [docs/api/data-utilities.md] — Statistical functions
- [docs/api/ai-flows.md] — Flow details