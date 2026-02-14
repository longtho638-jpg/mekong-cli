/**
 * Skill 04: Gap Report & Roadmap
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class GapReportAgent extends BaseAgent {
  skillId = '04';
  name = 'Gap Report & Roadmap';
  dependencies = ['01', '03'];
  description = 'Identify gaps between current state and target goals with prioritized roadmap';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Generating gap analysis...');

    const { current_state, target_state = 'IPO-ready', timeframe = '18-24 months' } = input;
    const ipoReadiness = this.getContext('03', input);

    // Current State Assessment
    const currentStateAssessment = {
      stage: this.markFromPlan('Seed/Series A'),
      key_strengths: [
        this.markFromPlan('Product-market fit validated'),
        this.markSuggestion('Strong founding team'),
        this.markFromPlan('Initial traction/revenue')
      ],
      key_weaknesses: [
        this.markAssumption('Limited financial infrastructure'),
        this.markAssumption('Informal governance'),
        this.markSuggestion('No dedicated finance team')
      ]
    };

    // Gap Analysis
    const gapAnalysis = {
      financial_gaps: [
        {
          gap: 'Audited Financials',
          current: this.markAssumption('Internal books only'),
          target: 'Big 4 audited (3 years)',
          priority: 'Critical',
          effort: 'High',
          timeline: '12-18 months'
        },
        {
          gap: 'Financial Systems',
          current: this.markAssumption('Excel/QuickBooks'),
          target: 'ERP (SAP/Oracle/NetSuite)',
          priority: 'High',
          effort: 'Medium-High',
          timeline: '6-9 months'
        },
        {
          gap: 'Unit Economics',
          current: this.markFromPlan('Basic tracking'),
          target: 'Detailed cohort analysis, LTV/CAC models',
          priority: 'High',
          effort: 'Medium',
          timeline: '3-6 months'
        }
      ],
      governance_gaps: [
        {
          gap: 'Board Structure',
          current: this.markAssumption('Founders only'),
          target: 'Professional board with independents',
          priority: 'Critical',
          effort: 'Medium',
          timeline: '6-12 months'
        },
        {
          gap: 'Corporate Policies',
          current: this.markAssumption('Ad-hoc'),
          target: 'Documented governance charter, codes of conduct',
          priority: 'High',
          effort: 'Low-Medium',
          timeline: '3-6 months'
        }
      ],
      operational_gaps: [
        {
          gap: 'Team Structure',
          current: this.markAssumption('~20 people, informal'),
          target: '100+ with clear org chart and roles',
          priority: 'High',
          effort: 'High',
          timeline: '12-24 months'
        },
        {
          gap: 'Key Hires',
          current: this.markAssumption('No CFO, no General Counsel'),
          target: 'CFO, GC, VP HR hired',
          priority: 'Critical',
          effort: 'High',
          timeline: '6-12 months'
        }
      ],
      compliance_gaps: [
        {
          gap: 'Data Privacy',
          current: this.markAssumption('Basic practices'),
          target: 'GDPR/PDPA compliant, DPO appointed',
          priority: 'High',
          effort: 'Medium',
          timeline: '6-9 months'
        },
        {
          gap: 'Internal Controls',
          current: this.markAssumption('Minimal'),
          target: 'SOX-lite framework, internal audit',
          priority: 'High',
          effort: 'Medium-High',
          timeline: '9-12 months'
        }
      ],
      product_market_gaps: [
        {
          gap: 'Market Diversification',
          current: this.markFromPlan('Single market (VN)'),
          target: 'Multi-country SEA presence',
          priority: 'Medium-High',
          effort: 'Very High',
          timeline: '12-24 months'
        }
      ]
    };

    // Prioritized Roadmap (18-24 months)
    const roadmap = {
      phase_1_foundation: {
        months: '0-6',
        theme: 'Build Core Infrastructure',
        priorities: [
          {
            milestone: 'Hire CFO',
            owner: 'CEO',
            status: this.markAssumption('TODO'),
            dependencies: []
          },
          {
            milestone: 'Engage Big 4 Audit Firm',
            owner: 'CFO',
            status: this.markAssumption('TODO'),
            dependencies: ['Hire CFO']
          },
          {
            milestone: 'Implement ERP System',
            owner: 'CFO + CTO',
            status: this.markAssumption('TODO'),
            dependencies: ['Hire CFO']
          },
          {
            milestone: 'Establish Audit Committee',
            owner: 'Board',
            status: this.markAssumption('TODO'),
            dependencies: []
          }
        ]
      },
      phase_2_maturity: {
        months: '7-12',
        theme: 'Mature Governance & Financials',
        priorities: [
          {
            milestone: 'Complete 3-Year Audit',
            owner: 'CFO',
            status: this.markAssumption('TODO'),
            dependencies: ['Engage Big 4']
          },
          {
            milestone: 'Appoint Independent Directors',
            owner: 'Board',
            status: this.markAssumption('TODO'),
            dependencies: ['Establish Audit Committee']
          },
          {
            milestone: 'Implement Internal Controls',
            owner: 'CFO + GC',
            status: this.markAssumption('TODO'),
            dependencies: ['Hire GC']
          },
          {
            milestone: 'Hire General Counsel',
            owner: 'CEO',
            status: this.markAssumption('TODO'),
            dependencies: []
          }
        ]
      },
      phase_3_ipo_prep: {
        months: '13-18',
        theme: 'IPO Readiness',
        priorities: [
          {
            milestone: 'Draft Prospectus',
            owner: 'CFO + GC',
            status: this.markAssumption('TODO'),
            dependencies: ['Complete 3-Year Audit']
          },
          {
            milestone: 'Engage Underwriters',
            owner: 'CEO + CFO',
            status: this.markAssumption('TODO'),
            dependencies: []
          },
          {
            milestone: 'Investor Relations Setup',
            owner: 'CFO',
            status: this.markAssumption('TODO'),
            dependencies: []
          }
        ]
      },
      phase_4_execution: {
        months: '19-24',
        theme: 'IPO Execution',
        priorities: [
          {
            milestone: 'SSC Filing',
            owner: 'GC',
            status: this.markAssumption('TODO'),
            dependencies: ['Draft Prospectus']
          },
          {
            milestone: 'Roadshow',
            owner: 'CEO + CFO',
            status: this.markAssumption('TODO'),
            dependencies: ['SSC Filing']
          },
          {
            milestone: 'Listing',
            owner: 'All',
            status: this.markAssumption('TODO'),
            dependencies: ['Roadshow']
          }
        ]
      }
    };

    // Risk Assessment
    const riskAssessment = [
      {
        risk: 'Timeline Slippage',
        likelihood: 'High',
        impact: 'High',
        mitigation: this.markSuggestion('Build 6-month buffer, hire experienced advisors early')
      },
      {
        risk: 'Key Hire Delays',
        likelihood: 'Medium',
        impact: 'Critical',
        mitigation: this.markSuggestion('Start CFO/GC search immediately, use exec search firms')
      },
      {
        risk: 'Audit Issues',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: this.markAssumption('Clean up books proactively, implement controls early')
      },
      {
        risk: 'Market Downturn',
        likelihood: 'Medium',
        impact: 'Critical',
        mitigation: this.markSuggestion('Build strong fundamentals, have IPO-window flexibility')
      }
    ];

    return this.createOutput({
      current_state_assessment: currentStateAssessment,
      gap_analysis_by_category: gapAnalysis,
      prioritized_roadmap: roadmap,
      risk_assessment: riskAssessment,
      resource_requirements: {
        budget_estimate: this.markAssumption('$2-5M USD over 18-24 months'),
        key_hires: ['CFO', 'General Counsel', 'VP Finance', 'Internal Auditor', 'IR Manager'],
        external_advisors: ['Big 4 Auditor', 'Legal Counsel', 'Underwriters', 'IR Firm']
      },
      success_metrics: {
        financial: ['3 years IFRS audited', 'Quarterly reporting ready', 'Clean audit opinion'],
        governance: ['Board with independents', 'Audit committee functional', 'Policies documented'],
        operational: ['ERP live', 'SOX-lite controls', 'Data room ready'],
        market: ['IPO filing submitted', 'Investor interest confirmed', 'Listing approved']
      }
    }, {
      dependenciesUsed: ['01', '03'],
      dataQuality: 'high'
    });
  }
}
