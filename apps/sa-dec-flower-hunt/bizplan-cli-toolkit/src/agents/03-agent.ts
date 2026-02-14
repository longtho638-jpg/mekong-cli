/**
 * Skill 03: IPO Readiness (SEA/VN)
 */

import { BaseAgent } from './base-agent';
import { AgentInput, AgentOutput } from '../types/agent.types';

export class IPOReadinessAgent extends BaseAgent {
  skillId = '03';
  name = 'SEA/VN IPO Readiness';
  dependencies = ['01', '05'];
  description = 'Assess IPO readiness for Southeast Asia markets with compliance checklist';

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.log('Assessing IPO readiness...');

    const { company_profile, target_exchange = 'VNX', financial_data } = input;

    // IPO Readiness Score
    const readinessAssessment = {
      overall_score: this.markAssumption('65/100 - Pre-IPO stage'),
      readiness_stage: this.markSuggestion('Series B - 18-24 months to IPO'),
      key_strengths: [
        this.markFromPlan('Strong revenue growth (if applicable)'),
        this.markSuggestion('Clear market position'),
        this.markAssumption('Experienced management team')
      ],
      critical_gaps: [
        this.markAssumption('Need 3 years audited financials (IFRS/VAS)'),
        this.markSuggestion('Board governance structure needs upgrade'),
        this.markAssumption('Internal controls and compliance framework'),
        this.markSuggestion('Investor relations capability')
      ]
    };

    // Compliance Checklist (VN-specific)
    const complianceChecklist = {
      legal_entity: {
        status: this.markAssumption('In Progress'),
        requirements: [
          'Công ty cổ phần (JSC) structure',
          'Minimum charter capital requirements',
          'Share structure compliant with securities law',
          'No foreign ownership restrictions'
        ]
      },
      financial_reporting: {
        status: this.markAssumption('Major Gap'),
        requirements: [
          '3 years audited financials (Big 4 preferred)',
          'IFRS or VAS compliance',
          'Quarterly reporting capability',
          'Internal audit function',
          'Financial projections (3-5 years)'
        ]
      },
      corporate_governance: {
        status: this.markSuggestion('Needs Improvement'),
        requirements: [
          'Board of Directors (min 3, max 11 members)',
          'Independent directors (min 20%)',
          'Audit committee',
          'Corporate governance charter',
          'Related party transaction policies'
        ]
      },
      disclosure_obligations: {
        status: this.markAssumption('Not Started'),
        requirements: [
          'Prospectus preparation',
          'Material information disclosure',
          'Ongoing disclosure framework',
          'Investor relations department'
        ]
      },
      operational_readiness: {
        status: this.markSuggestion('Partial'),
        requirements: [
          'ERP system for financial management',
          'Shareholder registry system',
          'Data room preparation',
          'IR website'
        ]
      }
    };

    // Exchange Options Comparison
    const exchangeOptions = [
      {
        exchange: 'HOSE (Vietnam)',
        fit_score: this.markSuggestion('High - if domestic focus'),
        requirements_summary: 'Charter capital ≥120B VND, 3 yrs profit, 15% public float',
        timeline: '12-18 months',
        pros: ['Local investor base', 'Lower costs', 'Currency alignment'],
        cons: ['Lower valuation multiples', 'Limited liquidity', 'Smaller investor pool']
      },
      {
        exchange: 'SGX (Singapore)',
        fit_score: this.markSuggestion('Medium-High - regional expansion'),
        requirements_summary: 'SGD 150M market cap, 3 yrs operating track record',
        timeline: '18-24 months',
        pros: ['International investors', 'Higher valuations', 'Strong governance'],
        cons: ['Higher costs', 'More stringent requirements', 'Currency risk']
      },
      {
        exchange: 'Dual Listing (VN + SGX)',
        fit_score: this.markAssumption('Aspirational - if market leader'),
        requirements_summary: 'Meet both exchange requirements + regulatory approval',
        timeline: '24-36 months',
        pros: ['Access to both markets', 'Prestige', 'Liquidity'],
        cons: ['Very high costs', 'Complex compliance', 'Dual reporting']
      }
    ];

    // 18-Month Roadmap to IPO
    const ipoRoadmap = {
      months_0_6: {
        phase: 'Foundation',
        key_milestones: [
          this.markSuggestion('Hire CFO with IPO experience'),
          this.markSuggestion('Engage Big 4 auditor'),
          this.markSuggestion('Start 3-year audit process'),
          this.markAssumption('Establish audit committee'),
          this.markSuggestion('Implement ERP/financial systems')
        ]
      },
      months_7_12: {
        phase: 'Build Readiness',
        key_milestones: [
          this.markSuggestion('Complete corporate governance upgrade'),
          this.markSuggestion('Appoint independent directors'),
          this.markAssumption('Finalize 3-year audited financials'),
          this.markSuggestion('Prepare draft prospectus'),
          this.markSuggestion('Engage underwriters/advisors')
        ]
      },
      months_13_18: {
        phase: 'IPO Execution',
        key_milestones: [
          this.markSuggestion('SSC filing and approval'),
          this.markSuggestion('Roadshow preparation'),
          this.markSuggestion('Investor roadshow (domestic + regional)'),
          this.markSuggestion('Pricing and allocation'),
          this.markSuggestion('Listing day!')
        ]
      }
    };

    // Cost Estimate
    const costEstimate = {
      total_cost_range: this.markAssumption('$500K - $2M USD for VN IPO'),
      breakdown: [
        { item: 'Legal fees', range: '$100K - $300K' },
        { item: 'Audit fees (3 years)', range: '$150K - $500K' },
        { item: 'Underwriting fees', range: '3-5% of proceeds' },
        { item: 'Financial advisory', range: '$100K - $400K' },
        { item: 'PR/IR costs', range: '$50K - $200K' },
        { item: 'Systems/compliance', range: '$50K - $200K' }
      ]
    };

    return this.createOutput({
      readiness_assessment: readinessAssessment,
      compliance_checklist: complianceChecklist,
      exchange_options_comparison: exchangeOptions,
      ipo_roadmap_18_months: ipoRoadmap,
      estimated_costs: costEstimate,
      recommended_advisors: {
        audit_firms: this.markSuggestion('Deloitte, EY, KPMG, PwC Vietnam'),
        legal_counsel: this.markSuggestion('VILAF, Tilleke & Gibbins, Baker McKenzie'),
        underwriters: this.markSuggestion('Local: SSI, VNDirect, HSC; Regional: CLSA, Maybank'),
        financial_advisors: this.markSuggestion('Vietnam focus: Mekong Capital, VinaCapital')
      }
    }, {
      dependenciesUsed: ['01', '05'],
      dataQuality: 'high'
    });
  }
}
