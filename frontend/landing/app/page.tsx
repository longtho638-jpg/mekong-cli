import HeroSection from '@/components/hero-section'
import PyramidHero from '@/components/pyramid-hero'
import StatsBar from '@/components/stats-bar'
import CascadeDemo from '@/components/cascade-demo'
import FeaturesGrid from '@/components/features-grid'
import HowItWorks from '@/components/how-it-works'
import ComparisonSection from '@/components/comparison-section'
import ServiceCards from '@/components/service-cards'
import QuickstartSection from '@/components/quickstart-section'
import PricingTable from '@/components/pricing-table'
import FooterSection from '@/components/footer-section'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <HeroSection />
      <PyramidHero />
      <StatsBar />
      <CascadeDemo />
      <FeaturesGrid />
      <HowItWorks />
      <ComparisonSection />
      <ServiceCards />
      <QuickstartSection />
      <PricingTable />
      <FooterSection />
    </main>
  )
}
