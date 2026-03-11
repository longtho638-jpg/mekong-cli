import { STATS } from '@/data/stats'

const STAT_ITEMS = [
  { value: STATS.commands.toString(), label: 'Commands', suffix: '' },
  { value: STATS.superCommands.toString(), label: 'Super Workflows', suffix: '' },
  { value: STATS.skills.toString(), label: 'AI Skills', suffix: '' },
  { value: STATS.agents.toString(), label: 'Agents', suffix: '' },
  { value: STATS.recipes.toString(), label: 'DAG Recipes', suffix: '' },
]

export default function StatsBar() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-8 py-10">
          {/* Subtle top gradient line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--md-primary)]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--md-secondary)]/20 to-transparent" />

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
            {STAT_ITEMS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="stat-number text-4xl font-extrabold leading-none tracking-tight">
                  {stat.value}{stat.suffix}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-widest text-[var(--md-on-surface-variant)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
