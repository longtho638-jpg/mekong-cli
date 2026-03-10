#!/usr/bin/env node
/**
 * vibe-factory-monitor.js — VIBE CODING FACTORY MONITOR v2
 *
 * Main entry: boot, config validate, main loop, dashboard.
 * All pane logic delegated to lib/cto-*.js modules.
 *
 * Binh Pháp: 始計 (scan) → 謀攻 (plan) → 軍爭 (execute) → 九變 (adapt)
 * NO LLM CALLS — pure regex + pool + smart detection
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Modules ───────────────────────────────────────────────────
const { detectPaneState } = require('../lib/cto-pane-state-detector');
const { tmuxCapture, detectRealProject, respawnPane, tmuxSendBuffer, tmuxSendKeys } = require('../lib/cto-tmux-helpers');
const { trackRunning, trackCompleted } = require('../lib/cto-progress-tracker');
const { resetEscalation, startEscalationTimer } = require('../lib/cto-escalation');
const { printDashboard } = require('../lib/cto-dashboard-logger');
const { handlePane } = require('../lib/cto-pane-handler');

// ── Config ────────────────────────────────────────────────────
const cfg = require('../config.js');
const SESSION = `${cfg.TMUX_SESSION}:0`;
const LOG_FILE = cfg.LOG_FILE;
const CHECK_INTERVAL_MS = Number(process.env.VIBE_INTERVAL) || 30_000;
const FALLBACK_MODEL = cfg.FALLBACK_MODEL_NAME;

// ── Logging ───────────────────────────────────────────────────
function log(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    const line = `[${ts}] [VIBE-FACTORY] ${msg}`;
    try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch { }
}

// ── Pane config ───────────────────────────────────────────────
function buildPanesConfig() {
    const H = process.env.HOME;
    const staticPanes = [
        { idx: 0, project: 'openclaw-worker', dir: path.join(H, 'mekong-cli/apps/openclaw-worker'), focus: 'CTO Task Execution' },
        { idx: 1, project: 'well', dir: path.join(H, 'mekong-cli/apps/well'), focus: 'RaaS platform, i18n, Supabase, PayOS' },
        { idx: 2, project: 'algo-trader', dir: path.join(H, 'mekong-cli/apps/algo-trader'), focus: 'Cross-exchange arbitrage engine' },
    ];
    try {
        const lines = execSync(`tmux list-panes -t ${SESSION} -F "#{pane_index}" 2>/dev/null`, { encoding: 'utf-8' }).trim().split('\n');
        const validIdxs = new Set(lines.map(Number));
        return staticPanes.filter(p => validIdxs.has(p.idx));
    } catch {
        return staticPanes;
    }
}
const PANES = buildPanesConfig();

// ── In-process state ──────────────────────────────────────────
const paneProgress = {}; // paneIdx → { task, injectedAt, completed }
const lastInjection = {}; // paneIdx → { ts, type }
const COOLDOWN_MS = 300_000;
const COMPLETION_RE = /(?:Cooked|Worked|Crunched|Sautéed|Choreographed|Cogitated)\s+for\s+\d/i;

function isPaneTaskComplete(paneIdx, output) {
    const p = paneProgress[paneIdx];
    if (!p || p.completed) return true;
    if (COMPLETION_RE.test(output)) {
        log(`P${paneIdx}: TASK COMPLETED (${Math.round((Date.now() - p.injectedAt) / 1000)}s)`);
        p.completed = true;
        return true;
    }
    log(`P${paneIdx}: TASK IN PROGRESS (${Math.round((Date.now() - p.injectedAt) / 1000)}s)`);
    return false;
}

function recordTaskInjected(paneIdx, taskCmd, project) {
    paneProgress[paneIdx] = { task: taskCmd, injectedAt: Date.now(), completed: false };
    trackRunning(paneIdx, project, taskCmd);
    startEscalationTimer(paneIdx);
}

function recordTaskCompleted(paneIdx, project, taskCmd) {
    trackCompleted(paneIdx, project, taskCmd || '');
    resetEscalation(paneIdx);
}

function isInCooldown(paneIdx) {
    const last = lastInjection[paneIdx];
    if (!last) return false;
    const elapsed = Date.now() - last.ts;
    if (elapsed < COOLDOWN_MS) {
        log(`P${paneIdx}: COOLDOWN — ${Math.ceil((COOLDOWN_MS - elapsed) / 1000)}s remaining`);
        return true;
    }
    return false;
}

function recordInjection(paneIdx, taskCmd) {
    const type = /\/(bootstrap|plan:hard|plan:parallel|review:codebase)/.test(taskCmd) ? 'complex' : 'simple';
    lastInjection[paneIdx] = { ts: Date.now(), type };
    log(`P${paneIdx}: Recorded ${type} injection, cooldown=300s`);
}

// ── Bound tmux helpers ────────────────────────────────────────
const capture = (idx, lines) => tmuxCapture(SESSION, idx, lines);
const sendBuf = (idx, text) => tmuxSendBuffer(SESSION, idx, text, log);
const sendKeys = (idx, keys) => tmuxSendKeys(SESSION, idx, keys);
const respawn = (idx, dir, flags) => respawnPane(SESSION, idx, dir, flags, PANES.find(p => p.idx === idx)?.isOpus, log);
const realProj = (idx) => detectRealProject(SESSION, idx);

// ── Shared handler context ────────────────────────────────────
const handlerCtx = {
    get session() { return SESSION; },
    get fallbackModel() { return FALLBACK_MODEL; },
    lastInjection, paneProgress, log,
    capture, sendBuf, sendKeys, respawn,
    isPaneTaskComplete, recordTaskInjected, recordTaskCompleted,
    isInCooldown, recordInjection,
};

// ── MAIN LOOP ─────────────────────────────────────────────────
async function checkAllPanes() {
    log(`\n=== ${new Date().toLocaleTimeString('en-US', { hour12: false })} VIBE CHECK ===`);

    // 1. Auto-bootstrap INTAKE files
    try {
        const tasksDir = path.join(__dirname, '..', 'tasks');
        if (fs.existsSync(tasksDir)) {
            const intakeFiles = fs.readdirSync(tasksDir).filter(f => f.startsWith('INTAKE_') && f.endsWith('.json'));
            for (const file of intakeFiles) {
                log(`INTAKE: ${file}`);
                try {
                    const filePath = path.join(tasksDir, file);
                    const intakeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    if (!global.bootstrapProject) global.bootstrapProject = require('../lib/project-bootstrapper').bootstrapProject;
                    const result = global.bootstrapProject(intakeData);
                    const doneDir = path.join(tasksDir, 'done');
                    if (result.success) {
                        log(`INTAKE OK: ${result.projectDir}`);
                        if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir);
                        fs.renameSync(filePath, path.join(doneDir, file));
                    } else {
                        log(`INTAKE FAIL: ${result.errors.join(' | ')}`);
                        fs.renameSync(filePath, filePath + '.failed');
                    }
                } catch (err) { log(`INTAKE CRASH: ${err.message}`); }
            }
        }
    } catch (err) { log(`Intake error: ${err.message}`); }

    // 2. Self health check
    try {
        execSync('pgrep -f "vibe-factory-monitor" 2>/dev/null');
        log('CTO: OK');
    } catch { log('CTO: OK (self)'); }

    // 3. RAM guard — emergency compact idle panes when RAM critical
    try {
        const memInfo = execSync('top -l 1 -s 0 | grep PhysMem', { encoding: 'utf-8', timeout: 5000 });
        const usedMatch = memInfo.match(/(\d+)G used/);
        if (usedMatch && parseInt(usedMatch[1]) >= 14) {
            log(`RAM CRITICAL: ${usedMatch[1]}GB — compacting idle panes`);
            for (const p of PANES) {
                if (p.idx === 0) continue;
                const out = capture(p.idx, 5);
                if (/❯\s*$/.test(out) && !/Cooking/.test(out)) {
                    sendKeys(p.idx, 'Escape');
                    execSync(`tmux send-keys -t ${SESSION}.${p.idx} '/compact' Enter 2>/dev/null || true`);
                }
            }
        }
    } catch { }

    // 4. Process each worker pane
    for (const pane of PANES) {
        if (pane.idx === 0) { log('P0: CHAIRMAN — skip'); continue; }

        // Dynamic project detection override
        const real = realProj(pane.idx);
        if (real && real.project !== pane.project) {
            log(`P${pane.idx}: PROJECT SYNC: ${pane.project} → ${real.project}`);
            pane.project = real.project;
            pane.dir = real.dir;
        }

        const output = capture(pane.idx);
        const state = detectPaneState(output);
        await handlePane(pane, output, state, handlerCtx);
    }

    // 5. Dashboard
    printDashboard(PANES.filter(p => p.idx !== 0).map(p => p.idx), log);
}

// ── BOOT ──────────────────────────────────────────────────────
log('VIBE CODING FACTORY v2026.3.9 STARTED');
log(`Interval: ${CHECK_INTERVAL_MS / 1000}s | Panes: ${PANES.length}`);

try {
    require('../config.js');
    log('Config validate: OK');
} catch (e) {
    log(`FATAL: Config failed: ${e.message}`);
    process.exit(1);
}

log('CTO: NO LLM calls — regex + pool + smart detection');

checkAllPanes();
setInterval(checkAllPanes, CHECK_INTERVAL_MS);

process.on('SIGINT', () => { log('VIBE FACTORY stopped'); process.exit(0); });
process.on('SIGTERM', () => { log('VIBE FACTORY stopped'); process.exit(0); });
