'use server';
/**
 * @fileOverview AI flow for natural language data queries.
 * Users can type questions like "Show me revenue by region" and get chart configs back.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CHART_TYPES } from '@/ai/flows/chart-types';
import { sanitizeForPrompt, PROMPT_GUARDRAIL } from '@/lib/prompt-sanitize';

const NLQueryInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
  columnMetadata: z.string().describe('JSON string of column metadata including names, types, and examples.'),
  rowCount: z.number().describe('Total number of rows in the dataset.'),
});
export type NLQueryInput = z.infer<typeof NLQueryInputSchema>;

const NLQueryOutputSchema = z.object({
  chartType: z.enum(CHART_TYPES).describe('The best chart type for this query.'),
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

${PROMPT_GUARDRAIL}

<user_query>{{query}}</user_query>

<user_column_metadata>
{{columnMetadata}}
</user_column_metadata>

Total Rows: {{rowCount}}

Based on the user's query, determine:
1. The best chart type to answer their question
2. Which columns to use for X-axis and Y-axis
3. Any additional series if needed (extraSeries)
4. A filter expression if the user wants to narrow down data

Rules:
- xAxis, yAxis, and every entry in extraSeries MUST be a column name that appears verbatim in the metadata. Do not invent or rephrase column names.
- For comparisons, use bar_chart or grouped_bar.
- For trends over time, use line_graph or area_chart.
- For distributions, use pie_chart or donut_chart.
- For correlations, use scatter_plot or bubble_chart.
- For multi-metric comparisons, use radar_chart, multi_bar, stacked_bar, grouped_bar, or composed_chart — set extraSeries to the additional numeric columns (1–4 columns).
- Whenever the user asks about "X by Y across Z" or "compare A, B, C", populate extraSeries with the additional metric columns.
- If the user mentions specific categories or thresholds, include a filter.
- Create a descriptive title that reflects the query.

Filter expression grammar (return ONE condition, no AND/OR):
  column operator value
Supported operators:
  =  !=  >  <  >=  <=  contains  not contains
Value can be unquoted, single-quoted, or double-quoted. Examples:
  month = Jan
  revenue > 10000
  region != "North America"
  product contains shoe
If the user asks for multiple filters, pick the most specific one.`,
});

const nlQueryFlow = ai.defineFlow(
  {
    name: 'nlQueryFlow',
    inputSchema: NLQueryInputSchema,
    outputSchema: NLQueryOutputSchema,
  },
  async (input) => {
    const cleaned = {
      ...input,
      query: sanitizeForPrompt(input.query, 1000),
      columnMetadata: sanitizeForPrompt(input.columnMetadata),
    };

    // Extract the set of valid column names from the metadata JSON string.
    // Used to post-validate the model's xAxis/yAxis/extraSeries choices.
    let validColumns: Set<string> | null = null;
    try {
      const parsed = JSON.parse(cleaned.columnMetadata);
      if (Array.isArray(parsed)) {
        validColumns = new Set(parsed.map((c: any) => String(c?.name ?? '')).filter(Boolean));
      }
    } catch { /* metadata is opaque text — skip validation */ }

    const checkColumns = (out: NLQueryOutput): string[] => {
      if (!validColumns) return [];
      const bad: string[] = [];
      if (!validColumns.has(out.xAxis)) bad.push(out.xAxis);
      if (!validColumns.has(out.yAxis)) bad.push(out.yAxis);
      (out.extraSeries || []).forEach(c => { if (!validColumns!.has(c)) bad.push(c); });
      return bad;
    };

    const callOpts = { config: { maxOutputTokens: 500 } };
    let first;
    try {
      first = await nlQueryPrompt(cleaned, callOpts);
    } catch {
      first = await nlQueryPrompt(cleaned, callOpts);
    }
    let output = first.output;
    if (!output) throw new Error('AI returned empty response for naturalLanguageQuery');

    const invalid = checkColumns(output);
    if (invalid.length > 0) {
      // One corrective retry with the exact valid columns listed
      const validList = Array.from(validColumns!).join(', ');
      const retryInput = {
        ...cleaned,
        query: `${cleaned.query}\n\n[System correction: the previous response referenced unknown columns: ${invalid.join(', ')}. Use ONLY these columns: ${validList}]`,
      };
      const retry = await nlQueryPrompt(retryInput, callOpts);
      if (retry.output && checkColumns(retry.output).length === 0) {
        output = retry.output;
      }
      // If retry still bad, return whichever has fewer invalid columns; downstream
      // ChartPanel has its own fallback that swaps in a sensible default.
    }

    return output;
  }
);