import Link from 'next/link'

interface LayerPageHeroProps {
  icon: string
  title: string
  subtitle: string
  commandCount: number
  color: string
}

export default function LayerPageHero({
  icon,
  title,
  subtitle,
  commandCount,
  color,
}: LayerPageHeroProps) {
  const colorMap: Record<string, string> = {
    'cyan-400': 'text-cyan-400 border-cyan-500/40',
    'blue-400': 'text-blue-400 border-blue-500/40',
    'purple-400': 'text-purple-400 border-purple-500/40',
    'green-400': 'text-green-400 border-green-500/40',
    'orange-400': 'text-orange-400 border-orange-500/40',
  }
  const colorClass = colorMap[color] ?? 'text-cyan-400 border-cyan-500/40'
  const [textColor, borderColor] = colorClass.split(' ')

  return (
    <section className="relative overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          ← Back to home
        </Link>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-slate-400">
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${textColor}`} />
          Mekong CLI — 5-Layer Pyramid
        </div>

        <div className="mb-4 text-6xl">{icon}</div>

        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          <span className="gradient-text">{title}</span>
        </h1>

        <p className="mx-auto mb-6 max-w-xl text-base text-slate-400 sm:text-lg">{subtitle}</p>

        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${borderColor} ${textColor}`}>
          <span className="font-mono font-bold">{commandCount}</span> commands
        </div>
      </div>
    </section>
  )
}
