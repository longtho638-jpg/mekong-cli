/**
 * strategy-auto-detector — Nixpacks-inspired Strategy Auto-Detector + Build Plan Generator.
 * Auto-detects strategy type from config, generates and executes deployment plan
 * with phases: init → validate-config → [exchange-connectivity] → backtest → deploy.
 */

import { logger } from '../utils/logger';

// Re-export all types for backward compatibility
export type {
  StrategyType,
  DetectionResult,
  StrategyDetector,
  StrategyConfig,
  PhaseStatus,
  BuildPhase,
  PhaseResult,
  BuildContext,
  BuildPlan,
} from './strategy-auto-detector-types';

import {
  StrategyType,
  DetectionResult,
  StrategyDetector,
  StrategyConfig,
  PhaseResult,
  BuildContext,
  BuildPlan,
} from './strategy-auto-detector-types';

import { BUILT_IN_DETECTORS } from './strategy-detection-rules-builtin';
import { createBuildPhases } from './strategy-build-phases-factory';

export class StrategyAutoDetector {
  private detectors: StrategyDetector[];

  constructor(customDetectors?: StrategyDetector[]) {
    this.detectors = [...BUILT_IN_DETECTORS, ...(customDetectors || [])].sort((a, b) => b.priority - a.priority);
  }

  /** Auto-detect strategy type from config */
  detect(config: StrategyConfig): DetectionResult {
    for (const detector of this.detectors) {
      const result = detector.detect(config);
      if (result) {
        logger.info(`[AutoDetect] ${detector.name}: ${result.type} (confidence: ${result.confidence})`);
        return result;
      }
    }
    return { type: 'unknown', confidence: 0, provider: 'fallback', markers: [] };
  }

  /** Generate build plan based on detected strategy type */
  generateBuildPlan(config: StrategyConfig): BuildPlan {
    const detection = this.detect(config);
    const phases = createBuildPhases(detection.type);
    return { strategyType: detection.type, phases, config };
  }

  /** Execute a build plan sequentially, stopping on gate failure */
  async executePlan(plan: BuildPlan): Promise<PhaseResult[]> {
    const results: PhaseResult[] = [];
    const context: BuildContext = {
      strategyType: plan.strategyType,
      config: plan.config,
      previousResults: results,
    };

    for (const phase of plan.phases) {
      logger.info(`[BuildPlan] Phase: ${phase.name} (${phase.id})`);
      phase.status = 'running';

      try {
        const result = await phase.execute(context);
        results.push(result);
        phase.status = result.status;

        if (phase.gate && !phase.gate(result)) {
          logger.warn(`[BuildPlan] Gate failed: ${phase.name}`);
          phase.status = 'failed';
          break;
        }
      } catch (err) {
        phase.status = 'failed';
        results.push({
          phaseId: phase.id,
          status: 'failed',
          metrics: {},
          output: err instanceof Error ? err.message : String(err),
        });
        break;
      }
    }

    return results;
  }

  /** Register a custom detector (re-sorts by priority) */
  addDetector(detector: StrategyDetector): void {
    this.detectors.push(detector);
    this.detectors.sort((a, b) => b.priority - a.priority);
  }
}
