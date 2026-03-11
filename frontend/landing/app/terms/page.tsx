import SiteNav from '@/components/site-nav'
import FooterSection from '@/components/footer-section'

export const metadata = {
  title: 'Terms of Service — Mekong CLI',
  description: 'Terms of Service for Mekong CLI platform.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <article className="prose prose-invert prose-slate mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--md-on-surface)]">Terms of Service</h1>
        <p className="text-sm text-[var(--md-on-surface-variant)]">Last updated: March 2026</p>

        <h2>1. Service Description</h2>
        <p>
          Mekong CLI is an AI-powered command-line platform that helps
          founders and developers build, deploy, and operate software companies using autonomous
          AI agents. The platform operates on a Bring-Your-Own-Key (BYOK) model — you provide
          your own LLM API keys.
        </p>

        <h2>2. Accounts &amp; Billing</h2>
        <p>
          Paid tiers are billed through Polar.sh. Mekong Credit Units (MCU) are consumed per
          command execution. Credits are non-refundable except for cancelled missions. The CLI
          is open-source and free to use with your own LLM keys.
        </p>

        <h2>3. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the platform for any unlawful purpose</li>
          <li>Reverse-engineer the commercial RaaS layer</li>
          <li>Distribute your license key to unauthorized parties</li>
          <li>Exceed reasonable API rate limits</li>
        </ul>

        <h2>4. Intellectual Property</h2>
        <p>
          The Mekong CLI core engine is open-source under its published license. The RaaS
          (Robot-as-a-Service) commercial layer is proprietary. Code you generate using the
          platform belongs to you.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          Mekong CLI is provided &quot;as is&quot; without warranties of any kind. We are not liable
          for any damages arising from your use of AI-generated code or autonomous agent actions.
          You are responsible for reviewing and testing all generated output.
        </p>

        <h2>6. Changes</h2>
        <p>
          We may update these terms at any time. Continued use of the platform after changes
          constitutes acceptance.
        </p>

        <h2>7. Contact</h2>
        <p>
          Questions about these terms? Contact us at{' '}
          <a href="mailto:legal@agencyos.network" className="text-[var(--md-primary)] hover:text-[var(--md-on-primary-container)]">
            legal@agencyos.network
          </a>
        </p>

        <p className="mt-8 text-xs text-[var(--md-on-surface-variant)]">
          © 2026 Binh Phap Venture Studio. All rights reserved.
        </p>
      </article>
      <FooterSection />
    </main>
  )
}
