'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Lightbulb, TrendingUp, Search, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface InsightsPanelProps {
  insights?: string;
  findings?: string[];
  predictions?: string;
  isLoading: boolean;
  groundingEnabled: boolean;
  onGroundingToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  analysisError?: string | null;
}

export function InsightsPanel({
  insights,
  findings,
  predictions,
  isLoading,
  groundingEnabled,
  onGroundingToggle,
  onRefresh,
  analysisError,
}: InsightsPanelProps) {
  return (
    <Card className="h-full border-none shadow-xl bg-card border-l border-border rounded-none flex flex-col">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-accent" />
            <CardTitle className="font-headline text-lg">AI Insights</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh insights"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <CardDescription className="text-xs">
            Powered by Gemini AI
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Label htmlFor="grounding-mode" className="text-[10px] text-muted-foreground">Deep Research</Label>
            <Switch 
              id="grounding-mode" 
              checked={groundingEnabled} 
              onCheckedChange={onGroundingToggle} 
              className="data-[state=checked]:bg-accent scale-75"
            />
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px] bg-muted/30" />
              <Skeleton className="h-24 w-full bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[120px] bg-muted/30" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full bg-muted/20" />
                <Skeleton className="h-3 w-full bg-muted/20" />
                <Skeleton className="h-3 w-[80%] bg-muted/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px] bg-muted/30" />
              <Skeleton className="h-16 w-full bg-muted/20" />
            </div>
          </div>
        ) : analysisError ? (
          <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
            <AlertCircle className="w-10 h-10 text-destructive/30" />
            <h3 className="text-sm font-headline font-semibold text-destructive">Analysis Failed</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">{analysisError}</p>
            <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
              <RefreshCw className="w-3 h-3 mr-2" /> Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-7 pb-4">
            {insights && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-accent font-semibold">
                  <Search className="w-4 h-4" />
                  <h3 className="text-xs uppercase tracking-wider">Deep Analysis</h3>
                </div>
                <div className="p-3.5 bg-muted/15 rounded-xl border border-border/30">
                  <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {insights}
                  </p>
                </div>
              </section>
            )}

            {findings && findings.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Lightbulb className="w-4 h-4" />
                  <h3 className="text-xs uppercase tracking-wider">Key Findings</h3>
                  <Badge variant="secondary" className="text-[8px] ml-auto bg-primary/10 text-primary">
                    {findings.length}
                  </Badge>
                </div>
                <ul className="space-y-2.5">
                  {findings.map((finding, idx) => (
                    <li key={idx} className="flex gap-2.5 text-[13px] p-3 bg-muted/15 rounded-xl border border-border/25 hover:border-primary/20 transition-colors">
                      <span className="text-accent font-bold text-xs shrink-0 mt-0.5">#{idx + 1}</span>
                      <span className="text-foreground/85 leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {predictions && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-green-500 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <h3 className="text-xs uppercase tracking-wider">Predictions & Forecast</h3>
                </div>
                <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-foreground/90 leading-relaxed">
                      {predictions}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {!insights && !findings && !predictions && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
                <BrainCircuit className="w-12 h-12 text-muted-foreground/15" />
                <h3 className="text-sm font-headline font-semibold text-muted-foreground">No Insights Generated</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Upload data to see AI-powered analysis and predictions.
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}