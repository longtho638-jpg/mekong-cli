import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Store, RefreshCw, Info } from "lucide-react";

export function ModelArchetype() {
  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-stone-900 to-stone-950 text-white">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Store className="w-32 h-32" />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <Badge variant="outline" className="text-indigo-300 border-indigo-500 mb-2">Primary Model</Badge>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                B2C E-commerce + Marketplace
                </CardTitle>
                <CardDescription className="text-stone-400 mt-2">
                Hybrid model connecting Sa Dec flower gardens directly to consumers nationwide.
                </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
                <Badge className="bg-indigo-600 hover:bg-indigo-700">Transaction Fee</Badge>
                <Badge variant="secondary" className="bg-stone-800 text-stone-300">Listing Fee (Future)</Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
            <div className="p-3 bg-indigo-500/20 rounded-full">
                <RefreshCw className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
                <h4 className="font-semibold text-indigo-100">Value Proposition</h4>
                <p className="text-sm text-stone-400">Freshness guarantee, direct-from-farm pricing, AR visualization.</p>
            </div>
        </div>

        <div className="mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Similar Models</h4>
            <div className="flex gap-3">
                {['Shopee', 'Grab Mart', 'Tiki Ngon'].map((brand) => (
                    <div key={brand} className="px-3 py-1.5 bg-stone-800 rounded text-xs font-medium text-stone-300 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {brand}
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
