import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Landmark, TrendingUp } from "lucide-react";

interface Pathway {
  id: string;
  name: string;
  code: string;
  description: string;
  requirements: string[];
  fit: 'Strong' | 'Medium' | 'Weak';
  horizon: string;
  icon: React.ReactNode;
}

const PATHWAYS: Pathway[] = [
  {
    id: 'hose',
    name: 'Ho Chi Minh City Stock Exchange',
    code: 'VN_HOSE',
    description: 'The premier exchange for large-cap companies with strict listing standards.',
    requirements: ['Charter capital > 120B VND', 'Profitable for 2 years', 'ROE > 5%'],
    fit: 'Weak',
    horizon: '48+ months',
    icon: <Building2 className="w-8 h-8 text-blue-600" />
  },
  {
    id: 'hnx',
    name: 'Hanoi Stock Exchange',
    code: 'VN_HNX',
    description: 'Standard exchange for mid-cap enterprises.',
    requirements: ['Charter capital > 30B VND', 'Profitable for 1 year', 'No overdue debts'],
    fit: 'Medium',
    horizon: '24-36 months',
    icon: <Landmark className="w-8 h-8 text-orange-600" />
  },
  {
    id: 'upcom',
    name: 'UPCoM Market',
    code: 'VN_UPCOM',
    description: 'Unlisted Public Company Market, suitable for startups and SMEs.',
    requirements: ['Charter capital > 10B VND', 'Public company status'],
    fit: 'Strong',
    horizon: '12-18 months',
    icon: <TrendingUp className="w-8 h-8 text-green-600" />
  }
];

export function ListingPathways() {
  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'Strong': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Weak': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PATHWAYS.map((path) => (
        <Card key={path.id} className={`border-t-4 ${path.fit === 'Strong' ? 'border-t-green-500' : path.fit === 'Medium' ? 'border-t-yellow-500' : 'border-t-stone-200'} shadow-sm`}>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-100 dark:border-stone-700">
                    {path.icon}
                </div>
                <Badge variant="outline" className={getFitColor(path.fit)}>
                    {path.fit} Fit
                </Badge>
            </div>
            <CardTitle className="text-xl">{path.code}</CardTitle>
            <CardDescription>{path.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 min-h-[40px]">
                {path.description}
            </p>
            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-stone-500">Key Requirements</h4>
                <ul className="text-xs space-y-1 text-stone-700 dark:text-stone-300">
                    {path.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="block w-1 h-1 mt-1.5 rounded-full bg-stone-400" />
                            {req}
                        </li>
                    ))}
                </ul>
            </div>
          </CardContent>
          <CardFooter className="bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800 pt-4">
            <div className="w-full flex justify-between items-center text-xs font-medium text-stone-500">
                <span>Target Horizon</span>
                <span className="text-stone-900 dark:text-stone-100">{path.horizon}</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
