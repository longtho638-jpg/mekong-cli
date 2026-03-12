/**
 * Execution Feedback Loop — learn from success/failure patterns.
 * ROI: Operational ROI — auto-optimize task routing based on historical performance.
 */
import { readFile, appendFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ExecutionRecord, LearnedPattern } from './types.js';

export class ExecutionFeedback {
  private readonly recordsPath: string;
  private readonly patternsPath: string;

  constructor(dataDir: string) {
    this.recordsPath = `${dataDir}/executions.jsonl`;
    this.patternsPath = `${dataDir}/patterns.json`;
  }

  /** Record task execution — append to JSONL log */
  async record(execution: ExecutionRecord): Promise<void> {
    await mkdir(dirname(this.recordsPath), { recursive: true });
    await appendFile(this.recordsPath, JSON.stringify(execution) + '\n');
  }

  /** Load all execution records from JSONL */
  async loadRecords(): Promise<ExecutionRecord[]> {
    try {
      const content = await readFile(this.recordsPath, 'utf-8');
      return content.trim().split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as ExecutionRecord);
    } catch {
      return [];
    }
  }

  /** Analyze execution history to find patterns */
  async analyzePatterns(minOccurrences: number): Promise<LearnedPattern[]> {
    const records = await this.loadRecords();
    if (records.length < minOccurrences) return [];

    const patterns: LearnedPattern[] = [];
    const byType = this.groupBy(records, r => r.taskType);
    const now = new Date().toISOString();

    for (const [taskType, typeRecords] of Object.entries(byType)) {
      if (typeRecords.length < minOccurrences) continue;

      // Success pattern: which agent+model combo works best
      const successRecs = typeRecords.filter(r => r.result === 'success');
      if (successRecs.length >= minOccurrences) {
        const bestAgent = this.mode(successRecs.map(r => r.agentName));
        patterns.push({
          id: `sp-${taskType}`,
          type: 'success_pattern',
          description: `${taskType}: agent "${bestAgent}" succeeds ${successRecs.length}/${typeRecords.length} times`,
          frequency: successRecs.length,
          confidence: successRecs.length / typeRecords.length,
          source: taskType,
          actionable: true,
          action: `Route ${taskType} tasks to ${bestAgent}`,
          createdAt: now,
          lastSeen: typeRecords[typeRecords.length - 1].timestamp,
        });
      }

      // Failure pattern: common error types
      const failRecs = typeRecords.filter(r => r.result === 'failure' && r.errorType);
      if (failRecs.length >= minOccurrences) {
        const topError = this.mode(failRecs.map(r => r.errorType!));
        patterns.push({
          id: `fp-${taskType}`,
          type: 'failure_pattern',
          description: `${taskType}: "${topError}" causes ${failRecs.length} failures`,
          frequency: failRecs.length,
          confidence: failRecs.length / typeRecords.length,
          source: taskType,
          actionable: true,
          action: `Investigate ${topError} in ${taskType} tasks`,
          createdAt: now,
          lastSeen: failRecs[failRecs.length - 1].timestamp,
        });
      }
    }

    // Save patterns
    await mkdir(dirname(this.patternsPath), { recursive: true });
    await writeFile(this.patternsPath, JSON.stringify(patterns, null, 2));
    return patterns;
  }

  /** Get best approach for a task type based on history */
  async getBestApproach(taskType: string): Promise<{
    recommendedAgent: string;
    recommendedModel: string;
    estimatedDuration: number;
    estimatedCost: number;
    confidence: number;
  } | null> {
    const records = await this.loadRecords();
    const successes = records.filter(r => r.taskType === taskType && r.result === 'success');
    if (successes.length === 0) return null;

    const bestAgent = this.mode(successes.map(r => r.agentName));
    const agentRecords = successes.filter(r => r.agentName === bestAgent);
    const models = agentRecords.flatMap(r => r.llmCalls.map(c => c.model));
    const bestModel = models.length > 0 ? this.mode(models) : 'unknown';
    const avgDuration = this.avg(agentRecords.map(r => r.totalDuration));
    const avgCost = this.avg(agentRecords.map(r => r.totalCost));

    return {
      recommendedAgent: bestAgent,
      recommendedModel: bestModel,
      estimatedDuration: Math.round(avgDuration),
      estimatedCost: Number(avgCost.toFixed(4)),
      confidence: agentRecords.length / records.filter(r => r.taskType === taskType).length,
    };
  }

  private groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of arr) {
      const key = fn(item);
      (result[key] ??= []).push(item);
    }
    return result;
  }

  private mode(arr: string[]): string {
    const counts: Record<string, number> = {};
    for (const v of arr) counts[v] = (counts[v] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  }

  private avg(arr: number[]): number {
    return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
  }
}
