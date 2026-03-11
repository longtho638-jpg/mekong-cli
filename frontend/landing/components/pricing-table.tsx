import { TIERS } from '@/data/pricing'

const TIER_ICONS = ['🆓', '🚀', '⚡', '🏢']

export default function PricingTable() {
  return (
    <section id="pricing" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Simple pricing
          </p>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Free forever,{' '}
            <span className="gradient-text">pay when you scale</span>
          </h2>
          <p className="text-slate-400">
            Open source CLI is free. Credits unlock managed super commands.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, idx) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl p-7 transition-all duration-300 ${
                tier.highlight
                  ? 'border border-cyan-500/40 bg-gradient-to-b from-slate-900/90 to-indigo-950/40 shadow-2xl shadow-cyan-500/10 scale-[1.02]'
                  : 'border border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:-translate-y-1'
              }`}
            >
              {/* Top gradient line for highlighted */}
              {tier.highlight && (
                <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
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
                <h3 className="mb-1 text-lg font-bold text-white">{tier.name}</h3>
                <p className="mb-4 text-sm text-slate-400">{tier.desc}</p>

                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-extrabold tracking-tight ${tier.highlight ? 'gradient-text' : 'text-white'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="mb-1.5 text-sm text-slate-500">{tier.period}</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="mb-5 h-px bg-slate-800/60" />

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={tier.ctaHref}
                className={`block rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-90'
                    : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* MCU explanation */}
        <div className="mt-10 rounded-xl border border-slate-800/40 bg-slate-900/30 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">What is an MCU?</p>
              <p className="mt-0.5 text-xs text-slate-500">
                MCU = Mekong Credit Unit. 1 MCU = 1 agent task execution. Pricing based on complexity.
              </p>
            </div>
            <div className="flex gap-6 text-center text-xs">
              <div>
                <div className="font-mono font-bold text-emerald-400">1 MCU</div>
                <div className="text-slate-500">Simple tasks</div>
              </div>
              <div>
                <div className="font-mono font-bold text-blue-400">3 MCU</div>
                <div className="text-slate-500">Standard tasks</div>
              </div>
              <div>
                <div className="font-mono font-bold text-purple-400">5 MCU</div>
                <div className="text-slate-500">Complex tasks</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
