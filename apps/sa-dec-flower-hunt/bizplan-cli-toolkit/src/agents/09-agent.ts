/**
 * Skill 09: Website & Landing Page Narrative
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class WebsiteNarrativeAgent extends BaseAgent {
  skillId = '09';
  name = 'Website & Landing Narrative';
  dependencies = ['06', '07', '08'];
  description = 'Create compelling website copy and landing page structure';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Generating website narrative...');

    const brand = this.getContext('07', input);
    const personas = this.getContext('06', input);

    const homepage = {
      hero_section: {
        headline: this.markSuggestion('[Benefit-Driven Statement in <10 words]'),
        subheadline: this.markSuggestion('Expand on value prop, address pain point (1 sentence)'),
        cta_primary: 'Start Free Trial',
        cta_secondary: 'Watch Demo',
        hero_image: this.markAssumption('Product screenshot or lifestyle image')
      },
      social_proof: {
        trust_bar: this.markSuggestion('Logos of recognizable customers'),
        testimonial_highlight: this.markFromPlan('Quote from top customer'),
        stats: ['[X,XXX] customers', '[Y]% increase in [metric]', '[Z] countries']
      },
      features_benefits: [
        { feature: 'Feature 1', benefit: this.markSuggestion('Save [time/money]'), icon: '⚡' },
        { feature: 'Feature 2', benefit: this.markSuggestion('Increase [outcome]'), icon: '📈' },
        { feature: 'Feature 3', benefit: this.markSuggestion('Simplify [process]'), icon: '✨' }
      ],
      how_it_works: {
        step_1: this.markSuggestion('Sign up in 30 seconds'),
        step_2: this.markSuggestion('Connect your [integration]'),
        step_3: this.markSuggestion('Start seeing results')
      },
      final_cta: {
        headline: this.markSuggestion('Ready to [achieve outcome]?'),
        cta: 'Get Started Free'
      }
    };

    const landingPageTemplate = {
      headline_formula: this.markSuggestion('[Verb] [Outcome] without [Pain Point]'),
      structure: [
        'Hero (headline + CTA above fold)',
        'Problem agitation (empathize with pain)',
        'Solution introduction (product as answer)',
        'Features & benefits (3-5 key points)',
        'Social proof (testimonials, logos, stats)',
        'How it works (3 simple steps)',
        'Pricing preview (if applicable)',
        'FAQ (address objections)',
        'Final CTA (strong, benefit-driven)'
      ],
      copy_principles: [
        this.markSuggestion('Benefit-driven, not feature-list'),
        'Clear hierarchy (scan able headings)',
        'Concise paragraphs (2-3 sentences max)',
        'Active voice, present tense',
        'Use numbers and specifics',
        'Address objections preemptively'
      ]
    };

    return this.createOutput({
      homepage_structure: homepage,
      landing_page_template: landingPageTemplate,
      about_page: { founder_story: this.markFromPlan('From vision/mission'), team: this.markSuggestion('Photos + bios') },
      pricing_page: { tiers: this.markSuggestion('3-tier structure: Starter, Pro, Enterprise'), faq: this.markSuggestion('Common pricing questions') }
    }, {
      dependenciesUsed: ['06', '07', '08'],
      dataQuality: 'high'
    });
  }
}
