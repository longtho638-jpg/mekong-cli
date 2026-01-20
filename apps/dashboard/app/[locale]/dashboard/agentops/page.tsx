'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { HealthBar } from '@/components/ui/health-bar'

// Types
interface Agent {
  id: string
  name: string
  status: 'active' | 'idle' | 'offline'
  tasksCompleted: number
  xp: number
}

interface SystemHealth {
  cpu: number
  memory: number
  latency: number
}

// Mock data
const mockAgents: Agent[] = [
  { id: '1', name: 'Scout Agent', status: 'active', tasksCompleted: 450, xp: 15420 },
  { id: '2', name: 'Guardian Agent', status: 'active', tasksCompleted: 380, xp: 12850 },
  { id: '3', name: 'Portfolio Agent', status: 'idle', tasksCompleted: 320, xp: 11200 },
  { id: '4', name: 'Revenue Agent', status: 'active', tasksCompleted: 280, xp: 9800 },
  { id: '5', name: 'Content Agent', status: 'offline', tasksCompleted: 150, xp: 5500 },
]

export default function AgentOpsPage() {
  const [winScore, setWinScore] = useState(75.1)
  const [agents] = useState<Agent[]>(mockAgents)
  const [health] = useState<SystemHealth>({ cpu: 45, memory: 62, latency: 101 })
  const [totalTasks, setTotalTasks] = useState(1256)

  useEffect(() => {
    const interval = setInterval(() => {
      setWinScore(prev => Math.min(100, prev + (Math.random() - 0.3) * 0.5))
      setTotalTasks(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const activeAgents = agents.filter(a => a.status === 'active').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">🏯 AgentOps Command Center</h1>
        <p className="text-slate-400">Real-time AI Agent Monitoring & Control</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="WIN³ Score" value={`${winScore.toFixed(1)}%`} color="emerald" />
        <StatCard title="Active Agents" value={`${activeAgents}/${agents.length}`} color="blue" />
        <StatCard
          title="Tasks Done"
          value={new Intl.NumberFormat('en-US').format(totalTasks)}
          color="purple"
        />
        <StatCard title="Response" value={`${health.latency}ms`} color="teal" />
      </div>

      {/* Agent Leaderboard */}
      <section className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">🏆 Agent Leaderboard</h2>
        <div className="space-y-3">
          {agents
            .sort((a, b) => b.xp - a.xp)
            .map((agent, i) => (
              <div
                key={agent.id}
                className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-slate-400">#{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-slate-400">{agent.tasksCompleted} tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={agent.status} />
                  <span className="text-emerald-400 font-semibold">
                    {new Intl.NumberFormat('en-US').format(agent.xp)} XP
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* System Health */}
      <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">💚 System Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <HealthBar label="CPU" value={health.cpu} />
          <HealthBar label="Memory" value={health.memory} />
          <HealthBar label="Network" value={100 - health.latency / 2} />
        </div>
      </section>
    </div>
  )
}
