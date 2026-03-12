import type { Id, Timestamp } from '../types/common.js';

/** Execution record — input for learning */
export interface ExecutionRecord {
  id: Id;
  taskType: string;
  agentName: string;
  input: string;
  toolsCalled: Array<{
    tool: string;
    params: Record<string, unknown>;
    success: boolean;
    duration: number;
    retries: number;
  }>;
  llmCalls: Array<{
    model: string;
    provider: string;
    promptHash: string;
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    duration: number;
  }>;
  result: 'success' | 'partial' | 'failure';
  errorType?: string;
  totalDuration: number;
  totalCost: number;
  totalTokens: number;
  timestamp: Timestamp;
}

/** Learned pattern — discovered from execution history */
export interface LearnedPattern {
  id: Id;
  type: 'success_pattern' | 'failure_pattern' | 'optimization' | 'new_skill';
  description: string;
  frequency: number;
  confidence: number;
  source: string;
  actionable: boolean;
  action?: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
}

/** Prompt variant for A/B testing */
export interface PromptVariant {
  id: Id;
  name: string;
  targetContext: string;
  promptText: string;
  metrics: {
    uses: number;
    successRate: number;
    avgTokens: number;
    avgDuration: number;
    avgCost: number;
  };
  isActive: boolean;
  createdAt: Timestamp;
}

/** Learned skill — auto-generated from patterns */
export interface LearnedSkill {
  id: Id;
  name: string;
  description: string;
  trigger: string;
  implementation: {
    type: 'sop' | 'tool' | 'prompt';
    definition: string;
  };
  source: string;
  usageCount: number;
  successRate: number;
  status: 'proposed' | 'approved' | 'active' | 'retired';
  createdAt: Timestamp;
}
