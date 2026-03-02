"use client";

import { GlassButton, GlassContainer, AnimatedBackground } from "@/components/glass";
import { Heading } from "@/components/typography/heading";
import { TypewriterText } from "@/components/sections/typewriter-text";
import { TerminalAnimation } from "@/components/sections/terminal-animation";
import { m as motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/vibe-analytics-client";

export function HeroSection() {
  const t = useTranslations('hero');

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedBackground />

      <GlassContainer className="relative z-10 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-nebula-400" />
              <span className="text-sm text-starlight-300">{t('badge')}</span>
            </div>

            <Heading size="h1" gradient>
              {t('title')}{" "}
              <TypewriterText
                texts={[
                  t('typewriter.0'),
                  t('typewriter.1'),
                  t('typewriter.2'),
                  t('typewriter.3'),
                ]}
              />
            </Heading>

            <p className="text-xl text-starlight-200 max-w-xl">
              {t('subtitle')}
            </p>

            <div className="flex flex-wrap gap-4">
              <GlassButton
                variant="primary"
                size="lg"
                magnetic
                onClick={() => {
                  trackEvent('hero_cta_click', { button: 'get_started' })
                  scrollToPricing()
                }}
              >
                {t('cta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </GlassButton>

              <GlassButton
                variant="outline"
                size="lg"
                onClick={() => trackEvent('hero_cta_click', { button: 'secondary' })}
              >
                {t('ctaSecondary')}
              </GlassButton>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm text-starlight-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>{t('openCore')}</span>
              </div>
              <div>⚡ {t('deploy')}</div>
              <div>🔒 {t('compliant')}</div>
            </div>
          </motion.div>

          {/* Right Column: Terminal Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <TerminalAnimation />
          </motion.div>
        </div>
      </GlassContainer>
    </section>
  );
}
