import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";

interface ScoreDimension {
  id: string;
  name: string;
  score: number; // 0-5
  notes: string;
  gaps: string[];
  suggestions: string[];
}

const DIMENSIONS: ScoreDimension[] = [
  {
    id: 'strategy_story',
    name: 'Strategy & Equity Story',
    score: 3,
    notes: 'Clear vision for local market, transitioning to platform model.',
    gaps: ['International expansion plan unclear', 'Long-term moat definition'],
    suggestions: ['Refine "Flower Platform" narrative', 'Quantify TAM/SAM/SOM']
  },
  {
    id: 'financial_profile',
    name: 'Financial Profile',
    score: 2,
    notes: 'Early revenue traction, positive unit economics.',
    gaps: ['EBITDA still negative', 'Revenue predictability low'],
    suggestions: ['Focus on recurring B2B subscriptions', 'Improve gross margins']
  },
  {
    id: 'governance_control',
    name: 'Governance & Control',
    score: 2,
    notes: 'Founders control majority, basic board structure.',
    gaps: ['No independent directors', 'Audit committee missing'],
    suggestions: ['Appoint 1 independent board member', 'Formalize board meeting minutes']
  },
  {
    id: 'risk_compliance',
    name: 'Risk & Compliance',
    score: 4,
    notes: 'Licenses in place, basic GDPR/Data privacy compliance.',
    gaps: ['Comprehensive cybersecurity audit needed'],
    suggestions: ['Conduct 3rd party security pen-test']
  },
  {
    id: 'systems_data_reporting',
    name: 'Systems & Reporting',
    score: 3,
    notes: 'Modern stack (Next.js/Supabase), basic analytics.',
    gaps: ['No formal ERP', 'Manual financial consolidation'],
    suggestions: ['Evaluate Netsuite/SAP for future', 'Automate monthly closing']
  },
  {
    id: 'agentic_maturity',
    name: 'Agentic AI Maturity',
    score: 4,
    notes: 'Advanced Agentic OS implemented, high automation potential.',
    gaps: ['AI governance framework for public markets'],
    suggestions: ['Document AI decision logs for audit', 'Stress test agent guardrails']
  }
];

export function IPOScorecard() {
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < score ? 'text-yellow-500 fill-yellow-500' : 'text-stone-300'}`} 
      />
    ));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {DIMENSIONS.map((dim) => (
        <Card key={dim.id} className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{dim.name}</CardTitle>
                <CardDescription className="mt-1">{dim.notes}</CardDescription>
              </div>
              <div className="flex gap-0.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-md">
                {renderStars(dim.score)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dim.gaps.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Key Gaps
                  </h4>
                  <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1">
                    {dim.gaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dim.suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Improvement Actions
                  </h4>
                  <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1">
                    {dim.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
