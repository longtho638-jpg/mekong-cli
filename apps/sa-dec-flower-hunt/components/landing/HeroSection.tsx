"use client";

// ============================================================================
// HERO SECTION - Extracted from LandingPageClient
// ============================================================================

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlitchButton } from "@/components/ui/glitch-button";
import { StakeholderSelector } from "@/components/marketing/StakeholderSelector";
import { StreamingChart } from "@/components/ui/animated-charts";

type Role = "farmer" | "buyer" | "bank" | "supplier" | "logistics" | "research" | "government" | "media";

interface HeroSectionProps {
    onOpenWizard: (role?: Role) => void;
}

export function HeroSection({ onOpenWizard }: HeroSectionProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-32">
            {/* Left: Text content */}
            <div className="flex flex-col text-left relative z-20">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-3 mb-6"
                >
                    <div className="h-[1px] w-8 bg-emerald-500/50" />
                    <span className="text-[10px] font-mono text-emerald-400 tracking-[0.3em] uppercase">
                        🌱 Dành cho Nhà Vườn Sa Đéc
                    </span>
                </motion.div>

                {/* Headlines */}
                <div className="mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
                        Bán Hoa{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                            Không Cần Lo
                        </span>
                    </h1>
                    <p className="text-stone-400 text-lg mb-2">
                        Chúng tôi lo <strong className="text-white">marketing</strong>,{" "}
                        <strong className="text-white">vận chuyển</strong>,{" "}
                        <strong className="text-white">thu tiền</strong>.
                    </p>
                    <p className="text-stone-500 text-sm">Bạn chỉ cần chăm sóc vườn hoa.</p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <GlitchButton
                        text="ĐĂNG KÝ BÁN HOA"
                        onClick={() => onOpenWizard("farmer")}
                        className="w-56 bg-emerald-600 hover:bg-emerald-500 font-mono text-xs tracking-widest"
                    />
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => onOpenWizard("buyer")}
                        className="text-stone-400 hover:text-white hover:bg-white/5 border border-stone-800 px-6 rounded-none font-mono text-xs tracking-widest"
                    >
                        <ShoppingBag className="mr-2 w-4 h-4" />
                        Tôi muốn MUA HOA
                    </Button>
                </div>

                {/* Stakeholder selector */}
                <StakeholderSelector onSelect={(role) => onOpenWizard(role as Role)} />

                {/* Social proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 flex items-center gap-4 text-[10px] text-stone-600 font-mono"
                >
                    <div className="flex -space-x-2">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-[8px]"
                            >
                                🌸
                            </div>
                        ))}
                    </div>
                    <span>47+ nhà vườn đã đăng ký</span>
                </motion.div>
            </div>

            {/* Right: Data visualization */}
            <DataVisualization />
        </div>
    );
}

// Data visualization orb
function DataVisualization() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block h-[500px] w-full"
        >
            <div className="absolute inset-0 bg-black/60 rounded-sm border border-emerald-500/20 backdrop-blur-sm overflow-hidden group">
                {/* Scan line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan" />

                {/* Spinning rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/10 rounded-full animate-[spin_60s_linear_infinite]">
                    <div className="w-full h-full border-t border-emerald-500/30 rounded-full" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-emerald-500/10 rounded-full animate-[spin_40s_linear_infinite_reverse]">
                    <div className="w-full h-full border-b border-emerald-500/30 rounded-full" />
                </div>

                {/* Center stats */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
                    <div className="text-4xl font-mono font-bold text-white tracking-tighter">1,402</div>
                    <div className="text-[9px] text-emerald-500 uppercase tracking-widest font-mono">Active Nodes</div>
                </div>

                {/* Floating card */}
                <div className="absolute top-10 right-10 bg-black/80 border border-emerald-500/30 p-3 w-40">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[9px] text-stone-500 uppercase">YIELD</div>
                        <div className="text-[9px] text-emerald-400">▲ 24%</div>
                    </div>
                    <div className="h-10 w-full bg-emerald-900/20 relative overflow-hidden">
                        <StreamingChart />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
