"use client";

// ============================================================================
// VALUE CHAIN BENTO GRID - Extracted from LandingPageClient
// ============================================================================

import { Leaf, Layers, TrendingUp, Activity, QrCode, Dna, Globe } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { StreamingChart, DnaSpinner } from "@/components/ui/animated-charts";
import { CreditScoreVisual, InventoryVisual, LogisticsMapVisual } from "@/components/ui/node-visuals";

type Role = "farmer" | "buyer" | "bank" | "supplier" | "logistics" | "research" | "government" | "media";

interface ValueChainGridProps {
    onOpenWizard: (role: Role) => void;
}

// Node configurations for cleaner code
const NODES = [
    {
        id: "bank",
        title: "NGÂN HÀNG (FINTECH)",
        description: "Tín Dụng Xanh",
        detail: "Risk assessment based on IoT sensor data.",
        Visual: CreditScoreVisual,
        Icon: TrendingUp,
        colSpan: 1,
        highlight: false,
    },
    {
        id: "supplier",
        title: "NHÀ CUNG CẤP (SUPPLIERS)",
        description: "Marketplace Vật Tư",
        detail: "Real-time inventory & price matching.",
        Visual: InventoryVisual,
        Icon: Layers,
        colSpan: 1,
        highlight: false,
    },
    {
        id: "farmer",
        title: "🌱 NHÀ VƯỜN (FARMERS) ★",
        description: "Bán Hoa Trực Tiếp",
        detail: "Không cần lo marketing, vận chuyển, thu tiền.",
        Visual: StreamingChart,
        Icon: Leaf,
        colSpan: 2,
        highlight: true,
    },
    {
        id: "logistics",
        title: "VẬN CHUYỂN (LOGISTICS)",
        description: "Chuỗi Cung Ứng Lạnh",
        detail: "Temperature/Humidity tracking.",
        Visual: LogisticsMapVisual,
        Icon: Activity,
        colSpan: 2,
        highlight: false,
    },
    {
        id: "buyer",
        title: "NGƯỜI DÙNG (BUYERS)",
        description: "Mua Hoa Tận Gốc",
        detail: "Giá tốt nhất, ship tận nhà.",
        Visual: () => <Globe className="w-10 h-10 text-emerald-500/50" />,
        Icon: QrCode,
        colSpan: 1,
        highlight: false,
    },
    {
        id: "research",
        title: "R&D / GENETICS",
        description: "Công Nghệ Giống",
        detail: "R&D Pipeline & IP Registry [Coming Soon]",
        Visual: DnaSpinner,
        Icon: Dna,
        colSpan: 1,
        highlight: false,
    },
] as const;

export function ValueChainGrid({ onOpenWizard }: ValueChainGridProps) {
    return (
        <div className="mt-20">
            {/* Header */}
            <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase mb-2">
                        HỆ SINH THÁI 5-NODE
                    </h2>
                    <h3 className="text-2xl font-light text-white tracking-wide">
                        Chuỗi Giá Trị{" "}
                        <span className="font-mono text-emerald-400 font-bold">HOÀN CHỈNH</span>
                    </h3>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-[10px] text-stone-500 font-mono">ĐỘ BAO PHỦ</div>
                    <div className="text-xl text-white font-mono">5 NODES</div>
                </div>
            </div>

            {/* Grid */}
            <BentoGrid className="max-w-7xl mx-auto">
                {NODES.map((node) => {
                    const Visual = node.Visual;
                    const Icon = node.Icon;

                    return (
                        <BentoGridItem
                            key={node.id}
                            title={node.title}
                            description={
                                <span className="text-[11px]">
                                    Feature: <b>{node.description}</b>
                                    <br />
                                    <span className="text-stone-500">{node.detail}</span>
                                </span>
                            }
                            header={
                                <div className={`h-full min-h-[9rem] w-full border border-emerald-500/10 bg-black/40 ${node.id === 'buyer' ? 'flex items-center justify-center' : ''}`}>
                                    <Visual />
                                </div>
                            }
                            icon={<Icon className="h-4 w-4 text-emerald-400" />}
                            className={`md:col-span-${node.colSpan} ${node.highlight
                                    ? "bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500"
                                    : "bg-black/60 border-emerald-500/20 hover:border-emerald-500/50"
                                } rounded-sm cursor-pointer transition-colors`}
                            onClick={() => onOpenWizard(node.id as Role)}
                        />
                    );
                })}
            </BentoGrid>
        </div>
    );
}
