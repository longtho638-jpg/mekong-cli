
/**
 * Master Orchestrator Type Definitions
 * Based on 00_MASTER-Agentic-BizPlan-OS.json
 */

export interface MasterConfig {
  id: string;
  version: string;
  title: string;
  businessPlanFrame: BusinessPlanFrame;
  agenticLayers: AgenticLayers;
  ipoLifecycle: IPOLifecycle;
}

export interface BusinessPlanFrame {
  sections: BusinessPlanSection[];
}

export interface BusinessPlanSection {
  id: string;
  label: string;
  goal: string;
  subsections: string[];
}

export interface AgenticLayers {
  agentTypes: AgentType[];
}

export interface AgentType {
  id: string;
  role: string;
  touchPoints: string[];
}

export interface IPOLifecycle {
  stages: IPOStage[];
}

export interface IPOStage {
  id: string;
  label: string;
  focus: string[];
}

export interface BusinessPlan2026 {
  generatedAt: string;
  version: string;
  sections: {
    meta_and_stage: MetaSection;
    vision_mission_story: VisionSection;
    market_and_customer: MarketSection;
    product_and_agentic_os: ProductSection;
    business_model_and_unit_economics: BusinessModelSection;
    growth_engine_and_go_to_market: GrowthSection;
    operations_risk_compliance: OperationsSection;
    financials_and_ipo_roadmap: FinancialsSection;
    brand_story_psychology: BrandSection;
  };
  metadata: {
    skillsExecuted: string[];
    executionDuration: number;
    completeness: number;
  };
}

export interface MetaSection {
  businessSnapshot: string;
  industry: string;
  region: string;
  currentStage: string;
  threeToFiveYearGoal: string;
}

export interface VisionSection {
  vision: string;
  mission: string;
  founderStory: string;
  zeroToIpoNarrative: string;
}

export interface MarketSection {
  customerProfiles: any[];
  jobsToBeDone: any[];
  marketSizing: any;
  competition: any;
  regulations: any;
}

export interface ProductSection {
  coreProduct: string;
  keyFeatures: string[];
  agenticOsMap: any;
  dataFeedbackLoop: string;
  roadmap: any[];
}

export interface BusinessModelSection {
  revenueModel: string;
  costStructure: any;
  unitEconomics: any;
  agenticLeverage: string;
  scenarios: any[];
}

export interface GrowthSection {
  aarrr: any;
  channels: string[];
  growthLoops: any[];
  growthAgents: any[];
  milestones: any[];
}

export interface OperationsSection {
  operatingModel: any;
  keyRisks: any[];
  compliance: any;
  agenticAutomation: any;
  ipoPreparation: any;
}

export interface FinancialsSection {
  revenueTrajectory: any;
  fundingPlan: any;
  keyKpis: any[];
  ipoOptions: any;
  readinessChecklist: any[];
}

export interface BrandSection {
  brandPosition: string;
  psychology: any;
  narratives: any;
  contentStrategy: any;
  longTermMoat: string;
}

export interface MasterInput {
  type: 'full_plan' | 'refactor_old_plan' | 'specific_skills' | 'workflow_preset';
  researchFile?: string;
  planText?: string;
  skillIds?: string[];
  workflowPreset?: 'fundraising' | 'gtm' | 'ipo';
  outputDir?: string;
  outputFormat?: 'json' | 'md' | 'pdf';
}
