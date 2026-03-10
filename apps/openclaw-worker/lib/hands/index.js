/**
 * 🐉 Hands Index — 105 Specialist Roles Registry
 *
 * Xuất HANDS map (3 roles gốc backward-compat) + ALL_HANDS (105 roles) +
 * getHandForIntent() + getHandByName() + matchRole()
 */

'use strict';

// --- Load tất cả categories ---
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

// --- Gộp tất cả 105 roles thành mảng phẳng ---
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

// --- Backward-compat: 3 HANDS gốc (PLANNER, CODER, REVIEWER) ---
// Giữ nguyên cấu trúc cũ để không phá vỡ mission-dispatcher
const HANDS = {
  PLANNER: {
    name: 'PLANNER',
    displayName: 'Planner Hand (Quân Sư)',
    // Trường instructions giữ nguyên để backward compat
    instructions: '🔥 BẠN LÀ PLANNER HAND (QUÂN SƯ). Tập trung vào Architecture, Specification, và BMM Strategic Planning. KHÔNG được implement code cẩu thả. LUÔN LUÔN dùng /plan:hard hoặc /plan:parallel. KHI GẶP MENU/CÂU HỎI TƯƠNG TÁC TỪ COMMANDS HOẶC CẦN RA QUYẾT ĐỊNH: TUYỆT ĐỐI KHÔNG ĐƯỢC DỪNG LẠI HỎI USER. PHẢI TỰ ĐỌC /Users/macbookprom1/mekong-cli/apps/openclaw-worker/BINH_PHAP_MASTER.md THAM CHIẾU VÀ TỰ QUYẾT ĐỊNH ĐÁP ÁN/HÀNH ĐỘNG.',
    systemPrompt: 'BẠN LÀ PLANNER HAND (QUÂN SƯ). Tập trung Architecture, Strategic Planning. Dùng /plan:hard hoặc /plan:parallel.',
    defaultCommand: '/plan:hard',
    keywords: ['plan', 'architect', 'design', 'strategy', 'research', 'analyze'],
  },
  CODER: {
    name: 'CODER',
    displayName: 'Coder Hand (Tiên Phong)',
    instructions: '🔥 BẠN LÀ CODER HAND (TIÊN PHONG). Tập trung vào Atomic Implementation, Bug Fixing, và Performance. Kế thừa plan từ Quân Sư. LUÔN LUÔN dùng /cook --fast hoặc /cook --parallel. KHI GẶP MENU/CÂU HỎI TƯƠNG TÁC TỪ COMMANDS HOẶC CẦN RA QUYẾT ĐỊNH: TUYỆT ĐỐI KHÔNG ĐƯỢC DỪNG LẠI HỎI USER. PHẢI TỰ ĐỌC /Users/macbookprom1/mekong-cli/apps/openclaw-worker/BINH_PHAP_MASTER.md THAM CHIẾU VÀ TỰ QUYẾT ĐỊNH ĐÁP ÁN/HÀNH ĐỘNG.',
    systemPrompt: 'BẠN LÀ CODER HAND (TIÊN PHONG). Tập trung Atomic Implementation, Bug Fixing. Dùng /cook --fast hoặc /cook --parallel.',
    defaultCommand: '/cook --fast',
    keywords: ['implement', 'build', 'fix', 'code', 'develop', 'create'],
  },
  REVIEWER: {
    name: 'REVIEWER',
    displayName: 'Reviewer Hand (Ngự Sử)',
    instructions: '🔥 BẠN LÀ REVIEWER HAND (NGỰ SỬ). Tập trung vào Security Audit, QA Gate, và Binh Pháp Certification. KHÔNG được cho qua nếu thiếu test hoặc vi phạm code style. KHI GẶP MENU/CÂU HỎI TƯƠNG TÁC TỪ COMMANDS HOẶC CẦN RA QUYẾT ĐỊNH: TUYỆT ĐỐI KHÔNG ĐƯỢC DỪNG LẠI HỎI USER. PHẢI TỰ ĐỌC /Users/macbookprom1/mekong-cli/apps/openclaw-worker/BINH_PHAP_MASTER.md THAM CHIẾU VÀ TỰ QUYẾT ĐỊNH ĐÁP ÁN/HÀNH ĐỘNG.',
    systemPrompt: 'BẠN LÀ REVIEWER HAND (NGỰ SỬ). Tập trung Security Audit, QA Gate. Dùng /review --parallel.',
    defaultCommand: '/review',
    keywords: ['review', 'audit', 'check', 'test', 'verify', 'security'],
  },
};

// Thêm 3 HANDS gốc vào ALL_HANDS để lookup đầy đủ
ALL_HANDS['PLANNER']  = HANDS.PLANNER;
ALL_HANDS['CODER']    = HANDS.CODER;
ALL_HANDS['REVIEWER'] = HANDS.REVIEWER;

// Fallback role khi không có match đủ điểm
const FALLBACK_ROLE = ALL_HANDS['FULL_STACK_GENERALIST'];

/**
 * Backward-compat: ánh xạ intent → 1 trong 3 HANDS gốc
 * @param {string} intent
 * @returns {Object} HANDS.PLANNER | HANDS.CODER | HANDS.REVIEWER
 */
function getHandForIntent(intent) {
  if (intent === 'PLAN' || intent === 'RESEARCH') return HANDS.PLANNER;
  if (intent === 'REVIEW') return HANDS.REVIEWER;
  return HANDS.CODER;
}

/**
 * Lookup role theo tên chính xác
 * @param {string} name - Tên role (vd: 'REACT_ARCHITECT')
 * @returns {Object|null}
 */
function getHandByName(name) {
  return ALL_HANDS[name] || null;
}

/**
 * Semantic matching: tìm role phù hợp nhất từ 105 specialists
 * @param {string} taskText - Nội dung task
 * @param {string} [intent='COOK'] - Intent đã detect
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
