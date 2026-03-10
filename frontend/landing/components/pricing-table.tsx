const TIERS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    desc: 'Perfect for solo developers shipping AI-powered code.',
    cta: 'Get Starter',
    ctaHref: '#',
    highlight: false,
    features: [
      '1,000 MCU / month',
      'Core CLI commands',
      'Community plugins',
      'Plan-Execute-Verify engine',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/mo',
    desc: 'For teams shipping production code at scale.',
    cta: 'Get Growth',
    ctaHref: '#',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '10,000 MCU / month',
      'Premium AI agents',
      'RaaS license gating',
      'Priority support (24h)',
      'Antigravity Proxy access',
      'All 80+ skills unlocked',
    ],
  },
  {
    name: 'Premium',
    price: '$499',
    period: '/mo',
    desc: 'Unlimited AGI power for serious engineering teams.',
    cta: 'Get Premium',
    ctaHref: '#',
    highlight: false,
    features: [
      'Unlimited MCU',
      'AGI auto-pilot mode',
      'Team collaboration',
      'SLA 99.9% uptime',
      'Custom skill development',
      'Dedicated onboarding',
      'White-label options',
    ],
  },
]

export default function PricingTable() {
  return (
    <section id="pricing" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Simple, transparent{' '}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-slate-400">
            Scale as you ship. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-colors ${
                tier.highlight
                  ? 'border-blue-500 bg-slate-900 glow-blue'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1 text-xs font-semibold text-white whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              <div className="mb-5">
                <h3 className="mb-1 text-lg font-bold text-white">{tier.name}</h3>
                <div className="mb-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  <span className="mb-1 text-slate-400">{tier.period}</span>
                </div>
                <p className="text-sm text-slate-400">{tier.desc}</p>
              </div>

              <ul className="mb-7 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-cyan-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.ctaHref}
                className={`block rounded-xl py-3 text-center font-semibold transition-opacity hover:opacity-90 ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          MCU = Mekong Compute Units. 1 MCU ≈ 1 agent task execution.
          All prices in USD. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
