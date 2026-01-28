'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { MD3Card, MD3Typography } from '@/components/md3';

interface FunnelStep {
  step: string;
  count: number;
  conversion_rate: number;
  drop_off?: number;
}

interface FunnelChartProps {
  data: FunnelStep[];
  title?: string;
  className?: string;
}

export function FunnelChart({ data, title = "Conversion Funnel", className }: FunnelChartProps) {
  return (
    <MD3Card variant="elevated" className={`p-6 ${className}`}>
      <MD3Typography variant="title-large" className="mb-4">{title}</MD3Typography>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="step" type="category" width={100} />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                if (name === 'conversion_rate') return [`${value.toFixed(1)}%`, 'Conversion'];
                return [value, 'Users'];
              }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Users">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`rgba(59, 130, 246, ${1 - index * 0.15})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {data.map((step, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-500 capitalize">{step.step}</div>
                <div className="font-bold text-lg">{step.count}</div>
                <div className={`text-xs ${step.conversion_rate > 50 ? 'text-green-600' : 'text-orange-600'}`}>
                    {step.conversion_rate.toFixed(1)}% conv.
                </div>
            </div>
        ))}
      </div>
    </MD3Card>
  );
}
