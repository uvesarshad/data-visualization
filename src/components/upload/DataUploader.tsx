'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Sparkles, ChevronDown, ArrowRight, Database, Table2, Link as LinkIcon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SAMPLE_DATASETS, SampleDataset } from '@/app/lib/sample-data';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_FETCH_BYTES = 50 * 1024 * 1024;  // 50 MB cap on URL-fetched payloads

const FORBIDDEN_JSON_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Reject non-https URLs and obvious internal/loopback hosts. Client-side fetch
 * is already CORS-bound, but this gives the user clear feedback and stops
 * obvious mistakes (file://, http://localhost, ftp://, etc.).
 */
function validateImportUrl(input: string): { ok: true } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: 'Not a valid URL.' };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'Only https:// URLs are allowed.' };
  }
  const host = url.hostname.toLowerCase();
  // Block loopback / link-local / private ranges by hostname text. This is not a
  // perfect SSRF check (DNS rebind/resolve is server-side concern), but it stops
  // accidental "http://localhost" uploads from the browser.
  if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local')) {
    return { ok: false, reason: 'Loopback and .local hosts are not allowed.' };
  }
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host) || /^127\./.test(host)) {
    return { ok: false, reason: 'Private/internal IP ranges are not allowed.' };
  }
  return { ok: true };
}

/**
 * Defensive JSON parser:
 *  - Strips forbidden keys (__proto__, prototype, constructor) at all object levels
 *  - Unwraps a single common wrapper shape: { data: [...] } → [...]
 *  - Returns the parsed value; caller still has to verify it's an array of objects.
 */
function safeParseJSON(text: string): unknown {
  const parsed = JSON.parse(text, (key, value) => {
    if (FORBIDDEN_JSON_KEYS.has(key)) return undefined;
    return value;
  });
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    // Common wrapper shape — many public APIs return { data: [...] }
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.items)) return obj.items;
  }
  return parsed;
}

interface DataUploaderProps {
  onDataLoaded: (data: any[], fileName: string) => void;
  isLoading: boolean;
}

export function DataUploader({ onDataLoaded, isLoading }: DataUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [dataUrl, setDataUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    const isJson = file.name.endsWith('.json');

    if (!isCsv && !isJson && !isExcel) {
      setError('Please upload a CSV, JSON, or Excel file.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const maxMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      setError(`File is ${sizeMb} MB; the upload limit is ${maxMb} MB. Sample or filter your data before uploading.`);
      return;
    }

    try {
      let data: any[] = [];
      
      if (isCsv) {
        const text = await file.text();
        const { parseCSVAsync } = await import('@/lib/data-worker-client');
        data = await parseCSVAsync(text);
      } else if (isExcel) {
        const buffer = await file.arrayBuffer();
        const { parseExcelAsync } = await import('@/lib/data-worker-client');
        data = await parseExcelAsync(buffer);
      } else {
        const text = await file.text();
        const parsed = safeParseJSON(text);
        if (!Array.isArray(parsed)) {
          setError('Invalid data format. Expected an array of objects (or {data: [...]}).');
          return;
        }
        data = parsed;
      }

      if (!Array.isArray(data)) {
        setError('Invalid data format. Expected an array of objects.');
        return;
      }

      onDataLoaded(data, file.name);
    } catch (err) {
      setError('Failed to parse file. Please check the file format.');
      console.error(err);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataUrl) return;

    setError(null);

    const check = validateImportUrl(dataUrl);
    if (!check.ok) {
      setError(check.reason);
      return;
    }

    setIsFetching(true);

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error('Failed to fetch data from URL');

      // Enforce size cap when the server tells us a length we can trust.
      const cl = response.headers.get('content-length');
      if (cl && Number(cl) > MAX_FETCH_BYTES) {
        const sizeMb = (Number(cl) / (1024 * 1024)).toFixed(1);
        throw new Error(`Remote file is ${sizeMb} MB; max ${Math.round(MAX_FETCH_BYTES / (1024 * 1024))} MB.`);
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any[] = [];
      let fileName = dataUrl.split('/').pop() || 'data';

      if (contentType.includes('application/json') || dataUrl.endsWith('.json')) {
        const text = await response.text();
        const parsed = safeParseJSON(text);
        if (!Array.isArray(parsed)) throw new Error('JSON does not contain an array.');
        data = parsed;
      } else if (contentType.includes('text/csv') || dataUrl.endsWith('.csv')) {
        const text = await response.text();
        const { parseCSVAsync } = await import('@/lib/data-worker-client');
        data = await parseCSVAsync(text);
      } else if (contentType.includes('spreadsheet') || dataUrl.endsWith('.xlsx') || dataUrl.endsWith('.xls')) {
        const buffer = await response.arrayBuffer();
        const { parseExcelAsync } = await import('@/lib/data-worker-client');
        data = await parseExcelAsync(buffer);
      } else {
        // Fallback: try JSON, then CSV
        const text = await response.text();
        try {
          const parsed = safeParseJSON(text);
          if (!Array.isArray(parsed)) throw new Error('not an array');
          data = parsed;
        } catch {
          const { parseCSVAsync } = await import('@/lib/data-worker-client');
          data = await parseCSVAsync(text);
        }
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format. Expected an array of objects.');
      }

      onDataLoaded(data, fileName);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch or parse data from URL.');
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSampleSelect = (dataset: SampleDataset) => {
    setError(null);
    onDataLoaded(dataset.data, `${dataset.name} (Sample)`);
  };

  return (
    <div className="w-full">
      <div 
        className={cn(
          "relative group border-2 border-dashed rounded-3xl transition-all duration-300 p-10 sm:p-14 flex flex-col items-center justify-center gap-6 text-center cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10" 
            : "border-border/60 hover:border-primary/40 hover:bg-card/20 hover:shadow-md",
          (isLoading || isFetching) && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Upload icon */}
        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300",
          isDragging 
            ? "bg-primary/20 scale-110" 
            : "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/15 group-hover:to-accent/15 group-hover:scale-105"
        )}>
          <Upload className={cn("w-9 h-9 transition-colors", isDragging ? "text-primary" : "text-primary/70")} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold tracking-tight">
            {isDragging ? 'Drop your file here' : 'Upload your dataset'}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Drag and drop a CSV, JSON, or Excel file — or click to browse. 
            DataSense will automatically analyze and visualize your data.
          </p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileSelect} 
          className="hidden" 
          accept=".csv,.json,.xlsx,.xls"
        />

        {/* Supported formats */}
        <div className="flex items-center gap-3">
          {['.csv', '.json', '.xlsx', '.xls'].map((ext) => (
            <div key={ext} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 bg-muted/30 px-2.5 py-1 rounded-lg border border-border/30">
              <Table2 className="w-3 h-3" />
              {ext}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 text-destructive bg-destructive/10 border border-destructive/20 px-5 py-3 rounded-2xl text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 w-full max-w-md mt-2">
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="lg" className="gap-2 rounded-xl font-medium" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <FileText className="w-4 h-4" />
              Browse Files
            </Button>
            <Button 
              size="lg" 
              className="gap-2 rounded-xl font-medium shadow-md shadow-primary/20" 
              onClick={(e) => { e.stopPropagation(); setShowSamples(!showSamples); }}
            >
              <Database className="w-4 h-4" />
              Sample Datasets
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showSamples && "rotate-180")} />
            </Button>
          </div>

          <div className="relative w-full group/input" onClick={(e) => e.stopPropagation()}>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
              <Globe className="w-4 h-4" />
            </div>
            <form onSubmit={handleUrlSubmit}>
              <Input
                type="url"
                placeholder="Or paste a public URL to CSV, JSON, or Excel..."
                className="pl-10 pr-12 h-12 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20 transition-all"
                value={dataUrl}
                onChange={(e) => setDataUrl(e.target.value)}
                disabled={isLoading || isFetching}
              />
              <Button 
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                disabled={!dataUrl || isLoading || isFetching}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Sample Datasets Panel */}
      {showSamples && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {SAMPLE_DATASETS.map((dataset, idx) => (
            <Card 
              key={idx}
              className="p-5 cursor-pointer border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:bg-card/50 transition-all group"
              onClick={(e) => { e.stopPropagation(); handleSampleSelect(dataset); }}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-muted/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {dataset.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-sm group-hover:text-primary transition-colors truncate">
                    {dataset.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {dataset.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold bg-muted/40 px-2 py-0.5">
                      {dataset.data.length.toLocaleString()} rows
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold bg-muted/40 px-2 py-0.5">
                      {Object.keys(dataset.data[0]).length} cols
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}