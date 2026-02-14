"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
    ListFilter,
    Search,
    ShoppingBag,
    TrendingUp,
    Store,
    X,
    Sparkles,
    Loader2
} from "lucide-react";

import { FlashSaleBanner } from "@/components/shop/FlashSaleBanner";
import { ProductCard } from "@/components/market/ProductCard";
import { MOCK_MARKET_PRODUCTS } from "@/lib/data/mock-products";
import { useLanguage } from "@/lib/i18n";
import { WOWLanguageToggle } from "@/components/wow/WOWLanguageToggle";

// --- Dynamic Imports for Performance ---
const ParticleBackground = dynamic(() => import("@/components/wow/ParticleBackground").then(mod => mod.ParticleBackground), {
    ssr: false,
});
const TraceabilityVisualizer = dynamic(() => import("@/components/market/TraceabilityVisualizer").then(mod => mod.TraceabilityVisualizer), {
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
});

export default function ShopPage() {
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [sparklePos, setSparklePos] = useState<{ x: number; y: number } | null>(null);
    const { t } = useLanguage();

    // Filter products
    const filteredProducts = MOCK_MARKET_PRODUCTS.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "all" || product.type.toLowerCase().includes(activeFilter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    const handleTrace = (id: string) => {
        setSelectedProduct(id);
    };

    const handleAdd = (id: string, event?: React.MouseEvent) => {
        console.log('Added:', id);
        if (event) {
            setSparklePos({ x: event.clientX, y: event.clientY });
            setTimeout(() => setSparklePos(null), 800);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            {/* Backgrounds */}
            <ParticleBackground variant="firefly" intensity="medium" />
            <div className="fixed inset-0 bg-[url('/assets/grid-pattern.png')] opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-emerald-900/10 via-black to-black pointer-events-none" />
            <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
                <img src="/assets/digital-twins/agrios_market_hyperreal_1765367298057.png" className="w-full h-full object-cover opacity-40" />
            </div>

            {/* Ambient Glow Effects */}
            <div className="fixed inset-0 pointer-events-none z-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] bg-teal-500/5 rounded-full blur-[80px]" />
            </div>

            {/* Sparkle Burst Effect */}
            <AnimatePresence>
                {sparklePos && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute"
                                style={{
                                    left: sparklePos.x,
                                    top: sparklePos.y,
                                }}
                                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                animate={{
                                    opacity: [1, 1, 0],
                                    scale: [0, 1, 0.5],
                                    x: Math.cos((i / 12) * Math.PI * 2) * 60,
                                    y: Math.sin((i / 12) * Math.PI * 2) * 60,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <ShopHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                t={t}
            />

            <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                {/* Flash Sale */}
                <div className="mb-12">
                    <FlashSaleBanner />
                </div>

                {/* Filter Controls */}
                <FilterBar
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    count={filteredProducts.length}
                    t={t}
                />

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onTrace={handleTrace}
                            onAdd={(id) => handleAdd(id)}
                        />
                    ))}
                </div>
            </main>

            {/* Traceability Modal Overlay */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-stone-900 border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <TraceabilityVisualizer
                                productId={selectedProduct}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-Components ---

function ShopHeader({ searchQuery, setSearchQuery, t }: { searchQuery: string, setSearchQuery: (s: string) => void, t: any }) {
    return (
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{
                            filter: ["drop-shadow(0 0 8px rgba(16,185,129,0.5))", "drop-shadow(0 0 16px rgba(16,185,129,0.8))", "drop-shadow(0 0 8px rgba(16,185,129,0.5))"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Store className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                    </motion.div>
                    <h1 className="text-xl font-bold tracking-tight">
                        AGRIOS<span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">.MARKET</span>
                    </h1>
                    <motion.span
                        className="hidden md:inline-flex items-center gap-1 bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded ml-2 font-mono"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t("shop.live_exchange")}
                    </motion.span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative hidden md:block w-64">
                        <input
                            type="text"
                            placeholder={t("shop.search")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-stone-600 font-mono"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    </div>

                    <WOWLanguageToggle />

                    <button className="relative p-2 text-stone-400 hover:text-white transition-colors">
                        <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                        <span className="absolute top-1 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </button>
                </div>
            </div>

            <div className="border-t border-white/5 bg-black/50 py-1 overflow-hidden">
                <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-[10px] font-mono text-stone-400">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {t("shop.ticker.rose")}: 182.5 (+4.2%)</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {t("shop.ticker.lotus")}: 450.0 (+1.8%)</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-500" /> {t("shop.ticker.fertilizer")}: 98.2 (-0.5%)</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {t("shop.ticker.orchid")}: 220.1 (+5.6%)</span>
                    {/* Repeat for seamless loop illusion */}
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {t("shop.ticker.rose")}: 182.5 (+4.2%)</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {t("shop.ticker.lotus")}: 450.0 (+1.8%)</span>
                </div>
            </div>
        </header>
    );
}

function FilterBar({ activeFilter, setActiveFilter, count, t }: { activeFilter: string, setActiveFilter: (f: string) => void, count: number, t: any }) {
    const filterLabels: Record<string, string> = {
        all: t("shop.filter.all"),
        premium: t("shop.filter.premium"),
        organic: t("shop.filter.organic"),
        tet_special: t("shop.filter.tet_special"),
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {['all', 'premium', 'organic', 'tet_special'].map((filter, index) => (
                    <motion.button
                        key={filter}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all duration-300
                                    ${activeFilter === filter
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                                : 'bg-stone-900/80 backdrop-blur text-stone-400 border-stone-700 hover:border-emerald-500/50 hover:text-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`
                        }
                    >
                        {filterLabels[filter]}
                    </motion.button>
                ))}
            </div>

            <div className="flex items-center gap-2 text-stone-500 text-xs font-mono">
                <ListFilter className="w-4 h-4" />
                <span>{t("shop.showing")} {count} {t("shop.assets")}</span>
            </div>
        </div>
    );
}
