'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Command Center Layout V2 - SIMPLIFIED
 * 
 * Removed:
 * - Left Strategy Spine (useless dots)
 * - Right Intel Stream (wasteful space)
 * 
 * Now: Full-width content with minimal header
 */
export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-mono selection:bg-green-500/30">

            {/* TOP BAR - Minimal HUD */}
            <header className="sticky top-0 z-50 h-14 border-b border-white/10 bg-[#050505]/95 backdrop-blur-md flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold tracking-widest text-green-500">🏯 SỞ CHỈ HUY</span>
                    <span className="text-xs text-white/30">Revenue Command</span>
                </div>
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-white/40">WAR CHEST:</span>
                        <span className="text-green-400 font-bold">$850,000</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-white/40">TARGET:</span>
                        <span className="text-amber-400 font-bold">$1,000,000</span>
                    </div>
                </div>
            </header>

            {/* CONTENT - Full Width, Tight Padding */}
            <main className="w-full px-4 lg:px-8 py-4">
                {children}
            </main>

        </div>
    );
}
