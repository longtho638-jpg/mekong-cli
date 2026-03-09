/**
 * Phase 11 Module 2: Brain-Computer Interface (BCI) Integration — barrel exports.
 *
 * Components:
 * 1. EegSimulator       — Synthetic EEG signal generation with band models
 * 2. NeuralDecoder      — Rule-based classifier: band power → intention
 * 3. IntentionTranslator — Maps intentions to trading config changes
 * 4. SafetyOverride     — Dead-man switch: auto-pause on signal loss
 *
 * All modules default to dryRun: true.
 */

export { EegSimulator } from './eeg-simulator';
export type { EegSimulatorConfig, EegSample, MentalState } from './eeg-simulator';

export { NeuralDecoder } from './neural-decoder';
export type { NeuralDecoderConfig, DecodedIntention, IntentionType } from './neural-decoder';

export { IntentionTranslator } from './intention-translator';
export type { IntentionTranslatorConfig, ConfigChange } from './intention-translator';

export { SafetyOverride } from './safety-override';
export type { SafetyOverrideConfig, SafetyStatus } from './safety-override';

// ── Unified config ────────────────────────────────────────────────────────────

export interface BciInterfaceConfig {
  /** Master switch — all components disabled when false. Default: false */
  enabled: boolean;
  /** EEG sample rate in Hz. Default: 256 */
  sampleRateHz?: number;
  /** Number of EEG channels. Default: 8 */
  channelCount?: number;
  /** Minimum decoder confidence to apply a config change. Default: 0.6 */
  minConfidence?: number;
  /** Seconds without heartbeat before safety pause. Default: 30 */
  deadManSeconds?: number;
}

// ── Imports for factory ───────────────────────────────────────────────────────

import { EegSimulator } from './eeg-simulator';
import { NeuralDecoder } from './neural-decoder';
import { IntentionTranslator } from './intention-translator';
import type { ConfigChange } from './intention-translator';
import { SafetyOverride } from './safety-override';

// ── Instance bundle ───────────────────────────────────────────────────────────

export interface BciInterfaceInstances {
  /** Convenience: generate sample → decode → translate → heartbeat. */
  processSignal(): ConfigChange | null;

  // Short aliases
  simulator: EegSimulator;
  decoder: NeuralDecoder;
  translator: IntentionTranslator;
  safety: SafetyOverride;

  // Full names
  eegSimulator: EegSimulator;
  neuralDecoder: NeuralDecoder;
  intentionTranslator: IntentionTranslator;
  safetyOverride: SafetyOverride;

  config: BciInterfaceConfig;
}

const DEFAULT_BCI_CONFIG: BciInterfaceConfig = {
  enabled: false,
  sampleRateHz: 256,
  channelCount: 8,
  minConfidence: 0.6,
  deadManSeconds: 30,
};

/**
 * Factory: initialise all BCI components from a single config object.
 * When enabled=false (default), all subcomponents run in dryRun mode.
 */
export function initBciInterface(
  config: Partial<BciInterfaceConfig> = {},
): BciInterfaceInstances {
  const cfg: BciInterfaceConfig = { ...DEFAULT_BCI_CONFIG, ...config };
  const dryRun = !cfg.enabled;

  const eegSimulator = new EegSimulator({
    sampleRateHz: cfg.sampleRateHz,
    channelCount: cfg.channelCount,
    dryRun,
  });

  const neuralDecoder = new NeuralDecoder({ dryRun });

  const intentionTranslator = new IntentionTranslator({
    minConfidence: cfg.minConfidence,
    dryRun,
  });

  const safetyOverride = new SafetyOverride({
    deadManSeconds: cfg.deadManSeconds,
    dryRun,
  });

  /**
   * Pipeline convenience: generate one EEG sample, decode the intention,
   * attempt a config translation, and record a safety heartbeat.
   * Returns the ConfigChange if one was produced, otherwise null.
   */
  function processSignal(): ConfigChange | null {
    const sample = eegSimulator.generateSample();
    const decoded = neuralDecoder.decode(sample);
    const change = intentionTranslator.translate(decoded);
    safetyOverride.heartbeat();
    return change;
  }

  return {
    processSignal,
    // Short aliases
    simulator: eegSimulator,
    decoder: neuralDecoder,
    translator: intentionTranslator,
    safety: safetyOverride,
    // Full names
    eegSimulator,
    neuralDecoder,
    intentionTranslator,
    safetyOverride,
    config: cfg,
  };
}
