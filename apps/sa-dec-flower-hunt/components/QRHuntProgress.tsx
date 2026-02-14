"use client";

import { useState, useEffect } from "react";
import { Gift, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const REQUIRED_SCANS = 5;

export default function QRHuntProgress() {
    const [scannedFlowers, setScannedFlowers] = useState<number[]>([]);
    const [showVoucher, setShowVoucher] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("sadec_scanned") || "[]");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScannedFlowers(saved);
        setVoucherCode(`SADEC2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    }, []);

    const progress = Math.min(scannedFlowers.length, REQUIRED_SCANS);
    const percentage = (progress / REQUIRED_SCANS) * 100;
    const isComplete = progress >= REQUIRED_SCANS;

    return (
        <div className="mx-4 mb-4">
            <div className="bg-gradient-to-r from-yellow-50 to-red-50 rounded-2xl p-4 border border-yellow-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-100 p-2 rounded-full">
                            <Gift className="w-5 h-5 text-yellow-600" />
                        </div>
                        <Link href="/leaderboard" className="group">
                            <h3 className="font-bold text-stone-800 text-sm group-hover:text-red-600 transition-colors flex items-center gap-1">
                                Săn Thưởng 🎁
                                <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-full text-stone-500 group-hover:bg-red-50 group-hover:text-red-500">BXH &gt;</span>
                            </h3>
                            <p className="text-xs text-stone-500">Quét 5 vườn → Giảm 30%</p>
                        </Link>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                        {progress}/{REQUIRED_SCANS}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-stone-200 rounded-full overflow-hidden mb-3">
                    <motion.div
                        className="h-full bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Status */}
                {isComplete ? (
                    <button
                        onClick={() => setShowVoucher(true)}
                        className="w-full bg-gradient-to-r from-yellow-400 to-red-500 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Nhận Voucher 30%!
                    </button>
                ) : (
                    <div className="flex gap-1">
                        {Array.from({ length: REQUIRED_SCANS }).map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-2 rounded-full ${i < progress ? "bg-green-400" : "bg-stone-200"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Voucher Modal */}
            <AnimatePresence>
                {showVoucher && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
                        onClick={() => setShowVoucher(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">
                                Chúc Mừng!
                            </h2>
                            <p className="text-stone-500 mb-4">
                                Bạn đã hoàn thành thử thách. Đây là voucher giảm 30%:
                            </p>
                            <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl p-4 mb-4">
                                <code className="text-xl font-mono font-bold text-red-600">
                                    {voucherCode}
                                </code>
                            </div>
                            <p className="text-xs text-stone-400">
                                Hạn sử dụng: 31/12/2026
                            </p>
                            <button
                                onClick={() => setShowVoucher(false)}
                                className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full font-bold"
                            >
                                Đóng
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
