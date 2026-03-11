// Single source of truth for pricing tiers, FAQs, and credit tiers.
// Pricing model: Starter $49 / Pro $149 / Enterprise $499 (MCU credits)
// Free tier = CLI is open-source, use with own LLM key (BYOK). No $0 tier.

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
    name: 'Starter',
    price: '$49',
    period: '/tháng',
    desc: 'Dành cho solo founder và developer mới bắt đầu.',
    cta: 'Bắt đầu Starter',
    ctaHref: 'https://polar.sh/mekong-cli/checkout?product=starter',
    highlight: false,
    badge: undefined,
    features: [
      '100 credits / tháng',
      'Task đơn giản (1 credit)',
      'Core CLI commands',
      'Plan-Execute-Verify engine',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/tháng',
    desc: 'Cho team ship production code ở quy mô lớn.',
    cta: 'Bắt đầu Pro',
    ctaHref: 'https://polar.sh/mekong-cli/checkout?product=pro',
    highlight: true,
    badge: 'Phổ biến nhất',
    features: [
      '1,000 credits / tháng',
      'Tất cả mức độ phức tạp (1-5 credits)',
      'Tôm Hùm daemon tự động',
      'BYOK LLM — OpenRouter / Ollama / Direct API',
      'Priority support (24h)',
      'Tất cả skills',
    ],
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/tháng',
    desc: 'Unlimited AI power cho engineering team nghiêm túc.',
    cta: 'Liên hệ Enterprise',
    ctaHref: 'https://polar.sh/mekong-cli/checkout?product=enterprise',
    highlight: false,
    badge: undefined,
    features: [
      'Unlimited credits',
      'Custom AI agents',
      'SLA 99.9% uptime',
      'Dedicated onboarding',
      'White-label options',
      'Hỗ trợ ưu tiên 24/7',
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
    q: 'MCU là gì?',
    a: 'MCU = Mekong Credit Unit. 1 MCU = 1 agent task execution. Giá tính theo mức độ phức tạp của task.',
  },
  {
    q: 'Hết credit thì sao?',
    a: 'API trả HTTP 402 (Payment Required). Bạn có thể mua thêm credit hoặc upgrade lên plan cao hơn bất cứ lúc nào.',
  },
  {
    q: 'Huỷ được không?',
    a: 'Huỷ bất cứ lúc nào, không phí. Không cam kết dài hạn, không phí ẩn.',
  },
  {
    q: 'Enterprise tùy chỉnh được không?',
    a: 'Có. Enterprise plan hỗ trợ custom agents, white-label, và SLA riêng. Liên hệ để nhận quote phù hợp với team của bạn.',
  },
]
