/**
 * Phase 6: The Ghost Protocol — barrel exports
 *
 * Three evasion modules for undetectable exchange interaction:
 * 1. Polymorphic API Obfuscation Matrix
 * 2. WebSocket Stealth Sharding
 * 3. Adversarial Flow Masking (Chameleon)
 *
 * DISCLAIMER: For research and educational purposes only.
 * Users must comply with exchange terms of service.
 */

// Orchestrator
export { Phase6Orchestrator } from './phase6-orchestrator';

// Types
export type {
  Phase6Config,
  Phase6Status,
  ProxyInfo,
  ProxyManagerConfig,
  BrowserFingerprint,
  JitterConfig,
  GhostRequestOptions,
  GhostResponse,
  ShardNode,
  ShardMessage,
  AggregatedFeed,
  NoiseAction,
  ChameleonState,
  ChameleonConfig,
} from './types';

// Module 1: Polymorphic Matrix
export { ProxyManager, FingerprintGenerator, JitterInjector, HttpClientWrapper } from './polymorphic-matrix';

// Module 2: WS Sharding
export { ShardAllocator, Aggregator, EdgeFunctionDeployer } from './ws-sharding';

// Module 3: Chameleon
export { Environment, QLearningAgent, RuleBasedAgent, NoiseExecutor, GuiEmulator } from './chameleon';
