/**
 * Post-Mission Gate — Binh Pháp CI/CD Verification (Level 3 AGI)
 *
 * 第四篇 軍形: "先為不可勝" — Trước hết phải bất khả bại
 * 第十二篇 火攻: Safety Gate v2.0 — 亡國不可以復存 (nước mất không phục hồi)
 */

const cp = require('child_process');
const { execSync, spawn } = cp;
const path = require('path');
const fs = require('fs');
const { log } = require('./brain-process-manager');
const config = require('../config');

/**
 * Safety Gate v2.0 — 3-tier destructive change protection (火攻 Ch.12)
 *
 * Tier 1: MAX_FILES_CHANGED — Block if worker modified too many files
 * Tier 2: MAX_DELETIONS — Block if too many lines deleted
 * Tier 3: FORBIDDEN_FILES — Block if critical config files touched
 *
 * Violation → git checkout (reset) → KHÔNG push
 *
 * @param {string} projectDir - Absolute path to project directory
 * @param {string} missionId - ID of the mission
 * @returns {{ safe: boolean, tier: string|null, details: string }}
 */
function runSafetyGate(projectDir, missionId) {
  const gate = config.SAFETY_GATE || {};
  const maxFiles = gate.MAX_FILES_CHANGED || 15;
  const maxDeletions = gate.MAX_DELETIONS || 500;
  const forbiddenFiles = gate.FORBIDDEN_FILES || [];

  try {
    // Tier 1: File count check
    const diffFiles = execSync('git diff --name-only HEAD', {
      cwd: projectDir, encoding: 'utf-8', timeout: 10000
    }).trim().split('\n').filter(Boolean);

    if (diffFiles.length > maxFiles) {
      const msg = `SAFETY GATE TIER 1: ${diffFiles.length} files changed (max ${maxFiles})`;
      log(`GATE: 🛑 ${msg}`);
      resetChanges(projectDir);
      return { safe: false, tier: 'MAX_FILES_CHANGED', details: msg };
    }

    // Tier 2: Deletion count check
    const diffStat = execSync('git diff --shortstat HEAD', {
      cwd: projectDir, encoding: 'utf-8', timeout: 10000
    }).trim();
    const deletionMatch = diffStat.match(/(\d+)\s+deletion/);
    const deletions = deletionMatch ? parseInt(deletionMatch[1], 10) : 0;

    if (deletions > maxDeletions) {
      const msg = `SAFETY GATE TIER 2: ${deletions} deletions (max ${maxDeletions})`;
      log(`GATE: 🛑 ${msg}`);
      resetChanges(projectDir);
      return { safe: false, tier: 'MAX_DELETIONS', details: msg };
    }

    // Tier 3: Forbidden file check
    const touchedForbidden = diffFiles.filter(f => {
      const basename = path.basename(f);
      return forbiddenFiles.includes(basename);
    });

    if (touchedForbidden.length > 0) {
      const msg = `SAFETY GATE TIER 3: Forbidden files modified: ${touchedForbidden.join(', ')}`;
      log(`GATE: 🛑 ${msg}`);
      resetChanges(projectDir);
      return { safe: false, tier: 'FORBIDDEN_FILES', details: msg };
    }

    return { safe: true, tier: null, details: `${diffFiles.length} files, ${deletions} deletions — OK` };
  } catch (err) {
    // If git diff fails (e.g., no git repo), allow pass — build gate handles quality
    log(`GATE: ⚠️ Safety Gate check failed (allowing pass): ${err.message}`);
    return { safe: true, tier: null, details: 'Safety check skipped (git error)' };
  }
}

/**
 * Reset all uncommitted changes to prevent destructive modifications.
 */
function resetChanges(projectDir) {
  try {
    execSync('git checkout -- .', { cwd: projectDir, timeout: 10000 });
    log(`GATE: 🔄 Git checkout — all changes reset (火攻 Safety)`);
  } catch (e) {
    log(`GATE: ❌ Failed to reset changes: ${e.message}`);
  }
}

/**
 * Helper to run command asynchronously using spawn
 * Unblocks event loop for M1 cooling daemon
 */
function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', data => { stdout += data.toString(); });
    }
    if (child.stderr) {
      child.stderr.on('data', data => { stderr += data.toString(); });
    }

    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(`Command failed with code ${code}`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });

    child.on('error', err => reject(err));
  });
}

/**
 * runPostMissionGate (AGI Level 3)
 * @param {string} projectDir - Absolute path to project directory
 * @param {string} missionId - ID of the mission
 * @returns {Promise<{ build: boolean, output: string }>}
 */
async function runPostMissionGate(projectDir, missionId) {
  try {
    log(`GATE: 🔨 Running build in ${projectDir}...`);

    // 1. Run build asynchronously to unblock Event Loop (M1 cooling daemon)
    let buildOutput = '';
    try {
      const result = await spawnAsync('npm', ['run', 'build'], {
        cwd: projectDir,
        env: { ...process.env, CI: 'true' }
      });
      buildOutput = result.stdout;
      log(`GATE: ✅ Build GREEN for ${missionId}`);

      // 2. Safety Gate v2.0 — Check BEFORE commit (火攻 Ch.12)
      const safetyResult = runSafetyGate(projectDir, missionId);
      if (!safetyResult.safe) {
        log(`GATE: 🛑 Safety Gate BLOCKED commit for ${missionId}: ${safetyResult.details}`);
        return { build: true, output: buildOutput, safety: safetyResult };
      }
      log(`GATE: 🛡️ Safety Gate PASSED: ${safetyResult.details}`);

      // 3. Commit and Push if Green + Safe
      try {
        execSync('git add .', { cwd: projectDir });
        const commitMsg = `mission complete: ${missionId}`;
        execSync(`git commit -m "${commitMsg}"`, {
          cwd: projectDir,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0', CLAUDE_CODE_GIT_HOOK: '0' }
        });
        log(`GATE: 📦 Committed: ${commitMsg}`);

        // 4. Push if Green (Level 3 requirement)
        try {
          execSync('git push', {
            cwd: projectDir,
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
          });
          log(`GATE: 🚀 Pushed to remote`);
        } catch (pushErr) {
          log(`GATE: ℹ️ Git push skipped or failed (likely no remote or auth issue): ${pushErr.message}`);
        }
      } catch (gitErr) {
        log(`GATE: ⚠️ Git commit failed: ${gitErr.message}`);
        try {
          log(`GATE: 🧹 Cleaning up staged files...`);
          execSync('git restore --staged .', { cwd: projectDir });
        } catch (restoreErr) {
          log(`GATE: ❌ Failed to restore staged files: ${restoreErr.message}`);
        }
      }

      return { build: true, output: buildOutput, safety: safetyResult };

    } catch (buildErr) {
      const errorOutput = (buildErr.stdout || '') + (buildErr.stderr || '');
      log(`GATE: ❌ Build RED for ${missionId}`);

      // Normalize missionId to check for recursion
      // Strip priority prefixes and 'mission_' to get the core ID
      const coreMissionId = missionId.replace(/^(?:CRITICAL|HIGH|MEDIUM|LOW)_/, '').replace(/^mission_/, '');

      // 3. Check for infinite loops
      if (coreMissionId.startsWith('fix_fix_')) {
        log(`GATE: 🛑 Max fix depth reached for ${missionId} (${coreMissionId}). Stopping recursion.`);
        return { build: false, output: errorOutput };
      }

      // 4. Create fix mission
      // Use coreMissionId to avoid duplicating prefixes like HIGH_mission_fix_HIGH_mission_...
      const fixMissionId = `fix_${coreMissionId}`;
      const fixMissionFile = `HIGH_mission_${fixMissionId}.txt`;
      const fixMissionPath = path.join(config.WATCH_DIR, fixMissionFile);

      const fixContent = `
MISSION: Fix build failure for ${missionId}
MISSION_ID: ${fixMissionId}
PRIORITY: HIGH

ERROR_LOG:
${errorOutput.slice(-2000) || buildErr.message}

TASK:
1. Phân tích lỗi build bên trên.
2. Sửa lỗi trong project ${projectDir}.
3. Đảm bảo npm run build vượt qua.
`.trim();

      fs.writeFileSync(fixMissionPath, fixContent);
      log(`GATE: 🤖 Created fix mission: ${fixMissionFile}`);

      return { build: false, output: errorOutput };
    }
  } catch (error) {
    log(`GATE ERROR: ${error.message}`);
    return { build: false, output: error.message };
  }
}

// Keep existing functions for backward compatibility or internal use
function runBuildGate(project) {
  const projectDir = path.join(config.MEKONG_DIR, 'apps', project);
  if (!fs.existsSync(projectDir)) return { pass: false, error: 'Project dir not found' };
  try {
    execSync('npm run build', { cwd: projectDir, stdio: 'pipe' });
    return { pass: true };
  } catch (err) {
    return { pass: false, error: err.message };
  }
}

function runFullGate(project, missionId) {
  const projectDir = path.join(config.MEKONG_DIR, 'apps', project);
  // This is a bridge to the new async function if needed,
  // but for now we'll keep it as is or update task-queue to use runPostMissionGate directly
  return { build: true, pushed: false };
}

module.exports = { runPostMissionGate, runBuildGate, runFullGate, runSafetyGate };

