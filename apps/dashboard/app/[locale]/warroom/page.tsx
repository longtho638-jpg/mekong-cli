'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { Cpu, DollarSign, Activity, Zap, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';

const generateMetricData = () => Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: Math.floor(Math.random() * 30) + 70,
}));

export default function WarroomPage() {
    const { analytics } = useAnalytics();
    const t = useTranslations('Strategy');

    const [currentTime, setCurrentTime] = useState(new Date());
    const [cpuData] = useState(generateMetricData());
    const [metrics, setMetrics] = useState({ cpu: 72, revenue: 85420, cost: 12340, agents: 24 });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const metricsTimer = setInterval(() => {
            setMetrics(prev => ({
                cpu: Math.max(60, Math.min(95, prev.cpu + (Math.random() - 0.5) * 5)),
                revenue: prev.revenue + Math.floor(Math.random() * 100),
                cost: prev.cost + Math.floor(Math.random() * 10),
                agents: Math.max(20, Math.min(30, prev.agents + Math.floor(Math.random() * 3) - 1)),
            }));
        }, 2000);
        return () => { clearInterval(timer); clearInterval(metricsTimer); };
    }, []);

    const commandLogs = [
        { time: '19:42:15', cmd: 'AGENT-SCOUT', status: 'OK', msg: 'Market scan complete: 3 new opportunities' },
        { time: '19:41:52', cmd: 'AGENT-ANALYST', status: 'OK', msg: 'Financial model updated' },
        { time: '19:41:20', cmd: 'AGENT-EXECUTOR', status: 'WARN', msg: 'Low runway detected: 4 months' },
        { time: '19:40:58', cmd: 'AGENT-GUARDIAN', status: 'OK', msg: 'Win-Win-Win check passed' },
        { time: '19:40:12', cmd: 'SYSTEM', status: 'OK', msg: 'All agents operational' },
    ];

    const agentGrid = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        status: Math.random() > 0.9 ? 'error' : Math.random() > 0.7 ? 'warning' : 'active',
    }));

    return (
        <MD3AppShell title="🏯 War Room" subtitle={`Command Center • ${currentTime.toLocaleTimeString()}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">CPU Load</div>
                        <Cpu className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-red-400">{metrics.cpu.toFixed(0)}%</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Revenue</div>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">${metrics.revenue.toLocaleString()}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Cost</div>
                        <Activity className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">${metrics.cost.toLocaleString()}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Agents</div>
                        <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{metrics.agents}/30</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6 text-red-400">System Load</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={cpuData}>
                            <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Agent Health Grid (100)</h3>
                    <div className="grid grid-cols-10 gap-1">
                        {agentGrid.map(agent => (
                            <div key={agent.id} className={`w-full aspect-square rounded-sm ${agent.status === 'error' ? 'bg-red-500' :
                                    agent.status === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'
                                } opacity-70`} />
                        ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" /> Active</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded" /> Warning</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> Error</div>
                    </div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Command Log
                </h3>
                <div className="space-y-2 font-mono text-sm">
                    {commandLogs.map((log, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded border border-white/10">
                            <span className="text-gray-500">{log.time}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>{log.status}</span>
                            <span className="text-red-400 font-bold">{log.cmd}</span>
                            <span className="text-gray-400 flex-1">{log.msg}</span>
                        </div>
                    ))}
                </div>
            </MD3Surface>
        </MD3AppShell>
    );
}
