/**
 * 🌐 @agencyos/vibe - Unified VIBE Ecosystem
 * 
 * 8 Planets + Core Systems
 */

// ============================================
// 🔵 VENUS - UI/Design
// ============================================
export * as vibeUI from '../vibe-ui';
export { colors, gradients, animations, transitions, vibeClasses } from '../vibe-ui';

// ============================================
// ⚪ URANUS - Analytics/Data
// ============================================
export * as vibeAnalytics from '../vibe-analytics';
export { vibeTelemetry, calculateGrowthMetrics, formatVND, shareContent } from '../vibe-analytics';

// ============================================
// 🟣 SATURN - AI Agents
// ============================================
export * as vibeAgents from '../vibe-agents';
export { AGENT_REGISTRY, AgentOrchestrator, BaseAgent, orchestrator } from '../vibe-agents';

// ============================================
// 🟠 JUPITER - CRM/Sales
// ============================================
export * as vibeCRM from '../vibe-crm';
export { VibeCRM, TIER_CONFIG, validateWinWinWin, crm } from '../vibe-crm';

// ============================================
// 🔴 MARS - Ops/Deploy
// ============================================
export * as vibeOps from '../vibe-ops';
export { VibeOps, commands, ops } from '../vibe-ops';

// ============================================
// 🟢 EARTH - Dev/Quality
// ============================================
export * as vibeDev from '../vibe-dev';
export { VibeDev, EVOLUTION_TARGETS, workflow, dev } from '../vibe-dev';

// ============================================
// 🟡 MERCURY - Marketing
// ============================================
export * as vibeMarketing from '../vibe-marketing';
export { ContentFactory, ReferralEngine, contentFactory, referralEngine } from '../vibe-marketing';

// ============================================
// 🟤 NEPTUNE - Finance/Revenue
// ============================================
export * as vibeRevenue from '../vibe-revenue';
export { VibeRevenue, ARR_TARGET_2026, EXCHANGE_RATES, revenue } from '../vibe-revenue';

// ============================================
// ☀️ CORE - Treasury & Workflow
// ============================================
export { CoreTreasury, PLANET_REVENUE, DISTRIBUTION, treasury } from '../antigravity/core/treasury';
export { JourneyTracker, STAGE_PLANET_MAP, STATE_TRANSITIONS, tracker } from '../antigravity/core/workflow';

// ============================================
// META
// ============================================
export const VIBE_VERSION = '1.0.0';

export const PLANETS = [
    'venus', 'uranus', 'saturn', 'jupiter',
    'mars', 'earth', 'mercury', 'neptune'
] as const;

export type Planet = typeof PLANETS[number];

export default {
    version: VIBE_VERSION,
    planets: PLANETS,
};
