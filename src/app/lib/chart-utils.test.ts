import { describe, it, expect } from 'vitest';
import {
  aggregateByCategory,
  aggregateMultipleByCategory,
  prepareChartData,
  isNumericColumn,
  isCategoricalColumn,
  autoDetectVisualizations,
} from './chart-utils';

describe('aggregateByCategory', () => {
  const data = [
    { region: 'N', value: 10 },
    { region: 'N', value: 20 },
    { region: 'S', value: 30 },
  ];

  it('sums by default', () => {
    const out = aggregateByCategory(data, 'region', 'value');
    expect(out).toEqual([
      { region: 'N', value: 30 },
      { region: 'S', value: 30 },
    ]);
  });

  it('computes avg', () => {
    const out = aggregateByCategory(data, 'region', 'value', 'avg');
    expect(out.find(r => r.region === 'N')?.value).toBe(15);
  });
});

describe('aggregateMultipleByCategory', () => {
  it('aggregates multiple value columns per category', () => {
    const data = [
      { region: 'N', rev: 100, cost: 60 },
      { region: 'N', rev: 50, cost: 30 },
      { region: 'S', rev: 200, cost: 120 },
    ];
    const out = aggregateMultipleByCategory(data, 'region', ['rev', 'cost'], 'sum');
    expect(out).toContainEqual({ region: 'N', rev: 150, cost: 90 });
    expect(out).toContainEqual({ region: 'S', rev: 200, cost: 120 });
  });

  it('treats non-numeric values per-column as missing (no NaN poisoning)', () => {
    const data = [
      { c: 'A', v1: 10, v2: 'oops' },
      { c: 'A', v1: 20, v2: 5 },
    ];
    const out = aggregateMultipleByCategory(data, 'c', ['v1', 'v2'], 'sum');
    expect(out[0].v1).toBe(30);
    expect(out[0].v2).toBe(5); // 'oops' skipped, only 5 counted
  });
});

describe('prepareChartData', () => {
  const data = Array.from({ length: 30 }, (_, i) => ({ cat: `c${i % 3}`, val: i + 1 }));

  it('aggregates for bar charts with many points', () => {
    const out = prepareChartData(data, 'bar_chart', 'cat', 'val');
    // 3 unique categories after aggregation
    expect(out).toHaveLength(3);
  });

  it('returns aggregated multi-series for stacked_bar', () => {
    const dataMulti = [
      { cat: 'A', a: 1, b: 2 },
      { cat: 'A', a: 3, b: 4 },
      { cat: 'B', a: 5, b: 6 },
    ];
    const out = prepareChartData(dataMulti, 'stacked_bar', 'cat', 'a', ['b']);
    expect(out).toContainEqual({ cat: 'A', a: 4, b: 6 });
    expect(out).toContainEqual({ cat: 'B', a: 5, b: 6 });
  });

  it('caps pie chart to top 10 categories', () => {
    const wide = Array.from({ length: 50 }, (_, i) => ({ cat: `c${i}`, val: i + 1 }));
    const out = prepareChartData(wide, 'pie_chart', 'cat', 'val');
    expect(out).toHaveLength(10);
  });

  it('filters non-numeric points for scatter plots', () => {
    const mixed = [
      { x: 1, y: 2 },
      { x: 'oops', y: 3 },
      { x: 5, y: 6 },
    ];
    const out = prepareChartData(mixed, 'scatter_plot', 'x', 'y');
    expect(out).toHaveLength(2);
  });
});

describe('isNumericColumn / isCategoricalColumn', () => {
  it('detects numeric column', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ x: i }));
    expect(isNumericColumn(data, 'x')).toBe(true);
  });

  it('detects categorical column', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ x: `c${i % 5}` }));
    expect(isCategoricalColumn(data, 'x')).toBe(true);
    expect(isNumericColumn(data, 'x')).toBe(false);
  });
});

describe('autoDetectVisualizations', () => {
  it('returns at least one recommendation for non-empty metadata', () => {
    const meta = [
      { name: 'region', dataType: 'string', isCategorical: true, isNumerical: false, isTemporal: false, uniqueValuesCount: 4 },
      { name: 'revenue', dataType: 'number', isCategorical: false, isNumerical: true, isTemporal: false, min: 0, max: 100 },
    ];
    const { recommendations } = autoDetectVisualizations(meta);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(9);
  });

  it('does not produce duplicate (type, columns) pairs', () => {
    const meta = [
      { name: 'cat', dataType: 'string', isCategorical: true, isNumerical: false, isTemporal: false, uniqueValuesCount: 4 },
      { name: 'val', dataType: 'number', isCategorical: false, isNumerical: true, isTemporal: false, min: 0, max: 100 },
    ];
    const { recommendations } = autoDetectVisualizations(meta);
    const keys = recommendations.map(r => `${r.type}::${r.columnsUsed.join('|')}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
