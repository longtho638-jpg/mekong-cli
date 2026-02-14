"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Send, Cpu, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface LogEntry {
    type: "user" | "system" | "error" | "data";
    content: string;
    timestamp: number;
}

export function GeminiTerminal() {
    const [input, setInput] = useState("");
    const [logs, setLogs] = useState<LogEntry[]>([
        { type: "system", content: "Agentic Ops Console v1.0 [Online]", timestamp: Date.now() },
        { type: "system", content: "Connected to Gemini 1.5 Flash. Waiting for instructions...", timestamp: Date.now() + 10 }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleExecute = async () => {
        if (!input.trim()) return;

        const cmd = input;
        setInput("");
        setLogs(prev => [...prev, { type: "user", content: `> ${cmd}`, timestamp: Date.now() }]);
        setIsProcessing(true);

        try {
            const res = await fetch("/api/admin/ops", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: cmd })
            });

            const data = await res.json();

            if (data.success) {
                // Show parsed intent for transparency
                setLogs(prev => [...prev, {
                    type: "system",
                    content: `[Intent: ${data.parsed.intent}] [Action: ${data.parsed.action}]`,
                    timestamp: Date.now()
                }]);
                // Show result
                setLogs(prev => [...prev, { type: "data", content: data.result, timestamp: Date.now() }]);
            } else {
                setLogs(prev => [...prev, { type: "error", content: data.error || "Unknown error", timestamp: Date.now() }]);
            }
            setIsProcessing(false);
        } catch (error: any) {
            setLogs(prev => [...prev, { type: "error", content: `API Error: ${error.message}`, timestamp: Date.now() }]);
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-stone-950 rounded-xl border border-stone-800 shadow-2xl overflow-hidden font-mono text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800">
                <div className="flex items-center gap-2 text-stone-400">
                    <Terminal className="w-4 h-4" />
                    <span className="font-bold text-white">Gemini Ops Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Online
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2" ref={scrollRef}>
                {logs.map((log, i) => (
                    <div key={i} className={`break-words ${log.type === "user" ? "text-stone-300 font-bold mt-4" :
                        log.type === "error" ? "text-red-400" :
                            log.type === "data" ? "text-green-400" :
                                "text-stone-500"
                        }`}>
                        <span className="opacity-50 text-xs mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        {log.content}
                    </div>
                ))}
                {isProcessing && (
                    <div className="text-stone-500 flex items-center gap-2 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing command...
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-stone-900/50 border-t border-stone-800">
                <div className="flex gap-2 relative">
                    <div className="absolute left-3 top-2.5 text-stone-500 font-bold">{">"}</div>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                        placeholder="Ask Gemini Ops to check revenue, manage orders..."
                        className="pl-8 bg-stone-950 border-stone-800 text-green-400 focus-visible:ring-stone-700 font-mono"
                        autoFocus
                    />
                    <Button
                        onClick={handleExecute}
                        size="icon"
                        className="bg-stone-800 hover:bg-stone-700 text-white"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
