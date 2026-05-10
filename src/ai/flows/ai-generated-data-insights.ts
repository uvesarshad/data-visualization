'use server';
/**
 * @fileOverview A Genkit flow for generating detailed data insights, key findings, and predictions from a dataset.
 *
 * - aiGeneratedDataInsights - A function that handles the AI-powered data analysis process.
 * - AiGeneratedDataInsightsInput - The input type for the aiGeneratedDataInsights function.
 * - AiGeneratedDataInsightsOutput - The return type for the aiGeneratedDataInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiGeneratedDataInsightsInputSchema = z.object({
  dataset: z
    .string()
    .describe(
      'The dataset provided as a string, typically in CSV or JSON format.'
    ),
  groundingEnabled: z
    .boolean()
    .describe(
      'Whether the AI should use external knowledge (Gemini Research Max) for grounding and reasoning.'
    ),
});
export type AiGeneratedDataInsightsInput = z.infer<
  typeof AiGeneratedDataInsightsInputSchema
>;

const AiGeneratedDataInsightsOutputSchema = z.object({
  insights: z
    .string()
    .describe('Detailed analytical insights derived from the dataset.'),
  keyFindings: z
    .array(z.string())
    .describe('A list of the most important findings from the data.'),
  predictions: z
    .string()
    .describe('Future trends or predictions based on the data analysis.'),
});
export type AiGeneratedDataInsightsOutput = z.infer<
  typeof AiGeneratedDataInsightsOutputSchema
>;

export async function aiGeneratedDataInsights(
  input: AiGeneratedDataInsightsInput
): Promise<AiGeneratedDataInsightsOutput> {
  return aiGeneratedDataInsightsFlow(input);
}

const aiGeneratedDataInsightsPrompt = ai.definePrompt({
  name: 'aiGeneratedDataInsightsPrompt',
  input: { schema: AiGeneratedDataInsightsInputSchema },
  output: { schema: AiGeneratedDataInsightsOutputSchema },
  prompt: `You are an expert data analyst. Your task is to analyze the provided dataset and generate detailed insights, key findings, and predictions.

Dataset:
{{dataset}}

{{#if groundingEnabled}}
Use your extensive knowledge and research capabilities (Gemini Research Max) to provide grounded insights and predictions.
{{else}}
Analyze only the provided dataset. Do not use external knowledge.
{{/if}}

Provide your analysis in the following structured JSON format:
{
  "insights": "Detailed analytical insights derived from the dataset.",
  "keyFindings": [
    "A list of the most important findings from the data."
  ],
  "predictions": "Future trends or predictions based on the data analysis."
}`,
});

const aiGeneratedDataInsightsFlow = ai.defineFlow(
  {
    name: 'aiGeneratedDataInsightsFlow',
    inputSchema: AiGeneratedDataInsightsInputSchema,
    outputSchema: AiGeneratedDataInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await aiGeneratedDataInsightsPrompt(input);
    return output!;
  }
);
