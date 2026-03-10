/**
 * DAOBrain module barrel — Decentralized Multi-Agent Fund Manager.
 * SIMULATION MODE ONLY.
 */

export { DAOBrainOrchestrator } from './orchestrator';
export type { DAOBrainConfig, DAOBrainStatus } from './orchestrator';
export { ConsensusEngine, MAX_AGENT_INFLUENCE } from './consensus-engine';
export type { AgentProposal, AgentWeight, ConsensusResult } from './consensus-engine';
export { StakeManager } from './stake-manager';
export type { AgentStake, ProposalOutcome } from './stake-manager';
export { RiskManagerAgent } from './agents/risk-manager';
export { AlphaSeekerAgent } from './agents/alpha-seeker';
export { ExecutionerAgent } from './agents/executioner';
export { MacroEconomistAgent } from './agents/macro-economist';

/** Convenience: create and start a DAOBrain orchestrator. */
export function start(config?: Partial<import('./orchestrator').DAOBrainConfig>): import('./orchestrator').DAOBrainOrchestrator {
  const { DAOBrainOrchestrator } = require('./orchestrator') as typeof import('./orchestrator');
  const orch = new DAOBrainOrchestrator(config);
  orch.start();
  return orch;
}
