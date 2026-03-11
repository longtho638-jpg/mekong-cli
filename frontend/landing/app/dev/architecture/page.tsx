import Link from 'next/link'
import SiteNav from '@/components/site-nav'

const TECH_STACK = [
  { layer: 'CLI', tech: 'Python / Typer / Rich', desc: 'Command-line interface, Rich UI, type hints' },
  { layer: 'API', tech: 'FastAPI / Cloudflare Workers', desc: 'Local gateway + edge deployment' },
  { layer: 'PEV', tech: 'src/core/ planner→executor→verifier', desc: 'Plan–Execute–Verify orchestration loop' },
  { layer: 'LLM', tech: 'Claude + Gemini + Qwen + Ollama', desc: 'Universal LLM endpoint — any OpenAI-compatible provider' },
  { layer: 'DB', tech: 'Supabase (prod) / SQLite (dev)', desc: 'Persistent state, credits, mission log' },
  { layer: 'Billing', tech: 'Polar.sh + MCU credits', desc: '1 MCU = 1 credit, webhooks → src/raas/credits.py' },
]

const PEV_ASCII = `┌─────────┐    ┌─────────┐    ┌─────────┐
│  PLAN   │───▶│ EXECUTE │───▶│ VERIFY  │
│ Planner │    │Executor │    │Verifier │
│   LLM   │    │Shell/API│    │ Gates   │
└─────────┘    └─────────┘    └─────────┘
     │              │              │
     └──────────────┴──────────────┘
              Orchestrator`

const CASCADE_ASCII = `👑 Founder ──▶ 🏢 Business ──▶ 📦 Product ──▶ ⚙️ Engineering ──▶ 🔧 Ops
   /annual       /sales           /roadmap        /cook              /deploy`

const AGENT_ASCII = `              ┌──────────────────┐
              │   Orchestrator   │
              └────────┬─────────┘
          ┌────────────┼────────────┐
    ┌─────▼─────┐ ┌────▼─────┐ ┌───▼──────┐
    │  Planner  │ │ Executor │ │ Verifier │
    │ (LLM dec.)│ │ (shell)  │ │ (gates)  │
    └───────────┘ └──────────┘ └──────────┘

18 hubs · 127 agents · LLM Router: Claude / Gemini / Qwen / Ollama`

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-[var(--md-surface)]">
      <SiteNav />
      <div className="px-4 pb-16 pt-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Back nav */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
          >
            ← Home
          </Link>

          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mb-4 text-4xl">⚙️</div>
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
              <span className="gradient-text">Architecture</span>
            </h1>
            <p className="text-lg text-[var(--md-on-surface-variant)]">Mekong CLI system architecture</p>
          </div>

          {/* Section 1: PEV Pipeline */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-[var(--md-on-surface)]">
              1. PEV Pipeline
            </h2>
            <p className="mb-4 text-sm text-[var(--md-on-surface-variant)]">
              Every command runs through 3 phases:{' '}
              <span className="text-[var(--md-primary)]">Plan → Execute → Verify</span>.
              The Orchestrator manages the full loop and auto-rolls back on
              verification failure.
            </p>
            <div className="glass-card rounded-xl p-5">
              <pre className="overflow-x-auto font-mono text-xs text-[var(--md-primary)] sm:text-sm">
                {PEV_ASCII}
              </pre>
            </div>
          </section>

          {/* Section 2: 5-Layer Cascade */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-[var(--md-on-surface)]">
              2. 5-Layer Pyramid
            </h2>
            <p className="mb-4 text-sm text-[var(--md-on-surface-variant)]">
              Strategy cascades from Founder down to Ops. Each layer receives output from
              the layer above and provides input to the layer below.
            </p>
            <div className="glass-card rounded-xl p-5">
              <pre className="overflow-x-auto font-mono text-xs text-[var(--md-primary)] sm:text-sm whitespace-pre">
                {CASCADE_ASCII}
              </pre>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { icon: '👑', label: 'Founder', color: 'text-[var(--md-tertiary)]' },
                { icon: '🏢', label: 'Business', color: 'text-blue-400' },
                { icon: '📦', label: 'Product', color: 'text-[var(--md-secondary)]' },
                { icon: '⚙️', label: 'Engineering', color: 'text-[var(--md-primary)]' },
                { icon: '🔧', label: 'Ops', color: 'text-orange-400' },
              ].map((l) => (
                <div key={l.label} className="glass-card rounded-lg p-3 text-center">
                  <div className="text-xl">{l.icon}</div>
                  <div className={`mt-1 text-xs font-medium ${l.color}`}>
                    {l.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Agent Hierarchy */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-[var(--md-on-surface)]">
              3. Agent Hierarchy
            </h2>
            <p className="mb-4 text-sm text-[var(--md-on-surface-variant)]">
              The Orchestrator spawns specialized sub-agents. 18 hubs coordinate
              127 agents, each running on the most suitable LLM.
            </p>
            <div className="glass-card rounded-xl p-5">
              <pre className="overflow-x-auto font-mono text-xs text-[var(--md-primary)] sm:text-sm">
                {AGENT_ASCII}
              </pre>
            </div>
          </section>

          {/* Section 4: Tech Stack */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-[var(--md-on-surface)]">
              4. Tech Stack
            </h2>
            <div className="glass-card overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--md-outline-variant)]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                      Layer
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                      Technology
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)] sm:table-cell">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TECH_STACK.map((row, i) => (
                    <tr
                      key={row.layer}
                      className={i < TECH_STACK.length - 1 ? 'border-b border-[var(--md-outline-variant)]' : ''}
                    >
                      <td className="px-5 py-3 font-mono text-xs font-bold text-[var(--md-primary)] whitespace-nowrap">
                        {row.layer}
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--md-on-surface)]">
                        {row.tech}
                      </td>
                      <td className="hidden px-5 py-3 text-xs text-[var(--md-on-surface-variant)] sm:table-cell">
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer nav */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <Link
              href="/dev/quickstart"
              className="glass-card rounded-lg px-5 py-2.5 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
            >
              ← Quickstart
            </Link>
            <Link
              href="/dev/commands"
              className="glass-card rounded-lg px-5 py-2.5 text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
            >
              ← Command Explorer
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
