'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2, RefreshCw, Sparkles, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { detectAnomalies } from '@/app/lib/statistics';
import { isNumericColumn, computeStats } from '@/app/lib/chart-utils';
import type { AnomalyDetectionOutput } from '@/ai/flows/anomaly-detection';

interface AnomalyPanelProps {
  data: any[];
  open: boolean;
  onClose: () => void;
  onRunAI: (params: { dataset: string; columnStats: string; anomalies: string }) => Promise<void>;
  aiResult: AnomalyDetectionOutput | null;
  isLoadingAI: boolean;
  error?: string | null;
}

const SEVERITY_STYLE: Record<string, { badge: string; icon: string }> = {
  low:      { badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: 'text-blue-500' },
  medium:   { badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: 'text-yellow-500' },
  high:     { badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: 'text-orange-500' },
  critical: { badge: 'bg-red-500/10 text-red-500 border-red-500/20', icon: 'text-red-500' },
};

export function AnomalyPanel({ data, open, onClose, onRunAI, aiResult, isLoadingAI, error }: AnomalyPanelProps) {
  // Client-side statistical anomaly detection per numeric column
  const statisticalAnomalies = useMemo(() => {
    if (!data || data.length === 0) return [];
    const columns = Object.keys(data[0]);
    const numericCols = columns.filter(c => isNumericColumn(data, c));
    return numericCols.map(col => {
      const values = data.map(r => Number(r[col])).filter(v => !isNaN(v) && isFinite(v));
      const { anomalies, threshold } = detectAnomalies(values);
      return { column: col, anomalies, threshold, total: values.length };
    }).filter(r => r.anomalies.length > 0);
  }, [data]);

  const totalAnomalies = statisticalAnomalies.reduce((acc, c) => acc + c.anomalies.length, 0);

  const handleRunAI = async () => {
    if (!data || data.length === 0) return;

    const sample = data.slice(0, 100);
    const datasetStr = JSON.stringify(sample);

    // Build columnStats payload for all numeric columns
    const stats: Record<string, any> = {};
    const numericCols = Object.keys(data[0]).filter(c => isNumericColumn(data, c));
    numericCols.forEach(col => {
      const s = computeStats(data, col);
      if (s) stats[col] = s;
    });

    // Build flat anomaly list for the prompt
    const flatAnomalies = statisticalAnomalies.flatMap(c =>
      c.anomalies.slice(0, 5).map(v => ({
        column: c.column,
        value: v,
        expectedRange: `[${c.threshold.lower.toFixed(2)}, ${c.threshold.upper.toFixed(2)}]`,
      }))
    );

    await onRunAI({
      dataset: datasetStr,
      columnStats: JSON.stringify(stats),
      anomalies: JSON.stringify(flatAnomalies),
    });
  };

  if (!open) return null;

  return (
    <Card className="border border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <CardTitle className="text-sm font-headline">Anomaly Detection</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-bold">
              {totalAnomalies} flagged
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose} aria-label="Close anomaly panel">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Statistical outliers detected via IQR. Click "Explain with AI" for business context and recommendations.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        {/* Statistical summary */}
        {statisticalAnomalies.length === 0 ? (
          <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <p className="text-sm text-foreground/80">No statistical outliers detected in any numeric column.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {statisticalAnomalies.map((c, i) => (
              <div key={i} className="p-2.5 bg-muted/15 rounded-lg border border-border/25 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{c.column}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Expected range [{c.threshold.lower.toFixed(2)}, {c.threshold.upper.toFixed(2)}] · {c.total} values
                  </p>
                </div>
                <Badge variant="secondary" className="text-[9px] bg-orange-500/10 text-orange-500">
                  {c.anomalies.length} outliers
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* AI explanation trigger */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {aiResult ? 'AI analysis below ↓' : 'Get a business-context explanation from Gemini.'}
          </p>
          <Button
            size="sm"
            variant={aiResult ? 'outline' : 'default'}
            className="gap-1.5 h-8 rounded-xl"
            onClick={handleRunAI}
            disabled={isLoadingAI || totalAnomalies === 0}
          >
            {isLoadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiResult ? 'Re-run AI' : 'Explain with AI'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/5 border border-destructive/15 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* AI Result */}
        {aiResult && (
          <>
            <Separator className="bg-border/30" />
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4 pr-3">
                {/* Summary */}
                <section>
                  <h4 className="text-[11px] uppercase tracking-wider text-primary font-bold mb-2">Summary</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{aiResult.summary}</p>
                </section>

                {/* Per-anomaly explanations */}
                {aiResult.anomalies && aiResult.anomalies.length > 0 && (
                  <section>
                    <h4 className="text-[11px] uppercase tracking-wider text-orange-500 font-bold mb-2">
                      Anomalies ({aiResult.anomalies.length})
                    </h4>
                    <ul className="space-y-2">
                      {aiResult.anomalies.map((a, i) => {
                        const sev = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.medium;
                        return (
                          <li key={i} className="p-3 bg-muted/15 rounded-lg border border-border/25">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold">{a.column}</span>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className={`text-[9px] uppercase tracking-wider font-bold ${sev.badge}`}>
                                  {a.severity}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">{a.value}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mb-1.5">
                              Expected: {a.expectedRange}
                            </p>
                            <p className="text-xs text-foreground/85 leading-relaxed">{a.explanation}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {/* Recommendations */}
                {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                  <section>
                    <h4 className="text-[11px] uppercase tracking-wider text-green-500 font-bold mb-2">Recommendations</h4>
                    <ul className="space-y-1.5">
                      {aiResult.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs p-2 bg-green-500/5 border border-green-500/15 rounded-lg">
                          <span className="text-green-500 font-bold shrink-0">#{i + 1}</span>
                          <span className="text-foreground/85 leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Quality impact */}
                {aiResult.dataQualityImpact && (
                  <section>
                    <h4 className="text-[11px] uppercase tracking-wider text-yellow-500 font-bold mb-2">Quality Impact</h4>
                    <p className="text-xs text-foreground/85 leading-relaxed p-2.5 bg-yellow-500/5 border border-yellow-500/15 rounded-lg">
                      {aiResult.dataQualityImpact}
                    </p>
                  </section>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
