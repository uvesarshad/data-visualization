# Environment Variables

> **Scope:** All environment variables and configuration. **Rendering context:** Server **Last updated:** 2026-05-15

## Overview

The project has minimal environment configuration. One required server-side variable for the Gemini API key, plus optional variables for auth and UI behavior.

## Environment Variables

| Variable | Required | Server/Client | Purpose |
|----------|----------|---------------|---------|
| `GOOGLE_GENAI_API_KEY` | One of three | Server only | Google AI API key for Gemini (preferred name). |
| `GOOGLE_API_KEY` | One of three | Server only | Alternative Gemini key name accepted by the `@genkit-ai/google-genai` plugin. |
| `GEMINI_API_KEY` | One of three | Server only | Third alternative Gemini key name. |
| `DATASENSE_API_TOKEN` | Optional | Server only | When set, enables the API auth gate in `middleware.ts`. If unset, all `/api/analyses` requests pass through (dev bypass). |
| `NEXT_PUBLIC_DATASENSE_DISABLE_PII_BANNER` | Optional | Client | Set to any truthy value to suppress the PII consent banner (e.g. for internal deployments). |

Only one Gemini key is needed — all three names are equivalent. `GOOGLE_GENAI_API_KEY` is the canonical name used in `.env.example`.

## .env Files

- `.env` — Main environment file (gitignored)
- `.env.local` — Local overrides (gitignored)
- `.env.example` — Committed template showing all accepted variable names

## How the API Key is Used

1. `src/ai/genkit.ts` initializes the Genkit instance with the `googleAI()` plugin
2. The `@genkit-ai/google-genai` plugin reads `GOOGLE_GENAI_API_KEY`, `GOOGLE_API_KEY`, or `GEMINI_API_KEY` from the environment (first match wins)
3. All 7 server actions in `src/ai/flows/` use this shared instance

AGENT AVOID: Never add `NEXT_PUBLIC_` to any Gemini API key. It must remain server-only.

## Auth Gate Setup

To enable the API auth gate:
1. Set `DATASENSE_API_TOKEN=<your-secret>` in `.env.local`
2. Restart the dev server
3. The `LoginDialog` will appear on first load; enter the token to set the `ds_auth` HttpOnly cookie

When `DATASENSE_API_TOKEN` is unset, the gate is disabled and all requests pass through with a console warning in development.

## Related Docs

- [docs/api/ai-flows.md] — How flows use the AI instance
- [docs/infra/build-and-deploy.md] — Build configuration
- [docs/architecture/rendering-strategy.md] — Middleware and auth gate details
