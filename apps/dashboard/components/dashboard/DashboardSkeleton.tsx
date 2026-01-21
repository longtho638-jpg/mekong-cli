import { Skeleton } from "@/components/ui/skeleton"
import { AgencyCard } from "@/components/ui/agency-card"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-neutral-800/50" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-xl bg-neutral-800/50" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-96 rounded-xl bg-neutral-800/50" />
        <Skeleton className="h-96 rounded-xl bg-neutral-800/50" />
      </div>
    </div>
  )
}
