import { financialData } from '@/lib/admin/leadership-data';
import { DollarSign, Flame, TrendingUp, Users } from 'lucide-react';

export function FinancialTab() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Financial Model <span className="text-slate-500 text-lg font-normal ml-2">Unit Economics & Runway</span>
            </h2>

            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-500 font-mono">
                            <tr>
                                <th className="text-left py-4 px-6">Phase</th>
                                <th className="text-right py-4 px-6 flex items-center justify-end gap-2 text-green-400">
                                    <DollarSign className="w-3 h-3" /> ARR
                                </th>
                                <th className="text-right py-4 px-6 text-rose-400">
                                    <span className="flex items-center justify-end gap-2"><Flame className="w-3 h-3" /> Burn/mo</span>
                                </th>
                                <th className="text-right py-4 px-6 text-blue-400">
                                    <span className="flex items-center justify-end gap-2"><TrendingUp className="w-3 h-3" /> Runway</span>
                                </th>
                                <th className="text-right py-4 px-6 text-purple-400">
                                    <span className="flex items-center justify-end gap-2"><Users className="w-3 h-3" /> Team</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                            {financialData.phases.map((p) => (
                                <tr key={p.phase} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6 font-sans font-bold text-white group-hover:text-emerald-400 transition-colors">Phase {p.phase}</td>
                                    <td className="py-4 px-6 text-right font-bold text-green-400">{p.arr}</td>
                                    <td className="py-4 px-6 text-right text-rose-400">{p.burn}</td>
                                    <td className="py-4 px-6 text-right text-blue-400 font-bold">{p.runway}</td>
                                    <td className="py-4 px-6 text-right">{p.team}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-green-900/20 p-6 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-full">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h4 className="font-bold text-emerald-400">Profitability Target</h4>
                    <p className="text-sm text-slate-400">We aim to reach EBITDA Positive by <span className="text-white font-bold">Phase 5 (Series C)</span>. This ensures long-term sustainability and IPO readiness.</p>
                </div>
            </div>
        </div>
    );
}
