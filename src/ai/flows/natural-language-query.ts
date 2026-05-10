'use server';
/**
 * @fileOverview AI flow for natural language data queries.
 * Users can type questions like "Show me revenue by region" and get chart configs back.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NLQueryInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
  columnMetadata: z.string().describe('JSON string of column metadata including names, types, and examples.'),
  rowCount: z.number().describe('Total number of rows in the dataset.'),
});
export type NLQueryInput = z.infer<typeof NLQueryInputSchema>;

const NLQueryOutputSchema = z.object({
  chartType: z.enum([
    'bar_chart', 'line_graph', 'scatter_plot', 'pie_chart', 'area_chart',
    'radar_chart', 'composed_chart', 'stacked_bar', 'donut_chart', 'radial_bar',
    'horizontal_bar', 'grouped_bar', 'stacked_area', 'bubble_chart', 'multi_bar',
    'treemap_chart', 'box_plot', 'waterfall_chart', 'histogram', 'gauge_kpi',
    'forecast_chart', 'distribution',
  ]).describe('The best chart type for this query.'),
  title: z.string().describe('A descriptive title for the chart.'),
  xAxis: z.string().describe('The column name for X-axis / category.'),
  yAxis: z.string().describe('The column name for Y-axis / value.'),
  extraSeries: z.array(z.string()).optional().describe('Additional columns for multi-series charts.'),
  explanation: z.string().describe('Why this visualization answers the query.'),
  filter: z.string().optional().describe('Any filter to apply (e.g., "month = Jan").'),
});
export type NLQueryOutput = z.infer<typeof NLQueryOutputSchema>;

export async function naturalLanguageQuery(input: NLQueryInput): Promise<NLQueryOutput> {
  return nlQueryFlow(input);
}

const nlQueryPrompt = ai.definePrompt({
  name: 'nlQueryPrompt',
  input: { schema: NLQueryInputSchema },
  output: { schema: NLQueryOutputSchema },
  prompt: `You are a data visualization expert. A user wants to visualize their data with a specific query.

User Query: "{{query}}"

Available Columns:
{{columnMetadata}}

Total Rows: {{rowCount}}

Based on the user's query, determine:
1. The best chart type to answer their question
2. Which columns to use for X-axis and Y-axis
3. Any additional series if needed
4. A filter expression if the user wants to narrow down data

Rules:
- Use exact column names from the metadata
- For comparisons, use bar_chart or grouped_bar
- For trends over time, use line_graph or area_chart
- For distributions, use pie_chart or donut_chart
- For correlations, use scatter_plot or bubble_chart
- For multi-metric comparisons, use radar_chart
- If the user mentions specific categories, include a filter
- Create a descriptive title that reflects the query`,
});

const nlQueryFlow = ai.defineFlow(
  {
    name: 'nlQueryFlow',
    inputSchema: NLQueryInputSchema,
    outputSchema: NLQueryOutputSchema,
  },
  async (input) => {
    const { output } = await nlQueryPrompt(input);
    if (!output) throw new Error('AI returned empty response for naturalLanguageQuery');
    return output;
  }
);