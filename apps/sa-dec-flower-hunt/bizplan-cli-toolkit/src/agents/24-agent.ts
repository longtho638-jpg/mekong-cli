/**
 * Skill 24: Crisis & Reputation Management
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class CrisisManagementAgent extends BaseAgent {
  skillId = '24';
  name = 'Crisis & Reputation Management';
  dependencies = [];
  description = 'Crisis response playbook, reputation management, and PR strategy for various scenarios';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Creating crisis management playbook...');

    const crisisScenarios = {
      data_breach: {
        severity: 'Critical',
        immediate_actions: [
          'Contain breach - isolate affected systems (IT team, <1 hour)',
          'Assess scope - what data compromised (Security team, <3 hours)',
          'Legal notification - engage counsel (Legal, <6 hours)',
          'Customer notification - email/website (Comms team, <24 hours if required by law)'
        ],
        communication_plan: {
          internal: 'Emergency all-hands, FAQ for employees',
          customers: this.markSuggestion('Transparent email, offer credit monitoring if PII leaked'),
          media: 'Prepared statement, no speculation, focus on remediation',
          regulators: 'Official notification per PDPA/GDPR requirements'
        },
        post_crisis: 'Security audit, improve controls, customer trust rebuilding campaign'
      },
      product_outage: {
        severity: 'High',
        immediate_actions: [
          'Incident response team activated (<15 mins)',
          'Status page updated - acknowledge issue (<30 mins)',
          'Customer communication - email/in-app (<1 hour)',
          'Fix deployed and verified (<4 hours target)'
        ],
        communication_plan: {
          customers: this.markSuggestion('Proactive updates every hour, transparency on root cause'),
          internal: 'War room, cross-functional team, clear DRI (Directly Responsible Individual)',
          social_media: 'Acknowledge, empathize, provide timeline'
        },
        post_crisis: 'Incident postmortem within 48 hours, publish learnings, service credits if appropriate'
      },
      negative_media: {
        severity: 'Medium-High',
        immediate_actions: [
          'Monitor social media/news mentions (PR team, ongoing)',
          'Assess accuracy - fact-check claims (<2 hours)',
          'Prepare holding statement (<4 hours)',
          'CEO/spokesperson decision on response (<24 hours)'
        ],
        communication_plan: {
          response_decision: this.markSuggestion('Engage vs ignore - depends on virality and accuracy'),
          statement_tone: 'Factual, non-defensive, focus on values and actions',
          media_outreach: 'Offer interviews to trusted journalists for balanced coverage'
        },
        post_crisis: 'Reputation monitoring, address underlying issues, positive PR campaign'
      },
      executive_misconduct: {
        severity: 'Critical',
        immediate_actions: [
          'Board informed immediately (<1 hour)',
          'Legal counsel engaged (<2 hours)',
          'Investigation launched (independent if needed)',
          'Executive placed on leave pending investigation',
          'Internal communication - what employees need to know'
        ],
        communication_plan: {
          internal: this.markSuggestion('Transparent with employees, commitment to values'),
          external: 'Minimal until investigation complete, "taking allegations seriously"',
          board: 'Regular updates, final recommendation on action'
        },
        post_crisis: 'Policy review, culture assessment, rebuild trust internally and externally'
      }
    };

    const crisisTeam = {
      crisis_lead: 'CEO or designated C-level',
      core_team: ['CEO', 'General Counsel', 'Head of Comms/PR', 'CTO (if technical)', 'Head of HR (if people issue)'],
      external_advisors: {
        pr_firm: this.markSuggestion('On retainer for crisis comms'),
        legal: 'External crisis counsel',
        security: 'Incident response firm (if cybersecurity)'
      },
      decision_making: 'Crisis lead has final call, 30-min max for critical decisions'
    };

    const reputationMonitoring = {
      tools: {
        media_monitoring: this.markSuggestion('Meltwater, Cision, Google Alerts'),
        social_listening: 'Brandwatch, Sprout Social, Twitter Advanced Search',
        review_sites: 'Google Reviews, G2, Capterra, Trustpilot'
      },
      frequency: 'Daily monitoring, weekly reports, immediate alerts for spikes',
      metrics: ['Sentiment score', 'Share of voice', 'PR value', 'NPS', 'Brand health surveys']
    };

    const preventionMeasures = {
      policies: ['Code of conduct', 'Social media policy', 'Whistleblower protection', 'Crisis simulation annually'],
      training: 'Crisis response training for leadership team, media training for spokespeople',
      preparation: this.markSuggestion('Pre-drafted statements for likely scenarios, dark site ready, spokesperson identified')
    };

    return this.createOutput({
      crisis_scenarios: crisisScenarios,
      crisis_team_structure: crisisTeam,
      reputation_monitoring: reputationMonitoring,
      prevention_measures: preventionMeasures,
      crisis_communication_principles: [
        this.markSuggestion('Speed - respond fast, acknowledge within 1 hour'),
        'Transparency - be honest, admit what you know and don\'t know',
        'Empathy - show you care about impact on customers/employees',
        'Action - state what you\'re doing to fix it',
        'Consistency - one message, one voice'
      ]
    }, {
      dataQuality: 'high'
    });
  }
}
