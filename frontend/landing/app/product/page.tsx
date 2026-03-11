import LayerPageHero from '@/components/layer-page-hero'
import CommandGrid from '@/components/command-grid'
import SiteNav from '@/components/site-nav'
import { COMMANDS } from '@/data/commands'
import { LAYERS } from '@/data/layers'
import Link from 'next/link'

const productLayer = LAYERS.find((l) => l.id === 'product')!
const productCommands = COMMANDS.filter((c) => c.layer === 'product')

const FLOW_STEPS = ['plan', 'brainstorm', 'scope', 'sprint', 'roadmap']

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <LayerPageHero
        icon={productLayer.icon}
        title="Product Management"
        subtitle="Planning, sprints, roadmap — from idea to delivery."
        commandCount={productCommands.length}
        color={productLayer.color}
      />

      {/* Planning flow */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="glass rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--md-on-surface-variant)]">
              Planning Flow
            </h2>
            <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
              {FLOW_STEPS.map((step, i) => (
                <span key={step} className="flex items-center gap-3">
                  <span className="rounded-lg border border-[var(--md-secondary-container)] bg-[var(--md-secondary-container)] px-3 py-1.5 text-[var(--md-secondary)]">
                    /{step}
                  </span>
                  {i < FLOW_STEPS.length - 1 && (
                    <span className="text-[var(--md-on-surface-variant)]">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commands grid */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-xl font-bold text-[var(--md-on-surface)]">
            All Product Commands
          </h2>
          <CommandGrid commands={productCommands} columns={3} />
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
