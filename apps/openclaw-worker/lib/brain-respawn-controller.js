/**
 * brain-respawn-controller.js
 *
 * Crash recovery: respawnBrain() with rate limiting and correct spawnBrain() call.
 *
 * BUG FIX: respawnBrain() previously called spawnBrain(config.AGENT_TEAM_SIZE_DEFAULT, intent)
 * but spawnBrain() takes NO arguments. Fixed to call spawnBrain() without args.
 *
 * Exports: respawnBrain, compactIfNeeded
 */

const config = require('../config');
const { log } = require('./brain-logger');
const {
  canRespawn,
  spawnBrain,
  killBrain,
  MAX_RESPAWNS_PER_HOUR,
  RESPAWN_COOLDOWN_MS,
  respawnTimestamps,
} = require('./brain-spawn-manager');
const { TMUX_SESSION_PRO, TMUX_SESSION_API, waitForPrompt } = require('./brain-tmux-controller');

/**
 * compactIfNeeded — DISABLED.
 * 🦞 PROXY FIX 2026-02-23: context % is fake through AG Proxy.
 * Proxy handles conversation management. CC CLI compact wastes 11+ minutes.
 */
async function compactIfNeeded() {
  return;
}

/**
 * respawnBrain — kills current session and boots a fresh brain.
 *
 * BUG FIX: was calling spawnBrain(config.AGENT_TEAM_SIZE_DEFAULT, intent)
 * but spawnBrain() takes NO arguments — fixed to call spawnBrain().
 *
 * @param {string} intent - 'EXECUTION' | 'PLAN' | 'RESEARCH'
 * @param {boolean} useContinue - reserved for future --continue flag support
 */
async function respawnBrain(intent = 'EXECUTION', useContinue = true) {
  const isPlanning = intent === 'PLAN' || intent === 'RESEARCH';
  const sessionName = isPlanning ? TMUX_SESSION_PRO : TMUX_SESSION_API;

  if (!canRespawn()) {
    log(`RESPAWN: Rate limit (${MAX_RESPAWNS_PER_HOUR}/hr) — cooldown ${RESPAWN_COOLDOWN_MS / 1000}s`);
    await new Promise(r => setTimeout(r, RESPAWN_COOLDOWN_MS));
    // Clear timestamps after cooldown so respawn is allowed
    respawnTimestamps.length = 0;
  }
  respawnTimestamps.push(Date.now());

  killBrain(sessionName);
  await new Promise(r => setTimeout(r, 2000)); // Wait for cleanup

  // BUG FIX: call spawnBrain() with NO arguments (was incorrectly passing intent/size)
  await spawnBrain();
  await new Promise(r => setTimeout(r, 5000)); // Wait for CC CLI to boot

  log(`RESPAWN: Session ${sessionName} rebuilt via spawnBrain()`);
  return waitForPrompt(120000, 0, sessionName);
}

module.exports = { respawnBrain, compactIfNeeded };
