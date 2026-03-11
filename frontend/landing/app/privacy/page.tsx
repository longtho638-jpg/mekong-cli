import SiteNav from '@/components/site-nav'
import FooterSection from '@/components/footer-section'

export const metadata = {
  title: 'Privacy Policy — Mekong CLI',
  description: 'Privacy Policy for Mekong CLI platform.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <article className="prose prose-invert prose-slate mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--md-on-surface)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--md-on-surface-variant)]">Last updated: March 2026</p>

        <h2>1. Data We Collect</h2>
        <p>
          Mekong CLI collects minimal data. The CLI runs locally on your machine. We collect:
        </p>
        <ul>
          <li>Account email and billing information (via Polar.sh)</li>
          <li>MCU usage metrics (command type, credit consumption)</li>
          <li>Anonymous usage analytics (opt-out available)</li>
        </ul>

        <h2>2. Data We Do Not Collect</h2>
        <ul>
          <li>Your source code — the CLI processes everything locally</li>
          <li>Your LLM API keys — BYOK keys stay on your machine</li>
          <li>LLM conversation content — routed directly to your chosen provider</li>
        </ul>

        <h2>3. Third-Party Services</h2>
        <p>We integrate with the following services:</p>
        <ul>
          <li><strong>Polar.sh</strong> — Payment processing and subscription management</li>
          <li><strong>Cloudflare</strong> — API gateway and content delivery</li>
          <li><strong>Supabase</strong> — Account data and MCU balance storage</li>
        </ul>
        <p>Each service has its own privacy policy governing data they process.</p>

        <h2>4. Cookies</h2>
        <p>
          This website uses essential cookies only for session management. No advertising
          or tracking cookies are used.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          Account data is retained while your account is active. Usage metrics are aggregated
          and anonymized after 90 days. You can request account deletion at any time.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request data deletion</li>
          <li>Opt out of analytics</li>
          <li>Export your account data</li>
        </ul>

        <h2>7. Contact</h2>
        <p>
          Privacy questions? Contact us at{' '}
          <a href="mailto:privacy@agencyos.network" className="text-[var(--md-primary)] hover:text-[var(--md-on-primary-container)]">
            privacy@agencyos.network
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
