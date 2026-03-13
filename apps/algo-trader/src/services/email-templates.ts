/**
 * Email Templates Service
 *
 * Email template functions for ROIaaS automated notifications:
 * - Trial expiry reminders (Day 3, 7, 14)
 * - Usage milestone congratulations (80%, 100%)
 * - Upgrade prompts (tier limit reached)
 * - Weekly digest (Pro users)
 *
 * All templates use consistent branding and formatting.
 */

import { LicenseTier } from '../lib/raas-gate';

/**
 * Email template types
 */
export type EmailTemplateType =
  | 'trial_expiry_reminder'
  | 'usage_milestone'
  | 'upgrade_prompt'
  | 'weekly_digest';

/**
 * Trial expiry reminder data
 */
export interface TrialExpiryData {
  tenantId: string;
  tenantName: string;
  userEmail: string;
  trialEndsAt: Date;
  daysRemaining: number;
  tier: LicenseTier;
}

/**
 * Usage milestone data
 */
export interface UsageMilestoneData {
  tenantId: string;
  tenantName: string;
  userEmail: string;
  tier: LicenseTier;
  resourceType: 'trades' | 'signals' | 'api_calls';
  percentUsed: number;
  currentUsage: number;
  dailyLimit: number | 'Unlimited';
  isExceeded: boolean;
}

/**
 * Upgrade prompt data
 */
export interface UpgradePromptData {
  tenantId: string;
  tenantName: string;
  userEmail: string;
  currentTier: LicenseTier;
  suggestedTier: LicenseTier;
  exceededResources: string[];
  upgradeUrl: string;
}

/**
 * Weekly digest data
 */
export interface WeeklyDigestData {
  tenantId: string;
  tenantName: string;
  userEmail: string;
  tier: LicenseTier;
  weekStart: Date;
  weekEnd: Date;
  totalTrades: number;
  totalSignals: number;
  totalApiCalls: number;
  successRate: number;
  totalPnl?: number;
  topPerformer?: string;
}

/**
 * Compiled email template
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Get trial expiry reminder template
 */
export function getTrialExpiryTemplate(data: TrialExpiryData): EmailTemplate {
  const { tenantName, daysRemaining, trialEndsAt, tier } = data;
  const upgradeUrl = '/pricing';
  const supportUrl = '/support';

  const urgencyColor = daysRemaining <= 3 ? '#dc2626' : daysRemaining <= 7 ? '#f59e0b' : '#2563eb';
  const urgencyText = daysRemaining <= 3 ? 'URGENT' : daysRemaining <= 7 ? 'IMPORTANT' : 'REMINDER';

  return {
    subject: `${urgencyText}: Trial Expires in ${daysRemaining} Days`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .urgency-badge { display: inline-block; background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .countdown { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .countdown-number { font-size: 48px; font-weight: bold; color: ${urgencyColor}; }
    .countdown-label { color: #6b7280; font-size: 14px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .tier-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 ROIaaS Trial Notification</h1>
    </div>
    <div class="content">
      <p><span class="urgency-badge">${urgencyText}</span></p>
      <p>Dear ${tenantName},</p>
      <p>Your ROIaaS trial period is coming to an end. You have been using the <strong>${tier}</strong> tier.</p>

      <div class="countdown">
        <div class="countdown-number">${daysRemaining}</div>
        <div class="countdown-label">DAYS REMAINING</div>
        <div style="margin-top: 10px; color: #6b7280;">Trial ends on ${trialEndsAt.toLocaleDateString()}</div>
      </div>

      <div class="tier-info">
        <strong>💡 Pro Tip:</strong> Upgrade now to continue enjoying uninterrupted access to all trading features, real-time analytics, and priority support.
      </div>

      <p style="text-align: center;">
        <a href="${upgradeUrl}" class="cta-button">Upgrade Now</a>
      </p>

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Questions? Our team is here to help. <a href="${supportUrl}">Contact Support</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
${urgencyText}: Trial Expires in ${daysRemaining} Days

Dear ${tenantName},

Your ROIaaS trial period is coming to an end. You have been using the ${tier} tier.

DAYS REMAINING: ${daysRemaining}
Trial ends on: ${trialEndsAt.toLocaleDateString()}

Pro Tip: Upgrade now to continue enjoying uninterrupted access to all trading features, real-time analytics, and priority support.

Upgrade Now: ${upgradeUrl}

Questions? Contact Support: ${supportUrl}

---
© ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.
    `.trim(),
  };
}

/**
 * Get usage milestone template
 */
export function getUsageMilestoneTemplate(data: UsageMilestoneData): EmailTemplate {
  const { tenantName, percentUsed, resourceType, currentUsage, dailyLimit, isExceeded, tier } = data;
  const dashboardUrl = '/dashboard/usage';
  const upgradeUrl = '/pricing';

  const milestoneType = percentUsed === 100 ? 'LIMIT_REACHED' : 'MILESTONE';
  const emoji = percentUsed === 100 ? '⚠️' : '📊';
  const toneColor = percentUsed === 100 ? '#dc2626' : '#059669';

  const resourceLabels = {
    trades: 'Trade Executions',
    signals: 'Signal Consumptions',
    api_calls: 'API Calls',
  };

  const resourceLabel = resourceLabels[resourceType];

  return {
    subject: `${emoji} Usage Alert: ${isExceeded ? 'Limit Reached' : `${percentUsed}% of Daily Limit Used`}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${toneColor} 0%, #0891b2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .progress-container { background: #f3f4f6; border-radius: 9999px; height: 24px; overflow: hidden; margin: 20px 0; }
    .progress-bar { background: ${toneColor}; height: 100%; border-radius: 9999px; transition: width 0.3s; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: ${toneColor}; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .cta-button.secondary { background: #f3f4f6; color: #374151; }
    .alert-box { background: ${percentUsed === 100 ? '#fef2f2' : '#ecfdf5'}; border-left: 4px solid ${toneColor}; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} ${milestoneType === 'LIMIT_REACHED' ? 'Daily Limit Reached' : 'Usage Milestone'}</h1>
    </div>
    <div class="content">
      <p>Dear ${tenantName},</p>

      <div class="alert-box">
        <strong>${isExceeded ? 'You have reached your daily limit' : `You've used ${percentUsed}% of your daily limit`}</strong> for ${resourceLabel} on the <strong>${tier}</strong> tier.
      </div>

      <div class="progress-container">
        <div class="progress-bar" style="width: ${Math.min(percentUsed, 100)}%"></div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${currentUsage}</div>
          <div class="stat-label">Used</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${dailyLimit}</div>
          <div class="stat-label">Daily Limit</div>
        </div>
      </div>

      ${isExceeded ? `
        <div class="alert-box" style="background: #fef2f2; border-color: #dc2626;">
          <strong>⚠️ Action Required:</strong> Your ${resourceType} access is now limited until the daily reset (midnight UTC). Consider upgrading to Pro for unlimited access.
        </div>
      ` : `
        <div class="alert-box" style="background: #ecfdf5; border-color: #059669;">
          <strong>💡 Tip:</strong> Monitor your usage to avoid interruptions. You have ${dailyLimit === 'Unlimited' ? 'unlimited' : dailyLimit - currentUsage} ${resourceType} remaining today.
        </div>
      `}

      <p style="text-align: center; margin-top: 25px;">
        <a href="${dashboardUrl}" class="cta-button">View Dashboard</a>
        ${isExceeded ? `<a href="${upgradeUrl}" class="cta-button">Upgrade Plan</a>` : ''}
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
${emoji} ${milestoneType === 'LIMIT_REACHED' ? 'Daily Limit Reached' : `${percentUsed}% of Daily Limit Used`}

Dear ${tenantName},

${isExceeded ? 'You have reached your daily limit' : `You've used ${percentUsed}% of your daily limit`} for ${resourceLabel} on the ${tier} tier.

Usage Statistics:
- Used: ${currentUsage}
- Daily Limit: ${dailyLimit}
- Remaining: ${dailyLimit === 'Unlimited' ? 'Unlimited' : dailyLimit - currentUsage}

${isExceeded ? `
⚠️ Action Required: Your ${resourceType} access is now limited until the daily reset (midnight UTC). Consider upgrading to Pro for unlimited access.

Upgrade Plan: ${upgradeUrl}
` : `
💡 Tip: Monitor your usage to avoid interruptions. You have ${dailyLimit === 'Unlimited' ? 'unlimited' : dailyLimit - currentUsage} ${resourceType} remaining today.
`}

View Dashboard: ${dashboardUrl}

---
© ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.
    `.trim(),
  };
}

/**
 * Get upgrade prompt template
 */
export function getUpgradePromptTemplate(data: UpgradePromptData): EmailTemplate {
  const { tenantName, currentTier, suggestedTier, exceededResources, upgradeUrl } = data;

  const tierBenefits: Record<LicenseTier, string[]> = {
    [LicenseTier.FREE]: ['5 trades/day', '3 signals/day', '100 API calls/day'],
    [LicenseTier.PRO]: ['Unlimited trades', 'Unlimited signals', '10,000 API calls/day', 'Priority support', 'Advanced analytics'],
    [LicenseTier.ENTERPRISE]: ['Everything in Pro', '100,000 API calls/day', 'Custom strategies', 'Dedicated support', 'SLA guarantee'],
  };

  const currentBenefits = tierBenefits[currentTier];
  const suggestedBenefits = tierBenefits[suggestedTier];

  return {
    subject: `🚀 Upgrade to ${suggestedTier} - Unlock Unlimited Trading`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .limit-alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .limit-alert h3 { color: #dc2626; margin: 0 0 10px 0; }
    .resource-list { list-style: none; padding: 0; margin: 15px 0; }
    .resource-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .resource-list li:before { content: '⛔ '; }
    .comparison-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .comparison-table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; }
    .comparison-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .comparison-table .check { color: #059669; }
    .comparison-table .cross { color: #dc2626; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 15px 0; }
    .benefit-list { list-style: none; padding: 0; margin: 20px 0; }
    .benefit-list li { padding: 8px 0; }
    .benefit-list li:before { content: '✅ '; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Time to Level Up!</h1>
    </div>
    <div class="content">
      <p>Dear ${tenantName},</p>

      <div class="limit-alert">
        <h3>⚠️ You've Hit Your ${currentTier} Tier Limits</h3>
        <p>Your trading activity has exceeded the following ${currentTier} tier limits:</p>
        <ul class="resource-list">
          ${exceededResources.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <p style="margin-bottom: 0;">Don't let limits hold you back. Upgrade to <strong>${suggestedTier}</strong> for unlimited access!</p>
      </div>

      <h3 style="text-align: center; margin-top: 30px;">Why Upgrade to ${suggestedTier}?</h3>
      <ul class="benefit-list">
        ${suggestedBenefits.map(b => `<li>${b}</li>`).join('')}
      </ul>

      <table class="comparison-table">
        <tr>
          <th>Feature</th>
          <th>${currentTier}</th>
          <th>${suggestedTier}</th>
        </tr>
        <tr>
          <td>Trades per Day</td>
          <td>${currentBenefits[0]}</td>
          <td class="check">${suggestedBenefits[0]}</td>
        </tr>
        <tr>
          <td>Signals per Day</td>
          <td>${currentBenefits[1]}</td>
          <td class="check">${suggestedBenefits[1]}</td>
        </tr>
        <tr>
          <td>API Calls per Day</td>
          <td>${currentBenefits[2]}</td>
          <td class="check">${suggestedBenefits[2]}</td>
        </tr>
        ${suggestedTier !== LicenseTier.PRO ? `
        <tr>
          <td>Priority Support</td>
          <td class="cross">❌</td>
          <td class="check">✅</td>
        </tr>
        <tr>
          <td>Custom Strategies</td>
          <td class="cross">❌</td>
          <td class="check">✅</td>
        </tr>
        ` : ''}
      </table>

      <p style="text-align: center;">
        <a href="${upgradeUrl}" class="cta-button">Upgrade to ${suggestedTier} Now</a>
      </p>

      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 15px;">
        💚 30-day money-back guarantee. No questions asked.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
🚀 Time to Level Up!

Dear ${tenantName},

⚠️ You've Hit Your ${currentTier} Tier Limits

Your trading activity has exceeded the following ${currentTier} tier limits:
${exceededResources.map(r => `- ${r}`).join('\n')}

Don't let limits hold you back. Upgrade to ${suggestedTier} for unlimited access!

Why Upgrade to ${suggestedTier}?
${suggestedBenefits.map(b => `✅ ${b}`).join('\n')}

Upgrade to ${suggestedTier} Now: ${upgradeUrl}

💚 30-day money-back guarantee. No questions asked.

---
© ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.
    `.trim(),
  };
}

/**
 * Get weekly digest template
 */
export function getWeeklyDigestTemplate(data: WeeklyDigestData): EmailTemplate {
  const { tenantName, tier, weekStart, weekEnd, totalTrades, totalSignals, totalApiCalls, successRate, totalPnl, topPerformer } = data;

  const pnlColor = totalPnl && totalPnl >= 0 ? '#059669' : '#dc2626';
  const pnlEmoji = totalPnl && totalPnl >= 0 ? '📈' : '📉';

  return {
    subject: `📊 Your Weekly Trading Digest (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
    .stat-card { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 20px; border-radius: 12px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }
    .pnl-card { background: linear-gradient(135deg, ${pnlColor} 0%, #0891b2 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
    .pnl-value { font-size: 36px; font-weight: bold; }
    .pnl-label { opacity: 0.9; margin-top: 5px; }
    .metric-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: #6b7280; }
    .metric-value { font-weight: 600; }
    .pro-tip { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .tier-badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; border-top: 1px solid #e5e7eb; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .cta-button.secondary { background: #f3f4f6; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Trading Digest</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}
      </p>
    </div>
    <div class="content">
      <p>Dear ${tenantName},</p>
      <p>Here's your weekly trading summary. You're on the <span class="tier-badge">${tier}</span> tier.</p>

      ${totalPnl !== undefined ? `
      <div class="pnl-card">
        <div class="pnl-value">${pnlEmoji} $${totalPnl.toFixed(2)}</div>
        <div class="pnl-label">Total P&L This Week</div>
      </div>
      ` : ''}

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalTrades}</div>
          <div class="stat-label">Trades Executed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalSignals}</div>
          <div class="stat-label">Signals Consumed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalApiCalls}</div>
          <div class="stat-label">API Calls Made</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${successRate.toFixed(1)}%</div>
          <div class="stat-label">Success Rate</div>
        </div>
      </div>

      <h3 style="margin-top: 30px;">📈 Performance Metrics</h3>
      <div class="metric-row">
        <span class="metric-label">Win Rate</span>
        <span class="metric-value">${successRate.toFixed(1)}%</span>
      </div>
      ${topPerformer ? `
      <div class="metric-row">
        <span class="metric-label">Top Performer</span>
        <span class="metric-value">${topPerformer}</span>
      </div>
      ` : ''}
      <div class="metric-row">
        <span class="metric-label">Average Trades/Day</span>
        <span class="metric-value">${(totalTrades / 7).toFixed(1)}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">API Usage</span>
        <span class="metric-value">${totalApiCalls} calls</span>
      </div>

      <div class="pro-tip">
        <strong>💡 Pro Tip:</strong> ${successRate >= 70 ? "Great job! Consider scaling up your position sizes with Pro tier unlimited trades." : successRate >= 50 ? "Keep refining your strategy. Pro tier gives you access to advanced analytics." : "Consider backtesting your strategy more before live trading. Our Pro tier includes advanced backtesting tools."}
      </div>

      <p style="text-align: center; margin-top: 25px;">
        <a href="/dashboard" class="cta-button">View Full Dashboard</a>
        <a href="/analytics" class="cta-button secondary">Detailed Analytics</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.</p>
      <p style="margin-top: 10px;">
        <a href="/settings/notifications" style="color: #6b7280;">Manage Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
📊 Weekly Trading Digest
${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}

Dear ${tenantName},

Here's your weekly trading summary. You're on the ${tier} tier.

${totalPnl !== undefined ? `
${pnlEmoji} Total P&L This Week: $${totalPnl.toFixed(2)}
` : ''}
TRADING ACTIVITY:
- Trades Executed: ${totalTrades}
- Signals Consumed: ${totalSignals}
- API Calls Made: ${totalApiCalls}
- Success Rate: ${successRate.toFixed(1)}%

PERFORMANCE METRICS:
- Win Rate: ${successRate.toFixed(1)}%
${topPerformer ? `- Top Performer: ${topPerformer}` : ''}
- Average Trades/Day: ${(totalTrades / 7).toFixed(1)}
- API Usage: ${totalApiCalls} calls

💡 Pro Tip: ${successRate >= 70 ? "Great job! Consider scaling up your position sizes with Pro tier unlimited trades." : successRate >= 50 ? "Keep refining your strategy. Pro tier gives you access to advanced analytics." : "Consider backtesting your strategy more before live trading. Our Pro tier includes advanced backtesting tools."}

View Full Dashboard: /dashboard
Detailed Analytics: /analytics

---
© ${new Date().getFullYear()} ROIaaS by AgencyOS. All rights reserved.
Manage Email Preferences: /settings/notifications
    `.trim(),
  };
}

/**
 * Get email template by type
 */
export function getEmailTemplate(
  type: EmailTemplateType,
  data: TrialExpiryData | UsageMilestoneData | UpgradePromptData | WeeklyDigestData
): EmailTemplate {
  switch (type) {
    case 'trial_expiry_reminder':
      return getTrialExpiryTemplate(data as TrialExpiryData);
    case 'usage_milestone':
      return getUsageMilestoneTemplate(data as UsageMilestoneData);
    case 'upgrade_prompt':
      return getUpgradePromptTemplate(data as UpgradePromptData);
    case 'weekly_digest':
      return getWeeklyDigestTemplate(data as WeeklyDigestData);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}
