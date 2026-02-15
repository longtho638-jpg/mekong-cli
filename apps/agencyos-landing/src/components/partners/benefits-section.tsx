"use client";

import { GlassCard, GlassContainer } from "@/components/glass";
import { Heading } from "@/components/typography/heading";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Code, UserCheck, Zap } from "lucide-react";

export function PartnersBenefits() {
  const t = useTranslations('partners.benefits');
  const items = ['noTech', 'whiteLabel', 'fast'] as const;

  const icons = {
    noTech: Code,
    whiteLabel: UserCheck,
    fast: Zap,
  };

  return (
    <section className="relative py-16 md:py-24">
      <GlassContainer>
        <div className="text-center mb-16">
            <Heading size="h2" gradient className="mb-4">{t('title')}</Heading>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((key, i) => {
            const Icon = icons[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="h-full"
              >
                <GlassCard variant="default" className="h-full flex flex-col items-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-nebula-400 border border-white/10 shadow-lg shadow-nebula-500/10">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{t(`items.${key}.title`)}</h3>
                  <p className="text-starlight-300 leading-relaxed">
                    {t(`items.${key}.description`)}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </GlassContainer>
    </section>
  );
}
