'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Log {
    id: string;
    time: string;
    agent: string;
    action: string;
    dept: 'Marketing' | 'Sales' | 'Tech' | 'Finance' | 'Executive';
    status: 'success' | 'processing' | 'error';
}

const SIMULATION_SCRIPT = [
    { time: '08:00', agent: 'Agent 21 (CEO)', dept: 'Executive', action: '🌅 Morning Standup: Activating all departments.' },
    { time: '08:15', agent: 'Agent 07 (Brand)', dept: 'Marketing', action: 'Analyzing yesterday\'s sentiment. Positive trending #SaDecFlowerHunt.' },
    { time: '08:45', agent: 'Agent 11 (Content)', dept: 'Marketing', action: '✍️ Generated 5 SEO Blog posts about "Tet Flowers".' },
    { time: '09:00', agent: 'Agent 08 (Social)', dept: 'Marketing', action: '🚀 Scheduling 3 TikTok videos for peak hours.' },
    { time: '10:30', agent: 'Agent 19 (Tech)', dept: 'Tech', action: '🛡️ System Alert: High traffic detected. Auto-scaling servers.' },
    { time: '11:00', agent: 'Agent 13 (Sales)', dept: 'Sales', action: '💰 Abandoned Cart Recovery: Sent 50 emails. 12 recovered.' },
    { time: '12:00', agent: 'Agent 21 (CEO)', dept: 'Executive', action: '📊 Mid-day Review: Revenue at $2,400. On track.' },
    { time: '13:30', agent: 'Agent 05 (Biz Model)', dept: 'Finance', action: 'Optimizing ad spend. Shifted budget to "Mai Vàng" campaign.' },
    { time: '15:00', agent: 'Agent 12 (B2B)', dept: 'Sales', action: '🤝 Contract Signed: Ho Chi Minh City Floral Expo (Value: $15k).' },
    { time: '16:00', agent: 'Agent 20 (Data)', dept: 'Tech', action: 'Backup database. Syncing with Data Room.' },
    { time: '17:00', agent: 'Agent 16 (CFO)', dept: 'Finance', action: '💸 Processing Daily Payouts to 120 Farmers.' },
    { time: '18:00', agent: 'Agent 21 (CEO)', dept: 'Executive', action: '🏁 End of Day Report: Revenue $5,200 (104% Target). System Sleep Mode.' },
];

export default function AutonomousDashboard() {
    const [isSimulating, setIsSimulating] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ revenue: 1200, users: 450, farmers: 21 });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        setLogs([
            { id: 'init', time: 'LIVE', agent: 'System', dept: 'Tech', status: 'success', action: 'System Online. Waiting for CEO trigger...' }
        ]);
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const runSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setLogs([]);
        setProgress(0);
        let step = 0;

        const interval = setInterval(() => {
            if (step >= SIMULATION_SCRIPT.length) {
                clearInterval(interval);
                setIsSimulating(false);
                return;
            }

            const event = SIMULATION_SCRIPT[step];

            // Add Log
            setLogs(prev => [...prev, {
                id: Math.random().toString(),
                time: event.time,
                agent: event.agent,
                dept: event.dept as any,
                action: event.action,
                status: 'success'
            }]);

            // Update Mock Stats dynamicallly
            if (event.dept === 'Sales') setStats(s => ({ ...s, revenue: s.revenue + 500 }));
            if (event.dept === 'Marketing') setStats(s => ({ ...s, users: s.users + 25 }));
            if (event.dept === 'Finance') setStats(s => ({ ...s, farmers: s.farmers + 1 }));

            // Update Progress
            setProgress(((step + 1) / SIMULATION_SCRIPT.length) * 100);

            step++;
        }, 800); // 0.8s per step
    };

    return (
        <div className="p-8 space-y-6 bg-stone-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                        🧠 Autonomous Command Center
                    </h1>
                    <p className="text-stone-500">Orchestrating the "Conducting AI" Workforce</p>
                </div>
                <Button
                    size="lg"
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className={`
                        ${isSimulating ? 'bg-stone-200 text-stone-500' : 'bg-stone-900 text-white hover:bg-stone-800'}
                        transition-all shadow-lg
                    `}
                >
                    {isSimulating ? 'Running Simulation...' : '▶️ Trigger "Day in Life"'}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Real-time Revenue" value={`$${stats.revenue.toLocaleString()}`} icon="💰" trend="+12%" />
                <KPICard title="Active Users" value={stats.users.toLocaleString()} icon="👥" trend="+5%" />
                <KPICard title="Farmers Online" value={stats.farmers.toString()} icon="🚜" trend="+2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Termimal */}
                <Card className="lg:col-span-2 border-stone-200 shadow-md h-[500px] flex flex-col">
                    <CardHeader className="bg-stone-100/50 border-b border-stone-200 py-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-mono uppercase text-stone-500">System Logs</CardTitle>
                            <Badge variant={isSimulating ? "default" : "outline"} className={isSimulating ? "bg-green-500 hover:bg-green-600" : ""}>
                                {isSimulating ? "🟢 EXECUTION LIVE" : "⚪ STANDBY"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        {/* Progress Bar */}
                        {isSimulating && (
                            <Progress value={progress} className="h-1 rounded-none bg-stone-100" />
                        )}
                        <ScrollArea className="h-full p-4" ref={scrollRef as any}>
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="group flex items-start gap-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="min-w-[60px] font-mono text-stone-400 text-xs mt-1">
                                            {log.time}
                                        </div>
                                        <DeptBadge dept={log.dept} />
                                        <div className="flex-1 text-stone-700">
                                            <span className="font-semibold text-stone-900 mr-2">{log.agent}:</span>
                                            {log.action}
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && !isSimulating && (
                                    <div className="text-center text-stone-400 mt-20 italic">
                                        System ready. Press "Trigger" to start simulation.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Agent Status */}
                <Card className="border-stone-200 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base">Agent Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AgentStatus name="Agent 21 (CEO)" role="Orchestration" status={isSimulating ? 'active' : 'idle'} />
                        <Separator />
                        <AgentStatus name="Agent 11 (Marketing)" role="Content Gen" status={isSimulating ? 'active' : 'idle'} />
                        <AgentStatus name="Agent 13 (Sales)" role="Conversion" status={isSimulating ? 'active' : 'idle'} />
                        <AgentStatus name="Agent 19 (Tech)" role="Infrastructure" status={isSimulating ? 'active' : 'idle'} />
                        <AgentStatus name="Agent 16 (Finance)" role="P&L Mgmt" status={isSimulating ? 'active' : 'idle'} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Sub-components
function KPICard({ title, value, icon, trend }: any) {
    return (
        <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-stone-500">{title}</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1">{value}</h3>
                </div>
                <div className="text-right">
                    <div className="text-3xl">{icon}</div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full mt-2 inline-block">
                        {trend}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function DeptBadge({ dept }: { dept: string }) {
    const colors: Record<string, string> = {
        'Marketing': 'bg-pink-50 text-pink-700 border-pink-200',
        'Sales': 'bg-blue-50 text-blue-700 border-blue-200',
        'Tech': 'bg-purple-50 text-purple-700 border-purple-200',
        'Finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Executive': 'bg-stone-100 text-stone-800 border-stone-300',
    };

    return (
        <Badge variant="outline" className={`${colors[dept] || 'bg-gray-100'} w-[90px] justify-center`}>
            {dept}
        </Badge>
    );
}

function AgentStatus({ name, role, status }: any) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-sm text-stone-900">{name}</p>
                <p className="text-xs text-stone-500">{role}</p>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`} />
                <span className="text-xs text-stone-500 capitalize">{status}</span>
            </div>
        </div>
    );
}
