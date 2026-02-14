import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, Bot, ShieldCheck } from "lucide-react";

export function ExecutionPrinciples() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-base">Prioritization Rules</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="text-sm text-stone-600 dark:text-stone-300 space-y-2">
            <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Customer First:</span> Does this directly improve LTV or Retention?</p>
            <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Scalability:</span> Does this replace a manual process with automation?</p>
            <p>• <span className="font-bold text-stone-900 dark:text-stone-100">IPO Criticality:</span> Is this required for audit/compliance?</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-base">Cadence & Rituals</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="text-sm text-stone-600 dark:text-stone-300 space-y-2">
            <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Weekly Sprints:</span> Ops & Tech execution updates.</p>
            <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Monthly FPR:</span> Financial Performance Review (Burn, MRR, Cash).</p>
            <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Quarterly Reset:</span> Board meeting & OKR adjustment.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Bot className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-base">Agentic Usage</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="text-sm text-stone-600 dark:text-stone-300 space-y-2">
             <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Default to AI:</span> Try to solve with Agent first, human second.</p>
             <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Human-in-the-Loop:</span> All financial/legal outputs require approval.</p>
             <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Data Logging:</span> All Agent actions must be logged for audit.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-base">Governance Flow</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="text-sm text-stone-600 dark:text-stone-300 space-y-2">
             <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Expenditure:</span> {'>'} $5k requires CEO approval, {'>'} $50k Board approval.</p>
             <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Hiring:</span> Key Hires require panel interview + reference check.</p>
             <p>• <span className="font-bold text-stone-900 dark:text-stone-100">Code:</span> No merge to main without review + CI/CD pass.</p>
        </CardContent>
      </Card>
    </div>
  );
}
