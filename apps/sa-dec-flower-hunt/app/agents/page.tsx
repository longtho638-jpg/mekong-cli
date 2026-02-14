"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Terminal,
    Bot,
    Play,
    CheckCircle,
    Clock,
    Zap,
    FileText,
    TrendingUp,
    Users,
    DollarSign,
    Shield,
    Target,
    BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AGENTS = [
    { id: "01", name: "Project Vision", category: "Foundation", icon: Target, status: "ready" },
    { id: "02", name: "Market Research", category: "Research", icon: BarChart3, status: "ready" },
    { id: "03", name: "Competition Analysis", category: "Research", icon: Users, status: "ready" },
    { id: "04", name: "Business Model", category: "Strategy", icon: DollarSign, status: "ready" },
    { id: "05", name: "Financial Model", category: "Finance", icon: TrendingUp, status: "ready" },
    { id: "06", name: "Unit Economics", category: "Finance", icon: DollarSign, status: "ready" },
    { id: "08", name: "Product Roadmap", category: "Product", icon: Target, status: "ready" },
    { id: "09", name: "Tech Architecture", category: "Tech", icon: Terminal, status: "ready" },
    { id: "10", name: "Team & Hiring", category: "Ops", icon: Users, status: "ready" },
    { id: "11", name: "Funding Strategy", category: "Finance", icon: DollarSign, status: "ready" },
    { id: "12", name: "Pitch Deck", category: "Fundraising", icon: FileText, status: "ready" },
    { id: "13", name: "Competitive Moat", category: "Strategy", icon: Shield, status: "ready" },
    { id: "14", name: "GTM Strategy", category: "Marketing", icon: Target, status: "ready" },
    { id: "15", name: "AARRR Metrics", category: "Analytics", icon: BarChart3, status: "ready" },
    { id: "16", name: "Pricing Strategy", category: "Strategy", icon: DollarSign, status: "ready" },
    { id: "17", name: "Risk Analysis", category: "Ops", icon: Shield, status: "ready" },
    { id: "18", name: "Legal & Compliance", category: "Legal", icon: Shield, status: "ready" },
    { id: "19", name: "SaaS Benchmarks", category: "Analytics", icon: BarChart3, status: "ready" },
    { id: "20", name: "Founder Wellness", category: "Ops", icon: Users, status: "ready" },
    { id: "21", name: "OKR System", category: "Execution", icon: Target, status: "ready" },
    { id: "22", name: "Board Deck", category: "Governance", icon: FileText, status: "ready" },
    { id: "23", name: "Exit Strategy", category: "Finance", icon: DollarSign, status: "ready" },
    { id: "24", name: "Advisor Network", category: "Ops", icon: Users, status: "ready" },
];

const CATEGORIES = [...new Set(AGENTS.map(a => a.category))];

export default function AgentsPage() {
    const [currentTime, setCurrentTime] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRunAgent = async (agentId: string) => {
        setRunningAgents(prev => new Set([...prev, agentId]));
        toast.info(`Đang chạy Agent ${agentId}...`);

        try {
            // Real API call to execute agent
            const response = await fetch('/api/agents/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    input: { data: { context: {} } }
                })
            });

            const result = await response.json();

            setRunningAgents(prev => {
                const next = new Set(prev);
                next.delete(agentId);
                return next;
            });

            if (result.success) {
                toast.success(`Agent ${agentId} hoàn tất!`, {
                    description: `Thời gian: ${result.executionTimeMs}ms`
                });
                console.log(`Agent ${agentId} output:`, result.output);
            } else {
                toast.error(`Agent ${agentId} thất bại`, {
                    description: result.error || 'Unknown error'
                });
            }
        } catch (error: any) {
            setRunningAgents(prev => {
                const next = new Set(prev);
                next.delete(agentId);
                return next;
            });
            toast.error(`Agent ${agentId} lỗi`, {
                description: error.message
            });
        }
    };

    const filteredAgents = selectedCategory
        ? AGENTS.filter(a => a.category === selectedCategory)
        : AGENTS;

    return (
        <div className="min-h-screen bg-black text-white font-mono p-6">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png" className="w-full h-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Bot className="w-6 h-6 text-emerald-500" />
                            <h1 className="text-2xl font-bold">AGENT_CLI_TOOLKIT</h1>
                            <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-xs text-emerald-400">
                                24 AGENTS
                            </span>
                        </div>
                        <p className="text-stone-500 text-sm">
                            BizPlan CLI với 24 AI Agents cho automation marketing & business
                        </p>
                    </div>
                    <div className="text-stone-500 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {currentTime}
                    </div>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 mb-6"
                >
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 text-xs rounded border transition-all ${selectedCategory === null
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "bg-black border-stone-800 text-stone-500 hover:border-stone-600"
                            }`}
                    >
                        Tất cả ({AGENTS.length})
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 text-xs rounded border transition-all ${selectedCategory === cat
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-black border-stone-800 text-stone-500 hover:border-stone-600"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </motion.div>

                {/* Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgents.map((agent, i) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.03 }}
                            className="bg-stone-950 border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/50 transition-all"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center">
                                        <agent.icon className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white">
                                            {agent.id}-{agent.name.toUpperCase().replace(/ /g, "_")}
                                        </div>
                                        <div className="text-[10px] text-stone-600">{agent.category}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-stone-600 uppercase">Ready</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleRunAgent(agent.id)}
                                disabled={runningAgents.has(agent.id)}
                                className="w-full h-8 bg-black border border-stone-800 text-stone-400 hover:bg-emerald-950 hover:border-emerald-500/50 hover:text-emerald-400 text-xs"
                            >
                                {runningAgents.has(agent.id) ? (
                                    <>
                                        <Zap className="w-3 h-3 mr-2 animate-pulse" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3 h-3 mr-2" />
                                        Run Agent
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* CLI Command */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 bg-stone-950 border border-stone-800 rounded-lg p-4"
                >
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                        <Terminal className="w-4 h-4" />
                        <span>CLI Command</span>
                    </div>
                    <code className="text-emerald-400 text-sm">
                        cd bizplan-cli-toolkit && npm run build && node dist/index.js
                    </code>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-stone-600 text-xs">
                    <p>Powered by <span className="text-emerald-500">BizPlan CLI Toolkit</span> • 24 AI Agents</p>
                </div>
            </div>
        </div>
    );
}
