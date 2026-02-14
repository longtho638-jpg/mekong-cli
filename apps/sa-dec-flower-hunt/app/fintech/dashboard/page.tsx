"use client";

import { motion } from "framer-motion";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { DataStream } from "@/components/terminal/DataStream";
import { NodePulse } from "@/components/terminal/NodePulse";
import {
    Landmark,
    TrendingUp,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Leaf,
    Shield
} from "lucide-react";
import { useState, useEffect } from "react";

interface CreditApplication {
    id: string;
    farmerName: string;
    amount: number;
    score: string;
    status: "pending" | "approved" | "rejected";
    purpose: string;
    date: string;
}

const MOCK_APPLICATIONS: CreditApplication[] = [
    { id: "CR-2401", farmerName: "Nguyễn Văn Thanh", amount: 50000000, score: "AA+", status: "approved", purpose: "Mở rộng vườn mai", date: "Hôm nay" },
    { id: "CR-2400", farmerName: "Trần Thị Hoa", amount: 30000000, score: "A", status: "pending", purpose: "Mua phân bón hữu cơ", date: "Hôm qua" },
    { id: "CR-2399", farmerName: "Lê Hoàng Nam", amount: 80000000, score: "AA", status: "approved", purpose: "Hệ thống tưới tự động", date: "2 ngày trước" },
    { id: "CR-2398", farmerName: "Phạm Văn Đức", amount: 15000000, score: "B+", status: "rejected", purpose: "Vốn lưu động", date: "3 ngày trước" },
];

const CREDIT_PORTFOLIO = {
    totalDisbursed: 450000000,
    activeLoanCount: 89,
    averageScore: "A+",
    nplRatio: 0.8,
    greenCreditRatio: 72,
    avgInterestRate: 6.5,
};

export default function FintechDashboard() {
    const [currentTime, setCurrentTime] = useState("");
    const [applications] = useState(MOCK_APPLICATIONS);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit", minute: "2-digit", second: "2-digit"
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatVND = (n: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", notation: "compact" }).format(n);

    const scoreColor = (score: string) => {
        if (score.startsWith("AA")) return "text-emerald-400";
        if (score.startsWith("A")) return "text-green-400";
        if (score.startsWith("B")) return "text-yellow-400";
        return "text-red-400";
    };

    const statusColor = (status: string) => {
        if (status === "approved") return "text-emerald-400 bg-emerald-900/20";
        if (status === "pending") return "text-yellow-400 bg-yellow-900/20";
        return "text-red-400 bg-red-900/20";
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
                    <div className="w-12 h-12 border border-yellow-500/30 bg-yellow-900/20 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.15em] text-white">
                            BANK<span className="text-yellow-400">_NODE</span>
                        </h1>
                        <div className="text-xs text-stone-500 tracking-wider flex items-center gap-2">
                            TÍN_DỤNG_XANH // THỜI_GIAN: <span className="text-white">{currentTime}</span>
                            <NodePulse size="sm" color="emerald" />
                            <span className="text-emerald-400">LIVE</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Portfolio Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="text-xs text-stone-500 mb-1">TỔNG_GIẢI_NGÂN</div>
                    <div className="text-xl font-bold text-yellow-400">{formatVND(CREDIT_PORTFOLIO.totalDisbursed)}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="text-xs text-stone-500 mb-1">KHOẢN_VAY_ĐANG_HOẠT_ĐỘNG</div>
                    <div className="text-xl font-bold text-white">{CREDIT_PORTFOLIO.activeLoanCount}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="text-xs text-stone-500 mb-1">ĐIỂM_TÍN_DỤNG_TB</div>
                    <div className="text-xl font-bold text-emerald-400">{CREDIT_PORTFOLIO.averageScore}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="text-xs text-stone-500 mb-1">TỶ_LỆ_NỢ_XẤU</div>
                    <div className="text-xl font-bold text-emerald-400">{CREDIT_PORTFOLIO.nplRatio}%</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-emerald-500/30 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-400" /> TÍN_DỤNG_XANH
                    </div>
                    <div className="text-xl font-bold text-emerald-400">{CREDIT_PORTFOLIO.greenCreditRatio}%</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="text-xs text-stone-500 mb-1">LÃI_SUẤT_TB</div>
                    <div className="text-xl font-bold text-white">{CREDIT_PORTFOLIO.avgInterestRate}%</div>
                </motion.div>
            </div>

            {/* Recent Applications */}
            <motion.div
                className="bg-stone-900/50 border border-stone-800 rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold tracking-wider">
                        HỒ_SƠ_VAY_GẦN_ĐÂY
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-stone-500">CHỜ_DUYỆT:</span>
                        <span className="text-yellow-400 font-bold">
                            {applications.filter(a => a.status === "pending").length}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {applications.map((app, index) => (
                        <motion.div
                            key={app.id}
                            className="flex items-center justify-between p-4 bg-stone-950/50 border border-stone-800 rounded hover:border-yellow-500/30 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded border border-stone-700 bg-stone-900 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-stone-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{app.id}</span>
                                        <span className={`text-lg font-bold ${scoreColor(app.score)}`}>{app.score}</span>
                                    </div>
                                    <div className="text-sm text-stone-400">{app.farmerName}</div>
                                    <div className="text-xs text-stone-500">{app.purpose}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-white">{formatVND(app.amount)}</div>
                                <div className="text-xs text-stone-500">{app.date}</div>
                            </div>
                            <div className={`px-3 py-1 rounded text-xs font-bold ${statusColor(app.status)}`}>
                                {app.status === "approved" && <><CheckCircle className="w-3 h-3 inline mr-1" />ĐÃ_DUYỆT</>}
                                {app.status === "pending" && <><Clock className="w-3 h-3 inline mr-1" />CHỜ_DUYỆT</>}
                                {app.status === "rejected" && <><AlertTriangle className="w-3 h-3 inline mr-1" />TỪ_CHỐI</>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Credit Score Legend */}
            <div className="mt-6 p-4 bg-stone-900/30 border border-stone-800 rounded-lg">
                <div className="flex items-center gap-6 text-xs">
                    <span className="text-stone-500">THANG_ĐIỂM_TÍN_DỤNG:</span>
                    <span className="text-emerald-400 font-bold">AA+ → AA</span>
                    <span className="text-green-400 font-bold">A+ → A</span>
                    <span className="text-yellow-400 font-bold">B+ → B</span>
                    <span className="text-red-400 font-bold">C → D</span>
                    <span className="text-stone-500 ml-auto">Powered by IoT Sensor Data + Payment History</span>
                </div>
            </div>
        </div>
    );
}
