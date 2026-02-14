"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CostItem {
  label: string;
  value: number;
  color: string;
  note: string;
}

const COSTS: CostItem[] = [
  { label: 'COGS', value: 40, color: 'bg-red-500', note: 'Inventory, Packaging, Returns' },
  { label: 'Marketing', value: 25, color: 'bg-orange-500', note: 'Ads, Influencers, Promos' },
  { label: 'Operations', value: 20, color: 'bg-blue-500', note: 'Logistics, Warehousing, Support' },
  { label: 'Tech', value: 10, color: 'bg-indigo-500', note: 'Server, APIs, Development' },
  { label: 'G&A', value: 5, color: 'bg-stone-500', note: 'Office, Legal, Finance' },
];

export function CostStructure() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cost Structure Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {/* Visual Stacked Bar */}
            <div className="w-full h-12 flex rounded-lg overflow-hidden shadow-inner">
                <TooltipProvider>
                    {COSTS.map((cost) => (
                         <Tooltip key={cost.label}>
                            <TooltipTrigger asChild>
                                <div 
                                    className={`${cost.color} h-full transition-all hover:opacity-90 cursor-help`} 
                                    style={{ width: `${cost.value}%` }}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold">{cost.label}: {cost.value}%</p>
                                <p className="text-xs">{cost.note}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {COSTS.map((cost) => (
                    <div key={cost.label} className="flex items-start gap-3 p-3 rounded-lg border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                         <div className={`w-3 h-3 rounded-full mt-1.5 ${cost.color}`} />
                         <div>
                             <div className="flex items-baseline gap-2">
                                 <span className="font-bold text-sm">{cost.label}</span>
                                 <span className="text-xs font-mono text-stone-500">{cost.value}%</span>
                             </div>
                             <p className="text-[10px] text-stone-400 leading-tight mt-1">{cost.note}</p>
                         </div>
                    </div>
                ))}
            </div>

             {/* Note */}
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
                <strong>Scaling Note:</strong> As GMV grows, Tech and G&A % should decrease (economies of scale), while Marketing efficiency needs close monitoring.
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
