
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BrainCircuit, Lightbulb, TrendingUp, Search } from 'lucide-react';
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
}

export function InsightsPanel({
  insights,
  findings,
  predictions,
  isLoading,
  groundingEnabled,
  onGroundingToggle,
  onRefresh
}: InsightsPanelProps) {
  return (
    <Card className="h-full border-none shadow-xl bg-card border-l border-border rounded-none flex flex-col">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-accent" />
            <CardTitle className="font-headline text-lg">AI Insights</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="grounding-mode" className="text-xs text-muted-foreground">Reasoning Mode</Label>
            <Switch 
              id="grounding-mode" 
              checked={groundingEnabled} 
              onCheckedChange={onGroundingToggle} 
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>
        <CardDescription className="text-xs">
          Powered by Gemini Research Max & Reasoning
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[80%]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-4">
            {insights && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-accent font-semibold">
                  <Search className="w-4 h-4" />
                  <h3 className="text-sm uppercase tracking-wider">Analysis</h3>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {insights}
                </p>
              </section>
            )}

            {findings && findings.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Lightbulb className="w-4 h-4" />
                  <h3 className="text-sm uppercase tracking-wider">Key Findings</h3>
                </div>
                <ul className="space-y-3">
                  {findings.map((finding, idx) => (
                    <li key={idx} className="flex gap-3 text-sm p-3 bg-muted/30 rounded-lg border border-border/50">
                      <span className="text-accent font-bold"># {idx + 1}</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {predictions && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <h3 className="text-sm uppercase tracking-wider">Predictions</h3>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground/90 leading-relaxed italic">
                    "{predictions}"
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </ScrollArea>
      
      {!isLoading && !insights && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
          <BrainCircuit className="w-12 h-12 text-muted mb-4 opacity-20" />
          <h3 className="text-muted-foreground font-headline">No Insights Generated</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
            Upload data to see AI-powered analysis and predictions.
          </p>
        </div>
      )}
    </Card>
  );
}
