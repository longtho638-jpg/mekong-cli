import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Flame, ArrowRightCircle } from "lucide-react";

interface Initiative {
  id: string;
  title: string;
  whyNow: string;
  outcome: string[];
  owner: string;
  risk: string;
}

const INITIATIVES: Initiative[] = [
  {
    id: '1',
    title: 'Deploy Agentic Ops Core',
    whyNow: 'Manual order processing is choking growth (24h+ delay)',
    outcome: ['Reduce fulfillment time < 4h', 'Zero manual data entry'],
    owner: 'CTO',
    risk: 'Ops failure during peak season'
  },
  {
    id: '2',
    title: 'Launch B2B "Flower-as-a-Service"',
    whyNow: 'Need recurring revenue to stabilize cash flow',
    outcome: ['$50k MRR by Q4', 'Increase LTV by 40%'],
    owner: 'Head of Growth',
    risk: 'Cash runway depletion'
  },
  {
    id: '3',
    title: 'Formalize Governance Structure',
    whyNow: 'Pre-requisite for upcoming Series A talks',
    outcome: ['Auditable decision logs', 'Clean cap table'],
    owner: 'CEO',
    risk: 'Failed due diligence'
  },
  {
    id: '4',
    title: 'Mobile App / PWA Upgrade',
    whyNow: '70% traffic is mobile, conversion is suffering',
    outcome: ['Conversion rate > 3.5%', 'Push notification channel'],
    owner: 'Product Lead',
    risk: 'User churn to competitors'
  }
];

export function PriorityShortlist() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-lg">Top Strategic Priorities (Drag to Reorder)</h3>
      </div>
      <div className="space-y-3">
        {INITIATIVES.map((item, index) => (
          <Card key={item.id} className="group relative hover:shadow-md transition-all border-l-4 border-l-blue-500 cursor-move">
             <div className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-300 opacity-0 group-hover:opacity-100">
                <GripVertical className="w-4 h-4" />
             </div>
             <CardContent className="p-4 pl-8 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-stone-400">#{index + 1}</span>
                        <h4 className="font-bold text-base">{item.title}</h4>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                        <span className="font-semibold text-orange-600 dark:text-orange-400 text-xs uppercase tracking-wide mr-2">Why Now:</span> 
                        {item.whyNow}
                    </p>
                     <div className="flex flex-wrap gap-2">
                        {item.outcome.map((out, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-100 dark:border-blue-800">
                                {out}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col justify-center text-xs space-y-2">
                    <div>
                        <span className="block text-stone-500 mb-0.5">Owner</span>
                        <Badge variant="outline">{item.owner}</Badge>
                    </div>
                    <div>
                         <span className="block text-stone-500 mb-0.5">Risk if ignored</span>
                         <span className="text-red-600 dark:text-red-400 font-medium">{item.risk}</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-end">
                    <button className="text-stone-400 hover:text-blue-600 transition-colors">
                        <ArrowRightCircle className="w-6 h-6" />
                    </button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
