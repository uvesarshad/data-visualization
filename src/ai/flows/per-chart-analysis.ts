'use server';
/**
 * @fileOverview AI flow for analyzing individual charts and providing detailed insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sanitizeForPrompt, sanitizeArrayForPrompt, PROMPT_GUARDRAIL } from '@/lib/prompt-sanitize';

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

${PROMPT_GUARDRAIL}

<user_chart_title>{{chartTitle}}</user_chart_title>
Chart Type: {{chartType}}
<user_columns_used>{{columnsUsed}}</user_columns_used>
<user_data_summary>
{{dataSummary}}
</user_data_summary>

Analysis focus by chart type:
- bar_chart / horizontal_bar / stacked_bar / grouped_bar / multi_bar / radial_bar / waterfall_chart:
    rank categories, highlight the top/bottom and concentration of value across the distribution.
- line_graph / area_chart / stacked_area / forecast_chart / composed_chart:
    describe the trend direction, volatility, inflection points, and seasonality if visible.
- pie_chart / donut_chart / treemap_chart:
    quantify each slice's share, call out the dominant category and the long tail. Do NOT discuss "trends".
- scatter_plot / bubble_chart:
    describe the correlation strength + direction, clusters, and any outlier points.
- histogram / distribution:
    describe shape (skew, modality), spread, mean vs median gap. Do NOT discuss "correlations".
- box_plot:
    compare medians and IQR across series; call out outliers and unequal spread.
- radar_chart:
    describe relative strengths/weaknesses across the dimensions for each category.
- gauge_kpi:
    state the current value, where it sits in the min–max range, and whether that's meaningfully high/low.

For ALL chart types: be specific with numbers and percentages. Provide one concrete, actionable recommendation
suited to the chart's analysis surface (e.g. "investigate why X spiked in Q3" for trends,
"merge the 5 smallest categories into 'Other'" for distributions).`,
});

const perChartAnalysisFlow = ai.defineFlow(
  {
    name: 'perChartAnalysisFlow',
    inputSchema: PerChartAnalysisInputSchema,
    outputSchema: PerChartAnalysisOutputSchema,
  },
  async (input) => {
    const cleaned = {
      ...input,
      chartTitle: sanitizeForPrompt(input.chartTitle, 200),
      columnsUsed: sanitizeArrayForPrompt(input.columnsUsed, 120),
      dataSummary: sanitizeForPrompt(input.dataSummary),
    };
    const callOpts = { config: { maxOutputTokens: 500 } };
    let output;
    try {
      ({ output } = await perChartAnalysisPrompt(cleaned, callOpts));
    } catch {
      ({ output } = await perChartAnalysisPrompt(cleaned, callOpts));
    }
    if (!output) throw new Error('AI returned empty response for perChartAnalysis');
    return output;
  }
);