'use strict';
/**
 * brain-output-hash-stagnation-watchdog.js
 *
 * Detects CC CLI output stagnation by comparing SHA-256 hashes of tmux pane
 * output every 60s. If the same hash repeats 3x in a row (3 min frozen),
 * sends a kickstart newline; if ineffective, triggers respawn.
 *
 * Exports: startOutputHashWatchdog, stopOutputHashWatchdog
 */

const crypto = require('crypto');
const { log } = require('./brain-logger');

const HASH_INTERVAL_MS = 60_000;
const STAGNATION_THRESHOLD = 3;
const KICKSTART_WAIT_MS = 30_000;

let hashHistory = [];
let watchdogInterval = null;
let isKickstarting = false;

function hashOutput(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex').slice(0, 16);
}

async function checkOutputHash() {
  if (isKickstarting) return;
  try {
    const { capturePane } = require('./brain-tmux-controller');
    const output = capturePane();
    const hash = hashOutput(output);
    hashHistory.push(hash);
    if (hashHistory.length > STAGNATION_THRESHOLD) hashHistory.shift();
    if (
      hashHistory.length === STAGNATION_THRESHOLD &&
      hashHistory.every(h => h === hashHistory[0])
    ) {
      log(`[HASH_WATCHDOG] Output stagnation detected (${STAGNATION_THRESHOLD}x same hash: ${hash})`);
      await handleStagnation();
    }
  } catch (e) {
    log(`[HASH_WATCHDOG] Error: ${e.message}`);
  }
}

async function handleStagnation() {
  isKickstarting = true;
  hashHistory = [];
  log('[HASH_WATCHDOG] Step 1: Sending kickstart newline');
  try {
    const { sendEnter } = require('./brain-tmux-controller');
    sendEnter(0);
  } catch (e) {
    log(`[HASH_WATCHDOG] Kickstart failed: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, KICKSTART_WAIT_MS));
  try {
    const { capturePane } = require('./brain-tmux-controller');
    const output = capturePane();
    const newHash = hashOutput(output);
    if (hashHistory.length > 0 && newHash === hashHistory[0]) {
      log('[HASH_WATCHDOG] Step 2: Kickstart ineffective, triggering respawn');
      const { respawnBrain } = require('./brain-respawn-controller');
      await respawnBrain('output_stagnation');
    } else {
      log('[HASH_WATCHDOG] Step 2: Kickstart worked, brain recovered');
    }
  } catch (e) {
    log(`[HASH_WATCHDOG] Post-kickstart check failed: ${e.message}`);
  }
  isKickstarting = false;
}

function startOutputHashWatchdog() {
  stopOutputHashWatchdog();
  hashHistory = [];
  watchdogInterval = setInterval(checkOutputHash, HASH_INTERVAL_MS);
  log('[HASH_WATCHDOG] Started');
}

function stopOutputHashWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

module.exports = { startOutputHashWatchdog, stopOutputHashWatchdog };
