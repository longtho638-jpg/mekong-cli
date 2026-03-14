'use client'

interface AlertBadgeProps {
  count: number
  className?: string
}

export default function AlertBadge({ count, className = '' }: AlertBadgeProps) {
  if (count === 0) {
    return null
  }

  return (
    <span
      className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--md-error)] px-1.5 py-0.5 text-xs font-bold text-[var(--md-on-error)] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
