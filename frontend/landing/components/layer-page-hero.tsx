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
    'cyan-400': 'text-[var(--md-primary)] border-[var(--md-primary-container)]',
    'blue-400': 'text-blue-400 border-blue-500/40',
    'purple-400': 'text-[var(--md-secondary)] border-[var(--md-secondary-container)]',
    'green-400': 'text-green-400 border-green-500/40',
    'orange-400': 'text-orange-400 border-orange-500/40',
  }
  const colorClass = colorMap[color] ?? 'text-[var(--md-primary)] border-[var(--md-primary-container)]'
  const [textColor, borderColor] = colorClass.split(' ')

  return (
    <section className="relative overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--md-on-surface-variant)] transition-colors hover:text-[var(--md-on-surface)]"
        >
          ← Back to home
        </Link>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-4 py-1.5 text-xs text-[var(--md-on-surface-variant)]">
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${textColor}`} />
          Mekong CLI — 5-Layer Pyramid
        </div>

        <div className="mb-4 text-6xl">{icon}</div>

        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-[var(--md-on-surface)] sm:text-5xl">
          <span className="gradient-text">{title}</span>
        </h1>

        <p className="mx-auto mb-6 max-w-xl text-base text-[var(--md-on-surface-variant)] sm:text-lg">{subtitle}</p>

        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${borderColor} ${textColor}`}>
          <span className="font-mono font-bold">{commandCount}</span> commands
        </div>
      </div>
    </section>
  )
}
