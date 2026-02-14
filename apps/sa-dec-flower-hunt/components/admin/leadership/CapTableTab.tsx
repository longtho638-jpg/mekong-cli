'use client';

import { capTableData } from '@/lib/admin/leadership-data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart, TrendingUp, Users, ShieldCheck, HelpCircle } from 'lucide-react';

export function CapTableTab() {
    // Transform data for Recharts
    const chartData = capTableData.phases.map(p => ({
        name: `Phase ${p.phase}`,
        Long: p.coPhans.long,
        Thong: p.coPhans.thong,
        Con: p.coPhans.con,
        Investors: p.coPhans.investors,
        ESOP: p.esop,
        Public: p.coPhans.publicFloat || 0,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 border border-white/10 p-4 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="font-bold text-white mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-slate-300 w-20">{entry.name}:</span>
                            <span className="font-mono font-bold text-white">{entry.value.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Controls */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Equity & Cap Table</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Ownership Evolution (Dilution Impact)</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Current Valuation</p>
                    <p className="text-xl font-mono font-bold text-yellow-400">$3.3M (Seed)</p>
                </div>
            </div>

            {/* Recharts Visualization */}
            <div className="grid lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl border border-white/5 p-4 backdrop-blur-sm relative">
                    <h3 className="text-sm font-bold text-slate-400 mb-4 ml-2">Ownership Dilution Over Time</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorFounders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvestors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorESOP" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="Investors" stackId="1" stroke="#3b82f6" fill="url(#colorInvestors)" />
                            <Area type="monotone" dataKey="ESOP" stackId="1" stroke="#a855f7" fill="url(#colorESOP)" />
                            <Area type="monotone" dataKey="Long" stackId="1" stroke="#eab308" fill="url(#colorFounders)" />
                            <Area type="monotone" dataKey="Thong" stackId="1" stroke="#ca8a04" fill="url(#colorFounders)" />
                            <Area type="monotone" dataKey="Con" stackId="1" stroke="#a16207" fill="url(#colorFounders)" />
                            <Area type="monotone" dataKey="Public" stackId="1" stroke="#10b981" fill="#10b981" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Key Metrics / Legend Card */}
                <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-white mb-6">Key Definitions</h3>
                        <div className="space-y-4">
                            <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck className="w-4 h-4 text-yellow-500" />
                                    <p className="font-bold text-yellow-500 text-sm">Founders Shares</p>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Common Stock. Voting rights (10:1). Vesting 4 years.
                                </p>
                            </div>
                            <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-purple-400" />
                                    <p className="font-bold text-purple-400 text-sm">ESOP Pool</p>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Option Pool for employees. Dilutes everyone equally.
                                </p>
                            </div>
                            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    <p className="font-bold text-blue-400 text-sm">Preferred Stock</p>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Investors. Liquidation preference 1x. Anti-dilution.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Total Founders Ownership @ IPO</p>
                        <p className="text-2xl font-mono font-bold text-emerald-400">~28.5%</p>
                        <p className="text-[10px] text-slate-600">Value: ~$185M</p>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h4 className="font-bold text-white">Cap Table Detail View</h4>
                    <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">Download CSV</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-500 font-mono">
                            <tr>
                                <th className="px-4 py-3 text-left">Phase</th>
                                <th className="px-4 py-3 text-right">Raised</th>
                                <th className="px-4 py-3 text-right">Valuation</th>
                                <th className="px-4 py-3 text-center bg-yellow-500/5 text-yellow-500 border-l border-white/5">Founders</th>
                                <th className="px-4 py-3 text-center bg-purple-500/5 text-purple-400 border-l border-white/5">ESOP</th>
                                <th className="px-4 py-3 text-center border-l border-white/5">Investors</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                            {capTableData.phases.map((p) => (
                                <tr key={p.phase} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3 font-sans">
                                        <div className="font-bold text-white">Phase {p.phase}: {p.name}</div>
                                        <div className="text-xs text-slate-500">{p.year}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-400">{p.raise}</td>
                                    <td className="px-4 py-3 text-right text-blue-400">{p.valuation}</td>

                                    <td className="px-4 py-3 text-center bg-yellow-500/5 border-l border-white/5 group-hover:bg-yellow-500/10 transition-colors">
                                        <div className="space-y-0.5">
                                            <div className="flex justify-between text-[10px] text-slate-500"><span>L:</span><span>{p.coPhans.long}%</span></div>
                                            <div className="flex justify-between text-[10px] text-slate-500"><span>T:</span><span>{p.coPhans.thong}%</span></div>
                                            <div className="font-bold text-yellow-500 border-t border-yellow-500/20 mt-1 pt-1">{p.totalFounders.toFixed(1)}%</div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-center bg-purple-500/5 border-l border-white/5 group-hover:bg-purple-500/10 transition-colors">
                                        <span className="font-bold text-purple-400">{p.esop}%</span>
                                    </td>

                                    <td className="px-4 py-3 text-center border-l border-white/5">
                                        <span className="font-bold text-slate-300">{p.coPhans.investors}%</span>
                                        {p.coPhans.publicFloat && <div className="text-[10px] text-emerald-500">IPO Float</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
