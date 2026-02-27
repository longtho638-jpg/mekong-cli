/**
 * 🧠 Brain Supervisor — Unified CTO & CC CLI Monitoring Loop
 * 
 * 始計→九變: Giám sát tổng thể, escalation ladder khi cần nâng não.
 * 
 * Monitors:
 *   - CC CLI context % (< 15% → /compact)
 *   - CC CLI state (stuck > 20min → respawn)
 *   - CTO phase staleness (same phase > 10min → reset)
 *   - Mission success rate (< 70% → evolution check → brain surgery)
 * 
 * Actions (escalation):
 *   Level 1: /compact (nudge)
 *   Level 2: Reset CTO phase
 *   Level 3: Respawn CC CLI
 *   Level 4: Brain surgery mission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');

// --- Constants ---
const LOOP_INTERVAL_MS = 60 * 1000;       // 60s base loop
const CONTEXT_WARN_THRESHOLD = 15;         // % — trigger /compact below this
const STUCK_THRESHOLD_MS = 20 * 60 * 1000; // 20min stuck → respawn
const PHASE_STALE_MS = 10 * 60 * 1000;    // 10min same CTO phase → reset
const SUCCESS_RATE_THRESHOLD = 0.7;        // < 70% → evolution check

// Cooldowns to prevent action spam
const COOLDOWNS = {
    compact: 5 * 60 * 1000,    // 5min between /compact
    phaseReset: 10 * 60 * 1000, // 10min between phase resets
    respawn: 15 * 60 * 1000,    // 15min between respawns
    surgery: 2 * 60 * 60 * 1000, // 2h between brain surgeries
};

const TMUX_SESSION = `${config.TMUX_SESSION}:brain`;
const CTO_STATE_FILE = path.join(config.MEKONG_DIR, 'tasks', '.tom_hum_state.json');

// --- State ---
let supervisorTimer = null;
let lastActions = {
    compact: 0,
    phaseReset: 0,
    respawn: 0,
    surgery: 0,
};
let stuckSince = null; // When CC CLI first appeared stuck

// --- Logging ---
function log(msg) {
    const ts = new Date().toISOString().slice(11, 19);
    const line = `[${ts}] [supervisor] ${msg}`;
    console.log(line);
    try {
        fs.appendFileSync(config.LOG_FILE, line + '\n');
    } catch (e) { /* ignore */ }
}

// --- Helpers ---

/**
 * Parse CC CLI context % from tmux pane output.
 * Looks for: "Context left until auto-compact: N%"
 * Returns: number (0-100) or null if not found
 */
function parseContextPercent(paneOutput) {
    const match = paneOutput.match(/Context left until auto-compact:\s*(\d+)%/i);
    if (match) return parseInt(match[1], 10);

    // Also check for "auto-compact: N%" variant
    const match2 = paneOutput.match(/auto-compact:\s*(\d+)%/);
    if (match2) return parseInt(match2[1], 10);

    return null;
}

/**
 * Capture tmux pane output (last 30 lines) combining both Pro (0) and API (1) panes
 */
function capturePaneOutput() {
    let output = '';
    for (let paneIdx = 0; paneIdx < 2; paneIdx++) {
        try {
            output += execSync(
                `tmux capture-pane -t ${TMUX_SESSION}.${paneIdx} -p -S -30 2>/dev/null`,
                { encoding: 'utf-8', timeout: 5000 }
            ) + '\n';
        } catch (e) {
            // pane might not exist
        }
    }
    return output;
}

/**
 * Check if CC CLI is at idle prompt (❯ or >)
 * Per brain-process-manager.js line 212: "Claude's prompt is '❯' or '>'."
 */
function isAtPrompt(output) {
    const lines = output.trim().split('\n').slice(-5);
    return lines.some(l => l.includes('❯') || /^>\s*$/.test(l.trim()));
}

/**
 * Check if CC CLI is actively processing
 */
function isBusy(output) {
    const busyPatterns = [
        /Thinking/i, /Orbiting/i, /Saut[eé]ing/i, /Frolicking/i,
        /Cooking/i, /Crunching/i, /Marinating/i, /Fermenting/i,
        /Compacting\.\.\./i, /Simmering/i, /Steaming/i, /Vibing/i,
        /Photosynthesizing/i, /Braising/i, /Reducing/i, /Blanching/i,
        /Sketching/i, /Running/i, /Herding/i, /thought for \d+/i,
    ];
    return busyPatterns.some(p => p.test(output));
}

/**
 * Load CTO pilot state
 */
function loadCTOState() {
    try {
        if (fs.existsSync(CTO_STATE_FILE)) {
            return JSON.parse(fs.readFileSync(CTO_STATE_FILE, 'utf-8'));
        }
    } catch (e) { /* ignore */ }
    return null;
}

/**
 * Check if cooldown has elapsed
 */
function canDo(action) {
    const cd = COOLDOWNS[action] || 0;
    return (Date.now() - (lastActions[action] || 0)) > cd;
}

function markDone(action) {
    lastActions[action] = Date.now();
}

// --- Actions ---

/**
 * Level 1: Send /compact to CC CLI
 */
function sendCompact() {
    if (!canDo('compact')) {
        log('⏳ /compact on cooldown, skipping');
        return false;
    }

    try {
        log('⚡ Level 1: Sending /compact to CC CLI (context low)');
        execSync(`tmux send-keys -t ${TMUX_SESSION} '/compact' Enter`, { timeout: 5000 });
        markDone('compact');
        return true;
    } catch (e) {
        log(`❌ Failed to send /compact: ${e.message}`);
        return false;
    }
}

/**
 * Level 2: Reset CTO phase to 'scan'
 */
function resetCTOPhase() {
    if (!canDo('phaseReset')) {
        log('⏳ Phase reset on cooldown, skipping');
        return false;
    }

    try {
        const state = loadCTOState();
        if (!state) return false;

        log(`🔄 Level 2: Resetting CTO phase from '${state.phase}' to 'scan'`);
        state.phase = 'scan';
        state.fixCycle = 0;
        state.lastPhaseChange = Date.now();
        fs.writeFileSync(CTO_STATE_FILE, JSON.stringify(state, null, 2));
        markDone('phaseReset');
        return true;
    } catch (e) {
        log(`❌ Failed to reset CTO phase: ${e.message}`);
        return false;
    }
}

/**
 * Level 3: Respawn CC CLI (via brain-process-manager)
 */
function triggerRespawn() {
    if (!canDo('respawn')) {
        log('⏳ Respawn on cooldown, skipping');
        return false;
    }

    try {
        log('🔄 Level 3: Triggering CC CLI respawn');
        const bpm = require('./brain-process-manager');
        if (bpm.spawnBrain) {
            bpm.spawnBrain();
            markDone('respawn');
            stuckSince = null;
            return true;
        }
    } catch (e) {
        log(`❌ Failed to trigger respawn: ${e.message}`);
    }
    return false;
}

/**
 * Level 4: Trigger brain surgery mission
 */
function triggerSurgery(reason) {
    if (!canDo('surgery')) {
        log('⏳ Brain surgery on cooldown, skipping');
        return false;
    }

    try {
        log(`🧠 Level 4: Triggering brain surgery — ${reason}`);
        const { checkEvolutionTriggers } = require('./evolution-engine');
        const result = checkEvolutionTriggers();
        markDone('surgery');
        log(`🧬 Evolution check result: triggered=${result.triggered}, score=${result.score}`);
        return result.triggered;
    } catch (e) {
        log(`❌ Failed to trigger brain surgery: ${e.message}`);
        return false;
    }
}

// --- Main Supervision Loop ---

function supervisionCycle() {
    try {
        const output = capturePaneOutput();
        if (!output) {
            log('⚠️ Cannot capture tmux pane — session may be dead');
            return;
        }

        // NOTE: Context % is FAKE via Antigravity Proxy — removed per Chairman decree

        // === Monitor 2: CC CLI Stuck Detection ===
        if (!isBusy(output) && !isAtPrompt(output)) {
            // Neither busy nor at prompt — might be stuck
            if (!stuckSince) {
                stuckSince = Date.now();
            } else if (Date.now() - stuckSince > STUCK_THRESHOLD_MS) {
                log(`🚨 CC CLI stuck for ${Math.round((Date.now() - stuckSince) / 60000)}min`);

                // Supplement: heartbeat stale also indicates stuck (BUG #4: blind in direct mode)
                let heartbeatStale = false;
                try { heartbeatStale = require('./brain-heartbeat').isBrainHeartbeatStale(); } catch (e) { }
                if (heartbeatStale) {
                    log(`[SUPERVISOR] Heartbeat stale detected — brain may be frozen`);
                }

                triggerRespawn();
            }
        } else {
            // Reset stuck tracker — CC CLI is responsive
            stuckSince = null;
        }

        // === Monitor 3: CTO Phase Staleness ===
        const ctoState = loadCTOState();
        if (ctoState && ctoState.lastPhaseChange) {
            const phaseAge = Date.now() - ctoState.lastPhaseChange;
            if (phaseAge > PHASE_STALE_MS && ctoState.phase !== 'scan') {
                log(`⚠️ CTO stuck in '${ctoState.phase}' for ${Math.round(phaseAge / 60000)}min`);
                resetCTOPhase();
            }
        }

        // === Monitor 4: Mission Success Rate ===
        try {
            const { loadHistory } = require('./evolution-engine');
            if (loadHistory) {
                const history = loadHistory();
                if (history.length >= 10) {
                    const recent = history.slice(-10);
                    const successRate = recent.filter(m => m.success).length / recent.length;
                    if (successRate < SUCCESS_RATE_THRESHOLD) {
                        log(`⚠️ Mission success rate: ${Math.round(successRate * 100)}% (last 10)`);
                        triggerSurgery(`Success rate ${Math.round(successRate * 100)}% < ${SUCCESS_RATE_THRESHOLD * 100}%`);
                    }
                }
            }
        } catch (e) {
            // Evolution engine not available — skip
        }

    } catch (e) {
        log(`❌ Supervision cycle error: ${e.message}`);
    }
}

// --- Public API ---

function startSupervisor() {
    if (supervisorTimer) return;
    log('🧠 Brain Supervisor started (60s loop)');

    function scheduleNext() {
        supervisorTimer = setTimeout(() => {
            supervisionCycle();
            scheduleNext();
        }, LOOP_INTERVAL_MS);
    }

    // First cycle after 10s delay (let other modules boot)
    supervisorTimer = setTimeout(() => {
        supervisionCycle();
        scheduleNext();
    }, 10 * 1000);
}

function stopSupervisor() {
    if (supervisorTimer) {
        clearTimeout(supervisorTimer);
        supervisorTimer = null;
        log('🧠 Brain Supervisor stopped');
    }
}

module.exports = { startSupervisor, stopSupervisor };
