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
import { sanitizeForPrompt, PROMPT_GUARDRAIL } from '@/lib/prompt-sanitize';

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

${PROMPT_GUARDRAIL}

<user_dataset>
{{dataset}}
</user_dataset>

{{#if groundingEnabled}}
Google Search grounding is enabled. Enrich the analysis with up-to-date industry benchmarks, market context, and external validation of patterns you observe in the data. Cite sources where they meaningfully strengthen a finding.
{{else}}
Analyze only the provided dataset. Do not use external knowledge.
{{/if}}

Edge case handling:
- If the dataset has fewer than 3 rows, state that insights are limited due to insufficient data.
- If columns contain all-null or empty values, note them as unusable for analysis.
- If all values in a column are identical, note that there is no variance to analyze.`,
});

const aiGeneratedDataInsightsFlow = ai.defineFlow(
  {
    name: 'aiGeneratedDataInsightsFlow',
    inputSchema: AiGeneratedDataInsightsInputSchema,
    outputSchema: AiGeneratedDataInsightsOutputSchema,
  },
  async (input) => {
    const cleaned = {
      ...input,
      dataset: sanitizeForPrompt(input.dataset),
    };
    // When grounding is enabled, pass googleSearchRetrieval through the Gemini config.
    // Structured output + Google Search retrieval are compatible on Gemini 2.5 Flash.
    const config: Record<string, any> = { maxOutputTokens: 1200 };
    if (cleaned.groundingEnabled) config.googleSearchRetrieval = true;
    const callOpts = { config };

    let output;
    try {
      ({ output } = await aiGeneratedDataInsightsPrompt(cleaned, callOpts));
    } catch {
      ({ output } = await aiGeneratedDataInsightsPrompt(cleaned, callOpts));
    }
    if (!output) throw new Error('AI returned empty response for aiGeneratedDataInsights');
    return output;
  }
);
