export default function DashboardSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar Skeleton */}
      <aside className="hidden w-64 flex-col border-r border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4 md:flex">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex h-10 animate-pulse items-center gap-3 rounded-lg bg-[var(--md-surface-container-high)] px-3"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-5 w-5 rounded bg-[var(--md-outline)]" />
              <div className="h-4 w-24 rounded bg-[var(--md-outline)]" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--md-surface-container-high)]" />

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-2 h-4 w-20 rounded bg-[var(--md-outline)]" />
              <div className="h-8 w-32 rounded bg-[var(--md-outline)]" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="h-64 animate-pulse rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]" />

        {/* Recent Activity Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-[var(--md-surface-container-high)]" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex h-16 animate-pulse items-center gap-4 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4"
              style={{ animationDelay: `${(i + 4) * 100}ms` }}
            >
              <div className="h-10 w-10 rounded-full bg-[var(--md-outline)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-[var(--md-outline)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--md-outline)]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
