/**
 * @agencyos/vibe-longevity — Longevity Biotech Facade SDK
 *
 * Biomarker tracking, clinical trial management, protocol personalization.
 *
 * Usage:
 *   import { createBiomarkerTracker, createTrialManager, createProtocolEngine } from '@agencyos/vibe-longevity';
 */

// ─── Types ──────────────────────────────────────────────────────

export type BiomarkerCategory = 'blood' | 'epigenetic' | 'metabolomic' | 'proteomic' | 'genomic' | 'functional';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type TrialPhase = 'preclinical' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'approved';

export interface BiomarkerReading {
  id: string;
  markerId: string;
  name: string;
  category: BiomarkerCategory;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  recordedAt: string;
}

export interface Participant {
  id: string;
  age: number;
  biologicalAge?: number;
  consentDate: string;
  status: 'screening' | 'enrolled' | 'active' | 'completed' | 'withdrawn';
  biomarkers: BiomarkerReading[];
}

export interface LongevityProtocol {
  id: string;
  name: string;
  interventions: { type: string; dosage: string; frequency: string }[];
  targetBiomarkers: string[];
  durationWeeks: number;
}

// ─── Biomarker Tracker ──────────────────────────────────────────

export function createBiomarkerTracker() {
  return {
    /** Check giá trị nằm trong khoảng tham chiếu */
    isInRange(reading: BiomarkerReading): boolean {
      return reading.value >= reading.referenceMin && reading.value <= reading.referenceMax;
    },

    /** Phân tích trend từ chuỗi readings */
    analyzeTrend(readings: BiomarkerReading[]): TrendDirection {
      if (readings.length < 2) return 'stable';
      const sorted = [...readings].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      const first = sorted[0].value;
      const last = sorted[sorted.length - 1].value;
      const change = (last - first) / (Math.abs(first) || 1);
      if (change > 0.05) return 'improving';
      if (change < -0.05) return 'declining';
      return 'stable';
    },

    /** Tính biological age delta */
    calculateAgeDelta(chronologicalAge: number, biologicalAge: number): { delta: number; status: string } {
      const delta = chronologicalAge - biologicalAge;
      const status = delta > 2 ? 'younger_than_age' : delta < -2 ? 'older_than_age' : 'age_appropriate';
      return { delta, status };
    },

    /** Lọc biomarkers ngoài range */
    getOutOfRange(readings: BiomarkerReading[]): BiomarkerReading[] {
      return readings.filter(r => r.value < r.referenceMin || r.value > r.referenceMax);
    },
  };
}

// ─── Trial Manager ──────────────────────────────────────────────

export function createTrialManager() {
  return {
    /** Check participant eligibility */
    checkEligibility(participant: Participant, minAge: number, maxAge: number): { eligible: boolean; reason?: string } {
      if (participant.age < minAge) return { eligible: false, reason: `Tuổi ${participant.age} < min ${minAge}` };
      if (participant.age > maxAge) return { eligible: false, reason: `Tuổi ${participant.age} > max ${maxAge}` };
      if (participant.status === 'withdrawn') return { eligible: false, reason: 'Đã rút khỏi nghiên cứu' };
      return { eligible: true };
    },

    /** Tính enrollment rate */
    getEnrollmentRate(participants: Participant[]): { rate: number; enrolled: number; target: number } {
      const enrolled = participants.filter(p => ['enrolled', 'active', 'completed'].includes(p.status)).length;
      return { rate: participants.length === 0 ? 0 : Math.round((enrolled / participants.length) * 100), enrolled, target: participants.length };
    },

    /** Tính completion rate */
    getCompletionRate(participants: Participant[]): number {
      const relevant = participants.filter(p => p.status !== 'screening');
      if (relevant.length === 0) return 0;
      return Math.round((relevant.filter(p => p.status === 'completed').length / relevant.length) * 100);
    },
  };
}

// ─── Protocol Engine ────────────────────────────────────────────

export function createProtocolEngine() {
  return {
    /** Score protocol effectiveness dựa trên biomarker improvements */
    scoreEffectiveness(before: BiomarkerReading[], after: BiomarkerReading[]): { score: number; improved: number; total: number } {
      let improved = 0;
      for (const b of before) {
        const a = after.find(r => r.markerId === b.markerId);
        if (!a) continue;
        const bInRange = b.value >= b.referenceMin && b.value <= b.referenceMax;
        const aInRange = a.value >= a.referenceMin && a.value <= a.referenceMax;
        if (!bInRange && aInRange) improved++;
      }
      return { score: before.length === 0 ? 0 : Math.round((improved / before.length) * 100), improved, total: before.length };
    },

    /** Validate protocol có conflict interventions không */
    hasConflicts(protocol: LongevityProtocol, knownConflicts: [string, string][]): string[] {
      const types = protocol.interventions.map(i => i.type);
      const conflicts: string[] = [];
      for (const [a, b] of knownConflicts) {
        if (types.includes(a) && types.includes(b)) conflicts.push(`${a} conflicts with ${b}`);
      }
      return conflicts;
    },
  };
}
