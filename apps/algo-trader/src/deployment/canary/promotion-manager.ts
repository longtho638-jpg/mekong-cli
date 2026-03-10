/**
 * Promotion Manager - Handles canary promotion after successful evaluation.
 */
import { ComparisonResult } from './metrics-comparator';

export type PromotionStatus = 'evaluating' | 'promoted' | 'rolled_back' | 'pending';

export interface PromotionRecord {
  timestamp: number;
  status: PromotionStatus;
  evaluationStartTime: number;
  evaluationDuration: number;
  metricsSnapshot: ComparisonResult[];
}

export class PromotionManager {
  private status: PromotionStatus = 'pending';
  private evaluationStartTime: number | null = null;
  private records: PromotionRecord[] = [];
  private evaluationPeriodMs: number;

  constructor(evaluationPeriodHours: number) {
    this.evaluationPeriodMs = evaluationPeriodHours * 3600 * 1000;
  }

  startEvaluation(): void {
    this.status = 'evaluating';
    this.evaluationStartTime = Date.now();
  }

  /**
   * Check if promotion criteria met at currentTime.
   * Promotes if evaluation period has elapsed and no degradation.
   * Rolls back if degradation detected during evaluation.
   */
  checkPromotion(currentTime: number, comparisons: ComparisonResult[]): PromotionStatus {
    if (this.status !== 'evaluating' || this.evaluationStartTime === null) {
      return this.status;
    }

    const isDegraded = comparisons.some(r => r.degraded);
    if (isDegraded) {
      return this.forceRollback(comparisons).status;
    }

    const elapsed = currentTime - this.evaluationStartTime;
    if (elapsed >= this.evaluationPeriodMs) {
      return this.forcePromote().status;
    }

    return this.status;
  }

  forcePromote(): PromotionRecord {
    const startTime = this.evaluationStartTime ?? Date.now();
    const record: PromotionRecord = {
      timestamp: Date.now(),
      status: 'promoted',
      evaluationStartTime: startTime,
      evaluationDuration: Date.now() - startTime,
      metricsSnapshot: [],
    };
    this.status = 'promoted';
    this.records.push(record);
    return record;
  }

  forceRollback(comparisons: ComparisonResult[]): PromotionRecord {
    const startTime = this.evaluationStartTime ?? Date.now();
    const record: PromotionRecord = {
      timestamp: Date.now(),
      status: 'rolled_back',
      evaluationStartTime: startTime,
      evaluationDuration: Date.now() - startTime,
      metricsSnapshot: comparisons,
    };
    this.status = 'rolled_back';
    this.records.push(record);
    return record;
  }

  getStatus(): PromotionStatus {
    return this.status;
  }

  getRecords(): PromotionRecord[] {
    return this.records;
  }
}
