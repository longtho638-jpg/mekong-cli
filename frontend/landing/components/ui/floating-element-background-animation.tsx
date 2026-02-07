"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingElementProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "purple" | "pink";
  delay?: number;
}

export function FloatingElement({
  className,
  size = "md",
  color = "cyan",
  delay = 0,
}: FloatingElementProps) {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  const colorClasses = {
    cyan: "bg-neon-cyan",
    purple: "bg-neon-purple",
    pink: "bg-neon-pink",
  };

  return (
    <motion.div
      className={cn(
        "absolute rounded-full blur-3xl opacity-20",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{
        y: [0, -30, 0],
        x: [0, 20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export function FloatingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <FloatingElement
        size="lg"
        color="cyan"
        className="top-1/4 left-1/4"
        delay={0}
      />
      <FloatingElement
        size="md"
        color="purple"
        className="top-2/3 right-1/4"
        delay={2}
      />
      <FloatingElement
        size="sm"
        color="pink"
        className="bottom-1/4 left-1/2"
        delay={4}
      />
      <FloatingElement
        size="md"
        color="cyan"
        className="top-1/2 right-1/3"
        delay={1}
      />
    </div>
  );
}
