"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";

export function GardenProfile() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src="/avatars/garden-owner.svg" />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">UH</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900">Vườn Út Hùng</h3>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0 h-5">
                            Verified
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                        <MapPin className="w-3 h-3" />
                        <span>Tân Quy Đông, Sa Đéc</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3">
                <div className="text-center">
                    <p className="text-lg font-bold text-stone-900">4.9</p>
                    <div className="flex items-center justify-center text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div className="text-center">
                    <p className="text-lg font-bold text-stone-900">12+</p>
                    <p className="text-[10px] text-stone-500">Năm KN</p>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div className="text-center">
                    <p className="text-lg font-bold text-stone-900">5k+</p>
                    <p className="text-[10px] text-stone-500">Đã bán</p>
                </div>
            </div>

            <p className="text-xs text-stone-500 mt-3 italic text-center">
                "Chuyên các dòng cúc mâm xôi và hồng cổ Sa Đéc. Cam kết hoa nở đúng Tết."
            </p>
        </div>
    );
}
