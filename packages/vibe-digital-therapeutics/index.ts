/**
 * @agencyos/vibe-digital-therapeutics — Digital Therapeutics Facade SDK
 *
 * Therapy session engine, wearable biosignal sync, outcome tracking, reimbursement claims.
 *
 * Usage:
 *   import { createSessionEngine, createOutcomeTracker, createWearableSync } from '@agencyos/vibe-digital-therapeutics';
 */

// ─── Types ──────────────────────────────────────────────────────

export type TherapyModality = 'cbt' | 'dbt' | 'act' | 'meditation' | 'exposure' | 'psychoeducation';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
export type ClaimStatus = 'draft' | 'submitted' | 'approved' | 'denied' | 'appealed';

export interface TherapySession {
  id: string;
  patientId: string;
  modality: TherapyModality;
  status: SessionStatus;
  scheduledAt: string;
  durationMinutes: number;
  completionPercent: number;
  notes?: string;
}

export interface OutcomeAssessment {
  id: string;
  patientId: string;
  instrument: 'PHQ9' | 'GAD7' | 'DASS21' | 'PCL5' | 'custom';
  score: number;
  maxScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  assessedAt: string;
}

export interface WearableReading {
  deviceId: string;
  timestamp: string;
  hrv: number;
  heartRate: number;
  sleepHours: number;
  steps: number;
  stressLevel: number;
}

// ─── Session Engine ─────────────────────────────────────────────

export function createSessionEngine() {
  return {
    /** Check adherence rate */
    getAdherenceRate(sessions: TherapySession[]): number {
      if (sessions.length === 0) return 0;
      const completed = sessions.filter(s => s.status === 'completed').length;
      return Math.round((completed / sessions.length) * 100);
    },

    /** Recommend next modality dựa trên completion patterns */
    recommendNextModality(sessions: TherapySession[]): TherapyModality {
      const completed = sessions.filter(s => s.status === 'completed');
      if (completed.length === 0) return 'psychoeducation';
      const modalityCounts: Record<string, number> = {};
      for (const s of completed) {
        modalityCounts[s.modality] = (modalityCounts[s.modality] || 0) + 1;
      }
      const progression: TherapyModality[] = ['psychoeducation', 'cbt', 'dbt', 'act', 'exposure', 'meditation'];
      for (const mod of progression) {
        if (!modalityCounts[mod] || modalityCounts[mod] < 3) return mod;
      }
      return 'cbt';
    },

    /** Tính streak — số sessions hoàn thành liên tiếp */
    getCurrentStreak(sessions: TherapySession[]): number {
      const sorted = [...sessions].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
      let streak = 0;
      for (const s of sorted) {
        if (s.status === 'completed') streak++;
        else break;
      }
      return streak;
    },
  };
}

// ─── Outcome Tracker ────────────────────────────────────────────

export function createOutcomeTracker() {
  return {
    /** Phân loại severity từ PHQ-9 score */
    classifyPHQ9(score: number): OutcomeAssessment['severity'] {
      if (score <= 4) return 'minimal';
      if (score <= 9) return 'mild';
      if (score <= 14) return 'moderate';
      return 'severe';
    },

    /** Phân loại severity từ GAD-7 score */
    classifyGAD7(score: number): OutcomeAssessment['severity'] {
      if (score <= 4) return 'minimal';
      if (score <= 9) return 'mild';
      if (score <= 14) return 'moderate';
      return 'severe';
    },

    /** Tính clinical improvement (reliable change index) */
    isReliableChange(baseline: number, current: number, reliableChangeThreshold: number = 5): boolean {
      return Math.abs(baseline - current) >= reliableChangeThreshold;
    },

    /** Track trend across assessments */
    assessTrend(assessments: OutcomeAssessment[]): 'improving' | 'stable' | 'worsening' {
      if (assessments.length < 2) return 'stable';
      const sorted = [...assessments].sort((a, b) => a.assessedAt.localeCompare(b.assessedAt));
      const first = sorted[0].score;
      const last = sorted[sorted.length - 1].score;
      const change = first - last; // Lower score = better for PHQ-9/GAD-7
      if (change > 2) return 'improving';
      if (change < -2) return 'worsening';
      return 'stable';
    },
  };
}

// ─── Wearable Sync ──────────────────────────────────────────────

export function createWearableSync() {
  return {
    /** Đánh giá stress level từ HRV */
    assessStressFromHRV(hrv: number): 'low' | 'moderate' | 'high' {
      if (hrv >= 50) return 'low';
      if (hrv >= 30) return 'moderate';
      return 'high';
    },

    /** Check sleep quality */
    assessSleepQuality(sleepHours: number): 'good' | 'fair' | 'poor' {
      if (sleepHours >= 7 && sleepHours <= 9) return 'good';
      if (sleepHours >= 5) return 'fair';
      return 'poor';
    },

    /** Tính wellness composite score (0-100) */
    calculateWellnessScore(reading: WearableReading): number {
      const hrvScore = Math.min(reading.hrv / 60, 1) * 30;
      const sleepScore = Math.min(reading.sleepHours / 8, 1) * 30;
      const activityScore = Math.min(reading.steps / 10000, 1) * 20;
      const stressScore = (1 - Math.min(reading.stressLevel / 100, 1)) * 20;
      return Math.round(hrvScore + sleepScore + activityScore + stressScore);
    },
  };
}
