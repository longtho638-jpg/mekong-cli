/** Venture/Strategy TypeScript types for investment analysis engines */

import type { TerrainType, MomentumLevel } from '../studio/types.js';

/** Investment thesis definition */
export interface InvestmentThesis {
  id: string;
  name: string;
  sectors: string[];
  stages: string[];
  checkSizeMinUsd: number;
  checkSizeMaxUsd: number;
  geographies: string[];
  antiThesis: string[];
  criteria: ThesisCriterion[];
  createdAt: string;
  updatedAt: string;
}

/** Single thesis criterion with weight */
export interface ThesisCriterion {
  name: string;
  description: string;
  weight: number;
  mustHave: boolean;
}

/** Terrain analysis result */
export interface TerrainAnalysis {
  terrain: TerrainType;
  reasoning: string;
  entryStrategy: string;
  risks: string[];
  opportunities: string[];
  competitors: Array<{ name: string; strength: string; weakness: string }>;
  recommendation: string;
}

/** Momentum scoring result */
export interface MomentumResult {
  level: MomentumLevel;
  score: number;
  signals: Array<{ signal: string; direction: 'up' | 'down' | 'flat'; weight: number }>;
  reasoning: string;
  forecast: string;
}

/** Company momentum result */
export interface CompanyMomentumResult {
  level: MomentumLevel;
  score: number;
  trendVsLastMonth: number;
  reasoning: string;
}

/** Void-substance (虚実) market mapping result */
export interface VoidSubstanceMap {
  market: string;
  voids: Array<{ area: string; description: string; opportunity: string }>;
  substances: Array<{ area: string; player: string; strength: string }>;
  gaps: Array<{ void: string; substance: string; exploitability: number }>;
  recommendation: string;
  analyzedAt: string;
}
