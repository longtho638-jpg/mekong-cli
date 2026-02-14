import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Wallet, PieChart, DollarSign } from "lucide-react";

interface FinancialKPI {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  status: 'green' | 'yellow' | 'red';
  icon: React.ReactNode;
  tips: string[];
}

const KPIS: FinancialKPI[] = [
  {
    title: 'Growth Profile (CAGR)',
    value: '125%',
    trend: 'up',
    trendValue: '+15% vs prev',
    status: 'green',
    icon: <TrendingUp className="w-4 h-4 text-white" />,
    tips: ['Maintain >100% growth for Series A', 'Focus on B2B recurring revenue']
  },
  {
    title: 'EBITDA Margin',
    value: '-12%',
    trend: 'up',
    trendValue: '+5pts improvement',
    status: 'yellow',
    icon: <PieChart className="w-4 h-4 text-white" />,
    tips: ['Target breakeven in 12 months', 'Optimize logistics costs']
  },
  {
    title: 'Cash Flow (FCF)',
    value: '-$15k/mo',
    trend: 'down',
    trendValue: 'Burn increased',
    status: 'red',
    icon: <Wallet className="w-4 h-4 text-white" />,
    tips: ['Monitor burn rate closely', 'Extend runway to 18 months']
  },
  {
    title: 'Unit Economics (LTV/CAC)',
    value: '3.2x',
    trend: 'neutral',
    trendValue: 'Stable',
    status: 'green',
    icon: <DollarSign className="w-4 h-4 text-white" />,
    tips: ['Excellent ratio', 'Scale ad spend while maintaining >3x']
  }
];

export function FinancialKPIReadiness() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-stone-500';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((kpi, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-stone-500">{kpi.title}</CardTitle>
            <div className={`p-1.5 rounded-full ${getStatusColor(kpi.status)}`}>
               {kpi.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-stone-500 flex items-center mt-1">
              {kpi.trend === 'up' ? (
                <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              ) : kpi.trend === 'down' ? (
                <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
              ) : (
                <Minus className="w-3 h-3 text-stone-500 mr-1" />
              )}
              <span className={kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-stone-600'}>
                {kpi.trendValue}
              </span>
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <p className="text-xs font-medium mb-2 text-stone-500">Readiness Tips:</p>
                <ul className="space-y-1">
                    {kpi.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                             <span className="block w-1 h-1 mt-1 rounded-full bg-stone-400" />
                             {tip}
                        </li>
                    ))}
                </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
