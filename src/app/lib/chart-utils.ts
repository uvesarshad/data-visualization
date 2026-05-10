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