'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Table as TableIcon, Settings, FileText, BrainCircuit,
  Sparkles, Database, Moon, Sun, LayoutGrid, Zap, ChevronRight, Search,
  BarChart3, RefreshCw, Download, FileBarChart, Activity, TrendingUp,
} from 'lucide-react';
import { DataUploader } from '@/components/upload/DataUploader';
import { ChartPanel } from '@/components/dashboard/ChartPanel';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ChartAnalysisDialog } from '@/components/dashboard/ChartAnalysisDialog';
import { DataProfiler } from '@/components/dashboard/DataProfiler';
import { NLQueryBar } from '@/components/dashboard/NLQueryBar';
import { ReportDialog } from '@/components/dashboard/ReportDialog';
import { recommendVisualizations, RecommendVisualizationsOutput } from '@/ai/flows/ai-powered-visualization-recommendations';
import { aiGeneratedDataInsights, AiGeneratedDataInsightsOutput } from '@/ai/flows/ai-generated-data-insights';
import { perChartAnalysis, PerChartAnalysisOutput } from '@/ai/flows/per-chart-analysis';
import { naturalLanguageQuery, NLQueryOutput } from '@/ai/flows/natural-language-query';
import { generateReport, ReportGenerationOutput } from '@/ai/flows/report-generation';
import { extractMetadata, ColumnMetadata } from '@/app/lib/data-processor';
import { computeStats, prepareChartData, isNumericColumn } from '@/app/lib/chart-utils';
import { validateData, cleanData } from '@/app/lib/data-validation';
import { generateCacheKey, getCachedResult, setCachedResult, clearCache } from '@/lib/ai-cache';
import { dataToCompactTable, metadataToCompactFormat, statsToCompactFormat } from '@/lib/prompt-format';
import { filterData } from '@/lib/filter-parser';
import { truncateToTokenBudget } from '@/lib/token-budget';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { VirtualizedTable } from '@/components/dashboard/VirtualizedTable';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export default function DataSenseDashboard() {
  const [data, setData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendVisualizationsOutput | null>(null);
  const [insights, setInsights] = useState<AiGeneratedDataInsightsOutput | null>(null);
  const [groundingEnabled, setGroundingEnabled] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Per-chart analysis state
  const [chartAnalysisOpen, setChartAnalysisOpen] = useState(false);
  const [chartAnalysis, setChartAnalysis] = useState<PerChartAnalysisOutput | null>(null);
  const [chartAnalysisLoading, setChartAnalysisLoading] = useState(false);
  const [chartAnalysisTitle, setChartAnalysisTitle] = useState('');
  const [chartAnalysisType, setChartAnalysisType] = useState('');

  // NL Query state
  const [nlQueryLoading, setNlQueryLoading] = useState(false);
  const [nlQueryResult, setNlQueryResult] = useState<{ title: string; explanation: string; chartType: string; filter?: string } | null>(null);
  const [nlQueryChart, setNlQueryChart] = useState<NLQueryOutput | null>(null);

  // Data Profiler state
  const [showProfiler, setShowProfiler] = useState(false);

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<ReportGenerationOutput | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Validation warnings
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 1.4: Cache metadata to avoid redundant O(n×c) extraction
  const cachedMetadataRef = useRef<ColumnMetadata[] | null>(null);
  const cachedMetadataJsonRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 2.6: Centralized stats computation — compute once for all numerical columns
  const columnStats = useMemo(() => {
    if (!data || data.length === 0) return {};
    const stats: Record<string, any> = {};
    const keys = Object.keys(data[0]);
    keys.forEach(key => {
      if (isNumericColumn(data, key)) {
        const s = computeStats(data, key);
        if (s) stats[key] = s;
      }
    });
    return stats;
  }, [data]);

  // 2.5: Pre-slice data per chart recommendation
  const chartDataMap = useMemo(() => {
    if (!data || !recommendations) return new Map<number, any[]>();
    const map = new Map<number, any[]>();
    recommendations.recommendations.forEach((rec, idx) => {
      const xAxis = rec.columnsUsed[0];
      const yAxis = rec.columnsUsed[1] || rec.columnsUsed[0];
      const extraSeries = rec.columnsUsed.slice(2);
      const sliced = prepareChartData(data, rec.type, xAxis, yAxis, extraSeries);
      map.set(idx, sliced.length > 0 ? sliced : data.slice(0, 50));
    });
    return map;
  }, [data, recommendations]);

  // 3.1: Filtered NL query data
  const nlQueryFilteredData = useMemo(() => {
    if (!data || !nlQueryChart?.filter) return data;
    const { data: filtered } = filterData(data, nlQueryChart.filter);
    return filtered;
  }, [data, nlQueryChart?.filter]);

  const handleDataLoaded = async (loadedData: any[], name: string) => {
    // Clean data first
    const cleaned = cleanData(loadedData, { removeEmptyRows: true, trimStrings: true });
    
    // Validate
    const validation = validateData(cleaned);
    setValidationWarnings(validation.warnings);
    
    setData(cleaned);
    setFileName(name);
    setIsProcessing(true);
    setRecommendations(null);
    setInsights(null);
    setAnalysisError(null);
    setNlQueryChart(null);
    setNlQueryResult(null);
    setReport(null);

    // 1.4: Cache metadata on data load
    const metadata = extractMetadata(cleaned);
    cachedMetadataRef.current = metadata;
    cachedMetadataJsonRef.current = JSON.stringify(metadata);

    // 3.2: Edge case guard — skip AI if insufficient data
    if (cleaned.length < 2) {
      setAnalysisError('Dataset has too few rows for meaningful AI analysis.');
      setIsProcessing(false);
      return;
    }

    try {
      // 2.3: Check cache for visualization recommendations
      const vizCacheKey = generateCacheKey('recommendVisualizations', { metadata: cachedMetadataJsonRef.current, rowCount: cleaned.length });
      let vizResult = getCachedResult<RecommendVisualizationsOutput>(vizCacheKey);
      
      if (!vizResult) {
        vizResult = await recommendVisualizations({
          columnMetadata: metadata,
          rowCount: cleaned.length,
          datasetDescription: `Dataset loaded from file: ${name}. Columns: ${Object.keys(cleaned[0]).join(', ')}`
        });
        setCachedResult(vizCacheKey, vizResult);
      }
      setRecommendations(vizResult);

      generateInsights(cleaned, groundingEnabled);

    } catch (error) {
      console.error('Error processing data:', error);
      setAnalysisError('AI recommendations unavailable. Using auto-detection.');
      toast({
        variant: 'destructive',
        title: 'AI Recommendation Error',
        description: 'Failed to get AI recommendations. Charts will use auto-detection.'
      });
      generateInsights(cleaned, groundingEnabled);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInsights = async (dataset: any[], grounded: boolean) => {
    // 3.2: Edge case guard
    if (dataset.length < 2) {
      setAnalysisError('Insufficient data for AI insights.');
      return;
    }

    setIsGeneratingInsights(true);
    setAnalysisError(null);
    try {
      // 2.3: Check cache
      const cacheKey = generateCacheKey('aiGeneratedDataInsights', { dataHash: cachedMetadataJsonRef.current, grounded });
      let result = getCachedResult<AiGeneratedDataInsightsOutput>(cacheKey);
      
      if (!result) {
        // 2.1: Use compact table format instead of JSON, 5.3: Token budget
        const sample = dataset.slice(0, 50);
        const compactData = dataToCompactTable(sample, 50);
        result = await aiGeneratedDataInsights({
          dataset: truncateToTokenBudget(compactData),
          groundingEnabled: grounded
        });
        setCachedResult(cacheKey, result);
      }
      setInsights(result);
    } catch (error) {
      console.error('Error generating insights:', error);
      setAnalysisError('Failed to generate AI insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleChartAnalysis = useCallback(async (chartTitle: string, chartType: string, chartData: any[], config: any) => {
    setChartAnalysisOpen(true);
    setChartAnalysisTitle(chartTitle);
    setChartAnalysisType(chartType);
    setChartAnalysis(null);
    setChartAnalysisLoading(true);

    try {
      const columnsUsed = [config.xAxis, config.yAxis, ...(config.extraSeries || [])];
      
      // 2.3: Check cache
      const cacheKey = generateCacheKey('perChartAnalysis', { chartTitle, chartType, columnsUsed });
      let result = getCachedResult<PerChartAnalysisOutput>(cacheKey);
      
      if (!result) {
        const sample = chartData.slice(0, 10);
        const statsInfo: Record<string, any> = {};
        columnsUsed.forEach((col: string) => {
          // 2.6: Reuse centralized stats
          if (columnStats[col]) {
            statsInfo[col] = columnStats[col];
          } else {
            const colStats = computeStats(chartData, col);
            if (colStats) statsInfo[col] = colStats;
          }
        });

        result = await perChartAnalysis({
          chartTitle,
          chartType,
          columnsUsed,
          dataSummary: JSON.stringify({ sample, totalRows: chartData.length, columns: columnsUsed, statistics: statsInfo }),
        });
        setCachedResult(cacheKey, result);
      }
      setChartAnalysis(result);
    } catch (error) {
      console.error('Error analyzing chart:', error);
      toast({ variant: 'destructive', title: 'Chart Analysis Error', description: 'Failed to analyze this chart.' });
    } finally {
      setChartAnalysisLoading(false);
    }
  }, [toast, columnStats]);

  const handleNLQuery = useCallback(async (query: string) => {
    if (!data) return;
    setNlQueryLoading(true);
    setNlQueryResult(null);
    setNlQueryChart(null);

    try {
      // 1.4: Reuse cached metadata
      const metadataJson = cachedMetadataJsonRef.current || JSON.stringify(extractMetadata(data));
      
      // 2.3: Check cache
      const cacheKey = generateCacheKey('naturalLanguageQuery', { query, metadataJson });
      let result = getCachedResult<NLQueryOutput>(cacheKey);
      
      if (!result) {
        result = await naturalLanguageQuery({
          query,
          columnMetadata: metadataJson,
          rowCount: data.length,
        });
        setCachedResult(cacheKey, result);
      }
      setNlQueryChart(result);
      setNlQueryResult({ title: result.title, explanation: result.explanation, chartType: result.chartType, filter: result.filter });
    } catch (error) {
      console.error('NL query error:', error);
      toast({ variant: 'destructive', title: 'Query Error', description: 'Failed to process your question.' });
    } finally {
      setNlQueryLoading(false);
    }
  }, [data, toast]);

  const handleGenerateReport = useCallback(async () => {
    if (!data || !fileName) return;
    setReportOpen(true);
    setReport(null);
    setReportLoading(true);

    try {
      // 1.4: Reuse cached metadata
      const metadata = cachedMetadataRef.current || extractMetadata(data);
      
      // 2.1: Use compact format, 2.6: Reuse centralized stats, 5.3: Token budget
      const compactStats = statsToCompactFormat(columnStats);

      // 2.3: Check cache
      const cacheKey = generateCacheKey('generateReport', { fileName, rowCount: data.length, insightsHash: insights?.insights?.substring(0, 100) });
      let result = getCachedResult<ReportGenerationOutput>(cacheKey);
      
      if (!result) {
        const compactData = dataToCompactTable(data, 50);
        result = await generateReport({
          dataset: truncateToTokenBudget(compactData),
          columnStats: truncateToTokenBudget(compactStats, 2000),
          insights: insights?.insights,
          fileName,
          rowCount: data.length,
          columnCount: Object.keys(data[0]).length,
        });
        setCachedResult(cacheKey, result);
      }
      setReport(result);
    } catch (error) {
      console.error('Report generation error:', error);
      toast({ variant: 'destructive', title: 'Report Error', description: 'Failed to generate report.' });
    } finally {
      setReportLoading(false);
    }
  }, [data, fileName, insights, toast, columnStats]);

  const handleExportData = () => {
    if (!data) return;
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v)).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'data'}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: `${data.length} rows exported as CSV.` });
  };

  const resetData = () => {
    setData(null);
    setFileName(null);
    setRecommendations(null);
    setInsights(null);
    setAnalysisError(null);
    setNlQueryChart(null);
    setNlQueryResult(null);
    setReport(null);
    setValidationWarnings([]);
    cachedMetadataRef.current = null;
    cachedMetadataJsonRef.current = null;
    // 2.3: Clear AI cache on data reset
    clearCache();
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-foreground">DataSense</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            The AI engine that makes your data visual and actionable in seconds.
          </p>
        </div>
        <DataUploader onDataLoaded={handleDataLoaded} isLoading={isProcessing} />
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-center px-4">
          <div className="space-y-2 group p-4 rounded-xl hover:bg-card/50 transition-all">
            <div className="text-primary flex justify-center"><LayoutGrid className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">20+ Chart Types</h3>
            <p className="text-sm text-muted-foreground">Bar, Line, Treemap, Box Plot, Waterfall, Histogram, Gauge, Forecast & more.</p>
          </div>
          <div className="space-y-2 group p-4 rounded-xl hover:bg-card/50 transition-all">
            <div className="text-accent flex justify-center"><Zap className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">AI Natural Language</h3>
            <p className="text-sm text-muted-foreground">Ask questions in plain English and get instant visualizations.</p>
          </div>
          <div className="space-y-2 group p-4 rounded-xl hover:bg-card/50 transition-all">
            <div className="text-green-500 flex justify-center"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Full Analysis Report</h3>
            <p className="text-sm text-muted-foreground">One-click AI-generated executive report with insights & predictions.</p>
          </div>
        </div>
        {mounted && (
          <Button variant="outline" size="icon" className="fixed bottom-8 right-8 rounded-full bg-card shadow-lg" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 border-r border-border bg-card/20 flex flex-col items-center py-6 gap-8 z-20">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="icon" className="text-primary bg-primary/10 rounded-xl"><LayoutDashboard className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={() => setShowProfiler(!showProfiler)}><Activity className="w-5 h-5" /></Button>
          <Separator className="bg-border" />
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={handleExportData} title="Export CSV"><Download className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={handleGenerateReport} title="Generate Report"><FileBarChart className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={resetData}><Database className="w-5 h-5" /></Button>
        </div>
        <div className="mt-auto flex flex-col gap-4">
          {mounted && (
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl"><Settings className="w-5 h-5" /></Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/30 relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/10 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-bold text-xl">Intelligence Dashboard</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 font-medium">
              <FileText className="w-3 h-3 mr-2" />{fileName}
            </Badge>
            {recommendations && (
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 font-medium text-[10px]">
                <BarChart3 className="w-3 h-3 mr-1" />{recommendations.recommendations.length} Charts
              </Badge>
            )}
            {/* 3.1: Show active NL filter */}
            {nlQueryChart?.filter && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Search className="w-2.5 h-2.5" />
                Filter: {nlQueryChart.filter}
                <button 
                  className="ml-1 hover:text-destructive" 
                  onClick={() => { setNlQueryChart(null); setNlQueryResult(null); }}
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleGenerateReport}>
              <FileBarChart className="w-3.5 h-3.5" />Generate Report
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20 gap-1.5" onClick={handleExportData}>
              <Download className="w-3.5 h-3.5" />Export
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8">
            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold mb-1">Data Warnings</p>
                {validationWarnings.slice(0, 3).map((w, i) => (
                  <p key={i} className="text-xs text-foreground/70">• {w}</p>
                ))}
              </div>
            )}

            {/* Stats Overview */}
            <div className="mb-6">
              <StatsOverview data={data} />
            </div>

            {/* NL Query Bar */}
            <div className="mb-6">
              <NLQueryBar onSubmit={handleNLQuery} isLoading={nlQueryLoading} result={nlQueryResult} onClearResult={() => { setNlQueryResult(null); setNlQueryChart(null); }} />
            </div>

            {/* NL Query Generated Chart — 3.1: Uses filtered data */}
            {nlQueryChart && data && (
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ChartPanel
                  type={nlQueryChart.chartType}
                  data={nlQueryFilteredData || data}
                  title={nlQueryChart.title}
                  description={nlQueryChart.explanation + (nlQueryChart.filter ? ` (Filtered: ${nlQueryChart.filter}, ${nlQueryFilteredData?.length} rows)` : '')}
                  config={{ xAxis: nlQueryChart.xAxis, yAxis: nlQueryChart.yAxis, extraSeries: nlQueryChart.extraSeries }}
                  onAnalyze={handleChartAnalysis}
                  precomputedStats={columnStats}
                />
              </div>
            )}

            {/* Data Profiler */}
            {showProfiler && (
              <div className="mb-6">
                <DataProfiler data={data} open={showProfiler} onClose={() => setShowProfiler(false)} />
              </div>
            )}

            <Tabs defaultValue="visuals" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-card/50 border border-border p-1">
                  <TabsTrigger value="visuals" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <LayoutDashboard className="w-4 h-4" />Dashboards
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TableIcon className="w-4 h-4" />Explorer
                  </TabsTrigger>
                </TabsList>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  <span className="text-primary">{data.length.toLocaleString()}</span> Records processed
                </p>
              </div>

              <TabsContent value="visuals" className="m-0 space-y-6">
                {isProcessing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-[280px] bg-card/20 rounded-2xl animate-pulse flex items-center justify-center border border-border/30">
                        <Sparkles className="w-6 h-6 text-primary/10" />
                      </div>
                    ))}
                  </div>
                ) : recommendations ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {recommendations.recommendations.map((rec, idx) => {
                      const xAxis = rec.columnsUsed[0];
                      const yAxis = rec.columnsUsed[1] || rec.columnsUsed[0];
                      const extraSeries = rec.columnsUsed.slice(2);
                      // 2.5: Use pre-sliced data instead of full dataset
                      const chartData = chartDataMap.get(idx) || data;
                      return (
                        <div key={idx} className={cn(idx === 0 ? "xl:col-span-2" : "col-span-1")}>
                          <ChartPanel 
                            type={rec.type}
                            data={chartData}
                            title={rec.title}
                            description={rec.explanation}
                            config={{ xAxis, yAxis, extraSeries }}
                            onAnalyze={handleChartAnalysis}
                            precomputedStats={columnStats}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-card/5 rounded-2xl border border-dashed border-border/50">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-headline font-semibold">No AI Recommendations</h3>
                    <p className="text-xs text-muted-foreground mt-2">AI recommendation service is unavailable.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="raw" className="m-0">
                <VirtualizedTable data={data} columns={Object.keys(data[0])} maxRows={1000} />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      {/* Insights Panel */}
      <aside className="w-[380px] border-l border-border bg-card/10 backdrop-blur-2xl z-20 flex flex-col">
        <InsightsPanel 
          insights={insights?.insights}
          findings={insights?.keyFindings}
          predictions={insights?.predictions}
          isLoading={isGeneratingInsights}
          groundingEnabled={groundingEnabled}
          onGroundingToggle={(enabled) => { setGroundingEnabled(enabled); generateInsights(data, enabled); }}
          onRefresh={() => generateInsights(data, groundingEnabled)}
          analysisError={analysisError}
        />
      </aside>

      {/* Dialogs */}
      <ChartAnalysisDialog open={chartAnalysisOpen} onOpenChange={setChartAnalysisOpen} analysis={chartAnalysis} chartTitle={chartAnalysisTitle} chartType={chartAnalysisType} isLoading={chartAnalysisLoading} />
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} report={report} isLoading={reportLoading} fileName={fileName || undefined} onExport={handleExportData} />
    </div>
  );
}