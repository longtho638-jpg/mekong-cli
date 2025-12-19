"use client";
import React from "react";
import { BentoGrid, BentoGridItem } from "../ui/BentoGrid";
import { Spotlight } from "../ui/spotlight";

export function Features() {
    return (
        <section className="py-20 w-full relative overflow-hidden bg-black antialiased" id="features">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Engineered for <span className="text-purple-500">Scale</span>
                    </h2>
                    <p className="text-neutral-400 text-lg">
                        The only OS that combines AI Agents, Strategic Frameworks, and Operational Tools into one cohesive platform.
                    </p>
                </div>

                <BentoGrid className="max-w-4xl mx-auto">
                    {items.map((item, i) => (
                        <BentoGridItem
                            key={i}
                            title={item.title}
                            description={item.description}
                            header={item.header}
                            icon={item.icon}
                            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                        />
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
}

// Rich visual headers for each feature card
const AIHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-4 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl">🤖</div>
            <div className="text-left">
                <div className="text-xs text-blue-400 font-mono">Agent Status</div>
                <div className="text-lg font-bold text-white">12 Active</div>
            </div>
            <div className="w-16 h-8 ml-4">
                <svg viewBox="0 0 60 30" className="w-full h-full">
                    <polyline points="0,25 10,20 20,22 30,15 40,18 50,10 60,12" fill="none" stroke="#3b82f6" strokeWidth="2" />
                    <polyline points="0,25 10,20 20,22 30,15 40,18 50,10 60,12" fill="none" stroke="#3b82f6" strokeWidth="6" strokeOpacity="0.2" />
                </svg>
            </div>
        </div>
    </div>
);

const DashboardHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3 items-start relative overflow-hidden">
        <div className="w-full space-y-2">
            <div className="flex gap-2">
                <div className="flex-1 h-6 rounded bg-purple-500/20 flex items-center px-2">
                    <span className="text-[10px] text-purple-300 font-mono">$128K MRR</span>
                </div>
                <div className="flex-1 h-6 rounded bg-pink-500/20 flex items-center px-2">
                    <span className="text-[10px] text-pink-300 font-mono">24 Clients</span>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="w-1/3 h-10 rounded bg-white/5 border border-white/10"></div>
                <div className="w-1/3 h-10 rounded bg-white/5 border border-white/10"></div>
                <div className="w-1/3 h-10 rounded bg-white/5 border border-white/10"></div>
            </div>
        </div>
    </div>
);

const PortalHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-4 items-center justify-center relative overflow-hidden">
        <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
                {['🧑‍💼', '👩‍💻', '👨‍💼'].map((emoji, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-black flex items-center justify-center text-lg">{emoji}</div>
                ))}
            </div>
            <div className="text-left">
                <div className="text-xs text-orange-400 font-mono">Client Portal</div>
                <div className="text-sm font-medium text-white">White-labeled Access</div>
            </div>
        </div>
    </div>
);

const StrategyHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/20 p-4 items-center justify-center relative overflow-hidden">
        <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-1 font-serif">孫子兵法</div>
            <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-4 h-4 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                ))}
            </div>
            <div className="text-[10px] text-emerald-400/60 mt-2">13 Strategic Modules</div>
        </div>
    </div>
);

const PaymentHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-600/10 border border-indigo-500/20 p-4 items-center justify-center relative overflow-hidden">
        <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
                {['💳', '₿', '🌐'].map((icon, i) => (
                    <div key={i} className="w-8 h-8 rounded bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm">{icon}</div>
                ))}
            </div>
            <div className="text-left">
                <div className="text-2xl font-bold text-indigo-400">135+</div>
                <div className="text-xs text-indigo-300/70">Currencies</div>
            </div>
        </div>
    </div>
);

const LocalHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4 items-center justify-center relative overflow-hidden">
        <div className="text-center">
            <div className="text-4xl mb-2">🇻🇳</div>
            <div className="flex gap-1 justify-center">
                <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Zalo</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30">VNPay</span>
            </div>
        </div>
    </div>
);

const items = [
    {
        title: "AI & Automation",
        description: "Launch autonomous agents to handle repetitive tasks.",
        header: <AIHeader />,
        icon: <div className="text-2xl">🤖</div>,
    },
    {
        title: "Mission Control",
        description: "Visualize every metric of your agency in real-time.",
        header: <DashboardHeader />,
        icon: <div className="text-2xl">📊</div>,
    },
    {
        title: "Client Portals",
        description: "Give clients a premium, white-labeled experience.",
        header: <PortalHeader />,
        icon: <div className="text-2xl">👥</div>,
    },
    {
        title: "Binh Pháp Strategy",
        description: "Embedded ancient wisdom. 13 chapters of business strategy coded into modules.",
        header: <StrategyHeader />,
        icon: <div className="text-2xl">⚔️</div>,
    },
    {
        title: "Global Payments",
        description: "Accept crypto and fiat in 135+ currencies.",
        header: <PaymentHeader />,
        icon: <div className="text-2xl">💳</div>,
    },
    {
        title: "Local Intelligence",
        description: "Vietnamese market data and Zalo integration built-in.",
        header: <LocalHeader />,
        icon: <div className="text-2xl">🌏</div>,
    },
];

