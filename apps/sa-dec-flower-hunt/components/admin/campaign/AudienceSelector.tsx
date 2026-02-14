"use client";

import { Users, CheckCircle2, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AUDIENCES = [
    { id: "all", label: "Tất cả khách hàng tiềm năng", count: 5234, icon: Users },
    { id: "buyers", label: "Đã từng mua hàng", count: 856, icon: CheckCircle2 },
    { id: "cart_abandoned", label: "Chưa hoàn tất đơn", count: 142, icon: ShoppingCart },
];

interface AudienceSelectorProps {
    selectedAudience: string;
    isActive: boolean;
    onSelect: (id: string) => void;
}

export function AudienceSelector({ selectedAudience, isActive, onSelect }: AudienceSelectorProps) {
    return (
        <Card className={`transition-all duration-300 ${isActive ? 'ring-2 ring-stone-900 shadow-lg' : 'opacity-60'}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    Chọn Đối Tượng
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {AUDIENCES.map((aud) => {
                        const Icon = aud.icon;
                        return (
                            <div
                                key={aud.id}
                                onClick={() => onSelect(aud.id)}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-105 ${selectedAudience === aud.id ? 'border-red-500 bg-red-50' : 'border-stone-100 hover:border-stone-200'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 mb-2 ${selectedAudience === aud.id ? 'text-red-500' : 'text-stone-400'}`} />
                                <p className="font-bold text-stone-900">{aud.label}</p>
                                <p className="text-xs text-stone-500">{aud.count.toLocaleString()} leads</p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
