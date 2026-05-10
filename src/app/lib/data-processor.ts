import { ColumnMetadataSchema } from '@/ai/flows/schemas';
import { z } from 'zod';

export type ColumnMetadata = z.infer<typeof ColumnMetadataSchema>;

// 1.5: Iterative min/max to avoid stack overflow on large arrays
function iterMin(values: number[]): number {
  let min = Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] < min) min = values[i];
  }
  return min;
}

function iterMax(values: number[]): number {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > max) max = values[i];
  }
  return max;
}

// 3.5: Robust CSV parser handling quoted fields, commas in quotes, escaped quotes
export function parseCSV(csv: string): any[] {
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
  const headers = lines[0].map(h => h.trim());
  return lines.slice(1).map(values => {
    const obj: any = {};
    headers.forEach((h, idx) => {
      let val: any = values[idx]?.trim();
      if (val !== undefined && val !== '' && !isNaN(val as any)) val = Number(val);
      obj[h] = val;
    });
    return obj;
  });
}

// 1.1: Dynamic XLSX import — only loaded when Excel parsing is needed
export async function parseExcel(buffer: ArrayBuffer): Promise<any[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

export function extractMetadata(data: any[]): ColumnMetadata[] {
  if (data.length === 0) return [];
  const keys = Object.keys(data[0]);
  
  return keys.map(key => {
    const values = data.map(row => row[key]);
    const firstVal = values.find(v => v !== null && v !== undefined);
    
    const isNumerical = typeof firstVal === 'number';
    const isDate = firstVal instanceof Date || (!isNaN(Date.parse(firstVal)) && isNaN(Number(firstVal)) && String(firstVal).includes('-'));
    const isCategorical = !isNumerical && !isDate;

    const uniqueValues = Array.from(new Set(values));
    const numericValues = values.filter(v => typeof v === 'number') as number[];

    return {
      name: key,
      dataType: isNumerical ? 'number' : isDate ? 'date' : typeof firstVal === 'boolean' ? 'boolean' : 'string',
      isCategorical,
      isNumerical,
      isTemporal: !!isDate,
      uniqueValuesCount: uniqueValues.length,
      // 1.5: Use iterative min/max to prevent stack overflow on large arrays
      min: isNumerical && numericValues.length > 0 ? iterMin(numericValues) : undefined,
      max: isNumerical && numericValues.length > 0 ? iterMax(numericValues) : undefined,
      avg: isNumerical && numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : undefined,
      exampleValues: uniqueValues.slice(0, 5).map(v => String(v))
    };
  });
}
