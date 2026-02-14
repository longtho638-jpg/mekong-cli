import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoadmapItem {
  id: string;
  title: string;
  theme: 'Foundation' | 'Product' | 'Growth' | 'Data' | 'Governance';
  owner: string;
  horizon: 'H0' | 'H1' | 'H2';
  dependencies?: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  { id: '1', title: 'Financial Cleanup & Accrual Acctg', theme: 'Foundation', owner: 'CFO', horizon: 'H0' },
  { id: '2', title: 'Agentic Fulfillment V1', theme: 'Product', owner: 'CTO', horizon: 'H0' },
  { id: '3', title: 'B2B Pilot Launch', theme: 'Growth', owner: 'Sales Lead', horizon: 'H0' },
  
  { id: '4', title: 'First External Audit', theme: 'Governance', owner: 'CFO', horizon: 'H1', dependencies: 'Item 1' },
  { id: '5', title: 'Regional Expansion (Can Tho)', theme: 'Growth', owner: 'Head of Growth', horizon: 'H1' },
  { id: '6', title: 'Data Warehouse & BI V2', theme: 'Data', owner: 'Tech Lead', horizon: 'H1' },

  { id: '7', title: 'Series B / Pre-IPO Round', theme: 'Foundation', owner: 'CEO', horizon: 'H2' },
  { id: '8', title: 'IPO Prospectus Draft', theme: 'Governance', owner: 'Legal', horizon: 'H2' },
  { id: '9', title: 'National Rollout', theme: 'Growth', owner: 'COO', horizon: 'H2' },
];

export function RoadmapTimeline() {
  const getThemeColor = (theme: string) => {
      switch(theme) {
          case 'Foundation': return 'bg-stone-200 text-stone-700';
          case 'Product': return 'bg-blue-100 text-blue-700';
          case 'Growth': return 'bg-green-100 text-green-700';
          case 'Governance': return 'bg-purple-100 text-purple-700';
          case 'Data': return 'bg-cyan-100 text-cyan-700';
          default: return 'bg-stone-100';
      }
  }

  const renderHorizon = (horizon: string, title: string, period: string) => {
      const items = ROADMAP_ITEMS.filter(i => i.horizon === horizon);
      
      return (
          <div className="flex-1 min-w-[300px]">
              <div className="mb-4 pb-2 border-b-2 border-stone-200 dark:border-stone-700">
                  <h4 className="font-bold text-lg">{title}</h4>
                  <span className="text-xs text-stone-500 font-mono">{period}</span>
              </div>
              <div className="space-y-3 bg-stone-50/50 dark:bg-stone-900/30 p-2 rounded-lg min-h-[300px]">
                  {items.map(item => (
                      <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow border-l-2 border-l-stone-400">
                          <CardContent className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline" className={`text-[10px] border-0 ${getThemeColor(item.theme)}`}>
                                      {item.theme}
                                  </Badge>
                                  <span className="text-[10px] text-stone-400">{item.owner}</span>
                              </div>
                              <p className="text-sm font-medium leading-tight mb-2">{item.title}</p>
                              {item.dependencies && (
                                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                                      Dep: {item.dependencies}
                                  </div>
                              )}
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="overflow-x-auto pb-4">
        <div className="flex gap-6">
            {renderHorizon('H0', 'Horizon 0: Fix & Foundation', 'Months 0-6')}
            {renderHorizon('H1', 'Horizon 1: Scale & Systemize', 'Months 6-12')}
            {renderHorizon('H2', 'Horizon 2: IPO Readiness', 'Months 12-24+')}
        </div>
    </div>
  );
}
