/**
 * DaoGovernanceEngine — coordinates token deployment, treasury management,
 * proposal execution, and voting power tracking.
 */

import { EventEmitter } from 'events';
import { TokenDeployer } from './token-deployer';
import { TreasuryManager } from './treasury-manager';
import { ProposalExecutor } from './proposal-executor';
import { VotingPowerTracker } from './voting-power-tracker';
import type { DaoGovernanceConfig } from '../expansion-config-types';

export { TokenDeployer } from './token-deployer';
export { TreasuryManager } from './treasury-manager';
export { ProposalExecutor } from './proposal-executor';
export { VotingPowerTracker } from './voting-power-tracker';

export interface DaoMetrics {
  tokenDeployed: boolean;
  contractAddress: string | null;
  treasuryBalanceUsd: number;
  totalVotingPower: number;
  proposalCount: number;
}

export class DaoGovernanceEngine extends EventEmitter {
  private readonly deployer: TokenDeployer;
  private readonly treasury: TreasuryManager;
  private readonly executor: ProposalExecutor;
  private readonly tracker: VotingPowerTracker;
  private readonly config: DaoGovernanceConfig;

  constructor(config: DaoGovernanceConfig) {
    super();
    this.config = config;
    this.deployer = new TokenDeployer({ symbol: config.tokenSymbol });
    this.treasury = new TreasuryManager(0);
    this.tracker = new VotingPowerTracker();
    this.executor = new ProposalExecutor({
      quorumPercent: config.quorumPercent,
      totalVotingPower: 0, // updated after token deployment
    });
  }

  /** Bootstrap DAO: deploy token, seed treasury. */
  async start(): Promise<void> {
    const deployment = await this.deployer.deploy();
    this.emit('token-deployed', deployment);

    // Seed treasury with a mock initial grant
    this.treasury.recordInflow(100_000, 'Initial DAO treasury funding');
    this.emit('started', this.getMetrics());
  }

  getMetrics(): DaoMetrics {
    const deployment = this.deployer.getDeployment();
    return {
      tokenDeployed: this.deployer.isDeployed(),
      contractAddress: deployment?.contractAddress ?? null,
      treasuryBalanceUsd: this.treasury.getBalance(),
      totalVotingPower: this.tracker.getTotalVotingPower(),
      proposalCount: this.executor.listProposals().length,
    };
  }

  getDeployer(): TokenDeployer { return this.deployer; }
  getTreasury(): TreasuryManager { return this.treasury; }
  getExecutor(): ProposalExecutor { return this.executor; }
  getTracker(): VotingPowerTracker { return this.tracker; }
}
