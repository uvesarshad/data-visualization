'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { extractMetadata } from '@/app/lib/data-processor';
import { computeStats } from '@/app/lib/chart-utils';
import { validateData, cleanData } from '@/app/lib/data-validation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
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
  const [nlQueryResult, setNlQueryResult] = useState<{ title: string; explanation: string; chartType: string } | null>(null);
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

  useEffect(() => {
    setMounted(true);
  }, []);

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

    try {
      const metadata = extractMetadata(cleaned);
      
      const vizResult = await recommendVisualizations({
        columnMetadata: metadata,
        rowCount: cleaned.length,
        datasetDescription: `Dataset loaded from file: ${name}. Columns: ${Object.keys(cleaned[0]).join(', ')}`
      });
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
    setIsGeneratingInsights(true);
    setAnalysisError(null);
    try {
      const sample = dataset.slice(0, 50);
      const result = await aiGeneratedDataInsights({
        dataset: JSON.stringify(sample),
        groundingEnabled: grounded
      });
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
      const sample = chartData.slice(0, 30);
      const statsInfo: Record<string, any> = {};
      columnsUsed.forEach((col: string) => {
        const colStats = computeStats(chartData, col);
        if (colStats) statsInfo[col] = colStats;
      });

      const result = await perChartAnalysis({
        chartTitle,
        chartType,
        columnsUsed,
        dataSummary: JSON.stringify({ sample: sample.slice(0, 10), totalRows: chartData.length, columns: columnsUsed, statistics: statsInfo }, null, 2),
      });
      setChartAnalysis(result);
    } catch (error) {
      console.error('Error analyzing chart:', error);
      toast({ variant: 'destructive', title: 'Chart Analysis Error', description: 'Failed to analyze this chart.' });
    } finally {
      setChartAnalysisLoading(false);
    }
  }, [toast]);

  const handleNLQuery = useCallback(async (query: string) => {
    if (!data) return;
    setNlQueryLoading(true);
    setNlQueryResult(null);
    setNlQueryChart(null);

    try {
      const metadata = extractMetadata(data);
      const result = await naturalLanguageQuery({
        query,
        columnMetadata: JSON.stringify(metadata),
        rowCount: data.length,
      });
      setNlQueryChart(result);
      setNlQueryResult({ title: result.title, explanation: result.explanation, chartType: result.chartType });
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
      const metadata = extractMetadata(data);
      const statsInfo: Record<string, any> = {};
      metadata.filter(m => m.isNumerical).forEach(m => {
        const colStats = computeStats(data, m.name);
        if (colStats) statsInfo[m.name] = colStats;
      });

      const result = await generateReport({
        dataset: JSON.stringify(data.slice(0, 50)),
        columnStats: JSON.stringify(statsInfo),
        insights: insights?.insights,
        fileName,
        rowCount: data.length,
        columnCount: Object.keys(data[0]).length,
      });
      setReport(result);
    } catch (error) {
      console.error('Report generation error:', error);
      toast({ variant: 'destructive', title: 'Report Error', description: 'Failed to generate report.' });
    } finally {
      setReportLoading(false);
    }
  }, [data, fileName, insights, toast]);

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

            {/* NL Query Generated Chart */}
            {nlQueryChart && data && (
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ChartPanel
                  type={nlQueryChart.chartType}
                  data={data}
                  title={nlQueryChart.title}
                  description={nlQueryChart.explanation}
                  config={{ xAxis: nlQueryChart.xAxis, yAxis: nlQueryChart.yAxis, extraSeries: nlQueryChart.extraSeries }}
                  onAnalyze={handleChartAnalysis}
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
                      return (
                        <div key={idx} className={cn(idx === 0 ? "xl:col-span-2" : "col-span-1")}>
                          <ChartPanel 
                            type={rec.type}
                            data={data}
                            title={rec.title}
                            description={rec.explanation}
                            config={{ xAxis, yAxis, extraSeries }}
                            onAnalyze={handleChartAnalysis}
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
                <Card className="border-border bg-card/30 overflow-hidden">
                  <div className="p-0 max-h-[75vh] overflow-auto">
                    <Table>
                      <TableHeader className="bg-card/80 backdrop-blur sticky top-0 z-10 border-b border-border">
                        <TableRow className="hover:bg-transparent">
                          {Object.keys(data[0]).map((key) => (
                            <TableHead key={key} className="font-headline font-bold text-primary uppercase text-[9px] tracking-widest py-4">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 100).map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-primary/5 transition-colors border-border/20">
                            {Object.values(row).map((val: any, vIdx) => (
                              <TableCell key={vIdx} className="text-xs py-3 font-medium opacity-80">
                                {typeof val === 'number' ? val.toLocaleString() : String(val).substring(0, 30)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 border-t border-border/30 bg-card/10 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Showing top 100 of {data.length.toLocaleString()} records
                  </div>
                </Card>
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