"use client";

// ============================================================================
// LOOT BOX COMPONENT
// ============================================================================
// Displays loot boxes spawned by Garden OS inventory updates
// ============================================================================

import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Clock, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useGardenRealtime } from "@/hooks/useGardenRealtime";

interface LootBoxProps {
    lootBox: {
        id: string;
        garden_id: string;
        rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
        reward_type: string;
        reward_value: string;
        expires_at: string;
    };
    gardenName?: string;
    onClaim?: (lootBoxId: string) => void;
}

// Rarity colors
const RARITY_CONFIG = {
    COMMON: {
        bg: 'from-stone-400 to-stone-600',
        border: 'border-stone-400',
        glow: 'shadow-stone-400/50',
        label: 'Thường',
        icon: '📦'
    },
    RARE: {
        bg: 'from-blue-400 to-blue-600',
        border: 'border-blue-400',
        glow: 'shadow-blue-400/50',
        label: 'Hiếm',
        icon: '🎁'
    },
    EPIC: {
        bg: 'from-purple-400 to-purple-600',
        border: 'border-purple-400',
        glow: 'shadow-purple-400/50',
        label: 'Sử Thi',
        icon: '💎'
    },
    LEGENDARY: {
        bg: 'from-amber-400 via-orange-500 to-red-500',
        border: 'border-amber-400',
        glow: 'shadow-amber-400/50',
        label: 'Huyền Thoại',
        icon: '👑'
    }
};

// Single Loot Box Card (Updated with Glassmorphism)
export function LootBoxCard({ lootBox, gardenName, onClaim }: LootBoxProps) {
    const [claiming, setClaiming] = useState(false);
    const config = RARITY_CONFIG[lootBox.rarity];

    // Time remaining
    const expiresAt = new Date(lootBox.expires_at);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

    const handleClaim = async () => {
        setClaiming(true);
        if (onClaim) {
            await onClaim(lootBox.id);
        }
        setClaiming(false);
    };

    return (
        <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`
        relative overflow-hidden rounded-2xl p-0.5 shadow-2xl ${config.glow}
      `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-20`} />
            <div className={`absolute inset-0 border-2 ${config.border} rounded-2xl opacity-50`} />

            {/* Sparkle effect for rare+ */}
            {lootBox.rarity !== 'COMMON' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            initial={{
                                x: `${Math.random() * 100}%`,
                                y: `${Math.random() * 100}%`,
                                opacity: 0
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.4
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-xl p-4 h-full flex flex-col justify-between">
                <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{config.icon}</span>
                            <div>
                                <div className={`text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${config.bg} bg-clip-text text-transparent`}>
                                    {config.label}
                                </div>
                                <div className="text-white font-bold text-sm tracking-tight">{lootBox.reward_value}</div>
                            </div>
                        </div>
                    </div>

                    {/* Garden source */}
                    {gardenName && (
                        <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-4 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span>{gardenName}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {/* Timer */}
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> EXPIRES IN</span>
                        <span className="text-white">{hoursLeft}H</span>
                    </div>

                    {/* Claim button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={claiming}
                        onClick={handleClaim}
                        className={`
                w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest
                bg-gradient-to-r ${config.bg} text-white
                hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-shadow
                disabled:opacity-50 disabled:cursor-not-allowed
                relative overflow-hidden
            `}
                    >
                        {/* Button Scanline */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />

                        {claiming ? (
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="inline-block"
                            >
                                ⏳
                            </motion.span>
                        ) : (
                            <span className="flex items-center justify-center gap-2 relative z-10">
                                <Sparkles className="w-4 h-4" />
                                CLAIM REWARD
                            </span>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

// Loot Box List/Grid
export function LootBoxGrid({ userId }: { userId?: string }) {
    const { lootBoxes, gardens, claimLootBox, loading, connected } = useGardenRealtime();

    const handleClaim = async (lootBoxId: string) => {
        if (!userId) {
            // Redirect to login
            window.location.href = '/login?redirect=hunt';
            return;
        }
        await claimLootBox(lootBoxId, userId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connection status */}
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-stone-500 text-sm">
                    {connected ? 'Đang theo dõi hộp quà mới' : 'Đang kết nối...'}
                </span>
            </div>

            {/* Loot boxes */}
            {lootBoxes.length === 0 ? (
                <div className="text-center py-12 bg-stone-900/50 rounded-2xl border border-stone-800">
                    <Gift className="w-12 h-12 mx-auto text-stone-600 mb-4" />
                    <p className="text-stone-400">Chưa có hộp quà nào</p>
                    <p className="text-stone-500 text-sm mt-1">
                        Khi nhà vườn cập nhật kho hoa &gt;50 chậu, hộp quà sẽ xuất hiện!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {lootBoxes.map(loot => {
                            const garden = gardens.find(g => g.id === loot.garden_id);
                            return (
                                <LootBoxCard
                                    key={loot.id}
                                    lootBox={loot}
                                    gardenName={garden?.name}
                                    onClaim={handleClaim}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Stats */}
            {lootBoxes.length > 0 && (
                <div className="flex items-center justify-center gap-6 text-stone-500 text-sm">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span>{lootBoxes.filter(l => l.rarity !== 'COMMON').length} hiếm</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4 text-emerald-400" />
                        <span>{lootBoxes.length} tổng</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Floating Loot Box Alert (for bottom of screen)
export function LootBoxAlert() {
    const { lootBoxes } = useGardenRealtime();
    const recentLoot = lootBoxes.filter(l => {
        const spawned = new Date(l.spawned_at);
        const now = new Date();
        return (now.getTime() - spawned.getTime()) < 60000; // Last 1 minute
    });

    if (recentLoot.length === 0) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50"
        >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <motion.span
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-3xl"
                    >
                        🎁
                    </motion.span>
                    <div>
                        <div className="text-white font-bold">Hộp quà mới xuất hiện!</div>
                        <div className="text-white/80 text-sm">{recentLoot.length} hộp đang chờ bạn</div>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/hunt'}
                    className="bg-white text-orange-600 font-bold px-4 py-2 rounded-lg"
                >
                    Săn ngay
                </motion.button>
            </div>
        </motion.div>
    );
}

export default LootBoxGrid;
