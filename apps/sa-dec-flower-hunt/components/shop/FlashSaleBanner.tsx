"use client";

// ============================================================================
// FLASH SALE BANNER - "Giải cứu hoa" Component
// ============================================================================
// Displays active flash sales with countdown timer
// Auto-updates from /api/flash-sale endpoint
// ============================================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, Tag, ChevronRight, Flame, RefreshCw } from "lucide-react";
import Link from "next/link";

interface FlashSale {
    flowerType: string;
    gardenId: string;
    gardenName: string;
    quantity: number;
    originalPrice: number;
    salePrice: number;
    discount: number;
    expiresAt: string | Date;
    reason: string;
}

// Countdown timer
function CountdownTimer({ expiresAt }: { expiresAt: string | Date }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Hết hạn');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    return (
        <div className="flex items-center gap-1 text-amber-300 font-mono text-sm">
            <Clock className="w-4 h-4" />
            {timeLeft}
        </div>
    );
}

// Single sale card
function FlashSaleCard({ sale, index }: { sale: FlashSale; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-xl p-4 hover:border-red-500/50 transition-all"
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            -{sale.discount}%
                        </span>
                        <span className="text-stone-400 text-xs">
                            {sale.gardenName}
                        </span>
                    </div>
                    <h3 className="text-white font-bold">{sale.flowerType}</h3>
                </div>
                <CountdownTimer expiresAt={sale.expiresAt} />
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-3">
                <div className="text-2xl font-bold text-red-400">
                    {(sale.salePrice / 1000).toFixed(0)}k
                </div>
                <div className="text-stone-500 line-through text-sm mb-1">
                    {(sale.originalPrice / 1000).toFixed(0)}k
                </div>
                <div className="text-emerald-400 text-sm mb-1">
                    Còn {sale.quantity} chậu
                </div>
            </div>

            {/* Reason tag */}
            <div className="text-amber-200 text-xs mb-3 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {sale.reason}
            </div>

            {/* CTA */}
            <Link
                href={`/shop?garden=${sale.gardenId}&sale=true`}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
                <Zap className="w-4 h-4" />
                Mua ngay
            </Link>
        </motion.div>
    );
}

// Banner component for homepage
export function FlashSaleBanner() {
    const [sales, setSales] = useState<FlashSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/flash-sale?action=generate');
            const data = await res.json();

            if (data.flashSales) {
                setSales(data.flashSales.slice(0, 4)); // Show max 4
            }
        } catch (err) {
            setError('Không thể tải flash sale');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
        // Refresh every 5 minutes
        const interval = setInterval(fetchSales, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-red-950 to-orange-950 rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center justify-center py-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full"
                    />
                </div>
            </div>
        );
    }

    if (error || sales.length === 0) {
        return null; // Hide if no sales
    }

    return (
        <section className="bg-gradient-to-r from-red-950 to-orange-950 rounded-2xl p-6 border border-red-500/20 overflow-hidden relative">
            {/* Animated flames background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bottom-0 text-4xl"
                        initial={{ y: 100, x: `${i * 12 + 5}%`, opacity: 0.3 }}
                        animate={{
                            y: [100, -50],
                            opacity: [0.3, 0.7, 0],
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: i * 0.3,
                        }}
                    >
                        🔥
                    </motion.div>
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <Flame className="w-8 h-8 text-red-400" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">🔥 GIẢI CỨU HOA</h2>
                            <p className="text-red-300 text-sm">Flash Sale - Tồn kho cao, giá sốc!</p>
                        </div>
                    </div>

                    <button
                        onClick={fetchSales}
                        className="text-stone-400 hover:text-white flex items-center gap-1 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>

                {/* Sales grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sales.map((sale, i) => (
                        <FlashSaleCard key={i} sale={sale} index={i} />
                    ))}
                </div>

                {/* View all link */}
                <div className="mt-6 text-center">
                    <Link
                        href="/shop?filter=sale"
                        className="text-red-300 hover:text-white text-sm font-medium inline-flex items-center gap-1"
                    >
                        Xem tất cả Flash Sale <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// Floating notification for new flash sales
export function FlashSaleNotification() {
    const [show, setShow] = useState(false);
    const [sale, setSale] = useState<FlashSale | null>(null);

    useEffect(() => {
        // Check for new sales periodically
        const checkSales = async () => {
            try {
                const res = await fetch('/api/flash-sale?action=generate');
                const data = await res.json();

                if (data.flashSales && data.flashSales.length > 0) {
                    // Show notification for highest discount
                    const topSale = data.flashSales[0];
                    setSale(topSale);
                    setShow(true);

                    // Auto-hide after 10 seconds
                    setTimeout(() => setShow(false), 10000);
                }
            } catch { }
        };

        // Check on mount and every 10 minutes
        checkSales();
        const interval = setInterval(checkSales, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {show && sale && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="fixed bottom-24 right-4 z-50 max-w-sm"
                >
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-4 shadow-2xl border border-red-400">
                        <button
                            onClick={() => setShow(false)}
                            className="absolute top-2 right-2 text-white/70 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <motion.span
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="text-3xl"
                            >
                                🔥
                            </motion.span>
                            <div>
                                <div className="text-white font-bold">Flash Sale!</div>
                                <div className="text-red-100 text-sm">{sale.flowerType}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-white text-red-600 text-sm font-bold px-2 py-0.5 rounded">
                                    -{sale.discount}%
                                </span>
                                <span className="text-white font-bold">
                                    {(sale.salePrice / 1000).toFixed(0)}k
                                </span>
                            </div>
                            <CountdownTimer expiresAt={sale.expiresAt} />
                        </div>

                        <Link
                            href={`/shop?garden=${sale.gardenId}&sale=true`}
                            onClick={() => setShow(false)}
                            className="w-full bg-white text-red-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                        >
                            <Zap className="w-4 h-4" />
                            Mua ngay
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default FlashSaleBanner;
