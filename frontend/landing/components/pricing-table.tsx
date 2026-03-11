import { TIERS } from '@/data/pricing'

const TIER_ICONS = ['🆓', '🚀', '⚡', '🏢']

export default function PricingTable() {
  return (
    <section id="pricing" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Simple pricing
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            Free forever,{' '}
            <span className="gradient-text">pay when you scale</span>
          </h2>
          <p className="text-[var(--md-on-surface-variant)]">
            Open source CLI is free. Credits unlock managed super commands.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, idx) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl p-7 transition-all duration-300 ${
                tier.highlight
                  ? 'border border-[var(--md-primary-container)] bg-[var(--md-surface-container)] shadow-2xl shadow-[var(--md-primary)]/10 scale-[1.02]'
                  : 'border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] hover:border-[var(--md-outline)] hover:-translate-y-1'
              }`}
            >
              {/* Top gradient line for highlighted */}
              {tier.highlight && (
                <div className="absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[var(--md-primary)]/60 to-transparent" />
              )}

              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-blue-500/30 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier header */}
              <div className="mb-6">
                <div className="mb-3 text-2xl">{TIER_ICONS[idx]}</div>
                <h3 className="mb-1 text-lg font-bold text-[var(--md-on-surface)]">{tier.name}</h3>
                <p className="mb-4 text-sm text-[var(--md-on-surface-variant)]">{tier.desc}</p>

                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-extrabold tracking-tight ${tier.highlight ? 'gradient-text' : 'text-[var(--md-on-surface)]'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="mb-1.5 text-sm text-[var(--md-on-surface-variant)]">{tier.period}</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="mb-5 h-px bg-[var(--md-outline-variant)]" />

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--md-on-surface)]">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--md-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={tier.ctaHref}
                className={`block rounded-lg py-3.5 text-center text-sm font-semibold transition-all ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-90'
                    : 'border border-[var(--md-outline)] text-[var(--md-on-surface-variant)] hover:border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* MCU explanation */}
        <div className="mt-10 rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--md-on-surface)]">What is an MCU?</p>
              <p className="mt-0.5 text-xs text-[var(--md-on-surface-variant)]">
                MCU = Mekong Credit Unit. 1 MCU = 1 agent task execution. Pricing based on complexity.
              </p>
            </div>
            <div className="flex gap-6 text-center text-xs">
              <div>
                <div className="font-mono font-bold text-emerald-400">1 MCU</div>
                <div className="text-[var(--md-on-surface-variant)]">Simple tasks</div>
              </div>
              <div>
                <div className="font-mono font-bold text-blue-400">3 MCU</div>
                <div className="text-[var(--md-on-surface-variant)]">Standard tasks</div>
              </div>
              <div>
                <div className="font-mono font-bold text-[var(--md-secondary)]">5 MCU</div>
                <div className="text-[var(--md-on-surface-variant)]">Complex tasks</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
