/**
 * Skill 07: Brand Positioning & Identity
 * Refactored from scripts/brand-position.ts
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class BrandPositioningAgent extends BaseAgent {
    skillId = '07';
    name = 'Brand Positioning & Identity';
    dependencies = ['05', '06']; // Business Model, Customer Psychology
    description = 'Generate comprehensive brand positioning and identity system';

    async execute(input: AgentInput): Promise<AgentOutput> {
        this.log('Generating brand positioning...');

        const { idea_or_plan_excerpt, market_position_hint, brand_personality_hint } = input;

        const brandCore = {
            brand_essence: this.markSuggestion('Core brand essence (2-4 words)'),
            brand_promise: this.markSuggestion('What brand commits to deliver'),
            one_line_positioning_statement: this.markSuggestion('Concise positioning'),
            category_and_frame_of_reference: this.markFromPlan('Industry category')
        };

        const positioningStatement = {
            for_who: this.markSuggestion('Target audience'),
            who_have: this.markSuggestion('Customer pain point'),
            we_are: this.markFromPlan('Product/service description'),
            that_do: this.markSuggestion('Value proposition'),
            unlike: this.markSuggestion('Competitor differentiation'),
            we_uniquely: this.markSuggestion('Unique advantage')
        };

        const usp = {
            usp_long_form: this.markSuggestion('Detailed USP (1-3 sentences)'),
            usp_short_form: this.markSuggestion('Short USP phrase'),
            supporting_proofs_or_reasons_to_believe: [
                this.markFromPlan('Proof point 1'),
                this.markSuggestion('Proof point 2'),
                '[TODO] Certification/awards'
            ]
        };

        return this.createOutput({
            brand_core: brandCore,
            positioning_statement_canon: positioningStatement,
            unique_selling_proposition: usp,
            brand_personality_and_voice: {
                personality_keywords: ['Trustworthy', 'Innovative', 'Customer-focused'],
                voice_principles: ['Clear and direct', 'Professional yet approachable'],
                tone_by_context: {
                    website: 'Informative and engaging',
                    email: 'Personal and helpful',
                    social: 'Conversational and vibrant'
                }
            }
        }, {
            dependenciesUsed: ['05', '06'],
            dataQuality: 'high'
        });
    }
}
