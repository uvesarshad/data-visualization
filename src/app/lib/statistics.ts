'use client';

// Statistical analysis utilities

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

export interface MovingAverageResult {
  values: (number | null)[];
  window: number;
}

export interface PercentileResult {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
}

export interface BoxPlotData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  outliers: number[];
  lowerFence: number;
  upperFence: number;
}

export interface CorrelationResult {
  column1: string;
  column2: string;
  coefficient: number;
  strength: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong';
  direction: 'positive' | 'negative' | 'none';
}

/**
 * Simple Moving Average
 */
export function movingAverage(data: number[], window: number = 3): MovingAverageResult {
  const values: (number | null)[] = data.map((_, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
  return { values, window };
}

/**
 * Exponential Moving Average
 */
export function exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(alpha * data[i] + (1 - alpha) * ema[i - 1]);
  }
  return ema;
}

/**
 * Linear regression
 */
export function linearRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length;
  if (n === 0 || n !== y.length) {
    return { slope: 0, intercept: 0, rSquared: 0, predictions: [] };
  }

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, predictions: Array(n).fill(sumY / n) };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const predictions = x.map(xi => slope * xi + intercept);
  
  const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - predictions[i], 2), 0);
  const meanY = sumY / n;
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return {
    slope: Math.round(slope * 10000) / 10000,
    intercept: Math.round(intercept * 10000) / 10000,
    rSquared: Math.round(rSquared * 10000) / 10000,
    predictions: predictions.map(p => Math.round(p * 100) / 100),
  };
}

/**
 * Pearson correlation coefficient
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return Math.round((numerator / denominator) * 10000) / 10000;
}

/**
 * Compute correlation matrix for all numeric columns
 */
export function correlationMatrix(
  data: Record<string, any>[],
  numericColumns: string[]
): CorrelationResult[] {
  const results: CorrelationResult[] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      const x = data.map(row => Number(row[col1])).filter(v => !isNaN(v));
      const y = data.map(row => Number(row[col2])).filter(v => !isNaN(v));
      const r = pearsonCorrelation(x, y);
      const absR = Math.abs(r);

      results.push({
        column1: col1,
        column2: col2,
        coefficient: r,
        strength: absR >= 0.8 ? 'very strong' : absR >= 0.6 ? 'strong' : absR >= 0.4 ? 'moderate' : absR >= 0.2 ? 'weak' : 'very weak',
        direction: r > 0.1 ? 'positive' : r < -0.1 ? 'negative' : 'none',
      });
    }
  }

  return results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

/**
 * Compute percentiles
 */
export function computePercentiles(sortedValues: number[]): PercentileResult {
  if (sortedValues.length === 0) {
    return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, iqr: 0, lowerFence: 0, upperFence: 0, outliers: [] };
  }

  const sorted = [...sortedValues].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p: number) => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
  };

  const p10 = getPercentile(10);
  const p25 = getPercentile(25);
  const p50 = getPercentile(50);
  const p75 = getPercentile(75);
  const p90 = getPercentile(90);
  const iqr = p75 - p25;
  const lowerFence = p25 - 1.5 * iqr;
  const upperFence = p75 + 1.5 * iqr;
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

  return {
    p10: Math.round(p10 * 100) / 100,
    p25: Math.round(p25 * 100) / 100,
    p50: Math.round(p50 * 100) / 100,
    p75: Math.round(p75 * 100) / 100,
    p90: Math.round(p90 * 100) / 100,
    iqr: Math.round(iqr * 100) / 100,
    lowerFence: Math.round(lowerFence * 100) / 100,
    upperFence: Math.round(upperFence * 100) / 100,
    outliers,
  };
}

/**
 * Compute box plot data for a numeric column
 */
export function computeBoxPlot(values: number[]): BoxPlotData {
  const sorted = [...values].filter(v => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0, outliers: [], lowerFence: 0, upperFence: 0 };
  }

  const percentiles = computePercentiles(sorted);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;

  // Whiskers extend to the furthest non-outlier data point
  const nonOutliers = sorted.filter(v => v >= percentiles.lowerFence && v <= percentiles.upperFence);
  const whiskerMin = nonOutliers.length > 0 ? nonOutliers[0] : percentiles.p25;
  const whiskerMax = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : percentiles.p75;

  return {
    min: Math.round(whiskerMin * 100) / 100,
    q1: percentiles.p25,
    median: percentiles.p50,
    q3: percentiles.p75,
    max: Math.round(whiskerMax * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    outliers: percentiles.outliers,
    lowerFence: percentiles.lowerFence,
    upperFence: percentiles.upperFence,
  };
}

/**
 * Compute histogram bins
 */
export function computeHistogram(
  values: number[],
  binCount: number = 10
): { bins: { min: number; max: number; count: number; label: string }[]; mean: number; stdDev: number } {
  const valid = values.filter(v => !isNaN(v));
  if (valid.length === 0) return { bins: [], mean: 0, stdDev: 0 };

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const binWidth = range / binCount;

  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / valid.length;
  const stdDev = Math.sqrt(variance);

  const bins = Array.from({ length: binCount }, (_, i) => {
    const binMin = min + i * binWidth;
    const binMax = binMin + binWidth;
    const count = valid.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;
    return {
      min: Math.round(binMin * 100) / 100,
      max: Math.round(binMax * 100) / 100,
      count,
      label: `${Math.round(binMin)}-${Math.round(binMax)}`,
    };
  });

  return { bins, mean: Math.round(mean * 100) / 100, stdDev: Math.round(stdDev * 100) / 100 };
}

/**
 * Generate normal distribution curve points for overlay
 */
export function normalDistributionPoints(
  mean: number,
  stdDev: number,
  min: number,
  max: number,
  points: number = 50
): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  const step = (max - min) / points;
  
  for (let i = 0; i <= points; i++) {
    const x = min + i * step;
    const z = (x - mean) / stdDev;
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    result.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 10000) / 10000 });
  }

  return result;
}

/**
 * Detect anomalies using IQR method
 */
export function detectAnomalies(values: number[]): { normal: number[]; anomalies: number[]; threshold: { lower: number; upper: number } } {
  const sorted = [...values].filter(v => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length < 4) {
    return { normal: sorted, anomalies: [], threshold: { lower: sorted[0] || 0, upper: sorted[sorted.length - 1] || 0 } };
  }

  const percentiles = computePercentiles(sorted);
  const anomalies = sorted.filter(v => v < percentiles.lowerFence || v > percentiles.upperFence);
  const normal = sorted.filter(v => v >= percentiles.lowerFence && v <= percentiles.upperFence);

  return {
    normal,
    anomalies,
    threshold: { lower: percentiles.lowerFence, upper: percentiles.upperFence },
  };
}

/**
 * Simple time-series forecast using linear extrapolation
 */
export function forecastLinear(
  values: number[],
  periods: number = 3
): { forecast: number[]; confidence: { lower: number[]; upper: number[] } } {
  if (values.length < 2) {
    return { forecast: Array(periods).fill(values[0] || 0), confidence: { lower: Array(periods).fill(0), upper: Array(periods).fill(0) } };
  }

  const x = values.map((_, i) => i);
  const regression = linearRegression(x, values);
  
  const residuals = values.map((v, i) => v - regression.predictions[i]);
  const residualStd = Math.sqrt(residuals.reduce((acc, r) => acc + r * r, 0) / residuals.length);

  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];

  for (let i = 0; i < periods; i++) {
    const xVal = values.length + i;
    const pred = regression.slope * xVal + regression.intercept;
    forecast.push(Math.round(pred * 100) / 100);
    const margin = 1.96 * residualStd * Math.sqrt(1 + 1/values.length);
    lower.push(Math.round((pred - margin) * 100) / 100);
    upper.push(Math.round((pred + margin) * 100) / 100);
  }

  return { forecast, confidence: { lower, upper } };
}