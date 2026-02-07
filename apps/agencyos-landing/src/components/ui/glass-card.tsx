import { cn } from "@/lib/utils";
import { m as motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hover" | "interactive";
}

export function GlassCard({
  children,
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  const variants = {
    default: {
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(255, 255, 255, 0.08)"
    },
    hover: {
      scale: 1.02,
      background: "rgba(255, 255, 255, 0.05)",
      borderColor: "rgba(0, 245, 255, 0.3)",
      transition: { duration: 0.3 }
    },
    interactive: {
      cursor: "pointer"
    }
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl shadow-lg relative overflow-hidden",
        className
      )}
      initial={variant === "default" ? "default" : undefined}
      whileHover={variant === "hover" ? "hover" : undefined}
      variants={variants}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
      {...props}
    >
      {/* Glossy overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(120deg, rgba(255,255,255,0.05) 0%, transparent 40%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
