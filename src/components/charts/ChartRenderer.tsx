'use client';

// 4.1: Dynamically imported chart renderer — keeps Recharts out of the initial bundle.
import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell, AreaChart, Area,
  ScatterChart, Scatter, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Treemap,
  RadialBarChart, RadialBar, ReferenceLine, ResponsiveContainer,
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
  width?: number;
  height?: number;
}


const TreemapContent = (props: any) => {
  const { x, y, width, height, index, name } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: 'hsl(var(--background))',
          strokeWidth: 1,
        }}
      />
      {width > 30 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={10}
        >
          {name}
        </text>
      )}
    </g>
  );
};

export default function ChartRenderer({ type, chartData, config, stats, isValid, errorMessage, rawData }: ChartRendererProps) {
  if (!isValid) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center gap-2">
        <BarChart3 className="w-8 h-8 opacity-30" />
        <p className="text-xs">{errorMessage || `${type.replace(/_/g, ' ')} requires specific data columns`}</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar_chart':
        return (
          <BarChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey={config.yAxis} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            {stats && <ReferenceLine y={stats.mean} stroke={COLORS[1]} strokeDasharray="3 3" label={{ value: `Avg: ${stats.mean}`, position: 'right', fontSize: 10 }} />}
          </BarChart>
        );

      case 'stacked_bar': {
        const s = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <BarChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            {s.map((v, i) => (
              <Bar key={v} dataKey={v} stackId="stack" fill={COLORS[i % COLORS.length]} radius={i === s.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        );
      }

      case 'grouped_bar':
      case 'multi_bar': {
        const s = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <BarChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            {s.map((v, i) => (
              <Bar key={v} dataKey={v} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} barSize={Math.max(8, 20 / s.length)} />
            ))}
          </BarChart>
        );
      }

      case 'horizontal_bar':
        return (
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={TICK} />
            <YAxis type="category" dataKey={config.xAxis} tick={TICK} width={55} />
            <Tooltip />
            <Bar dataKey={config.yAxis} fill={COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        );

      case 'line_graph': {
        const s = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <LineChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            {s.map((v, i) => (
              <Line key={v} type="monotone" dataKey={v} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            ))}
            {stats && <ReferenceLine y={stats.mean} stroke={COLORS[1]} strokeDasharray="3 3" />}
          </LineChart>
        );
      }

      case 'area_chart': {
        const s = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <AreaChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            {s.map((v, i) => (
              <Area key={v} type="monotone" dataKey={v} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15 + (i * 0.05)} strokeWidth={2} />
            ))}
          </AreaChart>
        );
      }

      case 'stacked_area': {
        const s = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <AreaChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            {s.map((v, i) => (
              <Area key={v} type="monotone" dataKey={v} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />
            ))}
          </AreaChart>
        );
      }

      case 'pie_chart':
      case 'donut_chart': {
        const isDonut = type === 'donut_chart';
        return (
          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? "40%" : 0}
              outerRadius="70%"
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              label={({ name, percent }: any) => `${String(name).substring(0, 8)} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ strokeWidth: 1 }}
            >
              {chartData.map((_, i) => (
                <Cell key={`c${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} />
          </PieChart>
        );
      }

      case 'radar_chart': {
        const s = [config.yAxis, ...(config.extraSeries || [])];
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey={config.xAxis} tick={{ fontSize: 9 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8 }} />
            {s.map((v, i) => (
              <Radar key={v} name={v} dataKey={v} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} strokeWidth={2} />
            ))}
            <Tooltip />
            <Legend wrapperStyle={LEGEND_STYLE} />
          </RadarChart>
        );
      }

      case 'scatter_plot':
      case 'bubble_chart':
        return (
          <ScatterChart margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey={config.xAxis} name={config.xAxis} tick={TICK} />
            <YAxis type="number" dataKey={config.yAxis} name={config.yAxis} tick={TICK} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data Points" data={chartData} fill={COLORS[0]}>
              {chartData.map((e, i) => (
                <Cell 
                  key={`c${i}`} 
                  fill={COLORS[i % COLORS.length]} 
                  fillOpacity={0.7} 
                  r={type === 'bubble_chart' ? Math.max(4, Math.min(20, Math.sqrt(Math.abs(Number(e[config.yAxis]) || 1)) / 2)) : 4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        );

      case 'radial_bar': {
        const d = chartData.map((item, i) => ({
          name: item[config.xAxis],
          value: Number(item[config.yAxis]) || 0,
          fill: COLORS[i % COLORS.length]
        }));
        return (
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={12} data={d} startAngle={180} endAngle={-180}>
            <RadialBar background dataKey="value" cornerRadius={4} />
            <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" wrapperStyle={LEGEND_STYLE} />
            <Tooltip />
          </RadialBarChart>
        );
      }

      case 'treemap_chart':
        return (
          <Treemap data={chartData} dataKey={config.yAxis} nameKey={config.xAxis} stroke="hsl(var(--border))" content={<TreemapContent />} />
        );

      case 'gauge_kpi': {
        const gv = stats ? stats.mean : 0;
        const gm = stats ? stats.max * 1.2 : 100;
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <div className="text-4xl font-headline font-bold text-primary">
              {gv >= 1000000 ? `${(gv / 1000000).toFixed(1)}M` : gv >= 1000 ? `${(gv / 1000).toFixed(1)}K` : gv.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{config.yAxis}</div>
            <div className="w-full max-w-[200px] h-3 bg-muted/30 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (gv / gm) * 100)}%` }} />
            </div>
          </div>
        );
      }

      case 'box_plot': {
        const boxData = computeBoxPlot(chartData.map(d => Number(d[config.yAxis]) || 0));
        return (
          <ComposedChart data={[boxData]} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Bar dataKey="q1" stackId="a" fill="transparent" />
            <Bar dataKey="q3" stackId="a" fill={COLORS[0]} fillOpacity={0.5} />
          </ComposedChart>
        );
      }

      case 'histogram': {
        const histData = computeHistogram(chartData.map(d => Number(d[config.yAxis]) || 0));
        return (
          <BarChart data={histData.bins} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      }

      case 'time_series_forecast':
      case 'forecast_chart': {
        const values = chartData.map(d => Number(d[config.yAxis]) || 0);
        const forecast = forecastLinear(values);
        const combinedData = [
          ...chartData.map((d, i) => ({ ...d, type: 'actual' })),
          ...forecast.forecast.map((v, i) => ({ 
            [config.xAxis]: `F${i+1}`, 
            [config.yAxis]: v,
            lower: forecast.confidence.lower[i],
            upper: forecast.confidence.upper[i],
            type: 'forecast' 
          }))
        ];
        return (
          <LineChart data={combinedData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Line type="monotone" dataKey={config.yAxis} stroke={COLORS[0]} strokeWidth={2} dot={(props: any) => props.payload.type === 'actual' ? <circle {...props} r={2} /> : null} strokeDasharray={(props: any) => props.payload.type === 'forecast' ? "5 5" : "0"} />
          </LineChart>
        );
      }

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center gap-2">
            <BarChart3 className="w-8 h-8 opacity-30" />
            <p className="text-xs">Chart type "{type}" not recognized or has incomplete data</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}