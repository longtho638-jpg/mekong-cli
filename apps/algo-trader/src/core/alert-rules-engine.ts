/**
 * Alert rules engine: evaluates threshold-based alert rules against trading metrics.
 * Supports cooldown tracking to prevent alert spam.
 */

import { z } from 'zod';

export const ALERT_METRICS = ['drawdown_pct', 'daily_loss_usd', 'open_positions', 'win_rate', 'var_pct', 'max_correlation'] as const;
export type AlertMetric = typeof ALERT_METRICS[number];

export const ALERT_OPERATORS = ['gt', 'lt', 'gte', 'lte'] as const;
export type AlertOperator = typeof ALERT_OPERATORS[number];

export const ALERT_ACTIONS = ['log', 'webhook', 'ws_broadcast'] as const;
export type AlertAction = typeof ALERT_ACTIONS[number];

export const AlertRuleSchema = z.object({
  id: z.string().min(1),
  metric: z.enum(ALERT_METRICS),
  operator: z.enum(ALERT_OPERATORS),
  threshold: z.number().finite(),
  action: z.enum(ALERT_ACTIONS),
  cooldownMs: z.number().int().nonnegative(),
});

export type AlertRule = z.infer<typeof AlertRuleSchema>;

export interface AlertResult {
  ruleId: string;
  metric: AlertMetric;
  value: number;
  threshold: number;
  action: AlertAction;
  triggered: boolean;
}

function compare(operator: AlertOperator, value: number, threshold: number): boolean {
  switch (operator) {
    case 'gt':  return value >  threshold;
    case 'lt':  return value <  threshold;
    case 'gte': return value >= threshold;
    case 'lte': return value <= threshold;
  }
}

/**
 * Evaluate a set of alert rules against a metrics snapshot.
 * Mutates cooldownMap in place — callers should reuse the same Map across calls.
 *
 * @param rules       Validated AlertRule array
 * @param metrics     Current metric values keyed by AlertMetric name
 * @param cooldownMap Tracks last-triggered timestamp per ruleId (pass `new Map()` on first call)
 * @returns           AlertResult for every rule (triggered or not)
 */
export function evaluate(
  rules: AlertRule[],
  metrics: Partial<Record<AlertMetric, number>>,
  cooldownMap: Map<string, number>,
): AlertResult[] {
  const now = Date.now();

  return rules.map((rule): AlertResult => {
    const value = metrics[rule.metric] ?? 0;
    const conditionMet = compare(rule.operator, value, rule.threshold);

    const lastTriggered = cooldownMap.get(rule.id) ?? 0;
    const inCooldown = conditionMet && now - lastTriggered < rule.cooldownMs;
    const triggered = conditionMet && !inCooldown;

    if (triggered) {
      cooldownMap.set(rule.id, now);
    }

    return {
      ruleId: rule.id,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      action: rule.action,
      triggered,
    };
  });
}
