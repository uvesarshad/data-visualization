'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Hash, 
  Type, 
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { computeStats, isNumericColumn, getUniqueValues } from '@/app/lib/chart-utils';

interface StatsOverviewProps {
  data: Record<string, any>[];
}

interface StatCard {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

export function StatsOverview({ data }: StatsOverviewProps) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => isNumericColumn(data, col));
    const categoricalColumns = columns.filter(col => !isNumericColumn(data, col));

    // Find the primary numeric column (first one)
    const primaryNumeric = numericColumns[0];
    const primaryStats = primaryNumeric ? computeStats(data, primaryNumeric) : null;

    // Find trends: compare first half vs second half
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendPct = 0;
    if (primaryNumeric && data.length >= 10) {
      const mid = Math.floor(data.length / 2);
      const firstHalf = data.slice(0, mid);
      const secondHalf = data.slice(mid);
      const firstAvg = firstHalf.reduce((sum, row) => sum + (Number(row[primaryNumeric]) || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, row) => sum + (Number(row[primaryNumeric]) || 0), 0) / secondHalf.length;
      if (firstAvg > 0) {
        trendPct = Math.round(((secondAvg - firstAvg) / firstAvg) * 10000) / 100;
        trend = trendPct > 2 ? 'up' : trendPct < -2 ? 'down' : 'neutral';
      }
    }

    // Find min/max columns for secondary stats
    const secondNumeric = numericColumns[1];
    const secondStats = secondNumeric ? computeStats(data, secondNumeric) : null;

    const cards: StatCard[] = [
      {
        label: 'Total Records',
        value: data.length.toLocaleString(),
        subValue: `${columns.length} columns`,
        icon: <Hash className="w-4 h-4" />,
        color: 'text-blue-500',
      },
      {
        label: 'Numeric Columns',
        value: numericColumns.length.toString(),
        subValue: `${categoricalColumns.length} categorical`,
        icon: <BarChart3 className="w-4 h-4" />,
        color: 'text-purple-500',
      },
    ];

    if (primaryStats) {
      cards.push({
        label: `${primaryNumeric} (Sum)`,
        value: primaryStats.sum >= 1000000 
          ? `${(primaryStats.sum / 1000000).toFixed(1)}M` 
          : primaryStats.sum >= 1000 
          ? `${(primaryStats.sum / 1000).toFixed(1)}K` 
          : primaryStats.sum.toLocaleString(),
        subValue: `Avg: ${primaryStats.mean.toLocaleString()}`,
        icon: trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />,
        trend,
        color: trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-yellow-500',
      });

      cards.push({
        label: `${primaryNumeric} Range`,
        value: `${primaryStats.min.toLocaleString()} - ${primaryStats.max.toLocaleString()}`,
        subValue: `StdDev: ${primaryStats.stdDev.toLocaleString()}`,
        icon: <Percent className="w-4 h-4" />,
        color: 'text-cyan-500',
      });
    }

    if (secondStats) {
      cards.push({
        label: `${secondNumeric} (Avg)`,
        value: secondStats.mean.toLocaleString(),
        subValue: `Median: ${secondStats.median.toLocaleString()}`,
        icon: <ArrowUpRight className="w-4 h-4" />,
        color: 'text-orange-500',
      });
    }

    // Top categorical column info
    if (categoricalColumns.length > 0) {
      const catCol = categoricalColumns[0];
      const uniqueVals = getUniqueValues(data, catCol);
      cards.push({
        label: `Unique ${catCol}`,
        value: uniqueVals.length.toString(),
        subValue: uniqueVals.slice(0, 3).join(', ') + (uniqueVals.length > 3 ? '...' : ''),
        icon: <Type className="w-4 h-4" />,
        color: 'text-pink-500',
      });
    }

    if (trendPct !== 0) {
      cards.push({
        label: 'Trend',
        value: `${trendPct > 0 ? '+' : ''}${trendPct}%`,
        subValue: `${primaryNumeric} (2nd half vs 1st half)`,
        icon: trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />,
        trend,
        color: trend === 'up' ? 'text-green-500' : 'text-red-500',
      });
    }

    return cards;
  }, [data]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {stats.map((card, idx) => (
        <Card key={idx} className="bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold truncate">
                {card.label}
              </span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className="text-lg font-headline font-bold text-foreground truncate">
              {card.value}
            </p>
            {card.subValue && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {card.subValue}
              </p>
            )}
            {card.trend && card.trend !== 'neutral' && (
              <Badge 
                variant="secondary" 
                className={`mt-1 text-[8px] ${
                  card.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}
              >
                {card.trend === 'up' ? '↑' : '↓'} Trend
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}