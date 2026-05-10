'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Lightbulb, TrendingUp, Search, RefreshCw, Sparkles, AlertCircle, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm">AI Insights</h3>
              <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-3 p-2.5 bg-muted/20 rounded-lg border border-border/30">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <Label htmlFor="grounding-mode" className="text-[11px] text-muted-foreground cursor-pointer">Deep Research</Label>
          </div>
          <Switch 
            id="grounding-mode" 
            checked={groundingEnabled} 
            onCheckedChange={onGroundingToggle} 
            className="data-[state=checked]:bg-accent scale-75"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          {isLoading ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Skeleton className="h-3 w-[120px] bg-muted/30 rounded" />
                <Skeleton className="h-20 w-full bg-muted/20 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-[100px] bg-muted/30 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full bg-muted/20 rounded" />
                  <Skeleton className="h-3 w-full bg-muted/20 rounded" />
                  <Skeleton className="h-3 w-[75%] bg-muted/20 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-[80px] bg-muted/30 rounded" />
                <Skeleton className="h-14 w-full bg-muted/20 rounded-xl" />
              </div>
            </div>
          ) : analysisError ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-destructive/50" />
              </div>
              <h3 className="text-sm font-headline font-bold text-destructive/80">Analysis Failed</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{analysisError}</p>
              <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2 rounded-lg gap-1.5">
                <RefreshCw className="w-3 h-3" /> Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {insights && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                      <Search className="w-3 h-3 text-accent" />
                    </div>
                    <h4 className="text-[11px] uppercase tracking-wider text-accent font-bold">Deep Analysis</h4>
                  </div>
                  <div className="p-4 bg-muted/10 rounded-xl border border-border/30">
                    <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {insights}
                    </p>
                  </div>
                </section>
              )}

              {findings && findings.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <Lightbulb className="w-3 h-3 text-primary" />
                    </div>
                    <h4 className="text-[11px] uppercase tracking-wider text-primary font-bold">Key Findings</h4>
                    <Badge variant="secondary" className="text-[9px] ml-auto bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                      {findings.length}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {findings.map((finding, idx) => (
                      <li key={idx} className="flex gap-3 text-[13px] p-3 bg-muted/10 rounded-xl border border-border/25 hover:border-primary/20 hover:bg-muted/15 transition-all">
                        <span className="text-accent font-bold text-[11px] shrink-0 mt-0.5 w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-foreground/85 leading-relaxed">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {predictions && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    </div>
                    <h4 className="text-[11px] uppercase tracking-wider text-green-500 font-bold">Predictions</h4>
                  </div>
                  <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-foreground/90 leading-relaxed">
                        {predictions}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {!insights && !findings && !predictions && !isLoading && (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-sm font-headline font-bold text-muted-foreground/60">No Insights Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                    Upload a dataset to see AI-powered analysis and predictions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}