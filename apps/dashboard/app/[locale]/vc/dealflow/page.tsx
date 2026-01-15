'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { TrendingUp, Clock, DollarSign, Filter } from 'lucide-react';
import { FunnelChart, Funnel, Cell, ResponsiveContainer, PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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

const MOCK_DEALS = [
    { id: '1', name: 'EcoTech Vietnam', stage: 'termsheet', industry: 'CleanTech', fundingAsk: 500000, valuation: 3000000, winScore: 95 },
    { id: '2', name: 'HealthAI Plus', stage: 'diligence', industry: 'HealthTech', fundingAsk: 1000000, valuation: 5000000, winScore: 88 },
    { id: '3', name: 'EdVerse Academy', stage: 'screening', industry: 'EdTech', fundingAsk: 300000, valuation: 1500000, winScore: 72 },
    { id: '4', name: 'FoodConnect', stage: 'sourcing', industry: 'AgriTech', fundingAsk: 250000, valuation: 1000000, winScore: 0 },
];

const STAGE_COLORS: Record<string, string> = { sourcing: '#6b7280', screening: '#eab308', diligence: '#06b6d4', termsheet: '#a855f7', closed: '#10b981' };

export default function DealFlowPage() {
    const t = useTranslations('VC');
    const totalPipeline = MOCK_DEALS.filter(d => d.stage !== 'closed').reduce((sum, d) => sum + d.fundingAsk, 0);

    return (
        <MD3AppShell title="🎯 Deal Flow" subtitle="Win-Win-Win Pipeline • Funnel Analysis • Source Attribution">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('active_deals')}</div>
                        <Filter className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold">{MOCK_DEALS.length}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Pipeline Value</div>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">${(totalPipeline / 1000).toFixed(0)}K</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('closed')}</div>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-green-400">2</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('conversion_rate')}</div>
                        <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">66.7%</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe lg:col-span-2">
                    <h3 className="text-lg font-bold mb-6">Deal Pipeline Funnel</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <FunnelChart>
                            <Tooltip />
                            <Funnel dataKey="value" data={dealPipelineData} isAnimationActive>
                                {dealPipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-5 gap-2 mt-4">
                        {dealPipelineData.map(s => (
                            <div key={s.stage} className="text-center p-2 bg-white/5 rounded">
                                <div className="text-[10px] text-gray-400">{s.stage}</div>
                                <div className="text-lg font-bold" style={{ color: s.fill }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">{t('deal_source')}</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={dealSourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                {dealSourceData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                        {dealSourceData.map(s => (
                            <div key={s.name} className="flex justify-between p-2 bg-white/5 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-sm">{s.name}</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}%</span>
                            </div>
                        ))}
                    </div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe mb-6">
                <h3 className="text-lg font-bold mb-6">{t('time_to_close')} (Days)</h3>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={timeToCloseData}>
                        <XAxis dataKey="quarter" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="days" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </MD3Surface>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {MOCK_DEALS.map(deal => (
                    <div key={deal.id} className="border-t-[3px]" style={{ borderTopColor: STAGE_COLORS[deal.stage] }}>
                        <MD3Surface shape="large" className="auto-safe rounded-t-none">
                            <div className="flex justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{deal.name}</h3>
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{deal.industry}</span>
                                </div>
                                <div className="px-3 py-1 rounded text-xs" style={{ backgroundColor: `${STAGE_COLORS[deal.stage]}20`, color: STAGE_COLORS[deal.stage] }}>
                                    {deal.stage.toUpperCase()}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-[10px] text-gray-500">FUNDING ASK</div>
                                    <div className="text-base font-bold text-emerald-400">${(deal.fundingAsk / 1000).toFixed(0)}K</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500">VALUATION</div>
                                    <div className="text-base font-bold text-cyan-400">${(deal.valuation / 1000000).toFixed(1)}M</div>
                                </div>
                            </div>
                        </MD3Surface>
                    </div>
                ))}
            </div>
        </MD3AppShell>
    );
}
