// 5.3: Prompt token budgeting utility
// Estimates token count and truncates data if input exceeds threshold

/**
 * Rough token count estimator (4 chars ≈ 1 token for English text)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Maximum input tokens we'll send to the AI model
 * Gemini 2.5 Flash has 1M context, but we want to keep costs down
 */
export const MAX_INPUT_TOKENS = 8000;

/**
 * If the input text exceeds the token budget, truncate it
 */
export function truncateToTokenBudget(text: string, maxTokens: number = MAX_INPUT_TOKENS): string {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;
  
  // Truncate to approximately maxTokens * 4 characters, cutting at last newline
  const maxChars = maxTokens * 4;
  const truncated = text.substring(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  return lastNewline > maxChars * 0.8 ? truncated.substring(0, lastNewline) : truncated + '\n...(truncated for token budget)';
}