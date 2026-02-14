'use client';

import { useState, useEffect } from 'react';
import {
    Crown,
    TrendingUp,
    Users,
    DollarSign,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Bot,
    Zap,
    PieChart,
    BarChart3,
    Calendar,
    MessageSquare,
    Send,
    RefreshCw
} from 'lucide-react';

// Chairman's 10 Agent List
const chairmanAgents = [
    { id: 1, name: 'Strategic AI', status: 'active', lastAction: 'Updated Q4 OKRs' },
    { id: 2, name: 'Cap Table AI', status: 'idle', lastAction: 'Calculated Series A dilution' },
    { id: 3, name: 'Investor Updates', status: 'running', lastAction: 'Drafting Dec report' },
    { id: 4, name: 'Fundraising AI', status: 'active', lastAction: 'Pitch deck v3 ready' },
    { id: 5, name: 'Legal AI', status: 'idle', lastAction: 'Reviewed SAFE note' },
    { id: 6, name: 'Board Meeting AI', status: 'idle', lastAction: 'Prepared Q3 minutes' },
    { id: 7, name: 'Risk AI', status: 'active', lastAction: 'Tet demand forecast' },
    { id: 8, name: 'Governance AI', status: 'idle', lastAction: 'Updated bylaws draft' },
    { id: 9, name: 'IP Protection', status: 'idle', lastAction: 'Trademark filed' },
    { id: 10, name: 'Exit Planning', status: 'idle', lastAction: 'IPO timeline v2' },
];

// Quick Stats Data
const quickStats = [
    { label: 'Valuation', value: '$3.3M', change: '+560%', icon: TrendingUp, color: 'emerald' },
    { label: 'Runway', value: '60 mo', change: 'Safe', icon: Clock, color: 'cyan' },
    { label: 'MRR', value: '$8,000', change: '80%', icon: DollarSign, color: 'amber' },
    { label: 'Gardens', value: '42', change: '+17%', icon: Users, color: 'violet' },
];

// Equity Overview
const equityData = {
    long: { name: 'Long (Chairman)', percent: 27.2, value: '$890k' },
    thong: { name: 'Thông (CEO)', percent: 20.4, value: '$668k' },
    con: { name: 'Còn (COO)', percent: 20.4, value: '$668k' },
    investors: { name: 'Investors', percent: 32, value: '$1.05M' },
};

export default function ChairmanDashboard() {
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');

    const runAgent = async (agentQuery: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'kpi-dashboard', query: agentQuery })
            });
            const data = await res.json();
            setAiResponse(data.data?.response || 'No response');
        } catch (err) {
            setAiResponse('Error fetching response');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        runAgent('Báo cáo tổng quan cho Chairman');
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            {/* Header */}
            <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">
                                Xin chào, <span className="text-amber-400">Anh Long</span>
                            </h1>
                            <p className="text-slate-400">Chairman's Control Panel • {new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                            <span className="text-emerald-400 font-bold">Phase: SEED</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-slate-800 border border-white/10">
                            <span className="text-slate-300">Q4 2026</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {quickStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className={`p-5 rounded-2xl bg-slate-800/50 backdrop-blur border border-white/5 hover:border-${stat.color}-500/30 transition-all`}>
                                <div className="flex items-center justify-between mb-3">
                                    <Icon className={`h-6 w-6 text-${stat.color}-400`} />
                                    <span className={`text-xs px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-400 font-bold`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-slate-400">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column - Equity & Agents */}
                    <div className="col-span-4 space-y-6">
                        {/* Equity Card */}
                        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur border border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart className="h-5 w-5 text-amber-400" />
                                <h3 className="font-bold text-lg">Equity Overview @ Seed</h3>
                            </div>
                            <div className="space-y-3">
                                {Object.values(equityData).map((holder, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-amber-500' : i === 3 ? 'bg-slate-500' : 'bg-cyan-500'}`} />
                                            <span className="text-sm text-slate-300">{holder.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-white">{holder.percent}%</span>
                                            <span className="text-xs text-slate-500 ml-2">{holder.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Post-Money Valuation</span>
                                    <span className="font-bold text-emerald-400">$3.3M</span>
                                </div>
                            </div>
                        </div>

                        {/* Chairman's Agents */}
                        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-violet-400" />
                                    <h3 className="font-bold text-lg">My 10 Agents</h3>
                                </div>
                                <span className="text-xs text-emerald-400 font-mono">3 active</span>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {chairmanAgents.map((agent) => (
                                    <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${agent.status === 'running' ? 'bg-cyan-400 animate-pulse' :
                                                    agent.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                                                }`} />
                                            <span className="text-sm font-medium">{agent.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 max-w-[120px] truncate">{agent.lastAction}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Column - AI Command Center */}
                    <div className="col-span-5 space-y-6">
                        {/* AI Response Panel */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur border border-violet-500/20 min-h-[400px]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-violet-400" />
                                    <h3 className="font-bold text-lg">AI Command Center</h3>
                                </div>
                                <button
                                    onClick={() => runAgent('Cập nhật mới nhất')}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <RefreshCw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* AI Response */}
                            <div className="bg-slate-900/50 rounded-xl p-4 min-h-[250px] mb-4">
                                {isLoading ? (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <div className="animate-spin h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full" />
                                        <span>Đang xử lý...</span>
                                    </div>
                                ) : (
                                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{aiResponse}</pre>
                                )}
                            </div>

                            {/* Query Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Hỏi AI điều gì đó..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && runAgent(query)}
                                />
                                <button
                                    onClick={() => runAgent(query)}
                                    className="px-4 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 transition-colors"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Weekly Report', icon: BarChart3, action: 'Tạo báo cáo tuần' },
                                { label: 'Investor Update', icon: MessageSquare, action: 'Draft email cho NĐT' },
                                { label: 'Cap Table Check', icon: PieChart, action: 'Check dilution Series A' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => runAgent(action.action)}
                                    className="p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-violet-500/30 hover:bg-slate-800 transition-all text-left"
                                >
                                    <action.icon className="h-5 w-5 text-violet-400 mb-2" />
                                    <p className="text-sm font-medium">{action.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column - Alerts & Calendar */}
                    <div className="col-span-3 space-y-6">
                        {/* Alerts */}
                        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur border border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="h-5 w-5 text-amber-400" />
                                <h3 className="font-bold text-lg">Cần Chú Ý</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-sm text-amber-300">MAU chỉ đạt 75% target</p>
                                    <p className="text-xs text-slate-500 mt-1">Cần +2,500 users</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-sm text-emerald-300">NPS đạt 93%</p>
                                    <p className="text-xs text-slate-500 mt-1">Vượt target</p>
                                </div>
                                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <p className="text-sm text-cyan-300">Cần onboard 8 gardens</p>
                                    <p className="text-xs text-slate-500 mt-1">Để đạt 50 target</p>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming */}
                        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur border border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-cyan-400" />
                                <h3 className="font-bold text-lg">Sắp Tới</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-cyan-400">15</p>
                                        <p className="text-[10px] text-slate-500">DEC</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Investor Update</p>
                                        <p className="text-xs text-slate-500">Monthly email</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-amber-400">20</p>
                                        <p className="text-[10px] text-slate-500">DEC</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Tet Campaign Launch</p>
                                        <p className="text-xs text-slate-500">Marketing kickoff</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-violet-400">25</p>
                                        <p className="text-[10px] text-slate-500">JAN</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Festival Hoa Sa Đéc</p>
                                        <p className="text-xs text-slate-500">Grand opening</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-slate-500 text-sm">
                    <p>AGRIOS.OS Chairman Dashboard v1.0 • Powered by 30 AI Agents</p>
                </div>
            </div>
        </div>
    );
}
