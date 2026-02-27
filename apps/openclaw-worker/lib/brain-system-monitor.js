/**
 * brain-system-monitor.js
 *
 * System metrics, overheat detection, and stuck mission intervention.
 * Exports: getSystemMetrics, isOverheating, checkStuckIntervention
 */

const { execSync } = require('child_process');
const fs = require('fs');
const config = require('../config');
const { log } = require('./brain-logger');
const { sendCtrlC } = require('./brain-tmux-controller');

function getSystemMetrics() {
  try {
    const loadString = execSync('sysctl -n vm.loadavg').toString().trim();
    // Format: "{ 2.15 2.05 1.98 }" — remove braces, split
    const parts = loadString.replace(/[{}]/g, '').trim().split(/\s+/);
    const load1min = parseFloat(parts[0]);
    const mem = process.memoryUsage().rss / 1024 / 1024;
    return { load: load1min, mem: Math.round(mem) };
  } catch (e) {
    return { load: 0, mem: 0 };
  }
}

function isOverheating() {
  const metrics = getSystemMetrics();
  if (metrics.load > 4.0) {
    const coolingTime = 10000;
    try {
      fs.appendFileSync(
        config.THERMAL_LOG,
        `[${new Date().toISOString()}] 🔥 HIGH LOAD (${metrics.load}). Intervening... Sleeping ${coolingTime / 1000}s\n`
      );
    } catch (e) { }
    // Intentionally block to force system slowdown
    execSync(`sleep ${coolingTime / 1000}`);
    return true;
  }
  return false;
}

/**
 * checkStuckIntervention — kills stuck idle mission after 5min+60s.
 * Only intervenes when NOT busy (busy = actively outputting, do not kill).
 */
function checkStuckIntervention(workerIdx, elapsedSec, wasBusy) {
  // 🦞 BUG 2026-02-26: Do NOT kill while CC CLI is actively busy
  if (wasBusy) return false;

  const cooling = 300000; // 300s
  const margin = 60000;   // 60s

  if (elapsedSec > (cooling + margin) / 1000) {
    log(`STUCK: (P${workerIdx}) seems stuck after ${elapsedSec}s — INTERVENING...`);
    sendCtrlC(workerIdx);
    return true;
  }
  return false;
}

module.exports = { getSystemMetrics, isOverheating, checkStuckIntervention };
