# Component Library

> **Scope:** Every shared UI component with props summary. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

The project uses shadcn/ui components built on Radix UI primitives, plus custom dashboard-specific components. All UI components are client-side.

## UI Primitives (src/components/ui/)

| Component | File | Purpose |
|-----------|------|---------|
| Button | `button.tsx` | Button with variants (default, destructive, outline, secondary, ghost, link) and sizes |
| Card | `card.tsx` | Container with Header, Title, Description, Content, Footer |
| Table | `table.tsx` | HTML table with Header, Body, Footer, Row, Head, Cell |
| Badge | `badge.tsx` | Small label with variants (default, secondary, destructive, outline) |
| Tabs | `tabs.tsx` | Tabbed interface with List, Trigger, Content |
| Dialog | `dialog.tsx` | Modal dialog with Header, Footer, Title, Description, Close |
| ScrollArea | `scroll-area.tsx` | Custom scrollbar container |
| Separator | `separator.tsx` | Horizontal or vertical divider |
| Select | `select.tsx` | Dropdown select with Trigger, Content, Item, Group |
| Toast | `toast.tsx` | Notification toast with variants |
| Tooltip | `tooltip.tsx` | Hover tooltip with Provider, Trigger, Content |
| Popover | `popover.tsx` | Floating panel with Trigger, Content |
| Slider | `slider.tsx` | Range slider input |
| Switch | `switch.tsx` | Toggle switch |
| Checkbox | `checkbox.tsx` | Checkbox input |
| Label | `label.tsx` | Form label |
| Input | `input.tsx` | Text input |
| Textarea | `textarea.tsx` | Multi-line text input |
| Calendar | `calendar.tsx` | Date picker calendar using react-day-picker v9 |
| Accordion | `accordion.tsx` | Collapsible sections |
| AlertDialog | `alert-dialog.tsx` | Confirmation dialog |
| Avatar | `avatar.tsx` | User avatar image |
| Collapsible | `collapsible.tsx` | Expandable content |
| DropdownMenu | `dropdown-menu.tsx` | Context menu |
| Menubar | `menubar.tsx` | Application menu bar |
| Progress | `progress.tsx` | Progress bar |
| RadioGroup | `radio-group.tsx` | Radio button group |
| ChartContainer | `chart.tsx` | Recharts wrapper with CSS variable theming |
| ChartTooltipContent | `chart.tsx` | Custom tooltip for Recharts charts |
| ChartLegendContent | `chart.tsx` | Custom legend for Recharts charts |

## Dashboard Components (src/components/dashboard/)

| Component | File | Purpose |
|-----------|------|---------|
| ChartPanel | `ChartPanel.tsx` | Self-contained chart card with data prep, stats, and dynamic renderer |
| ChartSkeleton | `ChartSkeleton.tsx` | Loading skeleton for dynamic chart imports |
| ChartAnalysisDialog | `ChartAnalysisDialog.tsx` | Modal showing AI analysis of a single chart |
| InsightsPanel | `InsightsPanel.tsx` | Right sidebar displaying AI insights, findings, predictions |
| NLQueryBar | `NLQueryBar.tsx` | Natural language query input with suggestions |
| ReportDialog | `ReportDialog.tsx` | Full dialog for AI-generated executive reports |
| DataProfiler | `DataProfiler.tsx` | Column-level data profile overlay |
| StatsOverview | `StatsOverview.tsx` | Top-level dataset statistics cards |
| VirtualizedTable | `VirtualizedTable.tsx` | Virtualized data table using @tanstack/react-virtual |

## Chart Components (src/components/charts/)

| Component | File | Purpose |
|-----------|------|---------|
| ChartRenderer | `ChartRenderer.tsx` | Renders all 22 Recharts chart types (dynamically imported) |
| TreemapContent | `ChartRenderer.tsx` | Custom SVG content renderer for Treemap charts |

## Upload Components (src/components/upload/)

| Component | File | Purpose |
|-----------|------|---------|
| DataUploader | `DataUploader.tsx` | Drag-and-drop file upload with sample dataset selection |

## Related Docs

- [docs/ui/layout-system.md] — How components are composed in layouts
- [docs/ui/theming.md] — Styling approach