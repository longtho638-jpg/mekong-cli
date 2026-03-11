import LayerPageHero from '@/components/layer-page-hero'
import CommandGrid from '@/components/command-grid'
import SiteNav from '@/components/site-nav'
import { COMMANDS } from '@/data/commands'
import { LAYERS } from '@/data/layers'
import Link from 'next/link'

const founderLayer = LAYERS.find((l) => l.id === 'founder')!
const founderCommands = COMMANDS.filter((c) => c.layer === 'founder')

export default function FounderPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <LayerPageHero
        icon={founderLayer.icon}
        title="Founder Command Center"
        subtitle="46 commands to build an investable company. VC-grade tools from Day 1."
        commandCount={founderCommands.length}
        color={founderLayer.color}
      />

      {/* Commands grid */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-xl font-bold text-[var(--md-on-surface)]">
            All Founder Commands
          </h2>
          <CommandGrid commands={founderCommands} columns={3} />
        </div>
      </section>

      {/* Cascade section */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="glass-highlight rounded-xl p-8">
            <h2 className="mb-3 text-xl font-bold text-[var(--md-on-surface)]">
              Cascade Intelligence
            </h2>
            <p className="mb-6 text-[var(--md-on-surface-variant)]">
              When you run <code className="font-mono text-[var(--md-primary)]">/annual</code>, AI cascades across the entire company — no manual delegation needed.
            </p>
            <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
              {['👑 /annual', '→', '🏢 Business', '→', '📦 Product', '→', '⚙️ Engineering', '→', '🔧 Ops'].map(
                (item, i) => (
                  <span
                    key={i}
                    className={
                      item === '→'
                        ? 'text-[var(--md-on-surface-variant)]'
                        : 'rounded-lg border border-[var(--md-primary-container)] bg-[var(--md-primary-container)] px-3 py-1.5 text-[var(--md-primary)]'
                    }
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
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
