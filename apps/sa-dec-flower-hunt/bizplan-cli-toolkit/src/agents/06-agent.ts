/**
 * Skill 06: Customer Psychology & Personas
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class CustomerPsychologyAgent extends BaseAgent {
  skillId = '06';
  name = 'Customer Psychology & Personas';
  dependencies = ['05'];
  description = 'Deep customer analysis with psychographic segmentation, Reiss motivations, and detailed personas';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Analyzing customer psychology...');

    const { idea_or_plan_excerpt, market_context_hint, b2b_or_b2c } = input;
    const businessModel = this.getContext('05', input);

    // Psychographic Segmentation
    const segments = [
      {
        segment_id: 'SEG_01',
        segment_name: this.markSuggestion('Convenience Seekers'),
        demographics: this.markAssumption('Urban, 25-40, middle-income+'),
        psychographics: {
          lifestyle: 'Busy professionals, time-poor',
          values: 'Efficiency, quality, trust',
          behaviors: 'Online shoppers, mobile-first, price-sensitive but value-driven'
        },
        pain_points: [
          this.markFromPlan('Limited time for shopping'),
          this.markSuggestion('Uncertainty about product quality/authenticity'),
          this.markAssumption('Difficulty finding specialized products locally')
        ],
        dream_state: this.markSuggestion('Easy, trustworthy shopping experience with quality guarantee')
      }
    ];

    // Reiss Motivation Map (16 desires)
    const reiss16 = {
      primary_motives: [
        { desire: 'Status', relevance: 'High', why: this.markSuggestion('Premium products signal success') },
        { desire: 'Independence', relevance: 'Medium', why: this.markSuggestion('Self-service platform enables autonomy') },
        { desire: 'Acceptance', relevance: 'Medium', why: this.markSuggestion('Social proof, reviews matter') }
      ],
      secondary_motives: [
        { desire: 'Order', relevance: 'Medium', why: this.markSuggestion('Structured, predictable experience') },
        { desire: 'Saving/Collecting', relevance: 'Low-Med', why: this.markAssumption('Repeat purchases, loyalty') }
      ]
    };

    // Detailed Personas (3-5)
    const personas = [
      {
        persona_id: 'P01',
        name: this.markSuggestion('Linh - Urban Professional'),
        tagline: '"I want quality without the hassle"',
        demographics: {
          age: '28-35',
          location: 'HCMC, Hanoi',
          occupation: 'Mid-level manager, tech/finance',
          income: '20-40M VND/month',
          family_status: 'Single or young family'
        },
        psychographics: {
          goals: ['Career advancement', 'Work-life balance', 'Quality lifestyle'],
          frustrations: ['Time scarcity', 'Trust issues with online shopping', 'Information overload'],
          motivations: ['Efficiency', 'Status', 'Quality assurance'],
          behaviors: ['Research before buying', 'Reads reviews', 'Prefers mobile apps']
        },
        jobs_to_be_done: {
          functional: this.markFromPlan('Buy [product] conveniently'),
          emotional: this.markSuggestion('Feel confident in purchase quality'),
          social: this.markSuggestion('Show good taste to friends/family')
        },
        journey_touchpoints: ['Social media discovery', 'Website research', 'Mobile app purchase', 'Delivery tracking', 'Post-purchase review'],
        reiss_profile: ['Status (High)', 'Independence (Med)', 'Order (Med)']
      },
      {
        persona_id: 'P02',
        name: this.markSuggestion('Mr. Tuấn - Family Decision Maker'),
        tagline: '"Best for my family"',
        demographics: {
          age: '35-50',
          location: 'Tier 1-2 cities',
          occupation: 'Business owner, senior professional',
          income: '40M+ VND/month',
          family_status: 'Married with children'
        },
        psychographics: {
          goals: ['Family wellbeing', 'Smart financial decisions', 'Time with family'],
          frustrations: ['Counterfeit products', 'Inconsistent quality', 'Complex processes'],
          motivations: ['Family (caring)', 'Power (decision-making)', 'Status'],
          behaviors: ['Value-driven (not just price)', 'Brand loyal once trust established', 'Seeks recommendations']
        },
        jobs_to_be_done: {
          functional: this.markFromPlan('Provide quality [products] for family'),
          emotional: this.markSuggestion('Feel like a good provider'),
          social: this.markSuggestion('Maintain family status')
        },
        journey_touchpoints: ['Word of mouth', 'Website comparison', 'Phone/chat inquiry', 'In-depth research', 'Repeat purchases'],
        reiss_profile: ['Familiy/Caring (Very High)', 'Status (High)', 'Power (Med)']
      }
    ];

    // Empathy Map (for primary persona)
    const empathyMap = {
      thinks_and_feels: [
        this.markSuggestion('"Is this authentic?"'),
        '"Will it arrive on time?"',
        '"What if it\'s not as described?"'
      ],
      sees: ['Ads on social media', 'Friends using similar services', 'Mixed reviews online'],
      says_and_does: ['Asks friends for recommendations', 'Compares prices and reviews', 'Hesitates before first purchase'],
      hears: ['Word of mouth about quality issues', 'Marketing claims', 'Customer testimonials'],
      pains: ['Risk of wasting money', 'Time spent researching', 'Trust uncertainty'],
      gains: ['Convenience', 'Time saved', 'Quality assurance', 'Social validation']
    };

    return this.createOutput({
      target_audience_summary: {
        who_they_are: this.markFromPlan(b2b_or_b2c || 'B2C' + ' customers'),
        where_they_are: this.markSuggestion(market_context_hint || 'VN urban centers'),
        what_they_want: this.markSuggestion('Quality, convenience, trust'),
        why_they_want_it: this.markSuggestion('Time-poor, value quality of life')
      },
      psychographic_segmentation: segments,
      reiss_motivation_map: reiss16,
      personas: personas,
      empathy_map: empathyMap,
      jobs_to_be_done_framework: {
        functional_jobs: personas.map(p => p.jobs_to_be_done.functional),
        emotional_jobs: personas.map(p => p.jobs_to_be_done.emotional),
        social_jobs: personas.map(p => p.jobs_to_be_done.social)
      },
      customer_journey_map: {
        stages: ['Awareness', 'Consideration', 'Purchase', 'Experience', 'Loyalty'],
        touchpoints_per_stage: this.markSuggestion('Mapped in personas'),
        pain_points_per_stage: this.markAssumption('To be validated with real customer interviews'),
        opportunities: this.markSuggestion('Improve trust signals, streamline checkout, post-purchase engagement')
      }
    }, {
      dependenciesUsed: ['05'],
      dataQuality: 'medium' // Need validation with real research
    });
  }
}
