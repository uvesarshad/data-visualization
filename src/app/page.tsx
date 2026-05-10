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
  Sun,
  LayoutGrid,
  Zap
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
      
      const vizResult = await recommendVisualizations({
        columnMetadata: metadata,
        rowCount: loadedData.length,
        datasetDescription: `Dataset loaded from file: ${name}`
      });
      setRecommendations(vizResult);

      generateInsights(loadedData, groundingEnabled);

    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Error',
        description: 'Failed to analyze dataset.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInsights = async (dataset: any[], grounded: boolean) => {
    setIsGeneratingInsights(true);
    try {
      const sample = dataset.slice(0, 50);
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
        description: 'Failed to generate insights.'
      });
    } finally {
      setIsGeneratingInsights(false);
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
            The AI engine that makes your data visual and actionable in seconds.
          </p>
        </div>
        <DataUploader onDataLoaded={handleDataLoaded} isLoading={isProcessing} />
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-center px-4">
          <div className="space-y-2 group p-4 rounded-xl hover:bg-card/50 transition-all">
            <div className="text-primary flex justify-center"><LayoutGrid className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Diverse Viz</h3>
            <p className="text-sm text-muted-foreground">From Radar to Stacked Bars, the AI picks the most expressive format.</p>
          </div>
          <div className="space-y-2 group p-4 rounded-xl hover:bg-card/50 transition-all">
            <div className="text-accent flex justify-center"><Zap className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Instant Flow</h3>
            <p className="text-sm text-muted-foreground">Upload and see a full dashboard instantly without manual config.</p>
          </div>
          <div className="space-y-2 group p-4 rounded-xl hover:bg-card/50 transition-all">
            <div className="text-green-500 flex justify-center"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="font-headline font-semibold">Smart Insights</h3>
            <p className="text-sm text-muted-foreground">Gemini analyzes every data point to find the "Why" behind the "What".</p>
          </div>
        </div>
        {mounted && (
          <Button 
            variant="outline" 
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
      <aside className="w-16 border-r border-border bg-card/20 flex flex-col items-center py-6 gap-8 z-20">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="icon" className="text-primary bg-primary/10 rounded-xl"><LayoutDashboard className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl"><TableIcon className="w-5 h-5" /></Button>
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

      <main className="flex-1 flex flex-col min-w-0 bg-background/30 relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/10 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-bold text-xl">Intelligence Dashboard</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 font-medium">
              <FileText className="w-3 h-3 mr-2" />
              {fileName}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Find metrics..." 
                className="bg-card/50 border border-border rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-40 transition-all"
              />
            </div>
            <Button size="sm" className="bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20">Share Insights</Button>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8">
            <Tabs defaultValue="visuals" className="w-full">
              <div className="flex items-center justify-between mb-8">
                <TabsList className="bg-card/50 border border-border p-1">
                  <TabsTrigger value="visuals" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboards
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TableIcon className="w-4 h-4" />
                    Explorer
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-4">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    <span className="text-primary">{data.length}</span> Records processed
                   </p>
                </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {recommendations.recommendations.map((rec, idx) => {
                      const xAxis = rec.columnsUsed[0];
                      const yAxis = rec.columnsUsed[1] || rec.columnsUsed[0];
                      const extraSeries = rec.columnsUsed.slice(2);
                      
                      return (
                        <div key={idx} className={cn(
                          idx === 0 ? "lg:col-span-2" : "col-span-1"
                        )}>
                          <ChartPanel 
                            type={rec.type}
                            data={data}
                            title={rec.title}
                            description={rec.explanation}
                            config={{ xAxis, yAxis, extraSeries }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <div className="text-center py-24 bg-card/5 rounded-2xl border border-dashed border-border/50">
                      <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-headline font-semibold">Mapping Data Streams...</h3>
                      <p className="text-xs text-muted-foreground mt-2">AI is architecting the best visual layout for your data.</p>
                   </div>
                )}
              </TabsContent>

              <TabsContent value="raw" className="m-0">
                <Card className="border-border/50 bg-card/20 overflow-hidden">
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
                        {data.slice(0, 50).map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-primary/5 transition-colors border-border/20">
                            {Object.values(row).map((val: any, vIdx) => (
                              <TableCell key={vIdx} className="text-xs py-3 font-medium opacity-80">
                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 border-t border-border/30 bg-card/10 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Showing top 50 records
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      <aside className="w-[380px] border-l border-border bg-card/10 backdrop-blur-2xl z-20 flex flex-col">
        <InsightsPanel 
          insights={insights?.insights}
          findings={insights?.keyFindings}
          predictions={insights?.predictions}
          isLoading={isGeneratingInsights}
          groundingEnabled={groundingEnabled}
          onGroundingToggle={(enabled) => {
            setGroundingEnabled(enabled);
            generateInsights(data, enabled);
          }}
          onRefresh={() => generateInsights(data, groundingEnabled)}
        />
      </aside>
    </div>
  );
}
