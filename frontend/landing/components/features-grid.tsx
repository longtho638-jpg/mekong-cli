const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-[var(--md-tertiary)] bg-[var(--md-tertiary-container)] border-[var(--md-tertiary-container)]',
    title: '89 Super Workflows',
    desc: 'One command triggers parallel AI agents. CEO to intern, every role has workflows that orchestrate multiple agents simultaneously.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: 'text-[var(--md-primary)] bg-[var(--md-primary-container)] border-[var(--md-primary-container)]',
    title: 'DAG Recipe Engine',
    desc: '85 workflow recipes with dependency graphs. Parallel groups execute simultaneously, sequential chains ensure order.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    title: 'Universal LLM',
    desc: 'LiteLLM proxy auto-routes: Qwen $10/mo → DeepSeek → Ollama local. Budget enforcement per tenant. Zero config.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
      </svg>
    ),
    color: 'text-[var(--md-tertiary)] bg-[var(--md-tertiary-container)] border-[var(--md-tertiary-container)]',
    title: '6 Business Layers',
    desc: 'Studio → Founder → Business → Product → Engineering → Ops. Strategy cascades down automatically through every layer.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    color: 'text-[var(--md-secondary)] bg-[var(--md-secondary-container)] border-[var(--md-secondary-container)]',
    title: 'Autonomous Operations',
    desc: 'HEARTBEAT scheduler runs tasks while you sleep. Jidoka self-healing catches errors at 3AM. Telegram alerts if critical.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    title: 'Open Source 100%',
    desc: 'BSL 1.1 (auto-MIT 2030). 342 commands, 463 skills, 127 agents. Fork and run your AI company — zero vendor lock-in.',
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Core capabilities
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            Why choose{' '}
            <span className="gradient-text">Mekong CLI?</span>
          </h2>
          <p className="mx-auto max-w-xl text-[var(--md-on-surface-variant)]">
            Super commands orchestrate parallel AI agents across DAG recipe workflows — open source, any LLM.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6 transition-all duration-300 hover:border-[var(--md-outline)] hover:bg-[var(--md-surface-container)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              {/* Icon */}
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${f.color}`}>
                {f.icon}
              </div>

              <h3 className="mb-2 font-semibold text-[var(--md-on-surface)]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--md-on-surface-variant)]">{f.desc}</p>

              {/* Hover accent line */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--md-primary)]/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
