/**
 * Semantic Role Matcher — Ánh xạ nội dung task sang 1/105 vai trò chuyên gia
 *
 * Thuật toán scoring có trọng số:
 * - Khớp keyword chính xác trong text: +10 điểm
 * - Khớp một phần (substring): +5 điểm
 * - Bonus intent alignment (intent khớp category): +3 điểm
 * - Ngưỡng tối thiểu để chọn specialist: 10 điểm (dưới ngưỡng → FULL_STACK_GENERALIST)
 */

'use strict';

// Map intent string sang category keywords để bonus alignment
const INTENT_CATEGORY_MAP = {
  PLAN: ['architect', 'plan', 'design', 'strategist', 'manager'],
  REVIEW: ['reviewer', 'auditor', 'scanner', 'tester', 'checker'],
  FIX: ['debugger', 'detective', 'fixer', 'specialist', 'hardener'],
  TEST: ['tester', 'engineer', 'qa', 'playwright', 'jest'],
  RESEARCH: ['analyst', 'researcher', 'expert', 'specialist'],
  COOK: ['builder', 'developer', 'coder', 'creator', 'engineer'],
};

// Ngưỡng score tối thiểu để chọn specialist thay vì fallback
const MIN_SCORE_THRESHOLD = 10;

/**
 * Chuẩn hóa text về lowercase, bỏ ký tự đặc biệt
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
 * Tính điểm match giữa task text và keywords của một role
 * @param {string} normalizedTask - Task text đã normalize
 * @param {string[]} keywords - Danh sách keywords của role
 * @returns {number} - Tổng điểm
 */
function scoreKeywords(normalizedTask, keywords) {
  let score = 0;
  for (const kw of keywords) {
    const normalizedKw = kw.toLowerCase();
    // Khớp chính xác (từ toàn phần hoặc cụm từ)
    if (normalizedTask.includes(normalizedKw)) {
      // Bonus nếu là cụm từ dài hơn (keyword nhiều từ quan trọng hơn)
      const wordCount = normalizedKw.split(' ').length;
      score += 10 + (wordCount - 1) * 3;
    } else {
      // Khớp một phần: ít nhất 1 từ trong keyword xuất hiện
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
 * Tính bonus alignment giữa intent và tên role
 * @param {string} intent - Intent string (PLAN, REVIEW, FIX, etc.)
 * @param {string} roleName - Tên role viết thường
 * @returns {number} - Điểm bonus
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
 * Tìm vai trò phù hợp nhất cho task text
 * @param {string} taskText - Nội dung task gốc
 * @param {string} [intent='COOK'] - Intent đã detect
 * @param {Object} allHands - Map name → role object
 * @param {Object} fallbackRole - Role mặc định khi không match
 * @returns {{ role: Object, score: number, fallback: boolean }}
 */
function matchRole(taskText, intent, allHands, fallbackRole) {
  const normalized = normalizeText(taskText);
  const intentStr = (intent || 'COOK').toUpperCase();

  let bestRole = fallbackRole;
  let bestScore = 0;

  for (const role of Object.values(allHands)) {
    // Bỏ qua fallback role khi scoring
    if (role.name === 'FULL_STACK_GENERALIST') continue;

    const kwScore = scoreKeywords(normalized, role.keywords || []);
    const bonus = intentAlignmentBonus(intentStr, role.name);
    const totalScore = kwScore + bonus;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestRole = role;
    }
  }

  // Nếu score không đạt ngưỡng → dùng fallback
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
