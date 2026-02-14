import { kpiData } from '@/lib/admin/leadership-data';
import { Activity, Users, DollarSign, Leaf, ShoppingCart, MessageCircle } from 'lucide-react';

export function KPITab() {
    const getIcon = (name: string) => {
        if (name.includes('MAU')) return Users;
        if (name.includes('MRR')) return DollarSign;
        if (name.includes('Gardens')) return Leaf;
        if (name.includes('Orders')) return ShoppingCart;
        if (name.includes('NPS')) return MessageCircle;
        return Activity;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                    KPI Dashboard <span className="text-slate-500 text-sm font-mono ml-2">Phase {kpiData.currentPhase}: Seed</span>
                </h2>
                <div className="flex gap-2 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> On Track</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Improving</span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiData.kpis.map((kpi) => {
                    const progress = (kpi.current / kpi.target) * 100;
                    const isMet = progress >= 100;
                    const Icon = getIcon(kpi.name);

                    return (
                        <div key={kpi.name} className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm group hover:border-white/10 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Icon className="w-16 h-16 text-white" />
                            </div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <Icon className={`w-6 h-6 ${kpi.owner === 'CEO' ? 'text-blue-400' : 'text-green-400'}`} />
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${kpi.owner === 'CEO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                    {kpi.owner}
                                </span>
                            </div>

                            <div className="mb-1 relative z-10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{kpi.nameVi}</p>
                                <h3 className="text-2xl font-bold text-white">{kpi.name}</h3>
                            </div>

                            <div className="flex items-end gap-2 mb-4 relative z-10">
                                <span className="text-3xl font-mono font-bold text-white tracking-tight">
                                    {kpi.unit === '$' ? '$' : ''}{kpi.current.toLocaleString()}
                                </span>
                                <span className="text-slate-500 mb-1 text-sm font-mono">
                                    / {kpi.unit === '$' ? '$' : ''}{kpi.target.toLocaleString()}
                                </span>
                            </div>

                            <div className="relative pt-1 z-10">
                                <div className="flex mb-2 items-center justify-between text-xs">
                                    <span className={`font-bold ${isMet ? 'text-green-400' : 'text-blue-400'}`}>
                                        {progress.toFixed(0)}% Achieved
                                    </span>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-800 border border-white/5">
                                    <div
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isMet ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
