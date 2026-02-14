"use client";

import { ReactNode } from "react";

interface TerminalHeaderProps {
    children: ReactNode;
    status?: 'online' | 'offline' | 'warning';
    statusLabel?: string;
}

export const TerminalHeader = ({ children, status, statusLabel }: TerminalHeaderProps) => {
    const statusColors = {
        online: 'bg-emerald-500',
        offline: 'bg-slate-500',
        warning: 'bg-amber-500',
    };

    return (
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono text-emerald-500 tracking-[0.2em] uppercase font-bold">
                {children}
            </h3>
            {status && (
                <div className="flex items-center gap-2">
                    {statusLabel && <span className="text-[10px] text-stone-500 uppercase">{statusLabel}</span>}
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'online' ? 'animate-pulse' : ''}`} />
                </div>
            )}
        </div>
    );
};
