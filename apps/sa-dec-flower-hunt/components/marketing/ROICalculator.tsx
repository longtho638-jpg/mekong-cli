"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Sprout, TrendingUp, DollarSign, PiggyBank } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function ROICalculator() {
    const [mode, setMode] = useState<"farmer" | "investor">("farmer");
    const [pots, setPots] = useState(500);
    const [avgPrice, setAvgPrice] = useState(50000);
    const [investment, setInvestment] = useState(100000000);

    // Farmer calculations
    const grossRevenue = pots * avgPrice;
    const platformFee = grossRevenue * 0.05;
    const netRevenue = grossRevenue - platformFee;
    const monthlyProfit = netRevenue * 0.95; // 95% margin after costs

    // Investor calculations
    const annualReturn = investment * 0.25; // 25% projected annual return
    const monthlyReturn = annualReturn / 12;
    const roiPercent = 25;

    const formatVND = (n: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(n);

    return (
        <section className="py-16 border-t border-emerald-500/10">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        📊 TÍNH TOÁN LỢI NHUẬN
                    </p>
                    <h2 className="text-2xl font-light text-white">
                        Bạn có thể kiếm <span className="text-emerald-400 font-bold font-mono">BAO NHIÊU?</span>
                    </h2>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <button
                        onClick={() => setMode("farmer")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${mode === "farmer"
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-black/40 border-stone-800 text-stone-500 hover:border-stone-600"
                            }`}
                    >
                        <Sprout className="w-4 h-4" />
                        <span className="text-sm font-mono uppercase">Nhà Vườn</span>
                    </button>
                    <button
                        onClick={() => setMode("investor")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${mode === "investor"
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                                : "bg-black/40 border-stone-800 text-stone-500 hover:border-stone-600"
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-mono uppercase">Nhà Đầu Tư</span>
                    </button>
                </div>

                {/* Calculator Card */}
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto bg-stone-950 border border-emerald-500/20 rounded-lg p-8"
                >
                    {mode === "farmer" ? (
                        <>
                            {/* Farmer Mode */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm text-stone-400">Số chậu hoa</label>
                                        <span className="text-lg font-bold text-white font-mono">{pots}</span>
                                    </div>
                                    <Slider
                                        value={[pots]}
                                        onValueChange={(v) => setPots(v[0])}
                                        min={100}
                                        max={2000}
                                        step={50}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-[10px] text-stone-600 mt-1">
                                        <span>100</span>
                                        <span>2,000</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm text-stone-400">Giá TB/chậu</label>
                                        <span className="text-lg font-bold text-white font-mono">{formatVND(avgPrice)}</span>
                                    </div>
                                    <Slider
                                        value={[avgPrice]}
                                        onValueChange={(v) => setAvgPrice(v[0])}
                                        min={20000}
                                        max={200000}
                                        step={5000}
                                        className="w-full"
                                    />
                                </div>

                                {/* Results */}
                                <div className="pt-6 border-t border-emerald-500/20 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-stone-500">Doanh thu gross:</span>
                                        <span className="text-stone-300">{formatVND(grossRevenue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-stone-500">Phí nền tảng (5%):</span>
                                        <span className="text-red-400">-{formatVND(platformFee)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-lg pt-3 border-t border-stone-800">
                                        <span className="text-emerald-400 font-bold flex items-center gap-2">
                                            <PiggyBank className="w-5 h-5" />
                                            Lợi nhuận/tháng:
                                        </span>
                                        <span className="text-2xl font-bold text-emerald-400 font-mono">
                                            {formatVND(monthlyProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Investor Mode */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm text-stone-400">Số tiền đầu tư</label>
                                        <span className="text-lg font-bold text-white font-mono">{formatVND(investment)}</span>
                                    </div>
                                    <Slider
                                        value={[investment]}
                                        onValueChange={(v) => setInvestment(v[0])}
                                        min={50000000}
                                        max={1000000000}
                                        step={50000000}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-[10px] text-stone-600 mt-1">
                                        <span>50M</span>
                                        <span>1B</span>
                                    </div>
                                </div>

                                {/* Results */}
                                <div className="pt-6 border-t border-amber-500/20 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-stone-500">ROI dự kiến/năm:</span>
                                        <span className="text-amber-400 font-bold">{roiPercent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-stone-500">Lợi nhuận/năm:</span>
                                        <span className="text-stone-300">{formatVND(annualReturn)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-lg pt-3 border-t border-stone-800">
                                        <span className="text-amber-400 font-bold flex items-center gap-2">
                                            <DollarSign className="w-5 h-5" />
                                            Lợi nhuận/tháng:
                                        </span>
                                        <span className="text-2xl font-bold text-amber-400 font-mono">
                                            {formatVND(monthlyReturn)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Disclaimer */}
                <p className="text-center text-[10px] text-stone-600 mt-4 max-w-md mx-auto">
                    * Số liệu chỉ mang tính tham khảo. Kết quả thực tế có thể khác biện tuỳ theo thị trường.
                </p>
            </div>
        </section>
    );
}
