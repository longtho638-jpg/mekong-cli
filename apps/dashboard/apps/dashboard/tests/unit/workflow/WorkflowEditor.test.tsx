import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import WorkflowEditor from '@/components/workflow/WorkflowEditor'
import React from 'react'

// Mock React Flow since it uses ResizeObserver which might not be available in JSDOM
jest.mock('reactflow', () => ({
  __esModule: true,
  default: ({ nodes, edges, children }: { nodes: unknown[]; edges: unknown[]; children: React.ReactNode }) => (
    <div data-testid="react-flow">
      {nodes?.length} nodes
      {children}
    </div>
  ),
  Background: () => <div>Background</div>,
  Controls: () => <div>Controls</div>,
  Handle: () => <div>Handle</div>,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

describe('WorkflowEditor', () => {
  const initialNodes = [
    { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    { id: '2', type: 'action', position: { x: 0, y: 100 }, data: { label: 'Action' } }
  ]

  it('renders without crashing', () => {
    render(<WorkflowEditor initialNodes={initialNodes} />)
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('renders correct number of nodes', () => {
    render(<WorkflowEditor initialNodes={initialNodes} />)
    expect(screen.getByText('2 nodes')).toBeInTheDocument()
  })
})
