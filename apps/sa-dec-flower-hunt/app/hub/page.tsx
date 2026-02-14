"use client";

// ============================================================================
// DASHBOARD - Unified Hub for all AGRIOS Features
// ============================================================================
// Showcases all Sprint 1 & 2 features with live stats
// ============================================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Flower2, Gift, Home, MapPin, Zap, ShoppingCart,
    Leaf, TrendingUp, Users, Package, Star, Clock,
    ChevronRight, ArrowRight, Sparkles, Play
} from "lucide-react";
import Link from "next/link";
import { QuickLinks } from "@/components/landing/QuickLinks";
import { FlashSaleBanner } from "@/components/shop/FlashSaleBanner";
import { HotGardenMarkers } from "@/components/map/HotGardenMarkers";

// Stats component
function LiveStats() {
    const [stats, setStats] = useState({
        gardens: 3,
        flowers: 125,
        orders: 48,
        visitors: 1250
    });

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                visitors: prev.visitors + Math.floor(Math.random() * 5)
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: 'Nhà vườn', value: stats.gardens, icon: <Home className="w-5 h-5" />, color: 'text-emerald-400' },
                { label: 'Hoa trong kho', value: stats.flowers, icon: <Flower2 className="w-5 h-5" />, color: 'text-pink-400' },
                { label: 'Đơn hàng', value: stats.orders, icon: <Package className="w-5 h-5" />, color: 'text-amber-400' },
                { label: 'Lượt truy cập', value: stats.visitors, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
            ].map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-stone-900/50 border border-stone-800 rounded-xl p-4"
                >
                    <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                    <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
                    <div className="text-stone-500 text-sm">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

// Feature highlight card
function FeatureHighlight({
    title,
    description,
    href,
    emoji,
    color,
    stats
}: {
    title: string;
    description: string;
    href: string;
    emoji: string;
    color: string;
    stats: { label: string; value: string }[];
}) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white relative overflow-hidden`}
        >
            <div className="absolute top-0 right-0 text-8xl opacity-20 -mr-4 -mt-4">
                {emoji}
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-white/80 text-sm mb-4">{description}</p>

                <div className="flex gap-4 mb-4">
                    {stats.map(stat => (
                        <div key={stat.label}>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-white/60 text-xs">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <Link
                    href={href}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                    Khám phá <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </motion.div>
    );
}

// Main dashboard page
export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
            {/* Hero */}
            <section className="relative py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl font-bold text-white mb-2">
                            🌸 <span className="text-emerald-400">AGRIOS</span> Dashboard
                        </h1>
                        <p className="text-stone-400">Nền tảng nông nghiệp thông minh Sa Đéc</p>
                    </motion.div>

                    {/* Live Stats */}
                    <LiveStats />
                </div>
            </section>

            {/* Feature Highlights */}
            <section className="px-4 pb-12">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Tính năng nổi bật
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureHighlight
                            title="Nhận Nuôi Vườn Hoa"
                            description="Virtual farming - Theo dõi cây từ vườn đến nhà"
                            href="/adopt"
                            emoji="🌱"
                            color="from-emerald-600 to-green-700"
                            stats={[
                                { label: 'Loại cây', value: '4' },
                                { label: 'Từ/tháng', value: '99k' }
                            ]}
                        />
                        <FeatureHighlight
                            title="Sản Phẩm Từ Hoa"
                            description="Nước hoa hồng, trà sen, tinh dầu organic"
                            href="/shop/fmcg"
                            emoji="🌹"
                            color="from-rose-600 to-pink-700"
                            stats={[
                                { label: 'Sản phẩm', value: '8+' },
                                { label: 'Giảm đến', value: '30%' }
                            ]}
                        />
                        <FeatureHighlight
                            title="Farmstay Sa Đéc"
                            description="Nghỉ dưỡng giữa vườn hoa, Digital Detox"
                            href="/farmstay"
                            emoji="🏡"
                            color="from-cyan-600 to-blue-700"
                            stats={[
                                { label: 'Listings', value: '4' },
                                { label: 'Từ/đêm', value: '450k' }
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Flash Sales */}
            <section className="px-4 pb-12">
                <div className="max-w-6xl mx-auto">
                    <FlashSaleBanner />
                </div>
            </section>

            {/* Hot Gardens Map */}
            <section className="px-4 pb-12">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
                        <HotGardenMarkers />
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <QuickLinks />

            {/* CTA */}
            <section className="px-4 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Sẵn sàng trải nghiệm?
                        </h2>
                        <p className="text-emerald-100 mb-6">
                            Tham gia cùng hàng nghìn người yêu hoa Sa Đéc
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/register"
                                className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
                            >
                                Đăng ký miễn phí
                            </Link>
                            <Link
                                href="/video"
                                className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-colors flex items-center gap-2"
                            >
                                <Play className="w-5 h-5" /> Xem Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
