/**
 * Phase 8: OmniNet Genesis — barrel exports.
 *
 * Three modules:
 * 1. ZK Execution Router (zkExecutionRouter)
 * 2. Swarm Intelligence Orchestrator (swarmOrchestrator)
 * 3. Yield & IL Arbitrage Engine (yieldOptimizer)
 *
 * All modules default to disabled + dry-run mode.
 */

// Module 1: ZK Execution Router
export { ProofGenerator, VerifierContract, OrderWrapper, KeyManager, initZkExecutionRouter } from './zkExecutionRouter/index';
export type { OrderWitness, ZkProof, ProofGeneratorConfig, VerificationResult, VerifierContractConfig, RawOrder, WrappedOrder, OrderWrapperConfig, KeySlot, KeyManagerConfig, ZkExecutionRouterConfig } from './zkExecutionRouter/index';

// Module 2: Swarm Orchestrator
export { SwarmOrchestrator, AgentNode, GossipProtocol, TaskDistributor, ChaosMonkey, ConsensusEngine } from './swarmOrchestrator/index';
export type { SwarmOrchestratorConfig, AgentState, AgentNodeConfig, GossipMessage, GossipProtocolConfig, ArbOpportunity, SubTask, TaskDistributorConfig, ChaosEvent, ChaosMonkeyConfig, ConsensusResult, ConsensusSignal, ConsensusEngineConfig } from './swarmOrchestrator/index';

// Module 3: Yield Optimizer
export { YieldOptimizer, AmmMonitor, ImpermanentLossCalculator, HedgeOptimizer, AllocationExecutor, ArbitrageDetector } from './yieldOptimizer/index';
export type { YieldOptimizerConfig, PoolState, AmmMonitorConfig, ILResult, V3TickParams, HedgeInstrument, HedgeOptimizationResult, HedgeOptimizerConfig, RebalanceAction, AllocationState, AllocationExecutorConfig, CexQuote, ArbOpportunityDetected, ArbitrageDetectorConfig } from './yieldOptimizer/index';
