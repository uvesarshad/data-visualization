'use server';
/**
 * @fileOverview AI flow for analyzing individual charts and providing detailed insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PerChartAnalysisInputSchema = z.object({
  chartTitle: z.string().describe('The title of the chart being analyzed.'),
  chartType: z.string().describe('The type of chart (e.g., bar_chart, line_graph, pie_chart).'),
  columnsUsed: z.array(z.string()).describe('The column names used in the chart.'),
  dataSummary: z.string().describe('A JSON string containing a sample of the data and basic statistics.'),
});
export type PerChartAnalysisInput = z.infer<typeof PerChartAnalysisInputSchema>;

const PerChartAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Detailed analysis of the chart data, trends, and patterns.'),
  insights: z.array(z.string()).describe('Key insights derived from this specific chart.'),
  recommendation: z.string().describe('Actionable recommendation based on the chart analysis.'),
});
export type PerChartAnalysisOutput = z.infer<typeof PerChartAnalysisOutputSchema>;

export async function perChartAnalysis(
  input: PerChartAnalysisInput
): Promise<PerChartAnalysisOutput> {
  return perChartAnalysisFlow(input);
}

const perChartAnalysisPrompt = ai.definePrompt({
  name: 'perChartAnalysisPrompt',
  input: { schema: PerChartAnalysisInputSchema },
  output: { schema: PerChartAnalysisOutputSchema },
  prompt: `You are an expert data analyst. Analyze the following chart and provide detailed insights.

Chart Title: {{chartTitle}}
Chart Type: {{chartType}}
Columns Used: {{columnsUsed}}
Data Summary (sample + statistics):
{{dataSummary}}

Provide a thorough analysis including:
1. What the data shows - key patterns, trends, distributions
2. Notable outliers or anomalies
3. Correlations between variables (if applicable)
4. Actionable recommendations based on the data

Be specific with numbers and percentages where possible. Focus on actionable business intelligence.`,
});

const perChartAnalysisFlow = ai.defineFlow(
  {
    name: 'perChartAnalysisFlow',
    inputSchema: PerChartAnalysisInputSchema,
    outputSchema: PerChartAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await perChartAnalysisPrompt(input);
    return output!;
  }
);