const ROWS = [
  {
    role: 'Founder',
    roleIcon: '👑',
    single: 'Spreadsheet + Notion',
    mekong: '/founder:raise → 8 agents parallel, investor kit in 45 min',
  },
  {
    role: 'Sales',
    roleIcon: '🏢',
    single: 'CRM + email tool',
    mekong: '/sales:pipeline-build → ICP + leads + CRM in one command',
  },
  {
    role: 'Product',
    roleIcon: '📦',
    single: 'Jira + Figma',
    mekong: '/product:discovery → persona + competitor + scope in 30 min',
  },
  {
    role: 'Engineering',
    roleIcon: '⚙️',
    single: 'IDE + CI/CD',
    mekong: '/engineering:ship → code + test + review + deploy in 35 min',
  },
  {
    role: 'Ops',
    roleIcon: '🔧',
    single: 'Datadog + PagerDuty',
    mekong: '/ops:health-sweep → 4 parallel health checks in 15 min',
  },
]

export default function ComparisonSection() {
  return (
    <section id="comparison" className="px-6 py-20">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)]">
            Why not separate tools?
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--md-on-surface)] sm:text-4xl">
            Every layer{' '}
            <span className="text-[var(--md-on-surface-variant)] line-through decoration-red-500/60">siloed</span>
            {' '}vs{' '}
            <span className="gradient-text">connected</span>
          </h2>
          <p className="text-[var(--md-on-surface-variant)]">
            Separate tools mean no shared context. Mekong CLI runs DAG workflows with parallel AI agents.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[var(--md-outline-variant)]">
          {/* Header row */}
          <div className="grid grid-cols-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-6 py-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">Role</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">Separate tools</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-primary)]">Mekong CLI</span>
          </div>

          {/* Data rows */}
          {ROWS.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 items-center px-6 py-4 text-sm transition-colors hover:bg-[var(--md-surface-container-low)] ${
                i < ROWS.length - 1 ? 'border-b border-[var(--md-outline-variant)]' : ''
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-[var(--md-on-surface)]">
                <span>{row.roleIcon}</span>
                {row.role}
              </span>
              <span className="flex items-center gap-1.5 text-[var(--md-on-surface-variant)]">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {row.single}
              </span>
              <span className="font-mono text-xs text-[var(--md-primary)]">{row.mekong}</span>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-[var(--md-on-surface-variant)]">
          Super commands orchestrate DAG workflows — parallel agents, shared context, verified output.
        </p>

      </div>
    </section>
  )
}
