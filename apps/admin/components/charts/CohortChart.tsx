'use client';

import React from 'react';
import { MD3Card, MD3Typography } from '@/components/md3';

interface CohortData {
  cohort_date: string;
  users: number;
  data: {
    period: number;
    percentage: number;
    count: number;
  }[];
}

interface CohortChartProps {
  data: CohortData[];
  title?: string;
  className?: string;
}

export function CohortChart({ data, title = "User Retention", className }: CohortChartProps) {
  // Get all unique period indices to create columns
  const periods = Array.from(new Set(data.flatMap(d => d.data.map(p => p.period)))).sort((a, b) => a - b);

  // Helper to get color based on percentage
  const getBackgroundColor = (percentage: number) => {
    // Blue scale
    const alpha = percentage / 100;
    return `rgba(59, 130, 246, ${Math.max(alpha, 0.1)})`; // Ensure at least 0.1 opacity
  };

  const getTextColor = (percentage: number) => {
      return percentage > 50 ? 'white' : 'black';
  };

  return (
    <MD3Card variant="elevated" className={`p-6 overflow-x-auto ${className}`}>
      <MD3Typography variant="title-large" className="mb-4">{title}</MD3Typography>
      <div className="min-w-[600px]">
        <table className="w-full border-collapse">
            <thead>
                <tr>
                    <th className="text-left p-2 border-b font-medium text-gray-500 text-sm">Cohort</th>
                    <th className="text-left p-2 border-b font-medium text-gray-500 text-sm">Users</th>
                    {periods.map(p => (
                        <th key={p} className="text-center p-2 border-b font-medium text-gray-500 text-sm">
                            {p === 0 ? 'Month 0' : `Month ${p}`}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 border-b text-sm font-medium">{row.cohort_date}</td>
                        <td className="p-2 border-b text-sm">{row.users}</td>
                        {periods.map(period => {
                            const point = row.data.find(d => d.period === period);
                            return (
                                <td key={period} className="p-1 border-b">
                                    {point ? (
                                        <div
                                            className="w-full h-8 flex items-center justify-center text-xs rounded"
                                            style={{
                                                backgroundColor: getBackgroundColor(point.percentage),
                                                color: getTextColor(point.percentage)
                                            }}
                                            title={`${point.count} users (${point.percentage}%)`}
                                        >
                                            {point.percentage.toFixed(0)}%
                                        </div>
                                    ) : (
                                        <div className="w-full h-8 bg-gray-50" />
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </MD3Card>
  );
}
