"use client";

// ============================================================================
// HUNTER GUIDE - AR NAVIGATION INTERFACE
// ============================================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gift, MapPin, Sparkles, Star, Trophy, Zap,
    ChevronRight, RefreshCw, Crosshair, Navigation, Camera
} from "lucide-react";
import { useGardenRealtime } from "@/hooks/useGardenRealtime";
import { LootBoxGrid, LootBoxAlert } from "@/components/game/LootBox";
import { GlassPanel } from "@/components/ui/glass-panel";
import { NeonButton } from "@/components/ui/neon-button";
import Link from "next/link";
import { AgriosLogo } from "@/components/brand/AgriosLogo";

// HUD COMPONENT
function HUDOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* Corners */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-emerald-500/50 rounded-tl-2xl" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-emerald-500/50 rounded-tr-2xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-emerald-500/50 rounded-bl-2xl" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-emerald-500/50 rounded-br-2xl" />

            {/* Center Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/10 rounded-full flex items-center justify-center">
                <Crosshair className="w-8 h-8 text-emerald-500/30" />
            </div>

            {/* Compass Strip */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 h-8 bg-black/20 backdrop-blur border border-white/10 flex items-center justify-center gap-8 text-[10px] text-emerald-500 font-mono rounded-full">
                <span>NW</span><span>N</span><span className="text-white text-base">●</span><span>NE</span><span>E</span>
            </div>
        </div>
    );
}

// Rarity badge component (Updated)
function RarityBadge({ rarity }: { rarity: string }) {
    const config: Record<string, { bg: string; text: string; icon: string }> = {
        COMMON: { bg: "bg-stone-600/50", text: "text-stone-100", icon: "📦" },
        RARE: { bg: "bg-blue-600/50", text: "text-blue-100", icon: "🎁" },
        EPIC: { bg: "bg-purple-600/50", text: "text-purple-100", icon: "💎" },
        LEGENDARY: { bg: "bg-amber-500/50", text: "text-amber-100", icon: "👑" },
    };

    const c = config[rarity] || config.COMMON;

    return (
        <span className={`${c.bg} ${c.text} border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 backdrop-blur-md`}>
            {c.icon} {rarity}
        </span>
    );
}

// Garden card with inventory (Glassmorphism)
function GardenCard({ garden, inventory }: {
    garden: { id: string; name: string; address?: string; specialties?: string[] };
    inventory: { quantity: number; flower_name: string }[];
}) {
    const totalFlowers = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const isHot = totalFlowers >= 50;

    return (
        <GlassPanel intensity={isHot ? "high" : "low"} className="p-4 relative hover:scale-[1.02] transition-transform duration-300">
            {isHot && (
                <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                </div>
            )}

            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                    <MapPin className={`w-5 h-5 ${isHot ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate pr-4">{garden.name}</h3>
                    <p className="text-stone-400 text-xs flex items-center gap-1 truncate">
                        {garden.address || "Sa Dec Flower Village"}
                    </p>
                </div>
            </div>

            {/* Inventory summary */}
            <div className="mt-3 flex flex-wrap gap-1">
                {inventory.slice(0, 3).map((item, i) => (
                    <span key={i} className="bg-white/5 border border-white/5 text-stone-300 text-[10px] px-2 py-0.5 rounded">
                        {item.flower_name}: <span className="text-white font-bold">{item.quantity}</span>
                    </span>
                ))}
            </div>

            <Link href={`/shop?garden=${garden.id}`} className="mt-3 block">
                <NeonButton variant={isHot ? "primary" : "secondary"} className="w-full h-8 text-xs py-0">
                    WARP TO GARDEN
                </NeonButton>
            </Link>
        </GlassPanel>
    );
}

import { withI18n, WithI18nProps } from "@/lib/withI18n";

// ... (imports)

// HUD and other sub-components remain same

function HuntPage({ texts }: WithI18nProps) {
    const {
        gardens,
        inventory,
        lootBoxes,
        hotGardens,
        loading,
        connected,
        refetch
    } = useGardenRealtime();

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-emerald-500/30">
            {/* --- AR SIMULATION BACKGROUND --- */}
            <div className="fixed inset-0 z-0 opacity-40">
                <img
                    src="/assets/digital-twins/agrios_hunter_hyperreal_1765367337914.png"
                    alt="AR Background"
                    className="w-full h-full object-cover filter brightness-[0.7]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
            </div>

            <HUDOverlay />
            <LootBoxAlert />

            {/* --- HEADER --- */}
            <div className="relative z-20 container mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <AgriosLogo className="w-8 h-8" />
                        <div>
                            <h1 className="text-xl font-black tracking-tighter leading-none">
                                {texts["title"].split('_')[0]}<span className="text-emerald-500">_{texts["title"].split('_')[1]}</span>
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                {connected ? texts["gps.locked"] : texts["gps.searching"]}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="bg-black/40 backdrop-blur border border-white/10 rounded-full p-2 hover:bg-emerald-500/20 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                    </button>
                </div>

                {/* --- STATS HUD --- */}
                <div className="grid grid-cols-4 gap-2 mb-8">
                    <GlassPanel className="p-2 flex flex-col items-center justify-center text-center" intensity="low">
                        <Gift className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-lg font-bold leading-none">{lootBoxes.length}</span>
                        <span className="text-[8px] text-stone-500 uppercase tracking-widest mt-1">{texts["stats.loot"]}</span>
                    </GlassPanel>
                    <GlassPanel className="p-2 flex flex-col items-center justify-center text-center" intensity="low">
                        <Star className="w-5 h-5 text-purple-400 mb-1" />
                        <span className="text-lg font-bold leading-none">
                            {lootBoxes.filter(l => ['RARE', 'EPIC', 'LEGENDARY'].includes(l.rarity)).length}
                        </span>
                        <span className="text-[8px] text-stone-500 uppercase tracking-widest mt-1">{texts["stats.epic"]}</span>
                    </GlassPanel>
                    <GlassPanel className="p-2 flex flex-col items-center justify-center text-center" intensity="low">
                        <Zap className="w-5 h-5 text-emerald-400 mb-1" />
                        <span className="text-lg font-bold leading-none">{hotGardens.length}</span>
                        <span className="text-[8px] text-stone-500 uppercase tracking-widest mt-1">{texts["stats.zones"]}</span>
                    </GlassPanel>
                    <GlassPanel className="p-2 flex flex-col items-center justify-center text-center" intensity="low">
                        <MapPin className="w-5 h-5 text-blue-400 mb-1" />
                        <span className="text-lg font-bold leading-none">{gardens.length}</span>
                        <span className="text-[8px] text-stone-500 uppercase tracking-widest mt-1">{texts["stats.nodes"]}</span>
                    </GlassPanel>
                </div>
            </div>

            {/* --- MAIN CONTENT SCROLL --- */}
            <div className="relative z-20 px-4 pb-24 space-y-8">

                {/* Loot Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Navigation className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500">{texts["headings.anomalies"]}</h2>
                    </div>
                    {/* Wrapped LootBoxGrid */}
                    <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 p-2">
                        <LootBoxGrid userId={undefined} />
                    </div>
                </div>

                {/* Hot Gardens */}
                {hotGardens.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500">{texts["headings.hotspots"]}</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {hotGardens.map(garden => {
                                const gardenInventory = inventory.filter(i => i.garden_id === garden.id);
                                return (
                                    <GardenCard
                                        key={garden.id}
                                        garden={garden}
                                        inventory={gardenInventory}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Gardens List */}
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                        {texts["headings.all_targets"]} ({gardens.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-emerald-500 mt-2 font-mono">{texts["status.scanning"]}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {gardens.map(garden => {
                                const gardenInventory = inventory.filter(i => i.garden_id === garden.id);
                                return (
                                    <GardenCard
                                        key={garden.id}
                                        garden={garden}
                                        inventory={gardenInventory}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* --- FLOATING ACTION BUTTON --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <Link href="/qr">
                    <button className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] border-4 border-black/50 hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-black" />
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default withI18n(HuntPage, "hunt");
