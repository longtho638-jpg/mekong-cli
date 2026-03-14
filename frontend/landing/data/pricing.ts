// Single source of truth for pricing tiers, FAQs, and credit tiers.
// Free tier = open source CLI. Starter $49 / Pro $149 / Enterprise $499 (MCU credits).

export interface PricingTier {
  name: string
  price: string
  period: string
  desc: string
  cta: string
  ctaHref: string
  highlight: boolean
  badge?: string
  features: string[]
}

export const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Open source CLI with your own LLM key. No credits needed.',
    cta: 'Get started',
    ctaHref: 'https://github.com/longtho638-jpg/mekong-cli',
    highlight: false,
    badge: undefined,
    features: [
      'Full CLI — 342 commands',
      'Bring your own LLM (any provider)',
      'Community support',
      'BSL 1.1 — use freely, auto-MIT 2030',
    ],
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    desc: 'For solo founders running their first AI agency.',
    cta: 'Start free trial',
    ctaHref: 'https://polar.sh/mekong-cli/checkout?product=starter',
    highlight: false,
    badge: undefined,
    features: [
      '200 credits / month',
      'All base commands',
      '10 super commands',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/month',
    desc: 'For teams shipping at scale with parallel AI agents.',
    cta: 'Start Pro',
    ctaHref: 'https://polar.sh/mekong-cli/checkout?product=pro',
    highlight: true,
    badge: 'Most popular',
    features: [
      '1,000 credits / month',
      'All 94 super commands',
      '103 DAG recipe workflows',
      'Tom Hum autonomous daemon',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/month',
    desc: 'Unlimited AI power for serious engineering teams.',
    cta: 'Contact sales',
    ctaHref: 'https://polar.sh/mekong-cli/checkout?product=enterprise',
    highlight: false,
    badge: undefined,
    features: [
      'Unlimited credits',
      'Custom AI agents',
      'White-label options',
      'SLA 99.9% uptime',
      'Dedicated onboarding',
      '24/7 priority support',
    ],
  },
]

export interface CreditTier {
  complexity: string
  commands: string
  color: string
}

export const CREDIT_TIERS: CreditTier[] = [
  { complexity: 'Simple (1 credit)', commands: '/status, /help, /plan', color: 'text-green-400' },
  { complexity: 'Standard (3 credits)', commands: '/cook, /fix, /review, /sales', color: 'text-blue-400' },
  { complexity: 'Complex (5 credits)', commands: '/deploy, /cap-table, /negotiate, IPO commands', color: 'text-purple-400' },
]

export interface FAQ {
  q: string
  a: string
}

export const FAQS: FAQ[] = [
  {
    q: 'What is an MCU?',
    a: 'MCU = Mekong Credit Unit. 1 MCU = 1 agent task execution. Pricing is based on task complexity.',
  },
  {
    q: 'What happens when I run out of credits?',
    a: 'The API returns HTTP 402 (Payment Required). You can buy more credits or upgrade your plan anytime.',
  },
  {
    q: 'Can I use it for free?',
    a: 'Yes. The CLI is source-available (BSL 1.1). Install it, bring your own LLM key, and run all 342 commands with no credits needed.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Cancel anytime, no fees. No long-term commitment, no hidden charges.',
  },
  {
    q: 'Can Enterprise be customized?',
    a: 'Yes. Enterprise plan supports custom agents, white-label, and dedicated SLA. Contact us for a quote tailored to your team.',
  },
]
