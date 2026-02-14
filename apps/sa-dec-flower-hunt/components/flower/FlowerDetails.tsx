"use client";

import { MapPin, Tag, Sparkles } from "lucide-react";

interface FlowerDetailsProps {
    origin: string;
    salesPitch: string;
}

export function FlowerDetails({ origin, salesPitch }: FlowerDetailsProps) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-stone-500">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-medium">Xuất xứ</span>
                    </div>
                    <p className="font-bold text-stone-900 text-sm">{origin}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-stone-500">
                        <Tag className="w-4 h-4" />
                        <span className="text-xs font-medium">Phân loại</span>
                    </div>
                    <p className="font-bold text-stone-900 text-sm">Hoa Tết</p>
                </div>
            </div>

            <div className="bg-yellow-50/50 rounded-2xl p-5 mb-6 border border-yellow-100">
                <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-stone-900 mb-1 text-sm">Điểm nổi bật</h3>
                        <p className="text-stone-600 text-sm leading-relaxed">{salesPitch}</p>
                    </div>
                </div>
            </div>
        </>
    );
}
