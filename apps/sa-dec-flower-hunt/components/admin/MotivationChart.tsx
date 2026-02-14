"use client";

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DATA = [
  { name: 'Family', value: 9, category: 'High' },
  { name: 'Status', value: 8, category: 'High' },
  { name: 'Beauty', value: 9, category: 'High' },
  { name: 'Social', value: 8, category: 'High' },
  { name: 'Saving', value: 6, category: 'Med' },
  { name: 'Curiosity', value: 7, category: 'Med' },
  { name: 'Order', value: 6, category: 'Med' },
  { name: 'Power', value: 5, category: 'Med' },
  { name: 'Eating', value: 4, category: 'Low' },
  { name: 'Solitude', value: 2, category: 'Low' },
  { name: 'Physical', value: 3, category: 'Low' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-stone-900 text-white p-2 text-xs rounded shadow-lg border border-stone-700">
        <p className="font-bold">{label}</p>
        <p>Intensity: {payload[0].value}/10</p>
        <p className="opacity-70 capitalize">Category: {payload[0].payload.category}</p>
      </div>
    );
  }
  return null;
};

export function MotivationChart() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Reiss Motivation Profile (Audience Aggregate)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DATA} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 10]} hide />
            <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10}} interval={0} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
            <ReferenceLine x={5} stroke="#d1d5db" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {DATA.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={entry.category === 'High' ? '#f43f5e' : entry.category === 'Med' ? '#6366f1' : '#9ca3af'} 
                    />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
