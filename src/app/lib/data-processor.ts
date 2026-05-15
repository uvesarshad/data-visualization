import { ColumnMetadataSchema } from '@/ai/flows/schemas';
import { z } from 'zod';
import { iterMin, iterMax } from '@/lib/math-iter';

export type ColumnMetadata = z.infer<typeof ColumnMetadataSchema>;

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Coerce a raw string CSV cell to a value:
 *  - trim whitespace
 *  - empty → ''
 *  - looks like a number AND not just whitespace → Number(s)
 *  - otherwise → original string
 */
function coerceCellValue(raw: string | undefined): any {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  // Must contain at least one digit to be considered numeric (Number("") === 0 trap)
  if (/\d/.test(trimmed) && !isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

// 3.5: Robust CSV parser handling quoted fields, commas in quotes, escaped quotes
export function parseCSV(csv: string): any[] {
  // Strip UTF-8 BOM so the first header isn't named "﻿id"
  if (csv.charCodeAt(0) === 0xFEFF) csv = csv.slice(1);

  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < csv.length) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ',') {
        current.push(field);
        field = '';
        i++;
        continue;
      }
      if (ch === '\r') {
        i++;
        continue;
      }
      if (ch === '\n') {
        current.push(field);
        field = '';
        if (current.length > 0) lines.push(current);
        current = [];
        i++;
        continue;
      }
      field += ch;
      i++;
    }
  }
  if (field || current.length > 0) {
    current.push(field);
    lines.push(current);
  }

  if (lines.length < 2) return [];
  const headers = lines[0].map(h => h.trim()).filter(h => !FORBIDDEN_KEYS.has(h));
  return lines.slice(1).map(values => {
    const obj: any = Object.create(null);
    headers.forEach((h, idx) => {
      obj[h] = coerceCellValue(values[idx]);
    });
    return obj;
  });
}

// 1.1: Dynamic XLSX import — only loaded when Excel parsing is needed
export async function parseExcel(buffer: ArrayBuffer): Promise<any[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  // Heuristic: Find the best sheet (most rows * most columns)
  let bestSheetName = workbook.SheetNames[0];
  let maxScore = 0;

  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const ref = sheet['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      const rows = range.e.r - range.s.r + 1;
      const cols = range.e.c - range.s.c + 1;
      if (rows * cols > maxScore) {
        maxScore = rows * cols;
        bestSheetName = name;
      }
    }
  });

  const worksheet = workbook.Sheets[bestSheetName];
  // Parse all rows as arrays to find the header
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
  
  // Find the header row (first row with multiple non-null values that looks like a header)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    const nonNullCount = row.filter(cell => cell !== null && cell !== '').length;
    // Check if this row looks like a header (at least 3 values, or mostly strings/numbers)
    if (nonNullCount >= 3) {
      headerIdx = i;
      break;
    }
  }

  const headers = rows[headerIdx]
    .map((h, i) => (h !== null && h !== undefined && String(h).trim() !== '' ? String(h).trim() : `Column_${i}`))
    .map(h => (FORBIDDEN_KEYS.has(h) ? `${h}_` : h)); // sanitize unsafe keys
  const dataRows = rows.slice(headerIdx + 1);

  return dataRows
    .filter(row => row.some(cell => cell !== null && cell !== '')) // Skip empty rows
    .map(row => {
      const obj: any = Object.create(null);
      headers.forEach((h, i) => {
        let val = row[i];
        if (typeof val === 'string') val = val.trim();
        // Convert numeric strings to numbers only when they actually contain digits.
        // `Number("  ")` is 0, and `isNaN("")` is false — those traps are why /\d/ is required.
        if (typeof val === 'string' && val !== '' && /\d/.test(val) && !isNaN(val as any)) {
          val = Number(val);
        }
        obj[h] = val;
      });
      return obj;
    });
}

/**
 * Threshold-based column type detection.
 *
 * Scans up to `sampleLimit` non-null values from a column and classifies based
 * on which type dominates (>= 70%). This is the single source of truth used by
 * both `extractMetadata` and `profileData` so they no longer disagree.
 */
export function detectColumnType(
  values: any[],
  sampleLimit: number = 200,
): {
  dataType: 'number' | 'boolean' | 'date' | 'string';
  isNumerical: boolean;
  isCategorical: boolean;
  isTemporal: boolean;
} {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) {
    return { dataType: 'string', isNumerical: false, isCategorical: false, isTemporal: false };
  }
  const sample = nonNull.slice(0, sampleLimit);

  let numericCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  for (const v of sample) {
    if (typeof v === 'number' && isFinite(v)) {
      numericCount++;
      continue;
    }
    if (typeof v === 'boolean') {
      boolCount++;
      continue;
    }
    if (v instanceof Date) {
      if (!isNaN(v.getTime())) dateCount++;
      continue;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) continue;
      const sl = s.toLowerCase();
      if (sl === 'true' || sl === 'false') { boolCount++; continue; }
      // Numeric: require at least one digit so " " and "abc" don't count.
      if (/\d/.test(s) && !isNaN(Number(s))) {
        numericCount++;
        continue;
      }
      // Date: must NOT also be numeric (already handled above). Use a stricter
      // shape check than just Date.parse, which accepts e.g. "0".
      const looksDate = /^\d{4}-\d{1,2}-\d{1,2}/.test(s)            // ISO-ish
        || /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(s)              // US/EU shapes
        || /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}/.test(s);         // "Jan 5, 2024"
      if (looksDate) {
        const ms = Date.parse(s);
        if (!isNaN(ms)) { dateCount++; continue; }
      }
    }
  }

  const total = sample.length;
  const ratio = (n: number) => n / total;
  if (ratio(numericCount) >= 0.7) return { dataType: 'number', isNumerical: true, isCategorical: false, isTemporal: false };
  if (ratio(dateCount) >= 0.7) return { dataType: 'date', isNumerical: false, isCategorical: false, isTemporal: true };
  if (ratio(boolCount) >= 0.7) return { dataType: 'boolean', isNumerical: false, isCategorical: true, isTemporal: false };
  return { dataType: 'string', isNumerical: false, isCategorical: true, isTemporal: false };
}

export function extractMetadata(data: any[]): ColumnMetadata[] {
  if (data.length === 0) return [];
  const keys = Object.keys(data[0]);

  return keys.map(key => {
    const values = data.map(row => row[key]);
    const { dataType, isNumerical, isCategorical, isTemporal } = detectColumnType(values);

    const uniqueValues = Array.from(new Set(values));
    // Coerce numeric strings before treating as number (handles loosely-typed JSON)
    const numericValues = isNumerical
      ? values
          .map(v => (typeof v === 'number' ? v : typeof v === 'string' && /\d/.test(v) ? Number(v) : NaN))
          .filter(v => !isNaN(v) && isFinite(v)) as number[]
      : [];

    return {
      name: key,
      dataType,
      isCategorical,
      isNumerical,
      isTemporal,
      uniqueValuesCount: uniqueValues.length,
      min: numericValues.length > 0 ? iterMin(numericValues) : undefined,
      max: numericValues.length > 0 ? iterMax(numericValues) : undefined,
      avg: numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : undefined,
      exampleValues: uniqueValues.slice(0, 5).map(v => String(v))
    };
  });
}
