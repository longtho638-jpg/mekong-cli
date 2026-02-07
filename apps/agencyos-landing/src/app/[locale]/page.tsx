import { NavbarSection } from '@/components/navbar-section';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { FadeIn } from '@/components/motion/fade-in';
import { SlideUp } from '@/components/motion/slide-up';
import { StickyCTA } from '@/components/marketing/sticky-cta';
import dynamic from 'next/dynamic';
import { SectionSkeleton } from '@/components/ui/section-skeleton';

const PricingSection = dynamic(() => import('@/components/pricing-section').then(mod => mod.PricingSection), {
  loading: () => <SectionSkeleton />,
});

const FAQSection = dynamic(() => import('@/components/faq-section').then(mod => mod.FAQSection), {
  loading: () => <SectionSkeleton />,
});

const FooterSection = dynamic(() => import('@/components/footer-section').then(mod => mod.FooterSection), {
  loading: () => <div className="h-20 bg-deep-space-950" />, // Simple footer placeholder
});

export default function HomePage() {
  return (
    <>
      <NavbarSection />
      <main>
        <FadeIn>
          <HeroSection />
        </FadeIn>
        <SlideUp delay={0.2}>
          <FeaturesSection />
        </SlideUp>
        <SlideUp delay={0.2}>
          <PricingSection />
        </SlideUp>
        <SlideUp delay={0.2}>
          <FAQSection />
        </SlideUp>
      </main>
      <FooterSection />
      <StickyCTA />
    </>
  );
}
