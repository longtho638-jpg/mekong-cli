"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handlePayment = async () => {
        if (!orderId) {
            setError("Order ID không tồn tại");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Tạo thanh toán thất bại");
            }

            // Redirect to PayOS checkout page
            window.location.href = data.checkoutUrl;

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!orderId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-stone-950 border border-red-500/30 rounded-sm p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Lỗi</h1>
                    <p className="text-stone-400 mb-4">Không tìm thấy đơn hàng</p>
                    <Button onClick={() => router.push("/")} className="bg-emerald-500 hover:bg-emerald-600">
                        Về trang chủ
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-mono p-4 md:p-8 relative">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_market_hyperreal_1765367298057.png" className="w-full h-full object-cover opacity-15" />
            </div>
            <div className="relative z-10">
                <div className="max-w-2xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-stone-500 hover:text-emerald-400 mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm uppercase tracking-wider">Quay lại</span>
                    </button>

                    {/* Main Card */}
                    <motion.div
                        className="bg-stone-950 border border-emerald-500/30 rounded-sm p-8 md:p-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 border border-emerald-500/30 flex items-center justify-center bg-emerald-900/20">
                                <CreditCard className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">THANH_TOÁN</h1>
                                <p className="text-xs text-stone-500 uppercase tracking-wider">Secure Payment Gateway</p>
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-sm p-6 mb-8">
                            <div className="text-xs text-emerald-500 uppercase tracking-wider mb-2">Order ID</div>
                            <div className="text-sm text-white font-mono break-all">{orderId}</div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-8">
                            <div className="text-sm text-stone-400 uppercase tracking-wider mb-4">Phương thức thanh toán</div>
                            <div className="bg-stone-900 border border-emerald-500/30 rounded-sm p-4 flex items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center rounded">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <div>
                                    <div className="text-white font-bold">PayOS</div>
                                    <div className="text-xs text-stone-500">QR Code / Internet Banking / E-Wallet</div>
                                    <div className="text-[10px] text-emerald-500 mt-1">⚡ Nhanh hơn • Rẻ hơn • Dễ hơn</div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                className="bg-red-950/30 border border-red-500/30 rounded-sm p-4 mb-6 flex items-start gap-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-red-300">{error}</div>
                            </motion.div>
                        )}

                        {/* Action Button */}
                        <Button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-6 text-lg uppercase tracking-wider rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Thanh toán ngay
                                </>
                            )}
                        </Button>

                        {/* Security Note */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-stone-600 uppercase tracking-wider">
                                🔒 Giao dịch được mã hóa và bảo mật bởi PayOS
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
