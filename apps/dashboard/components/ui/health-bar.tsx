'use client';

import React from 'react';

interface HealthBarProps {
  label: string;
  value: number;
  className?: string;
}

function getColor(v: number): string {
  if (v < 50) return 'bg-emerald-500';
  if (v < 80) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function HealthBar({ label, value, className = '' }: HealthBarProps) {
  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
