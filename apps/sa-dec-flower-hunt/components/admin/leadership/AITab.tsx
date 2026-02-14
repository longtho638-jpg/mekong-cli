import { Bot, Sparkles, Send } from 'lucide-react';

export function AITab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                <Bot className="w-8 h-8 text-cyan-400" /> Leadership AI Pilot
            </h2>

            <div className="flex-1 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden flex flex-col relative">
                {/* Chat History */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                            <Bot className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%]">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Hello Board! Based on Q4 projections, our Burn Rate is <span className="text-rose-400 font-mono font-bold">$8k/mo</span>.
                                We have <span className="text-emerald-400 font-mono font-bold">60 months</span> of runway.
                                I recommend hiring 1 Senior Growth Lead now to accelerate Series A metrics.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Suggested Actions */}
                <div className="p-4 bg-slate-900 border-t border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-500" /> Suggested Prompts
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button className="whitespace-nowrap bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm text-cyan-400 border border-cyan-500/20 transition-colors">
                            📊 Analyze Phase 3 OpEx
                        </button>
                        <button className="whitespace-nowrap bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm text-purple-400 border border-purple-500/20 transition-colors">
                            💎 Calculate Dilution if we raise $5M
                        </button>
                        <button className="whitespace-nowrap bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm text-orange-400 border border-orange-500/20 transition-colors">
                            🔥 Burn Rate Scenarios
                        </button>
                    </div>

                    {/* Input Field */}
                    <div className="mt-4 relative">
                        <input
                            type="text"
                            placeholder="Ask AgriOS AI about finances, strategy, or market comparison..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
