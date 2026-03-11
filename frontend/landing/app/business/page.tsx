import LayerPageHero from '@/components/layer-page-hero'
import CommandGrid from '@/components/command-grid'
import SiteNav from '@/components/site-nav'
import { COMMANDS } from '@/data/commands'
import { LAYERS } from '@/data/layers'
import Link from 'next/link'

const businessLayer = LAYERS.find((l) => l.id === 'business')!
const allBiz = COMMANDS.filter((c) => c.layer === 'business')

const DEPARTMENTS = [
  {
    icon: '💼',
    title: 'Sales',
    ids: ['sales', 'pipeline', 'leadgen', 'client', 'crm', 'close'],
  },
  {
    icon: '📣',
    title: 'Marketing',
    ids: ['marketing', 'ads', 'social', 'seo', 'content', 'affiliate'],
  },
  {
    icon: '💰',
    title: 'Finance',
    ids: ['finance', 'invoice', 'invoice-gen', 'expense', 'tax', 'cashflow', 'revenue'],
  },
  {
    icon: '👥',
    title: 'HR',
    ids: ['hr', 'nhan-su', 'contract'],
  },
]

export default function BusinessPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <LayerPageHero
        icon={businessLayer.icon}
        title="Business Operations"
        subtitle="Sales, marketing, finance, HR — your revenue engine."
        commandCount={allBiz.length}
        color={businessLayer.color}
      />

      {/* Department sections */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl space-y-10">
          {DEPARTMENTS.map((dept) => {
            const cmds = allBiz.filter((c) => dept.ids.includes(c.id))
            const display = dept.ids.map((id) => {
              const found = cmds.find((c) => c.id === id)
              return (
                found ?? {
                  id,
                  displayName: id,
                  description: `Execute ${id} command`,
                  creditCost: 3,
                }
              )
            })

            return (
              <div key={dept.title}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">{dept.icon}</span>
                  <h2 className="text-lg font-bold text-[var(--md-on-surface)]">{dept.title}</h2>
                  <span className="rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-2 py-0.5 text-xs text-[var(--md-on-surface-variant)]">
                    {display.length} commands
                  </span>
                </div>
                <CommandGrid commands={display} columns={3} />
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 text-center">
        <Link
          href="/#quickstart"
          className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        >
          Get started →
        </Link>
      </section>
    </main>
  )
}
