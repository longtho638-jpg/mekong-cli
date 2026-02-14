"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MobileNodeGrid } from "@/components/visualizations/MobileNodeGrid";
import { SystemLog } from "@/components/terminal/SystemLog";
import { LiveTicker } from "@/components/ui/live-ticker";
import { Terminal, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function LiveTerminalPage() {
    const [nodeId, setNodeId] = useState<number>(0);
    const [activated, setActivated] = useState(false);
    const [logEntries, setLogEntries] = useState<any[]>([]);

    useEffect(() => {
        // Generate user's node ID
        const id = Math.floor(Math.random() * 10000);
        setNodeId(id);

        // Track visit
        trackEvent("live_terminal_view", { node_id: id });

        // Activation sequence
        setTimeout(() => setActivated(true), 500);

        // Generate mock log entries
        const initialLogs = [
            { timestamp: getCurrentTime(), message: `NODE_${id} joining network...`, type: 'info' as const },
            { timestamp: getCurrentTime(1), message: `Geolocation: Sa Đéc, Đồng Tháp`, type: 'info' as const },
            { timestamp: getCurrentTime(2), message: `Connection established`, type: 'success' as const },
            { timestamp: getCurrentTime(3), message: `5-Node sync complete`, type: 'success' as const },
            { timestamp: getCurrentTime(4), message: `System: OPERATIONAL`, type: 'success' as const },
        ];

        setLogEntries(initialLogs);

        // Simulate ongoing activity
        const interval = setInterval(() => {
            const newEntry = generateRandomLogEntry();
            setLogEntries(prev => [...prev, newEntry].slice(-10));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getCurrentTime = (offset = 0) => {
        const now = new Date();
        now.setSeconds(now.getSeconds() + offset);
        return now.toLocaleTimeString('en-US', { hour12: false });
    };

    const generateRandomLogEntry = () => {
        const events = [
            `MARKET: New order #${Math.floor(Math.random() * 10000)}`,
            `SENSOR: Sector ${Math.floor(Math.random() * 10)} temp normalized`,
            `BANK: Credit check approved (Score: ${700 + Math.floor(Math.random() * 200)})`,
            `LOGISTICS: Truck #${Math.floor(Math.random() * 50)} departed`,
            `SUPPLY: Restock alert for SKU-${Math.floor(Math.random() * 100)}`,
        ];

        return {
            timestamp: getCurrentTime(),
            message: events[Math.floor(Math.random() * events.length)],
            type: 'info' as const,
        };
    };

    const handleShare = () => {
        trackEvent("live_terminal_share", { node_id: nodeId });

        if (navigator.share) {
            navigator.share({
                title: 'AGRIOS.tech Live Terminal',
                text: `Tôi là Node #${nodeId} trên hệ thống AGRIOS.tech - Hệ điều hành nông nghiệp quốc gia`,
                url: window.location.href,
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link đã được sao chép!');
        }
    };

    return (
        <div className="min-h-screen bg-black text-emerald-400 font-mono relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

            {/* Header HUD */}
            <motion.header
                className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-emerald-900/50 p-4"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-emerald-500/30 flex items-center justify-center bg-emerald-900/20">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold tracking-[0.2em]">LIVE_TERMINAL</div>
                            <div className="text-[10px] text-stone-500">NODE_#{nodeId.toString().padStart(4, '0')}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${activated ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-[10px] uppercase">{activated ? 'ACTIVE' : 'CONNECTING'}</span>
                    </div>
                </div>
            </motion.header>

            {/* Activation Animation */}
            {!activated && (
                <motion.div
                    className="fixed inset-0 z-40 bg-black flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <div className="text-center">
                        <motion.div
                            className="text-4xl mb-4"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            ⚡
                        </motion.div>
                        <div className="text-sm">ACTIVATING_NODE...</div>
                    </div>
                </motion.div>
            )}

            {/* Main Content */}
            <main className="p-4 pb-32 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                >
                    {/* Welcome Message */}
                    <div className="max-w-lg mx-auto mb-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-sm">
                        <div className="text-xs mb-2 text-emerald-500 uppercase font-bold">CHÀO MỪNG ĐẾN VỚI AGRIOS.tech</div>
                        <p className="text-[11px] text-stone-300 leading-relaxed">
                            Bạn đang kết nối trực tiếp với <span className="text-white font-bold">Hệ Điều Hành Chuỗi Giá Trị Nông Nghiệp Quốc Gia</span>.
                            Dưới đây là trạng thái thời gian thực của <span className="text-emerald-400">5 Node quan trọng</span>.
                        </p>
                    </div>

                    {/* 5-Node Grid */}
                    <MobileNodeGrid />

                    {/* System Log */}
                    <motion.div
                        className="max-w-lg mx-auto mt-6 p-4 bg-stone-950 border border-emerald-500/20 rounded-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                    >
                        <div className="text-[10px] text-emerald-700 uppercase mb-2">SYSTEM_ACTIVITY</div>
                        <SystemLog entries={logEntries} maxEntries={5} />
                    </motion.div>

                    {/* Share CTA */}
                    <motion.div
                        className="max-w-lg mx-auto mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                    >
                        <button
                            onClick={handleShare}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-6 rounded-sm flex items-center justify-center gap-2 transition-colors uppercase text-sm tracking-wider"
                        >
                            <Share2 className="w-4 h-4" />
                            Chia sẻ quyền điều hành
                        </button>
                        <p className="text-center text-[10px] text-stone-500 mt-2">
                            Hãy cho bạn bè thấy bạn đang kiểm soát Node #{nodeId}
                        </p>
                    </motion.div>
                </motion.div>
            </main>

            {/* Live Ticker */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <LiveTicker />
            </div>
        </div>
    );
}
