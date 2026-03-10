/** Phase 2 barrel exports */
export { ZeroShotSynthesizer } from './zero-shot-synthesizer/index';
export { MockLLMClient, HttpLLMClient } from './zero-shot-synthesizer/llm-client';
export type { SocialMessage, StrategyRule, LLMClient } from './zero-shot-synthesizer/llm-client';
export { RuleGenerator } from './zero-shot-synthesizer/rule-generator';
export { HotDeployer } from './zero-shot-synthesizer/hot-deployer';

export { CrossChainFlashLoanEngine } from './cross-chain-flash-loans/index';
export { DexRegistry } from './cross-chain-flash-loans/dex-node';
export type { DexNode, BridgeEdge } from './cross-chain-flash-loans/dex-node';
export { FlashLoanProvider } from './cross-chain-flash-loans/flash-loan-provider';
export { SmartOrderRouter } from './cross-chain-flash-loans/smart-order-router';

export { SpoofDetector } from './adversarial-mm/spoof-detector';
export { AdversarialStrategyHook } from './adversarial-mm/strategy-hook';
export { ModelLoader } from './adversarial-mm/model-loader';

export { Phase2Orchestrator } from './phase2-orchestrator';
export type { Phase2Config, Phase2Status, Phase2WsMessage } from './phase2-orchestrator';
