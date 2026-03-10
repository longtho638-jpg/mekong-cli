import HeroSection from '@/components/hero-section'
import FeaturesGrid from '@/components/features-grid'
import PricingTable from '@/components/pricing-table'
import FooterSection from '@/components/footer-section'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <HeroSection />
      <FeaturesGrid />
      <PricingTable />
      <FooterSection />
    </main>
  )
}
