import { MissionList } from './mission-list';
import { CreateMissionButton } from './create-mission-button';
import { AgentSwarm } from './agent-swarm';

export const dynamic = 'force-dynamic';

type Mission = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
};

async function getMissions(): Promise<Mission[]> {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/api/missions`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (e) {
    console.error('Failed to fetch missions:', e);
    return [];
  }
}

export default async function DashboardPage() {
  const missions = await getMissions();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              🦞 Mission Control
            </h1>
            <p className="text-gray-600 mt-2">
              Lobster Empire — Command Dashboard
            </p>
          </div>
          <CreateMissionButton />
        </div>

        {/* AI Agent Swarm Dashboard */}
        <AgentSwarm />

        {/* Mission List */}
        <MissionList initialMissions={missions} />
      </div>
    </div>
  );
}
