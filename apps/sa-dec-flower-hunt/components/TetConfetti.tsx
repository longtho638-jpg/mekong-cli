"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function TetConfetti() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-[-10%]"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: -20,
            rotate: 0,
            opacity: 0
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
            rotate: 360,
            opacity: [0, 1, 1, 0],
            x: `calc(${Math.random() * 100}vw + ${Math.random() * 200 - 100}px)`
          }}
          transition={{
            duration: Math.random() * 5 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
        >
           {/* Simple Cherry Blossom Petal SVG */}
           <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                <path d="M10 0C10 0 12 5 15 8C18 11 20 10 20 10C20 10 15 15 10 20C5 15 0 10 0 10C0 10 2 11 5 8C8 5 10 0 10 0Z" fill={i % 2 === 0 ? "#FFB7C5" : "#ffedd5"}/>
           </svg>
        </motion.div>
      ))}
    </div>
  );
}
