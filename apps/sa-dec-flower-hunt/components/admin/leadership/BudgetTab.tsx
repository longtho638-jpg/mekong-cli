import { useState } from 'react';
import { budgetData } from '@/lib/admin/leadership-data';
import { TrendingUp, TrendingDown, Wallet, Users, Building, ArrowRight, PieChart } from 'lucide-react';

export function BudgetTab() {
    const [selectedPhase, setSelectedPhase] = useState(3);
    const phase = budgetData.phases[selectedPhase - 1];
    const formatCurrency = (n: number) => {
        if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
        return `$${n}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Phase Selector & Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Budget Oversight</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">7-Phase Financial Roadmap</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Select Phase:</span>
                    <select
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer hover:border-emerald-500/50"
                    >
                        {budgetData.phases.map((p) => (
                            <option key={p.phase} value={p.phase}>
                                Phase {p.phase}: {p.name} ({p.year})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* High-level Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Raised', value: budgetData.summary.totalRaise, color: 'text-emerald-400', sub: 'Equity Financing', icon: TrendingUp, bg: 'from-emerald-500/10 to-teal-500/5' },
                    { label: 'Total Revenue', value: budgetData.summary.totalRevenue, color: 'text-blue-400', sub: 'Cumulative Sales', icon: Wallet, bg: 'from-blue-500/10 to-indigo-500/5' },
                    { label: 'Total OpEx', value: budgetData.summary.totalOpex, color: 'text-rose-400', sub: 'Lifetime Burn', icon: TrendingDown, bg: 'from-rose-500/10 to-orange-500/5' },
                    { label: 'End Cash @ IPO', value: budgetData.summary.endCash, color: 'text-purple-400', sub: 'Projected Liquidity', icon: Building, bg: 'from-purple-500/10 to-fuchsia-500/5' },
                ].map((item, idx) => (
                    <div key={idx} className={`relative overflow-hidden p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${item.bg} hover:border-white/10 transition-all duration-300 group`}>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{item.label}</p>
                            <item.icon className={`w-4 h-4 ${item.color} opacity-70 group-hover:scale-110 transition-transform`} />
                        </div>
                        <p className={`text-2xl font-bold font-mono ${item.color} mb-1 tracking-tight`}>
                            {formatCurrency(item.value)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid: P&L and OpEx */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Detailed P&L Statement */}
                <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                        <PieChart className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-white">Profit & Loss Statement</h3>
                        <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">Phase {phase.phase}</span>
                    </div>

                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-white/5">
                            <tr className="group hover:bg-white/5 transition-colors">
                                <td className="py-3 px-2 text-slate-300">Revenue (Doanh thu)</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-emerald-400">{formatCurrency(phase.pnl.revenue)}</td>
                            </tr>
                            <tr className="group hover:bg-white/5 transition-colors">
                                <td className="py-3 px-2 text-slate-400 pl-6 border-l-2 border-transparent group-hover:border-slate-500">COGS (Giá vốn)</td>
                                <td className="py-3 px-2 text-right font-mono text-rose-400">({formatCurrency(phase.pnl.cogs)})</td>
                            </tr>
                            <tr className="bg-white/5 font-semibold">
                                <td className="py-3 px-2 text-blue-200">Gross Margin (Lãi gộp)</td>
                                <td className="py-3 px-2 text-right font-mono text-blue-300">{formatCurrency(phase.pnl.grossMargin)}</td>
                            </tr>
                            <tr className="group hover:bg-white/5 transition-colors">
                                <td className="py-3 px-2 text-slate-300">OpEx (Vận hành)</td>
                                <td className="py-3 px-2 text-right font-mono text-orange-300">({formatCurrency(phase.pnl.opex)})</td>
                            </tr>
                            <tr className="border-t border-white/20">
                                <td className="py-4 px-2 font-bold text-white text-lg">Net Income</td>
                                <td className={`py-4 px-2 text-right font-mono font-bold text-lg ${phase.pnl.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {phase.pnl.netIncome >= 0 ? '+' : ''}{formatCurrency(phase.pnl.netIncome)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* OpEx Breakdown Visualization */}
                {phase.opexBreakdown && (
                    <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                            <TrendingDown className="w-5 h-5 text-rose-400" />
                            <h3 className="font-bold text-white">OpEx Composition</h3>
                            <span className="ml-auto text-xs text-slate-500">By Department</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-6">
                            {[
                                { name: 'R&D (Product)', value: phase.opexBreakdown.rd, color: 'bg-gradient-to-r from-blue-500 to-cyan-400', text: 'text-cyan-400' },
                                { name: 'G&A (Admin)', value: phase.opexBreakdown.ga, color: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-purple-400' },
                                { name: 'S&M (Growth)', value: phase.opexBreakdown.sm, color: 'bg-gradient-to-r from-orange-500 to-yellow-400', text: 'text-orange-400' },
                                { name: 'Ops (Field)', value: phase.opexBreakdown.ops, color: 'bg-gradient-to-r from-emerald-500 to-green-400', text: 'text-emerald-400' },
                            ].map((dept, i) => {
                                const pct = (dept.value / phase.pnl.opex * 100).toFixed(0);
                                return (
                                    <div key={dept.name} className="group">
                                        <div className="flex justify-between text-sm mb-2 items-end">
                                            <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{dept.name}</span>
                                            <div className="text-right">
                                                <span className={`font-mono font-bold ${dept.text}`}>{formatCurrency(dept.value)}</span>
                                                <span className="text-xs text-slate-500 ml-2 font-mono">({pct}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full ${dept.color} shadow-[0_0_10px_rgba(0,0,0,0.3)] animate-in slide-in-from-left duration-1000`}
                                                style={{ width: `${pct}%`, animationDelay: `${i * 100}ms` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Quarterly Tables & Headcount */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Quarterly Breakdown */}
                {phase.quarterly && (
                    <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" /> Quarterly Performance
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                                        <th className="text-left py-2 px-3">Qtr</th>
                                        <th className="text-right py-2 px-3">Rev</th>
                                        <th className="text-right py-2 px-3">OpEx</th>
                                        <th className="text-right py-2 px-3">Net</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                    {phase.quarterly.map((q: any) => (
                                        <tr key={q.q} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-3 font-bold text-slate-300">{q.q}</td>
                                            <td className="py-3 px-3 text-right text-emerald-400">{formatCurrency(q.revenue)}</td>
                                            <td className="py-3 px-3 text-right text-rose-400">{formatCurrency(q.opex)}</td>
                                            <td className={`py-3 px-3 text-right font-bold ${q.netIncome >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {formatCurrency(q.netIncome)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Headcount Card */}
                <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" /> Team Structure
                        </h3>
                        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">
                            {phase.headcount.total} FTEs
                        </span>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(phase.headcount).filter(([k]) => k !== 'total').map(([level, count]) => (
                            <div key={level} className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <span className="text-slate-400 text-sm capitalize">{level}</span>
                                <span className="font-mono font-bold text-white">{count as number}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* All Phases Overview Table */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h4 className="font-bold text-white">Full Roadmap Overview</h4>
                    <span className="text-xs text-slate-400 font-mono">2026 - 2032</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="text-left py-3 px-4">Phase</th>
                                <th className="text-right py-3 px-4">Revenue</th>
                                <th className="text-right py-3 px-4">OpEx</th>
                                <th className="text-right py-3 px-4">Net Income</th>
                                <th className="text-right py-3 px-4">Team</th>
                                <th className="text-right py-3 px-4">Runway</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {budgetData.phases.map((p) => (
                                <tr
                                    key={p.phase}
                                    className={`
                                        cursor-pointer transition-all duration-200
                                        ${p.phase === selectedPhase ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-white/5 border-l-2 border-transparent'}
                                    `}
                                    onClick={() => setSelectedPhase(p.phase)}
                                >
                                    <td className="py-3 px-4 font-sans font-medium text-slate-300">
                                        <span className={`inline-block w-6 text-center rounded mr-2 ${p.phase === selectedPhase ? 'bg-emerald-500 text-slate-900 font-bold' : 'bg-slate-800 text-slate-500'}`}>{p.phase}</span>
                                        {p.name}
                                    </td>
                                    <td className="py-3 px-4 text-right text-emerald-400/90">{formatCurrency(p.pnl.revenue)}</td>
                                    <td className="py-3 px-4 text-right text-rose-400/80">{formatCurrency(p.pnl.opex)}</td>
                                    <td className={`py-3 px-4 text-right font-bold ${p.pnl.netIncome >= 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {p.pnl.netIncome >= 0 ? '' : ''}{formatCurrency(p.pnl.netIncome)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-slate-400">{p.headcount.total}</td>
                                    <td className="py-3 px-4 text-right text-cyan-400">{p.runway}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
