'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, Lightbulb, Target, BarChart3 } from 'lucide-react';
import { PerChartAnalysisOutput } from '@/ai/flows/per-chart-analysis';

interface ChartAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: PerChartAnalysisOutput | null;
  chartTitle: string;
  chartType: string;
  isLoading: boolean;
}

export function ChartAnalysisDialog({
  open,
  onOpenChange,
  analysis,
  chartTitle,
  chartType,
  isLoading,
}: ChartAnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-accent" />
            <DialogTitle className="font-headline">Chart Analysis</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-bold">
              {chartType.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">{chartTitle}</span>
          </div>
          <DialogDescription className="text-xs">
            AI-powered analysis of this specific visualization
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                <div className="h-20 w-full bg-muted/30 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted/30 rounded animate-pulse" />
                <div className="h-3 w-3/5 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6 py-2">
              {/* Analysis Section */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <BarChart3 className="w-4 h-4" />
                  <h3 className="text-xs uppercase tracking-wider">Detailed Analysis</h3>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {analysis.analysis}
                </p>
              </section>

              <Separator className="bg-border/30" />

              {/* Key Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-semibold">
                    <Lightbulb className="w-4 h-4" />
                    <h3 className="text-xs uppercase tracking-wider">Key Insights</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, idx) => (
                      <li key={idx} className="flex gap-2 text-sm p-2.5 bg-muted/20 rounded-lg border border-border/30">
                        <span className="text-accent font-bold shrink-0 text-xs">#{idx + 1}</span>
                        <span className="text-foreground/85 leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <Separator className="bg-border/30" />

              {/* Recommendation */}
              {analysis.recommendation && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-green-500 font-semibold">
                    <Target className="w-4 h-4" />
                    <h3 className="text-xs uppercase tracking-wider">Recommendation</h3>
                  </div>
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {analysis.recommendation}
                    </p>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">No analysis available</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}