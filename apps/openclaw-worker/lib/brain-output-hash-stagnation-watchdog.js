'use strict';
/**
 * brain-output-hash-stagnation-watchdog.js
 *
 * 🔒 CHAIRMAN RULE: CC CLI PHẢI TỰ KHỞI ĐỘNG LẠI KHI HẾT CONTEXT.
 *
 * Detects:
 * 1. CC CLI output stagnation (same hash 3x = 3 min frozen) → kickstart Enter
 * 2. CC CLI CRASHED/EXITED (bash prompt `%` detected) → AUTO-RESTART CC CLI
 * 3. CC CLI context exhausted (auto-compact 0% or "Compacting") → AUTO-RESTART
 *
 * 🔒 STRICT 1P1 ROUTING on restart:
 *   P0 = ~/mekong-cli
 *   P1 = ~/mekong-cli/apps/well
 *   P2 = ~/mekong-cli/apps/algo-trader
 *
 * Exports: startOutputHashWatchdog, stopOutputHashWatchdog
 */

const crypto = require('crypto');
const { log } = require('./brain-logger');
const config = require('../config');
const path = require('path');

const HASH_INTERVAL_MS = 60_000; // Check every 60s
const STAGNATION_THRESHOLD = 3;  // 3x same hash = stagnation (3 min)

// 🔒 STRICT 1P1 PROJECT DIRS
const PANE_DIRS = {
  0: config.MEKONG_DIR || path.join(process.env.HOME, 'mekong-cli'),
  1: path.join(config.MEKONG_DIR || path.join(process.env.HOME, 'mekong-cli'), 'apps', 'well'),
  2: path.join(config.MEKONG_DIR || path.join(process.env.HOME, 'mekong-cli'), 'apps', 'algo-trader'),
};

let hashHistory = [];
let watchdogInterval = null;

function hashOutput(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex').slice(0, 16);
}

/**
 * isBashPrompt — detect if CC CLI has exited and pane shows bash/zsh prompt
 * Patterns: "macbookprom1@..." + " %", "$ ", or just bare prompt
 */
function isBashPrompt(output) {
  if (!output) return false;
  const lines = output.trim().split('\n').filter(l => l.trim());
  const lastLine = (lines[lines.length - 1] || '').trim();
  // zsh prompt: ends with "%" or has "macbookprom1@" + "%"
  return /macbookprom1@.*%\s*$/.test(lastLine) ||
    /^.*%\s*$/.test(lastLine) && !lastLine.includes('bypass permissions');
}

/**
 * isContextExhausted — detect CC CLI context exhausted
 * Patterns: "auto-compact: 0%", "Compacting conversation", "Context left until auto-compact: 0%"
 */
function isContextExhausted(output) {
  if (!output) return false;
  return /auto-compact:\s*0%/i.test(output) ||
    /Context left.*0%/i.test(output);
}

/**
 * isCCCLIIdle — detect CC CLI is idle and waiting for input (❯ prompt)
 */
function isCCCLIIdle(output) {
  if (!output) return false;
  return /❯\s*$/.test(output.trim()) || /bypass permissions on/i.test(output);
}

async function checkOutputHash() {
  try {
    const { execSync } = require('child_process');
    const sessionName = (config.TMUX_SESSION || 'tom_hum:brain').split(':')[0];

    for (const paneIdx of [0, 1, 2]) {
      const target = `${sessionName}:brain.${paneIdx}`;
      let output = '';
      try {
        output = execSync(`tmux capture-pane -t ${target} -p -S -10 2>/dev/null`, { encoding: 'utf8', timeout: 5000 });
      } catch (e) {
        continue; // Pane doesn't exist
      }

      // ═══════════════════════════════════════════════
      // 🔒 CHECK 1: CC CLI CRASHED → AUTO-RESTART
      // ═══════════════════════════════════════════════
      if (isBashPrompt(output)) {
        log(`[WATCHDOG] P${paneIdx}: CC CLI CRASHED — bash prompt detected. AUTO-RESTARTING...`);
        await autoRestartCCCLI(paneIdx, target);
        continue;
      }

      // ═══════════════════════════════════════════════
      // 🔒 CHECK 2: CONTEXT EXHAUSTED → AUTO-RESTART
      // ═══════════════════════════════════════════════
      if (isContextExhausted(output)) {
        log(`[WATCHDOG] P${paneIdx}: CONTEXT EXHAUSTED (0%) — AUTO-RESTARTING with --continue...`);
        await autoRestartCCCLI(paneIdx, target, true);
        continue;
      }

      // ═══════════════════════════════════════════════
      // CHECK 3: STAGNATION (same output hash 3x)
      // ═══════════════════════════════════════════════
      const hash = hashOutput(output);
      if (!hashHistory[paneIdx]) hashHistory[paneIdx] = [];
      hashHistory[paneIdx].push(hash);
      if (hashHistory[paneIdx].length > STAGNATION_THRESHOLD) hashHistory[paneIdx].shift();

      if (
        hashHistory[paneIdx].length === STAGNATION_THRESHOLD &&
        hashHistory[paneIdx].every(h => h === hashHistory[paneIdx][0])
      ) {
        log(`[WATCHDOG] P${paneIdx}: Stagnation detected (${STAGNATION_THRESHOLD}x same hash: ${hash})`);

        // If idle, just kickstart
        if (isCCCLIIdle(output)) {
          log(`[WATCHDOG] P${paneIdx}: CC CLI idle — sending kickstart Enter`);
          try {
            execSync(`tmux send-keys -t ${target} Enter`, { timeout: 3000 });
          } catch (e) { /* ignore */ }
        }
        hashHistory[paneIdx] = [];
      }
    }
  } catch (e) {
    log(`[WATCHDOG] Error: ${e.message}`);
  }
}

/**
 * autoRestartCCCLI — Kill existing CC CLI and restart fresh
 * 
 * @param {number} paneIdx - Pane index (0, 1, 2)
 * @param {string} target - tmux target (e.g. "tom_hum:brain.0")
 * @param {boolean} useContinue - If true, use --continue flag (for context exhausted)
 */
async function autoRestartCCCLI(paneIdx, target, useContinue = false) {
  const { execSync } = require('child_process');
  const dir = PANE_DIRS[paneIdx];

  try {
    // Step 1: Send Ctrl+C to kill anything running
    execSync(`tmux send-keys -t ${target} C-c C-c`, { timeout: 3000 });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: cd to correct project dir and start claude
    const continueFlag = useContinue ? ' --continue' : '';
    const cmd = `cd ${dir} && claude --dangerously-skip-permissions${continueFlag}`;

    log(`[WATCHDOG] P${paneIdx}: Restarting CC CLI in ${dir}${useContinue ? ' (with --continue)' : ''}`);

    execSync(`tmux send-keys -t ${target} '${cmd}' Enter`, { timeout: 3000 });

    // Step 3: Wait for CC CLI to boot
    await new Promise(r => setTimeout(r, 8000));

    // Step 4: Reset hash history for this pane
    hashHistory[paneIdx] = [];

    log(`[WATCHDOG] P${paneIdx}: CC CLI restart command sent successfully`);
  } catch (e) {
    log(`[WATCHDOG] P${paneIdx}: Auto-restart failed: ${e.message}`);
  }
}

function startOutputHashWatchdog() {
  stopOutputHashWatchdog();
  hashHistory = [[], [], []]; // [P0, P1, P2]
  watchdogInterval = setInterval(checkOutputHash, HASH_INTERVAL_MS);
  log('[WATCHDOG] Started — monitors 3 panes: crash detect + context exhaust + stagnation. AUTO-RESTART enabled.');
}

function stopOutputHashWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

module.exports = { startOutputHashWatchdog, stopOutputHashWatchdog };
