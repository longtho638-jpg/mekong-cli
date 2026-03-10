/**
 * DAOBrain Orchestrator — runs the 4-hour consensus loop, applies allocation
 * changes, and logs decisions. SIMULATION MODE ONLY.
 */

import { EventEmitter } from 'events';
import { RiskManagerAgent } from './agents/risk-manager';
import { AlphaSeekerAgent } from './agents/alpha-seeker';
import { ExecutionerAgent } from './agents/executioner';
import { MacroEconomistAgent } from './agents/macro-economist';
import { ConsensusEngine } from './consensus-engine';
import { StakeManager } from './stake-manager';
import type { AgentProposal, ConsensusResult } from './consensus-engine';
import type { ExchangeHealth } from './agents/executioner';
import { logger } from '../../../utils/logger';

export interface DAOBrainConfig {
  votingIntervalHours: number;
  maxAgentInfluence: number;
  strategyIds: string[];
}

export interface DAOBrainStatus {
  running: boolean;
  lastVoteAt: string | null;
  cycleCount: number;
  lastResults: ConsensusResult[];
}

const DEFAULT_CONFIG: DAOBrainConfig = {
  votingIntervalHours: 4,
  maxAgentInfluence: 0.05,
  strategyIds: ['strategy-1', 'strategy-2'],
};

/**
 * Runs the DAO consensus loop and emits 'allocation:update' events.
 */
export class DAOBrainOrchestrator extends EventEmitter {
  private readonly riskManager = new RiskManagerAgent();
  private readonly alphaSeeker = new AlphaSeekerAgent();
  private readonly executioner = new ExecutionerAgent();
  private readonly macroEconomist = new MacroEconomistAgent();
  private readonly consensus = new ConsensusEngine();
  private readonly stakeManager: StakeManager;
  private config: DAOBrainConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private status: DAOBrainStatus = {
    running: false,
    lastVoteAt: null,
    cycleCount: 0,
    lastResults: [],
  };

  constructor(config: Partial<DAOBrainConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stakeManager = new StakeManager([
      this.riskManager.getId(),
      this.alphaSeeker.getId(),
      this.executioner.getId(),
      this.macroEconomist.getId(),
    ]);
  }

  /** Start the consensus loop. */
  start(): void {
    if (this.status.running) return;
    this.status.running = true;
    logger.info('[DAOBrain] Starting orchestrator (SIMULATION MODE)');
    const intervalMs = this.config.votingIntervalHours * 60 * 60 * 1000;
    this.timer = setInterval(() => this.runCycle(), intervalMs);
    // Run immediately on start
    void this.runCycle();
  }

  /** Stop the consensus loop. */
  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.status.running = false;
    logger.info('[DAOBrain] Orchestrator stopped');
  }

  /** Run one full voting cycle (exposed for testing). */
  async runCycle(): Promise<ConsensusResult[]> {
    const { strategyIds } = this.config;

    // Gather proposals from all agents (using mock/simulated data in sim mode)
    const riskProposals = this.riskManager.propose(
      { varPercent: 3.0, maxDrawdown: 0.12, concentrationHHI: 0.3 },
      strategyIds,
    );
    const alphaProposals = this.alphaSeeker.propose(
      strategyIds.map((id) => ({ strategyId: id, sharpeRatio: 1.4, winRate: 0.55, profitFactor: 1.3 })),
    );
    const healthMap = new Map<string, ExchangeHealth>(
      strategyIds.map((id) => [id, { exchangeId: 'binance', avgSlippageBps: 3, fillRate: 0.97, avgLatencyMs: 50 }]),
    );
    const execProposals = this.executioner.propose(healthMap);
    const macroProposals = this.macroEconomist.propose(
      { interestRatePct: 5.25, inflationPct: 3.1, vix: 18 },
      strategyIds,
    );

    const allProposals: AgentProposal[] = [
      ...riskProposals,
      ...alphaProposals,
      ...execProposals,
      ...macroProposals,
    ];

    const weights = this.stakeManager.getWeights();
    const results = this.consensus.resolve(allProposals, weights);

    this.status.lastVoteAt = new Date().toISOString();
    this.status.cycleCount += 1;
    this.status.lastResults = results;

    this.emit('allocation:update', results);
    logger.info(`[DAOBrain] Cycle ${this.status.cycleCount} complete — ${results.length} strategies updated`);

    return results;
  }

  getStatus(): DAOBrainStatus {
    return { ...this.status };
  }

  isRunning(): boolean {
    return this.status.running;
  }
}
