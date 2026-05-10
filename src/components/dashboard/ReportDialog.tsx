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
import { Button } from '@/components/ui/button';
import {
  FileText, TrendingUp, TrendingDown, Minus, Target,
  AlertCircle, CheckCircle2, Download, Loader2
} from 'lucide-react';
import { ReportGenerationOutput } from '@/ai/flows/report-generation';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportGenerationOutput | null;
  isLoading: boolean;
  fileName?: string;
  onExport?: () => void;
}

export function ReportDialog({
  open,
  onOpenChange,
  report,
  isLoading,
  fileName,
  onExport,
}: ReportDialogProps) {
  const trendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
      case 'down': return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
      default: return <Minus className="w-3.5 h-3.5 text-yellow-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <DialogTitle className="font-headline">Data Analysis Report</DialogTitle>
            </div>
            {report && onExport && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onExport}>
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            )}
          </div>
          {fileName && (
            <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-bold w-fit">
              {fileName}
            </Badge>
          )}
          <DialogDescription className="text-xs">
            AI-generated comprehensive analysis report
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {isLoading ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-headline font-semibold">Generating Report...</p>
                  <p className="text-xs text-muted-foreground">AI is analyzing your data</p>
                </div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
                  <div className="h-16 w-full bg-muted/20 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : report ? (
            <div className="space-y-6 py-2">
              {/* Executive Summary */}
              <section className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Executive Summary</h3>
                <p className="text-sm text-foreground/90 leading-relaxed">{report.executiveSummary}</p>
              </section>

              {/* Key Metrics */}
              {report.keyMetrics && report.keyMetrics.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {report.keyMetrics.map((metric, idx) => (
                      <div key={idx} className="p-3 bg-muted/15 rounded-lg border border-border/25">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
                          {trendIcon(metric.trend)}
                        </div>
                        <p className="text-lg font-headline font-bold">{metric.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{metric.insight}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <Separator className="bg-border/30" />

              {/* Report Sections */}
              {report.sections && report.sections.map((section, idx) => (
                <section key={idx}>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{section.title}</h3>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                </section>
              ))}

              <Separator className="bg-border/30" />

              {/* Action Items */}
              {report.actionItems && report.actionItems.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {report.actionItems.map((item, idx) => (
                      <li key={idx} className="flex gap-2.5 text-sm p-3 bg-green-500/5 border border-green-500/15 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-foreground/85 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Data Quality Notes */}
              {report.dataQualityNotes && (
                <section>
                  <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Data Quality Notes
                  </h3>
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-lg">
                    <p className="text-sm text-foreground/85 leading-relaxed">{report.dataQualityNotes}</p>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">No report generated yet</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}