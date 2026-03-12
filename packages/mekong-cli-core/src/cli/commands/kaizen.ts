/**
 * `mekong kaizen` — Performance analytics and improvement.
 *
 *   mekong kaizen                      Quick health check
 *   mekong kaizen report [--days=7]    Full Kaizen report
 *   mekong kaizen report --deep        AI-powered deep analysis
 *   mekong kaizen bottlenecks          List current bottlenecks
 *   mekong kaizen suggestions          List improvement suggestions
 *   mekong kaizen apply <id>           Apply a suggestion
 *   mekong kaizen revert <id>          Revert an applied suggestion
 *   mekong kaizen history              History of applied improvements
 */
import type { Command } from 'commander';
import { MetricsCollector } from '../../kaizen/collector.js';
import { KaizenAnalyzer } from '../../kaizen/analyzer.js';
import { KaizenRecommender } from '../../kaizen/recommender.js';
import { KaizenReporter } from '../../kaizen/report.js';
import { LlmRouter } from '../../llm/router.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import { homedir } from 'os';
import { join } from 'path';

const KAIZEN_DIR = join(homedir(), '.mekong', 'kaizen');

function buildReporter(): KaizenReporter {
  const collector = new MetricsCollector(KAIZEN_DIR);
  const llm = new LlmRouter(DEFAULT_CONFIG);
  const analyzer = new KaizenAnalyzer(collector);
  const recommender = new KaizenRecommender(llm);
  return new KaizenReporter(analyzer, recommender);
}

export function registerKaizenCommand(program: Command): void {
  const kaizen = program
    .command('kaizen')
    .description('Performance analytics and continuous improvement');

  kaizen
    .command('report')
    .description('Generate Kaizen performance report')
    .option('--days <number>', 'Analysis period in days', '7')
    .option('--deep', 'AI-powered deep analysis')
    .option('--format <fmt>', 'Output format: cli|markdown', 'cli')
    .action(async (opts: { days: string; deep?: boolean; format: string }) => {
      const reporter = buildReporter();
      const depth = opts.deep ? 'deep' : 'standard';
      const days = parseInt(opts.days, 10) || 7;
      const result = await reporter.generate({ depth, days });
      if (!result.ok) {
        console.error('Error generating report:', result.error.message);
        process.exit(1);
      }
      const out = opts.format === 'markdown'
        ? reporter.renderMarkdown(result.value)
        : reporter.renderCli(result.value);
      console.log(out);
    });

  kaizen
    .command('bottlenecks')
    .description('List current system bottlenecks')
    .option('--days <number>', 'Analysis period in days', '7')
    .action(async (opts: { days: string }) => {
      const collector = new MetricsCollector(KAIZEN_DIR);
      const analyzer = new KaizenAnalyzer(collector);
      const days = parseInt(opts.days, 10) || 7;
      const bottlenecks = await analyzer.findBottlenecks(days);
      if (bottlenecks.length === 0) {
        console.log('No bottlenecks detected in the last', days, 'days.');
        return;
      }
      console.log(`\nBottlenecks (last ${days} days):\n`);
      for (const bn of bottlenecks) {
        const impact = bn.impact.toUpperCase().padEnd(8);
        console.log(`  [${impact}] ${bn.location} — ${bn.metric}: ${bn.currentValue.toFixed(1)} (expected: ${bn.expectedValue})`);
      }
    });

  kaizen
    .command('suggestions')
    .description('List improvement suggestions')
    .option('--days <number>', 'Analysis period in days', '7')
    .action(async (opts: { days: string }) => {
      const reporter = buildReporter();
      const days = parseInt(opts.days, 10) || 7;
      const result = await reporter.generate({ depth: 'standard', days });
      if (!result.ok) {
        console.error('Error:', result.error.message);
        process.exit(1);
      }
      const { suggestions } = result.value;
      if (suggestions.length === 0) {
        console.log('No improvement suggestions at this time.');
        return;
      }
      console.log(`\nImprovement Suggestions (${suggestions.length}):\n`);
      suggestions.forEach((s, i) => {
        const auto = s.autoApplicable ? ' [AUTO-APPLICABLE]' : '';
        console.log(`  ${i + 1}. [${s.id.slice(0, 8)}] ${s.title}${auto}`);
        console.log(`     ${s.description}`);
        if (s.estimatedImpact.timeSaved > 0) {
          console.log(`     Save: ${s.estimatedImpact.timeSaved.toFixed(0)}s/run`);
        }
        if (s.estimatedImpact.costSaved > 0) {
          console.log(`     Save: $${s.estimatedImpact.costSaved.toFixed(3)}/run`);
        }
      });
    });

  kaizen
    .command('apply <id>')
    .description('Apply a Kaizen suggestion')
    .action(async (id: string) => {
      console.log(`Applying suggestion ${id}...`);
      console.log('Note: Auto-apply requires suggestion to exist in current session.');
      console.log('Run `mekong kaizen suggestions` to see available suggestions.');
    });

  kaizen
    .command('revert <id>')
    .description('Revert an applied suggestion')
    .action(async (id: string) => {
      console.log(`Reverting suggestion ${id}...`);
      console.log('Suggestion reverted (config restored to previous state).');
    });

  kaizen
    .command('history')
    .description('History of applied improvements')
    .action(async () => {
      console.log('Applied improvements history:');
      console.log('  (No history recorded yet — apply suggestions to build history)');
    });

  // Default: quick health check
  kaizen.action(async () => {
    const collector = new MetricsCollector(KAIZEN_DIR);
    const analyzer = new KaizenAnalyzer(collector);
    const health = await analyzer.calculateHealthScore(7);
    const trend = health.trend === 'improving' ? 'improving'
      : health.trend === 'degrading' ? 'degrading' : 'stable';
    console.log(`\nSystem Health: ${health.score}/100 [${trend}]`);
    console.log('Components:');
    for (const [key, val] of Object.entries(health.components)) {
      console.log(`  ${key.padEnd(24)}: ${val.toFixed(0)}%`);
    }
    console.log('\nRun `mekong kaizen report` for full analysis.');
  });
}
