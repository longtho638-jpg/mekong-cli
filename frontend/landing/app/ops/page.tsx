import LayerPageHero from '@/components/layer-page-hero'
import CommandGrid from '@/components/command-grid'
import SiteNav from '@/components/site-nav'
import { COMMANDS } from '@/data/commands'
import { LAYERS } from '@/data/layers'
import Link from 'next/link'

const opsLayer = LAYERS.find((l) => l.id === 'ops')!
const allOps = COMMANDS.filter((c) => c.layer === 'ops')

const GROUPS = [
  {
    icon: '📊',
    title: 'Monitoring',
    ids: ['audit', 'health', 'status', 'report', 'benchmark'],
  },
  {
    icon: '🔒',
    title: 'Security',
    ids: ['security', 'env'],
  },
  {
    icon: '🚀',
    title: 'Sync & Deploy',
    ids: [
      'init', 'install', 'setup-mcp', 'use-mcp', 'update', 'clean',
      'rollback', 'smoke', 'sync-agent', 'sync-all', 'sync-providers',
      'sync-artifacts', 'sync-browser', 'sync-editor', 'sync-mcp',
      'sync-rules', 'sync-tasks', 'win-check', 'help', 'raas',
    ],
  },
]

const TERMINAL_LINES = [
  { prompt: '$', cmd: 'mekong health', delay: 0 },
  { prompt: '>', output: 'LLM      ✓  provider connected', delay: 300 },
  { prompt: '>', output: 'Supabase ✓  connected', delay: 500 },
  { prompt: '>', output: 'Credits  ✓  42 MCU remaining', delay: 700 },
  { prompt: '>', output: 'Status   ✓  All systems operational', delay: 900 },
]

export default function OpsPage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <LayerPageHero
        icon={opsLayer.icon}
        title="Operations Center"
        subtitle="Monitor, audit, security, sync — the foundation layer."
        commandCount={allOps.length}
        color={opsLayer.color}
      />

      {/* Terminal demo */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="glass rounded-xl p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-2 font-mono text-xs text-[var(--md-on-surface-variant)]">
                mekong — ops
              </span>
            </div>
            <div className="space-y-1 font-mono text-sm">
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[var(--md-outline)]">{line.prompt}</span>
                  {line.cmd ? (
                    <span className="text-[var(--md-on-surface)]">{line.cmd}</span>
                  ) : (
                    <span className="text-emerald-400">{line.output}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Groups */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl space-y-10">
          {GROUPS.map((group) => {
            const cmds = group.ids.map((id) => {
              const found = allOps.find((c) => c.id === id)
              return (
                found ?? {
                  id,
                  displayName: id,
                  description: `Execute ${id} command`,
                  creditCost: 0,
                }
              )
            })
            return (
              <div key={group.title}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <h2 className="text-lg font-bold text-[var(--md-on-surface)]">{group.title}</h2>
                  <span className="rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-2 py-0.5 text-xs text-[var(--md-on-surface-variant)]">
                    {cmds.length} commands
                  </span>
                </div>
                <CommandGrid commands={cmds} columns={3} />
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
