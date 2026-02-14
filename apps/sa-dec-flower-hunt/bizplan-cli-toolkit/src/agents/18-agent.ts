/**
 * Skill 18: Talent Acquisition & Org Design
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class TalentOrgAgent extends BaseAgent {
  skillId = '18';
  name = 'Talent & Org Design';
  dependencies = ['01', '05'];
  description = 'Design org structure, hiring roadmap, and compensation frameworks';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Designing org structure and hiring plan...');

    const orgStructure = {
      current_stage: this.markFromPlan('Seed/Series A - 10-20 people'),
      target_stage: this.markSuggestion('Series B - 50-100 people in 24 months'),
      org_chart: {
        ceo: {
          reports: ['CTO', 'CFO', 'Head of Product', 'Head of GTM', 'Head of Ops'],
          focus: 'Vision, fundraising, key partnerships, culture'
        },
        cto: {
          reports: ['Engineering Manager', 'DevOps Lead', 'QA Lead'],
          team_size: '15-20 engineers (from 5 current)',
          focus: 'Product development, technical architecture, security'
        },
        cfo: {
          reports: ['Controller', 'FP&A Analyst'],
          team_size: '3-5 (from 1-2 current)',
          focus: 'Financial planning, fundraising, investor relations'
        },
        head_of_product: {
          reports: ['Product Managers', 'UX/UI Designer'],
          team_size: '5-8',
          focus: 'Product roadmap, user research, feature prioritization'
        },
        head_of_gtm: {
          reports: ['Sales Manager', 'Marketing Manager', 'Customer Success Manager'],
          team_size: '15-20',
          focus: 'Revenue growth, demand gen, customer retention'
        }
      }
    };

    const hiringRoadmap = {
      months_0_6: {
        hires: [
          { role: 'CFO', priority: 'Critical', compensation: this.markAssumption('$150-200K + equity') },
          { role: 'Senior Engineers (2-3)', priority: 'High', compensation: '$120-160K + equity' },
          { role: 'Product Manager', priority: 'High', compensation: '$100-140K + equity' }
        ],
        total_headcount: '15-18'
      },
      months_7_12: {
        hires: [
          { role: 'Head of Sales', priority: 'High', compensation: '$140-180K + equity + commission' },
          { role: 'Marketing Manager', priority: 'Medium', compensation: '$90-120K + equity' },
          { role: 'Engineers (3-5)', priority: 'High', compensation: '$100-140K + equity' },
          { role: 'Customer Success Manager', priority: 'Medium', compensation: '$80-110K + equity' }
        ],
        total_headcount: '25-30'
      },
      months_13_24: {
        hires: [
          { role: 'Head of Operations', priority: 'Medium', compensation: '$130-170K + equity' },
          { role: 'General Counsel', priority: 'Medium (for IPO prep)', compensation: '$180-240K + equity' },
          { role: 'AEs, SDRs (5-8)', priority: 'High', compensation: '$60-100K + commission' },
          { role: 'Engineers, PMs (10-15)', priority: 'High', compensation: 'Market rates + equity' }
        ],
        total_headcount: '50-60'
      }
    };

    const compensationFramework = {
      salary_bands: this.markSuggestion('Use Radford/Option Impact data for SEA region'),
      equity_allocation: {
        executives: '0.5-2% per hire',
        senior: '0.1-0.5%',
        mid_level: '0.05-0.15%',
        junior: '0.01-0.05%'
      },
      vesting: '4 years with 1 year cliff',
      esop_pool: this.markAssumption('15-20% of cap table reserved'),
      benefits: this.markSuggestion('Health insurance, remote stipend, learning budget, unlimited PTO')
    };

    return this.createOutput({
      org_structure: orgStructure,
      hiring_roadmap: hiringRoadmap,
      compensation_framework: compensationFramework,
      recruiting_strategy: {
        sourcing: this.markSuggestion('LinkedIn, referrals, tech communities, exec search for C-level'),
        employer_brand: this.markSuggestion('Blog, open source, conference talks, culture videos'),
        interview_process: '5 stages: recruiter screen, hiring manager, technical/case, team fit, exec/founder',
        time_to_hire: 'Target 30-45 days for most roles'
      }
    }, {
      dependenciesUsed: ['01', '05'],
      dataQuality: 'high'
    });
  }
}
