"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface MoneyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export function MoneyButton({ text = "🧧 NHẬN LÌ XÌ GIẢM 50% - CHỈ HÔM NAY", className, ...props }: MoneyButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        className={`bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-6 py-6 rounded-full shadow-lg border-2 border-white/20 hover:shadow-xl transition-all ${className}`}
        {...props}
      >
        <span className="animate-pulse">{text}</span>
      </Button>
    </motion.div>
  );
}
