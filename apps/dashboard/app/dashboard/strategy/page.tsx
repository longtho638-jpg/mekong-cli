'use client'

import React from 'react'
import { AgencyCard } from '@/components/ui/agency-card'
import { AgencyButton } from '@/components/ui/agency-button'
import { Target, Map, Shield, Zap } from 'lucide-react'

export default function StrategyPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Strategy Hub (Binh Pháp)</h2>
                    <p className="text-neutral-400">War room for strategic planning</p>
                </div>
                <AgencyButton variant="magnetic" className="gap-2">
                    <Zap className="w-4 h-4" />
                    New Campaign
                </AgencyButton>
            </div>

            {/* Binh Phap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Ngũ Sự (5 Factors)', desc: 'Analyze Alignment', icon: Target, color: 'text-emerald-400' },
                    { title: 'Địa Hình (Terrain)', desc: 'Market Analysis', icon: Map, color: 'text-blue-400' },
                    { title: 'Cửu Địa (9 Grounds)', desc: 'Situational Awareness', icon: Shield, color: 'text-amber-400' },
                    { title: 'Hỏa Công (Fire)', desc: 'Viral Attacks', icon: Zap, color: 'text-red-400' },
                ].map((card) => (
                    <AgencyCard key={card.title} variant="glass-pro" className="hover-lift cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <span className="text-xs font-mono text-neutral-500">CH. {Math.floor(Math.random() * 13) + 1}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                        <p className="text-sm text-neutral-400">{card.desc}</p>
                    </AgencyCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AgencyCard variant="glass" className="h-[600px] relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                        <div className="relative z-10 p-6">
                            <h3 className="text-lg font-bold text-white mb-2">Grand Strategy Map</h3>
                            <p className="text-sm text-neutral-400">Current Phase: <span className="text-emerald-400 font-bold">Scaling (Quân Tranh)</span></p>
                            
                            <div className="mt-12 flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <div className="inline-block p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                                        Active Campaign
                                    </div>
                                    <h1 className="text-4xl font-bold text-white tracking-tight">Operation: Moonshot</h1>
                                </div>
                            </div>
                        </div>
                    </AgencyCard>
                </div>

                <div className="space-y-6">
                    <AgencyCard variant="neon">
                        <h3 className="text-lg font-bold text-white mb-4">Win Conditions</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Revenue Target', val: '82%', color: 'bg-emerald-500' },
                                { label: 'Market Share', val: '15%', color: 'bg-blue-500' },
                                { label: 'Customer LTV', val: '94%', color: 'bg-purple-500' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-neutral-300">{item.label}</span>
                                        <span className="text-white font-bold">{item.val}</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: item.val }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AgencyCard>

                    <AgencyCard variant="glass-pro">
                        <h3 className="text-lg font-bold text-white mb-4">Advisor Notes</h3>
                        <p className="text-sm text-neutral-400 italic">
                            "Speed is the essence of war. Take advantage of the enemy's unpreparedness; travel by unexpected routes and strike him where he has taken no precautions."
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-700" />
                            <span className="text-xs text-neutral-500">Sun Tzu AI</span>
                        </div>
                    </AgencyCard>
                </div>
            </div>
        </div>
    )
}
