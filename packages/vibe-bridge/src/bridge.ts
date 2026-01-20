/**
 * 🌉 VIBE Bridge - API Logic
 */
import { MoatStatus, SwitchingCost, LoyaltyStatus, AgenticStats, LoyaltyTier } from './types';
import { MOATS, LOYALTY_TIERS } from './mock-data';

export function calculateSwitchingCost(): SwitchingCost {
    const hours = 158;
    return { hours, days: 20, months: 1, moneyCost: 15800, lostPatterns: 300, lostConnections: 3, verdict: "😟 SWITCHING = Painful" };
}

export function getMoatStatus(): MoatStatus {
    const totalStrength = Object.values(MOATS).reduce((sum, m) => sum + m.strength, 0) / 5;
    return { moats: MOATS, totalStrength: Math.round(totalStrength), switchingCost: calculateSwitchingCost() };
}

export function getLoyaltyStatus(tenureMonths: number = 0): LoyaltyStatus {
    let currentTier: LoyaltyTier = 'bronze';
    for (const [tier, config] of Object.entries(LOYALTY_TIERS) as [LoyaltyTier, any][]) {
        if (tenureMonths >= config.minMonths) currentTier = tier;
    }
    const discount = LOYALTY_TIERS[currentTier].discount;
    return { currentTier, tenureMonths, discount, totalRevenue: 100000, savings: 1000, nextTier: 'silver', monthsToNextTier: 12 };
}

export function getAgenticStats(): AgenticStats {
    return { agents: 26, chains: 34, crews: 6, skills: 39, skillMappings: 62, rules: 6, hooks: 6, memories: 3, patternsLearned: 0, successRate: 1.0, codingLevel: 3, integrationScore: 99 };
}
