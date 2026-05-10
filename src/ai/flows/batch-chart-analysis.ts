'use server';
/**
 * @fileOverview AI flow for batch-analyzing multiple charts in a single API call.
 * Replaces individual perChartAnalysis calls (up to 9) with one consolidated call.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChartInputSchema = z.object({
  chartTitle: z.string().describe('The title of the chart.'),
  chartType: z.string().describe('The type of chart (e.g., bar_chart, line_graph).'),
  columnsUsed: z.array(z.string()).describe('The column names used in the chart.'),
  dataSummary: z.string().describe('A JSON string with sample data and statistics for this chart.'),
});

const BatchChartAnalysisInputSchema = z.object({
  charts: z.array(ChartInputSchema).describe('Array of charts to analyze.'),
});
export type BatchChartAnalysisInput = z.infer<typeof BatchChartAnalysisInputSchema>;

const ChartAnalysisResultSchema = z.object({
  chartTitle: z.string().describe('The title of the chart analyzed.'),
  analysis: z.string().describe('Detailed analysis of the chart data, trends, and patterns.'),
  insights: z.array(z.string()).describe('Key insights derived from this chart.'),
  recommendation: z.string().describe('Actionable recommendation based on the chart analysis.'),
});

const BatchChartAnalysisOutputSchema = z.object({
  results: z.array(ChartAnalysisResultSchema).describe('Analysis results for each chart.'),
  crossChartInsights: z.array(z.string()).optional().describe('Insights that span across multiple charts.'),
});
export type BatchChartAnalysisOutput = z.infer<typeof BatchChartAnalysisOutputSchema>;

export async function batchChartAnalysis(
  input: BatchChartAnalysisInput
): Promise<BatchChartAnalysisOutput> {
  return batchChartAnalysisFlow(input);
}

const batchChartAnalysisPrompt = ai.definePrompt({
  name: 'batchChartAnalysisPrompt',
  input: { schema: BatchChartAnalysisInputSchema },
  output: { schema: BatchChartAnalysisOutputSchema },
  prompt: `You are an expert data analyst. Analyze the following charts and provide detailed insights for each.

{{#each charts}}
---
Chart: {{chartTitle}}
Type: {{chartType}}
Columns: {{columnsUsed}}
Data Summary: {{dataSummary}}
---
{{/each}}

For EACH chart, provide:
1. What the data shows — key patterns, trends, distributions
2. Notable outliers or anomalies
3. Correlations between variables (if applicable)
4. An actionable recommendation

Also provide 2-3 cross-chart insights that connect findings across multiple charts.

Be specific with numbers and percentages. Keep each chart analysis concise (2-3 sentences for analysis, 1-2 bullet points for insights).`,
});

const batchChartAnalysisFlow = ai.defineFlow(
  {
    name: 'batchChartAnalysisFlow',
    inputSchema: BatchChartAnalysisInputSchema,
    outputSchema: BatchChartAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await batchChartAnalysisPrompt(input);
    if (!output) throw new Error('AI returned empty response for batchChartAnalysis');
    return output;
  }
);