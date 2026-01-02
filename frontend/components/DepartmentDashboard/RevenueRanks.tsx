'use client';

import { Shield, Zap, Crown } from 'lucide-react';

const RANKS = [
    {
        id: 'generals',
        name: 'Tướng Quân (Equity)',
        icon: <Crown className="w-6 h-6 text-amber-400" />,
        stats: { hubs: 10, revenue: '$260K', growth: '+25%' },
        color: 'from-amber-500/20 to-yellow-600/5',
        borderColor: 'border-amber-500/30'
    },
    {
        id: 'cavalry',
        name: 'Kỵ Binh (Core/Growth)',
        icon: <Zap className="w-6 h-6 text-purple-400" />,
        stats: { hubs: 12, revenue: '$480K', growth: '+15%' },
        color: 'from-purple-500/20 to-blue-600/5',
        borderColor: 'border-purple-500/30'
    },
    {
        id: 'infantry',
        name: 'Bộ Binh (Basic/Special)',
        icon: <Shield className="w-6 h-6 text-green-400" />,
        stats: { hubs: 58, revenue: '$282K', growth: '+8%' },
        color: 'from-green-500/20 to-emerald-600/5',
        borderColor: 'border-green-500/30'
    }
];

export function RevenueRanks() {
    return (
        <div className="section-in-fluid">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>⚔️</span> The Army (Binh Lực Hubs)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {RANKS.map((rank) => (
                    <div
                        key={rank.id}
                        className={`relative overflow-hidden rounded-xl p-5 border ${rank.borderColor} bg-gradient-to-br ${rank.color} spotlight-card group hover:-translate-y-1 transition-transform duration-300`}
                    >
                        {/* Rank Icon */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5 backdrop-blur-sm">
                                {rank.icon}
                            </div>
                            <div className="text-xs font-mono opacity-50 px-2 py-1 bg-black/20 rounded">
                                Tier {rank.id === 'generals' ? 'S' : rank.id === 'cavalry' ? 'A' : 'B'}
                            </div>
                        </div>

                        {/* Rank Name */}
                        <h4 className="text-base font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">
                            {rank.name}
                        </h4>

                        <div className="h-px w-full bg-white/10 my-3" />

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-lg font-bold text-white">{rank.stats.hubs}</div>
                                <div className="text-[10px] uppercase text-gray-500">Units</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-green-300">{rank.stats.revenue}</div>
                                <div className="text-[10px] uppercase text-gray-500">Rev</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-blue-300">{rank.stats.growth}</div>
                                <div className="text-[10px] uppercase text-gray-500">MoM</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
