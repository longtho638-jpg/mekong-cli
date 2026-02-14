/**
 * Skill 16: Fundraising & VC Narrative
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class FundraisingAgent extends BaseAgent {
  skillId = '16';
  name = 'Fundraising & VC Narrative';
  dependencies = ['01', '05', '06', '07'];
  description = 'Create compelling fundraising narrative and pitch deck structure';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Crafting fundraising narrative...');

    const { fundraising_goal, stage, traction_data } = input;
    const brand = this.getContext('07', input);
    const businessModel = this.getContext('05', input);
    const customerPsych = this.getContext('06', input);

    // Investment Thesis
    const investmentThesis = {
      one_liner: this.markSuggestion('Leading [category] platform transforming [problem] in [market]'),
      market_opportunity: {
        market_size: this.markFromPlan('TAM/SAM/SOM from plan'),
        market_dynamics: this.markSuggestion('Growing at X% CAGR, driven by [trend 1, trend 2]'),
        timing: this.markSuggestion('Why now: [catalyst 1], [catalyst 2], [catalyst 3]')
      },
      unique_insight: this.markSuggestion('Conventional wisdom says X, but we\'ve discovered Y'),
      competitive_advantage: {
        moats: [
          this.markFromPlan('Network effects from marketplace'),
          this.markSuggestion('Proprietary data/tech'),
          this.markSuggestion('Brand + trust in regulated space')
        ],
        defensibility: this.markSuggestion('First-mover in niche, high switching costs')
      },
      team_unfair_advantage: this.markAssumption('[TODO: Highlight founder domain expertise, previous exits, etc]')
    };

    // Pitch Deck Structure (12-15 slides)
    const pitchDeck = {
      slides: [
        { slide: 1, title: 'Cover', content: 'Company name, tagline, contact' },
        { slide: 2, title: 'Problem', content: this.markFromPlan('Customer pain points from personas') },
        { slide: 3, title: 'Solution', content: this.markFromPlan('Product/service value prop') },
        { slide: 4, title: 'Why Now', content: this.markSuggestion('Market trends, catalysts, timing') },
        { slide: 5, title: 'Market Size', content: this.markFromPlan('TAM/SAM/SOM breakdown') },
        { slide: 6, title: 'Product Demo', content: this.markSuggestion('Screenshots, user flow, key features') },
        { slide: 7, title: 'Traction', content: this.markFromPlan(traction_data || '[TODO: GMV, users, MoM growth%]') },
        { slide: 8, title: 'Business Model', content: this.markFromPlan('Revenue streams, unit economics from Skill 05') },
        { slide: 9, title: 'GTM Strategy', content: this.markSuggestion('Channel mix, CAC/LTV from Skill 14') },
        { slide: 10, title: 'Competition', content: this.markSuggestion('Competitive matrix, differentiation') },
        { slide: 11, title: 'Team', content: this.markAssumption('[TODO: Founder bios, advisors, key hires]') },
        { slide: 12, title: 'Financials', content: this.markAssumption('3-year projection: Revenue, EBITDA, key metrics') },
        { slide: 13, title: 'The Ask', content: this.markFromPlan(`Raising ${fundraising_goal || '[amount]'} for [use of funds]`) },
        { slide: 14, title: 'Vision', content: this.markSuggestion('Where we\'ll be in 5 years, exit potential') }
      ]
    };

    // VC Narrative (Long-form)
    const vcNarrative = {
      hook: this.markSuggestion('Start with compelling anecdote or stark problem statistic'),
      story_arc: {
        act_1_problem: this.markFromPlan('Deep dive into customer pain and market gap'),
        act_2_solution: this.markFromPlan('How founders discovered solution, initial validation'),
        act_3_traction: this.markFromPlan('What we\'ve achieved, what\'s working, growth trajectory'),
        act_4_vision: this.markSuggestion('The future: category leadership, regional expansion, exit scenarios')
      },
      key_narratives_for_different_audiences: {
        financial_vcs: this.markSuggestion('Focus on unit economics, scalability, TAM, comps multiples'),
        strategic_vcs: this.markSuggestion('Emphasize market transformation, ecosystem play, platform network effects'),
        impact_investors: this.markSuggestion('Highlight social impact, ESG metrics, inclusive growth')
      }
    };

    // Term Sheet Expectations
    const termSheetGuidance = {
      typical_terms_for_stage: {
        seed: this.markSuggestion('$500K-2M, 10-20% dilution, SAFE or priced round'),
        series_a: this.markSuggestion('$3-10M, 20-30% dilution, priced round with standard terms'),
        series_b: this.markSuggestion('$10-30M, 15-25% dilution, growth metrics KPIs')
      },
      key_negotiation_points: [
        { term: 'Valuation', guidance: this.markSuggestion('Benchmark against comps, justify with traction') },
        { term: 'Board seats', guidance: this.markSuggestion(' Founders maintain control early, accept investor board rep Series A+') },
        { term: 'Liquidation preference', guidance: this.markAssumption('1x non-participating typical for early stage') },
        { term: 'Vesting', guidance: this.markSuggestion('Founder reverse vesting common, 4yr w/ 1yr cliff') },
        { term: 'Pro-rata rights', guidance: this.markSuggestion('Acceptable to give to lead investors') }
      ],
      deal_structure_recommendation: this.markSuggestion(`For ${stage || 'Seed'}: SAFE with cap + discount OR priced round if strong position`)
    };

    // Use of Funds
    const useOfFunds = {
      breakdown: [
        { category: 'Product/Tech', percentage: '30-40%', rationale: this.markSuggestion('Team expansion, platform development') },
        { category: 'Sales/Marketing', percentage: '30-40%', rationale: this.markSuggestion('Customer acquisition, brand building') },
        { category: 'Operations', percentage: '15-20%', rationale: this.markSuggestion('Ops scale, customer support, logistics') },
        { category: 'G&A', percentage: '5-10%', rationale: this.markSuggestion('Finance, legal, admin') },
        { category: 'Runway buffer', percentage: '10%', rationale: this.markSuggestion('Contingency, bridge to next round') }
      ],
      milestones_to_achieve: [
        this.markSuggestion('Reach $XM ARR / GMV'),
        this.markSuggestion('Achieve positive unit economics'),
        this.markSuggestion('Expand to Y cities / new market'),
        this.markSuggestion('Build Z-person team'),
        this.markSuggestion('Position for Series A/B in 12-18 months')
      ]
    };

    return this.createOutput({
      investment_thesis: investmentThesis,
      pitch_deck_structure: pitchDeck,
      vc_narrative: vcNarrative,
      term_sheet_guidance: termSheetGuidance,
      use_of_funds: useOfFunds,
      investor_targeting: {
        ideal_investor_profile: this.markSuggestion('SEA-focused, sector experience, value-add beyond capital'),
        target_firms: this.markAssumption('[TODO: Research specific VCs - e.g., Sequoia SEA, 500 Startups, etc]'),
        warm_intro_strategy: this.markSuggestion('Leverage accelerators, angels, founders network')
      },
      fundraising_timeline: {
        months_0_1: 'Finalize deck, model, data room',
        months_1_2: 'First meetings, pitch practice',
        months_2_3: 'Term sheets, due diligence',
        months_3_4: 'Close, legal docs, wire transfer'
      }
    }, {
      dependenciesUsed: ['01', '05', '06', '07'],
      dataQuality: 'high'
    });
  }
}
