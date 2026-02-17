/**
 * Brain Process Manager — External-only mode
 *
 * CC CLI runs in a visible terminal (VS Code). Task-watcher writes missions
 * to MISSION_FILE, polls DONE_FILE for completion. No tmux, no expect,
 * no claude -p subprocess.
 *
 * Exports: spawnBrain, killBrain, isBrainAlive, runMission, log
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let missionCount = 0;

// --- Shared helpers ---

function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const keyFile = path.join(process.env.HOME || '', '.mekong', 'api-key');
  try { return fs.readFileSync(keyFile, 'utf-8').trim(); } catch (e) { return ''; }
}

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] [tom-hum] ${msg}\n`;
  process.stderr.write(formatted);
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) {}
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// --- External mode: brain managed in a visible terminal ---

function isBrainAlive() {
  try {
    execSync('pgrep -f "claude"', { timeout: 3000 });
    return true;
  } catch (e) { return false; }
}

async function runMission(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();

  if (!isBrainAlive()) {
    log(`Brain not running — cannot dispatch mission #${num}`);
    return { success: false, result: 'brain_not_running', elapsed: 0 };
  }

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: external`);

  // Clean done file before dispatching
  try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}

  // Write mission file — external brain picks it up
  let fullPrompt = prompt;
  if (projectDir !== config.MEKONG_DIR) {
    fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
  }
  fs.writeFileSync(config.MISSION_FILE, fullPrompt);

  // Wait for mission file to be consumed (confirms handoff)
  // Use config-based timeout: 60 poll intervals (default 200ms × 60 = 12s)
  const consumeDeadline = Date.now() + (config.POLL_INTERVAL_MS * 60);
  while (fs.existsSync(config.MISSION_FILE)) {
    if (Date.now() > consumeDeadline) {
      log(`WARN: Mission file not consumed within ${Math.round(config.POLL_INTERVAL_MS * 60 / 1000)}s`);
      break;
    }
    await sleep(config.POLL_INTERVAL_MS);
  }
  log(`Mission file consumed — polling for done signal`);

  // Poll for done signal with timeout
  return new Promise((resolve) => {
    let resolved = false;

    // Heartbeat interval = 10% of mission timeout (adaptive logging)
    const heartbeatInterval = Math.max(60000, Math.floor(timeoutMs * 0.1));
    const heartbeat = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`Mission #${num} working — ${elapsed}s / ${Math.round(timeoutMs / 1000)}s`);
    }, heartbeatInterval);

    const cleanup = () => {
      clearInterval(heartbeat);
      clearTimeout(timer);
      clearInterval(poll);
    };

    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s`);
      resolve({ success: false, result: 'timeout', elapsed: Math.round((Date.now() - startTime) / 1000) });
    }, timeoutMs);

    const poll = setInterval(() => {
      if (resolved) return;

      // Check if brain died mid-mission
      if (!isBrainAlive()) {
        resolved = true;
        cleanup();
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log(`BRAIN DIED: Mission #${num} aborted (${elapsed}s)`);
        resolve({ success: false, result: 'brain_died', elapsed });
        return;
      }

      // Check for done file
      try {
        if (fs.existsSync(config.DONE_FILE)) {
          const signal = fs.readFileSync(config.DONE_FILE, 'utf-8').trim();
          resolved = true;
          cleanup();
          try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const success = signal !== 'timeout';
          log(`${success ? 'COMPLETE' : 'TIMEOUT'}: Mission #${num} (${elapsed}s, signal=${signal})`);
          resolve({ success, result: success ? 'done' : 'timeout', elapsed });
        }
      } catch (e) {}
    }, config.POLL_INTERVAL_MS);
  });
}

function spawnBrain() {
  log('BRAIN MODE: external — CC CLI runs in visible terminal. No spawn needed.');
}

function killBrain() {
  log('BRAIN MODE: external — CC CLI managed externally. No kill.');
}

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log };
