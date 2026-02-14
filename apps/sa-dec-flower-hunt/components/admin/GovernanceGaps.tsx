import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

interface GovernanceGap {
  id: string;
  area: 'Board' | 'Audit' | 'Shareholders' | 'Compliance';
  currentState: string;
  expectedState: string;
  severity: 'High' | 'Medium' | 'Low';
  actions: string[];
}

const GAPS: GovernanceGap[] = [
  {
    id: 'GAP-001',
    area: 'Board',
    currentState: 'Founder-led board, no independent directors.',
    expectedState: 'Minimum 1/3 independent directors.',
    severity: 'High',
    actions: ['Source independent director candidate', 'Define director charter']
  },
  {
    id: 'GAP-002',
    area: 'Audit',
    currentState: 'Annual audit by local firm.',
    expectedState: 'Audit by Big 4 or Tier-1 firm.',
    severity: 'Medium',
    actions: ['Issue RFP for new auditors', 'Prepare data room for pre-audit']
  },
  {
    id: 'GAP-003',
    area: 'Shareholders',
    currentState: 'Cap table managed on Excel.',
    expectedState: 'Professional share registry management.',
    severity: 'Low',
    actions: ['Adopt cap table software', 'Clean up minor shareholder records']
  },
  {
    id: 'GAP-004',
    area: 'Compliance',
    currentState: 'Ad-hoc internal controls.',
    expectedState: 'Documented SOPs and internal control framework.',
    severity: 'High',
    actions: ['Draft Internal Control Manual', 'Appoint Compliance Officer']
  },
  {
    id: 'GAP-005',
    area: 'Board',
    currentState: 'Informal board meetings.',
    expectedState: 'Quarterly meetings with formal minutes.',
    severity: 'Medium',
    actions: ['Hire Corporate Secretary service', 'Set annual board calendar']
  }
];

export function GovernanceGaps() {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High':
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">High</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Medium</Badge>;
      case 'Low':
        return <Badge variant="secondary" className="bg-stone-200 text-stone-700">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          Governance Gap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b border-stone-200 dark:border-stone-800 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 align-middle font-medium text-stone-500 dark:text-stone-400">ID</th>
                <th className="h-12 px-4 align-middle font-medium text-stone-500 dark:text-stone-400">Area</th>
                <th className="h-12 px-4 align-middle font-medium text-stone-500 dark:text-stone-400">Current State</th>
                <th className="h-12 px-4 align-middle font-medium text-stone-500 dark:text-stone-400">IPO Requirement</th>
                <th className="h-12 px-4 align-middle font-medium text-stone-500 dark:text-stone-400">Severity</th>
                <th className="h-12 px-4 align-middle font-medium text-stone-500 dark:text-stone-400">Suggested Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {GAPS.map((gap) => (
                <tr key={gap.id} className="border-b border-stone-100 dark:border-stone-800 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900">
                  <td className="p-4 align-middle font-mono text-xs text-stone-500">{gap.id}</td>
                  <td className="p-4 align-middle font-medium">{gap.area}</td>
                  <td className="p-4 align-middle text-stone-600 dark:text-stone-300">{gap.currentState}</td>
                  <td className="p-4 align-middle text-stone-600 dark:text-stone-300">{gap.expectedState}</td>
                  <td className="p-4 align-middle">{getSeverityBadge(gap.severity)}</td>
                  <td className="p-4 align-middle">
                    <ul className="list-disc list-inside text-xs text-stone-600 dark:text-stone-400">
                      {gap.actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
