import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Clock, ArrowRight } from "lucide-react";

interface GapItem {
  id: string;
  dimension: string;
  gap: string;
  currentState: string;
  targetState: string;
  rootCause: string;
  impact: 'Very High' | 'High' | 'Medium' | 'Low';
  urgency: 'Now' | 'Soon' | 'Later';
}

const GAPS: GapItem[] = [
  {
    id: 'BM-01',
    dimension: 'Business Model & Market',
    gap: 'Revenue unpredictability',
    currentState: 'Seasonal spikes, low recurring revenue',
    targetState: '30% recurring B2B subscription revenue',
    rootCause: 'Heavy reliance on tourism season',
    impact: 'High',
    urgency: 'Now'
  },
  {
    id: 'PROD-03',
    dimension: 'Product & Experience',
    gap: 'Mobile friction',
    currentState: 'Web-only, responsive issues',
    targetState: 'Native mobile app or high-performance PWA',
    rootCause: 'Tech debt in frontend framework',
    impact: 'Medium',
    urgency: 'Soon'
  },
  {
    id: 'OPS-02',
    dimension: 'Operations & Risk',
    gap: 'Manual fulfillment tracking',
    currentState: 'Spreadsheets & manual updates',
    targetState: 'Automated Agentic Fulfillment System',
    rootCause: 'No ERP integration yet',
    impact: 'Very High',
    urgency: 'Now'
  },
  {
    id: 'GOV-01',
    dimension: 'Governance & IPO',
    gap: 'Board structure informal',
    currentState: 'Founders only',
    targetState: 'Formal board with 1 independent director',
    rootCause: 'Early stage mindset',
    impact: 'High',
    urgency: 'Later'
  },
  {
      id: 'AI-04',
      dimension: 'Agentic OS',
      gap: 'Low AI autonomy',
      currentState: 'Human-in-the-loop for all actions',
      targetState: 'Level 3 Autonomy for Support & Ops',
      rootCause: 'Guardrails not fully stress-tested',
      impact: 'High',
      urgency: 'Soon'
  }
];

export function GapMatrix() {
  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'Now': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'Soon': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'Later': return 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
      default: return 'bg-stone-100';
    }
  };

  const getImpactBadge = (i: string) => {
     switch (i) {
        case 'Very High': return <Badge variant="destructive" className="text-[10px]">Very High</Badge>;
        case 'High': return <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px]">High</Badge>;
        default: return <Badge variant="secondary" className="text-[10px]">{i}</Badge>;
     }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GAPS.map((gap) => (
              <Card key={gap.id} className={`border-l-4 ${gap.urgency === 'Now' ? 'border-l-red-500' : gap.urgency === 'Soon' ? 'border-l-orange-500' : 'border-l-stone-300'}`}>
                  <CardHeader className="pb-2">
                      <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="font-mono text-[10px]">{gap.id}</Badge>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getUrgencyColor(gap.urgency)}`}>
                              {gap.urgency.toUpperCase()}
                          </span>
                      </div>
                      <CardTitle className="text-sm font-bold">{gap.gap}</CardTitle>
                      <CardDescription className="text-xs">{gap.dimension}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3">
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center bg-stone-50 dark:bg-stone-800/50 p-2 rounded">
                          <div className="text-stone-500 dark:text-stone-400 text-[10px]">Current: {gap.currentState}</div>
                          <ArrowRight className="w-3 h-3 text-stone-400" />
                          <div className="text-stone-900 dark:text-stone-200 font-medium text-[10px]">Target: {gap.targetState}</div>
                      </div>
                      
                      <div>
                          <span className="font-semibold text-stone-500 block mb-1">Root Cause:</span>
                          <span className="text-stone-700 dark:text-stone-300">{gap.rootCause}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-stone-800">
                          <span className="text-stone-500">Business Impact:</span>
                          {getImpactBadge(gap.impact)}
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>
    </div>
  );
}
