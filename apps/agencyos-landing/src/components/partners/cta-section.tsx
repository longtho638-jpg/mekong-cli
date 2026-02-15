'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { GlassContainer } from '@/components/glass/glass-container';
import { GlassCard } from '@/components/glass/glass-card';
import { GlassButton } from '@/components/glass/glass-button';

export function CtaSection() {
  const t = useTranslations('partners.cta');

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dynamic background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-30 blur-3xl" />

      <GlassContainer>
        <GlassCard className="relative overflow-hidden border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />

          <div className="relative z-10 px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              {t('title')}
            </h2>

            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GlassButton
                variant="primary"
                size="lg"
                className="min-w-[200px] text-lg h-14"
                onClick={() => window.open('https://forms.gle/partnership', '_blank')}
              >
                {t('button')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </GlassContainer>
    </section>
  );
}
