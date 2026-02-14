"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const HypnoticButton = ({
    children,
    className,
    onClick,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    [key: string]: any;
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
                className
            )}
            {...props}
        >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-900">
                {children}
            </span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity duration-500 group-hover:opacity-20 blur-lg" />
        </button>
    );
};
