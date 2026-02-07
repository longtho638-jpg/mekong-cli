"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLMotionProps, m as motion } from "framer-motion";
import { forwardRef, HTMLAttributes } from "react";

const glassCardVariants = cva(
  "relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-glass-100 border-white/10",
        highlighted: "bg-glass-200 border-glow-purple glow-border",
        interactive: "bg-glass-100 border-white/10 hover:bg-glass-200 hover:scale-[1.02] cursor-pointer",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      noise: {
        true: "noise-texture",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      noise: true,
    },
  }
);

export interface GlassCardProps
  extends Omit<HTMLMotionProps<"div"> & HTMLAttributes<HTMLDivElement>, 'variant'>,
    VariantProps<typeof glassCardVariants> {
  animated?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, padding, noise, animated = false, children, onClick, ...htmlProps }, ref) => {
    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cn(glassCardVariants({ variant, padding, noise }), className)}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onClick={onClick}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, padding, noise }), className)}
        onClick={onClick}
        {...htmlProps}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
