# Environment Variables

> **Scope:** All environment variables and configuration. **Rendering context:** Server **Last updated:** 2026-05-10

## Overview

The project has minimal environment configuration. One required server-side variable for the Gemini API key.

## Environment Variables

| Variable | Required | Server/Client | Purpose |
|----------|----------|---------------|---------|
| `GOOGLE_GENAI_API_KEY` | Yes | Server only | Google AI API key for Gemini. Used by Genkit flows in `src/ai/genkit.ts`. |

AGENT NOTE: No `NEXT_PUBLIC_` prefixed variables exist. The API key is never exposed to the client.

## .env Files

- `.env` — Main environment file (gitignored)
- `.env.local` — Local overrides (gitignored)

## How the API Key is Used

1. `src/ai/genkit.ts` initializes the Genkit AI instance with `googleAI()` plugin
2. The `@genkit-ai/google-genai` plugin reads `GOOGLE_GENAI_API_KEY` from the environment
3. All 7 server actions in `src/ai/flows/` use this instance

AGENT AVOID: Never add `NEXT_PUBLIC_` to the API key. It must remain server-only.

## Related Docs

- [docs/api/ai-flows.md] — How flows use the AI instance
- [docs/infra/build-and-deploy.md] — Build configuration