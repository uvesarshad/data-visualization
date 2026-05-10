'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Database, X, CheckCircle2, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <div className="w-full max-w-4xl mx-auto p-4">
      <div 
        className={cn(
          "relative group border-2 border-dashed rounded-2xl transition-all duration-300 p-12 flex flex-col items-center justify-center gap-6 text-center cursor-pointer",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-card/30",
          isLoading && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload className="w-10 h-10 text-primary" />
        </div>
        
        <div>
          <h2 className="text-2xl font-headline font-bold mb-2">Upload your Data</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Drag and drop your CSV, JSON or Excel files here, or click to browse. DataSense will automatically generate your dashboard.
          </p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileSelect} 
          className="hidden" 
          accept=".csv,.json,.xlsx,.xls"
        />

        {error && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <Button variant="outline" className="gap-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <FileText className="w-4 h-4" />
            Browse Files
          </Button>
          <Button 
            variant="secondary" 
            className="gap-2 bg-accent hover:bg-accent/80 text-white" 
            onClick={(e) => { e.stopPropagation(); setShowSamples(!showSamples); }}
          >
            <Sparkles className="w-4 h-4" />
            Sample Datasets
            <ChevronDown className={cn("w-3 h-3 transition-transform", showSamples && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Sample Datasets Panel */}
      {showSamples && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {SAMPLE_DATASETS.map((dataset, idx) => (
            <Card 
              key={idx}
              className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group border border-border bg-card/40 backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); handleSampleSelect(dataset); }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{dataset.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-sm group-hover:text-primary transition-colors truncate">
                    {dataset.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {dataset.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold bg-muted/50 px-2 py-0.5 rounded">
                      {dataset.data.length.toLocaleString()} rows
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold bg-muted/50 px-2 py-0.5 rounded">
                      {Object.keys(dataset.data[0]).length} cols
                    </span>
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