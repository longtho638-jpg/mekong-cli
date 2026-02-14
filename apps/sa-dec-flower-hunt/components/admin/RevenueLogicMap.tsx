import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Store, Truck, Building2 } from "lucide-react";

interface RevenueStream {
  id: string;
  stream: string;
  payer: string;
  payerIcon: React.ReactNode;
  mechanism: string;
  pricing: string;
  frequency: string;
  type: 'Primary' | 'Secondary' | 'Future';
}

const STREAMS: RevenueStream[] = [
  {
    id: '1',
    stream: 'Product Sales',
    payer: 'End Consumer',
    payerIcon: <User className="w-4 h-4" />,
    mechanism: 'Direct Purchase',
    pricing: 'Fixed Price',
    frequency: 'Per Order',
    type: 'Primary'
  },
  {
    id: '2',
    stream: 'Partner Commission',
    payer: 'Flower Gardens',
    payerIcon: <Store className="w-4 h-4" />,
    mechanism: '% of GMV',
    pricing: '15-20%',
    frequency: 'Per Order',
    type: 'Primary'
  },
  {
    id: '3',
    stream: 'Delivery Fee',
    payer: 'Consumer',
    payerIcon: <Truck className="w-4 h-4" />,
    mechanism: 'Flat + Distance',
    pricing: '15k - 50k VND',
    frequency: 'Per Order',
    type: 'Secondary'
  },
  {
    id: '4',
    stream: 'Wholesale Leads',
    payer: 'B2B Buyers',
    payerIcon: <Building2 className="w-4 h-4" />,
    mechanism: 'Lead Gen Fee',
    pricing: '50k VND / Lead',
    frequency: 'Per Form',
    type: 'Future'
  }
];

export function RevenueLogicMap() {
  const getTypeColor = (type: string) => {
    switch(type) {
        case 'Primary': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300';
        case 'Secondary': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
        case 'Future': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
        default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-1">
        {STREAMS.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden group">
             <div className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4">
                 {/* Stream Info */}
                 <div className="flex-1 min-w-[200px]">
                     <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`border ${getTypeColor(item.type)}`}>
                            {item.type}
                        </Badge>
                        <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">{item.stream}</h3>
                     </div>
                     <p className="text-xs text-stone-500 flex items-center gap-1">
                        Paid by: <span className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">{item.payerIcon} {item.payer}</span>
                     </p>
                 </div>

                 {/* Mechanism Arrow */}
                 <div className="hidden md:flex items-center justify-center text-stone-300">
                    <ArrowRight className="w-6 h-6" />
                 </div>

                 {/* Details */}
                 <div className="grid grid-cols-3 gap-4 w-full md:w-auto flex-1">
                    <div className="bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] uppercase text-stone-400 font-bold block mb-1">Mechanism</span>
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.mechanism}</span>
                    </div>
                    <div className="bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] uppercase text-stone-400 font-bold block mb-1">Pricing</span>
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.pricing}</span>
                    </div>
                    <div className="bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] uppercase text-stone-400 font-bold block mb-1">Frequency</span>
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.frequency}</span>
                    </div>
                 </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
