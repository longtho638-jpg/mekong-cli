import { NavbarSection } from '@/components/navbar-section';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { PricingSection } from '@/components/pricing-section';
import { FAQSection } from '@/components/faq-section';
import { FooterSection } from '@/components/footer-section';
import { FadeIn } from '@/components/motion/fade-in';
import { SlideUp } from '@/components/motion/slide-up';

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
    </>
  );
}
