/**
 * ROI Dashboard — Calculate time saved, cost efficiency, and ROI multiplier
 *
 * Reads metering data and calculates:
 * - Time saved per command vs manual coding
 * - Cost per agent call
 * - Total ROI multiplier
 */
import type { UsageEvent, MeterReading, UsageSummary } from '../metering/types.js';
import { UsageAnalyzer } from '../metering/analyzer.js';

/** Time estimates (seconds) for manual vs AI-assisted tasks */
const TIME_ESTIMATES = {
  // Manual coding times (seconds)
  manual_command: 300,      // 5 min per command
  manual_test: 600,         // 10 min per test
  manual_docs: 900,         // 15 min per doc
  manual_debug: 1800,       // 30 min per debug session

  // AI-assisted times (seconds)
  ai_command: 30,           // 30 sec with Mekong
  ai_test: 60,              // 1 min with Mekong
  ai_docs: 90,              // 1.5 min with Mekong
  ai_debug: 300,            // 5 min with Mekong
};

/** Cost per hour for developer (USD) */
const DEVELOPER_HOURLY_RATE = 50; // $50/hour

/** ROI metrics snapshot */
export interface RoiMetrics {
  /** Total time saved in seconds */
  total_time_saved_seconds: number;
  /** Total time saved in hours */
  total_time_saved_hours: number;
  /** Time saved per category */
  time_saved_by_category: {
    commands: number;       // seconds
    tests: number;          // seconds
    docs: number;           // seconds
    debug: number;          // seconds
  };
  /** Cost metrics */
  cost: {
    /** Total LLM cost USD */
    total_llm_cost_usd: number;
    /** Average cost per agent call */
    cost_per_agent_call: number;
    /** Cost per command */
    cost_per_command: number;
  };
  /** Value metrics */
  value: {
    /** Labor cost saved USD */
    labor_cost_saved_usd: number;
    /** Net value (saved - llm cost) */
    net_value_usd: number;
    /** ROI multiplier */
    roi_multiplier: number;
  };
  /** Productivity metrics */
  productivity: {
    /** Commands executed */
    total_commands: number;
    /** Time saved per command (avg seconds) */
    avg_time_saved_per_command: number;
    /** Efficiency gain (%) */
    efficiency_gain_percent: number;
  };
  /** Period info */
  period: {
    start_date: string;
    end_date: string;
    days_tracked: number;
  };
}

/** Detailed breakdown by day */
export interface DailyRoiBreakdown {
  date: string;
  time_saved_seconds: number;
  llm_cost_usd: number;
  net_value_usd: number;
  roi_multiplier: number;
}

/**
 * ROI Dashboard Service
 */
export class RoiDashboard {
  private analyzer: UsageAnalyzer;

  constructor() {
    this.analyzer = new UsageAnalyzer();
  }

  /**
   * Calculate ROI metrics from usage events
   */
  calculateRoi(events: UsageEvent[]): RoiMetrics {
    if (events.length === 0) {
      return this.emptyMetrics();
    }

    const summary = this.analyzer.summarize(events);
    const readings = summary.readings;

    // Calculate time saved
    const timeSaved = this.calculateTimeSaved(events);
    const totalTimeSavedSeconds = timeSaved.commands + timeSaved.tests + timeSaved.docs + timeSaved.debug;

    // Calculate cost metrics
    const totalLlmCost = summary.totals.totalCostUsd;
    const totalCommands = events.filter(e => e.category === 'tool_run' || e.category === 'sop_run').length;
    const agentCalls = events.filter(e => e.category === 'llm_call').length;

    const costPerAgentCall = agentCalls > 0 ? totalLlmCost / agentCalls : 0;
    const costPerCommand = totalCommands > 0 ? totalLlmCost / totalCommands : 0;

    // Calculate value metrics
    const totalTimeSavedHours = totalTimeSavedSeconds / 3600;
    const laborCostSaved = totalTimeSavedHours * DEVELOPER_HOURLY_RATE;
    const netValue = laborCostSaved - totalLlmCost;
    const roiMultiplier = totalLlmCost > 0 ? laborCostSaved / totalLlmCost : 0;

    // Period info
    const dates = events.map(e => e.timestamp).sort();
    const startDate = dates[0]?.slice(0, 10) || '';
    const endDate = dates[dates.length - 1]?.slice(0, 10) || '';

    return {
      total_time_saved_seconds: totalTimeSavedSeconds,
      total_time_saved_hours: totalTimeSavedHours,
      time_saved_by_category: {
        commands: timeSaved.commands,
        tests: timeSaved.tests,
        docs: timeSaved.docs,
        debug: timeSaved.debug,
      },
      cost: {
        total_llm_cost_usd: totalLlmCost,
        cost_per_agent_call: costPerAgentCall,
        cost_per_command: costPerCommand,
      },
      value: {
        labor_cost_saved_usd: laborCostSaved,
        net_value_usd: netValue,
        roi_multiplier: roiMultiplier,
      },
      productivity: {
        total_commands: totalCommands,
        avg_time_saved_per_command: totalCommands > 0 ? totalTimeSavedSeconds / totalCommands : 0,
        efficiency_gain_percent: this.calculateEfficiencyGain(events),
      },
      period: {
        start_date: startDate,
        end_date: endDate,
        days_tracked: readings.length,
      },
    };
  }

  /**
   * Get daily ROI breakdown
   */
  getDailyBreakdown(events: UsageEvent[]): DailyRoiBreakdown[] {
    const summary = this.analyzer.summarize(events);

    return summary.readings.map(reading => {
      const dayEvents = events.filter(e => e.timestamp.startsWith(reading.date));
      const timeSaved = this.calculateTimeSaved(dayEvents);
      const totalTimeSavedSeconds = timeSaved.commands + timeSaved.tests + timeSaved.docs + timeSaved.debug;
      const totalTimeSavedHours = totalTimeSavedSeconds / 3600;
      const laborCostSaved = totalTimeSavedHours * DEVELOPER_HOURLY_RATE;
      const llmCost = reading.totalCostUsd;
      const netValue = laborCostSaved - llmCost;
      const roiMultiplier = llmCost > 0 ? laborCostSaved / llmCost : 0;

      return {
        date: reading.date,
        time_saved_seconds: totalTimeSavedSeconds,
        llm_cost_usd: llmCost,
        net_value_usd: netValue,
        roi_multiplier: roiMultiplier,
      };
    });
  }

  /**
   * Export ROI data as JSON for frontend
   */
  exportJson(events: UsageEvent[]): object {
    const metrics = this.calculateRoi(events);
    const daily = this.getDailyBreakdown(events);

    return {
      generated_at: new Date().toISOString(),
      metrics,
      daily_breakdown: daily,
      summary: {
        total_roi_multiplier: metrics.value.roi_multiplier.toFixed(2),
        total_net_value_usd: metrics.value.net_value_usd.toFixed(2),
        total_time_saved_hours: metrics.total_time_saved_hours.toFixed(2),
        total_llm_cost_usd: metrics.cost.total_llm_cost_usd.toFixed(6),
      },
    };
  }

  /**
   * Calculate time saved by category
   */
  private calculateTimeSaved(events: UsageEvent[]): {
    commands: number;
    tests: number;
    docs: number;
    debug: number;
  } {
    const result = { commands: 0, tests: 0, docs: 0, debug: 0 };

    for (const event of events) {
      if (event.category !== 'tool_run' && event.category !== 'sop_run') continue;

      const resourceName = (event.resourceName || '').toLowerCase();
      const duration = event.durationMs || 0;

      // Categorize by resource name
      if (resourceName.includes('test')) {
        result.tests += this.estimateTimeSaved('test', duration);
      } else if (resourceName.includes('doc')) {
        result.docs += this.estimateTimeSaved('docs', duration);
      } else if (resourceName.includes('debug') || resourceName.includes('fix')) {
        result.debug += this.estimateTimeSaved('debug', duration);
      } else {
        result.commands += this.estimateTimeSaved('command', duration);
      }
    }

    return result;
  }

  /**
   * Estimate time saved for a specific task type
   */
  private estimateTimeSaved(taskType: 'command' | 'test' | 'docs' | 'debug', actualDurationMs: number): number {
    const estimates = TIME_ESTIMATES;
    let manualTime: number;
    let aiTime: number;

    switch (taskType) {
      case 'command':
        manualTime = estimates.manual_command;
        aiTime = estimates.ai_command;
        break;
      case 'test':
        manualTime = estimates.manual_test;
        aiTime = estimates.ai_test;
        break;
      case 'docs':
        manualTime = estimates.manual_docs;
        aiTime = estimates.ai_docs;
        break;
      case 'debug':
        manualTime = estimates.manual_debug;
        aiTime = estimates.ai_debug;
        break;
    }

    // Time saved = manual time - actual AI time (capped at estimate)
    const actualDurationSec = actualDurationMs / 1000;
    const maxTimeSaved = manualTime - aiTime;
    const actualTimeSaved = Math.max(0, manualTime - actualDurationSec);

    return Math.min(actualTimeSaved, maxTimeSaved);
  }

  /**
   * Calculate efficiency gain percentage
   */
  private calculateEfficiencyGain(events: UsageEvent[]): number {
    const toolEvents = events.filter(e => e.category === 'tool_run' || e.category === 'sop_run');
    if (toolEvents.length === 0) return 0;

    let totalManualTime = 0;
    let totalActualTime = 0;

    for (const event of toolEvents) {
      const resourceName = (event.resourceName || '').toLowerCase();
      const actualDuration = event.durationMs || 0;

      // Estimate manual time
      let manualEstimate = TIME_ESTIMATES.manual_command;
      if (resourceName.includes('test')) manualEstimate = TIME_ESTIMATES.manual_test;
      else if (resourceName.includes('doc')) manualEstimate = TIME_ESTIMATES.manual_docs;
      else if (resourceName.includes('debug') || resourceName.includes('fix')) {
        manualEstimate = TIME_ESTIMATES.manual_debug;
      }

      totalManualTime += manualEstimate * 1000; // Convert to ms
      totalActualTime += actualDuration;
    }

    if (totalManualTime === 0) return 0;

    return ((totalManualTime - totalActualTime) / totalManualTime) * 100;
  }

  /**
   * Return empty metrics for no data
   */
  private emptyMetrics(): RoiMetrics {
    return {
      total_time_saved_seconds: 0,
      total_time_saved_hours: 0,
      time_saved_by_category: { commands: 0, tests: 0, docs: 0, debug: 0 },
      cost: {
        total_llm_cost_usd: 0,
        cost_per_agent_call: 0,
        cost_per_command: 0,
      },
      value: {
        labor_cost_saved_usd: 0,
        net_value_usd: 0,
        roi_multiplier: 0,
      },
      productivity: {
        total_commands: 0,
        avg_time_saved_per_command: 0,
        efficiency_gain_percent: 0,
      },
      period: {
        start_date: '',
        end_date: '',
        days_tracked: 0,
      },
    };
  }
}

/** Export singleton instance */
export const roiDashboard = new RoiDashboard();
