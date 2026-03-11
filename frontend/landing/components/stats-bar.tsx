import { STATS } from '@/data/stats'

const STAT_ITEMS = [
  { value: STATS.commands.toString(), label: 'Commands' },
  { value: STATS.skills.toString(), label: 'AI Skills' },
  { value: STATS.agents.toString(), label: 'Agents' },
  { value: STATS.layers.toString(), label: 'Tầng' },
  { value: STATS.commits.toLocaleString(), label: 'Commits' },
]

export default function StatsBar() {
  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="glass-card rounded-2xl px-6 py-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
            {STAT_ITEMS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="gradient-text text-4xl font-extrabold leading-none">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
