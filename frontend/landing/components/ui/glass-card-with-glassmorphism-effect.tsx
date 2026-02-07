"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  bordered?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = false,
  bordered = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6",
        "bg-white/5 backdrop-blur-xl",
        bordered && "border border-white/10",
        "shadow-lg shadow-black/20",
        hover && "transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-neon-cyan/10",
        className
      )}
    >
      {children}
    </div>
  );
}
