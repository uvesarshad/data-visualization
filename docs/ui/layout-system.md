# Layout System

> **Scope:** Layout hierarchy and composition. **Rendering context:** Client **Last updated:** 2026-05-15

## Overview

The app uses a single root layout wrapping a single page. The dashboard uses a responsive three-panel layout on desktop, collapsing to sheet drawers on mobile.

## Root Layout

- **File:** `src/app/layout.tsx`
- **Wraps:** All pages (only one: `/`)
- **Provides:** ThemeProvider (next-themes), Toaster, Google Fonts (Inter, Space Grotesk)
- **Rendering:** Server Component (no `'use client'` directive)

AGENT NOTE: Do not add `'use client'` to layout.tsx. Fonts require server rendering via next/font.

## Page Layout (src/app/page.tsx)

### Desktop (≥ lg breakpoint)

Three-panel horizontal flex layout with `h-screen overflow-hidden` on the root:

1. **Sidebar** (`hidden lg:flex`, narrow column): Icon buttons for navigation, data ops, theme toggle
2. **Main Content** (`flex-1 overflow-y-auto`): Header + NL query bar + stats + chart grid + data table
3. **Insights Aside** (`hidden lg:flex w-[320px] xl:w-[380px]`): AI insights panel + key findings + predictions

### Mobile (< lg breakpoint)

The sidebar and insights panel are hidden; two Sheet drawers replace them:

- **Navigation Sheet** — triggered by hamburger icon in the header; contains sidebar nav links
- **Insights Sheet** — triggered by brain icon in the header; contains the AI insights panel

The main content area is the only visible panel on mobile and scrolls normally.

### Upload Screen

When no data is loaded, the three-panel layout is replaced by a centered upload screen (`DataUploader`). The sidebar remains visible but most actions are disabled.

## Auth Gate

When `DATASENSE_API_TOKEN` is configured and the user is not authenticated:
- `LoginDialog` (`src/components/auth/LoginDialog.tsx`) renders as a non-dismissible modal
- The rest of the UI is blocked until authentication succeeds
- Auth state is checked on mount via `GET /api/auth/me`

## PII Consent Banner

`PIIConsentBanner` (`src/components/dashboard/PIIConsentBanner.tsx`) appears as a fixed bottom-right banner on first visit. Acknowledged state persisted in `localStorage` (key: `datasense:pii-consent-ack-v1`). Can be suppressed with `NEXT_PUBLIC_DATASENSE_DISABLE_PII_BANNER`.

## Chart Grid

Charts displayed in responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. First chart gets `xl:col-span-2` (double width).

## Related Docs

- [docs/ui/theming.md] — How theming applies to layouts
- [docs/modules/chart-rendering.md] — Chart components within the layout
- [docs/architecture/rendering-strategy.md] — Middleware, auth gate, and route structure
