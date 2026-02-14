
/**
 * Workflow & Execution Type Definitions
 */

import { AgentTask, AgentOutput } from './agent.types';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: AgentTask[];
  estimatedDuration: number;
  createdAt: string;
}

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
  useCases: string[];
}

export interface ExecutionState {
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  currentTask?: string;
  completedTasks: Set<string>;
  results: Map<string, AgentOutput>;
  errors: ExecutionError[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface ExecutionError {
  taskId: string;
  skillId: string;
  message: string;
  timestamp: string;
  recoverable: boolean;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  skillId: string;
  name: string;
  level: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  required: boolean;
}

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'full_plan',
    name: 'Complete Business Plan 2026',
    description: 'Execute all 24 skills for comprehensive plan',
    skillIds: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'],
    useCases: ['New business', 'IPO prep', 'Comprehensive planning']
  },
  {
    id: 'fundraising',
    name: 'Fundraising Package',
    description: 'Focus on investor materials',
    skillIds: ['01', '05', '06', '07', '16', '20'],
    useCases: ['Seed round', 'Series A/B', 'Pitch deck']
  },
  {
    id: 'gtm',
    name: 'Go-To-Market Launch',
    description: 'Marketing and sales readiness',
    skillIds: ['05', '06', '07', '08', '09', '10', '13', '14'],
    useCases: ['Product launch', 'Market expansion']
  },
  {
    id: 'ipo',
    name: 'IPO Readiness',
    description: 'Governance, compliance, and IPO prep',
    skillIds: ['03', '17', '18', '20', '22', '23'],
    useCases: ['Pre-IPO', 'Governance upgrade']
  }
];
