/**
 * @agencyos/vibe-customer-success — Customer Success Engine SDK
 *
 * Health scoring, churn prediction, and expansion revenue identification
 * based on real CS metrics: NRR, health scores, QBR insights.
 *
 * Usage:
 *   import { createHealthScorer, createChurnPredictor, createExpansionEngine } from '@agencyos/vibe-customer-success';
 *   const scorer = createHealthScorer({ weights: { usage: 0.4, adoption: 0.3, support: 0.2, billing: 0.1 } });
 *   const predictor = createChurnPredictor();
 *   const expansion = createExpansionEngine();
 */

// ─── Core Types ─────────────────────────────────────────────────

export type RiskLevel = 'healthy' | 'neutral' | 'at_risk' | 'critical';
export type CustomerSegment = 'enterprise' | 'mid_market' | 'smb' | 'startup';
export type ChurnSignalType = 'usage_drop' | 'support_spike' | 'feature_abandonment' | 'billing_failure' | 'champion_departure' | 'login_frequency_drop' | 'dau_decline';
export type ExpansionType = 'upsell' | 'cross_sell' | 'seat_expansion' | 'usage_upgrade';

export interface HealthSignal {
  dimension: 'usage' | 'adoption' | 'support' | 'billing' | 'engagement';
  score: number; // 0–100
  trend: 'improving' | 'stable' | 'declining';
  label: string;
  updatedAt: string;
}

export interface HealthScore {
  customerId: string;
  composite: number; // 0–100 weighted
  riskLevel: RiskLevel;
  signals: HealthSignal[];
  calculatedAt: string;
  previousComposite: number | null;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ChurnSignal {
  type: ChurnSignalType;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
  detail: string;
  value: number; // raw metric value
  baseline: number; // expected baseline
}

export interface ChurnRisk {
  customerId: string;
  probability: number; // 0–1
  riskLevel: RiskLevel;
  signals: ChurnSignal[];
  recommendedInterventions: string[];
  predictedChurnDate: string | null;
}

export interface ExpansionOpportunity {
  customerId: string;
  type: ExpansionType;
  potentialARR: number;
  confidenceScore: number; // 0–1
  trigger: string; // what usage pattern drove this
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface HealthScorerConfig {
  weights: {
    usage: number;
    adoption: number;
    support: number;
    billing: number;
    engagement?: number;
  };
  riskThresholds?: {
    healthy: number;    // default 75
    neutral: number;    // default 50
    at_risk: number;    // default 30
  };
}

// ─── Health Scorer ───────────────────────────────────────────────

/**
 * Calculates composite health scores from multi-dimensional signals.
 * Weights should sum to 1.0.
 */
export function createHealthScorer(config: HealthScorerConfig) {
  const { weights, riskThresholds = { healthy: 75, neutral: 50, at_risk: 30 } } = config;

  // Normalize weights to sum to 1
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  const normalizedWeights = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, v / totalWeight])
  ) as typeof weights;

  return {
    /**
     * Calculate composite health score from signals array
     */
    calculate(customerId: string, signals: HealthSignal[], previousScore: number | null = null): HealthScore {
      const signalMap: Partial<Record<HealthSignal['dimension'], number>> = {};
      for (const sig of signals) signalMap[sig.dimension] = sig.score;

      const composite = Math.round(
        (signalMap.usage ?? 50) * (normalizedWeights.usage ?? 0) +
        (signalMap.adoption ?? 50) * (normalizedWeights.adoption ?? 0) +
        (signalMap.support ?? 50) * (normalizedWeights.support ?? 0) +
        (signalMap.billing ?? 50) * (normalizedWeights.billing ?? 0) +
        (signalMap.engagement ?? 50) * (normalizedWeights.engagement ?? 0)
      );

      const riskLevel: RiskLevel =
        composite >= riskThresholds.healthy ? 'healthy' :
        composite >= riskThresholds.neutral ? 'neutral' :
        composite >= riskThresholds.at_risk ? 'at_risk' : 'critical';

      const trend = previousScore === null ? 'stable' :
        composite > previousScore + 5 ? 'improving' :
        composite < previousScore - 5 ? 'declining' : 'stable';

      return { customerId, composite, riskLevel, signals, calculatedAt: new Date().toISOString(), previousComposite: previousScore, trend };
    },

    /**
     * Score a raw usage metric (0–100) from DAU/MAU ratio
     */
    scoreDauMauRatio(dauMauRatio: number): number {
      // Industry benchmark: >0.20 is healthy, >0.40 is strong
      if (dauMauRatio >= 0.4) return 100;
      if (dauMauRatio >= 0.2) return Math.round(50 + ((dauMauRatio - 0.2) / 0.2) * 50);
      return Math.round((dauMauRatio / 0.2) * 50);
    },

    /**
     * Score support health from ticket volume and CSAT
     */
    scoreSupportHealth(openTickets: number, csatScore: number, avgResolutionDays: number): number {
      const ticketPenalty = Math.min(40, openTickets * 5);
      const csatComponent = csatScore; // already 0–100
      const resolutionPenalty = Math.min(20, Math.max(0, (avgResolutionDays - 2) * 5));
      return Math.max(0, Math.round((csatComponent - ticketPenalty - resolutionPenalty)));
    },

    /**
     * Classify overall portfolio risk distribution
     */
    portfolioRiskSummary(scores: HealthScore[]): Record<RiskLevel, { count: number; percentARR: number }> {
      const summary: Record<RiskLevel, { count: number; percentARR: number }> = {
        healthy: { count: 0, percentARR: 0 },
        neutral: { count: 0, percentARR: 0 },
        at_risk: { count: 0, percentARR: 0 },
        critical: { count: 0, percentARR: 0 },
      };
      const total = scores.length || 1;
      for (const s of scores) summary[s.riskLevel].count++;
      for (const level of Object.keys(summary) as RiskLevel[]) {
        summary[level].percentARR = Math.round((summary[level].count / total) * 100);
      }
      return summary;
    },
  };
}

// ─── Churn Predictor ─────────────────────────────────────────────

/**
 * Analyzes behavioral signals to predict churn probability and recommend interventions.
 */
export function createChurnPredictor() {
  return {
    /**
     * Detect churn signals from usage and engagement data
     */
    detectSignals(data: {
      usageLast30d: number;
      usagePrev30d: number;
      loginFrequency: number;   // logins per week
      openSupportTickets: number;
      billingFailures: number;
      keyFeaturesUsed: number;  // out of available key features
      totalKeyFeatures: number;
      championActive: boolean;
    }): ChurnSignal[] {
      const signals: ChurnSignal[] = [];
      const now = new Date().toISOString();

      const usageChange = data.usagePrev30d > 0
        ? ((data.usageLast30d - data.usagePrev30d) / data.usagePrev30d) * 100 : 0;
      if (usageChange < -20) {
        signals.push({ type: 'usage_drop', severity: usageChange < -50 ? 'high' : 'medium', detectedAt: now, detail: `Usage dropped ${Math.abs(Math.round(usageChange))}% vs prior 30 days`, value: data.usageLast30d, baseline: data.usagePrev30d });
      }
      if (data.loginFrequency < 1) {
        signals.push({ type: 'login_frequency_drop', severity: data.loginFrequency < 0.25 ? 'high' : 'medium', detectedAt: now, detail: `Login frequency ${data.loginFrequency.toFixed(1)}x/week (threshold: 1x)`, value: data.loginFrequency, baseline: 1 });
      }
      if (data.openSupportTickets >= 3) {
        signals.push({ type: 'support_spike', severity: data.openSupportTickets >= 5 ? 'high' : 'medium', detectedAt: now, detail: `${data.openSupportTickets} open support tickets`, value: data.openSupportTickets, baseline: 1 });
      }
      if (data.billingFailures >= 1) {
        signals.push({ type: 'billing_failure', severity: data.billingFailures >= 2 ? 'high' : 'medium', detectedAt: now, detail: `${data.billingFailures} billing failure(s) in current cycle`, value: data.billingFailures, baseline: 0 });
      }
      if (data.totalKeyFeatures > 0 && (data.keyFeaturesUsed / data.totalKeyFeatures) < 0.3) {
        signals.push({ type: 'feature_abandonment', severity: 'medium', detectedAt: now, detail: `Only ${data.keyFeaturesUsed}/${data.totalKeyFeatures} key features in use`, value: data.keyFeaturesUsed, baseline: data.totalKeyFeatures });
      }
      if (!data.championActive) {
        signals.push({ type: 'champion_departure', severity: 'high', detectedAt: now, detail: 'Primary champion/admin has gone inactive', value: 0, baseline: 1 });
      }
      return signals;
    },

    /**
     * Calculate churn probability from signals (logistic-regression inspired weights)
     */
    predict(customerId: string, signals: ChurnSignal[], daysUntilRenewal: number): ChurnRisk {
      const severityScore: Record<string, number> = { low: 0.05, medium: 0.15, high: 0.30 };
      const rawScore = signals.reduce((s, sig) => s + (severityScore[sig.severity] ?? 0), 0);
      const renewalUrgency = daysUntilRenewal <= 30 ? 1.3 : daysUntilRenewal <= 90 ? 1.1 : 1.0;
      const probability = Math.min(0.95, rawScore * renewalUrgency);

      const riskLevel: RiskLevel = probability >= 0.6 ? 'critical' : probability >= 0.35 ? 'at_risk' : probability >= 0.15 ? 'neutral' : 'healthy';

      const interventions = this.recommendInterventions(signals, daysUntilRenewal);
      const predictedChurnDate = probability >= 0.35 && daysUntilRenewal > 0
        ? new Date(Date.now() + daysUntilRenewal * 86400000).toISOString().slice(0, 10) : null;

      return { customerId, probability: Math.round(probability * 100) / 100, riskLevel, signals, recommendedInterventions: interventions, predictedChurnDate };
    },

    /**
     * Map signals to actionable CS interventions
     */
    recommendInterventions(signals: ChurnSignal[], daysUntilRenewal: number): string[] {
      const interventions: string[] = [];
      const types = new Set(signals.map(s => s.type));
      if (types.has('usage_drop') || types.has('login_frequency_drop')) interventions.push('Schedule executive business review (EBR) to re-establish value');
      if (types.has('feature_abandonment')) interventions.push('Offer personalized onboarding session for underutilized features');
      if (types.has('support_spike')) interventions.push('Escalate open tickets to senior support; assign dedicated CSM');
      if (types.has('billing_failure')) interventions.push('Proactively contact billing contact to update payment method');
      if (types.has('champion_departure')) interventions.push('Map new internal champion; schedule stakeholder intro call');
      if (daysUntilRenewal <= 60 && signals.some(s => s.severity === 'high')) interventions.push('Prepare retention offer: multi-year discount or feature unlock');
      return interventions;
    },
  };
}

// ─── Expansion Engine ────────────────────────────────────────────

/**
 * Identifies upsell and cross-sell opportunities from usage patterns.
 * Calculates NRR contribution and generates QBR talking points.
 */
export function createExpansionEngine() {
  return {
    /**
     * Identify expansion opportunities from usage and account data
     */
    identifyOpportunities(data: {
      customerId: string;
      currentARR: number;
      currentPlan: string;
      seatCount: number;
      seatLimit: number;
      apiCallsLast30d: number;
      apiCallsLimit: number;
      featuresRequestedNotAvailable: string[];
      teamGrowthPercent: number; // YoY headcount growth
    }): ExpansionOpportunity[] {
      const opps: ExpansionOpportunity[] = [];

      // Seat expansion — >80% seat utilization
      const seatUtil = data.seatCount / data.seatLimit;
      if (seatUtil >= 0.8) {
        const additionalSeats = Math.ceil(data.seatCount * 0.25); // assume 25% growth
        opps.push({
          customerId: data.customerId,
          type: 'seat_expansion',
          potentialARR: Math.round((data.currentARR / data.seatCount) * additionalSeats),
          confidenceScore: seatUtil >= 0.95 ? 0.85 : 0.65,
          trigger: `Seat utilization at ${Math.round(seatUtil * 100)}% (${data.seatCount}/${data.seatLimit})`,
          recommendedAction: `Propose ${additionalSeats}-seat expansion; offer volume discount`,
          urgency: seatUtil >= 0.95 ? 'high' : 'medium',
        });
      }

      // Usage upgrade — >75% API quota
      const apiUtil = data.apiCallsLast30d / data.apiCallsLimit;
      if (apiUtil >= 0.75) {
        opps.push({
          customerId: data.customerId,
          type: 'usage_upgrade',
          potentialARR: Math.round(data.currentARR * 0.3),
          confidenceScore: apiUtil >= 0.9 ? 0.80 : 0.55,
          trigger: `API usage at ${Math.round(apiUtil * 100)}% of limit`,
          recommendedAction: 'Present next-tier plan with higher API quota before customer hits ceiling',
          urgency: apiUtil >= 0.9 ? 'high' : 'medium',
        });
      }

      // Cross-sell — requested features in higher tier
      if (data.featuresRequestedNotAvailable.length >= 2) {
        opps.push({
          customerId: data.customerId,
          type: 'cross_sell',
          potentialARR: Math.round(data.currentARR * 0.5),
          confidenceScore: 0.6,
          trigger: `Customer requested ${data.featuresRequestedNotAvailable.length} features unavailable on current plan`,
          recommendedAction: `Demo ${data.featuresRequestedNotAvailable.slice(0, 2).join(', ')} on next tier in upcoming QBR`,
          urgency: 'medium',
        });
      }

      // Team growth upsell signal
      if (data.teamGrowthPercent >= 20) {
        opps.push({
          customerId: data.customerId,
          type: 'upsell',
          potentialARR: Math.round(data.currentARR * (data.teamGrowthPercent / 100)),
          confidenceScore: 0.5,
          trigger: `${Math.round(data.teamGrowthPercent)}% YoY headcount growth signals future seat demand`,
          recommendedAction: 'Include scalability and enterprise features in next touchpoint conversation',
          urgency: 'low',
        });
      }

      return opps.sort((a, b) => b.potentialARR - a.potentialARR);
    },

    /**
     * Calculate Net Revenue Retention from cohort data
     * NRR = (Starting ARR + Expansion - Contraction - Churn) / Starting ARR
     */
    calculateNRR(cohort: { startingARR: number; expansion: number; contraction: number; churn: number }): { nrr: number; label: string } {
      const nrr = Math.round(((cohort.startingARR + cohort.expansion - cohort.contraction - cohort.churn) / cohort.startingARR) * 100);
      const label = nrr >= 120 ? 'Best-in-class (120%+)' : nrr >= 110 ? 'Strong (110–120%)' : nrr >= 100 ? 'Healthy (100–110%)' : 'Below benchmark (<100%)';
      return { nrr, label };
    },

    /**
     * Generate QBR talking points from account data
     */
    generateQBRInsights(data: {
      customerId: string;
      roiMetrics: { metric: string; before: number; after: number; unit: string }[];
      topUsedFeatures: string[];
      expansionOpportunities: ExpansionOpportunity[];
      renewalDate: string;
    }): { section: string; points: string[] }[] {
      const insights: { section: string; points: string[] }[] = [];

      insights.push({
        section: 'Value Delivered',
        points: data.roiMetrics.map(m => {
          const change = m.after - m.before;
          const pct = m.before > 0 ? Math.round((change / m.before) * 100) : 0;
          return `${m.metric}: ${m.before}${m.unit} → ${m.after}${m.unit} (${pct > 0 ? '+' : ''}${pct}%)`;
        }),
      });

      insights.push({
        section: 'Most-Used Capabilities',
        points: data.topUsedFeatures.slice(0, 4).map(f => `Active usage: ${f}`),
      });

      if (data.expansionOpportunities.length > 0) {
        insights.push({
          section: 'Growth Opportunities',
          points: data.expansionOpportunities.slice(0, 3).map(o => `${o.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: +$${o.potentialARR.toLocaleString()} ARR potential — ${o.recommendedAction}`),
        });
      }

      const daysToRenewal = Math.round((new Date(data.renewalDate).getTime() - Date.now()) / 86400000);
      insights.push({
        section: 'Next Steps',
        points: [
          `Renewal in ${daysToRenewal} days — confirm budget holder involvement`,
          'Align on success criteria for next 12 months',
          ...(data.expansionOpportunities.some(o => o.urgency === 'high') ? ['Priority: address high-urgency expansion signals before renewal'] : []),
        ],
      });

      return insights;
    },
  };
}
