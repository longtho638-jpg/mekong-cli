import { rocksData } from '@/lib/admin/leadership-data';
import { Target, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export function RocksTab() {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'complete': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'in-progress': return <Circle className="w-5 h-5 text-blue-500 animate-pulse" />;
            default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete': return 'bg-green-500';
            case 'in-progress': return 'bg-blue-500';
            default: return 'bg-yellow-500';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                <Target className="w-8 h-8 text-rose-500" /> Quarterly Rocks (OKR)
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                {/* CEO Rocks */}
                <div className="bg-slate-900/40 rounded-2xl border border-blue-500/30 overflow-hidden backdrop-blur-sm relative">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                    <div className="p-6">
                        <h3 className="font-bold text-xl text-blue-400 mb-6 flex items-center gap-2">
                            👔 CEO Objectives (Thông)
                        </h3>
                        <div className="space-y-4">
                            {rocksData.ceo.map((r, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(r.status)}
                                            <span className="font-medium text-slate-200 text-sm">{r.rock}</span>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-slate-500">{r.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getStatusColor(r.status)} transition-all duration-1000`}
                                            style={{ width: `${r.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COO Rocks */}
                <div className="bg-slate-900/40 rounded-2xl border border-green-500/30 overflow-hidden backdrop-blur-sm relative">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
                    <div className="p-6">
                        <h3 className="font-bold text-xl text-green-400 mb-6 flex items-center gap-2">
                            🚜 COO Objectives (Còn)
                        </h3>
                        <div className="space-y-4">
                            {rocksData.coo.map((r, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(r.status)}
                                            <span className="font-medium text-slate-200 text-sm">{r.rock}</span>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-slate-500">{r.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getStatusColor(r.status)} transition-all duration-1000`}
                                            style={{ width: `${r.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
