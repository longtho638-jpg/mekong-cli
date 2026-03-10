/**
 * Chaos Testing Framework - Main entry point.
 * Orchestrates environment setup, failure injection, scenario execution, and reporting.
 */
import * as fs from 'fs';
import * as path from 'path';
import { buildEnvironment, destroyEnvironment, EnvironmentConfig } from './environment-builder';
import { clearAllFailures } from './failure-injector';
import { runAllScenarios, ChaosScenario, ScenarioResult } from './scenario-scheduler';
import { clearMetrics, computeLatencyHistogram, recordLatency } from './monitor-aggregator';
import { buildChaosReport, saveChaosReport, ChaosReport } from './chaos-report-generator';

export interface ChaosConfig {
  environment: EnvironmentConfig;
  scenarios: ChaosScenario[];
  durationHours: number;
  reportPath: string;
}

/**
 * Load chaos config from JSON file.
 */
export function loadChaosConfig(configPath?: string): ChaosConfig {
  const cfgPath = configPath || path.resolve(process.cwd(), 'config.chaos.json');

  if (!fs.existsSync(cfgPath)) {
    return {
      environment: { useDocker: false, images: {} },
      scenarios: [],
      durationHours: 1,
      reportPath: './chaos_report.html',
    };
  }

  return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
}

/**
 * Run the full chaos testing pipeline.
 */
export function runChaosTests(config: ChaosConfig, rootDir?: string): ChaosReport {
  const projectRoot = rootDir || process.cwd();

  // Step 1: Build environment
  const env = buildEnvironment(config.environment);

  // Step 2: Clear previous state
  clearAllFailures();
  clearMetrics();

  // Step 3: Record some baseline latency metrics
  recordLatency('baseline', 5);
  recordLatency('baseline', 8);
  recordLatency('baseline', 12);

  // Step 4: Run all scenarios
  const results: ScenarioResult[] = runAllScenarios(env, config.scenarios);

  // Step 5: Record post-test latency
  for (const result of results) {
    recordLatency(result.scenario.name, result.actualRecoveryTimeSec * 1000);
  }

  // Step 6: Compute latency histogram
  const latency = computeLatencyHistogram();

  // Step 7: Build report
  const report = buildChaosReport(results, latency);

  // Step 8: Save report
  const outputPath = path.resolve(projectRoot, config.reportPath);
  saveChaosReport(report, outputPath);

  // Step 9: Cleanup
  destroyEnvironment(env);

  return report;
}

// CLI entry point
if (require.main === module) {
  const config = loadChaosConfig();
  console.log('🔥 Starting Chaos Tests...');
  console.log(`📂 Scenarios: ${config.scenarios.length}`);

  const report = runChaosTests(config);

  console.log('\n📊 Chaos Test Complete:');
  console.log(`  Total: ${report.totalScenarios}`);
  console.log(`  Passed: ${report.passed}`);
  console.log(`  Failed: ${report.failed}`);
  console.log(`\n📄 Report saved to: ${config.reportPath}`);
}

export type { ChaosReport, ScenarioResult };
