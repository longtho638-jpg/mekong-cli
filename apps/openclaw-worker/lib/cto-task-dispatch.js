/**
 * cto-task-dispatch.js
 * Task selection pipeline: TASK_POOLS, smart reality scan, external queue, pool fallback.
 * Returns a /cook or /debug command string, or null if nothing to dispatch.
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────
// TASK_POOLS — per-project round-robin pool (no LLM needed)
// ──────────────────────────────────────────────────────────────
const TASK_POOLS = {
    'well': [
        '/cook "Well: PayOS webhook — verify signature validation, idempotency key, retry logic, error response codes" --auto',
        '/cook "Well: Supabase RLS — audit all tables have row-level security policies, test with anon/auth roles" --auto',
        '/cook "Well: i18n audit — grep t() calls vs vi.ts/en.ts, fix missing keys, verify no raw strings in JSX" --auto',
        '/cook "Well: Auth flow — login/register/forgot-password, session refresh, protected route guards, error states" --auto',
        '/cook "Well: Error boundary — add React error boundaries for all route segments, fallback UI, error logging" --auto',
    ],
    'sophia-ai-factory': [
        '/cook "Sophia: Video pipeline — ffmpeg transcoding errors, timeout handling, retry logic, progress tracking" --auto',
        '/cook "Sophia: Campaign template — fix broken variables, preview mode, mobile responsive, edge cases" --auto',
        '/cook "Sophia: Deploy fix — TypeScript strict mode, build errors, verify Vercel deploy passes clean" --auto',
        '/cook "Sophia: AI service test — verify all AI endpoints respond, error handling, rate limit graceful degradation" --auto',
    ],
    'algo-trader': [
        '/cook "Algo-Trader: WebSocket reconnect — auto-reconnect on disconnect, exponential backoff, state recovery" --auto',
        '/cook "Algo-Trader: Order book sync — stale data detection, depth snapshot recovery, latency tracking" --auto',
        '/cook "Algo-Trader: API key rotate — secure key storage, rotation script, per-exchange rate limit tracking" --auto',
        '/cook "Algo-Trader: Exchange engine perf — spread calculation edge cases, slippage protection, benchmark latency" --auto',
    ],
    'mekong-cli': [
        '/cook "Mekong-CLI: Vibe SDK types — Pydantic models, type hints on all public methods, mypy clean" --auto',
        '/cook "Mekong-CLI: CI pipeline — fix pytest failures, flaky test detection, verify GitHub Actions green" --auto',
        '/cook "Mekong-CLI: Pytest fix — run full test suite, fix broken tests, ensure 100% pass rate" --auto',
        '/cook "Mekong-CLI: Agent module audit — fix imports in git_agent/file_agent/shell_agent, error handling" --auto',
    ],
};

const taskPoolCounters = {}; // project → round-robin index

/**
 * Get next task from project pool (round-robin).
 * @param {string} project
 * @returns {string|null}
 */
function getNextPoolTask(project) {
    const pool = TASK_POOLS[project];
    if (!pool || pool.length === 0) return null;
    if (!taskPoolCounters[project]) taskPoolCounters[project] = 0;
    const idx = taskPoolCounters[project] % pool.length;
    taskPoolCounters[project]++;
    return pool[idx];
}

/**
 * Smart reality scan: inspect project state, return highest-priority task or null.
 * Priority: test fail > uncommitted changes > dirty files > TODO overload > null
 * @param {{ idx: number, dir: string, project: string }} pane
 * @param {Function} log
 * @returns {string|null}
 */
function smartTaskFromReality(pane, log) {
    const { dir, project } = pane;

    // 1) npm test — failing tests = broken product
    try {
        const testOut = execSync('npm test 2>&1 | tail -10', {
            cwd: dir, encoding: 'utf-8', timeout: 30000
        }).trim();
        const failPat = /FAIL|failing|failed|✕|×|Error:|AssertionError/i;
        if (failPat.test(testOut)) {
            const snippet = testOut.split('\n').filter(l => failPat.test(l)).slice(0, 3).join('; ').slice(0, 200).replace(/"/g, '\\"');
            log(`P${pane.idx}: REALITY: npm test FAILED — ${snippet.slice(0, 80)}`);
            return `/debug "${project}: Test failures detected. Analyze: ${snippet}. Fix source code, run npm test to verify." --auto`;
        }
    } catch (e) {
        const stderr = (e.stderr || e.stdout || '').trim();
        if (stderr && !/missing script|ERR!.*test/.test(stderr)) {
            const snippet = stderr.split('\n').slice(-5).join('; ').slice(0, 200).replace(/"/g, '\\"');
            log(`P${pane.idx}: REALITY: npm test CRASHED — ${snippet.slice(0, 80)}`);
            return `/debug "${project}: Tests crashed. Error: ${snippet}. Fix and verify with npm test." --auto`;
        }
    }

    // 2) git diff --stat — uncommitted changes in code files
    try {
        const diffStat = execSync('git diff --stat 2>/dev/null', {
            cwd: dir, encoding: 'utf-8', timeout: 5000
        }).trim();
        if (diffStat) {
            const codeFiles = diffStat.split('\n')
                .filter(l => l.includes('|'))
                .map(l => l.split('|')[0].trim())
                .filter(f => /\.(ts|tsx|js|jsx|py)$/.test(f))
                .slice(0, 5);
            if (codeFiles.length > 0) {
                const fileList = codeFiles.join(', ');
                log(`P${pane.idx}: REALITY: ${codeFiles.length} changed files — ${fileList.slice(0, 80)}`);
                return `/cook "${project}: Uncommitted changes in ${fileList}. Review changes, run build/test, fix any errors, commit if clean." --auto`;
            }
        }
    } catch { }

    // 3) git status --porcelain — untracked/staged code files
    try {
        const gs = execSync('git status --porcelain 2>/dev/null | head -5', {
            cwd: dir, encoding: 'utf-8', timeout: 5000
        }).trim();
        if (gs) {
            const codeFiles = gs.split('\n')
                .filter(Boolean)
                .map(l => l.trim().slice(3))
                .filter(f => /\.(ts|tsx|py|js|jsx)$/.test(f));
            if (codeFiles.length > 0) {
                const fileList = codeFiles.slice(0, 3).join(', ');
                log(`P${pane.idx}: REALITY: dirty files — ${fileList}`);
                return `/cook "${project}: Dirty files: ${fileList}. Run build/test, fix errors, commit if clean." --auto`;
            }
        }
    } catch { }

    // 4) TODO/FIXME count > 10
    try {
        const todoOut = execSync(
            'grep -rc "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.claude 2>/dev/null | awk -F: \'{s+=$2} END {print s}\'',
            { cwd: dir, encoding: 'utf-8', timeout: 5000 }
        ).trim();
        const todoCount = parseInt(todoOut) || 0;
        if (todoCount > 10) {
            log(`P${pane.idx}: REALITY: ${todoCount} TODOs found — scheduling cleanup`);
            return `/cook "${project}: ${todoCount} TODO/FIXME found. Clean up top 10 most critical TODOs, resolve or remove stale ones. Run build after." --auto`;
        }
    } catch { }

    return null; // nothing actionable → fall through to pool
}

/**
 * Check external task queue directory for project-specific .txt files.
 * Moves consumed file to tasks/processed/.
 * @param {{ idx: number, project: string, isOpus?: boolean }} pane
 * @param {Function} log
 * @returns {string|null}
 */
function checkExternalQueue(pane, log) {
    const tasksDir = '/Users/macbookprom1/mekong-cli/tasks';
    try {
        if (!fs.existsSync(tasksDir)) return null;
        const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.txt'));
        if (files.length === 0) return null;

        const myTasks = files.filter(f => {
            const n = f.toLowerCase();
            const { project, isOpus } = pane;
            const matchers = {
                'openclaw-worker': n.includes('openclaw') || n.includes('brain') || n.includes('cto'),
                'well':            n.includes('well') || n.includes('wellnexus'),
                'mekong-cli':      n.includes('mekong') || n.includes('vibe') || n.includes('core'),
                'sophia-ai-factory': n.includes('sophia'),
                'algo-trader':     n.includes('algo') || n.includes('trading'),
            };
            if (isOpus) return n.includes('strategic') || n.includes('roiaas') || n.includes('binh_phap') || n.includes('10x') || n.includes('opus');
            return matchers[project] || false;
        });

        if (myTasks.length === 0) return null;

        myTasks.sort((a, b) => {
            const w = f => f.startsWith('CRITICAL') ? 3 : f.startsWith('HIGH') ? 2 : 1;
            return w(b) - w(a);
        });

        const taskFile = myTasks[0];
        const content = fs.readFileSync(path.join(tasksDir, taskFile), 'utf8');
        const safeContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').slice(0, 1500);
        const cookCmd = `/cook "EXTERNAL TASK: ${taskFile}\\n${safeContent}" --auto`;

        const procDir = path.join(tasksDir, 'processed');
        if (!fs.existsSync(procDir)) fs.mkdirSync(procDir);
        fs.renameSync(path.join(tasksDir, taskFile), path.join(procDir, taskFile));
        log(`P${pane.idx}: DISPATCHED external task: ${taskFile}`);
        return cookCmd;
    } catch (e) {
        log(`P${pane.idx}: External queue error: ${e.message}`);
        return null;
    }
}

module.exports = { TASK_POOLS, getNextPoolTask, smartTaskFromReality, checkExternalQueue };
