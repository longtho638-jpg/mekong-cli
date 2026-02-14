/**
 * Skill 05: Business Model Patterns & Unit Economics
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class BusinessModelAgent extends BaseAgent {
  skillId = '05';
  name = 'Business Model Patterns & Unit Economics';
  dependencies: string[] = ['01'];
  description = 'Identify business model patterns and define unit economics framework';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Analyzing business model...');

    const { idea_or_plan_excerpt, segment_hint, stage_hint } = input;

    // Business Model Archetype
    const archetype = {
      primary_archetype_code: this.markSuggestion(segment_hint || 'B2C_Ecommerce'),
      secondary_archetype_code: this.markSuggestion('Marketplace'),
      why_these_archetypes: this.markFromPlan('Based on product/service description and customer type'),
      similar_reference_models_hint: this.markSuggestion('Shopee (VN), Lazada, Tokopedia (SEA)')
    };

    // Revenue Logic Map
    const revenueStreams = [
      {
        revenue_stream_id: 'RS_01',
        payer_type: this.markFromPlan('End customers (B2C)'),
        revenue_mechanism: this.markSuggestion('Transaction fee / Take rate'),
        pricing_logic: this.markSuggestion('% of GMV (5-15%)'),
        frequency: 'Per transaction',
        key_drivers_notes: this.markAssumption('GMV growth, conversion rate, avg order value')
      },
      {
        revenue_stream_id: 'RS_02',
        payer_type: this.markSuggestion('Sellers/suppliers'),
        revenue_mechanism: this.markSuggestion('Listing/subscription fees'),
        pricing_logic: this.markSuggestion('Monthly/annual subscription tiers'),
        frequency: 'Recurring',
        key_drivers_notes: this.markAssumption('Seller acquisition, retention')
      }
    ];

    // Unit Economics Framework
    const unitEconomics = {
      core_metric_set: {
        ARPU: this.markAssumption('[TODO: Average Revenue Per User - need transaction data]'),
        LTV: this.markAssumption('[TODO: Customer Lifetime Value - need cohort analysis]'),
        CAC: this.markAssumption('[TODO: Customer Acquisition Cost - need marketing spend data]'),
        Payback_Period: this.markAssumption('[Calculated from LTV/CAC - typically 6-18 months for B2C]'),
        Gross_Margin: this.markFromPlan('Depends on take rate model - typically 20-40% for marketplaces')
      },
      key_drivers: [
        { driver: 'Transaction volume', impact: 'Direct on revenue', lever: 'Increase supply & demand' },
        { driver: 'Take rate %', impact: 'Direct on margin', lever: 'Balance competitive vs profitable' },
        { driver: 'Retention rate', impact: 'Multiplier on LTV', lever: 'Improve product/service quality' },
        { driver: 'CAC', impact: 'Inverse on profitability', lever: 'Optimize marketing channels, viral loops' }
      ],
      unit_economic_viability: this.markSuggestion('Viable if LTV/CAC > 3x and payback < 12 months')
    };

    // Business Model Canvas (simplified)
    const canvas = {
      value_propositions: this.markFromPlan('Extracted from plan'),
      customer_segments: this.markFromPlan('Target customers'),
      channels: this.markSuggestion('Online platform, Mobile app, Social media'),
      revenue_streams: revenueStreams.map(r => r.revenue_mechanism).join(', '),
      key_resources: this.markSuggestion('Technology platform, Supplier network, Brand'),
      key_activities: this.markSuggestion('Platform ops, Supplier onboarding, Marketing'),
      key_partnerships: this.markSuggestion('Payment providers, Logistics partners, Suppliers'),
      cost_structure: this.markAssumption('Tech infrastructure, Marketing, Operations, Support')
    };

    return this.createOutput({
      business_model_archetype: archetype,
      revenue_logic_map: revenueStreams,
      unit_economics_frame: unitEconomics,
      business_model_canvas: canvas,
      agentic_opportunities: {
        pricing_optimization: this.markSuggestion('AI agent for dynamic pricing based on demand'),
        demand_forecasting: this.markSuggestion('Predictive analytics for inventory'),
        customer_segmentation: this.markSuggestion('ML for personalized recommendations')
      }
    }, {
      markings: {
        fromPlan: ['Business description', 'Customer type'],
        suggestions: ['Revenue model', 'Unit economics framework', 'Benchmarks'],
        assumptions: ['Specific metrics need real data', 'Archetype based on description']
      },
      dependenciesUsed: ['01'],
      dataQuality: 'medium' // Medium until we have real numbers
    });
  }
}
