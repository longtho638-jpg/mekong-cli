"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Home, Download, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const windowSize = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5s
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}

            <motion.div
                className="max-w-2xl w-full bg-stone-950 border border-emerald-500/50 rounded-sm p-8 md:p-12 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Success Icon */}
                <motion.div
                    className="w-24 h-24 mx-auto mb-6 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                >
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 uppercase tracking-wider">
                        THANH_TOÁN_THÀNH_CÔNG!
                    </h1>
                    <p className="text-emerald-400 mb-6">Đơn hàng của bạn đã được xác nhận</p>
                </motion.div>

                {/* Order ID */}
                {orderId && (
                    <motion.div
                        className="bg-emerald-950/30 border border-emerald-500/30 rounded-sm p-4 mb-8 font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="text-xs text-emerald-500 uppercase tracking-wider mb-1">Mã đơn hàng</div>
                        <div className="text-sm text-white break-all">#{orderId.substring(0, 16)}...</div>
                    </motion.div>
                )}

                {/* Info */}
                <motion.div
                    className="text-sm text-stone-400 mb-8 space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <p>✅ Nông dân đã nhận được thông báo</p>
                    <p>📦 Đơn hàng sẽ được chuẩn bị và giao trong 1-2 ngày</p>
                    <p>💰 Số dư ví nông dân đã được cập nhật</p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col md:flex-row gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <Button
                        onClick={() => router.push("/orders")}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-sm"
                    >
                        <Package className="w-5 h-5 mr-2" />
                        Xem đơn hàng
                    </Button>
                    <Button
                        onClick={() => router.push("/")}
                        className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-4 rounded-sm"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Về trang chủ
                    </Button>
                </motion.div>

                {/* Footer Note */}
                <motion.p
                    className="text-xs text-stone-600 mt-8 uppercase tracking-wider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    Cảm ơn bạn đã ủng hộ nông dân Sa Đéc! 🌺
                </motion.p>
            </motion.div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <SuccessContent />
        </Suspense>
    );
}
