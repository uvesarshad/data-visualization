
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
  Scatter
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ChartPanelProps {
  type: string;
  data: any[];
  title: string;
  description?: string;
  config: {
    xAxis: string;
    yAxis: string;
    label?: string;
  };
}

const COLORS = ['#1A80E6', '#5E5EE6', '#22D3EE', '#8B5CF6', '#F59E0B'];

export function ChartPanel({ type, data, title, description, config }: ChartPanelProps) {
  const chartConfig = {
    [config.yAxis]: {
      label: config.label || config.yAxis,
      color: 'hsl(var(--chart-1))',
    },
  };

  const renderChart = () => {
    switch (type) {
      case 'bar_chart':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey={config.yAxis} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line_graph':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey={config.yAxis} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case 'pie_chart':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey={config.yAxis}
              nameKey={config.xAxis}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case 'area_chart':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey={config.yAxis} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
          </AreaChart>
        );
      case 'scatter_plot':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} type="number" />
            <YAxis dataKey={config.yAxis} type="number" />
            <Tooltip content={<ChartTooltipContent />} />
            <Scatter name={config.label || "Data"} data={data} fill="hsl(var(--accent))" />
          </ScatterChart>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Visualization type "{type}" coming soon.
          </div>
        );
    }
  };

  return (
    <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-headline font-semibold text-primary">{title}</CardTitle>
        {description && <CardDescription className="text-xs line-clamp-2">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] pt-4">
        <ChartContainer config={chartConfig} className="w-full h-full">
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
