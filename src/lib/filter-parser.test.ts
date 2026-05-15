import { describe, it, expect } from 'vitest';
import { parseFilterExpression, applyFilter, filterData } from './filter-parser';

describe('parseFilterExpression', () => {
  it('parses equality with single-quoted value', () => {
    expect(parseFilterExpression("month = 'Jan'")).toEqual({ column: 'month', operator: '=', value: 'Jan' });
  });

  it('parses equality with unquoted value', () => {
    expect(parseFilterExpression('month = Jan')).toEqual({ column: 'month', operator: '=', value: 'Jan' });
  });

  it('parses == as =', () => {
    expect(parseFilterExpression('month == Jan')).toEqual({ column: 'month', operator: '=', value: 'Jan' });
  });

  it('parses != and <> as !=', () => {
    expect(parseFilterExpression('region != North')).toEqual({ column: 'region', operator: '!=', value: 'North' });
    expect(parseFilterExpression('region <> North')).toEqual({ column: 'region', operator: '!=', value: 'North' });
  });

  it('parses numeric comparisons', () => {
    expect(parseFilterExpression('revenue > 1000')).toEqual({ column: 'revenue', operator: '>', value: '1000' });
    expect(parseFilterExpression('revenue >= 1000')).toEqual({ column: 'revenue', operator: '>=', value: '1000' });
    expect(parseFilterExpression('revenue < 500')).toEqual({ column: 'revenue', operator: '<', value: '500' });
    expect(parseFilterExpression('revenue <= 500')).toEqual({ column: 'revenue', operator: '<=', value: '500' });
  });

  it('parses contains / not contains (case-insensitive)', () => {
    expect(parseFilterExpression('product contains shoe')).toEqual({ column: 'product', operator: 'contains', value: 'shoe' });
    expect(parseFilterExpression('Product Not Contains Shoe')).toEqual({ column: 'Product', operator: 'not_contains', value: 'Shoe' });
  });

  it('strips surrounding double quotes', () => {
    expect(parseFilterExpression('region != "North America"')).toEqual({ column: 'region', operator: '!=', value: 'North America' });
  });

  it('returns null for unparseable input', () => {
    expect(parseFilterExpression('')).toBeNull();
    expect(parseFilterExpression('just words')).toBeNull();
  });
});

describe('applyFilter', () => {
  const data = [
    { month: 'Jan', revenue: 100 },
    { month: 'Feb', revenue: 200 },
    { month: 'Mar', revenue: 50 },
  ];

  it('filters by string equality', () => {
    const filter = parseFilterExpression('month = Feb')!;
    expect(applyFilter(data, filter)).toEqual([{ month: 'Feb', revenue: 200 }]);
  });

  it('filters by numeric comparison', () => {
    const filter = parseFilterExpression('revenue > 75')!;
    expect(applyFilter(data, filter)).toHaveLength(2);
  });

  it('filters by contains (case-insensitive)', () => {
    const filter = parseFilterExpression('month contains ja')!;
    expect(applyFilter(data, filter)).toEqual([{ month: 'Jan', revenue: 100 }]);
  });

  it('returns nothing when filter column does not exist', () => {
    const filter = parseFilterExpression('nonexistent = anything')!;
    expect(applyFilter(data, filter)).toEqual([]);
  });
});

describe('filterData', () => {
  it('returns data unchanged when filter is empty', () => {
    const data = [{ a: 1 }];
    expect(filterData(data, undefined)).toEqual({ data, filter: null });
  });

  it('returns data unchanged when filter is unparseable', () => {
    const data = [{ a: 1 }];
    expect(filterData(data, 'gibberish')).toEqual({ data, filter: null });
  });
});
