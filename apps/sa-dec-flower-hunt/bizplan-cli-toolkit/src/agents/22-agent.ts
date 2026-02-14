/**
 * Skill 22: Board Governance & IPO Structure
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class GovernanceAgent extends BaseAgent {
  skillId = '22';
  name = 'Board Governance & IPO Structure';
  dependencies = ['03', '04'];
  description = 'Design board structure, governance policies, and IPO-ready corporate framework';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Designing board governance structure...');

    const boardStructure = {
      current_stage: this.markFromPlan('Early stage - informal board'),
      target_pre_ipo: {
        board_size: '5-7 members',
        composition: [
          { role: 'CEO/Founder', count: 1, type: 'Management' },
          { role: 'Investor Directors', count: 2, type: 'Investor representatives' },
          { role: 'Independent Directors', count: 2 - 3, type: this.markSuggestion('Industry experts, former executives') }
        ],
        independent_percentage: this.markAssumption('Minimum 40%, target 50%+'),
        diversity_target: this.markSuggestion('At least 1 woman, consider geographic/functional diversity')
      },
      committees: {
        audit_committee: {
          purpose: 'Oversee financial reporting, internal controls, external audit',
          composition: '3 independent directors (100% independent)',
          chair: 'Financial expert',
          meeting_frequency: 'Quarterly minimum'
        },
        compensation_committee: {
          purpose: 'Set exec compensation, equity grants, performance reviews',
          composition: '2-3 independent directors',
          meeting_frequency: 'Bi-annual + ad-hoc for key hires'
        },
        nominating_governance_committee: {
          purpose: 'Board recruitment, governance policies, succession planning',
          composition: '2-3 directors (majority independent)',
          meeting_frequency: 'Annual + ad-hoc'
        }
      }
    };

    const governancePolicies = {
      board_charter: this.markSuggestion('Roles, responsibilities, meeting procedures'),
      code_of_conduct: 'Ethics, conflicts of interest, whistleblower policy',
      insider_trading_policy: this.markAssumption('Required for pre-IPO companies'),
      related_party_transactions: 'Approval process for transactions with directors/executives',
      disclosure_controls: 'Material information disclosure procedures'
    };

    const ipoReadyGovernance = {
      timeline_to_ipo: this.markAssumption('12-18 months from now'),
      key_milestones: [
        { month: 0, task: 'Recruit first independent director' },
        { month: 3, task: 'Establish audit committee' },
        { month: 6, task: 'Recruit second independent director' },
        { month: 6, task: 'Adopt corporate governance charter' },
        { month: 9, task: 'Implement SOX-lite internal controls' },
        { month: 12, task: 'Complete board structure (5-7 members)' },
        { month: 15, task: 'Board governance review by legal counsel' },
        { month: 18, task: 'IPO-ready governance in place' }
      ],
      compliance_requirements: {
        vnx: this.markSuggestion('Min 20% independent directors, audit committee required'),
        sgx: 'Min 1/3 independent, audit/remuneration committees mandatory',
        us_standards: 'SOX compliance, majority independent board (if ADR/US listing)'
      }
    };

    return this.createOutput({
      board_structure: boardStructure,
      governance_policies: governancePolicies,
      ipo_ready_governance: ipoReadyGovernance,
      director_recruitment: {
        criteria: this.markSuggestion('Industry expertise, public company experience, network, diversity'),
        search_firms: 'Spencer Stuart, Heidrick & Struggles, Korn Ferry',
        compensation: this.markAssumption('Board fees $20-50K/year + equity 0.1-0.25%')
      }
    }, {
      dependenciesUsed: ['03', '04'],
      dataQuality: 'high'
    });
  }
}
