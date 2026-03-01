/**
 * Churn Prevention Analyzer — assess churn risk and recommend actions
 *
 * Evaluates multiple signals (login activity, usage trends, support tickets,
 * payment failures) to produce risk score and actionable recommendations.
 */

// ─── Types ──────────────────────────────────────────────────────

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical';

export interface ChurnSignals {
  daysSinceLastLogin: number;
  usageDeclinePercent: number;
  supportTickets: number;
  failedPayments: number;
}

export interface ChurnAssessment {
  risk: ChurnRisk;
  score: number;
  actions: string[];
}

// ─── Analyzer Factory ───────────────────────────────────────────

export function createChurnAnalyzer() {
  return {
    /**
     * Đánh giá risk churn dựa trên signals
     */
    assessRisk(signals: ChurnSignals): ChurnAssessment {
      let score = 0;
      const actions: string[] = [];

      if (signals.daysSinceLastLogin > 30) { score += 30; actions.push('Gửi re-engagement email'); }
      else if (signals.daysSinceLastLogin > 14) { score += 15; actions.push('Gửi usage tips email'); }

      if (signals.usageDeclinePercent > 50) { score += 25; actions.push('Offer personalized onboarding'); }
      else if (signals.usageDeclinePercent > 25) { score += 10; actions.push('Share feature highlights'); }

      if (signals.supportTickets > 3) { score += 20; actions.push('Escalate to customer success'); }
      if (signals.failedPayments > 0) { score += 25; actions.push('Update payment method reminder'); }

      let risk: ChurnRisk = 'low';
      if (score >= 70) risk = 'critical';
      else if (score >= 50) risk = 'high';
      else if (score >= 25) risk = 'medium';

      return { risk, score, actions };
    },
  };
}
