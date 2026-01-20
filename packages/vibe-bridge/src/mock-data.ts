/**
 * 🌉 VIBE Bridge - Mock Data
 */
import { Moat, LoyaltyTier, CrewInfo } from './types';

export const MOATS: Record<string, Moat> = {
    data: { name: "Data Moat", emoji: "📊", description: "All work, clients stored here", strength: 40, switchingCost: "Years of data", metrics: { projects: 50, clients: 25 } },
    learning: { name: "Learning Moat", emoji: "🧠", description: "AI learns your patterns", strength: 60, switchingCost: "Patterns lost", metrics: { patterns: 300 } },
    network: { name: "Network Moat", emoji: "🌐", description: "Community connections", strength: 15, switchingCost: "Lose network", metrics: { collaborators: 2 } },
    workflow: { name: "Workflow Moat", emoji: "⚡", description: "Custom automations", strength: 30, switchingCost: "Rebuild everything", metrics: { workflows: 2 } },
    identity: { name: "Identity Moat", emoji: "🏯", description: "Agency DNA tied here", strength: 75, switchingCost: "Redefine brand", metrics: { brand: true } }
};

export const LOYALTY_TIERS: Record<LoyaltyTier, { discount: number; minMonths: number }> = {
    bronze: { discount: 0, minMonths: 0 },
    silver: { discount: 5, minMonths: 12 },
    gold: { discount: 10, minMonths: 24 },
    platinum: { discount: 15, minMonths: 36 },
    diamond: { discount: 20, minMonths: 60 },
};

export const CREWS: CrewInfo[] = [
    { name: "Product Launch Crew", description: "Idea to production", lead: "project-manager", workers: ["planner", "fullstack-developer"], qa: "code-reviewer" },
];
