export type AgentPhase = 'ZERO_TO_SEED' | 'SEED_TO_SERIES_A' | 'SERIES_A_TO_IPO';

export interface AgentLifecycle {
  phase: AgentPhase;
  focus: string;
  description: string;
}

export const AGENT_LIFECYCLE_PHASES: Record<AgentPhase, AgentLifecycle> = {
  ZERO_TO_SEED: {
    phase: 'ZERO_TO_SEED',
    focus: 'Data Collection',
    description: 'Focus on gathering data and understanding user behavior. Low automation, high manual oversight.',
  },
  SEED_TO_SERIES_A: {
    phase: 'SEED_TO_SERIES_A',
    focus: 'Automation',
    description: 'Focus on automating repetitive tasks and establishing standard operating procedures.',
  },
  SERIES_A_TO_IPO: {
    phase: 'SERIES_A_TO_IPO',
    focus: 'Optimization',
    description: 'Focus on optimizing performance, scaling, and maximizing efficiency.',
  },
};

export function getCurrentPhase(metric: number): AgentPhase {
    // Example logic: Determine phase based on a metric (e.g., user count, revenue)
    if (metric < 1000) return 'ZERO_TO_SEED';
    if (metric < 10000) return 'SEED_TO_SERIES_A';
    return 'SERIES_A_TO_IPO';
}
