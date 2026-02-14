"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";

type Log = {
    id: number;
    agent: string;
    action: string;
    time: string;
    color: string;
};

const AGENTS = [
    { name: "Agent 21 (CEO)", color: "text-purple-400" },
    { name: "Agent 14 (Growth)", color: "text-blue-400" },
    { name: "Agent 10 (Ads)", color: "text-green-400" },
    { name: "Agent 11 (Story)", color: "text-yellow-400" },
];

const ACTIONS = [
    "Analyzing market trends...",
    "Optimizing ad budget distribution...",
    "Generating 5 new ad creatives...",
    "Detected competitor price drop...",
    "Updating weekly OKRs...",
    "Sending 150 emails...",
    "Drafting 'Heat Map' viral post...",
    "Verifying ROI on Campaign A...",
    "Adjusting bid cap for TikTok Ads...",
    "Scheduling interview with Candidate #42..."
];

export function AgentFeed() {
    const [logs, setLogs] = useState<Log[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial Logs
        const initialLogs = Array.from({ length: 5 }).map((_, i) => createRandomLog(i));
        setLogs(initialLogs);

        // Add new log every 2-4 seconds
        const interval = setInterval(() => {
            setLogs(prev => {
                const newLog = createRandomLog(Date.now());
                const newLogs = [...prev, newLog];
                if (newLogs.length > 20) newLogs.shift(); // Keep last 20
                return newLogs;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="flex-1 flex flex-col font-mono text-xs overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto space-y-3 p-2 no-scrollbar">
                {logs.map((log) => (
                    <div key={log.id} className="border-l-2 border-stone-800 pl-3 py-1 animate-in slide-in-from-left-2 fade-in duration-300">
                        <div className="flex items-center justify-between opacity-50 text-[10px] mb-0.5">
                            <span>{log.time}</span>
                            <Terminal className="w-3 h-3" />
                        </div>
                        <div>
                            <span className={`${log.color} font-bold mr-2`}>[{log.agent}]</span>
                            <span className="text-stone-300">{log.action}</span>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            {/* Gradient Overlay for Fade Effect */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-stone-900/80 to-transparent pointer-events-none" />
        </div>
    );
}

function createRandomLog(id: number): Log {
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    return {
        id,
        agent: agent.name,
        action,
        time,
        color: agent.color
    };
}
