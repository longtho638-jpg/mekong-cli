'use client'

import { useState, useEffect } from 'react'
import WorkflowEditor from '@/components/workflow/WorkflowEditor'
import { listWorkflows, executeWorkflow, type WorkflowSummary } from '@/lib/workflow-api'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@agencyos/ui'
import { Play, Plus } from 'lucide-react'

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  // Mock initial data for editor until we implement full load logic
  const initialNodes = [
    { id: '1', type: 'trigger', position: { x: 250, y: 0 }, data: { label: 'New Lead', type: 'Webhook' } },
    { id: '2', type: 'action', position: { x: 250, y: 100 }, data: { label: 'Send Email', details: 'Welcome Template' } },
  ]
  const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }]

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    const list = await listWorkflows()
    setWorkflows(list)
  }

  const handleExecute = async () => {
    if (!selectedWorkflow) return
    await executeWorkflow(selectedWorkflow)
    alert('Workflow executed!')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workflow Automation</h1>
        <div className="space-x-2">
          <Button variant="outlined" onClick={handleExecute} disabled={!selectedWorkflow}>
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workflows.length === 0 && <p className="text-sm text-gray-500">No workflows found</p>}
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className={`p-3 rounded cursor-pointer border ${selectedWorkflow === wf.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedWorkflow(wf.id)}
                >
                  <div className="font-medium">{wf.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{wf.trigger}</span>
                    <span className={wf.active ? 'text-green-600' : 'text-gray-400'}>
                      {wf.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-9">
          <WorkflowEditor
            initialNodes={initialNodes}
            initialEdges={initialEdges}
          />
        </div>
      </div>
    </div>
  )
}
