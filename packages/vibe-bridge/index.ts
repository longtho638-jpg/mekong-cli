/**
 * 🌉 VIBE Bridge - Connect FE to BE Agentic Infrastructure
 * 
 * Bridges TypeScript frontend with Python backend:
 * - Moat Engine
 * - Loyalty Program
 * - Unified Dashboard
 * - Autonomous Mode
 * 
 * 🏯 "Không đánh mà thắng" - Win Without Fighting
 */

// ============================================
// TYPES - Mirror BE models
// ============================================

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

// ============================================
// MOCK DATA (Real impl would call CLI/API)
// ============================================

const MOATS: Record<string, Moat> = {
    data: {
        name: "Data Moat",
        emoji: "📊",
        description: "All work, clients, invoices stored here",
        strength: 40,
        switchingCost: "Years of data",
        metrics: { projects: 50, clients: 25, invoices: 200 }
    },
    learning: {
        name: "Learning Moat",
        emoji: "🧠",
        description: "AI learns your patterns",
        strength: 60,
        switchingCost: "All patterns lost",
        metrics: { patterns: 300, successRate: 95 }
    },
    network: {
        name: "Network Moat",
        emoji: "🌐",
        description: "Community connections",
        strength: 15,
        switchingCost: "Lose network",
        metrics: { collaborators: 2, referrals: 1 }
    },
    workflow: {
        name: "Workflow Moat",
        emoji: "⚡",
        description: "Custom automations",
        strength: 30,
        switchingCost: "Rebuild everything",
        metrics: { workflows: 2, integrations: 1 }
    },
    identity: {
        name: "Identity Moat",
        emoji: "🏯",
        description: "Agency DNA tied here",
        strength: 75,
        switchingCost: "Redefine brand",
        metrics: { brand: true, templates: 10 }
    }
};

const LOYALTY_TIERS: Record<LoyaltyTier, { discount: number; minMonths: number }> = {
    bronze: { discount: 0, minMonths: 0 },
    silver: { discount: 5, minMonths: 12 },
    gold: { discount: 10, minMonths: 24 },
    platinum: { discount: 15, minMonths: 36 },
    diamond: { discount: 20, minMonths: 60 },
};

// ============================================
// BRIDGE API
// ============================================

export function getMoatStatus(): MoatStatus {
    const totalStrength = Object.values(MOATS).reduce((sum, m) => sum + m.strength, 0) / 5;

    return {
        moats: MOATS,
        totalStrength: Math.round(totalStrength),
        switchingCost: calculateSwitchingCost(),
    };
}

export function calculateSwitchingCost(): SwitchingCost {
    const hours = 158;
    const moneyCost = hours * 100;

    return {
        hours,
        days: Math.ceil(hours / 8),
        months: Math.round(hours / 160 * 10) / 10,
        moneyCost,
        lostPatterns: 300,
        lostConnections: 3,
        verdict: hours > 100 ? "😟 SWITCHING = Painful" : "⚡ Possible",
    };
}

export function getLoyaltyStatus(tenureMonths: number = 0): LoyaltyStatus {
    let currentTier: LoyaltyTier = 'bronze';
    let nextTier: LoyaltyTier | null = 'silver';

    for (const [tier, config] of Object.entries(LOYALTY_TIERS) as [LoyaltyTier, typeof LOYALTY_TIERS[LoyaltyTier]][]) {
        if (tenureMonths >= config.minMonths) {
            currentTier = tier;
        }
    }

    const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tiers.indexOf(currentTier);
    nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

    const discount = LOYALTY_TIERS[currentTier].discount;
    const monthsToNext = nextTier ? LOYALTY_TIERS[nextTier].minMonths - tenureMonths : 0;

    return {
        currentTier,
        tenureMonths,
        discount,
        totalRevenue: 100000,
        savings: 100000 * (discount / 100),
        nextTier,
        monthsToNextTier: Math.max(0, monthsToNext),
    };
}

export function getAgenticStats(): AgenticStats {
    return {
        agents: 26,
        chains: 34,
        crews: 6,
        skills: 39,
        skillMappings: 62,
        rules: 6,
        hooks: 6,
        memories: 3,
        patternsLearned: 0,
        successRate: 1.0,
        codingLevel: 3,
        integrationScore: 99,
    };
}

export function getCrews(): CrewInfo[] {
    return [
        {
            name: "Product Launch Crew",
            description: "Launch products from idea to production",
            lead: "project-manager",
            workers: ["planner", "fullstack-developer", "ui-ux-designer", "tester", "docs-manager"],
            qa: "code-reviewer"
        },
        {
            name: "Revenue Accelerator Crew",
            description: "Maximize revenue and client acquisition",
            lead: "money-maker",
            workers: ["client-magnet", "deal-closer", "copywriter", "growth-strategist"],
            qa: "client-value"
        },
        {
            name: "Content Machine Crew",
            description: "Produce viral content at scale",
            lead: "content-factory",
            workers: ["researcher", "copywriter", "ui-ux-designer", "brainstormer"],
            qa: "growth-strategist"
        },
        {
            name: "Strategy Crew",
            description: "Strategic analysis with Binh Pháp",
            lead: "binh-phap-strategist",
            workers: ["researcher", "growth-strategist", "planner"],
            qa: "money-maker"
        },
        {
            name: "DevOps Crew",
            description: "Build, test, deploy with automation",
            lead: "fullstack-developer",
            workers: ["planner", "database-admin", "tester", "git-manager"],
            qa: "code-reviewer"
        },
        {
            name: "Debug Squad",
            description: "Fix complex bugs with investigation",
            lead: "debugger",
            workers: ["researcher", "fullstack-developer", "tester"],
            qa: "code-reviewer"
        }
    ];
}

// ============================================
// EXPORTS
// ============================================

export const bridge = {
    getMoatStatus,
    calculateSwitchingCost,
    getLoyaltyStatus,
    getAgenticStats,
    getCrews,
};

export default bridge;
