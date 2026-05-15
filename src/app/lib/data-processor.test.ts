import { describe, it, expect } from 'vitest';
import { parseCSV, extractMetadata, detectColumnType } from './data-processor';

describe('parseCSV', () => {
  it('parses simple CSV with numeric coercion', () => {
    const csv = 'a,b\n1,foo\n2,bar';
    const rows = parseCSV(csv);
    expect(rows).toEqual([
      { a: 1, b: 'foo' },
      { a: 2, b: 'bar' },
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const csv = 'name,city\n"Acme, Inc","Brooklyn, NY"';
    const rows = parseCSV(csv);
    expect(rows).toEqual([{ name: 'Acme, Inc', city: 'Brooklyn, NY' }]);
  });

  it('handles escaped double quotes', () => {
    const csv = 'note\n"She said ""hi"""';
    const rows = parseCSV(csv);
    expect(rows).toEqual([{ note: 'She said "hi"' }]);
  });

  it('strips the UTF-8 BOM from the first header', () => {
    const csv = '﻿id,name\n1,foo';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0])).toEqual(['id', 'name']);
  });

  it('does NOT coerce whitespace-only cells to 0', () => {
    const csv = 'a,b\n  ,foo';
    const rows = parseCSV(csv);
    expect(rows[0].a).toBe(''); // trimmed empty, not 0
    expect(rows[0].b).toBe('foo');
  });

  it('strips __proto__ from headers', () => {
    const csv = '__proto__,b\n1,2';
    const rows = parseCSV(csv);
    // __proto__ key should be skipped, b should remain
    expect(Object.getOwnPropertyNames(rows[0])).toEqual(['b']);
  });

  it('returns empty array for fewer than 2 lines', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('a,b')).toEqual([]);
  });
});

describe('detectColumnType', () => {
  it('classifies a numeric column', () => {
    const det = detectColumnType([1, 2, 3, 4, 5]);
    expect(det.dataType).toBe('number');
    expect(det.isNumerical).toBe(true);
  });

  it('classifies a date column (ISO strings)', () => {
    const det = detectColumnType(['2024-01-01', '2024-02-01', '2024-03-01']);
    expect(det.dataType).toBe('date');
    expect(det.isTemporal).toBe(true);
  });

  it('classifies a boolean column', () => {
    const det = detectColumnType([true, false, true, true]);
    expect(det.dataType).toBe('boolean');
  });

  it('classifies a string column', () => {
    const det = detectColumnType(['foo', 'bar', 'baz']);
    expect(det.dataType).toBe('string');
    expect(det.isCategorical).toBe(true);
  });

  it('tolerates a stray non-numeric value in a mostly-numeric column', () => {
    // 9 numbers + 1 string → 90% numeric, above 70% threshold
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'N/A'];
    const det = detectColumnType(values);
    expect(det.dataType).toBe('number');
  });

  it('returns string for empty arrays', () => {
    expect(detectColumnType([]).dataType).toBe('string');
  });
});

describe('extractMetadata', () => {
  it('produces one entry per column with type info', () => {
    const data = [
      { id: 1, name: 'a', date: '2024-01-01' },
      { id: 2, name: 'b', date: '2024-02-01' },
    ];
    const meta = extractMetadata(data);
    expect(meta).toHaveLength(3);
    expect(meta.find(m => m.name === 'id')?.isNumerical).toBe(true);
    expect(meta.find(m => m.name === 'name')?.isCategorical).toBe(true);
    expect(meta.find(m => m.name === 'date')?.isTemporal).toBe(true);
  });

  it('reports min/max/avg for numeric columns', () => {
    const data = [{ x: 1 }, { x: 5 }, { x: 9 }];
    const meta = extractMetadata(data);
    expect(meta[0].min).toBe(1);
    expect(meta[0].max).toBe(9);
    expect(meta[0].avg).toBe(5);
  });
});
