import { GlassCard, GlassButton, GlassContainer, AnimatedBackground } from "@/components/glass";
import { Heading } from "@/components/typography/heading";
import { useTranslations } from "next-intl";

export default function DesignTestPage() {
  const t = useTranslations('design');
  return (
    <>
      <AnimatedBackground />
      <GlassContainer className="py-20">
        <div className="space-y-8">
          <Heading size="h1" gradient>
            {t('title')}
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="default">
              <h3 className="text-xl font-bold mb-2">{t('cards.default.title')}</h3>
              <p className="text-gray-300">{t('cards.default.desc')}</p>
            </GlassCard>

            <GlassCard variant="highlighted">
              <h3 className="text-xl font-bold mb-2">{t('cards.highlighted.title')}</h3>
              <p className="text-gray-300">{t('cards.highlighted.desc')}</p>
            </GlassCard>

            <GlassCard variant="interactive">
              <h3 className="text-xl font-bold mb-2">{t('cards.interactive.title')}</h3>
              <p className="text-gray-300">{t('cards.interactive.desc')}</p>
            </GlassCard>
          </div>

          <div className="flex gap-4">
            <GlassButton variant="primary" magnetic>
              {t('buttons.primary')}
            </GlassButton>
            <GlassButton variant="glass">{t('buttons.glass')}</GlassButton>
            <GlassButton variant="outline">{t('buttons.outline')}</GlassButton>
          </div>
        </div>
      </GlassContainer>
    </>
  );
}
