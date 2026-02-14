"use client";

import { GlassPanel } from "./glass-panel";
import { cn } from "@/lib/utils";

interface DataCardProps {
    label: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon?: React.ElementType;
    className?: string;
    subtext?: string;
}

export function DataCard({
    label,
    value,
    trend,
    trendUp,
    icon: Icon,
    className,
    subtext
}: DataCardProps) {
    return (
        <GlassPanel className={cn("p-4 flex flex-col justify-between h-full min-h-[120px]", className)} hoverEffect>
            <div className="flex justify-between items-start">
                <span className="text-stone-400 text-xs uppercase tracking-wider font-mono">{label}</span>
                {Icon && <Icon className="w-4 h-4 text-emerald-500/50" />}
            </div>

            <div className="mt-2">
                <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-2">
                    {value}
                    {trend && (
                        <span className={cn(
                            "text-xs font-normal px-1.5 py-0.5 rounded",
                            trendUp
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                        )}>
                            {trendUp ? '↗' : '↘'} {trend}
                        </span>
                    )}
                </div>
                {subtext && <div className="text-[10px] text-stone-500 mt-1 font-mono">{subtext}</div>}
            </div>
        </GlassPanel>
    );
}
