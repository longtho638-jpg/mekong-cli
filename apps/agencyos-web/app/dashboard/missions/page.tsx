import { MissionFeedTable } from '@/components/mission-feed-table'
import { getMissions } from '@/lib/fetch-dashboard-data'

export default async function MissionsPage() {
  const missions = await getMissions()

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Missions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          All agent missions across your projects.{' '}
          <span className="text-zinc-600">({missions.length} total)</span>
        </p>
      </div>
      <MissionFeedTable title="All Missions" missions={missions} />
    </div>
  )
}
