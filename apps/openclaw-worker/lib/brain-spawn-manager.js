/**
 * brain-spawn-manager.js
 *
 * Brain lifecycle controls: kill, alive check, respawn rate limiting,
 * worker routing, per-worker mission locks, Claude command generation.
 *
 * Boot logic (spawnBrain) lives in brain-boot-sequence.js to stay < 200 lines.
 *
 * BUG FIX: canRespawn() now enforces max 5 respawns/hour (was always true).
 *
 * Exports: spawnBrain, killBrain, isBrainAlive, canRespawn,
 *          findIdleWorker, isWorkerBusy, isMissionActive,
 *          setWorkerLock, clearWorkerLock, getCurrentWorkerIdx, setCurrentWorkerIdx,
 *          generateClaudeCommand, parseContextUsage, isShellPrompt
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-logger');
const {
  TMUX_SESSION_PRO, TMUX_SESSION_API,
  tmuxExec, isSessionAlive, capturePane,
} = require('./brain-tmux-controller');
const { startHeartbeat, stopHeartbeat } = require('./brain-heartbeat');
const { startOutputHashWatchdog, stopOutputHashWatchdog } = require('./brain-output-hash-stagnation-watchdog');

const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const STALE_LOCK_THRESHOLD_MS = 2 * 60 * 1000;

// 🔒 BUG FIX: rate limiter array — shared with brain-respawn-controller
const respawnTimestamps = [];

// Shared mutable worker index
let _currentWorkerIdx = 1;
function getCurrentWorkerIdx() { return _currentWorkerIdx; }
function setCurrentWorkerIdx(idx) { _currentWorkerIdx = idx; }

// --- Respawn rate limiting ---

/**
 * canRespawn — enforces max 5 respawns/hour.
 * BUG FIX: was disabled (always returned true). Re-enabled.
 */
function canRespawn() {
  const cutoff = Date.now() - 3600000;
  const filtered = respawnTimestamps.filter(ts => ts > cutoff);
  respawnTimestamps.length = 0;
  filtered.forEach(ts => respawnTimestamps.push(ts));
  return respawnTimestamps.length < MAX_RESPAWNS_PER_HOUR;
}

// --- Claude command generator ---

/**
 * 虛實 — Intent-Aware Command Generator (SINGLE SOURCE OF TRUTH).
 * PRO intent → Opus thật (direct Anthropic API, NO proxy).
 * API intent → Proxy (port 9191, model default by proxy).
 */
function generateClaudeCommand(intent = 'API') {
  if (intent === 'PRO') {
    const dir = `/Users/macbookprom1/.claude_antigravity_pro`;
    return `export CLAUDE_CONFIG_DIR="${dir}" && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL` +
      ` && export NPM_CONFIG_WORKSPACES=false && export npm_config_workspaces=false` +
      ` && claude --model claude-opus-4-6 --dangerously-skip-permissions`;
  }
  const dir = `/Users/macbookprom1/.claude_antigravity_api`;
  return `export CLAUDE_CONFIG_DIR="${dir}" && unset ANTHROPIC_API_KEY` +
    ` && export ANTHROPIC_BASE_URL="http://127.0.0.1:9191" && export ANTHROPIC_AUTH_TOKEN="test"` +
    ` && export NPM_CONFIG_WORKSPACES=false && export npm_config_workspaces=false` +
    ` && claude --dangerously-skip-permissions`;
}

// --- Brain lifecycle (boot delegated to brain-boot-sequence.js) ---

// Boot logic lives in brain-boot-sequence.js (avoids circular dep on generateClaudeCommand)
// Lazy-require to break the circular: boot-sequence → spawn-manager → boot-sequence
async function spawnBrain(...args) {
  await require('./brain-boot-sequence').spawnBrain(...args);
  startHeartbeat(process.pid);
  startOutputHashWatchdog();
}

function killBrain(sessionName = config.TMUX_SESSION) {
  stopHeartbeat();
  stopOutputHashWatchdog();
  if (isSessionAlive(sessionName)) {
    tmuxExec(`tmux kill-session -t ${sessionName}`, sessionName);
    log(`BRAIN: tmux session ${sessionName} killed`);
  }
}

/**
 * isBrainAlive — checks if CC CLI is running in the given tmux pane.
 * paneTarget = full tmux pane address (e.g. tom_hum:brain.0).
 */
function isBrainAlive(paneTarget = TMUX_SESSION_PRO) {
  if (!isSessionAlive(config.TMUX_SESSION)) return false;
  try {
    const output = execSync(
      `tmux capture-pane -t ${paneTarget} -p 2>/dev/null`,
      { encoding: 'utf-8', timeout: 3000 }
    );
    return [/❯/, /Claude Code/i, /bypass permissions/i, /claude-/i, /✻/].some(p => p.test(output));
  } catch (e) { return false; }
}

/** Check if pane is at a raw shell prompt instead of Claude */
function isShellPrompt(output) {
  const { getCleanTail } = require('./brain-tmux-controller');
  const tail = getCleanTail(output, 5).join('\n');
  if (tail.includes('❯')) return false;
  if (tail.includes('Choose a capability:')) return false;
  if (/^>\s*$/.test(tail.trim())) return false;
  if (/%[\s]*$/.test(tail)) return true;
  if (/\$ \s*$/.test(tail)) return true;
  if (/# \s*$/.test(tail)) return true;
  return false;
}

// --- Worker routing ---

/**
 * findIdleWorker — intent-based routing (CLEAR RULES):
 *   P0 (PRO/Opus) ← PLAN, RESEARCH only
 *   P1 (API/Proxy) ← everything else (EXECUTION, COOK, etc.)
 * sessionName is the TMUX_SESSION_PRO or TMUX_SESSION_API (already includes pane).
 * Returns pane index (0 or 1) or -1 if busy.
 */
function findIdleWorker(sessionName = config.TMUX_SESSION, intent = 'EXECUTION') {
  const isProIntent = intent === 'PLAN' || intent === 'RESEARCH' || intent === 'PRO';
  const targetPane = isProIntent ? 0 : 1;
  if (!isWorkerBusy(targetPane)) {
    log(`DISPATCH: → Worker P${targetPane} (idle) — intent=${intent}`);
    return targetPane;
  }
  return -1;
}

// --- Per-worker mission locks ---

function workerLockFile(idx) {
  return path.join(__dirname, '..', `.mission-active-P${idx}.lock`);
}

function autoCleanStaleLock(idx) {
  const lockPath = workerLockFile(idx);
  try {
    if (!fs.existsSync(lockPath)) return;
    const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
    if (ageMs > STALE_LOCK_THRESHOLD_MS) {
      const content = fs.readFileSync(lockPath, 'utf-8').trim();
      fs.unlinkSync(lockPath);
      log(`[HEALER] 🔓 Stale lock P${idx} cleaned (age: ${Math.round(ageMs / 60000)}min, was: ${content})`);
    }
  } catch (e) { }
}

function isWorkerBusy(idx) {
  try {
    autoCleanStaleLock(idx);
    return fs.existsSync(workerLockFile(idx));
  } catch { return false; }
}

function isMissionActive() {
  const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 3;
  for (let i = 0; i < teamSize; i++) {
    if (isWorkerBusy(i)) return true;
  }
  return false;
}

function setWorkerLock(idx, missionNum) {
  try { fs.writeFileSync(workerLockFile(idx), `mission_${missionNum}_P${idx}_${Date.now()}`); } catch { }
}

function clearWorkerLock(idx) {
  try { fs.unlinkSync(workerLockFile(idx)); } catch { }
}

function parseContextUsage(output) {
  const match = output.match(/🔋\s*(\d+)%/);
  return match ? parseInt(match[1]) : -1;
}

module.exports = {
  MAX_RESPAWNS_PER_HOUR,
  RESPAWN_COOLDOWN_MS,
  respawnTimestamps,
  getCurrentWorkerIdx,
  setCurrentWorkerIdx,
  canRespawn,
  generateClaudeCommand,
  spawnBrain,
  killBrain,
  isBrainAlive,
  isShellPrompt,
  findIdleWorker,
  isWorkerBusy,
  isMissionActive,
  setWorkerLock,
  clearWorkerLock,
  parseContextUsage,
};
