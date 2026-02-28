/**
 * 🌊 @agencyos/blue-ocean
 * Đại Dương Xanh - Unified VIBE Ecosystem
 * 
 * v1.0.0 | 13 files → 1 package
 */

// ============================================
// 🪐 PLANETS (8 Unified)
// ============================================
// Export planets (except Planet type which is also in core - avoid duplicate)
export {
    colors, gradients, vibeClasses, PLANETS,
    formatVND, calculateGrowthMetrics, AGENT_REGISTRY, TIER_CONFIG,
    validateWinWinWin, DEPLOY_COMMANDS, EVOLUTION_TARGETS, ReferralEngine,
    ARR_TARGET_2026, EXCHANGE_RATES, toUSD
} from './planets';

// ============================================
// ☀️ CORE (Treasury + Workflow)
// ============================================
export * from './core';

// ============================================
// 🎨 FLOW (SimStudio)
// ============================================
export { VibeFlow, FlowCopilot, vibeFlow, PLANET_NODES } from './flow';

// ============================================
// 📋 PROJECT (OpenProject)
// ============================================
export { VibeProject, vibeProject } from './project';

// ============================================
// 🛡️ HARDENED (Go-Live)
// ============================================
export {
    ShortcutRegistry, shortcuts,
    DEPLOY_COMMANDS as DEPLOY_CLI,
    GO_LIVE_CHECKLIST,
    runBlackScreenDiagnostics,
    runGoLiveChecklist,
    validateEnv
} from './hardened';

// ============================================
// META
// ============================================
export const BLUE_OCEAN_VERSION = '1.0.0';
export const VIBE_VERSION = BLUE_OCEAN_VERSION;

export default {
    version: BLUE_OCEAN_VERSION,
    name: 'Đại Dương Xanh',
    description: 'Enterprise VIBE Ecosystem',
};
