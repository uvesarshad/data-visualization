'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Sparkles, ChevronDown, ArrowRight, Database, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SAMPLE_DATASETS, SampleDataset } from '@/app/lib/sample-data';

interface DataUploaderProps {
  onDataLoaded: (data: any[], fileName: string) => void;
  isLoading: boolean;
}

export function DataUploader({ onDataLoaded, isLoading }: DataUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
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

    try {
      let data: any[] = [];
      
      if (isCsv) {
        const text = await file.text();
        const { parseCSV } = await import('@/app/lib/data-processor');
        data = parseCSV(text);
      } else if (isExcel) {
        const buffer = await file.arrayBuffer();
        const { parseExcel } = await import('@/app/lib/data-processor');
        data = await parseExcel(buffer);
      } else {
        const text = await file.text();
        data = JSON.parse(text);
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
          isLoading && "pointer-events-none opacity-50"
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

        <div className="flex gap-3 mt-2">
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