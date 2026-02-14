/**
 * Skill 17: Risk Management & Scenario Planning
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class RiskScenarioAgent extends BaseAgent {
  skillId = '17';
  name = 'Risk & Scenario Planning';
  dependencies = ['01', '05'];
  description = 'Identify risks, create mitigation plans, and model best/worst case scenarios';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Analyzing risks and scenarios...');

    const riskCategory = {
      market_risks: [
        {
          risk: 'Market downturn / recession',
          likelihood: 'Medium',
          impact: 'High',
          mitigation: this.markSuggestion('Diversify revenue streams, maintain 12-18 month runway, focus on retention'),
          contingency: this.markSuggestion('Cut CAC spend, extend runway, pivot to profitability')
        },
        {
          risk: 'Competitor launches similar product',
          likelihood: 'High',
          impact: 'Medium',
          mitigation: this.markSuggestion('Build moat via network effects, switching costs, brand'),
          contingency: this.markSuggestion('Accelerate product roadmap, aggressive pricing')
        },
        {
          risk: 'Customer demand lower than expected',
          likelihood: 'Medium',
          impact: 'Critical',
          mitigation: this.markSuggestion('Validate PMF early, iterate fast, maintain flexibility'),
          contingency: this.markSuggestion('Pivot to adjacent market, reduce burn')
        }
      ],
      operational_risks: [
        {
          risk: 'Key employee departure',
          likelihood: 'Medium',
          impact: 'High',
          mitigation: this.markSuggestion('Vesting schedules, documentation, cross-training'),
          contingency: this.markSuggestion('Succession plan, retain recruiters on retainer')
        },
        {
          risk: 'Technology failure / security breach',
          likelihood: 'Low',
          impact: 'Critical',
          mitigation: this.markSuggestion('Backups, monitoring, security audits, insurance'),
          contingency: this.markSuggestion('Incident response plan, PR crisis management')
        }
      ],
      financial_risks: [
        {
          risk: 'Fundraising falls through',
          likelihood: 'Medium',
          impact: 'Critical',
          mitigation: this.markSuggestion('Multiple investor conversations, bridge financing ready'),
          contingency: this.markSuggestion('Revenue-based financing, cost cuts, extend runway')
        },
        {
          risk: 'Burn rate exceeds projections',
          likelihood: 'Medium-High',
          impact: 'High',
          mitigation: this.markSuggestion('Monthly budget reviews, alerts at 80% budget'),
          contingency: this.markSuggestion('Hiring freeze, contractor conversion, reduce perks')
        }
      ],
      regulatory_risks: [
        {
          risk: 'New regulations increase compliance cost',
          likelihood: 'Low-Medium',
          impact: 'Medium',
          mitigation: this.markSuggestion('Monitor regulatory landscape, engage legal counsel'),
          contingency: this.markSuggestion('Pass costs to customers, lobby via industry groups')
        }
      ]
    };

    // Scenario Planning
    const scenarios = {
      base_case: {
        assumptions: [
          'Revenue grows 3-4x annually',
          'Churn stays below 5% monthly',
          'Fundraising on schedule',
          'Team scales as planned'
        ],
        outcomes: {
          year_1: this.markAssumption('$1M ARR, 50 customers, team of 20'),
          year_2: this.markAssumption('$3-4M ARR, 200 customers, team of 50'),
          year_3: this.markAssumption('$10-15M ARR, 500+ customers, Series B, team of 100')
        },
        probability: '50%'
      },
      best_case: {
        assumptions: [
          'Viral growth, revenue 5-10x annually',
          'Major enterprise deals close',
          'Low churn (<2%)',
          'Strong investor interest'
        ],
        outcomes: {
          year_1: this.markAssumption('$2M ARR, 100 customers'),
          year_2: this.markAssumption('$10M ARR, 500 customers'),
          year_3: this.markAssumption('$50M+ ARR, unicorn path, acquisition interest')
        },
        probability: '20%'
      },
      worst_case: {
        assumptions: [
          'Slow growth, 1-2x annually',
          'High churn (>10%)',
          'Fundraising delayed',
          'Key hire challenges'
        ],
        outcomes: {
          year_1: this.markAssumption('$500K ARR, 30 customers'),
          year_2: this.markAssumption('$1M ARR, struggling to scale'),
          year_3: this.markAssumption('Pivot or wind down')
        },
        probability: '30%',
        triggers: ['6 months of flat growth', 'Runway < 6 months', 'Founder conflict'],
        actions: this.markSuggestion('Pivot, layoffs, merge with competitor, graceful shutdown')
      }
    };

    return this.createOutput({
      risk_register: riskCategory,
      scenario_planning: scenarios,
      risk_management_plan: {
        review_frequency: 'Quarterly board review, monthly exec team',
        risk_owner: 'CFO or COO',
        escalation: 'Critical risks to board within 24 hours',
        insurance: this.markSuggestion('D&O, E&O, Cyber, Key person life insurance')
      }
    }, {
      dependenciesUsed: ['01', '05'],
      dataQuality: 'high'
    });
  }
}
