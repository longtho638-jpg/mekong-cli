const STEPS = [
  {
    role: '🏯 Studio',
    cmd: '$ mekong studio:launch:full "AI SaaS"',
    out: 'Thesis → Terrain → Source → Screen → Five-Factors ✓',
    color: 'text-violet-400',
    border: 'border-[var(--md-outline-variant)]',
    bg: 'bg-[var(--md-surface-container-low)]',
    dot: 'bg-violet-400',
  },
  {
    role: '👑 CEO',
    cmd: '$ mekong founder:raise "Series A for AI platform"',
    out: 'Spawning 3 parallel agents...',
    color: 'text-[var(--md-tertiary)]',
    border: 'border-[var(--md-outline-variant)]',
    bg: 'bg-[var(--md-surface-container-low)]',
    dot: 'bg-[var(--md-tertiary)]',
  },
  {
    role: '💼 COO',
    cmd: '$ mekong business:revenue-engine "Hit $250K ARR"',
    out: '7 commands in DAG pipeline...',
    color: 'text-blue-400',
    border: 'border-[var(--md-outline-variant)]',
    bg: 'bg-[var(--md-surface-container-low)]',
    dot: 'bg-blue-400',
  },
  {
    role: '📊 Sales',
    cmd: '$ mekong sales:pipeline-build "Enterprise segment"',
    out: 'Research || Build || Operationalize',
    color: 'text-[var(--md-secondary)]',
    border: 'border-[var(--md-outline-variant)]',
    bg: 'bg-[var(--md-surface-container-low)]',
    dot: 'bg-[var(--md-secondary)]',
  },
  {
    role: '⚙️ CTO',
    cmd: '$ mekong engineering:ship "Payment integration"',
    out: 'Code → Test → Review → Deploy ✓',
    color: 'text-[var(--md-primary)]',
    border: 'border-[var(--md-outline-variant)]',
    bg: 'bg-[var(--md-surface-container-low)]',
    dot: 'bg-[var(--md-primary)]',
  },
  {
    role: '🔧 Ops',
    cmd: '$ mekong ops:health-sweep',
    out: '4 parallel checks → All systems green ✓',
    color: 'text-emerald-400',
    border: 'border-[var(--md-outline-variant)]',
    bg: 'bg-[var(--md-surface-container-low)]',
    dot: 'bg-emerald-400',
  },
]

export default function CascadeDemo() {
  return (
    <section id="cascade" className="px-6 py-20">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Super command cascade
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            One command triggers{' '}
            <span className="gradient-text">parallel AI agents</span>
          </h2>
          <p className="text-[var(--md-on-surface-variant)]">
            Super commands orchestrate DAG recipe workflows — parallel groups execute simultaneously.
          </p>
        </div>

        {/* Cascade steps */}
        <div className="flex flex-col items-center">
          {STEPS.map((step, i) => (
            <div key={i} className="flex w-full flex-col items-center">
              {/* Card */}
              <div
                className={`w-full rounded-xl border p-5 ${step.border} ${step.bg} cascade-step`}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {/* Terminal header */}
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${step.dot}`} />
                    <span className={`text-xs font-semibold ${step.color}`}>
                      {step.role}
                    </span>
                  </div>
                </div>

                {/* Command */}
                <div className="mb-2 font-mono text-sm text-[var(--md-on-surface)]">
                  {step.cmd}
                </div>

                {/* Output */}
                <div className={`flex items-center gap-1.5 font-mono text-xs ${step.color}`}>
                  <span className="opacity-50">&rarr;</span>
                  {step.out}
                </div>
              </div>

              {/* Connector arrow */}
              {i < STEPS.length - 1 && (
                <div className="flex h-8 flex-col items-center justify-center gap-0.5">
                  <div className="h-4 w-px bg-gradient-to-b from-[var(--md-outline-variant)] to-[var(--md-surface-container)]" />
                  <svg className="h-3 w-3 text-[var(--md-on-surface-variant)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 16l-6-6h12z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes cascadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .cascade-step {
          opacity: 0;
          animation: cascadeIn 0.45s ease both;
        }
      `}</style>
    </section>
  )
}
