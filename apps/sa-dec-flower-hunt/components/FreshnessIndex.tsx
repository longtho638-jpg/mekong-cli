"use client";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Leaf, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FreshnessIndex() {
    const score = 98;

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-stone-900">Chỉ Số Tươi</h3>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="w-4 h-4 text-stone-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Được tính toán dựa trên thời gian thu hoạch và điều kiện vận chuyển.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                    <CircularProgressbar
                        value={score}
                        text={`${score}`}
                        styles={buildStyles({
                            textSize: '28px',
                            pathColor: '#16a34a',
                            textColor: '#166534',
                            trailColor: '#dcfce7',
                            pathTransitionDuration: 0.5,
                        })}
                    />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-green-700 text-sm mb-1">Xuất Sắc (A+)</p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                        Hoa vừa được cắt cành <strong>2 giờ trước</strong>. Độ ẩm cánh hoa đạt chuẩn 95%.
                    </p>
                </div>
            </div>
        </div>
    );
}
