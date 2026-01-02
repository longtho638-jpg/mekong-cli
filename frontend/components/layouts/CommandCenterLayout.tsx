import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/**
 * The "Cockpit" Layout - inspired by SpaceX & Binh Phap
 * 
 * 1. LEFT SPINE: Strategy Map (13 Chapters)
 * 2. CENTER: War Room (Dashboard Content)
 * 3. RIGHT SPINE: Intel Stream (Signals)
 */
export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden font-mono selection:bg-green-500/30">

            {/* 1. LEFT SPINE - THE STRATEGY MAP */}
            <aside className="w-16 border-r border-white/10 flex flex-col items-center py-4 z-50 bg-[#050505]/90 backdrop-blur-md">
                <div className="mb-8 font-bold text-xs tracking-widest text-white/50 -rotate-90 whitespace-nowrap">
                    STRATEGY
                </div>
                {/* Placeholder for Timeline Nav */}
                <div className="flex-1 w-full flex flex-col items-center gap-4">
                    {/* Vertical dots would go here */}
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" /> {/* Active Chapter */}
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                </div>
            </aside>

            {/* 2. CENTER - THE WAR ROOM */}
            <main className="flex-1 flex flex-col relative">
                {/* Global HUD (Top Bar) */}
                <header className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold tracking-widest text-green-500">WAR ROOM</span>
                        <Separator orientation="vertical" className="h-4 bg-white/10" />
                        <span className="text-xs text-white/40">SỞ CHỈ HUY v2.0</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Tickers */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-white/40">WAR CHEST:</span>
                            <span className="text-white font-mono">$850,000</span>
                        </div>
                    </div>
                </header>

                {/* Content Area (No Window Scroll, Internal Scroll only if needed) */}
                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </ScrollArea>
            </main>

            {/* 3. RIGHT SPINE - INTEL STREAM */}
            <aside className="w-64 border-l border-white/10 bg-[#050505]/95 hidden lg:flex flex-col z-40">
                <div className="h-12 border-b border-white/10 flex items-center px-4">
                    <span className="text-xs font-bold tracking-wider text-white/50">INTEL STREAM</span>
                </div>
                <ScrollArea className="flex-1 p-4">
                    {/* Signal Feed */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-white/30 mb-2">LIVE FEED</div>
                        <div className="p-3 rounded border border-white/5 bg-white/[0.02]">
                            <div className="text-xs text-green-400 mb-1">REVENUE SIGNAL</div>
                            <div className="text-[11px] text-white/60 leading-tight">
                                New Hub "Can Tho 01" exceeded monthly target by 15%.
                            </div>
                        </div>
                        <div className="p-3 rounded border border-white/5 bg-white/[0.02]">
                            <div className="text-xs text-amber-400 mb-1">MARKET ALERT</div>
                            <div className="text-[11px] text-white/60 leading-tight">
                                Competitor activity detected in Zone 4.
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </aside>

        </div>
    );
}
