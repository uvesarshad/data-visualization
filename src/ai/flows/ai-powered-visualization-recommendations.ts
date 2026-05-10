'use server';
/**
 * @fileOverview An AI agent that analyzes dataset characteristics and recommends suitable visualization types.
 *
 * - recommendVisualizations - A function that handles the visualization recommendation process.
 * - RecommendVisualizationsInput - The input type for the recommendVisualizations function.
 * - RecommendVisualizationsOutput - The return type for the recommendVisualizations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColumnMetadataSchema = z.object({
  name: z.string().describe('The name of the column.'),
  dataType: z.enum(['string', 'number', 'boolean', 'date']).describe('The data type of the column.'),
  isCategorical: z.boolean().describe('True if the column contains categorical data.'),
  isNumerical: z.boolean().describe('True if the column contains numerical data.'),
  isTemporal: z.boolean().describe('True if the column contains temporal (date/time) data.'),
  uniqueValuesCount: z.number().optional().describe('The number of unique values in the column (for categorical/string types).'),
  min: z.number().optional().describe('The minimum value in the column (for numerical types).'),
  max: z.number().optional().describe('The maximum value in the column (for numerical types).'),
  avg: z.number().optional().describe('The average value in the column (for numerical types).'),
  exampleValues: z.array(z.string()).optional().describe('A few example values from the column.'),
});

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
    'histogram',
    'boxplot',
    'heatmap',
    'area_chart',
    'bubble_chart',
    'treemap',
    'word_cloud',
    'gauge_chart',
    'table',
  ]).describe('The recommended type of visualization.'),
  explanation: z.string().describe('A brief explanation of why this visualization is suitable.'),
  columnsUsed: z.array(z.string()).describe('An array of column names that would be ideal for this visualization.'),
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
  prompt: `You are an expert data visualization specialist. Your task is to analyze the provided dataset characteristics and recommend up to 5 suitable visualization types.

For each recommendation, explain why it is suitable for the given data and list the specific column names that would be best utilized in that visualization.

Prioritize common, effective, and insightful visualization types that help in understanding the data.

Consider the data types, cardinality (unique values count), and overall nature of the dataset to provide the best recommendations.

Dataset Description: {{{datasetDescription}}}
Row Count: {{{rowCount}}}

Column Metadata:
{{#each columnMetadata}}
- Name: {{{name}}}, Data Type: {{{dataType}}}, Categorical: {{{isCategorical}}}, Numerical: {{{isNumerical}}}, Temporal: {{{isTemporal}}}, Unique Values: {{{uniqueValuesCount}}}, Min: {{{min}}}, Max: {{{max}}}, Avg: {{{avg}}}, Example Values: {{#if exampleValues}}[{{#each exampleValues}}'{{{this}}}'{{#unless @last}}, {{/unless}}{{/each}}]{{else}}N/A{{/if}}
{{/each}}

Please provide your recommendations in the specified JSON format.`,
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
