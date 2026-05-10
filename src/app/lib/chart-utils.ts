'use client';

// Chart data transformation utilities

export interface DataPoint {
  [key: string]: any;
}

/**
 * Aggregate data by a category column, computing sum, avg, count for numeric columns
 */
export function aggregateByCategory(
  data: DataPoint[],
  categoryCol: string,
  valueCol: string,
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
): DataPoint[] {
  const groups: Record<string, number[]> = {};
  
  data.forEach(row => {
    const key = String(row[categoryCol] ?? 'Unknown');
    const val = Number(row[valueCol]);
    if (!isNaN(val)) {
      if (!groups[key]) groups[key] = [];
      groups[key].push(val);
    }
  });

  return Object.entries(groups).map(([key, values]) => {
    let result: number;
    switch (aggregation) {
      case 'avg': result = values.reduce((a, b) => a + b, 0) / values.length; break;
      case 'count': result = values.length; break;
      case 'min': result = Math.min(...values); break;
      case 'max': result = Math.max(...values); break;
      default: result = values.reduce((a, b) => a + b, 0);
    }
    return { [categoryCol]: key, [valueCol]: Math.round(result * 100) / 100 };
  });
}

/**
 * Pivot data: rows become grouped by xAxis, with multiple series (yAxis values)
 */
export function pivotData(
  data: DataPoint[],
  groupCol: string,
  categoryCol: string,
  valueCol: string,
  aggregation: 'sum' | 'avg' | 'count' = 'sum'
): DataPoint[] {
  const groups: Record<string, Record<string, number[]>> = {};
  
  data.forEach(row => {
    const groupKey = String(row[groupCol] ?? 'Unknown');
    const catKey = String(row[categoryCol] ?? 'Unknown');
    const val = Number(row[valueCol]);
    
    if (isNaN(val)) return;
    
    if (!groups[groupKey]) groups[groupKey] = {};
    if (!groups[groupKey][catKey]) groups[groupKey][catKey] = [];
    groups[groupKey][catKey].push(val);
  });

  return Object.entries(groups).map(([groupKey, cats]) => {
    const point: DataPoint = { [groupCol]: groupKey };
    Object.entries(cats).forEach(([catKey, values]) => {
      let result: number;
      switch (aggregation) {
        case 'avg': result = values.reduce((a, b) => a + b, 0) / values.length; break;
        case 'count': result = values.length; break;
        default: result = values.reduce((a, b) => a + b, 0);
      }
      point[catKey] = Math.round(result * 100) / 100;
    });
    return point;
  });
}

/**
 * Safely get numeric values from a column
 */
export function getNumericValues(data: DataPoint[], column: string): number[] {
  return data
    .map(row => Number(row[column]))
    .filter(v => !isNaN(v) && isFinite(v));
}

/**
 * Compute basic statistics for a numeric column
 */
export function computeStats(data: DataPoint[], column: string) {
  const values = getNumericValues(data, column);
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    count: values.length,
    sum: Math.round(sum * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: Math.round(stdDev * 100) / 100,
    q1: sorted[Math.floor(values.length * 0.25)],
    q3: sorted[Math.floor(values.length * 0.75)],
  };
}

/**
 * Get unique categorical values from a column
 */
export function getUniqueValues(data: DataPoint[], column: string): string[] {
  const set = new Set<string>();
  data.forEach(row => {
    if (row[column] !== undefined && row[column] !== null) {
      set.add(String(row[column]));
    }
  });
  return Array.from(set);
}

/**
 * Prepare data for a specific chart type with safe fallbacks
 */
export function prepareChartData(
  data: DataPoint[],
  chartType: string,
  xAxis: string,
  yAxis: string,
  extraSeries?: string[]
): DataPoint[] {
  if (!data || data.length === 0) return [];
  
  const safeData = data.slice(0, 100);
  
  switch (chartType) {
    case 'pie_chart': {
      // Aggregate by category, max 8 slices
      const aggregated = aggregateByCategory(safeData, xAxis, yAxis, 'sum');
      return aggregated.slice(0, 8);
    }
    
    case 'bar_chart':
    case 'area_chart': {
      // Aggregate if too many rows
      if (safeData.length > 30) {
        return aggregateByCategory(safeData, xAxis, yAxis, 'sum');
      }
      return safeData;
    }
    
    case 'stacked_bar': {
      if (safeData.length > 30) {
        const allCols = [yAxis, ...(extraSeries || [])];
        // Aggregate first series, then add others
        const base = aggregateByCategory(safeData, xAxis, yAxis, 'sum');
        const extras = allCols.slice(1).map(col => aggregateByCategory(safeData, xAxis, col, 'sum'));
        
        return base.map((row, i) => {
          const merged = { ...row };
          extras.forEach((extra, j) => {
            if (extra[i]) {
              merged[allCols[j + 1]] = extra[i][allCols[j + 1]];
            }
          });
          return merged;
        });
      }
      return safeData;
    }
    
    case 'radar_chart': {
      return safeData.slice(0, 10);
    }
    
    case 'scatter_plot': {
      // Ensure both axes are numeric
      return safeData.filter(row => 
        !isNaN(Number(row[xAxis])) && !isNaN(Number(row[yAxis]))
      ).slice(0, 100);
    }
    
    case 'line_graph':
    case 'composed_chart': {
      if (safeData.length > 50) {
        return aggregateByCategory(safeData, xAxis, yAxis, 'avg');
      }
      return safeData;
    }
    
    default:
      return safeData;
  }
}

/**
 * Determine if a column contains numeric data
 */
export function isNumericColumn(data: DataPoint[], column: string): boolean {
  if (!data || data.length === 0) return false;
  const sample = data.slice(0, 20);
  const numericCount = sample.filter(row => !isNaN(Number(row[column])) && row[column] !== '').length;
  return numericCount / sample.length > 0.7;
}

/**
 * Determine if a column is categorical (low cardinality string)
 */
export function isCategoricalColumn(data: DataPoint[], column: string): boolean {
  if (!data || data.length === 0) return false;
  const unique = getUniqueValues(data, column);
  return unique.length < data.length * 0.5 && unique.length <= 50;
}

/**
 * Auto-detect visualization recommendations from column metadata without AI.
 * Used as a fallback when the Gemini AI service is unavailable.
 */
export function autoDetectVisualizations(
  metadata: Array<{
    name: string;
    dataType: string;
    isCategorical: boolean;
    isNumerical: boolean;
    isTemporal: boolean;
    uniqueValuesCount?: number;
    min?: number;
    max?: number;
  }>
): { recommendations: Array<{ type: string; title: string; explanation: string; columnsUsed: string[] }> } {
  const categorical = metadata.filter(m => m.isCategorical);
  const numeric = metadata.filter(m => m.isNumerical);
  const temporal = metadata.filter(m => m.isTemporal);
  const lowCardinality = categorical.filter(m => (m.uniqueValuesCount ?? 100) <= 12);

  const recommendations: Array<{ type: string; title: string; explanation: string; columnsUsed: string[] }> = [];

  // Pick the best category column (prefer low cardinality)
  const categoryCol = lowCardinality[0] || categorical[0];
  // Pick the first numeric column
  const valueCol = numeric[0];
  // Pick temporal column for time-series
  const timeCol = temporal[0];

  if (!categoryCol && !valueCol && !timeCol) {
    // No suitable columns — return at least one fallback using whatever exists
    if (metadata.length > 0) {
      recommendations.push({
        type: 'gauge_kpi',
        title: `Overview of ${metadata[0].name}`,
        explanation: 'Single value overview of the first available column.',
        columnsUsed: [metadata[0].name],
      });
    }
    return { recommendations };
  }

  const catName = categoryCol?.name || (metadata.find(m => !m.isNumerical)?.name ?? metadata[0].name);
  const valName = valueCol?.name || (metadata.find(m => m.isNumerical)?.name ?? metadata[0].name);
  const timeName = timeCol?.name || catName;

  // 1. Bar chart — most universal
  if (catName && valName) {
    recommendations.push({
      type: 'bar_chart',
      title: `${valName} by ${catName}`,
      explanation: `Shows the distribution of ${valName} across different ${catName} categories.`,
      columnsUsed: [catName, valName],
    });
  }

  // 2. Line graph — prefer temporal axis
  const xAxisLine = timeCol ? timeName : catName;
  if (xAxisLine && valName) {
    recommendations.push({
      type: 'line_graph',
      title: `${valName} Trend`,
      explanation: `Displays how ${valName} changes over ${timeCol ? 'time' : catName}.`,
      columnsUsed: [xAxisLine, valName],
    });
  }

  // 3. Pie chart — only if low-cardinality category
  if (lowCardinality.length > 0 && valName) {
    recommendations.push({
      type: 'pie_chart',
      title: `${valName} Distribution by ${lowCardinality[0].name}`,
      explanation: `Shows proportional share of ${valName} per ${lowCardinality[0].name}.`,
      columnsUsed: [lowCardinality[0].name, valName],
    });
  }

  // 4. Scatter plot — if 2+ numeric columns
  if (numeric.length >= 2) {
    recommendations.push({
      type: 'scatter_plot',
      title: `${numeric[0].name} vs ${numeric[1].name}`,
      explanation: `Explores the relationship between ${numeric[0].name} and ${numeric[1].name}.`,
      columnsUsed: [numeric[0].name, numeric[1].name],
    });
  }

  // 5. Area chart
  if (xAxisLine && valName) {
    recommendations.push({
      type: 'area_chart',
      title: `${valName} Area`,
      explanation: `Visualizes the cumulative volume of ${valName} over ${xAxisLine}.`,
      columnsUsed: [xAxisLine, valName],
    });
  }

  // 6. Horizontal bar
  if (catName && valName) {
    recommendations.push({
      type: 'horizontal_bar',
      title: `${valName} by ${catName} (Horizontal)`,
      explanation: `Side-by-side comparison of ${valName} across ${catName}.`,
      columnsUsed: [catName, valName],
    });
  }

  // 7. Stacked bar — if 2+ numeric columns
  if (categoryCol && numeric.length >= 2) {
    const extraCols = numeric.slice(1, 4).map(n => n.name);
    recommendations.push({
      type: 'stacked_bar',
      title: `Multiple Metrics by ${catName}`,
      explanation: `Compares multiple numeric measures stacked by ${catName}.`,
      columnsUsed: [catName, numeric[0].name, ...extraCols],
    });
  }

  // 8. Donut chart — if low-cardinality
  if (lowCardinality.length > 0 && valName) {
    recommendations.push({
      type: 'donut_chart',
      title: `${valName} Share by ${lowCardinality[0].name}`,
      explanation: `Ring chart showing proportional breakdown of ${valName}.`,
      columnsUsed: [lowCardinality[0].name, valName],
    });
  }

  // 9. Radar chart — if 2+ numeric
  if (categoryCol && numeric.length >= 2) {
    recommendations.push({
      type: 'radar_chart',
      title: `Multi-Metric Radar by ${catName}`,
      explanation: `Compares key numeric dimensions across ${catName} in a radar format.`,
      columnsUsed: [catName, numeric[0].name, numeric[1].name],
    });
  }

  // 10. Treemap
  if (catName && valName) {
    recommendations.push({
      type: 'treemap_chart',
      title: `${valName} Treemap by ${catName}`,
      explanation: `Hierarchical proportional view of ${valName} grouped by ${catName}.`,
      columnsUsed: [catName, valName],
    });
  }

  // 11. Histogram — single numeric
  if (valName) {
    recommendations.push({
      type: 'histogram',
      title: `${valName} Distribution`,
      explanation: `Shows the frequency distribution of ${valName} values.`,
      columnsUsed: [catName || valName, valName],
    });
  }

  // 12. Gauge / KPI
  if (valName) {
    recommendations.push({
      type: 'gauge_kpi',
      title: `Average ${valName}`,
      explanation: `Displays the average ${valName} as a key performance indicator.`,
      columnsUsed: [valName],
    });
  }

  // 13. Forecast chart — prefer temporal
  if (timeCol && valName) {
    recommendations.push({
      type: 'forecast_chart',
      title: `${valName} Forecast`,
      explanation: `Projects future ${valName} values using linear regression.`,
      columnsUsed: [timeCol.name, valName],
    });
  }

  // 14. Box plot — multiple numeric
  if (numeric.length >= 2) {
    recommendations.push({
      type: 'box_plot',
      title: 'Numeric Distributions Comparison',
      explanation: `Compares the spread and outliers of numeric columns.`,
      columnsUsed: [numeric[0].name, ...numeric.slice(1, 5).map(n => n.name)],
    });
  }

  // 15. Composed chart — bar + line
  if (categoryCol && numeric.length >= 2) {
    recommendations.push({
      type: 'composed_chart',
      title: `${numeric[0].name} & ${numeric[1].name} by ${catName}`,
      explanation: `Combines bar and line to show ${numeric[0].name} (bars) and ${numeric[1].name} (line) by ${catName}.`,
      columnsUsed: [catName, numeric[0].name, numeric[1].name],
    });
  }

  // 16. Waterfall — if category exists
  if (catName && valName) {
    recommendations.push({
      type: 'waterfall_chart',
      title: `${valName} Waterfall by ${catName}`,
      explanation: `Shows cumulative positive/negative changes in ${valName} across ${catName}.`,
      columnsUsed: [catName, valName],
    });
  }

  // Cap at 9 recommendations to keep dashboard clean
  return { recommendations: recommendations.slice(0, 9) };
}
