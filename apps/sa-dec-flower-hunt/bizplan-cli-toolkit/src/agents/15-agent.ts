/**
 * Skill 15: AARRR & Lean Analytics
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class AAARRAnalyticsAgent extends BaseAgent {
  skillId = '15';
  name = 'AARRR & Lean Analytics';
  dependencies = ['05', '06', '14'];
  description = 'Define AARRR framework metrics, analytics dashboard, and growth measurement';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Setting up AARRR metrics...');

    const aaarrFramework = {
      acquisition: {
        definition: 'How users discover and visit',
        key_metrics: ['Traffic sources', 'Visitor count', 'CAC by channel', 'Click-through rates'],
        targets: this.markSuggestion('X visitors/month, CAC < $Y')
      },
      activation: {
        definition: 'First great experience, aha moment',
        key_metrics: ['Signup rate', 'Onboarding completion', 'Time to first value', 'Activation rate'],
        targets: this.markSuggestion('Z% visitor-to-signup, A% complete onboarding')
      },
      retention: {
        definition: 'Users come back repeatedly',
        key_metrics: ['D1/D7/D30 retention', 'Churn rate', 'DAU/MAU ratio', 'Feature usage'],
        targets: this.markSuggestion('B% D30 retention, <C% monthly churn')
      },
      revenue: {
        definition: 'Monetization and unit economics',
        key_metrics: ['MRR/ARR', 'ARPU', 'LTV', 'Conversion to paid', 'Expansion revenue'],
        targets: this.markSuggestion('LTV/CAC > 3x, MRR growth D% MoM')
      },
      referral: {
        definition: 'Users recommend to others',
        key_metrics: ['K-factor (viral coefficient)', 'Referral rate', 'NPS', 'Invite-to-signup conversion'],
        targets: this.markSuggestion('E% of users refer, K-factor > 0.5')
      }
    };

    const dashboardStructure = {
      north_star_metric: this.markSuggestion('Weekly active users (WAU) or MRR, depending on business model'),
      daily_metrics: ['Active users', 'Signups', 'Revenue', 'Churn'],
      weekly_review: ['AARRR funnel', 'Cohort analysis', 'Channel performance'],
      monthly_deep_dive: ['Unit economics trends', 'LTV/CAC by segment', 'Feature adoption']
    };

    const analyticsTools = {
      product_analytics: this.markSuggestion('Mixpanel, Amplitude, or Heap'),
      web_analytics: 'Google Analytics 4',
      attribution: this.markSuggestion('Segment for data collection'),
      visualization: 'Metabase, Looker, or custom dashboards'
    };

    return this.createOutput({
      aarrr_framework: aaarrFramework,
      dashboard_structure: dashboardStructure,
      analytics_tools: analyticsTools,
      cohort_analysis: this.markSuggestion('Track retention, revenue, LTV by signup cohort (weekly/monthly)'),
      experimentation: this.markSuggestion('A/B test framework, statistical significance, iteration speed')
    }, {
      dependenciesUsed: ['05', '06', '14'],
      dataQuality: 'high'
    });
  }
}
