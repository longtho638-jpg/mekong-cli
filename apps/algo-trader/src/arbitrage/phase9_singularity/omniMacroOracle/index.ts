/**
 * Omni-Macro Sentient Oracle (OMSO) — barrel exports and pipeline factory.
 *
 * Pipeline: NewsIngestor → LlmProcessor → MacroSignalAggregator → SignalBroadcaster
 *           ModelUpdater runs on a separate schedule to keep LLM current.
 *
 * All components default to disabled. Enable via OmniMacroOracleConfig.
 */

export { NewsIngestor } from './news-ingestor';
export type { NewsHeadline, NewsSource, NewsIngestorConfig } from './news-ingestor';

export { LlmProcessor } from './llm-processor';
export type { LlmProcessorConfig, SentimentResult, ProcessedHeadline } from './llm-processor';

export { MacroSignalAggregator } from './macro-signal-aggregator';
export type {
  MacroState,
  OnChainData,
  EconomicIndicator,
  MacroSignalAggregatorConfig,
} from './macro-signal-aggregator';

export { SignalBroadcaster } from './signal-broadcaster';
export type { SignalBroadcasterConfig, BroadcastEvent } from './signal-broadcaster';

export { ModelUpdater } from './model-updater';
export type { ModelUpdaterConfig, UpdateResult } from './model-updater';

// ── Config ────────────────────────────────────────────────────────────────────

export interface OmniMacroOracleConfig {
  enabled: boolean;
  llmModel: string;
  newsSources: string[];
  /** Seconds between ModelUpdater scheduled checks. */
  updateIntervalSec: number;
}

const DEFAULT_CONFIG: OmniMacroOracleConfig = {
  enabled: false,
  llmModel: 'llama3-8b-instruct',
  newsSources: ['reuters', 'bloomberg', 'twitter'],
  updateIntervalSec: 10,
};

// ── Pipeline handle ───────────────────────────────────────────────────────────

export interface OmniMacroOracle {
  ingestor: NewsIngestor;
  processor: LlmProcessor;
  aggregator: MacroSignalAggregator;
  broadcaster: SignalBroadcaster;
  updater: ModelUpdater;
  /** Tear down the entire pipeline. */
  stop(): void;
}

// ── Factory ───────────────────────────────────────────────────────────────────

import { NewsIngestor } from './news-ingestor';
import type { NewsSource } from './news-ingestor';
import { LlmProcessor } from './llm-processor';
import { MacroSignalAggregator } from './macro-signal-aggregator';
import { SignalBroadcaster } from './signal-broadcaster';
import { ModelUpdater } from './model-updater';

/**
 * Initialise the OMSO pipeline.
 *
 * Wires components together:
 *   1. Ingestor queues headlines.
 *   2. On each headline, processor batch-processes the queue.
 *   3. Aggregator computes MacroState from processed headlines.
 *   4. Broadcaster publishes the state to all subscribers.
 *   5. ModelUpdater receives processed samples for periodic fine-tuning.
 */
export function initOmniMacroOracle(
  config: Partial<OmniMacroOracleConfig> = {},
): OmniMacroOracle {
  const cfg: OmniMacroOracleConfig = { ...DEFAULT_CONFIG, ...config };

  const validSources: NewsSource[] = ['reuters', 'bloomberg', 'twitter', 'coindesk', 'cnn'];
  const sources = cfg.newsSources.filter((s): s is NewsSource =>
    validSources.includes(s as NewsSource),
  );

  const ingestor = new NewsIngestor({ enabled: cfg.enabled, sources });
  const processor = new LlmProcessor({ enabled: cfg.enabled, modelName: cfg.llmModel });
  const aggregator = new MacroSignalAggregator({ enabled: cfg.enabled });
  const broadcaster = new SignalBroadcaster({ enabled: cfg.enabled });
  const updater = new ModelUpdater({
    enabled: cfg.enabled,
    updateIntervalMs: cfg.updateIntervalSec * 1_000,
  });

  // Wire: ingestor → processor → aggregator → broadcaster + updater
  ingestor.on('headline', async () => {
    const queue = ingestor.getQueue();
    if (queue.length === 0) return;

    const processed = await processor.processHeadlines(queue);
    if (processed.length === 0) return;

    const state = aggregator.aggregate(processed);
    broadcaster.broadcast(state);
    updater.addSamples(processed);
  });

  // Start components
  ingestor.start();
  updater.scheduleUpdate();

  return {
    ingestor,
    processor,
    aggregator,
    broadcaster,
    updater,
    stop() {
      ingestor.stop();
      updater.stopScheduler();
    },
  };
}
