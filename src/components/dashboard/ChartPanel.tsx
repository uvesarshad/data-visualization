'use client';

import React from 'react';
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
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

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
}

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  'hsl(var(--accent))',
  '#22D3EE',
  '#8B5CF6'
];

export function ChartPanel({ type, data, title, description, config }: ChartPanelProps) {
  const safeData = data.slice(0, 50);

  const chartConfig = {
    [config.yAxis]: {
      label: config.yAxis,
      color: COLORS[0],
    },
    ...(config.extraSeries?.reduce((acc: any, series, idx) => {
      acc[series] = { label: series, color: COLORS[(idx + 1) % COLORS.length] };
      return acc;
    }, {}) || {})
  };

  const renderChart = () => {
    switch (type) {
      case 'bar_chart':
        return (
          <BarChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend iconType="circle" />
            <Bar dataKey={config.yAxis} fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'stacked_bar':
        return (
          <BarChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey={config.yAxis} stackId="a" fill={COLORS[0]} />
            {config.extraSeries?.map((s, i) => (
              <Bar key={s} dataKey={s} stackId="a" fill={COLORS[(i + 1) % COLORS.length]} />
            ))}
          </BarChart>
        );
      case 'line_graph':
        return (
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey={config.yAxis} stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
            {config.extraSeries?.map((s, i) => (
               <Line key={s} type="monotone" dataKey={s} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        );
      case 'area_chart':
        return (
          <AreaChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey={config.yAxis} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
          </AreaChart>
        );
      case 'pie_chart':
        const pieData = safeData.slice(0, 8);
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              label={({name}) => name?.toString().substring(0, 10)}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="horizontal" verticalAlign="bottom" />
          </PieChart>
        );
      case 'radar_chart':
        const radarData = safeData.slice(0, 8);
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey={config.xAxis} tick={{fontSize: 10}} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{fontSize: 8}} />
            <Radar
              name={config.yAxis}
              dataKey={config.yAxis}
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.5}
            />
            {config.extraSeries?.map((s, i) => (
              <Radar
                key={s}
                name={s}
                dataKey={s}
                stroke={COLORS[(i + 1) % COLORS.length]}
                fill={COLORS[(i + 1) % COLORS.length]}
                fillOpacity={0.5}
              />
            ))}
            <Tooltip />
          </RadarChart>
        );
      case 'scatter_plot':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey={config.xAxis} name={config.xAxis} tick={{fontSize: 10}} />
            <YAxis type="number" dataKey={config.yAxis} name={config.yAxis} tick={{fontSize: 10}} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data Point" data={safeData} fill={COLORS[0]} />
          </ScatterChart>
        );
      case 'composed_chart':
        return (
          <ComposedChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey={config.yAxis} barSize={20} fill={COLORS[0]} />
            {config.extraSeries?.map((s, i) => (
              <Line key={s} type="monotone" dataKey={s} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={2} />
            ))}
          </ComposedChart>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs p-4 text-center">
            {type.replace('_', ' ')} format needs specific columns.
          </div>
        );
    }
  };

  return (
    <Card className="h-full border border-border/50 shadow-md bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-headline font-bold text-primary group-hover:text-accent transition-colors">
            {title}
          </CardTitle>
        </div>
        {description && <CardDescription className="text-[10px] leading-tight line-clamp-1 opacity-70">{description}</CardDescription>}
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
