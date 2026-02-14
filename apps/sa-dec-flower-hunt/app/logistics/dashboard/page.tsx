"use client";

import { motion } from "framer-motion";
import { NodePulse } from "@/components/terminal/NodePulse";
import {
    Truck,
    Thermometer,
    Droplets,
    MapPin,
    Clock,
    CheckCircle,
    AlertTriangle,
    Navigation
} from "lucide-react";
import { useState, useEffect } from "react";

interface Delivery {
    id: string;
    route: string;
    driver: string;
    vehicle: string;
    status: "in_transit" | "delivered" | "delayed";
    temp: number;
    humidity: number;
    eta: string;
    items: number;
}

const MOCK_DELIVERIES: Delivery[] = [
    { id: "DLV-401", route: "Sa Đéc → TP.HCM", driver: "Anh Tuấn", vehicle: "Xe tải lạnh 2T", status: "in_transit", temp: 18.2, humidity: 65, eta: "45 phút", items: 120 },
    { id: "DLV-400", route: "Sa Đéc → Cần Thơ", driver: "Anh Minh", vehicle: "Xe tải lạnh 1.5T", status: "in_transit", temp: 17.8, humidity: 62, eta: "30 phút", items: 85 },
    { id: "DLV-399", route: "Sa Đéc → Vĩnh Long", driver: "Cô Hương", vehicle: "Xe van lạnh", status: "delivered", temp: 18.5, humidity: 68, eta: "Đã giao", items: 45 },
    { id: "DLV-398", route: "Sa Đéc → Long An", driver: "Anh Đức", vehicle: "Xe tải lạnh 2T", status: "delayed", temp: 19.1, humidity: 70, eta: "Trễ 15p", items: 95 },
];

const LOGISTICS_STATS = {
    activeDeliveries: 234,
    avgTemp: 18.5,
    avgHumidity: 65,
    onTimeRate: 97.2,
    totalFleet: 45,
    activeVehicles: 38,
};

export default function LogisticsDashboard() {
    const [currentTime, setCurrentTime] = useState("");
    const [deliveries] = useState(MOCK_DELIVERIES);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit", minute: "2-digit", second: "2-digit"
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const statusColor = (status: string) => {
        if (status === "delivered") return "text-emerald-400 bg-emerald-900/20";
        if (status === "in_transit") return "text-cyan-400 bg-cyan-900/20";
        return "text-red-400 bg-red-900/20";
    };

    const tempColor = (temp: number) => {
        if (temp >= 15 && temp <= 20) return "text-emerald-400";
        if (temp > 20 && temp <= 22) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 font-mono p-6">
            {/* Header */}
            <motion.div
                className="mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 border border-cyan-500/30 bg-cyan-900/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.15em] text-white">
                            LOGISTICS<span className="text-cyan-400">_NODE</span>
                        </h1>
                        <div className="text-xs text-stone-500 tracking-wider flex items-center gap-2">
                            CHUỖI_CUNG_ỨNG_LẠNH // THỜI_GIAN: <span className="text-white">{currentTime}</span>
                            <NodePulse size="sm" color="emerald" />
                            <span className="text-emerald-400">LIVE</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="text-xs text-stone-500 mb-1">ĐANG_GIAO</div>
                    <div className="text-xl font-bold text-cyan-400">{LOGISTICS_STATS.activeDeliveries}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-cyan-500/30 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-cyan-400" /> NHIỆT_ĐỘ_TB
                    </div>
                    <div className="text-xl font-bold text-cyan-400">{LOGISTICS_STATS.avgTemp}°C</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-400" /> ĐỘ_ẨM_TB
                    </div>
                    <div className="text-xl font-bold text-white">{LOGISTICS_STATS.avgHumidity}%</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-emerald-500/30 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="text-xs text-stone-500 mb-1">TỶ_LỆ_ĐÚNG_GIỜ</div>
                    <div className="text-xl font-bold text-emerald-400">{LOGISTICS_STATS.onTimeRate}%</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="text-xs text-stone-500 mb-1">TỔNG_XE</div>
                    <div className="text-xl font-bold text-white">{LOGISTICS_STATS.totalFleet}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="text-xs text-stone-500 mb-1">XE_ĐANG_CHẠY</div>
                    <div className="text-xl font-bold text-emerald-400">{LOGISTICS_STATS.activeVehicles}</div>
                </motion.div>
            </div>

            {/* Live Deliveries */}
            <motion.div
                className="bg-stone-900/50 border border-stone-800 rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold tracking-wider">
                        CHUYẾN_HÀNG_THỜI_GIAN_THỰC
                    </h2>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            ĐANG_GIAO: {deliveries.filter(d => d.status === "in_transit").length}
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            ĐÃ_GIAO: {deliveries.filter(d => d.status === "delivered").length}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {deliveries.map((delivery, index) => (
                        <motion.div
                            key={delivery.id}
                            className="flex items-center justify-between p-4 bg-stone-950/50 border border-stone-800 rounded-lg hover:border-cyan-500/30 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded border border-cyan-500/30 bg-cyan-900/20 flex items-center justify-center">
                                    <Navigation className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{delivery.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(delivery.status)}`}>
                                            {delivery.status === "in_transit" && "ĐANG_GIAO"}
                                            {delivery.status === "delivered" && "ĐÃ_GIAO"}
                                            {delivery.status === "delayed" && "TRỄ"}
                                        </span>
                                    </div>
                                    <div className="text-sm text-stone-400 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {delivery.route}
                                    </div>
                                    <div className="text-xs text-stone-500">
                                        {delivery.driver} • {delivery.vehicle} • {delivery.items} sản phẩm
                                    </div>
                                </div>
                            </div>

                            {/* Cold Chain Data */}
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${tempColor(delivery.temp)}`}>
                                        {delivery.temp}°C
                                    </div>
                                    <div className="text-xs text-stone-500">NHIỆT_ĐỘ</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-white">
                                        {delivery.humidity}%
                                    </div>
                                    <div className="text-xs text-stone-500">ĐỘ_ẨM</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-white flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-stone-400" />
                                        {delivery.eta}
                                    </div>
                                    <div className="text-xs text-stone-500">ETA</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Temperature Legend */}
            <div className="mt-6 p-4 bg-stone-900/30 border border-stone-800 rounded-lg">
                <div className="flex items-center gap-6 text-xs">
                    <span className="text-stone-500">NGƯỠNG_NHIỆT_ĐỘ_TỐI_ƯU:</span>
                    <span className="text-emerald-400 font-bold">15°C - 20°C ✓</span>
                    <span className="text-yellow-400 font-bold">20°C - 22°C ⚠</span>
                    <span className="text-red-400 font-bold">&gt;22°C ✗</span>
                    <span className="text-stone-500 ml-auto">Cảm biến IoT cập nhật mỗi 30 giây</span>
                </div>
            </div>
        </div>
    );
}
