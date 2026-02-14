"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Play, Loader2, TrendingUp, FileText, Target, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

const FEATURED_AGENTS = [
    {
        id: "14",
        name: "GTM Strategy",
        icon: Target,
        description: "Go-to-Market Analysis"
    },
    {
        id: "05",
        name: "Financial Model",
        icon: DollarSign,
        description: "Cash Flow & Projections"
    },
    {
        id: "12",
        name: "Pitch Deck",
        icon: FileText,
        description: "Investor Presentation"
    },
    {
        id: "16",
        name: "Pricing Strategy",
        icon: TrendingUp,
        description: "Dynamic Pricing"
    },
];

export function InlineAgentWidget() {
    const [runningAgent, setRunningAgent] = useState<string | null>(null);

    const handleRunAgent = async (agentId: string, agentName: string) => {
        setRunningAgent(agentId);
        toast.info(`Đang chạy Agent ${agentName}...`);

        try {
            const response = await fetch('/api/agents/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, input: { data: {} } })
            });
            const result = await response.json();

            setRunningAgent(null);
            if (result.success) {
                toast.success(`${agentName} hoàn tất!`, {
                    description: `Thời gian: ${result.executionTimeMs}ms`
                });
            } else {
                toast.error(`${agentName} thất bại`);
            }
        } catch (error) {
            setRunningAgent(null);
            toast.error(`${agentName} lỗi`);
        }
    };

    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2">
                        🤖 AI AGENTS <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded ml-2">Demo</span>
                    </p>
                    <h2 className="text-2xl font-light text-white mb-2">
                        <span className="text-emerald-400 font-bold font-mono">24 AI Agents</span> Tự Động Hóa
                    </h2>
                    <p className="text-sm text-stone-500 max-w-md mx-auto">
                        BizPlan CLI Toolkit cho automation marketing, tài chính, và chiến lược kinh doanh
                    </p>
                    <p className="text-[9px] text-stone-600 mt-2">[Chế độ demo - output mô phỏng]</p>
                </div>

                {/* Featured Agents Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
                    {FEATURED_AGENTS.map((agent, i) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-stone-950 border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/50 transition-all"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center">
                                    <agent.icon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                                    <div className="text-[9px] text-stone-600 truncate">{agent.description}</div>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleRunAgent(agent.id, agent.name)}
                                disabled={runningAgent === agent.id}
                                size="sm"
                                className="w-full h-7 bg-black border border-stone-800 text-stone-400 hover:bg-emerald-950 hover:border-emerald-500/50 hover:text-emerald-400 text-[10px]"
                            >
                                {runningAgent === agent.id ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3 h-3 mr-1" />
                                        Demo
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* View All Link */}
                <div className="text-center">
                    <Link href="/agents">
                        <Button
                            variant="outline"
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950 hover:border-emerald-500/50"
                        >
                            <Bot className="w-4 h-4 mr-2" />
                            Xem Tất Cả 24 Agents
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
