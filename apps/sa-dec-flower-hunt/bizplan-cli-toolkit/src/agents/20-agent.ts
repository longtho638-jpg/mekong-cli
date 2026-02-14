/**
 * Skill 20: Data Room & Investor Materials
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class DataRoomAgent extends BaseAgent {
  skillId = '20';
  name = 'Data Room & Investor Materials';
  dependencies = ['01', '03', '04', '16'];
  description = 'Prepare comprehensive data room and investor materials for due diligence';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Preparing data room structure...');

    const { company_stage = 'Series A', fundraising_type = 'Equity' } = input;

    // Data Room Structure
    const dataRoomStructure = {
      '01_corporate_legal': {
        description: 'Corporate documents and legal structure',
        required_documents: [
          this.markSuggestion('Certificate of Incorporation'),
          this.markSuggestion('Articles of Association/Charter'),
          this.markSuggestion('Cap table (current + fully diluted)'),
          this.markSuggestion('Shareholder agreements'),
          this.markSuggestion('Board minutes (past 2 years)'),
          this.markAssumption('Previous fundraising documents (SAFEs, convertible notes, SHA)')
        ],
        priority: 'Critical'
      },
      '02_financial': {
        description: 'Financial statements and models',
        required_documents: [
          this.markAssumption('Audited financials (3 years if available)'),
          this.markSuggestion('Management accounts (monthly, past 24 months)'),
          this.markSuggestion('Financial model (3-5 year projections)'),
          this.markSuggestion('Unit economics breakdown'),
          this.markSuggestion('Burn rate and runway analysis'),
          this.markAssumption('P&L, Balance Sheet, Cash Flow by quarter')
        ],
        priority: 'Critical'
      },
      '03_product_tech': {
        description: 'Product, technology, and IP',
        required_documents: [
          this.markSuggestion('Product roadmap'),
          this.markSuggestion('Tech stack documentation'),
          this.markAssumption('IP ownership (code, patents, trademarks)'),
          this.markSuggestion('Customer contracts (key accounts)'),
          this.markSuggestion('Security & data privacy policies'),
          this.markAssumption('Product demo/screenshots')
        ],
        priority: 'High'
      },
      '04_commercial_traction': {
        description: 'Sales, marketing, and customer data',
        required_documents: [
          this.markSuggestion('Customer list (anonymized if needed)'),
          this.markSuggestion('Sales pipeline (CRM export)'),
          this.markSuggestion('Marketing materials'),
          this.markSuggestion('Key metrics dashboard (MRR, churn, CAC, LTV)'),
          this.markSuggestion('Case studies/testimonials'),
          this.markAssumption('Cohort analysis')
        ],
        priority: 'High'
      },
      '05_team_org': {
        description: 'Team, org chart, compensation',
        required_documents: [
          this.markSuggestion('Org chart'),
          this.markSuggestion('Key employee bios'),
          this.markSuggestion('ESOP plan and allocation'),
          this.markAssumption('Employment agreements (C-level)'),
          this.markSuggestion('Compensation benchmarking'),
          this.markAssumption('Key person insurance (if any)')
        ],
        priority: 'Medium-High'
      },
      '06_legal_compliance': {
        description: 'Legal, regulatory, and compliance',
        required_documents: [
          this.markSuggestion('Business licenses'),
          this.markSuggestion('Regulatory filings'),
          this.markSuggestion('Material contracts (partnerships, vendors)'),
          this.markSuggestion('Insurance policies'),
          this.markAssumption('Litigation history/pending'),
          this.markSuggestion('Privacy policy (GDPR/PDPA compliance)')
        ],
        priority: 'Medium-High'
      },
      '07_investor_updates': {
        description: 'Previous investor communications',
        required_documents: [
          this.markSuggestion('Monthly/quarterly investor updates (past 12 months)'),
          this.markSuggestion('Board decks'),
          this.markAssumption('Previous pitch decks'),
          this.markSuggestion('Investment memos from past rounds')
        ],
        priority: 'Medium'
      }
    };

    // Investor Materials Checklist
    const investorMaterials = {
      core_deck: {
        name: 'Investor Pitch Deck',
        slides: 12 - 15,
        format: 'PDF',
        content: this.markFromPlan('From Agent 16 (Fundraising)'),
        status: this.markAssumption('To be customized per investor')
      },
      executive_summary: {
        name: 'One-Pager Executive Summary',
        pages: 1 - 2,
        format: 'PDF',
        content: 'Company snapshot, traction, ask',
        status: this.markSuggestion('Create from pitch deck')
      },
      detailed_memo: {
        name: 'Investment Memo (Long-Form)',
        pages: 10 - 15,
        format: 'PDF',
        content: 'Deep dive: market, product, business model, financials, team, use of funds',
        status: this.markSuggestion('Optional for sophisticated investors')
      },
      financial_model: {
        name: 'Financial Model',
        format: 'Excel',
        content: 'Dynamic 3-5 year model with assumptions',
        status: this.markAssumption('Share after NDA')
      },
      demo_video: {
        name: 'Product Demo Video',
        duration: '2-3 minutes',
        format: 'MP4/YouTube unlisted',
        content: 'Product walkthrough, key features',
        status: this.markSuggestion('Optional but impressive')
      }
    };

    // Data Room Best Practices
    const bestPractices = {
      organization: [
        this.markSuggestion('Use professional VDR (Virtual Data Room) like DocSend, Dropbox, Box'),
        this.markSuggestion('Clear folder structure with numbered sections'),
        this.markSuggestion('Index/table of contents at root level'),
        this.markAssumption('Version control - latest docs always on top')
      ],
      access_control: [
        this.markSuggestion('NDA required before access'),
        this.markSuggestion('Track who views what'),
        this.markSuggestion('Watermark sensitive documents'),
        this.markAssumption('Revoke access after round closes')
      ],
      preparation: [
        this.markSuggestion('Prepare 4-6 weeks before fundraising'),
        this.markSuggestion('Review with legal counsel'),
        this.markSuggestion('Redact commercially sensitive info initially'),
        this.markAssumption('Have FAQ document ready')
      ],
      updates: [
        this.markSuggestion('Update monthly financials'),
        this.markSuggestion('Add new contracts/partnerships'),
        this.markSuggestion('Keep metrics dashboard current'),
        this.markAssumption('Archive old versions, don\'t delete')
      ]
    };

    // Common DD Questions (Prep for Q&A)
    const commonDDQuestions = {
      financial: [
        'What\'s your monthly burn rate and current runway?',
        'How do you calculate CAC and LTV?',
        'What are your top 3 KPIs and how do they trend?',
        'Any contingent liabilities or off-balance sheet items?'
      ],
      product: [
        'What\'s your tech stack and why?',
        'How do you handle data security and privacy?',
        'What\'s in your product roadmap for next 12 months?',
        'Any technical debt or scaling challenges?'
      ],
      market: [
        'Who are your top 3 competitors and how do you differentiate?',
        'What\'s your go-to-market strategy?',
        'Customer concentration risk - top 10 customers % of revenue?',
        'Unit economics by customer segment?'
      ],
      team: [
        'Any co-founder vesting cliffs?',
        'Key person dependencies?',
        'ESOP pool size and allocation plan?',
        'Any team members planning to leave?'
      ],
      legal: [
        'Any pending or threatened litigation?',
        'IP ownership - anything not owned outright?',
        'Any regulatory compliance issues?',
        'Material contracts with unusual terms?'
      ]
    };

    return this.createOutput({
      data_room_structure: dataRoomStructure,
      investor_materials_checklist: investorMaterials,
      best_practices: bestPractices,
      common_dd_questions: commonDDQuestions,
      recommended_vdr_platforms: [
        { platform: 'DocSend', best_for: 'Seed/Series A', pricing: '$$$' },
        { platform: 'Dropbox', best_for: 'Early stage, budget', pricing: '$' },
        { platform: 'Carta', best_for: 'Equity management + data room', pricing: '$$$$' },
        { platform: 'Firmex', best_for: 'Later stage, enterprise', pricing: '$$$$$' }
      ],
      preparation_timeline: {
        weeks_4_6_before: 'Gather all documents, create folder structure',
        weeks_2_3_before: 'Review with legal, redact sensitive info',
        week_1_before: 'Share with trusted advisor for QA',
        week_0: 'Launch with first investor'
      }
    }, {
      dependenciesUsed: ['01', '03', '04', '16'],
      dataQuality: 'high'
    });
  }
}
