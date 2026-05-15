import { z } from 'zod';

/**
 * Single source of truth for chart types supported across:
 *  - AI flows (recommendVisualizations, naturalLanguageQuery)
 *  - chart renderer switch
 *  - chart-data preparation
 *
 * When you add a new chart type, add it here, then handle it in:
 *  - src/components/charts/ChartRenderer.tsx (renderer switch)
 *  - src/app/lib/chart-utils.ts (prepareChartData)
 *  - The prompt body of `recommendVisualizationsPrompt` (column rules)
 */
export const CHART_TYPES = [
  'bar_chart',
  'line_graph',
  'scatter_plot',
  'pie_chart',
  'area_chart',
  'radar_chart',
  'composed_chart',
  'stacked_bar',
  'donut_chart',
  'radial_bar',
  'horizontal_bar',
  'grouped_bar',
  'stacked_area',
  'bubble_chart',
  'multi_bar',
  'treemap_chart',
  'box_plot',
  'waterfall_chart',
  'histogram',
  'gauge_kpi',
  'forecast_chart',
  'distribution',
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

export const ChartTypeSchema = z.enum(CHART_TYPES);
