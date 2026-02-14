"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronUp, Play, TrendingUp, Megaphone, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const QUICK_ACTIONS = [
    { id: "marketing", label: "Marketing Agent", icon: Megaphone, color: "emerald" },
    { id: "finance", label: "Finance Report", icon: TrendingUp, color: "amber" },
    { id: "gtm", label: "GTM Analysis", icon: FileText, color: "cyan" },
];

export function FloatingAgentButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [runningAgent, setRunningAgent] = useState<string | null>(null);

    const handleRunAgent = async (agentId: string) => {
        setRunningAgent(agentId);
        toast.info(`Đang chạy ${agentId} agent...`);

        try {
            const response = await fetch('/api/agents/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, input: { data: {} } })
            });
            const result = await response.json();

            setRunningAgent(null);
            if (result.success) {
                toast.success(`${agentId} agent hoàn tất!`, {
                    description: `Thời gian: ${result.executionTimeMs}ms`
                });
            } else {
                toast.error(`${agentId} agent thất bại`);
            }
        } catch (error) {
            setRunningAgent(null);
            toast.error(`${agentId} agent lỗi`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="fixed bottom-6 right-6 z-50"
        >
            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-16 right-0 w-48 bg-stone-950 border border-emerald-500/30 rounded-lg overflow-hidden shadow-xl"
                    >
                        <div className="p-2 border-b border-stone-800">
                            <p className="text-[10px] text-stone-500 uppercase tracking-wider px-2">Quick Actions</p>
                        </div>
                        <div className="p-1">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleRunAgent(action.id)}
                                    disabled={runningAgent !== null}
                                    className={`
                                        w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm
                                        hover:bg-emerald-950/50 transition-colors
                                        ${runningAgent === action.id ? 'bg-emerald-950/50' : ''}
                                    `}
                                >
                                    <action.icon className={`w-4 h-4 text-${action.color}-500`} />
                                    <span className="text-stone-300 text-xs">{action.label}</span>
                                    {runningAgent === action.id && (
                                        <Play className="w-3 h-3 ml-auto text-emerald-500 animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <Link href="/agents" className="block">
                            <div className="p-2 border-t border-stone-800 hover:bg-stone-900 transition-colors">
                                <p className="text-[10px] text-emerald-400 text-center uppercase tracking-wider">
                                    Xem tất cả 24 Agents [Demo] →
                                </p>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
            >
                <Bot className="w-5 h-5" />
                <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">
                    Agent CLI
                </span>
                <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </button>
        </motion.div>
    );
}
