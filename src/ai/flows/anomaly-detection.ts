'use server';
/**
 * @fileOverview AI flow for anomaly detection and explanation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnomalyDetectionInputSchema = z.object({
  dataset: z.string().describe('JSON string of the dataset (first 100 rows).'),
  columnStats: z.string().describe('JSON string of column statistics including mean, stdDev, min, max.'),
  anomalies: z.string().describe('JSON string of detected anomalies with their values and expected ranges.'),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyItemSchema = z.object({
  column: z.string().describe('The column where the anomaly was found.'),
  value: z.number().describe('The anomalous value.'),
  expectedRange: z.string().describe('The expected range for this column.'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('How severe the anomaly is.'),
  explanation: z.string().describe('Why this value is anomalous and what it might indicate.'),
});

const AnomalyDetectionOutputSchema = z.object({
  summary: z.string().describe('Overall summary of anomalies found in the dataset.'),
  anomalies: z.array(AnomalyItemSchema).describe('List of detected anomalies with explanations.'),
  recommendations: z.array(z.string()).describe('Recommended actions based on the anomalies found.'),
  dataQualityImpact: z.string().describe('How these anomalies might affect data analysis quality.'),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomaliesAI(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: { schema: AnomalyDetectionInputSchema },
  output: { schema: AnomalyDetectionOutputSchema },
  prompt: `You are a data quality expert. Analyze the following dataset for anomalies and provide detailed explanations.

Dataset Sample:
{{dataset}}

Column Statistics:
{{columnStats}}

Statistically Detected Anomalies:
{{anomalies}}

Your task:
1. Summarize the overall anomaly situation in the dataset
2. For each anomaly, explain WHY it's anomalous (not just that it is)
3. Assign severity based on how far from normal and business impact
4. Provide actionable recommendations
5. Assess how these anomalies impact overall data analysis reliability

Be specific with numbers and provide business context where possible.`,
});

const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async (input) => {
    const { output } = await anomalyDetectionPrompt(input);
    if (!output) throw new Error('AI returned empty response for anomalyDetection');
    return output;
  }
);