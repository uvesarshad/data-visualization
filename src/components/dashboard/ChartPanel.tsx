'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Treemap,
  RadialBarChart,
  RadialBar,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, TrendingUp, BarChart3, Loader2, Info } from 'lucide-react';
import { prepareChartData, computeStats, isNumericColumn, aggregateByCategory } from '@/app/lib/chart-utils';
import { computeBoxPlot, computeHistogram, linearRegression, forecastLinear } from '@/app/lib/statistics';

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
}

const COLORS = [
  '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6',
  '#8B5CF6', '#22D3EE', '#EF4444', '#10B981', '#F97316',
  '#06B6D4', '#A855F7', '#D946EF', '#84CC16', '#E11D48',
];

export function ChartPanel({ type, data, title, description, config, onAnalyze }: ChartPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Prepare and validate data for chart rendering
  const { chartData, stats, isValid, errorMessage } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], stats: null, isValid: false, errorMessage: 'No data available' };
    }

    try {
      // Check if the columns exist in the data
      const firstRow = data[0];
      const hasXAxis = config.xAxis in firstRow;
      const hasYAxis = config.yAxis in firstRow;
      
      if (!hasXAxis && !hasYAxis) {
        // Try to auto-detect columns
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
      const computedStats = isNumericColumn(data, config.yAxis) ? computeStats(data, config.yAxis) : null;
      
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
  }, [data, type, config.xAxis, config.yAxis, config.extraSeries]);

  const chartConfig = useMemo(() => {
    const cfg: any = {};
    cfg[config.yAxis] = { label: config.yAxis, color: COLORS[0] };
    config.extraSeries?.forEach((series, idx) => {
      cfg[series] = { label: series, color: COLORS[(idx + 1) % COLORS.length] };
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

  const renderChart = () => {
    if (!isValid) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center gap-2">
          <BarChart3 className="w-8 h-8 opacity-30" />
          <p className="text-xs">{errorMessage || `${type.replace(/_/g, ' ')} requires specific data columns`}</p>
        </div>
      );
    }

    switch (type) {
      case 'bar_chart':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey={config.yAxis} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            {stats && (
              <ReferenceLine y={stats.mean} stroke={COLORS[1]} strokeDasharray="3 3" label={{ value: `Avg: ${stats.mean}`, position: 'right', fontSize: 10 }} />
            )}
          </BarChart>
        );

      case 'stacked_bar': {
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            {series.map((s, i) => (
              <Bar key={s} dataKey={s} stackId="stack" fill={COLORS[i % COLORS.length]} radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        );
      }

      case 'grouped_bar': {
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            {series.map((s, i) => (
              <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} barSize={Math.max(8, 20 / series.length)} />
            ))}
          </BarChart>
        );
      }

      case 'horizontal_bar':
        return (
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey={config.xAxis} tick={{ fontSize: 10 }} width={55} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey={config.yAxis} fill={COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        );

      case 'line_graph': {
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            {series.map((s, i) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
            {stats && (
              <ReferenceLine y={stats.mean} stroke={COLORS[1]} strokeDasharray="3 3" />
            )}
          </LineChart>
        );
      }

      case 'area_chart': {
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            {series.map((s, i) => (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15 + (i * 0.05)}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
      }

      case 'stacked_area': {
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            {series.map((s, i) => (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                stackId="1"
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );
      }

      case 'pie_chart': {
        const pieData = chartData.slice(0, 10);
        return (
          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius="70%"
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              label={({ name, percent }) => `${String(name).substring(0, 8)} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ strokeWidth: 1 }}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
          </PieChart>
        );
      }

      case 'donut_chart': {
        const pieData = chartData.slice(0, 10);
        return (
          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              label={({ name, percent }) => `${String(name).substring(0, 8)} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
          </PieChart>
        );
      }

      case 'radar_chart': {
        const radarData = chartData.slice(0, 10);
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey={config.xAxis} tick={{ fontSize: 9 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8 }} />
            {series.map((s, i) => (
              <Radar
                key={s}
                name={s}
                dataKey={s}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
          </RadarChart>
        );
      }

      case 'scatter_plot':
        return (
          <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey={config.xAxis} name={config.xAxis} tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey={config.yAxis} name={config.yAxis} tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data Points" data={chartData} fill={COLORS[0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        );

      case 'bubble_chart':
        return (
          <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey={config.xAxis} name={config.xAxis} tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey={config.yAxis} name={config.yAxis} tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Bubbles" data={chartData} fill={COLORS[0]} fillOpacity={0.6}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                  r={Math.max(4, Math.min(20, Math.sqrt(Math.abs(Number(entry[config.yAxis]) || 1)) / 2))}
                />
              ))}
            </Scatter>
          </ScatterChart>
        );

      case 'radial_bar': {
        const radialData = chartData.slice(0, 8).map((item, i) => ({
          name: item[config.xAxis],
          value: Number(item[config.yAxis]) || 0,
          fill: COLORS[i % COLORS.length],
        }));
        const maxValue = Math.max(...radialData.map(d => d.value), 1);
        return (
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="80%"
            barSize={12}
            data={radialData}
            startAngle={180}
            endAngle={-180}
          >
            <RadialBar
              background
              dataKey="value"
              cornerRadius={4}
            />
            <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
            <Tooltip />
          </RadialBarChart>
        );
      }

      case 'composed_chart': {
        const extraSeries = config.extraSeries || [];
        return (
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey={config.yAxis} barSize={20} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            {extraSeries.map((s, i) => (
              <Line key={s} type="monotone" dataKey={s} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
            ))}
            {stats && (
              <ReferenceLine y={stats.mean} stroke={COLORS[2]} strokeDasharray="3 3" />
            )}
          </ComposedChart>
        );
      }

      case 'multi_bar': {
        const series = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            {series.map((s, i) => (
              <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} barSize={Math.max(6, 24 / series.length)} />
            ))}
          </BarChart>
        );
      }

      case 'treemap_chart': {
        const treeData = chartData.slice(0, 30).map((item, i) => ({
          name: String(item[config.xAxis]),
          value: Number(item[config.yAxis]) || 0,
          fill: COLORS[i % COLORS.length],
        }));
        return (
          <Treemap
            data={treeData}
            dataKey="value"
            nameKey="name"
            stroke="hsl(var(--border))"
            content={({ x, y, width, height, name, value, fill }: any) => (
              <g>
                <rect x={x} y={y} width={width} height={height} fill={fill || COLORS[0]} fillOpacity={0.8} stroke="hsl(var(--background))" strokeWidth={2} />
                {width > 50 && height > 25 && (
                  <>
                    <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                      {String(name).substring(0, 12)}
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="white" fontSize={9} opacity={0.8}>
                      {Number(value).toLocaleString()}
                    </text>
                  </>
                )}
              </g>
            )}
          />
        );
      }

      case 'box_plot': {
        // Render box plot using ComposedChart
        const values = data.map(row => Number(row[config.yAxis])).filter(v => !isNaN(v));
        const bp = computeBoxPlot(values);
        const categories = config.extraSeries?.length ? config.extraSeries : [config.yAxis];
        
        const boxData = categories.map(col => {
          const vals = data.map(row => Number(row[col])).filter(v => !isNaN(v));
          const box = computeBoxPlot(vals);
          return { name: col, min: box.min, q1: box.q1, median: box.median, q3: box.q3, max: box.max, mean: box.mean };
        });

        return (
          <ComposedChart data={boxData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number, name: string) => [Number(value).toLocaleString(), name]} />
            {/* Whisker: min to q1 */}
            <Bar dataKey="min" fill="transparent" stackId="box" />
            <Bar dataKey="q1" fill={COLORS[0]} fillOpacity={0.3} stackId="box" radius={[0, 0, 0, 0]} />
            <Bar dataKey="median" fill={COLORS[0]} fillOpacity={0.6} stackId="box" />
            <Bar dataKey="q3" fill={COLORS[0]} fillOpacity={0.3} stackId="box" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
          </ComposedChart>
        );
      }

      case 'waterfall_chart': {
        // Waterfall chart showing cumulative effect
        const values = chartData.map(row => Number(row[config.yAxis]) || 0);
        let cumulative = 0;
        const waterfallData = chartData.map((row, i) => {
          const val = values[i];
          const start = cumulative;
          cumulative += val;
          return {
            name: String(row[config.xAxis]),
            invisible: Math.min(start, cumulative),
            visible: Math.abs(val),
            isPositive: val >= 0,
            value: val,
          };
        });

        return (
          <BarChart data={waterfallData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number, name: string) => {
              if (name === 'invisible') return [null, ''];
              return [Number(value).toLocaleString(), 'Value'];
            }} />
            <Bar dataKey="invisible" stackId="waterfall" fill="transparent" />
            <Bar dataKey="visible" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isPositive ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        );
      }

      case 'histogram': {
        const values = data.map(row => Number(row[config.yAxis])).filter(v => !isNaN(v));
        const hist = computeHistogram(values, 10);
        
        return (
          <BarChart data={hist.bins} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number) => [Number(value).toLocaleString(), 'Count']} />
            <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]}>
              {hist.bins.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
            <Legend wrapperStyle={{ fontSize: '10px' }} />
          </BarChart>
        );
      }

      case 'gauge_kpi': {
        // KPI gauge using a single value
        const gaugeValue = stats ? stats.mean : 0;
        const gaugeMax = stats ? stats.max * 1.2 : 100;
        const gaugeData = [
          { name: 'value', value: gaugeValue, fill: COLORS[0] },
        ];
        
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <div className="text-4xl font-headline font-bold text-primary">
              {gaugeValue >= 1000000 ? `${(gaugeValue / 1000000).toFixed(1)}M` :
               gaugeValue >= 1000 ? `${(gaugeValue / 1000).toFixed(1)}K` :
               gaugeValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{config.yAxis}</div>
            <div className="w-full max-w-[200px] h-3 bg-muted/30 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${Math.min(100, (gaugeValue / gaugeMax) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between w-full max-w-[200px] text-[9px] text-muted-foreground mt-1">
              <span>0</span>
              <span>{gaugeMax >= 1000000 ? `${(gaugeMax / 1000000).toFixed(0)}M` : gaugeMax >= 1000 ? `${(gaugeMax / 1000).toFixed(0)}K` : Math.round(gaugeMax)}</span>
            </div>
            {stats && (
              <div className="flex gap-4 mt-2">
                <span className="text-[10px] text-muted-foreground">Min: <span className="font-bold text-foreground">{stats.min.toLocaleString()}</span></span>
                <span className="text-[10px] text-muted-foreground">Max: <span className="font-bold text-foreground">{stats.max.toLocaleString()}</span></span>
              </div>
            )}
          </div>
        );
      }

      case 'forecast_chart': {
        // Line chart with forecast overlay
        const values = chartData.map(row => Number(row[config.yAxis])).filter(v => !isNaN(v));
        const forecast = forecastLinear(values, 3);
        const forecastData = [
          ...chartData.map((row, i) => ({ ...row, _index: i })),
          ...forecast.forecast.map((val, i) => ({
            [config.xAxis]: `Forecast ${i + 1}`,
            [config.yAxis]: val,
            _forecast: true,
            _lower: forecast.confidence.lower[i],
            _upper: forecast.confidence.upper[i],
            _index: chartData.length + i,
          })),
        ];

        return (
          <ComposedChart data={forecastData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Area type="monotone" dataKey="_upper" stroke="none" fill={COLORS[0]} fillOpacity={0.1} name="Confidence Upper" />
            <Area type="monotone" dataKey="_lower" stroke="none" fill="white" fillOpacity={0.05} name="Confidence Lower" />
            <Line type="monotone" dataKey={config.yAxis} stroke={COLORS[0]} strokeWidth={2} dot={{ r: 2 }} name="Actual" />
          </ComposedChart>
        );
      }

      case 'distribution': {
        // Histogram with normal distribution overlay
        const values = data.map(row => Number(row[config.yAxis])).filter(v => !isNaN(v));
        const hist = computeHistogram(values, 12);
        
        return (
          <ComposedChart data={hist.bins} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="count" fill={COLORS[0]} fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Frequency" />
            <Line type="monotone" dataKey="count" stroke={COLORS[1]} strokeWidth={2} dot={false} name="Distribution" />
          </ComposedChart>
        );
      }

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center gap-2">
            <BarChart3 className="w-8 h-8 opacity-30" />
            <p className="text-xs">Chart type "{type}" not recognized</p>
          </div>
        );
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
        {/* Mini stats bar */}
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
            {renderChart()}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}