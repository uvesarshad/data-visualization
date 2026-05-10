// 2.1: Compact data formatting for AI prompts
// Converts data arrays to markdown table / TSV format to reduce token usage by ~67%

import { ColumnMetadata } from '@/app/lib/data-processor';

/**
 * Convert data array to compact markdown table format
 * Much more token-efficient than JSON.stringify
 */
export function dataToCompactTable(data: any[], maxRows: number = 50): string {
  if (!data || data.length === 0) return '(empty dataset)';
  
  const sample = data.slice(0, maxRows);
  const keys = Object.keys(sample[0]);
  
  // Header row
  const header = '| ' + keys.join(' | ') + ' |';
  const separator = '| ' + keys.map(() => '---').join(' | ') + ' |';
  
  // Data rows
  const rows = sample.map(row => {
    return '| ' + keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '-';
      const str = String(val);
      // Truncate long values and escape pipes
      return str.length > 50 ? str.substring(0, 47) + '...' : str.replace(/\|/g, '\\|');
    }).join(' | ') + ' |';
  });
  
  return [header, separator, ...rows].join('\n');
}

/**
 * Convert column metadata to compact format
 */
export function metadataToCompactFormat(metadata: ColumnMetadata[]): string {
  return metadata.map(m => {
    const parts = [
      `${m.name} (${m.dataType})`,
      m.isCategorical ? 'cat' : '',
      m.isNumerical ? 'num' : '',
      m.isTemporal ? 'time' : '',
      m.uniqueValuesCount !== undefined ? `uniques:${m.uniqueValuesCount}` : '',
      m.min !== undefined ? `min:${m.min}` : '',
      m.max !== undefined ? `max:${m.max}` : '',
      m.avg !== undefined ? `avg:${Math.round(m.avg * 100) / 100}` : '',
      m.exampleValues?.length ? `examples:[${m.exampleValues.slice(0, 3).join(',')}]` : '',
    ].filter(Boolean);
    return `- ${parts.join(' ')}`;
  }).join('\n');
}

/**
 * Convert column stats object to compact format
 */
export function statsToCompactFormat(stats: Record<string, any>): string {
  return Object.entries(stats).map(([col, s]) => {
    if (!s) return `- ${col}: no stats`;
    return `- ${col}: count=${s.count}, mean=${s.mean}, stdDev=${s.stdDev}, min=${s.min}, max=${s.max}, median=${s.median}`;
  }).join('\n');
}