"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Activity, PieChart, Clock } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    status?: 'good' | 'warning' | 'bad';
    delay?: number;
}

function MetricCard({ title, value, subValue, icon, status = 'good', delay = 0 }: MetricCardProps) {
    const getStatusColor = (s: string) => {
        switch(s) {
            case 'good': return 'text-green-500';
            case 'warning': return 'text-yellow-500';
            case 'bad': return 'text-red-500';
            default: return 'text-stone-500';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
        >
            <Card className="overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-lg transition-all bg-white dark:bg-stone-900">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">{title}</p>
                            <h3 className="text-2xl font-bold mt-1 text-stone-900 dark:text-stone-100">{value}</h3>
                            {subValue && <p className={`text-xs mt-1 font-medium ${getStatusColor(status)}`}>{subValue}</p>}
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
                            {icon}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function UnitEconomicsFrame() {
  return (
    <div className="grid gap-6">
      {/* Top Row: Core Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard 
             title="AOV (Avg Order Value)"
             value="250,000 ₫"
             subValue="+12% vs last month"
             icon={<DollarSign className="w-6 h-6" />}
             delay={0}
          />
          <MetricCard 
             title="LTV (Lifetime Value)"
             value="750,000 ₫"
             subValue="~3.0 orders / customer"
             icon={<Users className="w-6 h-6" />}
             delay={0.1}
          />
          <MetricCard 
             title="CAC (Acquisition Cost)"
             value="50,000 ₫"
             subValue="Blended (Paid + Organic)"
             icon={<Activity className="w-6 h-6" />}
             status="warning"
             delay={0.2}
          />
      </div>

      {/* Bottom Row: Ratios & Efficiency */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 lg:col-span-1"
         >
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-100">
                        <TrendingUp className="w-5 h-5" /> LTV:CAC Ratio
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-8">
                    <span className="text-6xl font-extrabold tracking-tighter">5.0x</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold mt-4 backdrop-blur-sm">
                        HEALTHY ({'>'}3x)
                    </span>
                </CardContent>
            </Card>
         </motion.div>
         
         <div className="col-span-1 lg:col-span-2 grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-stone-600">
                        <Clock className="w-4 h-4" /> Payback Period
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-2">2.0 Months</div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <p className="text-xs text-stone-400 mt-2">Target: &lt; 3 months</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2 text-stone-600">
                        <PieChart className="w-4 h-4" /> Gross Margin
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold mb-1 text-indigo-600">35%</div>
                         <p className="text-xs text-stone-500">Post-COGS & Ops</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-8 border-indigo-100 border-t-indigo-600 rotate-45"></div>
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
