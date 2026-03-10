/**
 * Phase 10 Module 2: Decentralized Auto-DAO Governance — barrel exports.
 *
 * Components:
 * 1. TokenIssuer        — Mock ERC20 governance token deployment
 * 2. DarkPoolCreator    — Mock dark pool contract + order matching
 * 3. LiquidityManager  — Treasury management (stablecoins, LP tokens)
 * 4. GovernanceProposer — On-chain proposal submission and voting
 * 5. AutoExecutor       — Monitors passed proposals, dispatches execution
 *
 * All modules default to disabled / dry-run mode.
 */

export { TokenIssuer } from './token-issuer';
export type { TokenIssuerConfig, TokenInfo } from './token-issuer';

export { DarkPoolCreator } from './dark-pool-creator';
export type { DarkPoolConfig, DarkPoolOrder, MatchedTrade } from './dark-pool-creator';

export { LiquidityManager } from './liquidity-manager';
export type { LiquidityManagerConfig, TreasuryBalance } from './liquidity-manager';

export { GovernanceProposer } from './governance-proposer';
export type {
  GovernanceProposerConfig,
  Proposal,
  ProposalStatus,
  Vote,
} from './governance-proposer';

export { AutoExecutor } from './auto-executor';
export type { AutoExecutorConfig, ExecutionRecord } from './auto-executor';

// ── DAO Governance unified config ────────────────────────────────────────────

export interface DaoGovernanceConfig {
  /** Master switch — all components disabled when false. Default: false. */
  enabled: boolean;
  /** ERC20 token name. Default: 'GovToken'. */
  tokenName: string;
  /** ERC20 token symbol. Default: 'GOV'. */
  tokenSymbol: string;
  /** Enable dark pool order matching. Default: false. */
  darkPoolEnabled: boolean;
  /** Voting period in seconds. Default: 86400. */
  votingPeriodSec: number;
}

export interface DaoGovernanceInstances {
  tokenIssuer: TokenIssuer;
  darkPool: DarkPoolCreator;
  liquidityManager: LiquidityManager;
  proposer: GovernanceProposer;
  executor: AutoExecutor;
  config: DaoGovernanceConfig;
}

// Need concrete imports for factory function
import { TokenIssuer } from './token-issuer';
import { DarkPoolCreator } from './dark-pool-creator';
import { LiquidityManager } from './liquidity-manager';
import { GovernanceProposer } from './governance-proposer';
import { AutoExecutor } from './auto-executor';

const DEFAULT_DAO_CONFIG: DaoGovernanceConfig = {
  enabled: false,
  tokenName: 'GovToken',
  tokenSymbol: 'GOV',
  darkPoolEnabled: false,
  votingPeriodSec: 86_400,
};

/**
 * Factory: initialise all DAO Governance components from a single config.
 * Returns typed instances ready for use or dependency injection.
 */
export function initDaoGovernance(
  config: Partial<DaoGovernanceConfig> = {},
): DaoGovernanceInstances {
  const cfg: DaoGovernanceConfig = { ...DEFAULT_DAO_CONFIG, ...config };
  const dryRun = !cfg.enabled;

  const tokenIssuer = new TokenIssuer({
    name: cfg.tokenName,
    symbol: cfg.tokenSymbol,
    dryRun,
  });

  const darkPool = new DarkPoolCreator({
    dryRun: dryRun || !cfg.darkPoolEnabled,
  });

  const liquidityManager = new LiquidityManager({ dryRun });

  const proposer = new GovernanceProposer({
    votingPeriodSec: cfg.votingPeriodSec,
    dryRun,
  });

  const executor = new AutoExecutor({ dryRun });
  executor.attachProposer(proposer);

  return { tokenIssuer, darkPool, liquidityManager, proposer, executor, config: cfg };
}
