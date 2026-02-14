"use client";

// ============================================================================
// QUICK LINKS - Navigation Hub for all WOW Features
// ============================================================================
// Displays all new features in a beautiful grid
// ============================================================================

import { motion } from "framer-motion";
import {
    Flower2, Gift, Home, MapPin, Zap, ShoppingCart,
    Leaf, Coffee, Trophy, Sparkles, ChevronRight, ArrowRight
} from "lucide-react";
import Link from "next/link";

// Feature links
const FEATURES = [
    {
        title: 'Săn Hoa',
        description: 'Loot box & vườn hot',
        href: '/hunt',
        icon: <Gift className="w-6 h-6" />,
        emoji: '🎯',
        color: 'from-amber-500 to-orange-500',
        badge: 'Game'
    },
    {
        title: 'Nhận Nuôi Cây',
        description: 'Virtual farming',
        href: '/adopt',
        icon: <Leaf className="w-6 h-6" />,
        emoji: '🌱',
        color: 'from-emerald-500 to-green-600',
        badge: 'New'
    },
    {
        title: 'Sản Phẩm Hoa',
        description: 'Nước hoa hồng, trà sen',
        href: '/shop/fmcg',
        icon: <Sparkles className="w-6 h-6" />,
        emoji: '🌹',
        color: 'from-rose-500 to-pink-600',
        badge: 'Hot'
    },
    {
        title: 'Farmstay',
        description: 'Nghỉ dưỡng nhà vườn',
        href: '/farmstay',
        icon: <Home className="w-6 h-6" />,
        emoji: '🏡',
        color: 'from-cyan-500 to-blue-600',
        badge: null
    },
    {
        title: 'Flash Sale',
        description: 'Giải cứu hoa',
        href: '/shop?filter=sale',
        icon: <Zap className="w-6 h-6" />,
        emoji: '🔥',
        color: 'from-red-500 to-orange-500',
        badge: 'Sale'
    },
    {
        title: 'Lễ Hội',
        description: 'Festival Hoa Xuân',
        href: '/festival',
        icon: <Trophy className="w-6 h-6" />,
        emoji: '🎊',
        color: 'from-purple-500 to-violet-600',
        badge: null
    },
    {
        title: 'AGRIOS.tech',
        description: 'Nền tảng nông nghiệp',
        href: '/agrios',
        icon: <Flower2 className="w-6 h-6" />,
        emoji: '🌸',
        color: 'from-emerald-500 to-teal-600',
        badge: 'Platform'
    },
    {
        title: 'Mua Hoa',
        description: 'Shop hoa tươi',
        href: '/shop',
        icon: <ShoppingCart className="w-6 h-6" />,
        emoji: '🛒',
        color: 'from-indigo-500 to-blue-600',
        badge: null
    }
];

// Single feature card
function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link
                href={feature.href}
                className="block bg-stone-900/50 border border-stone-800 rounded-xl p-4 hover:border-emerald-500/50 hover:bg-stone-800/50 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl">{feature.emoji}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold">{feature.title}</h3>
                            {feature.badge && (
                                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {feature.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-stone-500 text-sm">{feature.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
            </Link>
        </motion.div>
    );
}

// Main QuickLinks component
export function QuickLinks() {
    return (
        <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        Khám phá AGRIOS
                    </h2>
                    <Link
                        href="/agrios"
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
                    >
                        Xem tất cả <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FEATURES.map((feature, i) => (
                        <FeatureCard key={feature.title} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// Compact version for sidebar/footer
export function QuickLinksCompact() {
    return (
        <div className="grid grid-cols-4 gap-2">
            {FEATURES.slice(0, 4).map((feature, i) => (
                <Link
                    key={feature.title}
                    href={feature.href}
                    className="bg-stone-800 hover:bg-stone-700 rounded-xl p-3 text-center transition-colors group"
                >
                    <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">
                        {feature.emoji}
                    </span>
                    <span className="text-white text-xs font-medium">{feature.title}</span>
                </Link>
            ))}
        </div>
    );
}

// Floating action buttons
export function QuickActionsFloat() {
    return (
        <div className="fixed bottom-24 left-4 z-40 flex flex-col gap-2">
            {[
                { href: '/hunt', emoji: '🎯', label: 'Săn' },
                { href: '/adopt', emoji: '🌱', label: 'Nuôi' },
                { href: '/shop/fmcg', emoji: '🌹', label: 'Mua' },
            ].map(action => (
                <motion.div
                    key={action.href}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <Link
                        href={action.href}
                        className="w-12 h-12 bg-stone-800 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-stone-700 transition-colors"
                        title={action.label}
                    >
                        <span className="text-xl">{action.emoji}</span>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}

export default QuickLinks;
