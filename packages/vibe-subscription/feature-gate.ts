/**
 * Vibe Subscription SDK — Feature Gate (Pure Logic)
 *
 * Provider-agnostic feature access control based on plan hierarchy.
 * No database dependency — works with any data source.
 */

import type { FeatureGateConfig } from './types';

/**
 * Check if a plan slug has access to a specific feature.
 * Pure function — no side effects, no async, no DB calls.
 */
export function canAccessFeature(
  planSlug: string | null,
  feature: string,
  config: FeatureGateConfig,
): boolean {
  if (!planSlug) return false;

  const userPlanIndex = config.planHierarchy.indexOf(planSlug);
  if (userPlanIndex === -1) return false;

  const requiredPlan = config.featureMinPlan[feature] ?? config.defaultMinPlan ?? config.planHierarchy[config.planHierarchy.length - 1];
  const requiredIndex = config.planHierarchy.indexOf(requiredPlan);

  return userPlanIndex >= requiredIndex;
}

/**
 * Get all features accessible by a given plan slug.
 */
export function getAccessibleFeatures(
  planSlug: string,
  config: FeatureGateConfig,
): string[] {
  return Object.keys(config.featureMinPlan).filter(
    (feature) => canAccessFeature(planSlug, feature, config),
  );
}

/**
 * Get the minimum plan required for a feature.
 * Returns null if feature is not defined in config.
 */
export function getMinPlanForFeature(
  feature: string,
  config: FeatureGateConfig,
): string | null {
  return config.featureMinPlan[feature] ?? null;
}
