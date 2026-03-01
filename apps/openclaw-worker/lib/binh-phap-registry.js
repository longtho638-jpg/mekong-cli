/**
 * Binh Pháp Registry — DNA #5 ClaudeKit Deep Fusion v5.0
 *
 * Pure data module that codifies BINH_PHAP_MASTER.md mappings:
 *   - 13 Agents × Ngũ Đức Tướng
 *   - 28 Commands × Thất Kế Routing
 *   - 9 Cửu Địa × Skill Sets
 *
 * Used by mission-dispatcher.js for mission log annotation.
 * No side effects — import-safe.
 */

// 13 Agents × Ngũ Đức (將 — Tướng)
const AGENTS = {
    planner: { role: '軍師 Quân Sư', virtue: 'TRÍ 智', chapter: '始計 Ch.1' },
    'fullstack-developer': { role: '先鋒 Tiên Phong', virtue: 'DŨNG 勇', chapter: '作戰 Ch.2' },
    debugger: { role: '斥候 Trinh Sát', virtue: 'TRÍ 智', chapter: '行軍 Ch.9' },
    tester: { role: '監軍 Giám Quân', virtue: 'NGHIÊM 嚴', chapter: '軍形 Ch.4' },
    'code-reviewer': { role: '御史 Ngự Sử', virtue: 'NGHIÊM 嚴', chapter: '軍形 Ch.4' },
    'docs-manager': { role: '書記 Thư Ký', virtue: 'TÍN 信', chapter: '用間 Ch.13' },
    'project-manager': { role: '督軍 Đốc Quân', virtue: 'TÍN 信', chapter: '地形 Ch.10' },
    'journal-writer': { role: '太史 Thái Sử', virtue: 'TÍN 信', chapter: '用間 Ch.13' },
    'git-manager': { role: '輜重 Hậu Cần', virtue: 'NGHIÊM 嚴', chapter: '火攻 Ch.12' },
    'ui-ux-designer': { role: '工匠 Công Tượng', virtue: 'NHÂN 仁', chapter: '兵勢 Ch.5' },
    brainstormer: { role: '策士 Sách Sĩ', virtue: 'TRÍ 智', chapter: '謀攻 Ch.3' },
    researcher: { role: '間諜 Gián Điệp', virtue: 'TRÍ 智', chapter: '用間 Ch.13' },
    'mcp-manager': { role: '器械 Khí Giới', virtue: 'NHÂN 仁', chapter: '九變 Ch.8' },
};

// 28 Commands × Thất Kế Routing (計 — Kế Sách)
const COMMANDS = {
    '/plan': { principle: '多算勝', chapter: '始計 Ch.1' },
    '/plan:fast': { principle: '兵貴勝', chapter: '作戰 Ch.2' },
    '/plan:hard': { principle: '知己知彼', chapter: '謀攻 Ch.3' },
    '/plan:two': { principle: '奇正相生', chapter: '兵勢 Ch.5' },
    '/plan:parallel': { principle: '以迂為直', chapter: '軍爭 Ch.7' },
    '/plan:ci': { principle: '近而靜者恃其險', chapter: '行軍 Ch.9' },
    '/plan:cro': { principle: '避實擊虛', chapter: '虛實 Ch.6' },
    '/plan:archive': { principle: '有所不爭', chapter: '九變 Ch.8' },
    '/plan:validate': { principle: '法令孰行', chapter: '始計 Ch.1' },
    '/cook': { principle: '兵之情主速', chapter: '作戰 Ch.2' },
    '/cook --fast': { principle: '疾如風', chapter: '軍爭 Ch.7' },
    '/cook --auto': { principle: '徐如林', chapter: '軍爭 Ch.7' },
    '/cook --parallel': { principle: '侵掠如火', chapter: '軍爭 Ch.7' },
    '/cook --no-test': { principle: '必死者可殺', chapter: '九變 Ch.8' },
    '/debug': { principle: '善守者藏九地之下', chapter: '軍形 Ch.4' },
    '/test': { principle: '善戰者先為不可勝', chapter: '軍形 Ch.4' },
    '/test:ui': { principle: '善攻者動九天之上', chapter: '軍形 Ch.4' },
    '/review': { principle: '賞罰孰明', chapter: '始計 Ch.1' },
    '/review:codebase': { principle: '全軍為上', chapter: '謀攻 Ch.3' },
    '/check-and-commit': { principle: '發火有時', chapter: '火攻 Ch.12' },
    '/ask': { principle: '先知者不可取於鬼神', chapter: '用間 Ch.13' },
    '/scout': { principle: '生間者反報也', chapter: '用間 Ch.13' },
    '/watzup': { principle: '天下事', chapter: '地形 Ch.10' },
    '/kanban': { principle: '編隊', chapter: '軍爭 Ch.7' },
    '/journal': { principle: '太史公記', chapter: '用間 Ch.13' },
    '/docs:update': { principle: '兵法', chapter: '謀攻 Ch.3' },
    '/bootstrap': { principle: '立軍', chapter: '始計 Ch.1' },
    '/worktree': { principle: '分兵', chapter: '虛實 Ch.6' },
};

// 5 Lớp Factory Pipeline 🏭
const FACTORY_STAGES = {
    SPEC: { principle: '廟算 (Miếu Toán - Định khuôn mẫu)', chapter: '始計 Ch.1' },
    PLAN: { principle: '校計 (Hiệu Kế - Lên kế hoạch)', chapter: '始計 Ch.1' },
    BUILD: { principle: '兵之情主速 (Binh quý thần tốc)', chapter: '軍爭 Ch.7' },
    VERIFY: { principle: '水之形避高而趨下 (Tìm chỗ rỗng test)', chapter: '虛實 Ch.6' },
    SHIP: { principle: '動如雷震 (Động như sấm sét)', chapter: '行軍 Ch.9' },
};

// 9 Cửu Địa × Skill Sets (地 — Địa Thế)
const CUU_DIA = {
    tan: { name: '散地 Tản Địa', situation: 'Dev local', skills: ['planning', 'brainstorm', 'sequential-thinking', 'research'] },
    khinh: { name: '輕地 Khinh Địa', situation: 'Feature branch', skills: ['cook', 'fix', 'scout', 'git', 'code-review'] },
    tranh: { name: '爭地 Tranh Địa', situation: 'Staging deploy', skills: ['web-testing', 'devops', 'frontend-development', 'backend-development'] },
    giao: { name: '交地 Giao Địa', situation: 'API contracts', skills: ['databases', 'mcp-builder', 'mcp-management', 'better-auth'] },
    cu: { name: '衢地 Cù Địa', situation: 'Multi-platform', skills: ['shopify', 'payment-integration', 'mobile-development', 'google-adk-python'] },
    trong: { name: '重地 Trọng Địa', situation: 'Production deep', skills: ['debug', 'problem-solving', 'context-engineering', 'chrome-devtools'] },
    phi: { name: '圮地 Phí Địa', situation: 'Legacy code', skills: ['repomix', 'docs-seeker', 'document-skills', 'find-skills'] },
    vi: { name: '圍地 Vi Địa', situation: 'Deadline crunch', skills: ['cook', 'fix', 'plans-kanban', 'copywriting'] },
    tu: { name: '死地 Tử Địa', situation: 'Prod down', skills: ['debug', 'devops', 'agent-browser', 'gkg'] },
};

/**
 * Get Binh Pháp annotation for a command string.
 * @param {string} cmd - e.g. '/cook --fast' or '/plan:hard'
 * @returns {{ principle: string, chapter: string } | null}
 */
function getCommandAnnotation(cmd) {
    if (!cmd) return null;
    const normalized = cmd.trim().toLowerCase();
    // Try exact match first, then prefix match
    return COMMANDS[normalized] || Object.entries(COMMANDS).find(
        ([key]) => normalized.startsWith(key.toLowerCase())
    )?.[1] || null;
}

/**
 * Get agent's Binh Pháp role mapping.
 * @param {string} agentName
 * @returns {{ role: string, virtue: string, chapter: string } | null}
 */
function getAgentRole(agentName) {
    return AGENTS[agentName] || null;
}

module.exports = {
    AGENTS,
    COMMANDS,
    CUU_DIA,
    getCommandAnnotation,
    getAgentRole,
};
