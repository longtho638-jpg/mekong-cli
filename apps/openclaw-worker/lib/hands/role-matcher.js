/**
 * Semantic Role Matcher — Maps task content to 1 of 105 specialist roles
 *
 * Weighted scoring algorithm:
 * - Exact keyword match in text: +10 points
 * - Partial match (substring): +5 points
 * - Intent alignment bonus (intent matches category): +3 points
 * - Minimum threshold to select specialist: 10 points (below threshold → FULL_STACK_GENERALIST)
 */

'use strict';

// Map intent string to category keywords for bonus alignment
const INTENT_CATEGORY_MAP = {
  PLAN: ['architect', 'plan', 'design', 'strategist', 'manager'],
  REVIEW: ['reviewer', 'auditor', 'scanner', 'tester', 'checker'],
  FIX: ['debugger', 'detective', 'fixer', 'specialist', 'hardener'],
  TEST: ['tester', 'engineer', 'qa', 'playwright', 'jest'],
  RESEARCH: ['analyst', 'researcher', 'expert', 'specialist'],
  COOK: ['builder', 'developer', 'coder', 'creator', 'engineer'],
};

// Minimum score threshold to select a specialist instead of fallback
const MIN_SCORE_THRESHOLD = 10;

/**
 * Normalize text to lowercase, remove special characters
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s\-./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate match score between task text and a role's keywords
 * @param {string} normalizedTask - Normalized task text
 * @param {string[]} keywords - Role keywords list
 * @returns {number} - Total score
 */
function scoreKeywords(normalizedTask, keywords) {
  let score = 0;
  for (const kw of keywords) {
    const normalizedKw = kw.toLowerCase();
    // Exact match (full word or phrase)
    if (normalizedTask.includes(normalizedKw)) {
      // Bonus for longer phrases (multi-word keywords are more significant)
      const wordCount = normalizedKw.split(' ').length;
      score += 10 + (wordCount - 1) * 3;
    } else {
      // Partial match: at least 1 word in keyword appears
      const kwWords = normalizedKw.split(' ');
      const partialMatches = kwWords.filter(w => w.length > 3 && normalizedTask.includes(w));
      if (partialMatches.length > 0) {
        score += 5 * partialMatches.length;
      }
    }
  }
  return score;
}

/**
 * Calculate alignment bonus between intent and role name
 * @param {string} intent - Intent string (PLAN, REVIEW, FIX, etc.)
 * @param {string} roleName - Lowercase role name
 * @returns {number} - Bonus points
 */
function intentAlignmentBonus(intent, roleName) {
  const intentKeywords = INTENT_CATEGORY_MAP[intent] || [];
  const lowerRole = roleName.toLowerCase();
  for (const ik of intentKeywords) {
    if (lowerRole.includes(ik)) return 3;
  }
  return 0;
}

/**
 * Find the best matching role for a task text
 * @param {string} taskText - Original task content
 * @param {string} [intent='COOK'] - Detected intent
 * @param {Object} allHands - Map name → role object
 * @param {Object} fallbackRole - Default role when no match
 * @returns {{ role: Object, score: number, fallback: boolean }}
 */
function matchRole(taskText, intent, allHands, fallbackRole) {
  const normalized = normalizeText(taskText);
  const intentStr = (intent || 'COOK').toUpperCase();

  let bestRole = fallbackRole;
  let bestScore = 0;

  for (const role of Object.values(allHands)) {
    // Skip fallback role during scoring
    if (role.name === 'FULL_STACK_GENERALIST') continue;

    const kwScore = scoreKeywords(normalized, role.keywords || []);
    const bonus = intentAlignmentBonus(intentStr, role.name);
    const totalScore = kwScore + bonus;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestRole = role;
    }
  }

  // If score is below threshold → use fallback
  const isFallback = bestScore < MIN_SCORE_THRESHOLD;
  if (isFallback) {
    bestRole = fallbackRole;
  }

  return {
    role: bestRole,
    score: bestScore,
    fallback: isFallback,
  };
}

module.exports = { matchRole, scoreKeywords, normalizeText, MIN_SCORE_THRESHOLD };
