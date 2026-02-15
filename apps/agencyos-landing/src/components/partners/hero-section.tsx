"use client";

import { GlassButton, GlassContainer } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/animated-background";
import { Heading } from "@/components/typography/heading";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function PartnersHero() {
  const t = useTranslations('partners.hero');

  const scrollToCalculator = () => {
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      <AnimatedBackground />

      <GlassContainer className="relative z-10 py-12 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full mx-auto border border-white/10 bg-white/5 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-nebula-400" />
            <span className="text-sm text-starlight-300">{t('badge')}</span>
          </div>

          <Heading size="h1" gradient className="leading-tight">
            {t('title')}
          </Heading>

          <p className="text-xl md:text-2xl text-starlight-200 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <GlassButton
              variant="primary"
              size="lg"
              className="group"
              onClick={scrollToCalculator}
            >
              {t('cta')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </GlassButton>

            <GlassButton variant="glass" size="lg">
              {t('ctaSecondary')}
            </GlassButton>
          </div>
        </motion.div>
      </GlassContainer>
    </section>
  );
}
