// 5.1: Centralized data store using Zustand
// Moves dataset out of component state for better memory management and cross-component access

import { create } from 'zustand';
import { ColumnMetadata, extractMetadata } from '@/app/lib/data-processor';
import { computeStats, isNumericColumn } from '@/app/lib/chart-utils';
import { clearCache } from '@/lib/ai-cache';

interface DataStoreState {
  // Data
  data: any[] | null;
  fileName: string | null;

  // Cached derived data
  metadata: ColumnMetadata[] | null;
  metadataJson: string | null;
  columnStats: Record<string, any>;

  // Validation
  validationWarnings: string[];

  // Actions
  setData: (data: any[], fileName: string, warnings?: string[]) => void;
  loadAnalysisData: (params: {
    data: any[];
    fileName: string;
    metadata: ColumnMetadata[];
    metadataJson: string;
    columnStats?: Record<string, any>;
    validationWarnings?: string[];
  }) => void;
  clearData: () => void;
  getColumnStats: (column: string) => any;
}

export const useDataStore = create<DataStoreState>((set, get) => ({
  data: null,
  fileName: null,
  metadata: null,
  metadataJson: null,
  columnStats: {},
  validationWarnings: [],

  setData: (data: any[], fileName: string, warnings: string[] = []) => {
    // Compute metadata once
    const metadata = extractMetadata(data);
    const metadataJson = JSON.stringify(metadata);
    
    // Compute stats for all numerical columns once
    const columnStats: Record<string, any> = {};
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      keys.forEach(key => {
        if (isNumericColumn(data, key)) {
          const s = computeStats(data, key);
          if (s) columnStats[key] = s;
        }
      });
    }

    set({
      data,
      fileName,
      metadata,
      metadataJson,
      columnStats,
      validationWarnings: warnings,
    });
  },

  loadAnalysisData: ({ data, fileName, metadata, metadataJson, columnStats = {}, validationWarnings = [] }) => {
    set({ data, fileName, metadata, metadataJson, columnStats, validationWarnings });
  },

  clearData: () => {
    clearCache();
    set({
      data: null,
      fileName: null,
      metadata: null,
      metadataJson: null,
      columnStats: {},
      validationWarnings: [],
    });
  },

  getColumnStats: (column: string) => {
    const state = get();
    if (state.columnStats[column]) return state.columnStats[column];
    if (!state.data) return null;
    return computeStats(state.data, column);
  },
}));