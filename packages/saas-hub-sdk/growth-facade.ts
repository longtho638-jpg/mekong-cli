/**
 * @agencyos/saas-hub-sdk — Product-Led Growth Facade
 *
 * PLG onboarding funnels, feature flag management, and growth metrics
 * for product-led SaaS acquisition and expansion.
 *
 * Usage:
 *   import { createGrowthEngine } from '@agencyos/saas-hub-sdk/growth';
 */

export interface OnboardingFunnel {
  funnelId: string;
  tenantId: string;
  userId: string;
  steps: Array<{
    stepId: string;
    name: string;
    description: string;
    isRequired: boolean;
    completedAt?: Date;
    skippedAt?: Date;
  }>;
  currentStepId: string;
  completionPercent: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'in-progress' | 'completed' | 'abandoned';
}

export interface FeatureFlag {
  flagId: string;
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  rules: Array<{
    ruleId: string;
    condition: 'plan' | 'tenant' | 'user' | 'percentage' | 'date';
    conditionValue: string;
    value: boolean;
  }>;
  rolloutPercent: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PLGMetrics {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  activationRate: number;
  timeToValueDays: number;
  featureAdoptionRate: Record<string, number>;
  expansionRevenue: number;
  churnRate: number;
  npsScore?: number;
  trialConversionRate: number;
  onboardingCompletionRate: number;
}

export interface GrowthEngine {
  getOnboardingFunnel(userId: string, tenantId: string): Promise<OnboardingFunnel>;
  completeOnboardingStep(funnelId: string, stepId: string): Promise<OnboardingFunnel>;
  skipOnboardingStep(funnelId: string, stepId: string): Promise<OnboardingFunnel>;
  evaluateFeatureFlag(flagKey: string, context: { tenantId: string; userId?: string; planId?: string }): Promise<boolean>;
  listFeatureFlags(): Promise<FeatureFlag[]>;
  createFeatureFlag(data: Omit<FeatureFlag, 'flagId' | 'createdAt' | 'updatedAt' | 'isArchived'>): Promise<FeatureFlag>;
  updateFeatureFlag(flagId: string, data: Partial<Pick<FeatureFlag, 'rules' | 'rolloutPercent' | 'defaultValue'>>): Promise<FeatureFlag>;
  getPLGMetrics(tenantId: string, periodStart: Date, periodEnd: Date): Promise<PLGMetrics>;
}

/**
 * Create a growth engine for PLG onboarding, feature flags, and growth analytics.
 * Implement with your SaaS growth backend.
 */
export function createGrowthEngine(): GrowthEngine {
  return {
    async getOnboardingFunnel(_userId, _tenantId) {
      throw new Error('Implement with your SaaS growth backend');
    },
    async completeOnboardingStep(_funnelId, _stepId) {
      throw new Error('Implement with your SaaS growth backend');
    },
    async skipOnboardingStep(_funnelId, _stepId) {
      throw new Error('Implement with your SaaS growth backend');
    },
    async evaluateFeatureFlag(_flagKey, _context) {
      throw new Error('Implement with your SaaS growth backend');
    },
    async listFeatureFlags() {
      throw new Error('Implement with your SaaS growth backend');
    },
    async createFeatureFlag(_data) {
      throw new Error('Implement with your SaaS growth backend');
    },
    async updateFeatureFlag(_flagId, _data) {
      throw new Error('Implement with your SaaS growth backend');
    },
    async getPLGMetrics(_tenantId, _periodStart, _periodEnd) {
      throw new Error('Implement with your SaaS growth backend');
    },
  };
}
