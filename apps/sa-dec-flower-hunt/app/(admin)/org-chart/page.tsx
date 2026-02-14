"use client";

import { useState, useEffect } from "react";
import { Users, Bot, Briefcase, DollarSign, Code, Zap, Heart, X, Sliders, Database, Globe } from "lucide-react";
import { toast } from "sonner";

export default function OrgChartPage() {
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
    const [config, setConfig] = useState<any>({});

    // Fetch config on load
    useEffect(() => {
        fetch('/api/admin/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error("Failed to load config:", err));
    }, []);

    const handleSaveConfig = async () => {
        // Optimistic update simulation
        const updatedConfig = {
            ...config,
            agents: {
                ...config.agents,
                [selectedAgent.id || "default"]: {
                    ...config.agents?.[selectedAgent.id || "default"],
                    last_updated: new Date().toISOString()
                }
            }
        };

        const promise = fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedConfig)
        });

        toast.promise(promise, {
            loading: 'Rewriting Neural Pathways...',
            success: 'Agent Brain Re-configured Successfully',
            error: 'Failed to update configuration'
        });

        try {
            await promise;
            setConfig(updatedConfig);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 min-h-screen bg-stone-950 text-white font-mono overflow-x-hidden relative">
            <div className="mb-12 text-center md:text-left">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                    Conducting AI: The Machine
                </h2>
                <p className="text-stone-400 mt-2 text-sm">
                    Interactive Neural Architecture. Click any Node to configure its Brain.
                </p>
            </div>

            {/* Tree Container */}
            <div className="flex flex-col items-center space-y-12 min-w-[1000px] pb-24 scale-90 origin-top">

                {/* Level 1: Human Executive (You) */}
                <div className="relative">
                    <Node
                        title="You (Solo Founder)"
                        subtitle="The Conductor"
                        icon={<Users className="w-6 h-6 text-white" />}
                        color="bg-stone-800 border-white"
                        glowing
                        onClick={() => setSelectedAgent({ id: "founder", name: "You (Founder)", type: "human", desc: "The strategic decision maker." })}
                    />
                    <div className="h-12 w-0.5 bg-stone-700 absolute -bottom-12 left-1/2 -translate-x-1/2" />
                </div>

                {/* Level 2: Chief AI Orchestrator */}
                <div className="relative">
                    <Node
                        title="Agent 21 (Nexus)"
                        subtitle="Chief AI Architect"
                        icon={<Bot className="w-6 h-6 text-green-400" />}
                        color="bg-green-950/30 border-green-500"
                        onClick={() => setSelectedAgent({ id: "21", name: "Agent 21 (Nexus)", type: "ai", desc: "Master Orchestrator. Routes tasks to specialized sub-agents." })}
                    />
                    <div className="h-12 w-0.5 bg-stone-700 absolute -bottom-12 left-1/2 -translate-x-1/2" />

                    {/* Horizontal Connector */}
                    <div className="absolute -bottom-12 top-full w-[80%] bg-stone-700 h-0.5 left-[10%]" />
                </div>

                {/* Level 3: Departments */}
                <div className="grid grid-cols-5 gap-8 w-full">
                    {/* Dept: Marketing */}
                    <DeptColumn
                        title="Marketing & Growth"
                        icon={<Zap className="w-4 h-4 text-orange-400" />}
                        onSubClick={setSelectedAgent}
                        agents={[
                            { id: "05_strategy", name: "Agent 05: Strategy" },
                            { id: "08", name: "Agent 08: Content" },
                            { id: "10_viral_ads", name: "Agent 10: Viral Ads" },
                            { id: "11", name: "Agent 11: Storytelling" }
                        ]}
                    />

                    {/* Dept: Sales */}
                    <DeptColumn
                        title="Sales & Channels"
                        icon={<DollarSign className="w-4 h-4 text-green-400" />}
                        onSubClick={setSelectedAgent}
                        agents={[
                            { id: "12", name: "Agent 12: B2B/B2C" },
                            { id: "13", name: "Agent 13: Funnels" }
                        ]}
                    />

                    {/* Dept: Tech & Product */}
                    <DeptColumn
                        title="Tech & Automations"
                        icon={<Code className="w-4 h-4 text-blue-400" />}
                        onSubClick={setSelectedAgent}
                        agents={[
                            { id: "01_product", name: "Agent 01: Product" },
                            { id: "19", name: "Agent 19: Coding" },
                            { id: "23", name: "Agent 23: Data" }
                        ]}
                    />

                    {/* Dept: Finance */}
                    <DeptColumn
                        title="Finance & Ops"
                        icon={<Briefcase className="w-4 h-4 text-purple-400" />}
                        onSubClick={setSelectedAgent}
                        agents={[
                            { id: "02", name: "Agent 02: Unit Econ" },
                            { id: "16_finance", name: "Agent 16: Fundraising" },
                            { id: "20", name: "Agent 20: Data Room" }
                        ]}
                    />

                    {/* Dept: People & Legal */}
                    <DeptColumn
                        title="People & Legal"
                        icon={<Heart className="w-4 h-4 text-pink-400" />}
                        onSubClick={setSelectedAgent}
                        agents={[
                            { id: "24", name: "Agent 24: Org Design" },
                            { id: "18", name: "Agent 18: Legal Risk" }
                        ]}
                    />

                </div>
            </div>

            {/* Neural Configuration Panel (Slide-over) */}
            <div className={`fixed top-0 right-0 h-full w-[400px] bg-stone-900 border-l border-stone-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${selectedAgent ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedAgent && (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-stone-800 bg-stone-950/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-green-500 uppercase tracking-widest border border-green-900/50 px-2 py-0.5 rounded bg-green-950/20">Active Node</span>
                                <button onClick={() => setSelectedAgent(null)} className="text-stone-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{selectedAgent.name}</h3>
                            <p className="text-xs text-stone-400">{selectedAgent.desc || "Specialized AI Worker Unit"}</p>
                            <p className="text-[10px] text-stone-500 font-mono mt-1">ID: {selectedAgent.id}</p>
                        </div>

                        {/* Config Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Section 1: Personality Matrix */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-purple-500" />
                                    Cognitive Tuning
                                </h4>
                                <div className="space-y-4 bg-stone-950 p-4 rounded-lg border border-stone-800">
                                    <RangeControl label="Creativity / Temperature" value={75} />
                                    <RangeControl label="Autonomy Level" value={90} />
                                    <RangeControl label="Speed vs Accuracy" value={60} />
                                </div>
                            </div>

                            {/* Section 2: Knowledge Graph */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-blue-500" />
                                    Context Access (RAG)
                                </h4>
                                <div className="space-y-2 bg-stone-950 p-4 rounded-lg border border-stone-800">
                                    <Toggle label="Read: Financial Reports (2025)" checked />
                                    <Toggle label="Read: Customer CRM" checked={selectedAgent.name.includes("Marketing") || selectedAgent.name.includes("Sales")} />
                                    <Toggle label="Read: Competitor Analysis" checked={true} />
                                    <Toggle label="Write: Production DB" checked={false} warned />
                                </div>
                            </div>

                            {/* Section 3: Tools & Integrations */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-orange-500" />
                                    Tool Permissions
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolBadge name="Gmail API" active />
                                    <ToolBadge name="Slack Bot" active />
                                    <ToolBadge name="Facebook Ads" active={selectedAgent.name.includes("Ads")} />
                                    <ToolBadge name="Stripe Connect" active={selectedAgent.name.includes("Finance")} />
                                </div>
                            </div>

                        </div>

                        <div className="p-4 border-t border-stone-800 bg-stone-950">
                            <button
                                onClick={handleSaveConfig}
                                className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-sm transition-colors"
                            >
                                Apply Configuration
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedAgent(null)} />
            )}
        </div>
    );
}

function DeptColumn({ title, icon, agents, onSubClick }: any) {
    return (
        <div className="flex flex-col items-center relative">
            <div className="h-8 w-0.5 bg-stone-700 absolute -top-8 left-1/2 -translate-x-1/2" />
            <Node
                title={title}
                icon={icon}
                color="bg-stone-900 border-stone-700 hover:border-stone-500"
            />
            <div className="h-8 w-0.5 bg-stone-700" />
            <div className="space-y-3 pt-4 border-l border-stone-800 pl-4 ml-4 w-full">
                {agents.map((agent: any) => (
                    <SubNode
                        key={agent.id}
                        name={agent.name}
                        onClick={() => onSubClick(agent)}
                    />
                ))}
            </div>
        </div>
    )
}

function Node({ title, subtitle, icon, color, glowing, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`
            px-6 py-4 rounded-xl border-2 flex items-center gap-4 min-w-[200px] justify-center z-10 relative cursor-pointer transition-all hover:scale-105 active:scale-95
            ${color}
            ${glowing ? 'shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse' : 'bg-stone-950'}
        `}>
            <div className="p-2 bg-black/50 rounded-lg">
                {icon}
            </div>
            <div className="text-left">
                <p className="font-bold text-sm text-stone-100">{title}</p>
                {subtitle && <p className="text-[10px] text-stone-400 uppercase tracking-widest">{subtitle}</p>}
            </div>
        </div>
    )
}

function SubNode({ name, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 text-xs text-stone-400 hover:text-green-400 transition-colors cursor-pointer group"
        >
            <div className="w-2 h-2 rounded-full bg-stone-700 group-hover:bg-green-400 ring-2 ring-transparent group-hover:ring-green-900/50 transition-all" />
            {name}
        </div>
    )
}

function RangeControl({ label, value }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-stone-400">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${value}%` }} />
            </div>
        </div>
    )
}

function Toggle({ label, checked, warned }: any) {
    return (
        <div className="flex items-center justify-between text-xs py-1">
            <span className={warned ? "text-red-400" : "text-stone-300"}>{label}</span>
            <div className={`w-8 h-4 rounded-full p-0.5 ${checked ? 'bg-green-600' : 'bg-stone-700'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
        </div>
    )
}

function ToolBadge({ name, active }: any) {
    return (
        <div className={`text-[10px] px-2 py-1.5 rounded border ${active ? 'bg-green-950/30 border-green-800 text-green-400' : 'bg-stone-900 border-stone-800 text-stone-600 line-through'}`}>
            {name}
        </div>
    )
}
