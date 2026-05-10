'use server';
/**
 * @fileOverview AI flow for generating comprehensive data analysis reports.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReportGenerationInputSchema = z.object({
  dataset: z.string().describe('JSON string of the dataset sample (first 50 rows).'),
  columnStats: z.string().describe('JSON string of column statistics.'),
  insights: z.string().optional().describe('Existing AI insights if available.'),
  fileName: z.string().describe('Name of the dataset file.'),
  rowCount: z.number().describe('Total number of rows.'),
  columnCount: z.number().describe('Total number of columns.'),
});
export type ReportGenerationInput = z.infer<typeof ReportGenerationInputSchema>;

const ReportSectionSchema = z.object({
  title: z.string().describe('Section title.'),
  content: z.string().describe('Section content in markdown format.'),
});

const ReportGenerationOutputSchema = z.object({
  executiveSummary: z.string().describe('A concise 2-3 sentence executive summary of the entire dataset.'),
  sections: z.array(ReportSectionSchema).describe('Report sections with detailed analysis.'),
  keyMetrics: z.array(z.object({
    label: z.string().describe('Metric name.'),
    value: z.string().describe('Metric value.'),
    trend: z.enum(['up', 'down', 'neutral']).describe('Trend direction.'),
    insight: z.string().describe('Brief insight about this metric.'),
  })).describe('Key metrics extracted from the data.'),
  actionItems: z.array(z.string()).describe('Top 5 actionable recommendations.'),
  dataQualityNotes: z.string().describe('Notes about data quality and reliability.'),
});
export type ReportGenerationOutput = z.infer<typeof ReportGenerationOutputSchema>;

export async function generateReport(input: ReportGenerationInput): Promise<ReportGenerationOutput> {
  return reportGenerationFlow(input);
}

const reportGenerationPrompt = ai.definePrompt({
  name: 'reportGenerationPrompt',
  input: { schema: ReportGenerationInputSchema },
  output: { schema: ReportGenerationOutputSchema },
  prompt: `You are a senior data analyst preparing an executive report. Generate a comprehensive analysis report for the following dataset.

Dataset: {{fileName}}
Rows: {{rowCount}}
Columns: {{columnCount}}

Data Sample:
{{dataset}}

Column Statistics:
{{columnStats}}

{{#if insights}}
Existing Insights:
{{insights}}
{{/if}}

Generate a professional report with:
1. A concise executive summary (2-3 sentences max)
2. Multiple analysis sections covering: Overview, Trends, Distribution, Correlations, Anomalies
3. Key metrics with trend indicators and brief insights
4. Top 5 actionable recommendations based on the data
5. Data quality assessment

Be specific with numbers. Use business-friendly language. Focus on actionable intelligence.`,
});

const reportGenerationFlow = ai.defineFlow(
  {
    name: 'reportGenerationFlow',
    inputSchema: ReportGenerationInputSchema,
    outputSchema: ReportGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await reportGenerationPrompt(input);
    return output!;
  }
);