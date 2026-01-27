'use client'

import { useState, useCallback } from 'react'
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom Node Types
interface NodeData {
  label: string
  type?: string
  details?: string
  [key: string]: unknown
}

const TriggerNode = ({ data }: { data: NodeData }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500">
    <div className="font-bold text-sm text-blue-600 mb-1">TRIGGER</div>
    <div className="font-bold">{data.label}</div>
    <div className="text-xs text-gray-500">{data.type}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
  </div>
)

const ActionNode = ({ data }: { data: NodeData }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500 min-w-[150px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
    <div className="font-bold text-sm text-green-600 mb-1">ACTION</div>
    <div className="font-bold">{data.label}</div>
    <div className="text-xs text-gray-500">{data.details}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
  </div>
)

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

interface WorkflowEditorProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSave?: (nodes: Node[], edges: Edge[]) => void
}

export default function WorkflowEditor({ initialNodes = [], initialEdges = [], onSave: _onSave }: WorkflowEditorProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [],
  )

  return (
    <div className="h-[600px] w-full border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
