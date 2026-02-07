"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLMotionProps, m as motion, useMotionValue, useSpring } from "framer-motion";
import { forwardRef, useRef, useImperativeHandle, type ReactNode } from "react";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-nebula-500 to-blue-500 text-white",
        glass: "glass-effect text-white",
        outline: "border-2 border-white/20 text-white",
      },
      size: {
        sm: "px-4 py-2 text-sm min-h-[44px]", // Ensure touch target size
        md: "px-6 py-3 text-base min-h-[48px]",
        lg: "px-8 py-4 text-lg min-h-[56px]",
      },
      magnetic: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      magnetic: false,
    },
  }
);

// Variant-specific glow for whileHover boxShadow
const glowByVariant = {
  primary: "0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)",
  glass: "0 0 16px rgba(0, 245, 255, 0.3), 0 0 32px rgba(0, 245, 255, 0.1)",
  outline: "0 0 16px rgba(255, 255, 255, 0.15), 0 0 32px rgba(255, 255, 255, 0.05)",
} as const;

export interface GlassButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, magnetic, children, onClick, type, disabled, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Sync forwarded ref with internal ref
    useImperativeHandle(ref, () => internalRef.current as HTMLButtonElement);

    const springConfig = { damping: 20, stiffness: 300 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !internalRef.current) return;

      const rect = internalRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      x.set(distanceX * 0.3);
      y.set(distanceY * 0.3);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    const resolvedVariant = variant ?? "primary";
    const glowShadow = glowByVariant[resolvedVariant] ?? glowByVariant.primary;

    return (
      <motion.button
        ref={internalRef}
        className={cn(buttonVariants({ variant, size, magnetic }), className)}
        style={magnetic ? { x: springX, y: springY } : {}}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        type={type}
        disabled={disabled}
        whileHover={{
          scale: 1.05,
          boxShadow: glowShadow,
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {/* Shine sweep overlay for primary variant */}
        {resolvedVariant === "primary" && (
          <span
            className="absolute inset-0 pointer-events-none opacity-0 hover-parent:opacity-100"
            aria-hidden
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
            }}
          />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">
          {children as ReactNode}
        </span>
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";
