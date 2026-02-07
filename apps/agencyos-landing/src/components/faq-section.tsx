"use client";

import { GlassContainer } from "@/components/glass";
import { Heading } from "@/components/typography/heading";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqKeys = [
  "pricing",
  "cancel",
  "refunds",
  "payment",
  "trial",
  "security"
];

export function FAQSection() {
  const t = useTranslations('faq');

  return (
    <section className="relative py-24">
      <GlassContainer maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Heading size="h2" gradient className="mb-6">
            {t('title')}
          </Heading>
          <p className="text-xl text-gray-300">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqKeys.map((key, index) => (
              <AccordionItem key={key} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {t(`items.${key}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  {t(`items.${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </GlassContainer>
    </section>
  );
}
