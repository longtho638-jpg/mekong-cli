'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Shield, TrendingUp, Clock, DollarSign, Filter, Command } from 'lucide-react';
import { FunnelChart, Funnel, Cell, ResponsiveContainer, PieChart, Pie, Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';

// Mock data
const dealPipelineData = [
    { stage: 'Sourcing', value: 12, fill: '#6b7280' },
    { stage: 'Screening', value: 8, fill: '#eab308' },
    { stage: 'DD', value: 5, fill: '#06b6d4' },
    { stage: 'Term Sheet', value: 3, fill: '#a855f7' },
    { stage: 'Closed', value: 2, fill: '#10b981' },
];

const dealSourceData = [
    { name: 'Inbound', value: 45, color: '#10b981' },
    { name: 'Outbound', value: 30, color: '#3b82f6' },
    { name: 'Referral', value: 25, color: '#a855f7' },
];

const timeToCloseData = [
    { quarter: 'Q1', days: 45 },
    { quarter: 'Q2', days: 38 },
    { quarter: 'Q3', days: 42 },
    { quarter: 'Q4', days: 35 },
];

interface Deal {
    id: string;
    name: string;
    stage: 'sourcing' | 'screening' | 'diligence' | 'termsheet' | 'closed';
    industry: string;
    fundingAsk: number;
    valuation: number;
    winScore: number;
    date: string;
}

const MOCK_DEALS: Deal[] = [
    {
        id: '1',
        name: 'EcoTech Vietnam',
        stage: 'termsheet',
        industry: 'CleanTech',
        fundingAsk: 500000,
        valuation: 3000000,
        winScore: 95,
        date: '2024-12-15',
    },
    {
        id: '2',
        name: 'HealthAI Plus',
        stage: 'diligence',
        industry: 'HealthTech',
        fundingAsk: 1000000,
        valuation: 5000000,
        winScore: 88,
        date: '2024-12-10',
    },
    {
        id: '3',
        name: 'EdVerse Academy',
        stage: 'screening',
        industry: 'EdTech',
        fundingAsk: 300000,
        valuation: 1500000,
        winScore: 72,
        date: '2024-12-08',
    },
    {
        id: '4',
        name: 'FoodConnect',
        stage: 'sourcing',
        industry: 'AgriTech',
        fundingAsk: 250000,
        valuation: 1000000,
        winScore: 0,
        date: '2024-12-18',
    },
];

const STAGE_COLORS: Record<string, string> = {
    sourcing: '#6b7280',
    screening: '#eab308',
    diligence: '#06b6d4',
    termsheet: '#a855f7',
    closed: '#10b981',
};

export default function DealFlowPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('VC');
    const tHubs = useTranslations('Hubs');
    const tAI = useTranslations('AI');

    const pathname = usePathname();
    const router = useRouter();
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const filteredDeals = selectedStage
        ? MOCK_DEALS.filter((d) => d.stage === selectedStage)
        : MOCK_DEALS;

    const totalPipeline = MOCK_DEALS.filter((d) => d.stage !== 'closed').reduce(
        (sum, d) => sum + d.fundingAsk,
        0
    );
    const closedCount = MOCK_DEALS.filter((d) => d.stage === 'closed').length;
    const avgConversion = 66.7; // Mock conversion rate

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-emerald-500/30 selection:text-emerald-300">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300 animate-pulse">
                            PRO MAX
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('vc_hub')}</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">{t('dealflow')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* AI Co-Pilot Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-300 font-bold">{tAI('copilot_active')}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        <Command className="w-3 h-3" />
                        <span>Search...</span>
                        <span className="bg-white/10 px-1 rounded text-[10px]">⌘K</span>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l
                                        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
                        {t('dealflow')}
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse box-content border-4 border-purple-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Win-Win-Win Deal Pipeline • Funnel Analysis • Source Attribution
                    </p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label={t('active_deals')}
                        value={MOCK_DEALS.length.toString()}
                        sub="+3 this month"
                        icon={<Filter className="w-4 h-4" />}
                    />
                    <StatCard
                        label="Pipeline Value"
                        value={`$${(totalPipeline / 1000).toFixed(0)}K`}
                        sub={t('valuation')}
                        icon={<DollarSign className="w-4 h-4" />}
                        color="text-emerald-400"
                    />
                    <StatCard
                        label={t('closed')}
                        value={closedCount.toString()}
                        sub="This quarter"
                        icon={<TrendingUp className="w-4 h-4" />}
                        color="text-green-400"
                    />
                    <StatCard
                        label={t('conversion_rate')}
                        value={`${avgConversion}%`}
                        sub={t('time_to_close') + ': 42d'}
                        icon={<Clock className="w-4 h-4" />}
                        color="text-purple-400"
                    />
                </div>

                {/* Visualizations Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Deal Pipeline Funnel */}
                    <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Deal Pipeline Funnel</h3>
                            <div className="text-xs text-gray-500">Conversion: 16.7%</div>
                        </div>

                        <ResponsiveContainer width="100%" height={300}>
                            <FunnelChart>
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{data.stage}</div>
                                                <div className="text-sm" style={{ color: data.fill }}>
                                                    {data.value} deals
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Funnel dataKey="value" data={dealPipelineData} isAnimationActive>
                                    {dealPipelineData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-5 gap-2 mt-4">
                            {dealPipelineData.map((stage) => (
                                <div
                                    key={stage.stage}
                                    className="text-center p-2 bg-white/5 rounded border border-white/10"
                                >
                                    <div className="text-[10px] text-gray-400 mb-1">{stage.stage}</div>
                                    <div className="text-lg font-bold" style={{ color: stage.fill }}>
                                        {stage.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deal Source Breakdown */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">{t('deal_source')}</h3>

                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={dealSourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    paddingAngle={3}
                                >
                                    {dealSourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="grid gap-2 mt-4">
                            {dealSourceData.map((source) => (
                                <div key={source.name} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                                        <span className="text-sm">{source.name}</span>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: source.color }}>
                                        {source.value}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Time to Close Chart */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-6">{t('time_to_close')} (Average Days)</h3>

                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={timeToCloseData}>
                            <XAxis dataKey="quarter" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                content={({ payload }) => {
                                    if (!payload || !payload[0]) return null;
                                    return (
                                        <div className="bg-black/90 border border-white/20 rounded p-2">
                                            <div className="text-xs mb-1">{payload[0].payload.quarter}</div>
                                            <div className="text-sm text-purple-400">{payload[0].value} days</div>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="days" fill="#a855f7" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Deal Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredDeals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                    ))}
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, sub, icon, color = 'text-white' }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                <div className={color}>{icon}</div>
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tight mb-1 ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">{sub}</div>
        </div>
    );
}

function DealCard({ deal }: { deal: Deal }) {
    const stageColor = STAGE_COLORS[deal.stage];

    return (
        <div
            className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
            style={{ borderTopWidth: 3, borderTopColor: stageColor }}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold mb-1">{deal.name}</h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{deal.industry}</span>
                </div>
                <div className="px-3 py-1 rounded text-xs" style={{ backgroundColor: `${stageColor}20`, color: stageColor }}>
                    {deal.stage.toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <div className="text-[10px] text-gray-500 mb-1">FUNDING ASK</div>
                    <div className="text-base font-bold text-emerald-400">${(deal.fundingAsk / 1000).toFixed(0)}K</div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 mb-1">VALUATION</div>
                    <div className="text-base font-bold text-cyan-400">${(deal.valuation / 1000000).toFixed(1)}M</div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-gray-500">Win Score</span>
                <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                        backgroundColor: deal.winScore >= 80 ? '#10b98120' : '#eab30820',
                        color: deal.winScore >= 80 ? '#10b981' : '#eab308',
                    }}
                >
                    {deal.winScore}%
                </span>
            </div>
        </div>
    );
}
