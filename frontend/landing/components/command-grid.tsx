interface CommandItem {
  id: string
  displayName: string
  description: string
  creditCost: number
}

interface CommandGridProps {
  commands: CommandItem[]
  columns?: number
}

function CreditBadge({ cost }: { cost: number }) {
  if (cost === 0) {
    return (
      <span className="rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-2 py-0.5 text-xs text-[var(--md-on-surface-variant)]">
        free
      </span>
    )
  }
  const dots = Math.min(cost, 5)
  return (
    <span className="rounded-full border border-[var(--md-primary-container)] bg-[var(--md-primary-container)] px-2 py-0.5 font-mono text-xs text-[var(--md-primary)]">
      {'●'.repeat(dots)}
    </span>
  )
}

export default function CommandGrid({ commands, columns = 3 }: CommandGridProps) {
  const gridClass =
    columns === 2
      ? 'grid gap-3 sm:grid-cols-2'
      : columns === 4
        ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={gridClass}>
      {commands.map((cmd) => (
        <div
          key={cmd.id}
          className="glass-card flex flex-col gap-1.5 rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <code className="font-mono text-sm font-semibold text-[var(--md-primary)]">
              /{cmd.id}
            </code>
            <CreditBadge cost={cmd.creditCost} />
          </div>
          <p className="text-xs leading-relaxed text-[var(--md-on-surface-variant)] line-clamp-2">
            {cmd.description}
          </p>
        </div>
      ))}
    </div>
  )
}
