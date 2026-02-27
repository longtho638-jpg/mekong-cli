/**
 * brain-respawn-controller.js
 *
 * Crash recovery — RESPAWN DISABLED (2026-02-28).
 * Reason: respawn kills entire tmux session (both panes), destroying
 * the other pane's running CC CLI context. Too destructive.
 *
 * respawnBrain() now only logs a warning and returns false.
 * compactIfNeeded() remains a no-op (proxy handles context).
 *
 * Exports: respawnBrain, compactIfNeeded
 */

const { log } = require('./brain-logger');

/**
 * compactIfNeeded — DISABLED.
 * Proxy handles conversation management. CC CLI compact wastes 11+ minutes.
 */
async function compactIfNeeded() {
  return;
}

/**
 * respawnBrain — DISABLED.
 * Previously killed entire tmux session and rebooted both panes.
 * This destroyed the other pane's running mission. Now just logs and returns false.
 *
 * If brain truly dies, task-watcher.js will detect via health check
 * and human operator can manually restart.
 */
async function respawnBrain(intent = 'EXECUTION', useContinue = true) {
  log(`⚠️ RESPAWN DISABLED: respawnBrain(${intent}) called but blocked. Manual restart required if brain is dead.`);
  return false;
}

module.exports = { respawnBrain, compactIfNeeded };
