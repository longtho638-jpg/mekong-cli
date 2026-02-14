import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Zap, ShieldAlert } from "lucide-react";

export function LeverageRisks() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Growth Levers */}
      <Card className="border-t-4 border-t-green-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Zap className="w-5 h-5" /> Growth Levers
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {[
                { title: 'Conversion Rate Optimization', desc: 'Improve mobile checkout flow to lift CVR by 0.5%.' },
                { title: 'Repeat Purchase Loops', desc: 'Implement gamified loyalty points for Tet 2026.' },
                { title: 'Partner Network Expansion', desc: 'Onboard 50 more premium flower gardens.' },
                { title: 'Seasonal Pre-orders', desc: 'Capture demand early for Tet peak season.' }
            ].map((item, i) => (
                <div key={i} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800 hover:shadow-sm transition-shadow">
                    <h4 className="font-bold text-sm text-green-900 dark:text-green-100">{item.title}</h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">{item.desc}</p>
                </div>
            ))}
        </CardContent>
      </Card>

      {/* Strategic Risks */}
      <Card className="border-t-4 border-t-red-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <ShieldAlert className="w-5 h-5" /> Strategic Risks
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
             {[
                { title: 'Seasonality Dependency', desc: 'Revenue highly concentrated in Jan/Feb (Tet).' },
                { title: 'Logistics Reliability', desc: 'Flower perishability during long-haul transport.' },
                { title: 'Weather Impact', desc: 'Crop failure risk due to unseasonal rain/heat.' },
                { title: 'Social Commerce Competition', desc: 'Price wars with informal Facebook sellers.' }
            ].map((item, i) => (
                <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800 hover:shadow-sm transition-shadow">
                    <h4 className="font-bold text-sm text-red-900 dark:text-red-100">{item.title}</h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">{item.desc}</p>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
