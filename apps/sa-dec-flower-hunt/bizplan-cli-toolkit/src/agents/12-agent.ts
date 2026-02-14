/**
 * Skill 12: Email & Lifecycle Sequences
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class EmailSequencesAgent extends BaseAgent {
  skillId = '12';
  name = 'Email & Lifecycle Sequences';
  dependencies = ['06', '07', '14'];
  description = 'Design email sequences for welcome, nurture, conversion, and retention';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Designing email sequences...');

    const welcomeSequence = [
      { day: 0, subject: this.markSuggestion('Welcome! Here\'s what to do first'), goal: 'Onboarding', cta: 'Complete setup' },
      { day: 1, subject: this.markSuggestion('Quick tip: [Feature] in action'), goal: 'Feature education', cta: 'Try it now' },
      { day: 3, subject: this.markSuggestion('Success story: How [Customer] achieved [Result]'), goal: 'Social proof', cta: 'Read case study' },
      { day: 7, subject: this.markSuggestion('You\'re making progress! Next steps...'), goal: 'Engagement', cta: 'Continue' }
    ];

    const nurtureSequence = {
      frequency: 'Weekly',
      content_mix: ['Educational (60%)', 'Product updates (20%)', 'Social proof (20%)'],
      segments: this.markSuggestion('By persona, engagement level, product interest')
    };

    return this.createOutput({
      welcome_sequence: welcomeSequence,
      nurture_sequence: nurtureSequence,
      conversion_sequence: this.markSuggestion('Trial ending reminders, objection handling, limited offers'),
      retention_sequence: this.markSuggestion('Feature highlights, tips, exclusive content, win-back for churned')
    }, {
      dataQuality: 'high'
    });
  }
}
