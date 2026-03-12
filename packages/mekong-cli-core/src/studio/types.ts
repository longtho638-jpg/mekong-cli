/** Studio platform TypeScript types — mirrors Python Pydantic models */

export type DealStage = 'sourced' | 'screening' | 'first_meeting' | 'diligence' | 'term_sheet' | 'negotiation' | 'closing' | 'closed' | 'passed';
export type CompanyStage = 'idea' | 'validation' | 'mvp' | 'seed' | 'series_a' | 'growth' | 'exit';
export type PartyRole = 'vc' | 'expert' | 'founder';
export type TerrainType = 'accessible' | 'entangling' | 'temporizing' | 'narrow_pass' | 'precipitous' | 'distant';
export type MomentumLevel = 'surging' | 'building' | 'steady' | 'fading' | 'stalled';

export interface PortfolioCompany {
  id: string;
  slug: string;
  name: string;
  stage: CompanyStage;
  sector: string;
  oneLiner: string;
  founderId?: string;
  founderName?: string;
  equityPct: number;
  investedUsd: number;
  valuationUsd?: number;
  mrr: number;
  arr: number;
  burnRate: number;
  runwayMonths?: number;
  teamSize: number;
  openclawActive: boolean;
  expertsAssigned: string[];
  healthScore: number;
  momentum: MomentumLevel;
  fiveFactorScores: Record<string, number>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  companyName: string;
  sector: string;
  stage: DealStage;
  source: string;
  oneLiner: string;
  founderName?: string;
  founderEmail?: string;
  askUsd?: number;
  valuationUsd?: number;
  thesisFitScore?: number;
  fiveFactorScores: Record<string, number>;
  terrainType?: TerrainType;
  momentum?: MomentumLevel;
  notes: Array<{ content: string; author: string; date: string }>;
  nextAction?: string;
  nextActionDate?: string;
  passReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expert {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  regions: string[];
  languages: string[];
  hourlyRateUsd?: number;
  equityOpen: boolean;
  availability: string;
  rating: number;
  engagementCount: number;
  bio: string;
  portfolioCompanies: string[];
  createdAt: string;
}

export interface Founder {
  id: string;
  name: string;
  email: string;
  background: string;
  skills: string[];
  sectorsInterested: string[];
  tuongScore?: Record<string, number>;
  matchedCompanyId?: string;
  status: string;
  createdAt: string;
}

export interface FiveFactorEvaluation {
  targetName: string;
  evaluatedAt: string;
  dao: { score: number; reasoning: string };
  thien: { score: number; reasoning: string; signals: string[] };
  dia: { score: number; reasoning: string; terrain: TerrainType };
  tuong: { score: number; reasoning: string; virtues: Record<string, number> };
  phap: { score: number; reasoning: string };
  compositeScore: number;
  recommendation: 'proceed' | 'pause' | 'pass';
  confidence: number;
}

export interface StudioDashboard {
  totalPortfolioCompanies: number;
  activeCompanies: number;
  totalInvestedUsd: number;
  portfolioValueUsd: number;
  totalMrr: number;
  avgHealthScore: number;
  dealsInPipeline: number;
  expertsActive: number;
  foundersAvailable: number;
  topMomentum: Array<{ company: string; level: MomentumLevel }>;
  alerts: Array<{ level: string; message: string; company?: string }>;
  crossPortfolioInsights: number;
}
