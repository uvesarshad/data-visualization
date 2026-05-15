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
import { computeBoxPlot, computeHistogram, forecastTimeAware } from '@/app/lib/statistics';

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

interface BoxPlotSeries {
  name: string;
  box: ReturnType<typeof computeBoxPlot>;
}

function BoxPlotSVG({ boxes, yMin, yMax, colors }: { boxes: BoxPlotSeries[]; yMin: number; yMax: number; colors: string[] }) {
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padding = { top: 12, right: 16, bottom: 32, left: 44 };
  const innerW = Math.max(0, size.w - padding.left - padding.right);
  const innerH = Math.max(0, size.h - padding.top - padding.bottom);
  const yScale = (v: number) => padding.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const bandW = boxes.length > 0 ? innerW / boxes.length : 0;
  const boxW = Math.min(40, bandW * 0.55);

  // 5 y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const fmt = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return Math.abs(n) < 10 ? n.toFixed(2) : n.toFixed(0);
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      {size.w > 0 && size.h > 0 && (
        <svg width={size.w} height={size.h} role="img" aria-label="Box plot">
          {/* Y-axis grid + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padding.left} x2={padding.left + innerW}
                y1={yScale(t)} y2={yScale(t)}
                stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth={1}
              />
              <text
                x={padding.left - 6} y={yScale(t)}
                fontSize={10} fill="hsl(var(--muted-foreground))"
                textAnchor="end" dominantBaseline="middle"
              >
                {fmt(t)}
              </text>
            </g>
          ))}

          {/* Boxes */}
          {boxes.map((s, i) => {
            const cx = padding.left + bandW * (i + 0.5);
            const color = colors[i % colors.length];
            const { min, q1, median, q3, max, outliers } = s.box;
            return (
              <g key={s.name}>
                {/* Whisker line */}
                <line x1={cx} x2={cx} y1={yScale(min)} y2={yScale(max)} stroke={color} strokeWidth={1.5} />
                {/* Whisker caps */}
                <line x1={cx - boxW * 0.3} x2={cx + boxW * 0.3} y1={yScale(min)} y2={yScale(min)} stroke={color} strokeWidth={1.5} />
                <line x1={cx - boxW * 0.3} x2={cx + boxW * 0.3} y1={yScale(max)} y2={yScale(max)} stroke={color} strokeWidth={1.5} />
                {/* Q1-Q3 box */}
                <rect
                  x={cx - boxW / 2} y={yScale(q3)}
                  width={boxW} height={Math.max(1, yScale(q1) - yScale(q3))}
                  fill={color} fillOpacity={0.25}
                  stroke={color} strokeWidth={1.5}
                />
                {/* Median */}
                <line x1={cx - boxW / 2} x2={cx + boxW / 2} y1={yScale(median)} y2={yScale(median)} stroke={color} strokeWidth={2} />
                {/* Outliers */}
                {outliers.map((o, oi) => (
                  <circle key={oi} cx={cx} cy={yScale(o)} r={2} fill={color} fillOpacity={0.8} />
                ))}
                {/* X-axis label */}
                <text
                  x={cx} y={size.h - padding.bottom + 14}
                  fontSize={10} fill="hsl(var(--muted-foreground))"
                  textAnchor="middle"
                >
                  {s.name.length > 12 ? s.name.slice(0, 11) + '…' : s.name}
                </text>
                {/* Tooltip data via native title */}
                <title>{`${s.name}\nmin ${fmt(min)} · Q1 ${fmt(q1)} · median ${fmt(median)} · Q3 ${fmt(q3)} · max ${fmt(max)}${outliers.length ? ` · ${outliers.length} outliers` : ''}`}</title>
              </g>
            );
          })}
        </svg>
      )}
    </div>
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

      case 'composed_chart': {
        // First value column → bar; remaining value columns → lines
        const series = [config.yAxis, ...(config.extraSeries || [])];
        const barCol = series[0];
        const lineCols = series.slice(1);
        return (
          <ComposedChart data={chartData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} angle={-30} textAnchor="end" height={40} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey={barCol} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={20} />
            {lineCols.map((v, i) => (
              <Line key={v} type="monotone" dataKey={v} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
            ))}
          </ComposedChart>
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
              label={({ name, percent }: any) => {
                const s = String(name);
                const trimmed = s.length > 14 ? s.slice(0, 13) + '…' : s;
                return `${trimmed} ${(percent * 100).toFixed(0)}%`;
              }}
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
        // Multi-series box plot: yAxis + extraSeries (skip non-numeric)
        const seriesCols = [config.yAxis, ...(config.extraSeries || [])]
          .filter((c, i, arr) => arr.indexOf(c) === i)
          .filter(col => rawData.some(row => !isNaN(Number(row[col]))));

        if (seriesCols.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center gap-2">
              <BarChart3 className="w-8 h-8 opacity-30" />
              <p className="text-xs">No numeric columns available for box plot</p>
            </div>
          );
        }

        const boxes = seriesCols.map(col => ({
          name: col,
          box: computeBoxPlot(rawData.map(d => Number(d[col])).filter(v => !isNaN(v) && isFinite(v))),
        }));

        // Global y range across all whiskers + outliers
        let gMin = Infinity, gMax = -Infinity;
        boxes.forEach(b => {
          if (b.box.min < gMin) gMin = b.box.min;
          if (b.box.max > gMax) gMax = b.box.max;
          b.box.outliers.forEach(o => {
            if (o < gMin) gMin = o;
            if (o > gMax) gMax = o;
          });
        });
        if (!isFinite(gMin) || !isFinite(gMax) || gMin === gMax) {
          gMin = gMin - 1;
          gMax = gMax + 1;
        }
        const pad = (gMax - gMin) * 0.05;
        gMin -= pad;
        gMax += pad;

        return (
          <BoxPlotSVG boxes={boxes} yMin={gMin} yMax={gMax} colors={COLORS} />
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
        const xRaw = chartData.map(d => d[config.xAxis]);
        const yValues = chartData.map(d => Number(d[config.yAxis]) || 0);
        const { timeAware, forecast } = forecastTimeAware(xRaw, yValues, 3);

        // Format x labels for the forecasted points. Time-aware → date string; fallback → F1/F2/...
        const fmtX = (ms: number | null, idx: number) => {
          if (ms == null) return `F${idx + 1}`;
          const d = new Date(ms);
          return d.toISOString().slice(0, 10); // YYYY-MM-DD
        };

        const actualData = chartData.map(d => ({ ...d, isForecast: false }));
        const lastActual = actualData[actualData.length - 1];
        const forecastData = forecast.map((p, i) => ({
          [config.xAxis]: fmtX(p.x, i),
          [config.yAxis]: p.y,
          isForecast: true,
        }));
        const forecastWithConnection = lastActual ? [lastActual, ...forecastData] : forecastData;

        return (
          <LineChart margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xAxis} tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip />
            <Legend
              wrapperStyle={LEGEND_STYLE}
              formatter={(value) =>
                value === 'Forecast'
                  ? `Forecast${timeAware ? '' : ' (approximate)'}`
                  : value
              }
            />
            <Line
              data={actualData}
              type="monotone"
              dataKey={config.yAxis}
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ r: 2, fill: COLORS[0] }}
              name="Actual"
            />
            <Line
              data={forecastWithConnection}
              type="monotone"
              dataKey={config.yAxis}
              stroke={COLORS[0]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast"
            />
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