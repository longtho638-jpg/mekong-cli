"use client";

import { GlassCard, GlassContainer } from "@/components/glass";
import { Heading } from "@/components/typography/heading";
import { m as motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Zap,
  Shield,
  Code,
  BarChart,
  Globe,
  Workflow
} from "lucide-react";

const featureConfig = [
  {
    key: "fast",
    icon: Zap,
    span: "col-span-1",
    variant: "default" as const,
  },
  {
    key: "security",
    icon: Shield,
    span: "col-span-1 md:row-span-2",
    variant: "highlighted" as const,
  },
  {
    key: "developer",
    icon: Code,
    span: "col-span-1",
    variant: "default" as const,
  },
  {
    key: "analytics",
    icon: BarChart,
    span: "col-span-1 md:col-span-2",
    variant: "interactive" as const,
  },
  {
    key: "edge",
    icon: Globe,
    span: "col-span-1",
    variant: "default" as const,
  },
  {
    key: "workflow",
    icon: Workflow,
    span: "col-span-1",
    variant: "highlighted" as const,
  },
];

export function FeaturesSection() {
  const t = useTranslations('features');

  return (
    <section id="features" className="relative py-16 md:py-24 scroll-mt-20">
      <GlassContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Heading size="h2" gradient className="mb-6">
            {t('title')}
          </Heading>
          <p className="text-xl text-starlight-200 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {featureConfig.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={feature.span}
              >
                <GlassCard
                  variant={feature.variant}
                  className="h-full flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nebula-500 to-blue-500 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t(`items.${feature.key}.title`)}</h3>
                  <p className="text-starlight-300 flex-grow">{t(`items.${feature.key}.description`)}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </GlassContainer>
    </section>
  );
}
