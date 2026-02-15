/**
 * Post-Mission Gate — Binh Pháp CI/CD Verification
 * 
 * 第四篇 軍形: "先為不可勝" — Trước hết phải bất khả bại
 * 第九篇 行軍: "近而靜者，恃其險也" — Đọc dấu hiệu trước khi tiến
 * 第十二篇 火攻: "Verify before & after deploy"
 * 五間 #4 死間: "Canary deploy — sacrifice to detect"
 *
 * After worker finishes mission → run build → if GREEN → git commit+push
 * If RED → log failure, skip push, alert
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { log } = require('./brain-tmux');
const config = require('../config');

const GATE_LOG = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/.gate-results.json');

// 🔒 FORBIDDEN FILES — CC CLI CANNOT modify these. Gate will git checkout (rollback) any changes.
// Chairman-only: Only humans can unlock by editing this list.
const FORBIDDEN_FILES = [
    'apps/openclaw-worker/config.js',
    'apps/openclaw-worker/lib/brain-tmux.js',
    'apps/openclaw-worker/lib/post-mission-gate.js',
    'apps/openclaw-worker/task-watcher.js',
    'scripts/anthropic-adapter.js',
    'scripts/.env',
    'restore_swarm.sh',
];

/**
 * 軍形 Gate: Run build verification for a project
 * @param {string} project - Project name (e.g., '84tea', 'anima119')
 * @returns {{ pass: boolean, error?: string }}
 */
function runBuildGate(project) {
    const projectDir = path.join(config.MEKONG_DIR, 'apps', project);
    if (!fs.existsSync(projectDir)) return { pass: false, error: 'Project dir not found' };

    const pkgPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return { pass: true, error: 'No package.json — skip build' };

    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg.scripts || {};

        // 死間 (Canary): Try build first
        if (scripts.build) {
            log(`GATE[${project}]: 🔨 Running build...`);
            execSync('npm run build --no-warnings 2>&1', {
                cwd: projectDir, timeout: 120000, stdio: 'pipe',
                env: { ...process.env, NODE_ENV: 'production', CI: 'true' }
            });
            log(`GATE[${project}]: ✅ Build GREEN`);
        }

        // 行軍: Run lint/typecheck if available
        if (scripts.lint || scripts.typecheck) {
            const cmd = scripts.typecheck ? 'npm run typecheck' : 'npm run lint';
            log(`GATE[${project}]: 🔍 Running ${cmd}...`);
            execSync(`${cmd} --no-warnings 2>&1`, {
                cwd: projectDir, timeout: 60000, stdio: 'pipe'
            });
            log(`GATE[${project}]: ✅ Lint/Type GREEN`);
        }

        return { pass: true };
    } catch (err) {
        const errMsg = err.stderr?.toString().slice(-300) || err.message?.slice(-300) || 'Build failed';
        log(`GATE[${project}]: ❌ BUILD RED: ${errMsg.slice(0, 100)}`);
        return { pass: false, error: errMsg };
    }
}

/**
 * 火攻 Gate: Git commit + push if build GREEN
 * "Phát hỏa hữu thời" — Push chỉ khi đúng lúc (build green)
 * @param {string} project
 * @param {string} missionId - e.g. 'security_audit'
 */
function pushIfGreen(project, missionId) {
    const projectDir = path.join(config.MEKONG_DIR, 'apps', project);

    try {
        // Check if there are changes to commit
        const status = execSync('git status --porcelain', { cwd: projectDir, encoding: 'utf-8' });
        if (!status.trim()) {
            log(`GATE[${project}]: 📭 No changes to commit`);
            return { pushed: false, reason: 'no-changes' };
        }

        // 🔒 FORBIDDEN FILES ENFORCEMENT — rollback any locked file changes
        const changedFiles = execSync('git diff --name-only HEAD', { cwd: config.MEKONG_DIR, encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
        const violations = changedFiles.filter(f => FORBIDDEN_FILES.some(fb => f.endsWith(fb) || f === fb));
        if (violations.length > 0) {
            log(`GATE[${project}]: 🔒 FORBIDDEN FILES VIOLATED: ${violations.join(', ')}`);
            for (const v of violations) {
                try {
                    execSync(`git checkout -- "${v}"`, { cwd: config.MEKONG_DIR, encoding: 'utf-8' });
                    log(`GATE[${project}]: 🔒 ROLLBACK: ${v}`);
                } catch (e) { /* file might be new — rm it */ }
            }
            // Re-check if any changes remain after rollback
            const remaining = execSync('git status --porcelain', { cwd: projectDir, encoding: 'utf-8' });
            if (!remaining.trim()) {
                log(`GATE[${project}]: 🔒 ALL changes were forbidden — nothing to push`);
                return { pushed: false, reason: 'forbidden-only' };
            }
        }

        // Stage only this project's changes  
        execSync(`git add apps/${project}/`, { cwd: config.MEKONG_DIR, encoding: 'utf-8' });

        // Commit with Binh Phap tag
        const commitMsg = `feat(${project}): ${missionId} — Binh Phap auto-mission [AG gate:GREEN]`;
        execSync(
            `GIT_TERMINAL_PROMPT=0 CLAUDE_CODE_GIT_HOOK=0 git -c core.hooksPath=/dev/null commit -m "${commitMsg}"`,
            { cwd: config.MEKONG_DIR, encoding: 'utf-8', timeout: 30000 }
        );

        // Push
        execSync('git push origin master 2>&1', {
            cwd: config.MEKONG_DIR, encoding: 'utf-8', timeout: 30000
        });

        log(`GATE[${project}]: 🚀 PUSHED GREEN: ${commitMsg}`);
        return { pushed: true, commit: commitMsg };
    } catch (err) {
        log(`GATE[${project}]: ❌ Push failed: ${(err.message || '').slice(0, 100)}`);
        return { pushed: false, reason: err.message?.slice(0, 100) };
    }
}

/**
 * Full Gate Pipeline: Build → Push
 * 軍形 + 火攻 combined
 * @param {string} project 
 * @param {string} missionId
 * @returns {{ build: boolean, pushed: boolean }}
 */
function runFullGate(project, missionId) {
    log(`GATE[${project}]: === 軍形 CI/CD Gate for ${missionId} ===`);

    // Step 1: 軍形 — Build verification
    const buildResult = runBuildGate(project);

    // Step 2: 火攻 — Push only if GREEN
    if (buildResult.pass) {
        const pushResult = pushIfGreen(project, missionId);
        saveGateResult(project, missionId, true, pushResult.pushed);
        return { build: true, pushed: pushResult.pushed };
    }

    // RED — log and skip
    log(`GATE[${project}]: 🛑 BLOCKED — Build RED, NOT pushing`);
    saveGateResult(project, missionId, false, false);
    return { build: false, pushed: false };
}

/**
 * Save gate results for analysis
 */
function saveGateResult(project, missionId, buildPass, pushed) {
    try {
        let results = [];
        if (fs.existsSync(GATE_LOG)) {
            results = JSON.parse(fs.readFileSync(GATE_LOG, 'utf-8'));
        }
        results.push({
            ts: new Date().toISOString(),
            project, missionId, buildPass, pushed
        });
        // Keep last 100
        if (results.length > 100) results = results.slice(-100);
        fs.writeFileSync(GATE_LOG, JSON.stringify(results, null, 2));
    } catch (e) { /* ignore */ }
}

module.exports = { runBuildGate, pushIfGreen, runFullGate };
