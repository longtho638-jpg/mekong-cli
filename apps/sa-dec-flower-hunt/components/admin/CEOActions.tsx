"use client";

import { useState } from "react";
import {
    FileText, PieChart, Briefcase, Users,
    ShieldAlert, TrendingUp, Gavel, FileJson
} from "lucide-react";
import { toast } from "sonner";

const ACTIONS = [
    {
        category: "Finance & M&A", icon: PieChart, color: "text-green-500", items: [
            "Create A Budgets Document", "Create A Financial Statements Document", "Create An Operating Budget",
            "Create A Mergers And Acquisitions Plan", "Create A Market Analysis Document"
        ]
    },
    {
        category: "Strategy & Innovation", icon: TrendingUp, color: "text-blue-500", items: [
            "Create A Business Plan", "Create A Growth Strategy Plan", "Create A Strategic Plan",
            "Create a Product Roadmap Document", "Create An Innovation Strategy Document", "Create A Competitive Analysis Document"
        ]
    },
    {
        category: "Leadership & HR", icon: Users, color: "text-purple-500", items: [
            "Create A Succession Plan", "Create An Organizational Chart", "Create A Talent Management Plan",
            "Create An Employee Handbook", "Create A Performance Reviews Document"
        ]
    },
    {
        category: "Governance", icon: Gavel, color: "text-yellow-500", items: [
            "Create A Corporate Governance Document", "Create A Company Policies Document",
            "Create Board Meeting Minutes", "Create An Executive Meeting Minutes Document",
            "Create A Corporate Social Responsibility Report"
        ]
    },
    {
        category: "Risk & Comms", icon: ShieldAlert, color: "text-red-500", items: [
            "Create A Risk Management Plan", "Create A Crisis Management Plan",
            "Create An Internal Communications Document", "Create A Stakeholder Communications Plan"
        ]
    },
    {
        category: "Corporate", icon: Briefcase, color: "text-orange-500", items: [
            "Create An Investor Presentation", "Create An Annual Report", "Create An Executive Summary", "Create A Partnership Agreement"
        ]
    }
];

export function CEOActions() {
    const [executing, setExecuting] = useState<string | null>(null);
    const [activeRole, setActiveRole] = useState("CEO");

    const ROLES = [
        { id: "CEO", label: "Strategy (CEO)", icon: Briefcase },
        { id: "CFO", label: "Finance (CFO)", icon: PieChart },
        { id: "COO", label: "Operations (COO)", icon: ShieldAlert },
        { id: "CMO", label: "Growth (CMO)", icon: TrendingUp },
    ];

    const ROLE_MAPPING: Record<string, string[]> = {
        "CEO": ["Strategy & Innovation", "Governance", "Corporate"],
        "CFO": ["Finance & M&A"],
        "COO": ["Risk & Comms", "Leadership & HR"],
        "CMO": ["Marketing & Growth"] // Ensure this category exists or is added
    };

    const filteredActions = ACTIONS.filter(group => ROLE_MAPPING[activeRole]?.includes(group.category));

    const handleAction = async (action: string) => {
        setExecuting(action);

        const promise = fetch('/api/admin/ops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        }).then(async (res) => {
            if (!res.ok) throw new Error("Agent Network Unreachable");
            return res.json();
        });

        toast.promise(promise, {
            loading: `Transmitting order to Agent Swarm: "${action}"...`,
            success: (data: any) => {
                const preview = data.data ? JSON.stringify(data.data).slice(0, 50) + "..." : "Task Completed";
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-green-400">Execution Successful</span>
                        <span className="text-xs text-stone-300">{preview}</span>
                        <span className="text-xs text-stone-500 font-mono mt-1">
                            {data.agent_output ? data.agent_output.split('\n')[0].slice(0, 40) + "..." : "Agent Active"}
                        </span>
                    </div>
                );
            },
            error: (err) => `Execution Failed: ${err.message}`,
        });

        try {
            await promise;
        } catch (e) {
            console.error(e);
        } finally {
            setExecuting(null);
        }
    };

    return (
        <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                    Executive Action Suite
                </h3>

                {/* Role Switcher tabs */}
                <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setActiveRole(role.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeRole === role.id
                                ? "bg-stone-800 text-white shadow-sm"
                                : "text-stone-500 hover:text-stone-300"
                                }`}
                        >
                            <role.icon className="w-3 h-3" />
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredActions.length > 0 ? (
                    filteredActions.map((group) => (
                        <div key={group.category} className="space-y-3">
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${group.color} flex items-center gap-2 mb-2`}>
                                <group.icon className="w-3 h-3" />
                                {group.category}
                            </h4>
                            <div className="space-y-2">
                                {group.items.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => handleAction(item)}
                                        disabled={!!executing}
                                        className="w-full text-left px-3 py-2 rounded bg-stone-950/50 border border-stone-800 hover:border-stone-600 hover:bg-stone-800/50 transition-all text-xs text-stone-400 hover:text-white flex items-center justify-between group disabled:opacity-50"
                                    >
                                        <span className="truncate">{item.replace("Create ", "")}</span>
                                        <FileText className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-10 text-stone-500 italic">
                        No actions mapped for this role yet.
                    </div>
                )}
            </div>
        </div>
    );
}
