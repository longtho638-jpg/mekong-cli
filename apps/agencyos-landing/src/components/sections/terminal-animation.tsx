"use client";

import { m as motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

export function TerminalAnimation() {
  const t = useTranslations('terminal');
  const [lines, setLines] = useState<string[]>([]);

  const codeLines = useMemo(() => [
    t('lines.0'),
    t('lines.1'),
    t('lines.2'),
    t('lines.3'),
    t('lines.4'),
  ], [t]);

  useEffect(() => {
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < codeLines.length) {
        setLines((prev) => [...prev, codeLines[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [codeLines]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="glass-effect rounded-lg p-6 font-mono text-sm">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-gray-400">{t('title')}</span>
        </div>

        {/* Terminal Content */}
        <div className="space-y-2">
          {lines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={
                line.startsWith('$')
                  ? 'text-cyan-400'
                  : line.startsWith('✓')
                  ? 'text-green-400'
                  : line.startsWith('>')
                  ? 'text-purple-400'
                  : 'text-gray-300'
              }
            >
              {line}
            </motion.div>
          ))}
          {lines.length === codeLines.length && (
            <motion.span
              className="inline-block w-2 h-4 bg-cyan-400"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
