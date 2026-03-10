/**
 * 🚀 Mission Dispatcher Tests — Routing, prompt building, safety gate, priority
 *
 * Covers: classifyPriority, detectProjectDir, isComplexRawMission,
 *         shouldChainCooks, splitTaskIntoSubtasks, stripPollution
 *
 * Binh Pháp: 軍爭 Ch.7 — 風林火山 routing per complexity
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

// Mock config with deterministic values
const MEKONG_DIR = '/tmp/test-dispatcher-mekong';
const mockConfig = {
    MEKONG_DIR,
    CLOUD_BRAIN_URL: 'http://127.0.0.1:20128',
    TASK_PATTERN: /^(?:CRITICAL_|HIGH_|MEDIUM_|LOW_)?(?:mission_)?.+\.txt$/,
    MISSION_TIMEOUT_MS: 60 * 60 * 1000,
    TIMEOUT_SIMPLE: 15 * 60 * 1000,
    TIMEOUT_MEDIUM: 30 * 60 * 1000,
    TIMEOUT_COMPLEX: 60 * 60 * 1000,
    TIMEOUT_STRATEGIC: 90 * 60 * 1000,
    PROJECTS: ['well', 'algo-trader'],
    COMPLEXITY: {
        STRATEGIC_KEYWORDS: ['bmad', 'product brief', 'prd', 'from scratch', 'greenfield'],
        COMPLEX_KEYWORDS: ['refactor', 'redesign', 'migrate', 'rewrite', 'architecture', 'security audit', 'deep scan', 'binh phap'],
        MEDIUM_KEYWORDS: ['feature', 'implement', 'security', 'audit', 'testing'],
    },
    SAFETY_GATE: {
        MAX_FILES_CHANGED: 15,
        MAX_DELETIONS: 500,
        FORBIDDEN_FILES: ['package.json', '.env', 'config.js'],
    },
    BINH_PHAP_TASKS: [],
    BMAD_WORKFLOW_MAP: {},
};

vi.mock('../config', () => mockConfig);
vi.mock('./brain-process-manager', () => ({ log: vi.fn(), runMission: vi.fn() }));
vi.mock('./system-status-registry', () => ({ isProAvailable: () => false }));
vi.mock('./telegram-client', () => ({ sendTelegram: vi.fn() }));
vi.mock('./m1-cooling-daemon', () => ({ preemptiveCool: vi.fn() }));
vi.mock('./mission-complexity-classifier', () => ({
    isTeamMission: () => false,
    buildAgentTeamBlock: () => '',
    buildDecomposedPrompt: (p) => p,
    detectIntent: () => ({ intent: 'implement' }),
}));
vi.mock('./post-mortem-reflector', () => ({ getTopLessons: () => [] }));
vi.mock('./learning-engine', () => ({
    getDispatchHints: () => ({}),
    getProjectHealthScore: () => 80,
}));
vi.mock('./safety-guard', () => ({ checkSafety: () => ({ safe: true }) }));
vi.mock('./strategy-optimizer', () => ({
    optimizeStrategy: (p) => p,
    classifyError: () => 'unknown',
}));

const require = createRequire(import.meta.url);

describe('Mission Dispatcher', () => {
    let dispatcher;

    beforeEach(() => {
        vi.resetModules();
        // Create project directories for routing tests
        const dirs = ['apps/well', 'apps/algo-trader', 'apps/openclaw-worker'];
        dirs.forEach(d => fs.mkdirSync(path.join(MEKONG_DIR, d), { recursive: true }));

        dispatcher = require('../lib/mission-dispatcher.js');
    });

    // ═══════════════════════════════════════════════════
    // classifyPriority
    // ═══════════════════════════════════════════════════

    describe('classifyPriority', () => {
        it('should classify AGI-related tasks as P0', () => {
            const result = dispatcher.classifyPriority('Upgrade AGI evolution engine');
            expect(result.priority).toBe('P0');
        });

        it('should classify security tasks as P0', () => {
            const result = dispatcher.classifyPriority('Fix security vulnerability in auth');
            expect(result.priority).toBe('P0');
        });

        it('should classify production down as P0', () => {
            const result = dispatcher.classifyPriority('Production down — fix immediately');
            expect(result.priority).toBe('P0');
        });

        it('should classify critical keyword as P0', () => {
            const result = dispatcher.classifyPriority('CRITICAL: database migration failed');
            expect(result.priority).toBe('P0');
        });

        it('should classify deep 10x as P0', () => {
            const result = dispatcher.classifyPriority('deep 10x scan of wellnexus');
            expect(result.priority).toBe('P0');
        });

        it('should classify hotfix as P0', () => {
            const result = dispatcher.classifyPriority('hotfix login redirect broken');
            expect(result.priority).toBe('P0');
        });

        it('should classify complex tasks as P1', () => {
            const result = dispatcher.classifyPriority('Implement new feature', 'complex');
            expect(result.priority).toBe('P1');
        });

        it('should classify refactor as P1', () => {
            const result = dispatcher.classifyPriority('Refactor auth module');
            expect(result.priority).toBe('P1');
        });

        it('should classify architecture tasks as P1', () => {
            const result = dispatcher.classifyPriority('Review architecture of API layer');
            expect(result.priority).toBe('P1');
        });

        it('should classify simple tasks as P2 (routine)', () => {
            const result = dispatcher.classifyPriority('Update button color');
            expect(result.priority).toBe('P2');
            expect(result.reason).toBe('Routine');
        });
    });

    // ═══════════════════════════════════════════════════
    // detectProjectDir
    // ═══════════════════════════════════════════════════

    describe('detectProjectDir', () => {
        it('should route well project from filename', () => {
            const dir = dispatcher.detectProjectDir('Fix bugs', 'mission_well_auto_fix.txt');
            expect(dir).toContain('apps/well');
        });

        it('should route algo-trader from filename', () => {
            const dir = dispatcher.detectProjectDir('Run tests', 'mission_algo-trader_auto_test.txt');
            expect(dir).toContain('apps/algo-trader');
        });

        it('should route from content keyword when filename is generic', () => {
            const dir = dispatcher.detectProjectDir('Fix algo-trader zero bug scan', 'mission_auto_generic.txt');
            expect(dir).toContain('apps/algo-trader');
        });

        it('should fallback to first PROJECTS entry for unknown content', () => {
            const dir = dispatcher.detectProjectDir('Do something random', 'random.txt');
            // PROJECTS[0] = 'mekong-cli' → routes['mekong-cli'] = '.' → returns MEKONG_DIR
            expect(dir).toBe(require('../config').MEKONG_DIR);
        });

        it('should prioritize filename over content for routing', () => {
            // Filename says well, content says algo-trader
            const dir = dispatcher.detectProjectDir('Fix algo-trader issue', 'mission_well_auto_fix.txt');
            expect(dir).toContain('apps/well');
        });
    });

    // ═══════════════════════════════════════════════════
    // isComplexRawMission
    // ═══════════════════════════════════════════════════

    describe('isComplexRawMission', () => {
        it('should detect refactor as complex', () => {
            expect(dispatcher.isComplexRawMission('refactor the auth module')).toBe(true);
        });

        it('should detect security audit as complex', () => {
            expect(dispatcher.isComplexRawMission('run a full security audit')).toBe(true);
        });

        it('should detect deep scan as complex', () => {
            expect(dispatcher.isComplexRawMission('execute deep scan on codebase')).toBe(true);
        });

        it('should NOT flag simple tasks as complex', () => {
            expect(dispatcher.isComplexRawMission('update button color')).toBe(false);
        });

        it('should NOT flag medium tasks as complex', () => {
            expect(dispatcher.isComplexRawMission('implement user login')).toBe(false);
        });
    });

    // ═══════════════════════════════════════════════════
    // shouldChainCooks
    // ═══════════════════════════════════════════════════

    describe('shouldChainCooks', () => {
        it('should NOT chain short tasks (<100 chars)', () => {
            expect(dispatcher.shouldChainCooks('Fix login bug')).toBe(false);
        });

        it('should chain long tasks with semicolons', () => {
            const longTask = 'First fix the login redirect issue in the auth module; then update the session timeout to 30 minutes; finally add rate limiting';
            expect(dispatcher.shouldChainCooks(longTask)).toBe(true);
        });

        it('should chain tasks with "và" separator (Vietnamese)', () => {
            const task = 'Sửa lỗi đăng nhập trong module auth và cập nhật thời gian session timeout lên 30 phút và thêm rate limiting cho API';
            expect(dispatcher.shouldChainCooks(task)).toBe(true);
        });

        it('should chain tasks with "and" separator', () => {
            const task = 'Fix the authentication module to use JWT tokens and implement refresh token rotation and add proper error handling';
            expect(dispatcher.shouldChainCooks(task)).toBe(true);
        });

        it('should chain tasks with multiple sentences', () => {
            const task = 'Fix the login page redirect. Update the session management to use JWT. Add proper CSRF protection. Implement rate limiting on auth endpoints.';
            expect(dispatcher.shouldChainCooks(task)).toBe(true);
        });
    });

    // ═══════════════════════════════════════════════════
    // splitTaskIntoSubtasks
    // ═══════════════════════════════════════════════════

    describe('splitTaskIntoSubtasks', () => {
        it('should split on semicolons', () => {
            const subtasks = dispatcher.splitTaskIntoSubtasks('Fix authentication module bugs; Update integration test coverage; Deploy to staging environment');
            expect(subtasks.length).toBeGreaterThanOrEqual(2);
        });

        it('should split on "và"', () => {
            const subtasks = dispatcher.splitTaskIntoSubtasks('Sửa lỗi authentication module và chạy integration tests cho toàn bộ project');
            expect(subtasks.length).toBeGreaterThanOrEqual(2);
        });

        it('should return single item for simple tasks', () => {
            const subtasks = dispatcher.splitTaskIntoSubtasks('Fix login bug');
            expect(subtasks.length).toBe(1);
        });

        it('should trim whitespace from subtasks', () => {
            const subtasks = dispatcher.splitTaskIntoSubtasks('Task A ;  Task B  ; Task C');
            subtasks.forEach(t => {
                expect(t).toBe(t.trim());
            });
        });
    });

    // ═══════════════════════════════════════════════════
    // stripPollution
    // ═══════════════════════════════════════════════════

    describe('stripPollution', () => {
        it('should strip WORKFLOW ORCHESTRATION block', () => {
            const dirty = 'Do task\nWORKFLOW ORCHESTRATION (MANDATORY):\nStep 1\nCORE PRINCIPLES:\nAvoid introducing bugs.\nReal content';
            const clean = dispatcher.stripPollution(dirty);
            expect(clean).not.toContain('WORKFLOW ORCHESTRATION');
            expect(clean).toContain('Real content');
        });

        it('should strip separator lines (━━━)', () => {
            const dirty = 'Before\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAfter';
            const clean = dispatcher.stripPollution(dirty);
            expect(clean).not.toContain('━━━');
        });

        it('should collapse triple newlines', () => {
            const dirty = 'Line 1\n\n\n\n\nLine 2';
            const clean = dispatcher.stripPollution(dirty);
            expect(clean).not.toMatch(/\n{3,}/);
        });

        it('should preserve clean content unchanged', () => {
            const clean = 'Fix login bug and update tests';
            expect(dispatcher.stripPollution(clean)).toBe(clean);
        });
    });

    // ═══════════════════════════════════════════════════
    // Safety Gate constants
    // ═══════════════════════════════════════════════════

    describe('Safety Gate config', () => {
        it('should enforce MAX_FILES_CHANGED=15', () => {
            expect(mockConfig.SAFETY_GATE.MAX_FILES_CHANGED).toBe(15);
        });

        it('should enforce MAX_DELETIONS=500', () => {
            expect(mockConfig.SAFETY_GATE.MAX_DELETIONS).toBe(500);
        });

        it('should block forbidden files', () => {
            const forbidden = mockConfig.SAFETY_GATE.FORBIDDEN_FILES;
            expect(forbidden).toContain('package.json');
            expect(forbidden).toContain('.env');
            expect(forbidden).toContain('config.js');
        });
    });
});
