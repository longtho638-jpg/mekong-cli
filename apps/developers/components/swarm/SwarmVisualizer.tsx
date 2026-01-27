'use client'

import React, { useEffect, useCallback } from 'react'
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import useSWR from 'swr'
import { MD3Card } from '@/components/ui/MD3Card'
import { RefreshCw, Zap, ZapOff } from 'lucide-react'
import { useAntigravityRealtime } from '@/hooks/useWebSocket'

// API Types
interface SwarmAgent {
  id: string
  name: string
  role: string
  is_busy: boolean
  tasks_completed: number
  tasks_failed: number
  specialties: string[]
}

interface SwarmMetrics {
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
  busy_agents: number
  idle_agents: number
  pending_tasks: number
}

interface SwarmStatus {
  running: boolean
  agents: SwarmAgent[]
  metrics: SwarmMetrics
}

interface SwarmTask {
  id: string
  name: string
  status: string
  priority: number
  assigned_agent: string | null
  created_at: number
  completed_at: number | null
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export const SwarmVisualizer: React.FC = () => {
  const {
    data: status,
    error: statusError,
    mutate: mutateStatus,
  } = useSWR<SwarmStatus>('/api/swarm/v2/status', fetcher, { refreshInterval: 5000 })
  const {
    data: tasks,
    error: tasksError,
    mutate: mutateTasks,
  } = useSWR<SwarmTask[]>('/api/swarm/v2/tasks', fetcher, { refreshInterval: 5000 })

  const { isConnected } = useAntigravityRealtime({
    onSwarmUpdate: () => {
      mutateStatus()
      mutateTasks()
    },
    onDataRefresh: () => {
      mutateStatus()
      mutateTasks()
    },
  })

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const updateGraph = useCallback(() => {
    if (!status || !tasks) return

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    // Central Hub Node
    newNodes.push({
      id: 'swarm-hub',
      type: 'default',
      data: { label: `Swarm Orchestrator (${status.running ? 'Running' : 'Stopped'})` },
      position: { x: 400, y: 50 },
      className: `border border-outline rounded-lg p-2.5 font-bold text-on-surface ${
        status.running ? 'bg-primary-container' : 'bg-error-container'
      }`,
    })

    // Agent Nodes
    status.agents.forEach((agent, index) => {
      const x = 100 + index * 250
      const y = 200

      newNodes.push({
        id: agent.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold">{agent.name}</div>
              <div className="text-xs opacity-70">{agent.role}</div>
              <div
                className={`text-xs mt-1 ${agent.is_busy ? 'text-yellow-600' : 'text-green-600'}`}
              >
                {agent.is_busy ? 'BUSY' : 'IDLE'}
              </div>
              <div className="text-xs mt-1">
                ✓ {agent.tasks_completed} | ✗ {agent.tasks_failed}
              </div>
            </div>
          ),
        },
        position: { x, y },
        className: `border border-outline text-on-surface w-[180px] ${
          agent.is_busy ? 'bg-secondary-container' : 'bg-surface-container'
        }`,
      })

      // Edge from Hub to Agent
      newEdges.push({
        id: `edge-hub-${agent.id}`,
        source: 'swarm-hub',
        target: agent.id,
        animated: agent.is_busy,
        style: { stroke: 'var(--md-sys-color-outline)' },
      })
    })

    // Active Task Nodes (attached to agents)
    tasks
      .filter(t => t.status === 'running' && t.assigned_agent)
      .forEach(task => {
        const agentIndex = status.agents.findIndex(a => a.id === task.assigned_agent)
        if (agentIndex === -1) return

        const agentX = 100 + agentIndex * 250
        const agentY = 200

        const taskNodeId = `task-${task.id}`

        newNodes.push({
          id: taskNodeId,
          type: 'default',
          data: { label: `Task: ${task.name}` },
          position: { x: agentX, y: agentY + 150 },
          className:
            'bg-tertiary-container text-on-tertiary-container border border-outline text-xs w-[150px]',
        })

        newEdges.push({
          id: `edge-${task.assigned_agent}-${taskNodeId}`,
          source: task.assigned_agent || '',
          target: taskNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'var(--md-sys-color-tertiary)', strokeDasharray: '5,5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--md-sys-color-tertiary)' },
        })
      })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [status, tasks, setNodes, setEdges])

  useEffect(() => {
    updateGraph()
  }, [status, tasks, updateGraph])

  const handleRefresh = () => {
    mutateStatus()
    mutateTasks()
  }

  if (statusError || tasksError) {
    return (
      <div className="p-4 text-error">
        Error loading swarm data. Is the backend running?
      </div>
    )
  }

  return (
    <MD3Card className="h-[600px] w-full flex flex-col relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${
            isConnected
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          {isConnected ? <Zap size={10} /> : <ZapOff size={10} />}
          {isConnected ? 'LIVE' : 'POLLING'}
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 bg-surface-container-high rounded-full hover:bg-surface-container-highest text-on-surface shadow-sm"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {status && (
        <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-mono bg-surface/80 p-2 rounded backdrop-blur-sm border border-outline-variant">
          <div className="text-on-surface">
            <span className="font-bold text-primary">Tasks:</span>{' '}
            {status.metrics.total_tasks}
          </div>
          <div className="text-on-surface">
            <span className="font-bold text-green-600">Done:</span> {status.metrics.completed_tasks}
          </div>
          <div className="text-on-surface">
            <span className="font-bold text-red-600">Failed:</span> {status.metrics.failed_tasks}
          </div>
          <div className="text-on-surface">
            <span className="font-bold text-yellow-600">Busy:</span> {status.metrics.busy_agents}
          </div>
          <div className="text-on-surface">
            <span className="font-bold text-blue-600">Pending:</span> {status.metrics.pending_tasks}
          </div>
        </div>
      )}

      <div className="w-full bg-surface" style={{ height: '550px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="var(--md-sys-color-outline-variant)" gap={16} />
          <Controls className="bg-surface-container-high text-on-surface border-outline" />
        </ReactFlow>
      </div>
    </MD3Card>
  )
}
