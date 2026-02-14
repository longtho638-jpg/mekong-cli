/**
 * Skill 14: GTM Experiments & Bullseye Framework
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class GTMExperimentsAgent extends BaseAgent {
  skillId = '14';
  name = 'GTM Experiments & Bullseye Framework';
  dependencies = ['05', '06'];
  description = 'Apply Bullseye framework to identify and test optimal GTM channels';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Designing GTM experiments...');

    const { business_model_type, target_market } = input;
    const customerPsych = this.getContext('06', input);

    // Bullseye Framework: Outer → Middle → Inner rings
    const bullseye = {
      outer_ring_channels: [
        { channel: 'TV/Radio Ads', fit_score: 'Low', why: this.markAssumption('Too expensive for early stage') },
        { channel: 'Billboard', fit_score: 'Low', why: this.markAssumption('Poor targeting') },
        { channel: 'Cold calling', fit_score: 'Low-Med', why: this.markSuggestion('Low conversion for B2C') },
        { channel: 'Trade shows', fit_score: 'Medium', why: this.markSuggestion('Good for B2B, expensive') }
      ],
      middle_ring_channels: [
        { channel: 'SEO/Content Marketing', fit_score: 'High', why: this.markSuggestion('Long-term, scalable, low CAC') },
        { channel: 'Facebook/Instagram Ads', fit_score: 'High', why: this.markFromPlan('VN market heavily uses social') },
        { channel: 'Influencer partnerships', fit_score: 'Med-High', why: this.markSuggestion('Trust-building, authentic') },
        { channel: 'Email marketing', fit_score: 'Medium', why: this.markSuggestion('Nurture existing leads') },
        { channel: 'Referral program', fit_score: 'High', why: this.markSuggestion('Viral loop, low CAC') }
      ],
      inner_ring_channels: [
        { channel: 'Facebook Ads', fit_score: 'Very High', why: this.markFromPlan('Primary acquisition channel for VN B2C') },
        { channel: 'SEO + Content', fit_score: 'Very High', why: this.markSuggestion('Sustainable, compounds over time') },
        { channel: 'Referral/WOM', fit_score: 'Very High', why: this.markSuggestion('Best LTV/CAC, viral potential') }
      ]
    };

    // Experiment Design for Top 3 Channels
    const experiments = [
      {
        experiment_id: 'EXP_01',
        channel: 'Facebook/Instagram Ads',
        hypothesis: this.markSuggestion('Targeted ads to urban 25-40 demo will yield CAC < $10 with 2% CTR'),
        test_design: {
          budget: this.markAssumption('$500-1000 for MVP test'),
          duration: '2 weeks',
          target_audience: 'Urban professionals, interest-based targeting',
          creative_variants: '3-5 ad variations (image, video, carousel)',
          landing_page: 'Dedicated LP with clear CTA',
          metrics_to_track: ['Impressions', 'CTR', 'CPC', 'Conversion rate', 'CAC', 'ROAS']
        },
        success_criteria: this.markSuggestion('CAC < target, ROAS > 2x, conversion rate > 1.5%'),
        next_steps_if_success: this.markSuggestion('Scale budget 3-5x, optimize winning creatives'),
        next_steps_if_fail: this.markSuggestion('Test different targeting/creative, or pivot to channel #2')
      },
      {
        experiment_id: 'EXP_02',
        channel: 'SEO + Content Marketing',
        hypothesis: this.markSuggestion('Ranking for long-tail keywords will drive organic traffic at $0 CAC in 3-6 months'),
        test_design: {
          budget: this.markAssumption('$0 (organic) + content creation time/cost'),
          duration: '3 months',
          content_plan: '2-3 blog posts/week targeting buyer intent keywords',
          seo_tactics: 'On-page optimization, backlink building, technical SEO',
          metrics_to_track: ['Keyword rankings', 'Organic traffic', 'Bounce rate', 'Time on page', 'Conversions from organic']
        },
        success_criteria: this.markSuggestion('Top 10 rankings for 10+ keywords, 500+ organic visitors/month'),
        next_steps_if_success: this.markSuggestion('Double content output, expand keyword targets'),
        next_steps_if_fail: this.markAssumption('Reassess keyword difficulty, improve content quality')
      },
      {
        experiment_id: 'EXP_03',
        channel: 'Referral Program',
        hypothesis: this.markSuggestion('20% of customers will refer friends with right incentive, K-factor > 0.5'),
        test_design: {
          budget: this.markAssumption('Referral incentives (discount/credit)'),
          duration: '1 month',
          incentive_structure: 'Referrer gets 10% off, referee gets 15% off first order',
          promotion: 'In-app prompt, email campaign, post-purchase thank you',
          metrics_to_track: ['Referral rate', 'K-factor', 'Viral cycle time', 'Referral CAC']
        },
        success_criteria: this.markSuggestion('K-factor > 0.3, referral CAC < 50% of paid CAC'),
        next_steps_if_success: this.markSuggestion('Increase incentive, add gamification'),
        next_steps_if_fail: this.markAssumption('Test different incentive structure or timing')
      }
    ];

    // GTM Roadmap
    const roadmap = {
      month_1_2: {
        focus: 'Test top 3 channels (Facebook Ads, SEO, Referral)',
        activities: ['Launch experiments', 'Collect data', 'Initial optimization'],
        budget_allocation: this.markAssumption('70% Facebook, 20% Content, 10% Referral setup')
      },
      month_3_4: {
        focus: 'Double down on winners, test 2 more channels from middle ring',
        activities: ['Scale winning channels', 'Test influencer partnerships', 'Email nurture sequence'],
        budget_allocation: this.markAssumption('Based on Month 1-2 ROAS')
      },
      month_5_6: {
        focus: 'Optimize + diversify channel mix',
        activities: ['Multi-channel attribution', 'Retargeting campaigns', 'Community building'],
        budget_allocation: 'Balanced portfolio based on LTV/CAC'
      }
    };

    return this.createOutput({
      bullseye_framework: bullseye,
      prioritized_experiments: experiments,
      gtm_roadmap: roadmap,
      channel_mix_strategy: {
        paid_vs_organic: this.markSuggestion('60% paid (fast growth), 40% organic (sustainable)'),
        short_term_vs_long_term: this.markSuggestion('Front-load paid for traction, build organic flywheel'),
        diversification_principle: this.markAssumption('Don\'t rely on single channel - aim for 3+ proven channels')
      },
      key_metrics_dashboard: {
        acquisition_metrics: ['Traffic by channel', 'CAC by channel', 'Conversion rate'],
        engagement_metrics: ['Time on site', 'Pages per session', 'Bounce rate'],
        retention_metrics: ['Repeat purchase rate', 'Cohort retention', 'Churn rate'],
        financial_metrics: ['ROAS', 'LTV/CAC ratio', 'Payback period']
      }
    }, {
      dependenciesUsed: ['05', '06'],
      dataQuality: 'high'
    });
  }
}
