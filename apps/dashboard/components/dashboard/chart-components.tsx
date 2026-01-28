import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// --- Types ---
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartProps {
  data: ChartDataPoint[];
  type: ChartType;
  xKey: string;
  yKeys: string[]; // Supports multiple lines/bars
  colors?: string[];
  title?: string;
  height?: number;
  stacked?: boolean;
}

// --- Constants ---
const DEFAULT_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#9333ea', // purple-600
  '#0891b2', // cyan-600
];

// --- Helper Components ---

interface TooltipPayload {
  name: string;
  value: string | number;
  color: string;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] p-3 rounded shadow-lg text-sm">
        <p className="font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">{label}</p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---

export function DashboardChart({
  data,
  type,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  title,
  height = 300,
  stacked = false,
}: ChartProps) {

  // Memoize chart content to prevent unnecessary re-renders
  const chartContent = useMemo(() => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="var(--md-sys-color-on-surface-variant)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--md-sys-color-on-surface-variant)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="var(--md-sys-color-on-surface-variant)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--md-sys-color-on-surface-variant)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                stackId={stacked ? 'a' : undefined}
                radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="var(--md-sys-color-on-surface-variant)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--md-sys-color-on-surface-variant)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                stackId={stacked ? '1' : undefined}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        // For pie charts, we typically visualize one dimension (yKey[0])
        const pieKey = yKeys[0];
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={pieKey}
              nameKey={xKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" />
             <XAxis
                type="number"
                dataKey={xKey}
                name={xKey}
                stroke="var(--md-sys-color-on-surface-variant)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
             <YAxis
                type="number"
                dataKey={yKeys[0]}
                name={yKeys[0]}
                stroke="var(--md-sys-color-on-surface-variant)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
             <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
             <Legend wrapperStyle={{ paddingTop: '10px' }} />
             {yKeys.map((key, index) => (
                <Scatter
                  key={key}
                  name={key}
                  data={data}
                  fill={colors[index % colors.length]}
                />
             ))}
          </ScatterChart>
        );

      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  }, [data, type, xKey, yKeys, colors, stacked]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--md-sys-color-surface)] rounded-[var(--md-sys-shape-corner-medium)]">
      {title && (
        <h3 className="m3-title-medium px-4 pt-4 pb-2 text-[var(--md-sys-color-on-surface)]">
          {title}
        </h3>
      )}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartContent}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
