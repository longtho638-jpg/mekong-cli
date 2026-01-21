'use client'

import { useState, useEffect } from 'react'
import { dispatchSwarmTask, getSwarmHistory, AgentMessage } from '@/lib/swarm-api'
import { useSwarmSocket } from '@/lib/hooks/useSwarmSocket'
import SwarmVisualizer from '@/components/swarm/SwarmVisualizer'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select } from '@agencyos/ui'
import { Play, RefreshCw, Zap } from 'lucide-react'

export default function SwarmPage() {
  const [historyMessages, setHistoryMessages] = useState<AgentMessage[]>([])
  const [task, setTask] = useState('')
  const [swarmType, setSwarmType] = useState<'dev' | 'growth'>('dev')
  const [loading, setLoading] = useState(false)

  // Real-time updates
  const { messages: liveMessages, status: wsStatus } = useSwarmSocket()

  // Combine history and live messages, deduplicating by ID
  const allMessages = [...historyMessages, ...liveMessages].reduce((acc, current) => {
    const x = acc.find(item => item.id === current.id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, [] as AgentMessage[]);

  useEffect(() => {
    // Initial fetch only
    getSwarmHistory().then(setHistoryMessages)
  }, [])

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.trim()) return

    setLoading(true)
    await dispatchSwarmTask(task, swarmType)
    setTask('')
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          Swarm Intelligence
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
          {wsStatus === 'connected' ? 'Live Connected' : 'Connecting...'}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Control Panel */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDispatch} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Swarm Type</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={swarmType}
                    onChange={(e) => setSwarmType(e.target.value as 'dev' | 'growth')}
                  >
                    <option value="dev">🏗️ Dev Swarm (Architect → Coder)</option>
                    <option value="growth">🚀 Growth Swarm (Strategist → Creator)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Mission Objective</label>
                  <Input
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="e.g. Build a login page..."
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || !task.trim()}>
                  {loading ? 'Dispatching...' : 'Dispatch Agents'}
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {swarmType === 'dev' ? (
                  <>
                    <AgentStatus name="Architect" status="active" />
                    <AgentStatus name="Coder" status="idle" />
                    <AgentStatus name="Reviewer" status="idle" />
                  </>
                ) : (
                  <>
                    <AgentStatus name="Strategist" status="active" />
                    <AgentStatus name="Creator" status="idle" />
                    <AgentStatus name="Social" status="idle" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualizer */}
        <div className="col-span-8">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Hive Mind Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[500px]">
              <SwarmVisualizer messages={allMessages} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AgentStatus({ name, status }: { name: string, status: 'active' | 'idle' | 'offline' }) {
  const colors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    offline: 'bg-gray-500'
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 uppercase">{status}</span>
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      </div>
    </div>
  )
}
