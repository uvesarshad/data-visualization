'use client';

import React from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Layers, Lightbulb, Target, Loader2, BrainCircuit } from 'lucide-react';
import type { BatchChartAnalysisOutput } from '@/ai/flows/batch-chart-analysis';

interface BatchAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BatchChartAnalysisOutput | null;
  isLoading: boolean;
  chartCount: number;
}

export function BatchAnalysisDialog({ open, onOpenChange, result, isLoading, chartCount }: BatchAnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <DialogTitle className="font-headline">Batch Chart Analysis</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            One-shot Gemini analysis of all {chartCount} charts on the dashboard, with cross-chart insights.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div>
                <p className="text-sm font-headline font-semibold">Analyzing {chartCount} charts...</p>
                <p className="text-xs text-muted-foreground">Gemini is correlating patterns across charts</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6 py-2">
              {/* Cross-chart insights — top placement */}
              {result.crossChartInsights && result.crossChartInsights.length > 0 && (
                <section className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Cross-Chart Insights</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.crossChartInsights.map((ins, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-primary font-bold shrink-0">#{i + 1}</span>
                        <span className="text-foreground/90 leading-relaxed">{ins}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Per-chart results */}
              <div className="space-y-4">
                {result.results.map((r, i) => (
                  <section key={i} className="p-4 bg-card/40 border border-border/40 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit className="w-4 h-4 text-accent" />
                      <h4 className="text-sm font-headline font-bold">{r.chartTitle}</h4>
                    </div>

                    <p className="text-sm text-foreground/85 leading-relaxed mb-3">{r.analysis}</p>

                    {r.insights && r.insights.length > 0 && (
                      <>
                        <Separator className="bg-border/30 my-2" />
                        <ul className="space-y-1.5 mb-3">
                          {r.insights.map((ins, j) => (
                            <li key={j} className="flex gap-2 text-xs">
                              <span className="text-accent shrink-0">•</span>
                              <span className="text-foreground/85 leading-relaxed">{ins}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {r.recommendation && (
                      <div className="flex gap-2 p-2.5 bg-green-500/5 border border-green-500/15 rounded-lg">
                        <Target className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground/85 leading-relaxed">{r.recommendation}</p>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">No batch analysis yet</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
