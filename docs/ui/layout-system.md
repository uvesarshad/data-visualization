# Layout System

> **Scope:** Layout hierarchy and composition. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

The app uses a single root layout wrapping a single page. The page contains a three-panel layout: sidebar, main content area, and insights panel.

## Root Layout

- **File:** `src/app/layout.tsx`
- **Wraps:** All pages (only one: `/`)
- **Provides:** ThemeProvider (next-themes), Toaster, Google Fonts (Inter, Space Grotesk)
- **Rendering:** Server Component (no `'use client'` directive)
- **AGENT NOTE:** Do not add `'use client'` to layout.tsx. Fonts require server rendering via next/font.

## Page Layout (src/app/page.tsx)

The dashboard page uses a flex layout with three horizontal sections:

1. **Sidebar** (w-16): Icon buttons for navigation, data operations, theme toggle
2. **Main Content** (flex-1): Header bar + scrollable content area with NL query, stats, charts grid, data table
3. **Insights Panel** (w-[380px]): AI insights, key findings, predictions

When no data is loaded, a centered upload screen replaces the three-panel layout.

## Chart Grid

Charts displayed in responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. First chart gets `xl:col-span-2` (double width).

## Related Docs

- [docs/ui/theming.md] — How theming applies to layouts
- [docs/modules/chart-rendering.md] — Chart components within the layout