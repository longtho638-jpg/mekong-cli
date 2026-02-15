
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PartnersHero } from '@/components/partners/hero-section';
import { HowItWorksSection } from '@/components/partners/how-it-works';
import { PartnersBenefits } from '@/components/partners/benefits-section';
import { RevenueCalculator } from '@/components/partners/revenue-calculator';
import { CtaSection } from '@/components/partners/cta-section';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'partners.meta' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
    },
  };
}

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-background text-white selection:bg-primary/20 selection:text-primary">
      <PartnersHero />
      <HowItWorksSection />
      <PartnersBenefits />
      <RevenueCalculator />
      <CtaSection />
    </main>
  );
}
