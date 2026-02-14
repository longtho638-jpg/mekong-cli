"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_ORDER = {
    id: "SD-2026-8888",
    status: "shipping",
    estimatedDelivery: "14:30 Hôm nay",
    steps: [
        { id: 1, title: "Đã đặt hàng", time: "08:30 - 06/12", completed: true, icon: CheckCircle },
        { id: 2, title: "Nông dân đóng gói", time: "09:15 - 06/12", completed: true, icon: Package },
        { id: 3, title: "Đang giao hàng", time: "10:30 - 06/12", completed: true, icon: Truck, active: true },
        { id: 4, title: "Giao thành công", time: "Dự kiến 14:30", completed: false, icon: MapPin }
    ],
    driver: {
        name: "Chú Ba (Sa Đéc Express)",
        phone: "0909.888.xxx",
        vehicle: "Xe tải nhỏ 60C-..."
    }
};

export function DeliveryTracking() {
    const [orderId, setOrderId] = useState("");
    const [trackingResult, setTrackingResult] = useState<typeof MOCK_ORDER | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTrack = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setTrackingResult(MOCK_ORDER);
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-stone-900">Theo dõi đơn hàng 🚛</h2>
                <p className="text-stone-500">Nhập mã đơn hàng để xem hành trình từ vườn đến nhà.</p>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Ví dụ: SD-2026-8888"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="h-12 text-lg"
                />
                <Button
                    onClick={handleTrack}
                    disabled={loading}
                    className="h-12 px-6 bg-stone-900 text-white"
                >
                    {loading ? "Đang tìm..." : <Search className="w-5 h-5" />}
                </Button>
            </div>

            {trackingResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-2 border-stone-200 shadow-xl overflow-hidden">
                        <CardHeader className="bg-stone-50 border-b border-stone-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl">Đơn hàng #{trackingResult.id}</CardTitle>
                                    <CardDescription>Dự kiến: {trackingResult.estimatedDelivery}</CardDescription>
                                </div>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 px-3 py-1 text-sm">
                                    Đang giao hàng
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Timeline */}
                            <div className="relative space-y-8 pl-8 before:absolute before:left-[19px] before:top-2 before:h-[85%] before:w-0.5 before:bg-stone-200">
                                {trackingResult.steps.map((step) => {
                                    const Icon = step.icon;
                                    return (
                                        <div key={step.id} className="relative">
                                            <div className={`absolute -left-[43px] p-2 rounded-full border-2 ${step.completed || step.active
                                                    ? "bg-green-50 border-green-500 text-green-600"
                                                    : "bg-white border-stone-200 text-stone-300"
                                                }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>

                                            <div className={`${step.completed || step.active ? "opacity-100" : "opacity-50"}`}>
                                                <h4 className="font-bold text-stone-900">{step.title}</h4>
                                                <p className="text-sm text-stone-500">{step.time}</p>
                                                {step.active && (
                                                    <motion.div
                                                        layoutId="active-glow"
                                                        className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block font-medium"
                                                    >
                                                        📍 Đang xử lý tại đây
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Driver Info */}
                            <div className="mt-8 pt-6 border-t border-stone-100 flex items-center gap-4 bg-stone-50/50 p-4 rounded-xl">
                                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center text-2xl">
                                    👮‍♂️
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Tài xế</p>
                                    <p className="font-bold text-stone-900">{trackingResult.driver.name}</p>
                                    <p className="text-xs text-stone-400">{trackingResult.driver.vehicle}</p>
                                </div>
                                <Button variant="outline" className="ml-auto rounded-full">
                                    Gọi tài xế
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
