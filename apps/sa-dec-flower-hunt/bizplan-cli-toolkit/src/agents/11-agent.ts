/**
 * Skill 11: Long-Form Storytelling
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class StorytellingAgent extends BaseAgent {
  skillId = '11';
  name = 'Adventorial & Long-Form Storytelling';
  dependencies = ['06', '07', '08'];
  description = 'Craft advertorials, case studies, and long-form narrative content';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Crafting long-form stories with Gemini AI...');
    const context = input.data?.context || {};
    const idea = input.data?.idea_or_offer || 'Unknown Offer';
    const persona = input.data?.target_persona_hint || 'General Audience';
    const goal = input.data?.primary_goal || 'engagement';

    // Try to use Gemini API for intelligent content generation
    let generatedContent = null;
    try {
      // Dynamic import to avoid build issues if lib doesn't exist yet
      const { GeminiService } = await import('../../../lib/gemini-service');

      generatedContent = await GeminiService.generateMarketingContent({
        topic: idea,
        persona: persona,
        goal: goal,
        context: context.background || context.founder_vision || 'Sa Dec flower marketplace'
      });

      this.log('✨ Content generated via Gemini AI');
    } catch (error) {
      this.log('⚠️  Gemini API unavailable, using template fallback');
    }

    const caseStudyTemplate = {
      structure: ['The Origin (Challenge)', 'The Awakening (Solution)', 'The Future (Results)'],
      customer_profile: this.markSuggestion(`Target: ${persona}`),
      challenge_section: this.markSuggestion(`Context: ${context.background || 'Generic market problem'}`),
      solution_section: this.markSuggestion(`Vision: ${context.founder_vision || 'Generic solution'} - implementing ${idea}`),
      results_section: this.markSuggestion('Goal: Revitalized village economy and high tourist footfall'),
      call_to_action: "Join the Flower Hunt today!",
      // Include AI-generated content if available
      ai_generated_content: generatedContent || null
    };

    return this.createOutput({
      case_study_template: caseStudyTemplate,
      advertorial_format: this.markSuggestion('Native ad style, editorial tone, story-driven'),
      founder_story_arc: this.markFromPlan('Problem discovered → Solution built → Impact achieved')
    }, {
      dataQuality: 'high'
    });
  }
}
