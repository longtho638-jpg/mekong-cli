/**
 * 🌉 VIBE Bridge - Types
 */

export interface Moat {
    name: string;
    emoji: string;
    description: string;
    strength: number;
    switchingCost: string;
    metrics: Record<string, number | string | boolean>;
}

export interface MoatStatus {
    moats: Record<string, Moat>;
    totalStrength: number;
    switchingCost: SwitchingCost;
}

export interface SwitchingCost {
    hours: number;
    days: number;
    months: number;
    moneyCost: number;
    lostPatterns: number;
    lostConnections: number;
    verdict: string;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyStatus {
    currentTier: LoyaltyTier;
    tenureMonths: number;
    discount: number;
    totalRevenue: number;
    savings: number;
    nextTier: LoyaltyTier | null;
    monthsToNextTier: number;
}

export interface AgenticStats {
    agents: number;
    chains: number;
    crews: number;
    skills: number;
    skillMappings: number;
    rules: number;
    hooks: number;
    memories: number;
    patternsLearned: number;
    successRate: number;
    codingLevel: number;
    integrationScore: number;
}

export interface CrewInfo {
    name: string;
    description: string;
    lead: string;
    workers: string[];
    qa: string;
}
