'use client';

import { useTranslations } from 'next-intl';
import { UserPlus, Send, Wallet } from 'lucide-react';
import { GlassContainer } from '@/components/glass/glass-container';
import { GlassCard } from '@/components/glass/glass-card';

export function HowItWorksSection() {
  const t = useTranslations('partners.howItWorks');

  const steps = [
    {
      key: 'signup',
      icon: UserPlus,
      step: 1
    },
    {
      key: 'send',
      icon: Send,
      step: 2
    },
    {
      key: 'earn',
      icon: Wallet,
      step: 3
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10" />

      <GlassContainer>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            {t('title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

          {steps.map((item, index) => (
            <div key={item.key} className="relative">
              <GlassCard className="h-full p-8 flex flex-col items-center text-center relative overflow-visible group hover:border-primary/50 transition-colors duration-300">
                {/* Step number badge */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md flex items-center justify-center text-sm font-bold text-primary">
                  {item.step}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/5">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {t(`steps.${item.key}.title`)}
                </h3>

                <p className="text-white/60">
                  {t(`steps.${item.key}.description`)}
                </p>
              </GlassCard>
            </div>
          ))}
        </div>
      </GlassContainer>
    </section>
  );
}
