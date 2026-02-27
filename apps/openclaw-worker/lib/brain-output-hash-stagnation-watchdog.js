'use strict';
/**
 * brain-output-hash-stagnation-watchdog.js
 *
 * Detects CC CLI output stagnation by comparing SHA-256 hashes of tmux pane
 * output every 60s. If the same hash repeats 3x in a row (3 min frozen),
 * sends a kickstart newline. NO respawn — respawn đã bị CẤM.
 *
 * Exports: startOutputHashWatchdog, stopOutputHashWatchdog
 */

const crypto = require('crypto');
const { log } = require('./brain-logger');

const HASH_INTERVAL_MS = 60_000;
const STAGNATION_THRESHOLD = 3;

let hashHistory = [];
let watchdogInterval = null;

function hashOutput(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex').slice(0, 16);
}

async function checkOutputHash() {
  try {
    const { capturePane, TMUX_SESSION_PRO, TMUX_SESSION_API } = require('./brain-tmux-controller');
    // Monitor cả 2 pane với đúng session target
    for (const paneIdx of [0, 1]) {
      const session = paneIdx === 0 ? TMUX_SESSION_PRO : TMUX_SESSION_API;
      const output = capturePane(paneIdx, session);
      const hash = hashOutput(output);
      if (!hashHistory[paneIdx]) hashHistory[paneIdx] = [];
      hashHistory[paneIdx].push(hash);
      if (hashHistory[paneIdx].length > STAGNATION_THRESHOLD) hashHistory[paneIdx].shift();
      if (
        hashHistory[paneIdx].length === STAGNATION_THRESHOLD &&
        hashHistory[paneIdx].every(h => h === hashHistory[paneIdx][0])
      ) {
        log(`[HASH_WATCHDOG] P${paneIdx} stagnation detected (${STAGNATION_THRESHOLD}x same hash: ${hash})`);
        await handleStagnation(paneIdx);
      }
    }
  } catch (e) {
    log(`[HASH_WATCHDOG] Error: ${e.message}`);
  }
}

/**
 * handleStagnation — CHỈ kickstart (send Enter). KHÔNG respawn.
 * Respawn đã bị cấm vì giết session đang chạy.
 */
async function handleStagnation(paneIdx) {
  // Skip kickstart if pane has active mission (avoid disrupting LLM mid-generation)
  const { isWorkerBusy } = require('./brain-spawn-manager');
  if (isWorkerBusy(paneIdx)) {
    log(`[HASH_WATCHDOG] P${paneIdx}: Mission active — skipping kickstart`);
    hashHistory[paneIdx] = [];
    return;
  }
  log(`[HASH_WATCHDOG] P${paneIdx}: Sending kickstart Enter`);
  try {
    const { sendEnter, TMUX_SESSION_PRO, TMUX_SESSION_API } = require('./brain-tmux-controller');
    const session = paneIdx === 0 ? TMUX_SESSION_PRO : TMUX_SESSION_API;
    sendEnter(paneIdx, session);
  } catch (e) {
    log(`[HASH_WATCHDOG] P${paneIdx}: Kickstart failed: ${e.message}`);
  }
  // Reset history cho pane này để tránh kickstart liên tục
  hashHistory[paneIdx] = [];
}

function startOutputHashWatchdog() {
  stopOutputHashWatchdog();
  hashHistory = [[], []]; // [P0 history, P1 history]
  watchdogInterval = setInterval(checkOutputHash, HASH_INTERVAL_MS);
  log('[HASH_WATCHDOG] Started (kickstart only, NO respawn)');
}

function stopOutputHashWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

module.exports = { startOutputHashWatchdog, stopOutputHashWatchdog };
