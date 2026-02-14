export type ActionType = 'AUTO_ALLOWED' | 'HUMAN_REQUIRED';
export type Domain = 'GROWTH' | 'OPS' | 'RISK' | 'SUPPORT';

export interface GuardrailRule {
  action: string;
  type: ActionType;
  domain: Domain;
  conditions?: string;
}

export const GUARDRAILS: GuardrailRule[] = [
  // Auto-allowed actions
  { action: 'content_drafting', type: 'AUTO_ALLOWED', domain: 'GROWTH' },
  { action: 'recommendations', type: 'AUTO_ALLOWED', domain: 'GROWTH' },
  { action: 'notifications', type: 'AUTO_ALLOWED', domain: 'OPS' },
  { action: 'faq_response', type: 'AUTO_ALLOWED', domain: 'SUPPORT' },

  // Human-required actions
  { action: 'order_cancellation', type: 'HUMAN_REQUIRED', domain: 'OPS' },
  { action: 'refund_approval', type: 'HUMAN_REQUIRED', domain: 'RISK' },
  { action: 'ban_user', type: 'HUMAN_REQUIRED', domain: 'RISK' },
  { action: 'publish_campaign', type: 'HUMAN_REQUIRED', domain: 'GROWTH' },
];

export interface AgentMonitor {
    rejectionRate: number;
    responseTime: number; // in seconds
    lastActive: Date;
}

export function checkGuardrails(monitor: AgentMonitor): string[] {
    const alerts: string[] = [];
    if (monitor.rejectionRate > 0.30) {
        alerts.push('ALERT: Rejection rate > 30%. Human intervention required.');
    }
    if (monitor.responseTime > 5) {
        alerts.push('WARNING: High response time detected (> 5s).');
    }
    return alerts;
}
