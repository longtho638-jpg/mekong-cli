"use client";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/data/flowers";

interface FlowerHeaderProps {
    name: string;
    basePrice: number;
    vibe: string;
}

export function FlowerHeader({ name, basePrice, vibe }: FlowerHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <Badge variant="secondary" className="mb-2 bg-red-50 text-red-600 hover:bg-red-100">
                        Hot Trend 2026 🔥
                    </Badge>
                    <h1 className="text-2xl font-bold text-stone-900 leading-tight">
                        {name}
                    </h1>
                </div>
                <div className="text-right">
                    <p className="text-xs text-stone-500 mb-1">Giá từ</p>
                    <p className="text-xl font-bold text-red-600">{formatPrice(basePrice)}</p>
                </div>
            </div>
            <p className="text-stone-500 font-medium text-sm">
                {vibe}
            </p>
        </div>
    );
}
