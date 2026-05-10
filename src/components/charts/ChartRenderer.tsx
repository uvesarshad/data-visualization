'use client';

// 4.1: Dynamically imported chart renderer — keeps Recharts out of the initial bundle.
import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell, AreaChart, Area,
  ScatterChart, Scatter, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Treemap,
  RadialBarChart, RadialBar, ReferenceLine,
} from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';
import { computeBoxPlot, computeHistogram, forecastLinear } from '@/app/lib/statistics';

const COLORS = [
  '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6',
  '#8B5CF6', '#22D3EE', '#EF4444', '#10B981', '#F97316',
  '#06B6D4', '#A855F7', '#D946EF', '#84CC16', '#E11D48',
];

const MARGIN = { top: 5, right: 10, left: 0, bottom: 5 };
const TICK = { fontSize: 10 };
const LEGEND_STYLE = { fontSize: '10px' };

interface ChartRendererProps {
  type: string;
  chartData: any[];
  config: { xAxis: string; yAxis: string; extraSeries?: string[] };
  stats: any;
  isValid: boolean;
  errorMessage?: string;
  rawData: any[];
}

// Treemap custom content renderer (separate component for React element requirement)
function TreemapContent({ x, y, width, height, name, value, fill }: any) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill || COLORS[0]} fillOpacity={0.8} stroke="hsl(var(--background))" strokeWidth={2} />
      {width > 50 && height > 25 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">{String(name).substring(0, 12)}</text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="white" fontSize={9} opacity={0.8}>{Number(value).toLocaleString()}</text>
        </>
      )}
    </g>
  );
}

export default function ChartRenderer({ type, chartData, config, stats, isValid, errorMessage, rawData }: ChartRendererProps) {
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
        <BarChart data={chartData} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
          <YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} />
          <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey={config.yAxis} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          {stats && <ReferenceLine y={stats.mean} stroke={COLORS[1]} strokeDasharray="3 3" label={{ value: `Avg: ${stats.mean}`, position: 'right', fontSize: 10 }} />}
        </BarChart>
      );

    case 'stacked_bar': { const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <BarChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />{s.map((v, i) => <Bar key={v} dataKey={v} stackId="stack" fill={COLORS[i % COLORS.length]} radius={i === s.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />)}</BarChart>
      ); }

    case 'grouped_bar': { const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <BarChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />{s.map((v, i) => <Bar key={v} dataKey={v} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} barSize={Math.max(8, 20 / s.length)} />)}</BarChart>
      ); }

    case 'horizontal_bar':
      return (
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" /><XAxis type="number" tick={TICK} /><YAxis type="category" dataKey={config.xAxis} tick={TICK} width={55} /><Tooltip content={<ChartTooltipContent />} /><Bar dataKey={config.yAxis} fill={COLORS[0]} radius={[0, 4, 4, 0]} /></BarChart>
      );

    case 'line_graph': { const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <LineChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />{s.map((v, i) => <Line key={v} type="monotone" dataKey={v} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />)}{stats && <ReferenceLine y={stats.mean} stroke={COLORS[1]} strokeDasharray="3 3" />}</LineChart>
      ); }

    case 'area_chart': { const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <AreaChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />{s.map((v, i) => <Area key={v} type="monotone" dataKey={v} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15 + (i * 0.05)} strokeWidth={2} />)}</AreaChart>
      ); }

    case 'stacked_area': { const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <AreaChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />{s.map((v, i) => <Area key={v} type="monotone" dataKey={v} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />)}</AreaChart>
      ); }

    case 'pie_chart': { const d = chartData.slice(0, 10); return (
        <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 25 }}><Pie data={d} cx="50%" cy="50%" outerRadius="70%" dataKey={config.yAxis} nameKey={config.xAxis} label={({ name, percent }: any) => `${String(name).substring(0, 8)} ${(percent * 100).toFixed(0)}%`} labelLine={{ strokeWidth: 1 }}>{d.map((_, i) => <Cell key={`c${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} /></PieChart>
      ); }

    case 'donut_chart': { const d = chartData.slice(0, 10); return (
        <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 25 }}><Pie data={d} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" dataKey={config.yAxis} nameKey={config.xAxis} label={({ name, percent }: any) => `${String(name).substring(0, 8)} ${(percent * 100).toFixed(0)}%`}>{d.map((_, i) => <Cell key={`c${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} /></PieChart>
      ); }

    case 'radar_chart': { const d = chartData.slice(0, 10); const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={d}><PolarGrid stroke="hsl(var(--border))" /><PolarAngleAxis dataKey={config.xAxis} tick={{ fontSize: 9 }} /><PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8 }} />{s.map((v, i) => <Radar key={v} name={v} dataKey={v} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} strokeWidth={2} />)}<Tooltip /><Legend wrapperStyle={LEGEND_STYLE} /></RadarChart>
      ); }

    case 'scatter_plot': return (
        <ScatterChart margin={MARGIN}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" dataKey={config.xAxis} name={config.xAxis} tick={TICK} /><YAxis type="number" dataKey={config.yAxis} name={config.yAxis} tick={TICK} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter name="Data Points" data={chartData} fill={COLORS[0]}>{chartData.map((_, i) => <Cell key={`c${i}`} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />)}</Scatter></ScatterChart>
      );

    case 'bubble_chart': return (
        <ScatterChart margin={MARGIN}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" dataKey={config.xAxis} name={config.xAxis} tick={TICK} /><YAxis type="number" dataKey={config.yAxis} name={config.yAxis} tick={TICK} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter name="Bubbles" data={chartData} fill={COLORS[0]} fillOpacity={0.6}>{chartData.map((e, i) => <Cell key={`c${i}`} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} r={Math.max(4, Math.min(20, Math.sqrt(Math.abs(Number(e[config.yAxis]) || 1)) / 2))} />)}</Scatter></ScatterChart>
      );

    case 'radial_bar': { const d = chartData.slice(0, 8).map((item, i) => ({ name: item[config.xAxis], value: Number(item[config.yAxis]) || 0, fill: COLORS[i % COLORS.length] })); return (
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={12} data={d} startAngle={180} endAngle={-180}><RadialBar background dataKey="value" cornerRadius={4} /><Legend iconSize={8} layout="horizontal" verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} /><Tooltip /></RadialBarChart>
      ); }

    case 'composed_chart': { const x = config.extraSeries || []; return (
        <ComposedChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} /><Bar dataKey={config.yAxis} barSize={20} fill={COLORS[0]} radius={[4, 4, 0, 0]} />{x.map((v, i) => <Line key={v} type="monotone" dataKey={v} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />)}{stats && <ReferenceLine y={stats.mean} stroke={COLORS[2]} strokeDasharray="3 3" />}</ComposedChart>
      ); }

    case 'multi_bar': { const s = [config.yAxis, ...(config.extraSeries || [])]; return (
        <BarChart data={chartData} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />{s.map((v, i) => <Bar key={v} dataKey={v} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} barSize={Math.max(6, 24 / s.length)} />)}</BarChart>
      ); }

    case 'treemap_chart': { const d = chartData.slice(0, 30).map((item, i) => ({ name: String(item[config.xAxis]), value: Number(item[config.yAxis]) || 0, fill: COLORS[i % COLORS.length] })); return (
        <Treemap data={d} dataKey="value" nameKey="name" stroke="hsl(var(--border))" content={<TreemapContent />} />
      ); }

    case 'box_plot': { const cats = config.extraSeries?.length ? config.extraSeries : [config.yAxis]; const bd = cats.map(col => { const v = rawData.map(r => Number(r[col])).filter(n => !isNaN(n)); const b = computeBoxPlot(v); return { name: col, min: b.min, q1: b.q1, median: b.median, q3: b.q3, max: b.max, mean: b.mean }; }); return (
        <ComposedChart data={bd} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={TICK} /><YAxis tick={TICK} /><Tooltip formatter={(value: number, name: string) => [Number(value).toLocaleString(), name]} /><Bar dataKey="min" fill="transparent" stackId="box" /><Bar dataKey="q1" fill={COLORS[0]} fillOpacity={0.3} stackId="box" /><Bar dataKey="median" fill={COLORS[0]} fillOpacity={0.6} stackId="box" /><Bar dataKey="q3" fill={COLORS[0]} fillOpacity={0.3} stackId="box" radius={[4, 4, 0, 0]} /><Legend wrapperStyle={LEGEND_STYLE} /></ComposedChart>
      ); }

    case 'waterfall_chart': { const vals = chartData.map(r => Number(r[config.yAxis]) || 0); let cum = 0; const wd = chartData.map((r, i) => { const v = vals[i]; const s = cum; cum += v; return { name: String(r[config.xAxis]), invisible: Math.min(s, cum), visible: Math.abs(v), isPositive: v >= 0, value: v }; }); return (
        <BarChart data={wd} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip formatter={(value: number, name: string) => name === 'invisible' ? [null, ''] : [Number(value).toLocaleString(), 'Value']} /><Bar dataKey="invisible" stackId="wf" fill="transparent" /><Bar dataKey="visible" stackId="wf" radius={[4, 4, 0, 0]}>{wd.map((e, i) => <Cell key={`c${i}`} fill={e.isPositive ? '#10B981' : '#EF4444'} fillOpacity={0.8} />)}</Bar></BarChart>
      ); }

    case 'histogram': { const v = rawData.map(r => Number(r[config.yAxis])).filter(n => !isNaN(n)); const h = computeHistogram(v, 10); return (
        <BarChart data={h.bins} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip formatter={(value: number) => [Number(value).toLocaleString(), 'Count']} /><Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]}>{h.bins.map((_, i) => <Cell key={`c${i}`} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}</Bar><Legend wrapperStyle={LEGEND_STYLE} /></BarChart>
      ); }

    case 'gauge_kpi': { const gv = stats ? stats.mean : 0; const gm = stats ? stats.max * 1.2 : 100; return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4"><div className="text-4xl font-headline font-bold text-primary">{gv >= 1000000 ? `${(gv / 1000000).toFixed(1)}M` : gv >= 1000 ? `${(gv / 1000).toFixed(1)}K` : gv.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">{config.yAxis}</div><div className="w-full max-w-[200px] h-3 bg-muted/30 rounded-full overflow-hidden mt-2"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (gv / gm) * 100)}%` }} /></div><div className="flex justify-between w-full max-w-[200px] text-[9px] text-muted-foreground mt-1"><span>0</span><span>{gm >= 1000000 ? `${(gm / 1000000).toFixed(0)}M` : gm >= 1000 ? `${(gm / 1000).toFixed(0)}K` : Math.round(gm)}</span></div>{stats && <div className="flex gap-4 mt-2"><span className="text-[10px] text-muted-foreground">Min: <span className="font-bold text-foreground">{stats.min.toLocaleString()}</span></span><span className="text-[10px] text-muted-foreground">Max: <span className="font-bold text-foreground">{stats.max.toLocaleString()}</span></span></div>}</div>
      ); }

    case 'forecast_chart': { const v = chartData.map(r => Number(r[config.yAxis])).filter(n => !isNaN(n)); const fc = forecastLinear(v, 3); const fd = [...chartData.map((r, i) => ({ ...r, _index: i })), ...fc.forecast.map((val, i) => ({ [config.xAxis]: `Forecast ${i + 1}`, [config.yAxis]: val, _forecast: true, _lower: fc.confidence.lower[i], _upper: fc.confidence.upper[i], _index: chartData.length + i }))]; return (
        <ComposedChart data={fd} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip content={<ChartTooltipContent />} /><Legend wrapperStyle={LEGEND_STYLE} /><Area type="monotone" dataKey="_upper" stroke="none" fill={COLORS[0]} fillOpacity={0.1} name="Confidence Upper" /><Area type="monotone" dataKey="_lower" stroke="none" fill="white" fillOpacity={0.05} name="Confidence Lower" /><Line type="monotone" dataKey={config.yAxis} stroke={COLORS[0]} strokeWidth={2} dot={{ r: 2 }} name="Actual" /></ComposedChart>
      ); }

    case 'distribution': { const v = rawData.map(r => Number(r[config.yAxis])).filter(n => !isNaN(n)); const h = computeHistogram(v, 12); return (
        <ComposedChart data={h.bins} margin={MARGIN}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={40} /><YAxis tick={TICK} /><Tooltip /><Legend wrapperStyle={LEGEND_STYLE} /><Bar dataKey="count" fill={COLORS[0]} fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Frequency" /><Line type="monotone" dataKey="count" stroke={COLORS[1]} strokeWidth={2} dot={false} name="Distribution" /></ComposedChart>
      ); }

    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center gap-2">
          <BarChart3 className="w-8 h-8 opacity-30" />
          <p className="text-xs">Chart type "{type}" not recognized</p>
        </div>
      );
  }
}