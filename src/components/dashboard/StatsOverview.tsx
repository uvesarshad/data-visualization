'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Hash, 
  Type, 
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
} from 'lucide-react';
import { computeStats, isNumericColumn, getUniqueValues } from '@/app/lib/chart-utils';
import { parseTimestamp } from '@/app/lib/statistics';

interface StatsOverviewProps {
  data: Record<string, any>[];
}

export function StatsOverview({ data }: StatsOverviewProps) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => isNumericColumn(data, col));
    const categoricalColumns = columns.filter(col => !isNumericColumn(data, col));

    const primaryNumeric = numericColumns[0];
    const primaryStats = primaryNumeric ? computeStats(data, primaryNumeric) : null;

    // Find a temporal column to anchor the trend. Without one, "trend" is
    // meaningless (row order is arbitrary for most datasets), so we suppress it.
    const temporalCol = (() => {
      for (const col of categoricalColumns) {
        const sample = data.slice(0, Math.min(20, data.length));
        const parsedCount = sample.filter(r => parseTimestamp(r[col]) != null).length;
        if (parsedCount / sample.length >= 0.6) return col;
      }
      return null;
    })();

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendPct = 0;
    if (primaryNumeric && temporalCol && data.length >= 10) {
      // Sort a copy by parsed timestamp so the "first half / second half" split
      // is chronological, not row-order.
      const sortable = data
        .map(r => ({ ts: parseTimestamp(r[temporalCol]), value: Number(r[primaryNumeric]) || 0 }))
        .filter(r => r.ts != null)
        .sort((a, b) => (a.ts! - b.ts!));
      if (sortable.length >= 10) {
        const mid = Math.floor(sortable.length / 2);
        const firstAvg = sortable.slice(0, mid).reduce((s, r) => s + r.value, 0) / mid;
        const secondAvg = sortable.slice(mid).reduce((s, r) => s + r.value, 0) / (sortable.length - mid);
        if (firstAvg !== 0) {
          trendPct = Math.round(((secondAvg - firstAvg) / Math.abs(firstAvg)) * 10000) / 100;
          trend = trendPct > 2 ? 'up' : trendPct < -2 ? 'down' : 'neutral';
        }
      }
    }

    return {
      records: data.length,
      columns: columns.length,
      numericCols: numericColumns.length,
      categoricalCols: categoricalColumns.length,
      primaryNumeric,
      primaryStats,
      trend,
      trendPct,
      uniqueCategories: categoricalColumns.length > 0 ? getUniqueValues(data, categoricalColumns[0]).length : 0,
      topCategory: categoricalColumns[0] || null,
    };
  }, [data]);

  if (!stats) return null;

  const StatCard = ({ 
    icon, 
    iconBg, 
    label, 
    value, 
    detail,
    trend,
    trendPct,
  }: { 
    icon: React.ReactNode; 
    iconBg: string;
    label: string; 
    value: string; 
    detail?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendPct?: number;
  }) => (
    <Card className="bg-card/40 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
          {trend && trend !== 'neutral' && trendPct !== undefined && (
            <Badge 
              variant="secondary" 
              className={`text-[10px] font-medium px-2 py-0.5 ${
                trend === 'up' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {Math.abs(trendPct)}%
            </Badge>
          )}
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">{label}</p>
        <p className="text-xl font-headline font-bold text-foreground tracking-tight">{value}</p>
        {detail && (
          <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{detail}</p>
        )}
      </CardContent>
    </Card>
  );

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <StatCard
        icon={<Hash className="w-4 h-4 text-blue-500" />}
        iconBg="bg-blue-500/10"
        label="Total Records"
        value={stats.records.toLocaleString()}
        detail={`${stats.columns} columns`}
      />
      <StatCard
        icon={<BarChart3 className="w-4 h-4 text-violet-500" />}
        iconBg="bg-violet-500/10"
        label="Numeric Columns"
        value={stats.numericCols.toString()}
        detail={`${stats.categoricalCols} categorical`}
      />
      {stats.primaryStats && (
        <StatCard
          icon={stats.trend === 'up' 
            ? <TrendingUp className="w-4 h-4 text-green-500" /> 
            : stats.trend === 'down' 
              ? <TrendingDown className="w-4 h-4 text-red-500" /> 
              : <Minus className="w-4 h-4 text-amber-500" />}
          iconBg={stats.trend === 'up' ? 'bg-green-500/10' : stats.trend === 'down' ? 'bg-red-500/10' : 'bg-amber-500/10'}
          label={`${stats.primaryNumeric} Sum`}
          value={formatNum(stats.primaryStats.sum)}
          detail={`Avg: ${formatNum(stats.primaryStats.mean)} · Range: ${formatNum(stats.primaryStats.min)}–${formatNum(stats.primaryStats.max)}`}
          trend={stats.trend}
          trendPct={stats.trendPct}
        />
      )}
      {stats.primaryStats && (
        <StatCard
          icon={<Layers className="w-4 h-4 text-cyan-500" />}
          iconBg="bg-cyan-500/10"
          label="Std Deviation"
          value={formatNum(stats.primaryStats.stdDev)}
          detail={`Median: ${formatNum(stats.primaryStats.median)}`}
        />
      )}
      {stats.topCategory && (
        <StatCard
          icon={<Type className="w-4 h-4 text-pink-500" />}
          iconBg="bg-pink-500/10"
          label={`Unique ${stats.topCategory}`}
          value={stats.uniqueCategories.toString()}
        />
      )}
    </div>
  );
}