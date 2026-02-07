"use client";

import { motion, HTMLMotionProps, useInView } from "framer-motion";
import { useRef } from "react";

interface SlideUpProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offset?: number;
  threshold?: number;
}

export function SlideUp({
  children,
  delay = 0,
  duration = 0.5,
  offset = 20,
  threshold = 0.1,
  className,
  ...props
}: SlideUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: `0px 0px -${threshold * 100}% 0px` as any });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: offset }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: offset }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
