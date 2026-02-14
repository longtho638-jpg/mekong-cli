"use client";

// ============================================================================
// HOT GARDEN MAP MARKERS
// ============================================================================
// Real-time inventory heatmap showing gardens with high stock
// Integrates with Garden OS data via useGardenRealtime hook
// ============================================================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Flower2, TrendingUp, Clock, Star,
    ChevronRight, Navigation, Zap, Package
} from "lucide-react";
import { useGardenRealtime } from "@/hooks/useGardenRealtime";
import Link from "next/link";

// Garden with inventory summary
interface GardenWithInventory {
    id: string;
    name: string;
    address?: string;
    ward?: string;
    latitude?: number;
    longitude?: number;
    status: string;
    rating?: number;
    specialties?: string[];
    totalFlowers: number;
    topFlowers: { name: string; quantity: number; price: number }[];
    hasLootBox: boolean;
    heatLevel: 'COLD' | 'WARM' | 'HOT' | 'FIRE';
}

// Heat level config
const HEAT_CONFIG = {
    COLD: {
        color: 'bg-stone-500',
        border: 'border-stone-400',
        text: 'text-stone-300',
        label: 'Ổn định',
        icon: '🌸'
    },
    WARM: {
        color: 'bg-emerald-500',
        border: 'border-emerald-400',
        text: 'text-emerald-300',
        label: 'Có hàng',
        icon: '🌻'
    },
    HOT: {
        color: 'bg-amber-500',
        border: 'border-amber-400',
        text: 'text-amber-300',
        label: 'Hàng nhiều',
        icon: '🔥'
    },
    FIRE: {
        color: 'bg-red-500',
        border: 'border-red-400',
        text: 'text-red-300',
        label: 'Siêu hot!',
        icon: '💥'
    }
};

// Single garden marker
function GardenMarker({
    garden,
    isSelected,
    onClick
}: {
    garden: GardenWithInventory;
    isSelected: boolean;
    onClick: () => void;
}) {
    const heat = HEAT_CONFIG[garden.heatLevel];

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
        relative flex items-center justify-center
        w-12 h-12 rounded-full ${heat.color}
        border-2 ${heat.border} shadow-lg
        transition-all duration-300
        ${isSelected ? 'ring-4 ring-white/50' : ''}
      `}
        >
            <span className="text-xl">{heat.icon}</span>

            {/* Quantity badge */}
            <div className="absolute -top-1 -right-1 bg-white text-stone-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {garden.totalFlowers > 99 ? '99+' : garden.totalFlowers}
            </div>

            {/* Loot box indicator */}
            {garden.hasLootBox && (
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-800 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                >
                    🎁
                </motion.div>
            )}

            {/* Pulse animation for hot gardens */}
            {(garden.heatLevel === 'HOT' || garden.heatLevel === 'FIRE') && (
                <motion.div
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full ${heat.color}`}
                />
            )}
        </motion.button>
    );
}

// Garden detail popup
function GardenDetail({ garden, onClose }: { garden: GardenWithInventory; onClose: () => void }) {
    const heat = HEAT_CONFIG[garden.heatLevel];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-stone-900 border border-stone-700 rounded-2xl p-4 shadow-2xl max-w-sm w-full"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`${heat.color} text-white px-2 py-0.5 rounded-full text-xs font-bold`}>
                            {heat.icon} {heat.label}
                        </span>
                        {garden.hasLootBox && (
                            <span className="bg-amber-500 text-stone-900 px-2 py-0.5 rounded-full text-xs font-bold">
                                🎁 Có quà
                            </span>
                        )}
                    </div>
                    <h3 className="text-white font-bold text-lg mt-2">{garden.name}</h3>
                    {garden.address && (
                        <p className="text-stone-400 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {garden.address}
                        </p>
                    )}
                </div>
                <button onClick={onClose} className="text-stone-500 hover:text-white">✕</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-stone-800 rounded-lg p-2 text-center">
                    <Package className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className="text-white font-bold">{garden.totalFlowers}</div>
                    <div className="text-stone-500 text-xs">Tổng kho</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-2 text-center">
                    <Flower2 className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                    <div className="text-white font-bold">{garden.topFlowers.length}</div>
                    <div className="text-stone-500 text-xs">Loại hoa</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-2 text-center">
                    <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-white font-bold">{garden.rating || '5.0'}</div>
                    <div className="text-stone-500 text-xs">Đánh giá</div>
                </div>
            </div>

            {/* Inventory preview */}
            <div className="mb-4">
                <h4 className="text-stone-400 text-sm mb-2">Hoa đang có:</h4>
                <div className="space-y-2">
                    {garden.topFlowers.slice(0, 3).map((flower, i) => (
                        <div key={i} className="flex items-center justify-between bg-stone-800/50 rounded-lg px-3 py-2">
                            <span className="text-white text-sm">{flower.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400 text-sm font-bold">{flower.quantity} chậu</span>
                                <span className="text-stone-500 text-xs">{(flower.price / 1000).toFixed(0)}k</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Specialties */}
            {garden.specialties && garden.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {garden.specialties.map((specialty, i) => (
                        <span key={i} className="bg-emerald-900/50 text-emerald-300 text-xs px-2 py-1 rounded-full">
                            {specialty}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Link
                    href={`/shop?garden=${garden.id}`}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-colors"
                >
                    <Flower2 className="w-4 h-4" /> Xem hoa
                </Link>
                {garden.latitude && garden.longitude && (
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${garden.latitude},${garden.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-stone-700 hover:bg-stone-600 text-white p-3 rounded-xl transition-colors"
                    >
                        <Navigation className="w-5 h-5" />
                    </a>
                )}
            </div>
        </motion.div>
    );
}

// Heatmap legend
function HeatmapLegend() {
    return (
        <div className="bg-stone-900/90 backdrop-blur-sm rounded-xl p-3 border border-stone-700">
            <h4 className="text-stone-400 text-xs mb-2 font-medium">Mức độ tồn kho:</h4>
            <div className="flex flex-wrap gap-2">
                {Object.entries(HEAT_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${config.color}`} />
                        <span className="text-stone-400 text-xs">{config.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main component
export function HotGardenMarkers() {
    const { gardens, inventory, lootBoxes, loading, connected } = useGardenRealtime();
    const [selectedGarden, setSelectedGarden] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'HOT' | 'LOOT'>('ALL');

    // Process gardens with inventory data
    const gardensWithInventory = useMemo((): GardenWithInventory[] => {
        return gardens.map(garden => {
            const gardenInventory = inventory.filter(i => i.garden_id === garden.id);
            const totalFlowers = gardenInventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
            const hasLootBox = lootBoxes.some(l => l.garden_id === garden.id);

            // Calculate heat level
            let heatLevel: GardenWithInventory['heatLevel'];
            if (totalFlowers >= 100) heatLevel = 'FIRE';
            else if (totalFlowers >= 75) heatLevel = 'HOT';
            else if (totalFlowers >= 50) heatLevel = 'WARM';
            else heatLevel = 'COLD';

            // Get top flowers
            const topFlowers = gardenInventory
                .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
                .slice(0, 5)
                .map(i => ({
                    name: i.flower_name || i.flower_type,
                    quantity: i.quantity,
                    price: i.unit_price || 100000
                }));

            return {
                id: garden.id,
                name: garden.name,
                address: (garden as any).address,
                ward: (garden as any).ward,
                latitude: (garden as any).latitude,
                longitude: (garden as any).longitude,
                status: garden.status,
                rating: garden.rating,
                specialties: garden.specialties,
                totalFlowers,
                topFlowers,
                hasLootBox,
                heatLevel
            };
        });
    }, [gardens, inventory, lootBoxes]);

    // Filter gardens
    const filteredGardens = useMemo(() => {
        return gardensWithInventory.filter(g => {
            if (filter === 'HOT') return g.heatLevel === 'HOT' || g.heatLevel === 'FIRE';
            if (filter === 'LOOT') return g.hasLootBox;
            return true;
        });
    }, [gardensWithInventory, filter]);

    // Selected garden detail
    const selectedGardenData = selectedGarden
        ? gardensWithInventory.find(g => g.id === selectedGarden)
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className={`w-5 h-5 ${connected ? 'text-emerald-400' : 'text-stone-500'}`} />
                    <span className="text-white font-bold">Bản đồ vườn hoa</span>
                    <span className="text-stone-500 text-sm">({filteredGardens.length} vườn)</span>
                </div>

                {/* Filters */}
                <div className="flex gap-1">
                    {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'HOT', label: '🔥 Hot' },
                        { key: 'LOOT', label: '🎁 Có quà' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as typeof filter)}
                            className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === key
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }
              `}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map placeholder with markers */}
            <div className="relative bg-stone-900 rounded-2xl border border-stone-700 p-4 min-h-[300px] overflow-hidden">
                {/* Simulated map background */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }} />

                {/* Legend */}
                <div className="absolute top-3 left-3 z-10">
                    <HeatmapLegend />
                </div>

                {/* Markers grid (simulated positioning) */}
                <div className="relative z-10 grid grid-cols-3 md:grid-cols-4 gap-4 py-16 px-8">
                    {filteredGardens.map((garden, i) => (
                        <div
                            key={garden.id}
                            className="flex justify-center"
                            style={{
                                transform: `translate(${(i % 3) * 10 - 10}px, ${Math.sin(i) * 20}px)`
                            }}
                        >
                            <GardenMarker
                                garden={garden}
                                isSelected={selectedGarden === garden.id}
                                onClick={() => setSelectedGarden(garden.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Selected garden popup */}
                <AnimatePresence>
                    {selectedGardenData && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <GardenDetail
                                garden={selectedGardenData}
                                onClose={() => setSelectedGarden(null)}
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* Empty state */}
                {filteredGardens.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <MapPin className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                            <p className="text-stone-400">Không có vườn nào</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Garden list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGardens.slice(0, 6).map(garden => {
                    const heat = HEAT_CONFIG[garden.heatLevel];
                    return (
                        <button
                            key={garden.id}
                            onClick={() => setSelectedGarden(garden.id)}
                            className="bg-stone-900/50 border border-stone-800 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${heat.color} flex items-center justify-center text-lg`}>
                                        {heat.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{garden.name}</h4>
                                        <p className="text-stone-500 text-sm">{garden.totalFlowers} chậu</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-stone-500" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default HotGardenMarkers;
