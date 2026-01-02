'use client';

import React from 'react';
import { Card, Grid, Flex, Text, Metric, Badge, ProgressBar } from '@tremor/react';
import { Shield, TrendingUp, Users, Crown, Zap } from 'lucide-react';

const RANKS = [
    {
        id: 'infantry',
        name: 'Bộ Binh (Standard)',
        icon: <Users className="w-5 h-5" />,
        stats: { hubs: 65, revenue: '$25K', growth: '+12%' },
        color: 'from-blue-500/20 to-cyan-400/5',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'cavalry',
        name: 'Kỵ Binh (Specialized)',
        icon: <Zap className="w-5 h-5" />,
        stats: { hubs: 12, revenue: '$85K', growth: '+18%' },
        color: 'from-purple-500/20 to-pink-500/5',
        borderColor: 'border-purple-500/30'
    },
    {
        id: 'generals',
        name: 'Tướng Quân (Equity)',
        icon: <Crown className="w-5 h-5 text-amber-400" />,
        stats: { hubs: 5, revenue: '$260K', growth: '+25%' },
        color: 'from-amber-500/20 to-yellow-600/5',
        borderColor: 'border-amber-500/30'
    }
];

export function RevenueRanks() {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3 text-green-500" />
                    The Army (Lực Lượng Chiến Đấu)
                </h3>
                <Badge size="xs" color="emerald">LIVE MONITOR</Badge>
            </div>

            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
                {RANKS.map((rank) => (
                    <Card key={rank.id} className="bg-[#0A0A0A] border-white/5 ring-0 p-4 rounded-lg hover:border-green-500/20 transition-all group hover:scale-[1.01]">
                        <Flex alignItems="start" className="mb-4">
                            <div className={`p-2 rounded bg-white/5 border border-white/5 ${rank.id === 'generals' ? 'text-amber-400' : 'text-white/70'}`}>
                                {rank.icon}
                            </div>
                            <div className="text-right">
                                <Text className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">REVENUE</Text>
                                <Metric className="text-white font-mono text-xl">{rank.stats.revenue}</Metric>
                            </div>
                        </Flex>

                        <div>
                            <Flex className="mb-1">
                                <Text className="text-white font-medium text-sm">{rank.name}</Text>
                                <div className={`text-xs font-bold ${rank.id === 'infantry' ? 'text-blue-400' : rank.id === 'cavalry' ? 'text-purple-400' : 'text-amber-400'}`}>
                                    {rank.stats.growth}
                                </div>
                            </Flex>
                            <Text className="text-white/30 text-[10px] mb-2">{rank.stats.hubs} Combat Units</Text>
                            <ProgressBar
                                value={rank.id === 'infantry' ? 85 : rank.id === 'cavalry' ? 45 : 25}
                                color={rank.id === 'generals' ? 'amber' : rank.id === 'cavalry' ? 'purple' : 'blue'}
                                className="h-1"
                            />
                        </div>
                    </Card>
                ))}
            </Grid>
        </div>
    );
}
