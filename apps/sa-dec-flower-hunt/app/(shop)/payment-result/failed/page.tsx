"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function FailedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason") || "Không xác định";

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <motion.div
                className="max-w-2xl w-full bg-stone-950 border border-red-500/50 rounded-sm p-8 md:p-12 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Error Icon */}
                <motion.div
                    className="w-24 h-24 mx-auto mb-6 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                >
                    <XCircle className="w-12 h-12 text-red-500" />
                </motion.div>

                {/* Error Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 uppercase tracking-wider">
                        THANH_TOÁN_THẤT_BẠI
                    </h1>
                    <p className="text-stone-500 text-sm">Nếu bạn nghĩ đây là lỗi, hãy liên hệ hotline AGRIOS.tech</p>
                </motion.div>

                {/* Reason */}
                <motion.div
                    className="bg-red-950/30 border border-red-500/30 rounded-sm p-4 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="text-xs text-red-500 uppercase tracking-wider mb-1">Lý do</div>
                    <div className="text-sm text-white">{decodeURIComponent(reason)}</div>
                </motion.div>

                {/* Possible Solutions */}
                <motion.div
                    className="text-left bg-stone-900 border border-stone-800 rounded-sm p-6 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="text-sm text-emerald-500 uppercase tracking-wider mb-3">Hãy thử:</div>
                    <ul className="text-sm text-stone-400 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>Kiểm tra số dư tài khoản ngân hàng</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>Đảm bảo thông tin thẻ chính xác</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>Liên hệ ngân hàng nếu gặp vấn đề</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>Thử lại sau vài phút</span>
                        </li>
                    </ul>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col md:flex-row gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <Button
                        onClick={() => router.back()}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-sm"
                    >
                        <RefreshCcw className="w-5 h-5 mr-2" />
                        Thử lại
                    </Button>
                    <Button
                        onClick={() => router.push("/")}
                        className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-4 rounded-sm"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Về trang chủ
                    </Button>
                </motion.div>

                {/* Support */}
                <motion.p
                    className="text-xs text-stone-600 mt-8 uppercase tracking-wider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    Cần hỗ trợ? Liên hệ: support@agrios.tech
                </motion.p>
            </motion.div>
        </div>
    );
}

export default function OrderFailedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <FailedContent />
        </Suspense>
    );
}
