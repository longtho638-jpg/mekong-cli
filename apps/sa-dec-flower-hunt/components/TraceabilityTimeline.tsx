"use client";

import { CheckCircle2, Circle, Truck, Sprout, Package } from "lucide-react";

export function TraceabilityTimeline() {
    const steps = [
        {
            icon: Sprout,
            label: "Thu Hoạch",
            time: "05:30 AM",
            date: "Hôm nay",
            status: "completed",
            detail: "Tại Vườn Út Hùng"
        },
        {
            icon: Package,
            label: "Đóng Gói",
            time: "06:15 AM",
            date: "Hôm nay",
            status: "completed",
            detail: "Quy chuẩn 5 lớp"
        },
        {
            icon: Truck,
            label: "Vận Chuyển",
            time: "Đang chờ",
            date: "Dự kiến 2h",
            status: "current",
            detail: "Xe lạnh 25°C"
        },
        {
            icon: CheckCircle2,
            label: "Giao Hàng",
            time: "--:--",
            date: "Hôm nay",
            status: "pending",
            detail: "Đến tay bạn"
        }
    ];

    return (
        <div className="py-4">
            <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 p-1 rounded-md text-green-600">
                    <Truck className="w-4 h-4" />
                </span>
                Hành Trình Từ Vườn
            </h3>
            <div className="relative pl-4 border-l-2 border-stone-100 space-y-6">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = step.status === "completed";
                    const isCurrent = step.status === "current";

                    return (
                        <div key={index} className="relative pl-6">
                            {/* Dot */}
                            <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${isCompleted ? "border-green-500 text-green-500" :
                                    isCurrent ? "border-blue-500 text-blue-500" : "border-stone-200 text-stone-300"
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${isCompleted ? "bg-green-500" :
                                        isCurrent ? "bg-blue-500 animate-pulse" : "bg-transparent"
                                    }`} />
                            </div>

                            {/* Content */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`font-bold text-sm ${isCompleted ? "text-stone-900" :
                                            isCurrent ? "text-blue-600" : "text-stone-400"
                                        }`}>
                                        {step.label}
                                    </p>
                                    <p className="text-xs text-stone-500">{step.detail}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-stone-900">{step.time}</p>
                                    <p className="text-[10px] text-stone-400">{step.date}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
