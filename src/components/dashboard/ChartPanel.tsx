'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
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
  
  const { chartData, stats, isValid, errorMessage } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], stats: null, isValid: false, errorMessage: 'No data available' };
    }

    try {
      const firstRow = data[0];
      const hasXAxis = config.xAxis in firstRow;
      const hasYAxis = config.yAxis in firstRow;
      
      if (!hasXAxis && !hasYAxis) {
        const keys = Object.keys(firstRow);
        const numericKeys = keys.filter(k => isNumericColumn(data, k));
        const stringKeys = keys.filter(k => !isNumericColumn(data, k));
        
        if (numericKeys.length > 0 && stringKeys.length > 0) {
          config = { xAxis: stringKeys[0], yAxis: numericKeys[0], extraSeries: numericKeys.slice(1, 4) };
        } else if (numericKeys.length >= 2) {
          config = { xAxis: numericKeys[0], yAxis: numericKeys[1], extraSeries: numericKeys.slice(2, 4) };
        } else {
          return { chartData: [], stats: null, isValid: false, errorMessage: 'Could not find suitable columns for this chart' };
        }
      } else if (!hasXAxis) {
        const keys = Object.keys(firstRow);
        const stringKey = keys.find(k => !isNumericColumn(data, k));
        if (stringKey) config = { ...config, xAxis: stringKey };
      } else if (!hasYAxis) {
        const keys = Object.keys(firstRow);
        const numKey = keys.find(k => isNumericColumn(data, k));
        if (numKey) config = { ...config, yAxis: numKey };
      }

      const prepared = prepareChartData(data, type, config.xAxis, config.yAxis, config.extraSeries);
      const computedStats = precomputedStats?.[config.yAxis] || (isNumericColumn(data, config.yAxis) ? computeStats(data, config.yAxis) : null);
      
      return {
        chartData: prepared,
        stats: computedStats,
        isValid: prepared.length > 0,
        errorMessage: prepared.length === 0 ? 'No valid data points after transformation' : undefined,
      };
    } catch (err) {
      console.error('Chart data preparation error:', err);
      return { chartData: [], stats: null, isValid: false, errorMessage: 'Error processing data for chart' };
    }
  }, [data, type, config.xAxis, config.yAxis, config.extraSeries, precomputedStats]);

  const chartConfig = useMemo(() => {
    const cfg: any = {};
    cfg[config.yAxis] = { label: config.yAxis, color: '#6366F1' };
    config.extraSeries?.forEach((series, idx) => {
      const colors = ['#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#8B5CF6'];
      cfg[series] = { label: series, color: colors[idx % colors.length] };
    });
    return cfg;
  }, [config.yAxis, config.extraSeries]);

  const handleAnalyze = async () => {
    if (!onAnalyze) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze(title, type, data, config);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="h-full border border-border/50 shadow-md bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-primary/5 transition-all">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-headline font-bold text-primary group-hover:text-accent transition-colors truncate">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-[10px] leading-tight line-clamp-1 opacity-70 mt-0.5">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 bg-muted/50">
              {type.replace(/_/g, ' ')}
            </Badge>
            {onAnalyze && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                title="AI Analysis"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BrainCircuit className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-muted-foreground">
              Min: <span className="font-bold text-foreground">{stats.min.toLocaleString()}</span>
            </span>
            <span className="text-[9px] text-muted-foreground">
              Avg: <span className="font-bold text-foreground">{stats.mean.toLocaleString()}</span>
            </span>
            <span className="text-[9px] text-muted-foreground">
              Max: <span className="font-bold text-foreground">{stats.max.toLocaleString()}</span>
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 min-h-[220px] p-2 relative">
        <ChartContainer config={chartConfig} className="w-full h-full absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ChartRenderer
              type={type}
              chartData={chartData}
              config={config}
              stats={stats}
              isValid={isValid}
              errorMessage={errorMessage}
              rawData={data}
            />
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}