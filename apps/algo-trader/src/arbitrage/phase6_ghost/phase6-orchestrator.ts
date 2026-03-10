/**
 * Phase 6 Ghost Protocol Orchestrator — coordinates all three evasion modules.
 * Can be enabled/disabled per-module via config.phase6.json.
 */
import { Phase6Config, Phase6Status } from './types';
import { ProxyManager, FingerprintGenerator, JitterInjector, HttpClientWrapper } from './polymorphic-matrix';
import { ShardAllocator, Aggregator, EdgeFunctionDeployer } from './ws-sharding';
import { Environment, QLearningAgent, RuleBasedAgent, NoiseExecutor, GuiEmulator } from './chameleon';

export class Phase6Orchestrator {
  private config: Phase6Config;

  // Module 1: Polymorphic Matrix
  private proxyManager?: ProxyManager;
  private fingerprintGenerator?: FingerprintGenerator;
  private jitterInjector?: JitterInjector;
  private httpClient?: HttpClientWrapper;

  // Module 2: WS Sharding
  private shardAllocator?: ShardAllocator;
  private aggregator?: Aggregator;
  private edgeDeployer?: EdgeFunctionDeployer;

  // Module 3: Chameleon
  private environment?: Environment;
  private rlAgent?: QLearningAgent;
  private ruleAgent?: RuleBasedAgent;
  private noiseExecutor?: NoiseExecutor;
  private guiEmulator?: GuiEmulator;

  private noiseActionsTriggered = 0;

  constructor(config: Phase6Config) {
    this.config = config;
  }

  /** Initialize enabled modules */
  async initialize(symbols: string[] = ['BTC/USDT', 'ETH/USDT']): Promise<void> {
    if (this.config.polymorphicMatrix.enabled) {
      this.initPolymorphicMatrix();
    }

    if (this.config.wsSharding.enabled) {
      this.initWsSharding(symbols);
    }

    if (this.config.chameleon.enabled) {
      this.initChameleon();
    }
  }

  private initPolymorphicMatrix(): void {
    const cfg = this.config.polymorphicMatrix;

    // Create mock proxy pool
    const mockPool = Array.from({ length: 5 }, (_, i) => ({
      host: `proxy-${i}.residential.mock`,
      port: 8000 + i,
      protocol: 'http' as const,
      alive: true,
      latencyMs: 20 + Math.random() * 80,
    }));

    this.proxyManager = new ProxyManager({
      provider: cfg.proxyProvider as 'brightdata' | 'oxylabs' | 'mock',
      rotationRequests: cfg.proxyRotationRequests,
      rotationSec: cfg.proxyRotationSec,
      pool: mockPool,
    });

    this.fingerprintGenerator = new FingerprintGenerator();
    this.jitterInjector = new JitterInjector({
      meanMs: cfg.jitterMeanMs,
      stdMs: cfg.jitterStdMs,
      orderSizeJitterPct: cfg.orderSizeJitterPct,
    });

    this.httpClient = new HttpClientWrapper({
      proxyManager: this.proxyManager,
      fingerprintGenerator: this.fingerprintGenerator,
      jitterInjector: this.jitterInjector,
    });
  }

  private initWsSharding(symbols: string[]): void {
    const cfg = this.config.wsSharding;

    this.shardAllocator = new ShardAllocator(cfg.numShards, symbols);
    this.aggregator = new Aggregator();
    this.edgeDeployer = new EdgeFunctionDeployer();

    // Deploy edge connections for all shards
    for (const shard of this.shardAllocator.getAllShards()) {
      this.edgeDeployer.deploy(shard);
      this.shardAllocator.connectShard(shard.id);

      // Wire messages to aggregator
      this.edgeDeployer.onMessage(shard.id, (msg) => {
        this.aggregator!.processMessage(msg);
      });
    }

    this.shardAllocator.rebalance();
  }

  private initChameleon(): void {
    const cfg = this.config.chameleon;

    this.environment = new Environment(cfg.detectionThreshold);
    this.guiEmulator = new GuiEmulator(false); // Simulation mode

    const chameleonConfig = {
      rlModel: cfg.rlModel as 'qlearning' | 'rulebased',
      noiseActions: cfg.noiseActions as import('./types').NoiseAction[],
      detectionThreshold: cfg.detectionThreshold,
      noiseIntervalMs: cfg.noiseIntervalMs,
      learningRate: 0.1,
      discountFactor: 0.95,
      explorationRate: 0.2,
    };

    if (cfg.rlModel === 'qlearning') {
      this.rlAgent = new QLearningAgent(chameleonConfig);
    } else {
      this.ruleAgent = new RuleBasedAgent(chameleonConfig);
    }

    this.noiseExecutor = new NoiseExecutor({
      logGuiCheck: () => {
        this.guiEmulator?.simulateBalanceCheck('https://exchange.mock');
      },
    });
  }

  /** Execute one chameleon noise cycle */
  async executeChameleonCycle(): Promise<void> {
    if (!this.environment || !this.noiseExecutor) return;

    const state = this.environment.getState();
    const action = this.rlAgent
      ? this.rlAgent.selectAction(state)
      : this.ruleAgent?.selectAction(state) ?? 'doNothing';

    const result = this.environment.step(action);
    await this.noiseExecutor.execute(action);
    this.noiseActionsTriggered++;

    if (this.rlAgent) {
      this.rlAgent.update(state, action, result.reward, result.state);
    }
  }

  /** Get ghost-mode HTTP client (null if polymorphic matrix disabled) */
  getHttpClient(): HttpClientWrapper | null {
    return this.httpClient ?? null;
  }

  /** Get aggregated feed (null if WS sharding disabled) */
  getAggregator(): Aggregator | null {
    return this.aggregator ?? null;
  }

  /** Get current status of all modules */
  getStatus(): Phase6Status {
    return {
      polymorphicMatrix: {
        active: this.config.polymorphicMatrix.enabled,
        proxyPoolSize: this.proxyManager?.getPoolSize() ?? 0,
        requestCount: this.httpClient?.getRequestCount() ?? 0,
      },
      wsSharding: {
        active: this.config.wsSharding.enabled,
        shardCount: this.shardAllocator?.getShardCount() ?? 0,
        connectedShards: this.shardAllocator?.getActiveShards().length ?? 0,
      },
      chameleon: {
        active: this.config.chameleon.enabled,
        detectionScore: this.environment?.getState().detectionScore ?? 0,
        noiseActionsTriggered: this.noiseActionsTriggered,
      },
    };
  }

  /** Shutdown all modules */
  async shutdown(): Promise<void> {
    if (this.edgeDeployer && this.shardAllocator) {
      for (const shard of this.shardAllocator.getAllShards()) {
        this.edgeDeployer.undeploy(shard.id);
      }
    }
    this.aggregator?.reset();
  }
}
