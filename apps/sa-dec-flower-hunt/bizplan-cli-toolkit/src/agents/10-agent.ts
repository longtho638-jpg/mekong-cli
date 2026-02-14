/**
 * Skill 10: Performance Ads & Creatives
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class PerformanceAdsAgent extends BaseAgent {
  skillId = '10';
  name = 'Performance Ads & Intro Creatives';
  dependencies = ['06', '07', '14'];
  description = 'Generate performance ad copy and creative briefs for top channels';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Generating ad creatives...');

    const fbAdCampaigns = [
      {
        campaign: 'Awareness',
        objective: 'Reach',
        ad_formats: ['Carousel', 'Video', 'Single image'],
        copy_angle: this.markSuggestion('Educate on problem, soft intro to solution'),
        cta: 'Learn More'
      },
      {
        campaign: 'Consideration',
        objective: 'Traffic → Landing page',
        ad_formats: ['Lead gen form', 'Messenger', 'Video'],
        copy_angle: this.markSuggestion('Feature benefits, address pain directly'),
        cta: 'Download Guide / Watch Demo'
      },
      {
        campaign: 'Conversion',
        objective: 'Conversions',
        ad_formats: ['Dynamic product ads', 'Collection', 'Instant experience'],
        copy_angle: this.markSuggestion('Limited offer, urgency, clear value'),
        cta: 'Start Free Trial / Sign Up'
      }
    ];

    return this.createOutput({
      facebook_ads: fbAdCampaigns,
      google_ads: { search: this.markSuggestion('RSAs with 15 headlines'), display: 'Responsive display ads' },
      creative_testing: this.markSuggestion('A/B test headlines, images, CTAs weekly')
    }, {
      dataQuality: 'high'
    });
  }
}
