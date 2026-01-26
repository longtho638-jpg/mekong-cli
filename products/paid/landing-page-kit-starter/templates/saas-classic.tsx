import React from "react";
import { Hero } from "../components/hero-sections/hero-scroll";
import { Features } from "../components/feature-sections/features-grid";
import { Pricing } from "../components/pricing-sections/pricing-tiers";
import { CTA } from "../components/cta-sections/cta-centered";
import { Footer } from "../components/footer/footer-full";

export default function SaaSClassicPage() {
  return (
    <main className="min-h-screen bg-black text-white antialiased">
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
