"use client";

import React, { useState, useEffect } from 'react';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { SparklesCore } from '@/components/ui/sparkles';
import { Meteors } from '@/components/ui/meteors';
import { Spotlight, SpotlightCard } from '@/components/ui/spotlight';

// Types
interface ChapterScore {
    chapter: string;
    name: string;
    score: number;
    description: string;
    icon: string;
    link?: string;
}

interface CriticalIssue {
    id: number;
    issue: string;
    severity: 'critical' | 'high' | 'medium';
}

// Demo Data
const chapters: ChapterScore[] = [
    { chapter: "1", name: "Kế Hoạch", score: 75, description: "Assessment & SWOT", icon: "📋" },
    { chapter: "2", name: "Tác Chiến", score: 60, description: "Runway & Burn Rate", icon: "⏱️" },
    { chapter: "3", name: "Mưu Công", score: 85, description: "Win-Without-Fighting", icon: "🎯" },
    { chapter: "4", name: "Hình Thế", score: 70, description: "Moat Analysis", icon: "🏰" },
    { chapter: "5", name: "Thế Trận", score: 65, description: "Growth Strategy", icon: "📈" },
    { chapter: "6", name: "Hư Thực", score: 55, description: "Anti-Dilution Shield", icon: "🛡️", link: "/shield" },
    { chapter: "7", name: "Quân Tranh", score: 80, description: "Speed & Maneuvering", icon: "⚡" },
    { chapter: "8", name: "Cửu Biến", score: 90, description: "Pivot Framework", icon: "🔄" },
    { chapter: "9", name: "Hành Quân", score: 72, description: "Market Expansion", icon: "🗺️" },
    { chapter: "10", name: "Địa Hình", score: 68, description: "Competitive Intel", icon: "🔭" },
    { chapter: "11", name: "Cửu Địa", score: 45, description: "Crisis Management", icon: "🚨" },
    { chapter: "12", name: "Hỏa Công", score: 78, description: "Disruption Strategy", icon: "🔥" },
    { chapter: "13", name: "Dụng Gián", score: 82, description: "VC Intelligence", icon: "🕵️" },
];

const criticalIssues: CriticalIssue[] = [
    { id: 1, issue: "Founder does not control board majority", severity: "critical" },
    { id: 2, issue: "Burn rate exceeds 18-month runway", severity: "high" },
    { id: 3, issue: "No anti-dilution protection in place", severity: "critical" },
    { id: 4, issue: "Key-man clause missing in investor agreement", severity: "medium" },
];

const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-green-500';
    if (score >= 60) return 'from-amber-400 to-yellow-500';
    if (score >= 40) return 'from-orange-400 to-red-500';
    return 'from-red-500 to-rose-600';
};

const getSeverityStyle = (severity: string) => {
    switch (severity) {
        case 'critical': return 'bg-red-500/20 border-l-4 border-red-500';
        case 'high': return 'bg-orange-500/20 border-l-4 border-orange-500';
        default: return 'bg-amber-500/20 border-l-4 border-amber-500';
    }
};

export default function WarRoomPage() {
    const [battleReadiness, setBattleReadiness] = useState(0);

    useEffect(() => {
        const avg = Math.round(chapters.reduce((sum, ch) => sum + ch.score, 0) / chapters.length);
        const timer = setTimeout(() => setBattleReadiness(avg), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            {/* Spotlight Effect */}
            <Spotlight className="top-0 left-0 md:left-60 md:-top-20" fill="#3b82f6" />

            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 p-8">
                {/* Header */}
                <header className="mb-12 text-center">
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mb-4">
                        🏯 WAR ROOM
                    </h1>
                    <p className="text-slate-400 text-lg">Binh Pháp Command Center • "Không đánh mà thắng"</p>
                </header>

                {/* Battle Readiness Gauge with Sparkles */}
                <section className="mb-16">
                    <SpotlightCard className="max-w-2xl mx-auto bg-slate-800/30 backdrop-blur-xl border border-slate-700/50">
                        <div className="relative">
                            {/* Sparkles Background */}
                            <div className="absolute inset-0 h-full w-full">
                                <SparklesCore
                                    id="battle-sparkles"
                                    background="transparent"
                                    minSize={0.4}
                                    maxSize={1}
                                    particleDensity={40}
                                    particleColor="#ffd700"
                                    speed={0.5}
                                />
                            </div>

                            <div className="relative z-10 text-center py-8">
                                <h2 className="text-2xl font-semibold mb-6">⚔️ Battle Readiness</h2>
                                <div className="relative inline-block">
                                    <span className={`text-8xl font-bold bg-gradient-to-r ${getScoreColor(battleReadiness)} bg-clip-text text-transparent transition-all duration-1000`}>
                                        {battleReadiness}
                                    </span>
                                    <span className="text-4xl text-slate-400 ml-2">%</span>
                                </div>

                                {/* Animated Progress Bar */}
                                <div className="mt-8 h-4 bg-slate-700 rounded-full overflow-hidden max-w-md mx-auto">
                                    <div
                                        className={`h-full bg-gradient-to-r ${getScoreColor(battleReadiness)} transition-all duration-1000 ease-out rounded-full`}
                                        style={{ width: `${battleReadiness}%` }}
                                    />
                                </div>

                                <p className="text-sm text-slate-500 mt-4">
                                    {battleReadiness >= 80 ? "🟢 BATTLE READY" :
                                        battleReadiness >= 60 ? "🟡 PREPARING" :
                                            battleReadiness >= 40 ? "🟠 NOT READY" : "🔴 CRITICAL"}
                                </p>
                            </div>
                        </div>
                    </SpotlightCard>
                </section>

                {/* 13 Chapters Grid with 3D Cards */}
                <section className="mb-16">
                    <h2 className="text-3xl font-semibold mb-8 text-center">📚 13 Chapters of Binh Pháp</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {chapters.map((ch) => (
                            <CardContainer key={ch.chapter} className="w-full" containerClassName="h-full">
                                <CardBody className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 h-full group hover:border-amber-500/50 transition-all duration-300">
                                    <CardItem translateZ={50} className="w-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-3xl">{ch.icon}</span>
                                            <CardItem translateZ={80}>
                                                <span className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(ch.score)} bg-clip-text text-transparent`}>
                                                    {ch.score}%
                                                </span>
                                            </CardItem>
                                        </div>
                                    </CardItem>

                                    <CardItem translateZ={30} className="w-full">
                                        {ch.link ? (
                                            <a href={ch.link} className="block hover:text-amber-400 transition-colors">
                                                <h3 className="font-semibold text-lg mb-1">{ch.chapter}. {ch.name}</h3>
                                                <p className="text-sm text-slate-400">{ch.description}</p>
                                            </a>
                                        ) : (
                                            <>
                                                <h3 className="font-semibold text-lg mb-1">{ch.chapter}. {ch.name}</h3>
                                                <p className="text-sm text-slate-400">{ch.description}</p>
                                            </>
                                        )}
                                    </CardItem>

                                    {/* Progress indicator */}
                                    <CardItem translateZ={20} className="w-full mt-4">
                                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${getScoreColor(ch.score)} rounded-full`}
                                                style={{ width: `${ch.score}%` }}
                                            />
                                        </div>
                                    </CardItem>
                                </CardBody>
                            </CardContainer>
                        ))}
                    </div>
                </section>

                {/* Critical Issues with Meteors */}
                <section className="mb-16">
                    <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 overflow-hidden">
                        {/* Meteors */}
                        <Meteors number={15} />

                        <div className="relative z-10">
                            <h2 className="text-2xl font-semibold mb-6">🚨 Critical Issues</h2>
                            <div className="space-y-4">
                                {criticalIssues.map((issue) => (
                                    <div
                                        key={issue.id}
                                        className={`${getSeverityStyle(issue.severity)} px-6 py-4 rounded-xl flex items-center gap-4 backdrop-blur-sm`}
                                    >
                                        <span className="text-xl">
                                            {issue.severity === 'critical' ? '🚨' : issue.severity === 'high' ? '🔴' : '🟡'}
                                        </span>
                                        <span className="flex-1">{issue.issue}</span>
                                        <span className="text-xs uppercase tracking-wider text-slate-500">{issue.severity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* WIN-WIN-WIN Golden Panel */}
                <section className="mb-16">
                    <SpotlightCard className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-500/30">
                        <h2 className="text-3xl font-semibold mb-8 text-center text-amber-200">🏆 WIN-WIN-WIN Architecture</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            <div className="p-6 bg-slate-800/50 rounded-2xl border border-amber-500/20 hover:border-amber-500/50 transition-colors">
                                <span className="text-4xl mb-4 block">👑</span>
                                <h3 className="text-xl font-semibold text-amber-300 mb-2">ANH (Owner)</h3>
                                <p className="text-slate-400 text-sm">Portfolio equity + Cash flow + Legacy building</p>
                            </div>
                            <div className="p-6 bg-slate-800/50 rounded-2xl border border-amber-500/20 hover:border-amber-500/50 transition-colors">
                                <span className="text-4xl mb-4 block">🏢</span>
                                <h3 className="text-xl font-semibold text-amber-300 mb-2">AGENCY</h3>
                                <p className="text-slate-400 text-sm">Deal flow + Knowledge + Infrastructure growth</p>
                            </div>
                            <div className="p-6 bg-slate-800/50 rounded-2xl border border-amber-500/20 hover:border-amber-500/50 transition-colors">
                                <span className="text-4xl mb-4 block">🚀</span>
                                <h3 className="text-xl font-semibold text-amber-300 mb-2">STARTUP</h3>
                                <p className="text-slate-400 text-sm">Protection + Strategy + Network access</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <p className="text-amber-400 font-medium">❌ If any party LOSES → STOP</p>
                            <p className="text-emerald-400 font-medium mt-2">✅ All WIN → PROCEED</p>
                        </div>
                    </SpotlightCard>
                </section>

                {/* Footer */}
                <footer className="text-center text-slate-500 text-sm">
                    <p>🏯 Agency OS v2.0 - Binh Pháp Venture Studio</p>
                    <p className="mt-1">168 Core Modules • 96 Commits • 22 Department Hubs</p>
                </footer>
            </div>
        </div>
    );
}
