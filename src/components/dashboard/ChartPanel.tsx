'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { prepareChartData, computeStats, isNumericColumn } from '@/app/lib/chart-utils';
import { ChartSkeleton } from './ChartSkeleton';

// 4.1: Dynamic import — Recharts + chart logic loaded only when a chart renders
const ChartRenderer = dynamic(() => import('@/components/charts/ChartRenderer'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

interface ChartPanelProps {
  type: string;
  data: any[];
  title: string;
  description?: string;
  config: {
    xAxis: string;
    yAxis: string;
    extraSeries?: string[];
  };
  onAnalyze?: (chartTitle: string, chartType: string, data: any[], config: any) => void;
  precomputedStats?: Record<string, any>;
}

export function ChartPanel({ type, data, title, description, config, onAnalyze, precomputedStats }: ChartPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { chartData, stats, isValid, errorMessage, effectiveConfig } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], stats: null, isValid: false, errorMessage: 'No data available', effectiveConfig: config };
    }

    try {
      let currentConfig = { ...config };
      const firstRow = data[0];
      const hasXAxis = currentConfig.xAxis in firstRow;
      const hasYAxis = currentConfig.yAxis in firstRow;
      
      if (!hasXAxis && !hasYAxis) {
        const keys = Object.keys(firstRow);
        const numericKeys = keys.filter(k => isNumericColumn(data, k));
        const stringKeys = keys.filter(k => !isNumericColumn(data, k));
        
        if (numericKeys.length > 0 && stringKeys.length > 0) {
          currentConfig = { xAxis: stringKeys[0], yAxis: numericKeys[0], extraSeries: numericKeys.slice(1, 4) };
        } else if (numericKeys.length >= 2) {
          currentConfig = { xAxis: numericKeys[0], yAxis: numericKeys[1], extraSeries: numericKeys.slice(2, 4) };
        } else {
          return { chartData: [], stats: null, isValid: false, errorMessage: 'Could not find suitable columns for this chart', effectiveConfig: currentConfig };
        }
      } else if (!hasXAxis) {
        const keys = Object.keys(firstRow);
        const stringKey = keys.find(k => !isNumericColumn(data, k));
        if (stringKey) currentConfig = { ...currentConfig, xAxis: stringKey };
      } else if (!hasYAxis) {
        const keys = Object.keys(firstRow);
        const numKey = keys.find(k => isNumericColumn(data, k));
        if (numKey) currentConfig = { ...currentConfig, yAxis: numKey };
      }

      console.log('[ChartPanel] Preparing data for:', type, 'config:', currentConfig);
      
      const prepared = prepareChartData(data, type, currentConfig.xAxis, currentConfig.yAxis, currentConfig.extraSeries);
      
      const computedStats = precomputedStats?.[currentConfig.yAxis] || (isNumericColumn(data, currentConfig.yAxis) ? computeStats(data, currentConfig.yAxis) : null);
      
      return {
        chartData: prepared,
        stats: computedStats,
        isValid: prepared.length > 0,
        errorMessage: prepared.length === 0 ? `Could not prepare data for ${type}` : undefined,
        effectiveConfig: currentConfig
      };
    } catch (err) {
      console.error('Chart data preparation error:', err);
      return { chartData: [], stats: null, isValid: false, errorMessage: 'Data preparation error', effectiveConfig: config };
    }
  }, [data, type, config, precomputedStats]);

  const chartConfig = useMemo(() => {
    const cfg: any = {};
    cfg[effectiveConfig.yAxis] = { label: effectiveConfig.yAxis, color: '#6366F1' };
    effectiveConfig.extraSeries?.forEach((series, idx) => {
      const colors = ['#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#8B5CF6'];
      cfg[series] = { label: series, color: colors[idx % colors.length] };
    });
    return cfg;
  }, [effectiveConfig.yAxis, effectiveConfig.extraSeries]);

  const handleAnalyze = async () => {
    if (!onAnalyze) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze(title, type, data, effectiveConfig);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="h-full border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 rounded-2xl">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-headline font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors truncate">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-[11px] leading-relaxed line-clamp-1 opacity-60 mt-0.5">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-muted/40 border border-border/30">
              {type.replace(/_/g, ' ')}
            </Badge>
            {onAnalyze && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                title="AI Analysis"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BrainCircuit className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              Min <span className="font-semibold text-foreground/80">{stats.min.toLocaleString()}</span>
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-border" />
            <span className="text-[10px] text-muted-foreground">
              Avg <span className="font-semibold text-foreground/80">{stats.mean.toLocaleString()}</span>
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-border" />
            <span className="text-[10px] text-muted-foreground">
              Max <span className="font-semibold text-foreground/80">{stats.max.toLocaleString()}</span>
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-3 pt-0 overflow-hidden">
        <div className="w-full h-[280px] min-h-[280px] relative">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ChartRenderer
              type={type}
              chartData={chartData}
              config={effectiveConfig}
              stats={stats}
              isValid={isValid}
              errorMessage={errorMessage}
              rawData={data}
            />
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}