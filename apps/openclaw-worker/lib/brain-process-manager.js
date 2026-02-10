/**
 * 🧠 Brain Process Manager v2 — Direct claude -p execution
 *
 * Replaces expect-based persistent brain with per-mission claude -p spawns.
 * CC CLI v2.1.38+ uses Ink (React TUI) which writes to alternate screen buffer,
 * making expect PTY detection impossible. This module bypasses TUI entirely
 * by using claude's non-interactive print mode (-p).
 *
 * Architecture change:
 *   v1: expect spawns CC CLI once → detect prompt → inject missions via file IPC
 *   v2: Node.js spawns claude -p per mission → stdout/stderr capture → exit code
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let currentProcess = null;
let missionCount = 0;

// Read API key: env var first, then ~/.mekong/api-key file fallback (for launchd)
function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const keyFile = path.join(process.env.HOME || '', '.mekong', 'api-key');
  try { return fs.readFileSync(keyFile, 'utf-8').trim(); } catch(e) { return ''; }
}

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] 🦞 ${msg}\n`;
  process.stderr.write(formatted);
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) {}
}

// No-op in v2 — missions spawn their own claude process
function spawnBrain() {
  log('🧠 BRAIN v2: Direct claude -p mode (no expect, no persistent TUI)');
  // Kill stale claude processes from previous runs
  try { execSync('pkill -x claude 2>/dev/null'); } catch(e) {}
  // Clean legacy IPC files
  try { fs.unlinkSync(config.MISSION_FILE); } catch(e) {}
  try { fs.unlinkSync(config.DONE_FILE); } catch(e) {}
}

function killBrain() {
  if (currentProcess) {
    log('🔪 Killing current mission process');
    currentProcess.kill('SIGTERM');
    setTimeout(() => {
      if (currentProcess && !currentProcess.killed) {
        currentProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Always "ready" in v2 — each mission spawns its own process
function isBrainAlive() { return true; }

/**
 * Run a single mission via claude -p (non-interactive print mode).
 * Spawns a fresh claude process, captures output, returns on exit.
 *
 * @param {string} prompt - The mission prompt text
 * @param {string} projectDir - Working directory for claude
 * @param {number} timeoutMs - Max execution time in milliseconds
 * @param {boolean} useContinue - Whether to use --continue flag
 * @returns {Promise<{success: boolean, result: string, elapsed: number}>}
 */
async function runMission(prompt, projectDir, timeoutMs, useContinue = false) {
  return new Promise((resolve) => {
    missionCount++;
    const missionNum = missionCount;

    const args = ['-p'];
    if (useContinue) args.push('--continue');
    args.push('--model', config.MODEL_NAME);
    args.push('--dangerously-skip-permissions');
    args.push(prompt);

    log(`🚀 MISSION #${missionNum}: claude -p (cwd: ${projectDir})`);
    log(`📝 PROMPT: ${prompt.slice(0, 150)}...`);

    const proc = spawn('claude', args, {
      cwd: projectDir,
      env: {
        ...process.env,
        ANTHROPIC_BASE_URL: `http://127.0.0.1:${config.PROXY_PORT}`,
        ANTHROPIC_API_KEY: getApiKey(),
      },
      // stdin MUST be 'ignore' — claude -p hangs if stdin is piped but never closed
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    currentProcess = proc;
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let lastLogTime = startTime;
    let outputLines = 0;

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      outputLines++;

      // Log interesting output lines (throttled)
      const now = Date.now();
      if (now - lastLogTime > 10000 || outputLines <= 5) {
        const lines = chunk.split('\n').filter(l => l.trim().length > 3);
        for (const line of lines.slice(0, 2)) {
          log(`OUTPUT #${missionNum}: ${line.slice(0, 150)}`);
        }
        lastLogTime = now;
      }
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      // Log errors immediately
      if (chunk.includes('Error') || chunk.includes('error') || chunk.includes('FAIL')) {
        log(`STDERR #${missionNum}: ${chunk.slice(0, 200)}`);
      }
    });

    // Mission timeout watchdog
    const timer = setTimeout(() => {
      log(`⏰ TIMEOUT: Mission #${missionNum} exceeded ${Math.round(timeoutMs/1000)}s`);
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL');
      }, 5000);
    }, timeoutMs);

    // Status logging every 60s
    const statusInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      try {
        const cpu = execSync(
          `ps aux | grep -E "claude" | grep -v grep | grep -v proxy | grep -v chroma | awk '{sum+=$3} END {print sum}'`,
          { encoding: 'utf-8' }
        ).trim();
        log(`⏳ Mission #${missionNum} working — ${elapsed}s — ${cpu}% CPU`);
      } catch(e) {
        log(`⏳ Mission #${missionNum} working — ${elapsed}s`);
      }
    }, 60000);

    proc.on('close', (code, signal) => {
      clearTimeout(timer);
      clearInterval(statusInterval);
      currentProcess = null;

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const success = code === 0;
      const result = signal === 'SIGTERM' ? 'timeout' :
                     code === 0 ? 'done' :
                     `exit_code_${code}`;

      if (success) {
        log(`✅ COMPLETE: Mission #${missionNum} (${elapsed}s)`);
      } else {
        log(`❌ FAILED: Mission #${missionNum} (${elapsed}s) — ${result}`);
        if (stderr) log(`STDERR: ${stderr.slice(0, 300)}`);
      }

      resolve({ success, result, elapsed });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      clearInterval(statusInterval);
      currentProcess = null;

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`💥 SPAWN ERROR: Mission #${missionNum} — ${err.message}`);
      resolve({ success: false, result: `spawn_error: ${err.message}`, elapsed });
    });
  });
}

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log };
