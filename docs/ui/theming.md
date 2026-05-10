# Theming

> **Scope:** CSS variables, Tailwind config, dark mode. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

The app uses Tailwind CSS with CSS custom properties for theming. Dark mode is the default, with light mode toggleable via next-themes.

## Tailwind Configuration

- **File:** `tailwind.config.ts`
- **Dark mode:** `['class']` (class-based toggling)
- **Font families:** `body: ['Inter']`, `headline: ['Space Grotesk']`, `code: ['monospace']`
- **Custom colors:** All semantic colors use CSS variables via `hsl(var(--name))`

## CSS Custom Properties

- **File:** `src/app/globals.css`
- **Pattern:** `--background`, `--foreground`, `--primary`, `--accent`, etc. defined in `:root` and `.dark`
- **Chart colors:** `--chart-1` through `--chart-5`

## Dark Mode

- **Provider:** `next-themes` via `src/components/theme-provider.tsx`
- **Default:** `dark`
- **Toggle:** Sun/Moon icon buttons in sidebar and upload screen
- **AGENT NOTE:** Both `<html>` and `<body>` have `suppressHydrationWarning` due to next-themes class injection.

## Font Loading

- **Inter:** Body text, loaded via `next/font/google`
- **Space Grotesk:** Headlines, loaded via `next/font/google`
- **CSS variables:** `--font-inter`, `--font-space-grotesk` applied to `<html>`

## Related Docs

- [docs/ui/component-library.md] — Components that use these styles
- [docs/ui/layout-system.md] — Layout structure