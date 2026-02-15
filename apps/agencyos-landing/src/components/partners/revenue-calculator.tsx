'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlassContainer } from '@/components/glass/glass-container';
import { GlassCard } from '@/components/glass/glass-card';
import { Slider } from '@/components/ui/slider';
import { DollarSign, TrendingUp } from 'lucide-react';

export function RevenueCalculator() {
  const t = useTranslations('partners.calculator');
  const [audits, setAudits] = useState(5);

  // Assumptions:
  // Average audit price: $1,000
  // Commission: 50%
  // Revenue per audit for partner: $500
  const REVENUE_PER_AUDIT = 500;

  const monthlyRevenue = audits * REVENUE_PER_AUDIT;
  const yearlyRevenue = monthlyRevenue * 12;

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10" />

      <GlassContainer>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('title')}
            </h2>
            <p className="text-lg text-white/60 mb-8">
              {t('subtitle')}
            </p>

            <GlassCard className="p-8 mb-8">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-white/80 font-medium">Audits / {t('perMonth')}</span>
                  <span className="text-4xl font-bold text-primary">{audits}</span>
                </div>
                <Slider
                  value={[audits]}
                  onValueChange={(vals) => setAudits(vals[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-white/40 mt-2">
                  <span>1</span>
                  <span>10</span>
                  <span>25</span>
                  <span>50+</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-white/80">{t('monthlyIncome')}</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    ${monthlyRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-white font-medium">{t('yearlyIncome')}</span>
                  </div>
                  <span className="text-3xl font-bold text-primary">
                    ${yearlyRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            {[
              { label: 'basic', price: '$500', commission: '$250' },
              { label: 'pro', price: '$1,500', commission: '$750' },
              { label: 'enterprise', price: '$5,000+', commission: '$2,500+' },
            ].map((tier) => (
              <GlassCard key={tier.label} className="p-6 flex items-center justify-between group hover:border-primary/50 transition-colors">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t(tier.label)}</h3>
                  <p className="text-white/40 text-sm">Avg. Price: {tier.price}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60 mb-1">Your Commission</div>
                  <div className="text-xl font-bold text-green-400">{tier.commission}</div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </GlassContainer>
    </section>
  );
}
