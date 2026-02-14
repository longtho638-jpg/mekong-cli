'use client';

import { useState } from 'react';
import {
    PieChart,
    BarChart3,
    DollarSign,
    Gem,
    ClipboardList,
    Target,
    Bot,
    TrendingUp,
    Activity
} from 'lucide-react';
import { CapTableTab } from '@/components/admin/leadership/CapTableTab';
import { KPITab } from '@/components/admin/leadership/KPITab';
import { FinancialTab } from '@/components/admin/leadership/FinancialTab';
import { ESOPTab } from '@/components/admin/leadership/ESOPTab';
import { BudgetTab } from '@/components/admin/leadership/BudgetTab';
import { RocksTab } from '@/components/admin/leadership/RocksTab';
import { AITab } from '@/components/admin/leadership/AITab';
import { AgentsTab } from '@/components/admin/leadership/AgentsTab';

// Tab Configuration
type TabId = 'cap-table' | 'kpis' | 'financial' | 'esop' | 'budget' | 'rocks' | 'ai' | 'agents';

interface Tab {
    id: TabId;
    label: string;
    labelVi: string;
    icon: any;
}

const tabs: Tab[] = [
    { id: 'cap-table', label: 'Cap Table', labelVi: 'Cổ Phần', icon: PieChart },
    { id: 'budget', label: 'Budget', labelVi: 'Ngân sách', icon: ClipboardList },
    { id: 'kpis', label: 'KPIs', labelVi: 'Chỉ số', icon: Activity },
    { id: 'financial', label: 'Financials', labelVi: 'Tài chính', icon: DollarSign },
    { id: 'esop', label: 'ESOP', labelVi: 'Quyền chọn', icon: Gem },
    { id: 'rocks', label: 'Rocks', labelVi: 'Mục tiêu', icon: Target },
    { id: 'agents', label: '30 Agents', labelVi: 'Đội AI', icon: Bot },
    { id: 'ai', label: 'AI Pilot', labelVi: 'Trợ lý', icon: Bot },
];

export default function LeadershipDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('cap-table');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'cap-table': return <CapTableTab />;
            case 'kpis': return <KPITab />;
            case 'financial': return <FinancialTab />;
            case 'esop': return <ESOPTab />;
            case 'budget': return <BudgetTab />;
            case 'rocks': return <RocksTab />;
            case 'agents': return <AgentsTab />;
            case 'ai': return <AITab />;
            default: return <CapTableTab />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
            {/* Top Navigation Bar / Command Center */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 shadow-2xl">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <TrendingUp className="text-white h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">
                                    AGRIOS<span className="text-emerald-400">.OS</span> Leadership
                                </h1>
                                <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                                    Series A Prep • Q4 2026 • Live Data
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">System Normal</span>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-slate-400">Runway</p>
                                <p className="text-sm font-mono font-bold text-cyan-400">60 Months</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs - Scrollable */}
                    <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
                                    className={`
                                        group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                                        ${isActive
                                            ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                        }
                                    `}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                    <div className="flex flex-col items-start">
                                        <span className={`text-sm font-bold ${isActive ? 'text-white' : ''}`}>{tab.label}</span>
                                        {isActive && <span className="text-[10px] text-cyan-400/80 font-medium">{tab.labelVi}</span>}
                                    </div>

                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl min-h-[600px] p-6 text-slate-100 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}
