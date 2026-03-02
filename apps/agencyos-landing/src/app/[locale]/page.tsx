import { NavbarSection } from '@/components/navbar-section';
import { HeroSection } from '@/components/hero-section';
import { FeaturesGrid } from '@/components/features-grid';
import { HowItWorks } from '@/components/how-it-works';
import { PricingTable } from '@/components/pricing-table';
import { FadeIn } from '@/components/motion/fade-in';
import { SlideUp } from '@/components/motion/slide-up';
import dynamic from 'next/dynamic';
import { SectionSkeleton } from '@/components/ui/section-skeleton';

const FAQSection = dynamic(() => import('@/components/faq-section').then(mod => mod.FAQSection), {
  loading: () => <SectionSkeleton />,
});

const ContactSection = dynamic(() => import('@/components/sections/contact-section').then(mod => mod.ContactSection), {
  loading: () => <SectionSkeleton />,
});

const FooterSection = dynamic(() => import('@/components/footer-section').then(mod => mod.FooterSection), {
  loading: () => <div className="h-20 bg-deep-space-950" />,
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
          <FeaturesGrid />
        </SlideUp>
        <SlideUp delay={0.2}>
          <HowItWorks />
        </SlideUp>
        <SlideUp delay={0.2}>
          <PricingTable />
        </SlideUp>
        <SlideUp delay={0.2}>
          <FAQSection />
        </SlideUp>
        <SlideUp delay={0.2}>
          <ContactSection />
        </SlideUp>
      </main>
      <FooterSection />
    </>
  );
}
