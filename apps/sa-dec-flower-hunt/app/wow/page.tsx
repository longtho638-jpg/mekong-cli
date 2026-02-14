"use client";

// ============================================================================
// WOW DEMO PAGE - Showcase of Premium Visual Effects
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AgriosLogo } from "@/components/brand/AgriosLogo";
import { NeonButton } from "@/components/ui/neon-button";
import { Sparkles, ArrowRight, Moon, Flower2, Zap, CreditCard, PartyPopper, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";

// --- Dynamic Imports for Performance (Lazy Loading) ---
const FireflyGarden = dynamic(() => import("@/components/wow/FireflyGarden").then(mod => mod.FireflyGarden), {
    loading: () => <LoadingPlaceholder />,
    ssr: false // Client-side visual effects often don't need SSR
});
const HoloProductCard = dynamic(() => import("@/components/wow/HoloCard").then(mod => mod.HoloProductCard), {
    loading: () => <div className="h-[400px] w-full bg-stone-900/50 rounded-3xl animate-pulse" />
});
const TetCountdown = dynamic(() => import("@/components/wow/TetCountdown").then(mod => mod.TetCountdown), {
    loading: () => <LoadingPlaceholder />
});
const BloomGarden = dynamic(() => import("@/components/wow/BloomFlower").then(mod => mod.BloomGarden), {
    loading: () => <LoadingPlaceholder />,
    ssr: false
});
const ChartsDashboard = dynamic(() => import("@/components/wow/AnimatedCharts").then(mod => mod.ChartsDashboard), {
    loading: () => <LoadingPlaceholder />
});

// --- Constants ---
const DEMO_PRODUCTS = [
    {
        image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop",
        title: "Mai Vàng Bonsai",
        price: "2,500,000₫",
        originalPrice: "3,200,000₫",
        badge: "HOT",
        rating: 5,
    },
    {
        image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&h=400&fit=crop",
        title: "Hoa Hồng Ecuador",
        price: "450,000₫",
        rating: 4,
    },
    {
        image: "https://images.unsplash.com/photo-1518882605630-8eb5f838bc11?w=400&h=400&fit=crop",
        title: "Lan Hồ Điệp Trắng",
        price: "1,200,000₫",
        originalPrice: "1,500,000₫",
        badge: "SALE",
        rating: 5,
    },
];

type SectionType = "firefly" | "holo" | "tet" | "bloom" | "charts";

const SECTIONS: { id: SectionType; label: string; icon: React.ReactNode }[] = [
    { id: "firefly", label: "Firefly Garden", icon: <Moon className="w-4 h-4" /> },
    { id: "holo", label: "Holo Cards", icon: <CreditCard className="w-4 h-4" /> },
    { id: "tet", label: "Tết Countdown", icon: <PartyPopper className="w-4 h-4" /> },
    { id: "bloom", label: "Bloom Flowers", icon: <Flower2 className="w-4 h-4" /> },
    { id: "charts", label: "Animated Charts", icon: <BarChart3 className="w-4 h-4" /> },
];

// --- Main Page Component ---
export default function WowDemoPage() {
    const [activeSection, setActiveSection] = useState<SectionType>("firefly");

    return (
        <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
            {/* Background: Context-aware */}
            {activeSection !== "firefly" && (
                <div className="fixed inset-0 z-0 bg-gradient-to-b from-stone-950 via-black to-stone-950" />
            )}

            {/* Content Overlay */}
            <div className="relative z-10">
                <Header />
                <Navigation activeSection={activeSection} onSelect={setActiveSection} />

                {/* Render Active Section */}
                <div className="min-h-[80vh]">
                    {activeSection === "firefly" && <FireflySection />}
                    {activeSection === "holo" && <HoloSection />}
                    {activeSection === "tet" && <TetSection />}
                    {activeSection === "bloom" && <BloomSection />}
                    {activeSection === "charts" && <ChartsSection />}
                </div>

                <Footer activeSection={activeSection} />
            </div>
        </div>
    );
}

// --- Sub-Components (Extracted for Readability) ---

function LoadingPlaceholder() {
    return (
        <div className="flex items-center justify-center w-full h-[400px]">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
    );
}

function Header() {
    return (
        <header className="p-6 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-md z-50">
            <Link href="/" className="flex items-center gap-3 group">
                <AgriosLogo className="w-8 h-8" />
                <span className="text-lg font-bold tracking-tight group-hover:text-emerald-400 transition-colors">
                    AGRIOS<span className="text-emerald-500">.tech</span>
                </span>
            </Link>

            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400">WOW_MODE</span>
            </div>
        </header>
    );
}

function Navigation({ activeSection, onSelect }: { activeSection: SectionType; onSelect: (s: SectionType) => void }) {
    return (
        <div className="flex justify-center gap-2 md:gap-4 py-4 px-4 overflow-x-auto">
            {SECTIONS.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onSelect(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${activeSection === section.id
                        ? "bg-emerald-500 text-black"
                        : "bg-stone-800 text-white hover:bg-stone-700"
                        }`}
                >
                    {section.icon}
                    <span className="hidden md:inline">{section.label}</span>
                </button>
            ))}
        </div>
    );
}

function FireflySection() {
    const [fireflyCount, setFireflyCount] = useState(50);
    const [showFlowers, setShowFlowers] = useState(true);
    const [interactive, setInteractive] = useState(true);

    return (
        <>
            {/* Background specific to Firefly section */}
            <div className="fixed inset-0 z-0">
                <FireflyGarden
                    fireflyCount={fireflyCount}
                    showFlowers={showFlowers}
                    interactive={interactive}
                />
            </div>

            <main className="min-h-[80vh] flex items-center justify-center px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-sm mb-8 backdrop-blur-sm"
                    >
                        <Moon className="w-4 h-4" />
                        <span>Đêm Hoa Đăng Sa Đéc</span>
                        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">
                            Khu Vườn
                        </span>
                        <br />
                        <span className="text-white">Đom Đóm</span>
                    </h1>

                    <p className="text-xl text-stone-300 mb-12 max-w-2xl mx-auto">
                        Di chuyển chuột để tương tác với đom đóm.
                        <br />
                        <span className="text-emerald-400">Trải nghiệm không gian ảo diệu làng hoa Sa Đéc.</span>
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mb-16">
                        <Link href="/hunt">
                            <NeonButton variant="primary" className="group">
                                <Zap className="w-4 h-4 mr-2" />
                                Bắt Đầu Săn Hoa
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </NeonButton>
                        </Link>
                        <Link href="/shop">
                            <NeonButton variant="outline" className="group">
                                <Flower2 className="w-4 h-4 mr-2" />
                                Mua Hoa Ngay
                            </NeonButton>
                        </Link>
                    </div>

                    {/* Controls Panel */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md mx-auto"
                    >
                        <h3 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-4">
                            ⚙️ Điều Khiển
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-stone-400">Số đom đóm</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setFireflyCount(Math.max(10, fireflyCount - 20))} className="w-8 h-8 bg-stone-800 hover:bg-stone-700 rounded-lg text-white transition-colors">-</button>
                                    <span className="w-12 text-center font-mono text-emerald-400">{fireflyCount}</span>
                                    <button onClick={() => setFireflyCount(Math.min(200, fireflyCount + 20))} className="w-8 h-8 bg-stone-800 hover:bg-stone-700 rounded-lg text-white transition-colors">+</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-stone-400">Hiện hoa</span>
                                <button onClick={() => setShowFlowers(!showFlowers)} className={`w-12 h-6 rounded-full transition-colors ${showFlowers ? 'bg-emerald-500' : 'bg-stone-700'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${showFlowers ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-stone-400">Tương tác chuột</span>
                                <button onClick={() => setInteractive(!interactive)} className={`w-12 h-6 rounded-full transition-colors ${interactive ? 'bg-emerald-500' : 'bg-stone-700'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${interactive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </>
    );
}

function HoloSection() {
    return (
        <main className="min-h-[80vh] px-6 py-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <motion.div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full text-sm mb-6">
                        <CreditCard className="w-4 h-4" />
                        <span>Holographic Effect</span>
                        <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>💎</motion.span>
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">Holo Cards</span>
                    </h1>
                    <p className="text-xl text-stone-300 max-w-2xl mx-auto">
                        Di chuyển chuột trên thẻ để xem hiệu ứng holographic.
                        <br /><span className="text-purple-400">Rainbow shimmer + 3D tilt + Glitter particles</span>
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {DEMO_PRODUCTS.map((product, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <HoloProductCard {...product} />
                        </motion.div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <Link href="/shop">
                        <NeonButton variant="primary" className="group">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Xem Tất Cả Sản Phẩm
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </NeonButton>
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}

function TetSection() {
    return (
        <main className="min-h-[80vh] px-6 py-12 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full">
                <TetCountdown />
            </motion.div>
        </main>
    );
}

function BloomSection() {
    return (
        <main className="min-h-[80vh] px-6 py-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <motion.div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 px-4 py-2 rounded-full text-sm mb-6">
                        <Flower2 className="w-4 h-4" />
                        <span>Interactive Bloom</span>
                        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>🌸</motion.span>
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400">Bloom Garden</span>
                    </h1>
                    <p className="text-xl text-stone-300 max-w-2xl mx-auto">
                        Hover over flowers to make them bloom
                        <br /><span className="text-pink-400">Rose • Lotus • Sakura • Sunflower</span>
                    </p>
                </div>
                <div className="h-[500px] rounded-3xl overflow-hidden border border-stone-800">
                    <BloomGarden />
                </div>
            </motion.div>
        </main>
    );
}

function ChartsSection() {
    return (
        <main className="min-h-[80vh] px-6 py-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <motion.div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-full text-sm mb-6">
                        <BarChart3 className="w-4 h-4" />
                        <span>Data Visualization</span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>📊</motion.span>
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">Animated Charts</span>
                    </h1>
                    <p className="text-xl text-stone-300 max-w-2xl mx-auto">
                        Spring-animated numbers and progress indicators
                        <br /><span className="text-blue-400">Stat Cards • Bar Charts • Progress Rings</span>
                    </p>
                </div>
                <div className="rounded-3xl overflow-hidden border border-stone-800 bg-stone-950/50 backdrop-blur-sm">
                    <ChartsDashboard />
                </div>
            </motion.div>
        </main>
    );
}

function Footer({ activeSection }: { activeSection: SectionType }) {
    return (
        <footer className="p-6 text-center">
            <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs text-stone-600 font-mono uppercase tracking-widest"
            >
                {activeSection === "firefly" && "Move your cursor to interact with fireflies"}
                {activeSection === "holo" && "Hover over cards to see holographic effect"}
                {activeSection === "tet" && "Watch fireworks and countdown to Tết 2026"}
                {activeSection === "bloom" && "Hover over flowers to make them bloom"}
                {activeSection === "charts" && "Animated data visualization dashboard"}
            </motion.p>
        </footer>
    );
}
