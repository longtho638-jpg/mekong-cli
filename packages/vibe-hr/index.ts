/**
 * @agencyos/vibe-hr — HR & People Ops Facade SDK
 *
 * Employee management, leave tracking, payroll helpers, performance reviews.
 *
 * Usage:
 *   import { createLeaveTracker, createPayrollCalculator, createPerformanceEngine } from '@agencyos/vibe-hr';
 */

// ─── Types ──────────────────────────────────────────────────────

export type LeaveType = 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'remote' | 'compensatory';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason: string;
  approvedBy?: string;
}

export interface LeaveBalance {
  type: LeaveType;
  total: number;
  used: number;
  remaining: number;
}

// ─── Leave Tracker ──────────────────────────────────────────────

export interface LeavePolicy {
  annualDays: number;
  sickDays: number;
  maternityDays: number;
  paternityDays: number;
  carryOverMax: number;
}

export function createLeaveTracker(policy: LeavePolicy) {
  return {
    /**
     * Tinh so ngay nghi (tru weekend)
     */
    calculateBusinessDays(startDate: string, endDate: string): number {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) count++;
        current.setDate(current.getDate() + 1);
      }
      return count;
    },

    /**
     * Tinh leave balance
     */
    calculateBalance(type: LeaveType, usedDays: number): LeaveBalance {
      const totals: Record<LeaveType, number> = {
        annual: policy.annualDays,
        sick: policy.sickDays,
        maternity: policy.maternityDays,
        paternity: policy.paternityDays,
        unpaid: 365,
        remote: 52,
        compensatory: 0,
      };
      const total = totals[type] ?? 0;
      return { type, total, used: usedDays, remaining: Math.max(0, total - usedDays) };
    },

    /**
     * Check co du ngay nghi de request khong
     */
    canRequest(balance: LeaveBalance, requestedDays: number): { allowed: boolean; reason?: string } {
      if (requestedDays <= 0) return { allowed: false, reason: 'So ngay phai lon hon 0' };
      if (requestedDays > balance.remaining) return { allowed: false, reason: `Chi con ${balance.remaining} ngay` };
      return { allowed: true };
    },

    /**
     * Tinh carry over sang nam moi
     */
    calculateCarryOver(remainingDays: number): number {
      return Math.min(remainingDays, policy.carryOverMax);
    },
  };
}

// ─── Payroll Calculator ─────────────────────────────────────────

export interface PayrollConfig {
  currency: string;
  socialInsuranceRate: number;
  healthInsuranceRate: number;
  unemploymentInsuranceRate: number;
  personalDeduction: number;
  dependentDeduction: number;
}

export function createPayrollCalculator(config: PayrollConfig) {
  const { socialInsuranceRate, healthInsuranceRate, unemploymentInsuranceRate, personalDeduction, dependentDeduction } = config;

  return {
    /**
     * Tinh gross to net (Vietnam tax brackets)
     */
    calculateNetSalary(grossSalary: number, dependents: number = 0): {
      gross: number; insurance: number; taxableIncome: number; tax: number; net: number;
    } {
      const insurance = Math.round(grossSalary * (socialInsuranceRate + healthInsuranceRate + unemploymentInsuranceRate));
      const deductions = personalDeduction + (dependents * dependentDeduction);
      const taxableIncome = Math.max(0, grossSalary - insurance - deductions);
      const tax = this.calculatePIT(taxableIncome);
      const net = grossSalary - insurance - tax;
      return { gross: grossSalary, insurance, taxableIncome, tax, net };
    },

    /**
     * Tinh thue TNCN theo bac (Vietnam progressive tax)
     */
    calculatePIT(taxableIncome: number): number {
      const brackets = [
        { limit: 5_000_000, rate: 0.05 },
        { limit: 10_000_000, rate: 0.10 },
        { limit: 18_000_000, rate: 0.15 },
        { limit: 32_000_000, rate: 0.20 },
        { limit: 52_000_000, rate: 0.25 },
        { limit: 80_000_000, rate: 0.30 },
        { limit: Infinity, rate: 0.35 },
      ];

      let remaining = taxableIncome;
      let tax = 0;
      let prevLimit = 0;

      for (const bracket of brackets) {
        const bracketAmount = Math.min(remaining, bracket.limit - prevLimit);
        if (bracketAmount <= 0) break;
        tax += bracketAmount * bracket.rate;
        remaining -= bracketAmount;
        prevLimit = bracket.limit;
      }

      return Math.round(tax);
    },
  };
}

// ─── Performance Engine ─────────────────────────────────────────

export type RatingScale = 1 | 2 | 3 | 4 | 5;

export interface PerformanceReview {
  employeeId: string;
  reviewerId: string;
  period: string;
  ratings: { category: string; score: RatingScale; comment: string }[];
  overallScore: number;
  strengths: string[];
  improvements: string[];
}

export function createPerformanceEngine() {
  return {
    /**
     * Tinh overall score tu ratings
     */
    calculateOverallScore(ratings: { score: RatingScale; weight?: number }[]): number {
      const totalWeight = ratings.reduce((sum, r) => sum + (r.weight ?? 1), 0);
      const weightedSum = ratings.reduce((sum, r) => sum + r.score * (r.weight ?? 1), 0);
      return Math.round((weightedSum / totalWeight) * 100) / 100;
    },

    /**
     * Xep hang performance level
     */
    getPerformanceLevel(score: number): { level: string; color: string } {
      if (score >= 4.5) return { level: 'Xuat sac', color: 'green' };
      if (score >= 3.5) return { level: 'Tot', color: 'blue' };
      if (score >= 2.5) return { level: 'Dat yeu cau', color: 'yellow' };
      if (score >= 1.5) return { level: 'Can cai thien', color: 'orange' };
      return { level: 'Khong dat', color: 'red' };
    },

    /**
     * Goi y tang luong dua tren performance
     */
    suggestSalaryAdjustment(score: number, currentSalary: number): { percent: number; newSalary: number } {
      const adjustments: Record<string, number> = {
        '5': 0.15, '4': 0.10, '3': 0.05, '2': 0, '1': -0.05,
      };
      const percent = adjustments[Math.round(score).toString()] ?? 0;
      return { percent, newSalary: Math.round(currentSalary * (1 + percent)) };
    },
  };
}
