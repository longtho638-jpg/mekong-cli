/**
 * Skill 13: Sales Process & Channels
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class SalesProcessAgent extends BaseAgent {
  skillId = '13';
  name = 'Sales Process & Channels';
  dependencies = ['05', '06', '14'];
  description = 'Design sales playbook, scripts, objection handling, and channel strategy';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Building sales playbook...');
    const data = input.data || {};
    const context = data.context || {};

    const salesProcess = {
      prospecting: this.markSuggestion(`Source leads for ${data.go_to_market_type} in ${data.target_regions}`),
      qualification: `BANT adapted for ${data.average_price_point_or_plan} deals`,
      discovery: this.markSuggestion(`Focus on: ${context.challenges || 'Customer pain points'}`),
      demo: `Showcase: ${data.idea_or_offer} (Goal: ${context.goals})`,
      proposal: "Custom quote for B2B; Self-serve checkout for B2C",
      negotiation: "Volume discounts for B2B only",
      close: "Digital contract (B2B) / Instant ticket QR (B2C)"
    };

    const objectionHandling = [
      { objection: 'Too expensive', response: this.markSuggestion('ROI focus: Cost vs value, payback period') },
      { objection: 'Need to think about it', response: this.markSuggestion('Uncover real concern, create urgency') },
      { objection: 'Happy with current solution', response: this.markSuggestion('Compare limitations, highlight gaps') }
    ];

    return this.createOutput({
      sales_process: salesProcess,
      objection_handling: objectionHandling,
      sales_scripts: this.markSuggestion('Cold call, email templates, demo flow'),
      kpis: ['Conversion rate by stage', 'Average deal size', 'Sales cycle length', 'Win rate']
    }, {
      dataQuality: 'high'
    });
  }
}
