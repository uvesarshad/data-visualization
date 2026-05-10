'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Table as TableIcon, Settings, FileText, BrainCircuit,
  Sparkles, Database, Moon, Sun, LayoutGrid, Zap, ChevronRight, Search,
  BarChart3, RefreshCw, Download, FileBarChart, Activity, TrendingUp,
  Command, PanelRightClose, PanelRight, Upload, ArrowUpRight,
  Layers, GitBranch, Gauge, ChevronDown, X, Menu,
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

  // Sidebar collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('visuals');

  // Upload drag state
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Cache metadata
  const cachedMetadataRef = useRef<ColumnMetadata[] | null>(null);
  const cachedMetadataJsonRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Centralized stats computation
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

  // Pre-slice data per chart recommendation
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

  // Filtered NL query data
  const nlQueryFilteredData = useMemo(() => {
    if (!data || !nlQueryChart?.filter) return data;
    const { data: filtered } = filterData(data, nlQueryChart.filter);
    return filtered;
  }, [data, nlQueryChart?.filter]);

  const handleDataLoaded = async (loadedData: any[], name: string) => {
    const cleaned = cleanData(loadedData, { removeEmptyRows: true, trimStrings: true });
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

    const metadata = extractMetadata(cleaned);
    cachedMetadataRef.current = metadata;
    cachedMetadataJsonRef.current = JSON.stringify(metadata);

    if (cleaned.length < 2) {
      setAnalysisError('Dataset has too few rows for meaningful AI analysis.');
      setIsProcessing(false);
      return;
    }

    try {
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
    if (dataset.length < 2) {
      setAnalysisError('Insufficient data for AI insights.');
      return;
    }

    setIsGeneratingInsights(true);
    setAnalysisError(null);
    try {
      const cacheKey = generateCacheKey('aiGeneratedDataInsights', { dataHash: cachedMetadataJsonRef.current, grounded });
      let result = getCachedResult<AiGeneratedDataInsightsOutput>(cacheKey);
      
      if (!result) {
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
      const cacheKey = generateCacheKey('perChartAnalysis', { chartTitle, chartType, columnsUsed });
      let result = getCachedResult<PerChartAnalysisOutput>(cacheKey);
      
      if (!result) {
        const sample = chartData.slice(0, 10);
        const statsInfo: Record<string, any> = {};
        columnsUsed.forEach((col: string) => {
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
      const metadataJson = cachedMetadataJsonRef.current || JSON.stringify(extractMetadata(data));
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
      const metadata = cachedMetadataRef.current || extractMetadata(data);
      const compactStats = statsToCompactFormat(columnStats);
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
    setActiveTab('visuals');
    cachedMetadataRef.current = null;
    cachedMetadataJsonRef.current = null;
    clearCache();
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const numericColumns = useMemo(() => {
    if (!data) return 0;
    return Object.keys(data[0]).filter(k => isNumericColumn(data, k)).length;
  }, [data]);

  // ============= LANDING PAGE =============
  if (!data) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background gradient mesh */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[150px]" />
        </div>

        {/* Top nav */}
        <header className="relative z-10 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-bold text-lg tracking-tight">DataSense</span>
              <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20 ml-1">v2.0</Badge>
            </div>
            <div className="flex items-center gap-3">
              {mounted && (
                <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero section */}
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="pt-24 pb-12 text-center space-y-8">
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-700">
              <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary bg-primary/5 px-4 py-1.5">
                <Zap className="w-3 h-3 mr-1.5" />AI-Powered Analytics Platform
              </Badge>
              <h1 className="text-6xl md:text-7xl font-headline font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">Transform Data</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Into Intelligence</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Upload any dataset and instantly unlock AI-powered visualizations, natural language queries, 
                and executive-ready insights — no configuration required.
              </p>
            </div>

            {/* Upload area */}
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <DataUploader onDataLoaded={handleDataLoaded} isLoading={isProcessing} />
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Card className="p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-base mb-2">20+ Chart Types</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bar, line, treemap, box plot, waterfall, histogram, gauge, forecast, scatter, radar, and more — auto-selected by AI.
              </p>
            </Card>
            <Card className="p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <BrainCircuit className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-headline font-bold text-base mb-2">Natural Language Queries</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask questions in plain English — &ldquo;show revenue by region&rdquo; — and get instant, interactive visualizations.
              </p>
            </Card>
            <Card className="p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <FileBarChart className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-headline font-bold text-base mb-2">Executive Reports</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                One-click AI-generated analysis with key findings, predictions, and data quality assessment.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============= DASHBOARD =============
  const hasNLChart = nlQueryChart && data;
  const chartCount = recommendations?.recommendations.length || 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Collapsible Sidebar */}
      <aside className={cn(
        "border-r border-border/60 bg-card/30 backdrop-blur-xl flex flex-col z-30 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[60px]" : "w-[240px]"
      )}>
        {/* Brand */}
        <div className={cn("h-16 border-b border-border/40 flex items-center px-4 gap-3", sidebarCollapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="font-headline font-bold text-sm tracking-tight truncate">DataSense</h1>
              <p className="text-[10px] text-muted-foreground truncate">Analytics Platform</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold px-3 mb-3">Navigation</p>
          )}
          
          <button
            onClick={() => { setActiveTab('visuals'); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'visuals' 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title="Dashboard"
          >
            <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>


          <button
            onClick={() => setShowProfiler(!showProfiler)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              showProfiler 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title="Data Profiler"
          >
            <Activity className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Data Profiler</span>}
          </button>

          {!sidebarCollapsed && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold px-3 mb-3 mt-6">Actions</p>
          )}
          {sidebarCollapsed && <Separator className="my-3" />}

          <button
            onClick={handleGenerateReport}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Generate Report"
          >
            <FileBarChart className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Generate Report</span>}
          </button>

          <button
            onClick={handleExportData}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Export CSV"
          >
            <Download className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Export CSV</span>}
          </button>

          <button
            onClick={resetData}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="New Dataset"
          >
            <Upload className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>New Dataset</span>}
          </button>
        </nav>

        {/* Bottom controls */}
        <div className="p-3 border-t border-border/40 space-y-1">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
              {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <PanelRight className="w-[18px] h-[18px] shrink-0" /> : <PanelRightClose className="w-[18px] h-[18px] shrink-0" />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border/60 flex items-center justify-between px-6 bg-card/20 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-headline font-bold text-lg tracking-tight shrink-0">Intelligence Dashboard</h2>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Badge variant="secondary" className="bg-muted/50 text-xs font-medium gap-1.5 shrink-0">
              <FileText className="w-3 h-3" />
              {fileName}
            </Badge>
            {recommendations && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-medium gap-1 shrink-0">
                <BarChart3 className="w-3 h-3" />
                {chartCount} Charts
              </Badge>
            )}
            {data && (
              <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                {data.length.toLocaleString()} rows &middot; {Object.keys(data[0]).length} cols
              </Badge>
            )}
            {nlQueryChart?.filter && (
              <Badge variant="outline" className="text-xs gap-1 shrink-0 border-accent/30 text-accent bg-accent/5">
                <Search className="w-3 h-3" />
                {nlQueryChart.filter}
                <button 
                  className="ml-1 hover:text-destructive transition-colors" 
                  onClick={() => { setNlQueryChart(null); setNlQueryResult(null); }}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-medium h-8" onClick={handleGenerateReport}>
              <FileBarChart className="w-3.5 h-3.5" />Report
            </Button>
            <Button size="sm" className="gap-1.5 text-xs font-medium h-8 shadow-md shadow-primary/20" onClick={handleExportData}>
              <Download className="w-3.5 h-3.5" />Export
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Validation Warnings */}
              {validationWarnings.length > 0 && (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-600 mb-1">Data Quality Warnings</p>
                    {validationWarnings.slice(0, 3).map((w, i) => (
                      <p key={i} className="text-xs text-foreground/70 leading-relaxed">• {w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Overview */}
              <StatsOverview data={data} />

              {/* NL Query Bar */}
              <NLQueryBar onSubmit={handleNLQuery} isLoading={nlQueryLoading} result={nlQueryResult} onClearResult={() => { setNlQueryResult(null); setNlQueryChart(null); }} />

              {/* NL Query Generated Chart */}
              {hasNLChart && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <DataProfiler data={data} open={showProfiler} onClose={() => setShowProfiler(false)} />
                </div>
              )}

              {/* Main Tabs */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-2xl border border-border/40">
                    <button
                      onClick={() => setActiveTab('visuals')}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                        activeTab === 'visuals'
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                        activeTab === 'raw'
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <TableIcon className="w-4 h-4" />
                      Explorer
                    </button>
                  </div>
                  {recommendations && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{chartCount} visualizations generated</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Charts Tab */}
                {activeTab === 'visuals' && (
                  <div className="space-y-6">
                    {isProcessing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="h-[300px] bg-card/30 rounded-2xl animate-pulse flex items-center justify-center border border-border/30">
                            <div className="flex flex-col items-center gap-2">
                              <Sparkles className="w-6 h-6 text-primary/20" />
                              <span className="text-xs text-muted-foreground/40">Loading chart...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recommendations ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {recommendations.recommendations.map((rec, idx) => {
                          const xAxis = rec.columnsUsed[0];
                          const yAxis = rec.columnsUsed[1] || rec.columnsUsed[0];
                          const extraSeries = rec.columnsUsed.slice(2);
                          const chartData = chartDataMap.get(idx) || data;
                          return (
                            <div key={idx} className={cn(
                              idx === 0 ? "xl:col-span-2" : "col-span-1",
                              "min-h-[320px]"
                            )}>
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
                      <Card className="text-center py-20 border-dashed border-border/40 bg-card/10">
                        <BarChart3 className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-lg font-headline font-bold text-foreground/60">No AI Recommendations</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">The AI recommendation service is unavailable. Try uploading a different dataset or check your connection.</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Explorer Tab */}
                {activeTab === 'raw' && (
                  <div className="animate-in fade-in duration-200">
                    <VirtualizedTable data={data} columns={Object.keys(data[0])} maxRows={1000} />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Insights Sidebar */}
          <aside className={cn(
            "border-l border-border/60 bg-card/10 backdrop-blur-2xl z-20 flex flex-col transition-all duration-300 ease-in-out",
            "w-[380px]"
          )}>
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
        </div>
      </main>

      {/* Dialogs */}
      <ChartAnalysisDialog open={chartAnalysisOpen} onOpenChange={setChartAnalysisOpen} analysis={chartAnalysis} chartTitle={chartAnalysisTitle} chartType={chartAnalysisType} isLoading={chartAnalysisLoading} />
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} report={report} isLoading={reportLoading} fileName={fileName || undefined} onExport={handleExportData} />
    </div>
  );
}