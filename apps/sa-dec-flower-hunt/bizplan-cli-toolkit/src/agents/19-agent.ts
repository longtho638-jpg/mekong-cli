/**
 * Skill 19: Industry Patterns & Benchmarks
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class IndustryPatternsAgent extends BaseAgent {
  skillId = '19';
  name = 'Industry Patterns & Benchmarks';
  dependencies = ['05', '15'];
  description = 'Benchmark against industry standards, identify patterns, position relative to market';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Analyzing industry benchmarks...');

    const saasMetricsBenchmark = {
      revenue_growth: {
        seed: this.markAssumption('100-300% YoY'),
        series_a: '100-200% YoY',
        series_b: '80-150% YoY',
        target: this.markSuggestion('Aim for top quartile (>150% for Series A)')
      },
      gross_margin: {
        saas_standard: '70-85%',
        marketplace: '60-75%',
        hardware: '40-60%',
        target: this.markSuggestion('75%+ for pure SaaS')
      },
      ltv_cac_ratio: {
        minimum: '3:1',
        good: '4-5:1',
        excellent: '>5:1',
        target: this.markSuggestion('4:1 or better')
      },
      cac_payback: {
        saas_standard: '12-18 months',
        excellent: '<12 months',
        acceptable: '<24 months',
        target: this.markSuggestion('12 months')
      },
      net_dollar_retention: {
        minimum: '90%',
        good: '100-110%',
        excellent: '>120%',
        target: this.markSuggestion('105%+')
      },
      rule_of_40: {
        formula: 'Growth Rate + Profit Margin',
        benchmark: '>40 is strong',
        target: this.markAssumption('Prioritize growth early, 40+ by Series B')
      }
    };

    const competitivePositioning = {
      market_position: this.markSuggestion('Top 3 in [specific niche/geography]'),
      differentiation: [
        this.markFromPlan('Better UX/UI'),
        this.markSuggestion('SEA-optimized features'),
        this.markAssumption('Lower price point')
      ],
      competitive_advantages: [
        'First mover in Vietnam',
        'Local language support',
        'Integration with local platforms'
      ]
    };

    return this.createOutput({
      saas_metrics_benchmark: saasMetricsBenchmark,
      competitive_positioning: competitivePositioning,
      industry_patterns: {
        typical_valuation_multiples: this.markAssumption('SaaS: 5-15x ARR, Marketplace: 2-8x GMV'),
        funding_trajectory: 'Seed $500K-2M → A $3-10M → B $15-50M',
        time_to_series_b: '18-30 months from Series A'
      }
    }, {
      dataQuality: 'high'
    });
  }
}
