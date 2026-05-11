import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'datasense.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    // Ensure the data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');

    // Initialize schema
    _db.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        column_count INTEGER NOT NULL,
        column_names TEXT NOT NULL,
        data_json TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        recommendations_json TEXT,
        insights_json TEXT,
        column_stats_json TEXT,
        validation_warnings_json TEXT,
        grounding_enabled INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS saved_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id INTEGER NOT NULL,
        report_json TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_reports_analysis_id ON saved_reports(analysis_id);
    `);
  }
  return _db;
}

// ========== Analysis CRUD ==========

export interface SavedAnalysis {
  id: number;
  name: string;
  file_name: string;
  row_count: number;
  column_count: number;
  column_names: string;
  data_json: string;
  metadata_json: string;
  recommendations_json: string | null;
  insights_json: string | null;
  column_stats_json: string | null;
  validation_warnings_json: string | null;
  grounding_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface AnalysisListItem {
  id: number;
  name: string;
  file_name: string;
  row_count: number;
  column_count: number;
  column_names: string;
  created_at: string;
  updated_at: string;
  has_insights: number;
  has_recommendations: number;
}

export function saveAnalysis(params: {
  name: string;
  fileName: string;
  data: any[];
  metadata: any[];
  recommendations?: any;
  insights?: any;
  columnStats?: any;
  validationWarnings?: string[];
  groundingEnabled?: boolean;
}): number {
  const db = getDb();
  const dataJson = JSON.stringify(params.data);
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes
  const finalDataJson = dataJson.length > MAX_SIZE ? JSON.stringify([]) : dataJson;

  const stmt = db.prepare(`
    INSERT INTO analyses (name, file_name, row_count, column_count, column_names, data_json, metadata_json, recommendations_json, insights_json, column_stats_json, validation_warnings_json, grounding_enabled)
    VALUES (@name, @fileName, @rowCount, @columnCount, @columnNames, @dataJson, @metadataJson, @recommendationsJson, @insightsJson, @columnStatsJson, @validationWarningsJson, @groundingEnabled)
  `);

  const result = stmt.run({
    name: params.name,
    fileName: params.fileName,
    rowCount: params.data.length,
    columnCount: params.data.length > 0 ? Object.keys(params.data[0]).length : 0,
    columnNames: params.data.length > 0 ? JSON.stringify(Object.keys(params.data[0])) : JSON.stringify([]),
    dataJson: finalDataJson,
    metadataJson: JSON.stringify(params.metadata),
    recommendationsJson: params.recommendations ? JSON.stringify(params.recommendations) : null,
    insightsJson: params.insights ? JSON.stringify(params.insights) : null,
    columnStatsJson: params.columnStats ? JSON.stringify(params.columnStats) : null,
    validationWarningsJson: params.validationWarnings ? JSON.stringify(params.validationWarnings) : null,
    groundingEnabled: params.groundingEnabled ? 1 : 0,
  });

  return result.lastInsertRowid as number;
}

export function updateAnalysis(id: number, params: {
  name?: string;
  recommendations?: any;
  insights?: any;
  columnStats?: any;
  validationWarnings?: string[];
  groundingEnabled?: boolean;
}): void {
  const db = getDb();
  const sets: string[] = ['updated_at = datetime(\'now\')'];
  const values: any = { id };

  if (params.name !== undefined) { sets.push('name = @name'); values.name = params.name; }
  if (params.recommendations !== undefined) { sets.push('recommendations_json = @rec'); values.rec = JSON.stringify(params.recommendations); }
  if (params.insights !== undefined) { sets.push('insights_json = @ins'); values.ins = JSON.stringify(params.insights); }
  if (params.columnStats !== undefined) { sets.push('column_stats_json = @stats'); values.stats = JSON.stringify(params.columnStats); }
  if (params.validationWarnings !== undefined) { sets.push('validation_warnings_json = @warn'); values.warn = JSON.stringify(params.validationWarnings); }
  if (params.groundingEnabled !== undefined) { sets.push('grounding_enabled = @ge'); values.ge = params.groundingEnabled ? 1 : 0; }

  db.prepare(`UPDATE analyses SET ${sets.join(', ')} WHERE id = @id`).run(values);
}

export function getAnalysis(id: number): SavedAnalysis | null {
  const db = getDb();
  return db.prepare('SELECT * FROM analyses WHERE id = ?').get(id) as SavedAnalysis | null;
}

export function listAnalyses(limit: number = 50, offset: number = 0): AnalysisListItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, file_name, row_count, column_count, column_names, created_at, updated_at,
           CASE WHEN insights_json IS NOT NULL THEN 1 ELSE 0 END as has_insights,
           CASE WHEN recommendations_json IS NOT NULL THEN 1 ELSE 0 END as has_recommendations
    FROM analyses
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as AnalysisListItem[];
}

export function deleteAnalysis(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM analyses WHERE id = ?').run(id);
  return result.changes > 0;
}

export function searchAnalyses(query: string): AnalysisListItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, file_name, row_count, column_count, column_names, created_at, updated_at,
           CASE WHEN insights_json IS NOT NULL THEN 1 ELSE 0 END as has_insights,
           CASE WHEN recommendations_json IS NOT NULL THEN 1 ELSE 0 END as has_recommendations
    FROM analyses
    WHERE name LIKE ? OR file_name LIKE ? OR column_names LIKE ?
    ORDER BY updated_at DESC
    LIMIT 50
  `).all(`%${query}%`, `%${query}%`, `%${query}%`) as AnalysisListItem[];
}

export function getAnalysisCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
  return row.count;
}

// ========== Reports CRUD ==========

export interface SavedReport {
  id: number;
  analysis_id: number;
  report_json: string;
  created_at: string;
}

export function saveReport(analysisId: number, report: any): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO saved_reports (analysis_id, report_json)
    VALUES (?, ?)
  `).run(analysisId, JSON.stringify(report));
  return result.lastInsertRowid as number;
}

export function getReportsForAnalysis(analysisId: number): SavedReport[] {
  const db = getDb();
  return db.prepare('SELECT * FROM saved_reports WHERE analysis_id = ? ORDER BY created_at DESC').all(analysisId) as SavedReport[];
}

export function deleteReport(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM saved_reports WHERE id = ?').run(id);
  return result.changes > 0;
}