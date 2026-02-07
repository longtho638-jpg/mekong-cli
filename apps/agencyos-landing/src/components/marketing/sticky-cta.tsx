"use client";

import { GlassButton } from "@/components/glass";
import { m as motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function StickyCTA() {
  const t = useTranslations('marketing.stickyCta');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling down 600px (past hero usually)
      const shouldShow = window.scrollY > 600;
      setIsVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none"
        >
          <div className="container mx-auto max-w-lg pointer-events-auto">
            <div className="glass-effect rounded-2xl p-4 shadow-2xl border border-white/20 dark:border-white/10 flex items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <span className="text-slate-900 dark:text-white font-medium pl-2 text-sm sm:text-base">
                {t('text')}
              </span>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={scrollToPricing}
                className="shrink-0"
              >
                {t('button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </GlassButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
