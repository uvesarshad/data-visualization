import { ColumnMetadataSchema } from '@/ai/flows/schemas';
import { z } from 'zod';
import * as XLSX from 'xlsx';

export type ColumnMetadata = z.infer<typeof ColumnMetadataSchema>;

export function parseCSV(csv: string) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => {
      let val: any = values[i]?.trim();
      if (!isNaN(val as any) && val !== '') val = Number(val);
      obj[h] = val;
    });
    return obj;
  });
  return rows;
}

export function parseExcel(buffer: ArrayBuffer): any[] {
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
      min: isNumerical ? Math.min(...numericValues) : undefined,
      max: isNumerical ? Math.max(...numericValues) : undefined,
      avg: isNumerical ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : undefined,
      exampleValues: uniqueValues.slice(0, 5).map(v => String(v))
    };
  });
}
