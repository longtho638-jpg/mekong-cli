import { esopData } from '@/lib/admin/leadership-data';
import { Gem, Lock, Sparkles } from 'lucide-react';

export function ESOPTab() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <Gem className="w-8 h-8 text-purple-400" /> ESOP Calculator
            </h2>

            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-500 font-mono">
                            <tr>
                                <th className="text-left py-4 px-6">Role</th>
                                <th className="text-left py-4 px-6">Joined</th>
                                <th className="text-right py-4 px-6">Options</th>
                                <th className="text-right py-4 px-6">Strike Price</th>
                                <th className="text-right py-4 px-6">Value @ IPO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                            {esopData.roles.map((r, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-6 font-sans font-bold text-white">{r.role}</td>
                                    <td className="py-4 px-6 text-slate-500">{r.joined}</td>
                                    <td className="py-4 px-6 text-right">{r.options.toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right text-yellow-400">{r.strike}</td>
                                    <td className="py-4 px-6 text-right font-bold text-purple-400 bg-purple-500/5">{r.valueIPO}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-6 rounded-2xl border border-purple-500/20">
                    <h4 className="font-bold text-purple-400 flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4" /> Golden Handcuffs
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Early employees get significantly better strike prices ($0.22 vs $3.55). The potential upside multiplier is 100x vs 10x.
                    </p>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-full border border-white/10">
                        <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Vesting Schedule</h4>
                        <p className="text-sm text-slate-400 font-mono">4 Years (1 Year Cliff)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
