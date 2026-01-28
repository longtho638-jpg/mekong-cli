'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { MD3Card, MD3Typography } from '@/components/md3';

interface MetricPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  data: MetricPoint[];
  title?: string;
  dataKey?: string;
  color?: string;
  className?: string;
  valuePrefix?: string;
}

export function TrendChart({
    data,
    title = "Metric Trend",
    dataKey = "value",
    color = "#3b82f6",
    className,
    valuePrefix = ""
}: TrendChartProps) {
  return (
    <MD3Card variant="elevated" className={`p-6 ${className}`}>
      <MD3Typography variant="title-large" className="mb-4">{title}</MD3Typography>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
                dataKey="date"
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
            />
            <YAxis
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${valuePrefix}${val}`}
            />
            <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number | string | Array<number | string> | undefined) => [`${valuePrefix}${val}`, title]}
            />
            <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fillOpacity={1}
                fill={`url(#color${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MD3Card>
  );
}
