export interface Service {
  id: string
  title: string
  description: string
  credits: number
  priceUsd: number
  durationMin: number
  category: 'founder' | 'business' | 'product' | 'engineering' | 'marketing'
  superCommand: string
}

export const SERVICES: Service[] = [
  {
    id: 'founder-raise-kit',
    title: 'Fundraise Kit',
    description: '8 commands parallel — unit economics, TAM, moat audit, financial model, data room, pitch practice, investor targeting.',
    credits: 30,
    priceUsd: 99,
    durationMin: 45,
    category: 'founder',
    superCommand: '/founder:raise',
  },
  {
    id: 'validation-sprint',
    title: 'Business Validation',
    description: '5 commands — customer discovery, market sizing, SWOT, unit economics, moat audit. Go/no-go verdict.',
    credits: 20,
    priceUsd: 69,
    durationMin: 25,
    category: 'founder',
    superCommand: '/founder:validate-sprint',
  },
  {
    id: 'revenue-engine',
    title: 'Revenue Engine Setup',
    description: '7 commands — market research, lead gen, pipeline design, CRM setup, sales playbook.',
    credits: 28,
    priceUsd: 89,
    durationMin: 40,
    category: 'business',
    superCommand: '/business:revenue-engine',
  },
  {
    id: 'product-discovery',
    title: 'Product Discovery Sprint',
    description: '5 commands — personas, competitive analysis, brainstorming, scoping, estimation.',
    credits: 20,
    priceUsd: 69,
    durationMin: 30,
    category: 'product',
    superCommand: '/product:discovery',
  },
  {
    id: 'ship-pipeline',
    title: 'Ship Pipeline',
    description: '6 commands — code, test, lint, typecheck, review, deploy staging. Full CI in one command.',
    credits: 22,
    priceUsd: 79,
    durationMin: 35,
    category: 'engineering',
    superCommand: '/engineering:ship',
  },
  {
    id: 'content-engine',
    title: 'Content Marketing Engine',
    description: '5 commands — SEO research, content calendar, blog drafts, social posts, email sequences.',
    credits: 20,
    priceUsd: 69,
    durationMin: 35,
    category: 'marketing',
    superCommand: '/marketing:content-engine',
  },
]
