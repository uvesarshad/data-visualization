'use client';

// Data validation and quality utilities

import { detectColumnType } from '@/app/lib/data-processor';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface DataProfile {
  totalRows: number;
  totalColumns: number;
  columns: ColumnProfile[];
  dataQualityScore: number; // 0-100
  completeness: number; // percentage of non-null values
  duplicates: number;
  memoryEstimate: string;
}

export interface ColumnProfile {
  name: string;
  type: 'numeric' | 'categorical' | 'temporal' | 'boolean' | 'mixed' | 'empty';
  nonNullCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  isPrimaryKey: boolean;
  isConstant: boolean;
  sampleValues: string[];
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    skewness?: number;
  };
  topValues?: { value: string; count: number; percentage: number }[];
}

/**
 * Validate uploaded data
 */
export function validateData(data: any[]): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Dataset is empty');
    return { isValid: false, warnings, errors, suggestions };
  }

  if (!Array.isArray(data)) {
    errors.push('Data must be an array of objects');
    return { isValid: false, warnings, errors, suggestions };
  }

  // Check row count
  if (data.length < 2) {
    warnings.push('Dataset has only 1 row. Visualizations need more data points.');
  }

  // Check for empty rows
  const emptyRows = data.filter(row => Object.values(row).every(v => v === null || v === undefined || v === '')).length;
  if (emptyRows > 0) {
    warnings.push(`${emptyRows} completely empty rows detected.`);
    suggestions.push('Consider removing empty rows for cleaner analysis.');
  }

  // Check columns
  const columns = Object.keys(data[0]);
  if (columns.length === 0) {
    errors.push('No columns found in the data.');
    return { isValid: false, warnings, errors, suggestions };
  }

  // Check for consistent column count
  const inconsistentRows = data.filter(row => Object.keys(row).length !== columns.length).length;
  if (inconsistentRows > 0) {
    warnings.push(`${inconsistentRows} rows have inconsistent column counts.`);
  }

  // Check for columns with all nulls
  columns.forEach(col => {
    const nullCount = data.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
    if (nullCount === data.length) {
      warnings.push(`Column "${col}" has no data (all null).`);
    } else if (nullCount > data.length * 0.5) {
      warnings.push(`Column "${col}" is ${Math.round(nullCount / data.length * 100)}% empty.`);
    }
  });

  // Detect potential ID columns
  columns.forEach(col => {
    const values = data.map(row => row[col]);
    const unique = new Set(values).size;
    if (unique === data.length && data.length > 5) {
      suggestions.push(`Column "${col}" appears to be a unique identifier. Consider excluding it from analysis.`);
    }
  });

  // Detect constant columns
  columns.forEach(col => {
    const values = data.map(row => row[col]);
    const unique = new Set(values).size;
    if (unique === 1) {
      warnings.push(`Column "${col}" has only one unique value (constant).`);
    }
  });

  // Large dataset warning
  if (data.length > 10000) {
    suggestions.push('Large dataset detected. Charts will be aggregated for performance.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Generate a comprehensive data profile
 */
export function profileData(data: any[]): DataProfile {
  if (!data || data.length === 0) {
    return { totalRows: 0, totalColumns: 0, columns: [], dataQualityScore: 0, completeness: 0, duplicates: 0, memoryEstimate: '0 KB' };
  }

  const columns = Object.keys(data[0]);
  let totalCells = data.length * columns.length;
  let nonNullCells = 0;
  let duplicates = 0;

  // Detect duplicates
  const seen = new Set<string>();
  data.forEach(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) duplicates++;
    seen.add(key);
  });

  const columnProfiles: ColumnProfile[] = columns.map(col => {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    nonNullCells += nonNullValues.length;

    const nullCount = values.length - nonNullValues.length;
    const uniqueValues = new Set(nonNullValues);
    const uniqueCount = uniqueValues.size;

    // Determine type using the shared detector (single source of truth with extractMetadata)
    let type: ColumnProfile['type'] = 'empty';
    if (nonNullValues.length > 0) {
      const det = detectColumnType(values);
      if (det.dataType === 'number') type = 'numeric';
      else if (det.dataType === 'date') type = 'temporal';
      else if (det.dataType === 'boolean') type = 'boolean';
      else if (uniqueCount / nonNullValues.length > 0.5) type = 'mixed';
      else type = 'categorical';
    }

    // Stats for numeric columns
    let stats: ColumnProfile['stats'] = undefined;
    if (type === 'numeric') {
      const nums = nonNullValues.map(Number).filter(v => !isNaN(v));
      if (nums.length > 0) {
        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length;
        const stdDev = Math.sqrt(variance);
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        // Skewness
        const skewness = stdDev > 0
          ? nums.reduce((acc, v) => acc + Math.pow((v - mean) / stdDev, 3), 0) / nums.length
          : 0;

        stats = {
          min: Math.round(sorted[0] * 100) / 100,
          max: Math.round(sorted[sorted.length - 1] * 100) / 100,
          mean: Math.round(mean * 100) / 100,
          median: Math.round(median * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100,
          skewness: Math.round(skewness * 100) / 100,
        };
      }
    }

    // Top values for categorical columns
    let topValues: ColumnProfile['topValues'] = undefined;
    if (type === 'categorical' && uniqueCount <= 50) {
      const counts: Record<string, number> = {};
      nonNullValues.forEach(v => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });
      topValues = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({
          value,
          count,
          percentage: Math.round((count / nonNullValues.length) * 10000) / 100,
        }));
    }

    return {
      name: col,
      type,
      nonNullCount: nonNullValues.length,
      nullCount,
      nullPercentage: Math.round((nullCount / values.length) * 10000) / 100,
      uniqueCount,
      isPrimaryKey: uniqueCount === data.length && data.length > 5,
      isConstant: uniqueCount === 1,
      sampleValues: Array.from(uniqueValues).slice(0, 5).map(String),
      stats,
      topValues,
    };
  });

  const completeness = Math.round((nonNullCells / totalCells) * 10000) / 100;
  const qualityScore = Math.round(
    (completeness * 0.4) +
    ((1 - duplicates / data.length) * 30) +
    (columnProfiles.filter(c => c.type !== 'empty').length / columnProfiles.length * 30)
  );

  // Memory estimate
  const jsonSize = JSON.stringify(data).length;
  const memKB = jsonSize / 1024;
  const memoryEstimate = memKB > 1024 ? `${(memKB / 1024).toFixed(1)} MB` : `${memKB.toFixed(1)} KB`;

  return {
    totalRows: data.length,
    totalColumns: columns.length,
    columns: columnProfiles,
    dataQualityScore: Math.min(100, qualityScore),
    completeness,
    duplicates,
    memoryEstimate,
  };
}

/**
 * Clean data: remove null rows, fix types, handle missing values
 */
export function cleanData(data: any[], options?: {
  removeEmptyRows?: boolean;
  removeDuplicateRows?: boolean;
  fillNumericNulls?: 'mean' | 'median' | 'zero' | 'skip';
  trimStrings?: boolean;
}): any[] {
  const opts = {
    removeEmptyRows: true,
    removeDuplicateRows: false,
    fillNumericNulls: 'skip' as const,
    trimStrings: true,
    ...options,
  };

  let cleaned = [...data];

  // Remove empty rows
  if (opts.removeEmptyRows) {
    cleaned = cleaned.filter(row => !Object.values(row).every(v => v === null || v === undefined || v === ''));
  }

  // Remove duplicates
  if (opts.removeDuplicateRows) {
    const seen = new Set<string>();
    cleaned = cleaned.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Trim strings
  if (opts.trimStrings) {
    cleaned = cleaned.map(row => {
      const newRow: any = {};
      Object.entries(row).forEach(([key, val]) => {
        newRow[key] = typeof val === 'string' ? val.trim() : val;
      });
      return newRow;
    });
  }

  // Fill numeric nulls
  if (opts.fillNumericNulls !== 'skip') {
    const columns = Object.keys(cleaned[0] || {});
    columns.forEach(col => {
      const numericValues = cleaned.map(row => Number(row[col])).filter(v => !isNaN(v));
      if (numericValues.length === 0) return;

      let fillValue: number;
      switch (opts.fillNumericNulls) {
        case 'mean':
          fillValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          break;
        case 'median': {
          const sorted = [...numericValues].sort((a, b) => a - b);
          fillValue = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
          break;
        }
        case 'zero':
          fillValue = 0;
          break;
        default:
          fillValue = 0;
      }

      cleaned = cleaned.map(row => ({
        ...row,
        [col]: row[col] === null || row[col] === undefined || row[col] === '' ? Math.round(fillValue * 100) / 100 : row[col],
      }));
    });
  }

  return cleaned;
}