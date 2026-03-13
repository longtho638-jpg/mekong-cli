/**
 * ROI Dashboard — ROIaaS Phase 5
 *
 * Calculates ROI metrics from usage data:
 * - Time saved per command vs manual coding
 * - Cost per agent call
 * - Total ROI multiplier
 *
 * Export JSON for frontend dashboard.
 *
 * Usage:
 * ```typescript
 * const dashboard = new ROIDashboard('license-123');
 * const metrics = await dashboard.calculateMetrics(30);
 * const json = dashboard.exportJSON();
 * ```
 */

import { UsageTracker, DailyUsage, UsageReport } from './usage-tracker';

/**
 * Time estimates (minutes) for manual vs CLI
 */
export const TIME_ESTIMATES: Record<string, { manual: number; cli: number }> = {
  // Commands
  'cook': { manual: 120, cli: 5 },      // 2h → 5min = 24x faster
  'plan': { manual: 60, cli: 2 },        // 1h → 2min = 30x faster
  'fix': { manual: 90, cli: 10 },        // 1.5h → 10min = 9x faster
  'code': { manual: 180, cli: 15 },      // 3h → 15min = 12x faster
  'test': { manual: 60, cli: 5 },        // 1h → 5min = 12x faster
  'review': { manual: 45, cli: 3 },      // 45min → 3min = 15x faster
  'deploy': { manual: 30, cli: 2 },      // 30min → 2min = 15x faster
  'debug': { manual: 120, cli: 15 },     // 2h → 15min = 8x faster

  // Agents
  'planner': { manual: 90, cli: 3 },     // 1.5h → 3min = 30x faster
  'researcher': { manual: 180, cli: 5 }, // 3h → 5min = 36x faster
  'fullstack-developer': { manual: 240, cli: 10 }, // 4h → 10min = 24x faster
  'tester': { manual: 60, cli: 3 },      // 1h → 3min = 20x faster
  'code-reviewer': { manual: 90, cli: 5 }, // 1.5h → 5min = 18x faster
  'debugger': { manual: 120, cli: 10 },  // 2h → 10min = 12x faster
  'docs-manager': { manual: 60, cli: 3 }, // 1h → 3min = 20x faster
  'project-manager': { manual: 45, cli: 2 }, // 45min → 2min = 22.5x faster
};

/**
 * Cost per agent call (USD) — based on LLM API costs
 */
export const AGENT_COSTS: Record<string, number> = {
  'planner': 0.05,
  'researcher': 0.08,
  'fullstack-developer': 0.15,
  'tester': 0.04,
  'code-reviewer': 0.06,
  'debugger': 0.10,
  'docs-manager': 0.04,
  'project-manager': 0.03,
  'scout': 0.02,
  'explorer': 0.03,
};

/**
 * Developer hourly rate (for time savings calculation)
 */
export const DEVELOPER_HOURLY_RATE = 75; // USD/hour

/**
 * ROI metrics
 */
export interface ROIMetrics {
  // Time savings
  totalMinutesSaved: number;
  totalHoursSaved: number;
  timeSavedByCommand: Record<string, number>;
  timeSavedByAgent: Record<string, number>;

  // Cost savings
  laborCostSaved: number; // USD
  avgCostPerCommand: number; // USD
  avgCostPerAgent: number; // USD

  // ROI
  totalCostAvoided: number; // USD
  roiMultiplier: number; // X
  investmentCost: number; // USD (LLM API costs)

  // Usage summary
  totalCommands: number;
  totalAgents: number;
  totalPipelines: number;
  periodDays: number;
}

/**
 * Daily ROI metrics
 */
export interface DailyROI {
  date: string;
  minutesSaved: number;
  costSaved: number;
  commands: number;
  agents: number;
}

/**
 * ROI Dashboard class
 */
export class ROIDashboard {
  private tracker: UsageTracker;
  private licenseKey: string;

  constructor(licenseKey: string) {
    this.licenseKey = licenseKey;
    this.tracker = UsageTracker.getInstance();
  }

  /**
   * Calculate ROI metrics for a period
   */
  calculateMetrics(days: number = 30): ROIMetrics {
    const report = this.tracker.getUsageReport(this.licenseKey, days);

    let totalMinutesSaved = 0;
    const timeSavedByCommand: Record<string, number> = {};
    const timeSavedByAgent: Record<string, number> = {};
    let totalAgentCost = 0;

    // Process each day
    for (const daily of report.dailyReports) {
      // Command time savings
      for (const [cmd, count] of Object.entries(daily.commandBreakdown)) {
        const estimate = TIME_ESTIMATES[cmd] || { manual: 60, cli: 5 };
        const saved = (estimate.manual - estimate.cli) * count;
        totalMinutesSaved += saved;
        timeSavedByCommand[cmd] = (timeSavedByCommand[cmd] || 0) + saved;
      }

      // Agent time savings + costs
      for (const [agent, count] of Object.entries(daily.agentBreakdown)) {
        const estimate = TIME_ESTIMATES[agent] || { manual: 60, cli: 5 };
        const saved = (estimate.manual - estimate.cli) * count;
        totalMinutesSaved += saved;
        timeSavedByAgent[agent] = (timeSavedByAgent[agent] || 0) + saved;

        // Agent LLM cost
        const agentCost = AGENT_COSTS[agent] || 0.05;
        totalAgentCost += agentCost * count;
      }
    }

    const totalHoursSaved = totalMinutesSaved / 60;
    const laborCostSaved = totalHoursSaved * DEVELOPER_HOURLY_RATE;
    const totalCommands = report.totalCommands;
    const totalAgents = report.totalAgents;

    const avgCostPerCommand = totalCommands > 0 ? totalAgentCost / totalCommands : 0;
    const avgCostPerAgent = totalAgents > 0 ? totalAgentCost / totalAgents : 0;

    // ROI calculation
    const investmentCost = totalAgentCost; // LLM API costs
    const totalCostAvoided = laborCostSaved;
    const roiMultiplier = investmentCost > 0 ? totalCostAvoided / investmentCost : 0;

    return {
      totalMinutesSaved: Math.round(totalMinutesSaved),
      totalHoursSaved: Math.round(totalHoursSaved * 10) / 10,
      timeSavedByCommand,
      timeSavedByAgent,
      laborCostSaved: Math.round(laborCostSaved),
      avgCostPerCommand: Math.round(avgCostPerCommand * 100) / 100,
      avgCostPerAgent: Math.round(avgCostPerAgent * 100) / 100,
      totalCostAvoided: Math.round(totalCostAvoided),
      roiMultiplier: Math.round(roiMultiplier * 10) / 10,
      investmentCost: Math.round(investmentCost),
      totalCommands,
      totalAgents,
      totalPipelines: report.totalPipelines,
      periodDays: days,
    };
  }

  /**
   * Get daily ROI breakdown
   */
  getDailyROI(days: number = 30): DailyROI[] {
    const report = this.tracker.getUsageReport(this.licenseKey, days);
    const dailyROI: DailyROI[] = [];

    for (const daily of report.dailyReports) {
      let minutesSaved = 0;

      // Command savings
      for (const [cmd, count] of Object.entries(daily.commandBreakdown)) {
        const estimate = TIME_ESTIMATES[cmd] || { manual: 60, cli: 5 };
        minutesSaved += (estimate.manual - estimate.cli) * count;
      }

      // Agent savings
      for (const [agent, count] of Object.entries(daily.agentBreakdown)) {
        const estimate = TIME_ESTIMATES[agent] || { manual: 60, cli: 5 };
        minutesSaved += (estimate.manual - estimate.cli) * count;
      }

      dailyROI.push({
        date: daily.date,
        minutesSaved: Math.round(minutesSaved),
        costSaved: Math.round((minutesSaved / 60) * DEVELOPER_HOURLY_RATE),
        commands: daily.totalCommands,
        agents: daily.totalAgents,
      });
    }

    return dailyROI;
  }

  /**
   * Export as JSON for frontend
   */
  exportJSON(days: number = 30): string {
    const metrics = this.calculateMetrics(days);
    const daily = this.getDailyROI(days);

    return JSON.stringify(
      {
        licenseKeyHash: this.tracker.getUsageReport(this.licenseKey, 1).licenseKeyHash,
        generatedAt: new Date().toISOString(),
        period: {
          days,
          startDate: daily[0]?.date,
          endDate: daily[daily.length - 1]?.date,
        },
        summary: metrics,
        dailyBreakdown: daily,
      },
      null,
      2
    );
  }

  /**
   * Generate ASCII report for CLI
   */
  generateASCIIReport(days: number = 30): string {
    const metrics = this.calculateMetrics(days);
    const daily = this.getDailyROI(days);

    const lines: string[] = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║              ROI DASHBOARD — ROIaaS Phase 5              ║',
      '╠══════════════════════════════════════════════════════════╣',
      `║  Period: ${days} days${' '.repeat(46 - days.toString().length)}║`,
      `║  Generated: ${new Date().toISOString().slice(0, 10)}${' '.repeat(37)}║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  📊 USAGE SUMMARY                                        ║',
      '╟──────────────────────────────────────────────────────────╢',
      `║  Total Commands:   ${metrics.totalCommands.toString().padStart(6)}${' '.repeat(32 - metrics.totalCommands.toString().length)}║`,
      `║  Total Agents:     ${metrics.totalAgents.toString().padStart(6)}${' '.repeat(32 - metrics.totalAgents.toString().length)}║`,
      `║  Total Pipelines:  ${metrics.totalPipelines.toString().padStart(6)}${' '.repeat(32 - metrics.totalPipelines.toString().length)}║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  ⏱️  TIME SAVINGS                                         ║',
      '╟──────────────────────────────────────────────────────────╢',
      `║  Minutes Saved:    ${metrics.totalMinutesSaved.toString().padStart(6)} min${' '.repeat(26 - metrics.totalMinutesSaved.toString().length)}║`,
      `║  Hours Saved:      ${metrics.totalHoursSaved.toString().padStart(6)} hrs${' '.repeat(26 - metrics.totalHoursSaved.toString().length)}║`,
      `║  Labor Cost Saved: $${metrics.laborCostSaved.toString().padStart(6)}${' '.repeat(27 - metrics.laborCostSaved.toString().length)}║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  💰 ROI METRICS                                          ║',
      '╟──────────────────────────────────────────────────────────╢',
      `║  Investment Cost:  $${metrics.investmentCost.toString().padStart(6)}${' '.repeat(27 - metrics.investmentCost.toString().length)}║`,
      `║  Cost Avoided:     $${metrics.totalCostAvoided.toString().padStart(6)}${' '.repeat(27 - metrics.totalCostAvoided.toString().length)}║`,
      `║  ROI Multiplier:   ${metrics.roiMultiplier.toFixed(1)}x${' '.repeat(30 - metrics.roiMultiplier.toFixed(1).length)}║`,
      '╚══════════════════════════════════════════════════════════╝',
      '',
    ];

    return lines.join('\n');
  }
}

// Export convenience function
export function getDashboard(licenseKey: string): ROIDashboard {
  return new ROIDashboard(licenseKey);
}
