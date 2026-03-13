/**
 * Usage Tracker — ROIaaS Phase 4
 *
 * Tracks CLI command usage per license key:
 * - Command invocations (cook, plan, fix, etc.)
 * - Agent calls (planner, researcher, fullstack-developer, etc.)
 * - Pipeline runs (PEV cycles)
 * - Free tier enforcement: 10 commands/day
 *
 * Storage: SQLite (~/.mekong/raas/tenants.db)
 *
 * Usage:
 * ```typescript
 * const tracker = UsageTracker.getInstance();
 * await tracker.trackCommand('license-123', 'cook', { complexity: 'standard' });
 * const usage = await tracker.getDailyUsage('license-123');
 * const remaining = tracker.getFreeTierRemaining(usage);
 * ```
 */

import { Database } from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';
import * as crypto from 'crypto';

/**
 * Database path
 */
const DB_PATH = join(homedir(), '.mekong', 'raas', 'tenants.db');

/**
 * Free tier limits
 */
export const FREE_TIER_LIMITS = {
  commandsPerDay: 10,
  agentsPerDay: 5,
  pipelinesPerDay: 3,
};

/**
 * Billable event types
 */
export enum UsageEventType {
  COMMAND = 'command',
  AGENT_CALL = 'agent_call',
  PIPELINE_RUN = 'pipeline_run',
}

/**
 * Usage event structure
 */
export interface UsageEvent {
  id: string;
  licenseKeyHash: string;
  eventType: UsageEventType;
  eventName: string; // command name, agent name, pipeline type
  units: number;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

/**
 * Daily usage summary
 */
export interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalCommands: number;
  totalAgents: number;
  totalPipelines: number;
  commandBreakdown: Record<string, number>;
  agentBreakdown: Record<string, number>;
}

/**
 * Usage tracker class
 */
export class UsageTracker {
  private static instance: UsageTracker;
  private db: Database;

  private constructor() {
    // Ensure directory exists
    const dbDir = join(homedir(), '.mekong', 'raas');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Initialize SQLite
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Initialize database tables
   */
  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        license_key_hash TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_name TEXT NOT NULL,
        units INTEGER NOT NULL DEFAULT 1,
        metadata TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_usage_license_date
      ON usage_events(license_key_hash, substr(timestamp, 1, 10));

      CREATE INDEX IF NOT EXISTS idx_usage_type
      ON usage_events(event_type);
    `);
  }

  /**
   * Hash license key for privacy
   */
  private hashLicenseKey(licenseKey: string): string {
    return crypto.createHash('sha256').update(licenseKey).digest('hex');
  }

  /**
   * Track a command execution
   */
  async trackCommand(
    licenseKey: string,
    command: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const licenseKeyHash = this.hashLicenseKey(licenseKey);
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO usage_events (id, license_key_hash, event_type, event_name, units, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      licenseKeyHash,
      UsageEventType.COMMAND,
      command,
      1,
      JSON.stringify(metadata || {}),
      timestamp
    );
  }

  /**
   * Track an agent call
   */
  async trackAgentCall(
    licenseKey: string,
    agentName: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const licenseKeyHash = this.hashLicenseKey(licenseKey);
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO usage_events (id, license_key_hash, event_type, event_name, units, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      licenseKeyHash,
      UsageEventType.AGENT_CALL,
      agentName,
      1,
      JSON.stringify(metadata || {}),
      timestamp
    );
  }

  /**
   * Track a pipeline run
   */
  async trackPipelineRun(
    licenseKey: string,
    pipelineType: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const licenseKeyHash = this.hashLicenseKey(licenseKey);
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO usage_events (id, license_key_hash, event_type, event_name, units, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      licenseKeyHash,
      UsageEventType.PIPELINE_RUN,
      pipelineType,
      1,
      JSON.stringify(metadata || {}),
      timestamp
    );
  }

  /**
   * Get daily usage for a license key
   */
  getDailyUsage(licenseKey: string, date?: string): DailyUsage {
    const licenseKeyHash = this.hashLicenseKey(licenseKey);
    const targetDate = date || new Date().toISOString().slice(0, 10);

    // Get commands
    const commandsQuery = this.db.prepare(`
      SELECT event_name, SUM(units) as count
      FROM usage_events
      WHERE license_key_hash = ?
        AND event_type = 'command'
        AND substr(timestamp, 1, 10) = ?
      GROUP BY event_name
    `);

    // Get agents
    const agentsQuery = this.db.prepare(`
      SELECT event_name, SUM(units) as count
      FROM usage_events
      WHERE license_key_hash = ?
        AND event_type = 'agent_call'
        AND substr(timestamp, 1, 10) = ?
      GROUP BY event_name
    `);

    // Get pipelines
    const pipelinesQuery = this.db.prepare(`
      SELECT SUM(units) as count
      FROM usage_events
      WHERE license_key_hash = ?
        AND event_type = 'pipeline_run'
        AND substr(timestamp, 1, 10) = ?
    `);

    const commandRows = commandsQuery.all(licenseKeyHash, targetDate) as Array<{ event_name: string; count: number }>;
    const agentRows = agentsQuery.all(licenseKeyHash, targetDate) as Array<{ event_name: string; count: number }>;
    const pipelineRow = pipelinesQuery.get(licenseKeyHash, targetDate) as { count: number } | undefined;

    const commandBreakdown: Record<string, number> = {};
    let totalCommands = 0;
    for (const row of commandRows) {
      commandBreakdown[row.event_name] = row.count;
      totalCommands += row.count;
    }

    const agentBreakdown: Record<string, number> = {};
    let totalAgents = 0;
    for (const row of agentRows) {
      agentBreakdown[row.event_name] = row.count;
      totalAgents += row.count;
    }

    return {
      date: targetDate,
      totalCommands,
      totalAgents,
      totalPipelines: pipelineRow?.count || 0,
      commandBreakdown,
      agentBreakdown,
    };
  }

  /**
   * Check if free tier limit exceeded
   */
  isFreeTierExceeded(licenseKey: string, date?: string): {
    exceeded: boolean;
    reason?: string;
  } {
    const usage = this.getDailyUsage(licenseKey, date);

    if (usage.totalCommands >= FREE_TIER_LIMITS.commandsPerDay) {
      return {
        exceeded: true,
        reason: `Command limit exceeded: ${usage.totalCommands}/${FREE_TIER_LIMITS.commandsPerDay}`,
      };
    }

    if (usage.totalAgents >= FREE_TIER_LIMITS.agentsPerDay) {
      return {
        exceeded: true,
        reason: `Agent limit exceeded: ${usage.totalAgents}/${FREE_TIER_LIMITS.agentsPerDay}`,
      };
    }

    if (usage.totalPipelines >= FREE_TIER_LIMITS.pipelinesPerDay) {
      return {
        exceeded: true,
        reason: `Pipeline limit exceeded: ${usage.totalPipelines}/${FREE_TIER_LIMITS.pipelinesPerDay}`,
      };
    }

    return { exceeded: false };
  }

  /**
   * Get remaining free tier quota
   */
  getFreeTierRemaining(usage: DailyUsage): {
    commandsRemaining: number;
    agentsRemaining: number;
    pipelinesRemaining: number;
  } {
    return {
      commandsRemaining: Math.max(0, FREE_TIER_LIMITS.commandsPerDay - usage.totalCommands),
      agentsRemaining: Math.max(0, FREE_TIER_LIMITS.agentsPerDay - usage.totalAgents),
      pipelinesRemaining: Math.max(0, FREE_TIER_LIMITS.pipelinesPerDay - usage.totalPipelines),
    };
  }

  /**
   * Get usage report for CLI display
   */
  getUsageReport(licenseKey: string, days: number = 7): UsageReport {
    const today = new Date();
    const reports: DailyUsage[] = [];
    let totalCommands = 0;
    let totalAgents = 0;
    let totalPipelines = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const dailyUsage = this.getDailyUsage(licenseKey, dateStr);
      reports.push(dailyUsage);
      totalCommands += dailyUsage.totalCommands;
      totalAgents += dailyUsage.totalAgents;
      totalPipelines += dailyUsage.totalPipelines;
    }

    return {
      licenseKeyHash: this.hashLicenseKey(licenseKey),
      periodDays: days,
      totalCommands,
      totalAgents,
      totalPipelines,
      dailyReports: reports,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Usage report structure
 */
export interface UsageReport {
  licenseKeyHash: string;
  periodDays: number;
  totalCommands: number;
  totalAgents: number;
  totalPipelines: number;
  dailyReports: DailyUsage[];
}

// Export singleton
export const usageTracker = UsageTracker.getInstance();

// Export convenience functions
export async function trackCommand(
  licenseKey: string,
  command: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await UsageTracker.getInstance().trackCommand(licenseKey, command, metadata);
}

export async function trackAgentCall(
  licenseKey: string,
  agentName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await UsageTracker.getInstance().trackAgentCall(licenseKey, agentName, metadata);
}

export async function trackPipelineRun(
  licenseKey: string,
  pipelineType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await UsageTracker.getInstance().trackPipelineRun(licenseKey, pipelineType, metadata);
}
