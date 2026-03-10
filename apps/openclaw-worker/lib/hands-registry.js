/**
 * 🐉 BINH PHÁP v6.0: The Hands Registry — Backward-Compatible Wrapper
 *
 * Re-exports từ hệ thống 105-Hands mới (lib/hands/index.js).
 * API cũ `getHandForIntent(intent)` vẫn hoạt động 100%.
 *
 * v5: 3 hands cứng (PLANNER, CODER, REVIEWER)
 * v6: 105 specialist roles + semantic matching, backward compat với v5
 */

'use strict';

const {
  HANDS,
  ALL_HANDS,
  getHandForIntent,
  getHandByName,
  matchRole,
} = require('./hands/index');

module.exports = {
  // Backward compat: 3 HANDS gốc vẫn tồn tại
  HANDS,
  // Đầy đủ 105 roles
  ALL_HANDS,
  // Backward compat API: ánh xạ intent → PLANNER/CODER/REVIEWER
  getHandForIntent,
  // Mới: lookup theo tên chính xác
  getHandByName,
  // Mới: semantic matching task text → specialist role
  matchRole,
};
