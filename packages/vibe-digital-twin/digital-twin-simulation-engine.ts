/**
 * @agencyos/vibe-digital-twin — Simulation Engine
 *
 * Run what-if scenarios on digital twins.
 * Supports parameter sweeps and Monte Carlo analysis.
 */

import type {
  SimulationScenario,
  SimulationResult,
  SimulationRun,
  TwinInstance,
} from './types';

// ─── Simulation Config ──────────────────────────────────────────

export interface SimulationEngineConfig {
  /** Function to get twin's current state */
  getTwin: (id: string) => TwinInstance | undefined;
  /** Function to evaluate a metric given twin state + overrides */
  evaluateMetric: (twin: TwinInstance, metric: string, overrides: Record<string, number>) => number;
  /** Available metrics to simulate */
  metrics: string[];
}

// ─── Simulation Engine ──────────────────────────────────────────

export function createSimulationEngine(config: SimulationEngineConfig) {
  const runs: SimulationRun[] = [];

  return {
    /** Run a simulation scenario */
    async runScenario(scenario: SimulationScenario): Promise<SimulationRun> {
      const run: SimulationRun = {
        id: `sim_${Date.now()}`,
        scenario,
        status: 'running',
        results: [],
        startedAt: new Date().toISOString(),
      };
      runs.push(run);

      try {
        for (const twinId of scenario.twinIds) {
          const twin = config.getTwin(twinId);
          if (!twin) {
            run.results.push({
              scenarioId: scenario.id,
              twinId,
              metric: 'error',
              baseline: 0,
              simulated: 0,
              delta: 0,
              deltaPercent: 0,
              confidence: 0,
            });
            continue;
          }

          for (const metric of config.metrics) {
            const baseline = config.evaluateMetric(twin, metric, {});
            const simulated = config.evaluateMetric(twin, metric, scenario.parameterOverrides);

            const delta = simulated - baseline;
            const deltaPercent = baseline !== 0 ? (delta / baseline) * 100 : 0;

            run.results.push({
              scenarioId: scenario.id,
              twinId,
              metric,
              baseline,
              simulated,
              delta,
              deltaPercent,
              confidence: 0.85,
            });
          }
        }

        run.status = 'completed';
        run.completedAt = new Date().toISOString();
      } catch (err) {
        run.status = 'failed';
        run.error = err instanceof Error ? err.message : 'Unknown error';
        run.completedAt = new Date().toISOString();
      }

      return run;
    },

    /** Run Monte Carlo simulation with randomized parameters */
    async runMonteCarlo(
      scenario: SimulationScenario,
      iterations: number,
      variance: number = 0.1,
    ): Promise<{ mean: SimulationResult[]; stdDev: Record<string, number> }> {
      const allResults: SimulationResult[][] = [];

      for (let i = 0; i < iterations; i++) {
        // Randomize parameters within variance range
        const randomOverrides: Record<string, number> = {};
        for (const [key, value] of Object.entries(scenario.parameterOverrides)) {
          const jitter = value * variance * (Math.random() * 2 - 1);
          randomOverrides[key] = value + jitter;
        }

        const modifiedScenario = { ...scenario, parameterOverrides: randomOverrides };
        const run = await this.runScenario(modifiedScenario);
        allResults.push(run.results);
      }

      // Calculate mean results
      const meanResults: SimulationResult[] = [];
      const stdDevs: Record<string, number> = {};

      if (allResults.length > 0) {
        for (let r = 0; r < allResults[0].length; r++) {
          const values = allResults.map(results => results[r].simulated);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

          const base = allResults[0][r];
          meanResults.push({
            ...base,
            simulated: mean,
            delta: mean - base.baseline,
            deltaPercent: base.baseline !== 0 ? ((mean - base.baseline) / base.baseline) * 100 : 0,
            confidence: 0.95,
          });

          stdDevs[`${base.twinId}:${base.metric}`] = Math.sqrt(variance);
        }
      }

      return { mean: meanResults, stdDev: stdDevs };
    },

    /** Get all simulation runs */
    getRuns(): SimulationRun[] {
      return runs;
    },

    /** Get a specific run */
    getRun(runId: string): SimulationRun | undefined {
      return runs.find(r => r.id === runId);
    },
  };
}
