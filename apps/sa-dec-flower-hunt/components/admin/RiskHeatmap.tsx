import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskCell {
  id: string;
  domain: string;
  horizon: 'Short' | 'Mid' | 'Long';
  severity: 'Low' | 'Med' | 'High' | 'Critical';
  note: string;
}

const RISKS: RiskCell[] = [
  { id: '1', domain: 'Cashflow', horizon: 'Short', severity: 'High', note: 'Burn rate high due to manual ops' },
  { id: '2', domain: 'Tech Debt', horizon: 'Short', severity: 'Med', note: 'Frontend needs refactor' },
  { id: '3', domain: 'Regulatory', horizon: 'Mid', severity: 'High', note: 'Data privacy laws tightening' },
  { id: '4', domain: 'Concentration', horizon: 'Long', severity: 'Critical', note: 'Reliance on 2 key suppliers' },
  { id: '5', domain: 'Data Integrity', horizon: 'Mid', severity: 'Med', note: 'Manual reporting errors' },
  { id: '6', domain: 'Cashflow', horizon: 'Long', severity: 'Low', note: 'Assumes Series B funding' },
  { id: '7', domain: 'Regulatory', horizon: 'Short', severity: 'Low', note: 'Currently compliant' },
];

export function RiskHeatmap() {
  const getColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Med': return 'bg-yellow-400 text-stone-900';
      case 'Low': return 'bg-green-200 text-green-900';
      default: return 'bg-stone-100';
    }
  };

  const domains = ['Cashflow', 'Regulatory', 'Tech Debt', 'Data Integrity', 'Concentration'];
  const horizons = ['Short', 'Mid', 'Long'];

  return (
    <div className="p-4 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
      <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-stone-500">Enterprise Risk Heatmap</h3>
      <div className="grid grid-cols-[150px_1fr_1fr_1fr] gap-1">
        {/* Header */}
        <div className="font-bold text-xs text-stone-400 text-right pr-4 self-end pb-2">Risk Domain</div>
        {horizons.map(h => (
          <div key={h} className="text-center font-bold text-sm pb-2 text-stone-600 dark:text-stone-300">{h}-Term</div>
        ))}

        {/* Rows */}
        {domains.map(domain => (
          <React.Fragment key={domain}>
            <div className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center justify-end pr-4 h-12">
                {domain}
            </div>
            {horizons.map(horizon => {
                const risk = RISKS.find(r => r.domain === domain && r.horizon === horizon);
                return (
                    <div key={`${domain}-${horizon}`} className="h-12 border border-white dark:border-stone-950 relative group">
                        {risk ? (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={`w-full h-full flex items-center justify-center text-xs font-bold cursor-help transition-opacity hover:opacity-90 ${getColor(risk.severity)}`}>
                                            {risk.severity}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">{risk.note}</p>
                                    </TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        ) : (
                            <div className="w-full h-full bg-stone-50 dark:bg-stone-800/50" />
                        )}
                    </div>
                )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
