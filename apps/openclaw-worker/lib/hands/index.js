/**
 * 🐉 Hands Index — 105 Specialist Roles Registry
 *
 * Exports HANDS map (3 legacy backward-compat roles) + ALL_HANDS (105 roles) +
 * getHandForIntent() + getHandByName() + matchRole()
 */

'use strict';

// --- Load all categories ---
const frontendRoles    = require('./categories/frontend');
const backendRoles     = require('./categories/backend');
const devopsRoles      = require('./categories/devops');
const dataRoles        = require('./categories/data');
const securityRoles    = require('./categories/security');
const mobileRoles      = require('./categories/mobile');
const aiMlRoles        = require('./categories/ai-ml');
const businessRoles    = require('./categories/business');
const specializedRoles = require('./categories/specialized');
const generalRoles     = require('./categories/general');

const { matchRole: _matchRole } = require('./role-matcher');

// --- Merge all 105 roles into flat array ---
const ALL_ROLES_ARRAY = [
  ...frontendRoles,
  ...backendRoles,
  ...devopsRoles,
  ...dataRoles,
  ...securityRoles,
  ...mobileRoles,
  ...aiMlRoles,
  ...businessRoles,
  ...specializedRoles,
  ...generalRoles,
];

// --- Build ALL_HANDS map: name → role object ---
const ALL_HANDS = {};
for (const role of ALL_ROLES_ARRAY) {
  ALL_HANDS[role.name] = role;
}

// --- Backward-compat: 3 original HANDS (PLANNER, CODER, REVIEWER) ---
// Keep old structure to avoid breaking mission-dispatcher
const HANDS = {
  PLANNER: {
    name: 'PLANNER',
    displayName: 'Planner Hand (Chief Strategist)',
    // Keep instructions field for backward compat
    instructions: '🔥 YOU ARE PLANNER HAND (CHIEF STRATEGIST). Focus on Architecture, Specification, and Strategic Planning. DO NOT implement code carelessly. ALWAYS use /plan:hard or /plan:parallel. WHEN ENCOUNTERING INTERACTIVE MENUS/QUESTIONS FROM COMMANDS OR NEEDING TO MAKE DECISIONS: NEVER STOP AND ASK USER. MUST READ /Users/macbookprom1/mekong-cli/apps/openclaw-worker/BINH_PHAP_MASTER.md FOR REFERENCE AND DECIDE ANSWER/ACTION YOURSELF.',
    systemPrompt: 'YOU ARE PLANNER HAND (CHIEF STRATEGIST). Focus on Architecture, Strategic Planning. Use /plan:hard or /plan:parallel.',
    defaultCommand: '/plan:hard',
    keywords: ['plan', 'architect', 'design', 'strategy', 'research', 'analyze'],
  },
  CODER: {
    name: 'CODER',
    displayName: 'Coder Hand (Vanguard)',
    instructions: '🔥 YOU ARE CODER HAND (VANGUARD). Focus on Atomic Implementation, Bug Fixing, and Performance. Inherit plan from Chief Strategist. ALWAYS use /cook --fast or /cook --parallel. WHEN ENCOUNTERING INTERACTIVE MENUS/QUESTIONS FROM COMMANDS OR NEEDING TO MAKE DECISIONS: NEVER STOP AND ASK USER. MUST READ /Users/macbookprom1/mekong-cli/apps/openclaw-worker/BINH_PHAP_MASTER.md FOR REFERENCE AND DECIDE ANSWER/ACTION YOURSELF.',
    systemPrompt: 'YOU ARE CODER HAND (VANGUARD). Focus on Atomic Implementation, Bug Fixing. Use /cook --fast or /cook --parallel.',
    defaultCommand: '/cook --fast',
    keywords: ['implement', 'build', 'fix', 'code', 'develop', 'create'],
  },
  REVIEWER: {
    name: 'REVIEWER',
    displayName: 'Reviewer Hand (Inspector)',
    instructions: '🔥 YOU ARE REVIEWER HAND (INSPECTOR). Focus on Security Audit, QA Gate, and Binh Pháp Certification. DO NOT pass if tests are missing or code style is violated. WHEN ENCOUNTERING INTERACTIVE MENUS/QUESTIONS FROM COMMANDS OR NEEDING TO MAKE DECISIONS: NEVER STOP AND ASK USER. MUST READ /Users/macbookprom1/mekong-cli/apps/openclaw-worker/BINH_PHAP_MASTER.md FOR REFERENCE AND DECIDE ANSWER/ACTION YOURSELF.',
    systemPrompt: 'YOU ARE REVIEWER HAND (INSPECTOR). Focus on Security Audit, QA Gate. Use /review --parallel.',
    defaultCommand: '/review',
    keywords: ['review', 'audit', 'check', 'test', 'verify', 'security'],
  },
};

// Add 3 original HANDS to ALL_HANDS for full lookup
ALL_HANDS['PLANNER']  = HANDS.PLANNER;
ALL_HANDS['CODER']    = HANDS.CODER;
ALL_HANDS['REVIEWER'] = HANDS.REVIEWER;

// Fallback role when no match scores high enough
const FALLBACK_ROLE = ALL_HANDS['FULL_STACK_GENERALIST'];

/**
 * Backward-compat: map intent → 1 of 3 original HANDS
 * @param {string} intent
 * @returns {Object} HANDS.PLANNER | HANDS.CODER | HANDS.REVIEWER
 */
function getHandForIntent(intent) {
  if (intent === 'PLAN' || intent === 'RESEARCH') return HANDS.PLANNER;
  if (intent === 'REVIEW') return HANDS.REVIEWER;
  return HANDS.CODER;
}

/**
 * Lookup role by exact name
 * @param {string} name - Role name (e.g. 'REACT_ARCHITECT')
 * @returns {Object|null}
 */
function getHandByName(name) {
  return ALL_HANDS[name] || null;
}

/**
 * Semantic matching: find best matching role from 105 specialists
 * @param {string} taskText - Task content
 * @param {string} [intent='COOK'] - Detected intent
 * @returns {{ role: Object, score: number, fallback: boolean }}
 */
function matchRole(taskText, intent) {
  return _matchRole(taskText, intent, ALL_HANDS, FALLBACK_ROLE);
}

module.exports = {
  HANDS,
  ALL_HANDS,
  getHandForIntent,
  getHandByName,
  matchRole,
};
