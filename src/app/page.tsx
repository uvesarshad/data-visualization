
'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  Settings, 
  FileText, 
  BrainCircuit, 
  Sparkles, 
  Plus, 
  Layers,
  Search,
  ChevronRight,
  Database,
  Moon,
  Sun
} from 'lucide-react';
import { DataUploader } from '@/components/upload/DataUploader';
import { ChartPanel } from '@/components/dashboard/ChartPanel';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { recommendVisualizations, RecommendVisualizationsOutput } from '@/ai/flows/ai-powered-visualization-recommendations';
import { aiGeneratedDataInsights, AiGeneratedDataInsightsOutput } from '@/ai/flows/ai-generated-data-insights';
import { extractMetadata } from '@/app/lib/data-processor';
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
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDataLoaded = async (loadedData: any[], name: string) => {
    setData(loadedData);
    setFileName(name);
    setIsProcessing(true);
    setRecommendations(null);
    setInsights(null);

    try {
      const metadata = extractMetadata(loadedData);
      
      // 1. Get AI Visualization Recommendations
      const vizResult = await recommendVisualizations({
        columnMetadata: metadata,
        rowCount: loadedData.length,
        datasetDescription: `Dataset loaded from file: ${name}`
      });
      setRecommendations(vizResult);

      // 2. Generate Initial Insights
      generateInsights(loadedData, groundingEnabled);

    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Error',
        description: 'Failed to analyze dataset characteristics.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInsights = async (dataset: any[], grounded: boolean) => {
    setIsGeneratingInsights(true);
    try {
      // Sub-sample data if too large for insight generation context limit
      const sample = dataset.slice(0, 100);
      const result = await aiGeneratedDataInsights({
        dataset: JSON.stringify(sample),
        groundingEnabled: grounded
      });
      setInsights(result);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        variant: 'destructive',
        title: 'AI Insight Error',
        description: 'Failed to generate insights from the data.'
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleGroundingToggle = (enabled: boolean) => {
    setGroundingEnabled(enabled);
    if (data) {
      generateInsights(data, enabled);
    }
  };

  const resetData = () => {
    setData(null);
    setFileName(null);
    setRecommendations(null);
    setInsights(null);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-foreground">DataSense</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Transform raw files into intelligent interactive dashboards with AI-powered insights and predictions.
          </p>
        </div>
        <DataUploader onDataLoaded={handleDataLoaded} isLoading={isProcessing} />
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-center px-4">
          <div className="space-y-2">
            <div className="text-primary flex justify-center"><Layers className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Intelligent Viz</h3>
            <p className="text-sm text-muted-foreground">Automatically chooses the best chart types for your specific data structure.</p>
          </div>
          <div className="space-y-2">
            <div className="text-accent flex justify-center"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Gemini Reasoning</h3>
            <p className="text-sm text-muted-foreground">Utilizes advanced reasoning to find patterns and outliers humans might miss.</p>
          </div>
          <div className="space-y-2">
            <div className="text-green-500 flex justify-center"><Database className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Multiple Sources</h3>
            <p className="text-sm text-muted-foreground">Seamlessly import from CSV, JSON, Excel or connect your SQL databases.</p>
          </div>
        </div>
        {mounted && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed bottom-8 right-8 rounded-full bg-card shadow-lg"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-16 border-r border-border bg-card/30 flex flex-col items-center py-6 gap-8 z-20">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="icon" className="text-primary bg-primary/10 rounded-xl"><LayoutDashboard className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl"><TableIcon className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl"><Plus className="w-5 h-5" /></Button>
          <Separator className="bg-border" />
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-bold text-xl tracking-tight">Dashboard</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <FileText className="w-3 h-3 mr-1" />
              {fileName}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Search metrics..." 
                className="bg-card/50 border border-border rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48 group-hover:w-64 transition-all"
              />
            </div>
            <Button size="sm" className="bg-accent hover:bg-accent/80 text-white">Export Report</Button>
          </div>
        </header>

        {/* Dynamic Dashboard Grid */}
        <ScrollArea className="flex-1">
          <div className="p-8 pb-16">
            <Tabs defaultValue="visuals" className="w-full">
              <div className="flex items-center justify-between mb-8">
                <TabsList className="bg-card border border-border p-1">
                  <TabsTrigger value="visuals" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <LayoutDashboard className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TableIcon className="w-4 h-4" />
                    Raw Data
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-4">
                   <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-bold">{data.length}</span> records analyzed
                   </p>
                </div>
              </div>

              <TabsContent value="visuals" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isProcessing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-[350px] bg-card/30 rounded-2xl animate-pulse flex items-center justify-center border border-border/50">
                        <Sparkles className="w-8 h-8 text-muted opacity-20" />
                      </div>
                    ))}
                  </div>
                ) : recommendations ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {recommendations.recommendations.map((rec, idx) => {
                      const xKey = rec.columnsUsed[0];
                      const yKey = rec.columnsUsed[1] || rec.columnsUsed[0];
                      
                      return (
                        <div key={idx} className={cn(idx === 0 ? "lg:col-span-2 xl:col-span-2" : "")}>
                          <ChartPanel 
                            type={rec.type}
                            data={data}
                            title={rec.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            description={rec.explanation}
                            config={{
                              xAxis: xKey,
                              yAxis: yKey,
                              label: yKey
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <div className="text-center py-20 bg-card/10 rounded-2xl border border-dashed border-border">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-headline font-semibold">Generating Recommendations...</h3>
                      <p className="text-muted-foreground mt-2">AI is analyzing your dataset to suggest the most impactful visualizations.</p>
                   </div>
                )}
              </TabsContent>

              <TabsContent value="raw" className="m-0 animate-in fade-in duration-300">
                <Card className="border-border bg-card/30 overflow-hidden">
                  <div className="p-0 max-h-[70vh] overflow-auto">
                    <Table>
                      <TableHeader className="bg-card sticky top-0 z-10">
                        <TableRow>
                          {Object.keys(data[0]).map((key) => (
                            <TableHead key={key} className="font-headline font-bold text-primary uppercase text-[10px] tracking-wider">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 100).map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-primary/5 transition-colors border-border/50">
                            {Object.values(row).map((val: any, vIdx) => (
                              <TableCell key={vIdx} className="text-sm font-body py-3 border-border/30">
                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {data.length > 100 && (
                    <div className="p-4 border-t border-border bg-card/50 text-center text-xs text-muted-foreground">
                      Showing first 100 rows. Export report to view all {data.length} records.
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      {/* Right Insights Panel */}
      <aside className="w-96 border-l border-border bg-card/20 backdrop-blur-xl z-20 overflow-hidden">
        <InsightsPanel 
          insights={insights?.insights}
          findings={insights?.keyFindings}
          predictions={insights?.predictions}
          isLoading={isGeneratingInsights}
          groundingEnabled={groundingEnabled}
          onGroundingToggle={handleGroundingToggle}
          onRefresh={() => generateInsights(data, groundingEnabled)}
        />
      </aside>
    </div>
  );
}
