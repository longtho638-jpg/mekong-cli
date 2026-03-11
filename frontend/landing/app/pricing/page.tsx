import SiteNav from '@/components/site-nav'
import { TIERS, CREDIT_TIERS, FAQS } from '@/data/pricing'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />

      {/* Hero */}
      <section className="px-6 pb-8 pt-12 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-4xl font-extrabold text-[var(--md-on-surface)] sm:text-5xl">
            Pricing —{' '}
            <span className="gradient-text">pay per credit, no hidden fees</span>
          </h1>
          <p className="text-lg text-[var(--md-on-surface-variant)]">
            Scale when you need to. Cancel anytime. No long-term commitment.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-xl p-7 ${
                  tier.highlight ? 'glass-highlight' : 'glass-card'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1 text-xs font-semibold text-white whitespace-nowrap">
                    {tier.badge}
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="mb-1 text-lg font-bold text-[var(--md-on-surface)]">{tier.name}</h2>
                  <div className="mb-2 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[var(--md-on-surface)]">{tier.price}</span>
                    <span className="mb-1 text-[var(--md-on-surface-variant)]">{tier.period}</span>
                  </div>
                  <p className="text-sm text-[var(--md-on-surface-variant)]">{tier.desc}</p>
                </div>

                <ul className="mb-7 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--md-on-surface)]">
                      <span className="mt-0.5 text-[var(--md-primary)]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`block rounded-xl py-3 text-center font-semibold transition-opacity hover:opacity-90 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'border border-[var(--md-outline)] text-[var(--md-on-surface-variant)] hover:border-[var(--md-outline-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-[var(--md-on-surface-variant)]">
            Priced in USD. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Credit explanation */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="glass-card rounded-xl p-8">
            <h2 className="mb-6 text-xl font-bold text-[var(--md-on-surface)]">How credits work</h2>
            <div className="space-y-4">
              {CREDIT_TIERS.map((ct) => (
                <div key={ct.complexity} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                  <span className={`shrink-0 font-semibold ${ct.color} text-sm w-44`}>
                    {ct.complexity}
                  </span>
                  <span className="font-mono text-xs text-[var(--md-on-surface-variant)]">{ct.commands}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-[var(--md-on-surface-variant)]">
              Free commands (0 credit): <span className="font-mono text-[var(--md-on-surface)]">/status, /help, /founder/ARCHITECTURE, /raas</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--md-on-surface)]">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="glass-card rounded-xl p-6">
                <h3 className="mb-2 font-semibold text-[var(--md-on-surface)]">{faq.q}</h3>
                <p className="text-sm text-[var(--md-on-surface-variant)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
