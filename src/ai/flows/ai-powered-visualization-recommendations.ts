'use server';
/**
 * @fileOverview An AI agent that analyzes dataset characteristics and recommends a high volume of suitable visualization types.
 *
 * - recommendVisualizations - A function that handles the visualization recommendation process.
 * - RecommendVisualizationsInput - The input type for the recommendVisualizations function.
 * - RecommendVisualizationsOutput - The return type for the recommendVisualizations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ColumnMetadataSchema} from '@/ai/flows/schemas';

const RecommendVisualizationsInputSchema = z.object({
  columnMetadata: z.array(ColumnMetadataSchema).describe('An array of metadata for each column in the dataset.'),
  rowCount: z.number().describe('The total number of rows in the dataset.'),
  datasetDescription: z.string().optional().describe('An optional description of the dataset or its purpose.'),
});
export type RecommendVisualizationsInput = z.infer<typeof RecommendVisualizationsInputSchema>;

const VisualizationRecommendationSchema = z.object({
  type: z.enum([
    'bar_chart',
    'line_graph',
    'scatter_plot',
    'pie_chart',
    'area_chart',
    'radar_chart',
    'composed_chart',
    'stacked_bar',
    'donut_chart',
    'radial_bar',
    'horizontal_bar',
    'grouped_bar',
    'stacked_area',
    'bubble_chart',
    'multi_bar',
    'treemap_chart',
    'box_plot',
    'waterfall_chart',
    'histogram',
    'gauge_kpi',
    'forecast_chart',
    'distribution',
  ]).describe('The recommended type of visualization.'),
  title: z.string().describe('A catchy title for this specific chart.'),
  explanation: z.string().describe('A brief explanation of why this visualization is suitable.'),
  columnsUsed: z.array(z.string()).describe('An array of column names used. First is usually X-axis/Category, subsequent are Y-axis/Values.'),
});

const RecommendVisualizationsOutputSchema = z.object({
  recommendations: z.array(VisualizationRecommendationSchema).describe('A list of recommended visualizations.'),
});
export type RecommendVisualizationsOutput = z.infer<typeof RecommendVisualizationsOutputSchema>;

export async function recommendVisualizations(
  input: RecommendVisualizationsInput
): Promise<RecommendVisualizationsOutput> {
  return recommendVisualizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendVisualizationsPrompt',
  input: {schema: RecommendVisualizationsInputSchema},
  output: {schema: RecommendVisualizationsOutputSchema},
  prompt: `You are an expert data visualization specialist. Your task is to analyze the provided dataset characteristics and recommend as many diverse visualizations as possible (up to 9) to create a comprehensive dashboard.

For each recommendation, choose the best type from the supported list: bar_chart, line_graph, scatter_plot, pie_chart, area_chart, radar_chart, composed_chart, stacked_bar, donut_chart, radial_bar, horizontal_bar, grouped_bar, stacked_area, bubble_chart, multi_bar.

Rules:
1. Mix and match different types to show different angles of the data. Use at least 6 different chart types.
2. Ensure columnsUsed matches the requirements:
   - bar_chart, line_graph, area_chart, stacked_area: [CategoryColumn, ValueColumn]
   - scatter_plot, bubble_chart: [NumericX, NumericY]
   - radar_chart: [CategoryColumn, ValueColumn1, ValueColumn2 (optional)]
   - pie_chart, donut_chart: [CategoryColumn, ValueColumn]
   - composed_chart: [CategoryColumn, BarValueColumn, LineValueColumn]
   - stacked_bar, grouped_bar, multi_bar: [CategoryColumn, Value1, Value2...]
   - horizontal_bar: [CategoryColumn, ValueColumn]
   - radial_bar: [CategoryColumn, ValueColumn]
3. Use columns that actually exist in the metadata. Match exact column names.
4. For scatter/bubble charts, only use columns where isNumerical is true.
5. For bar/line/area charts, use a categorical column for X and a numerical column for Y.
6. For pie/donut charts, use a categorical column with few unique values (<= 12) for the category.
7. Create diverse titles that describe what each chart reveals about the data.

Dataset Description: {{{datasetDescription}}}
Row Count: {{{rowCount}}}

Column Metadata:
{{#each columnMetadata}}
- Name: {{{name}}}, Type: {{{dataType}}}, Categorical: {{{isCategorical}}}, Numerical: {{{isNumerical}}}, Temporal: {{{isTemporal}}}, Unique: {{{uniqueValuesCount}}}, Min: {{{min}}}, Max: {{{max}}}, Examples: {{#if exampleValues}}[{{#each exampleValues}}'{{{this}}}'{{#unless @last}}, {{/unless}}{{/each}}]{{else}}N/A{{/if}}
{{/each}}

Return a large variety of charts using as many different chart types as possible.`,
});

const recommendVisualizationsFlow = ai.defineFlow(
  {
    name: 'recommendVisualizationsFlow',
    inputSchema: RecommendVisualizationsInputSchema,
    outputSchema: RecommendVisualizationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
