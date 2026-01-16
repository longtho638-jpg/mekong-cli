'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  color?: 'emerald' | 'blue' | 'purple' | 'teal' | 'orange' | 'red';
  className?: string;
}

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-700',
  blue: 'from-blue-500 to-blue-700',
  purple: 'from-purple-500 to-purple-700',
  teal: 'from-teal-500 to-teal-700',
  orange: 'from-orange-500 to-orange-700',
  red: 'from-red-500 to-red-700',
};

export function StatCard({ title, value, color = 'emerald', className = '' }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-4 ${className}`}>
      <p className="text-sm text-white/70">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
