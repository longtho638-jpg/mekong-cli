#!/usr/bin/env node
/**
 * 🏭 VIBE CODING FACTORY MONITOR v1
 * 
 * Thay thế night-monitor.sh (generic task injection) bằng
 * AGI-level codebase-aware task generation.
 * 
 * Flow cho mỗi pane:
 *   1) Quét codebase (git status, recent commits, TODOs, build status)
 *   2) Gửi context cho LLM (qua Antigravity Proxy) để gen /bootstrap:auto:parallel task chính xác
 *   3) Inject task vào CC CLI qua tmux buffer (an toàn, không crash)
 *   4) Monitor tiến độ, auto-Enter khi kẹt, auto-restart khi crash
 * 
 * Binh Pháp: 始計 (scan) → 謀攻 (plan) → 軍爭 (execute) → 九變 (adapt)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════
const SESSION = 'tom_hum:brain';
const LOG_FILE = path.join(process.env.HOME, 'tom_hum_cto.log');
const CHECK_INTERVAL_MS = process.env.VIBE_INTERVAL || 30_000;

const PANES = [
    { idx: 0, project: 'mekong-cli', dir: path.join(process.env.HOME, 'mekong-cli'), focus: 'AGI agentic skills + ClaudeKit commands for all business domains' },
    { idx: 1, project: 'well', dir: path.join(process.env.HOME, 'mekong-cli/apps/well'), focus: 'RaaS platform, i18n, Supabase, PayOS integration' },
    { idx: 2, project: 'algo-trader', dir: path.join(process.env.HOME, 'mekong-cli/apps/algo-trader'), focus: 'Cross-exchange arbitrage engine (Binance/OKX/Bybit)' },
    // { idx: 3, project: 'apex-os', dir: path.join(process.env.HOME, 'mekong-cli/apps/apex-os'), focus: 'SaaS-to-RaaS transformation, crypto zero-fee exchange' },
];

// ══════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════
function log(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    const line = `[${ts}] [VIBE-FACTORY] ${msg}`;
    try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { }
}

// ══════════════════════════════════════════════════
// TMUX HELPERS (safe, no crash)
// ══════════════════════════════════════════════════
function tmuxCapture(paneIdx, lines = 15) {
    try {
        return execSync(`tmux capture-pane -t ${SESSION}.${paneIdx} -p -S -${lines} 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 });
    } catch { return ''; }
}

function tmuxSendBuffer(paneIdx, text) {
    try {
        // Clear any half-written text just in case (Ctrl+U)
        execSync(`tmux send-keys -t ${SESSION}.${paneIdx} C-u`);
        execSync('sleep 0.2');

        // Pass the string securely with bash string escaping through node
        const escaped = text.replace(/'/g, "'\\''");
        execSync(`tmux send-keys -l -t ${SESSION}.${paneIdx} '${escaped}'`);

        // Let CC CLI UI settle before confirming
        execSync('sleep 0.8');

        // Explicitly send Enter stroke TWICE (fixing multi-line prompt drops)
        execSync(`tmux send-keys -t ${SESSION}.${paneIdx} Enter`);
        execSync('sleep 0.5');
        execSync(`tmux send-keys -t ${SESSION}.${paneIdx} Enter`);

        return true;
    } catch (e) {
        log(`P${paneIdx}: tmux send FAILED - ${e.message}`);
        return false;
    }
}

function tmuxSendKeys(paneIdx, keys) {
    try { execSync(`tmux send-keys -t ${SESSION}.${paneIdx} ${keys}`); } catch { }
}

// ══════════════════════════════════════════════════
// CODEBASE SCANNER (lightweight, no build)
// ══════════════════════════════════════════════════
function scanCodebase(pane) {
    const { dir, project } = pane;
    const intel = { project, gitStatus: 'CLEAN', recentCommits: '', todoCount: 0, fileCount: 0 };

    try {
        const gs = execSync('git status --porcelain 2>/dev/null | head -10', { cwd: dir, encoding: 'utf-8', timeout: 5000 }).trim();
        intel.gitStatus = gs ? 'DIRTY' : 'CLEAN';
        intel.dirtyFiles = gs.split('\n').filter(Boolean).slice(0, 5).join(', ');
    } catch { }

    try {
        intel.recentCommits = execSync('git log --oneline -5 2>/dev/null', { cwd: dir, encoding: 'utf-8', timeout: 5000 }).trim();
    } catch { }

    try {
        const count = execSync('grep -rE "TODO|FIXME|HACK" . --exclude-dir={node_modules,dist,.next,.claude,.git} 2>/dev/null | wc -l', { cwd: dir, encoding: 'utf-8', timeout: 5000 }).trim();
        intel.todoCount = parseInt(count) || 0;
    } catch { }

    try {
        const fc = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | wc -l', { cwd: dir, encoding: 'utf-8', timeout: 5000 }).trim();
        intel.fileCount = parseInt(fc) || 0;
    } catch { }

    return intel;
}

// ══════════════════════════════════════════════════

const dedup = require('../lib/task-dedup-registry.js');

// ══════════════════════════════════════════════════
// LLM TASK GENERATOR (Binh Pháp Strategic Scanner)
// NEVER returns null — always produces a /plan:hard task
// ══════════════════════════════════════════════════
const DIM_COOLDOWN_FILE = '/tmp/vibe-dim-cooldown.json';
const DIM_COOLDOWN_MS = 12 * 60 * 1000; // 12 minutes per dimension per pane

function loadDimCooldown() {
    try { return JSON.parse(fs.readFileSync(DIM_COOLDOWN_FILE, 'utf-8')); } catch { return {}; }
}
function saveDimCooldown(data) {
    try { fs.writeFileSync(DIM_COOLDOWN_FILE, JSON.stringify(data)); } catch { }
}
function isDimOnCooldown(paneIdx, dim) {
    const key = `P${paneIdx}:${dim}`;
    const data = loadDimCooldown();
    const ts = data[key];
    if (!ts) return false;
    return (Date.now() - ts) < DIM_COOLDOWN_MS;
}
// ══════════════════════════════════════════════════
// SCORE HISTORY TRACKER
// ══════════════════════════════════════════════════
const SCORE_HISTORY_FILE = '/tmp/vibe-score-history.json';

function loadScoreHistory() {
    try { return JSON.parse(fs.readFileSync(SCORE_HISTORY_FILE, 'utf-8')); } catch { return {}; }
}
function recordScore(project, scoreResult) {
    const history = loadScoreHistory();
    if (!history[project]) history[project] = [];
    history[project].push({ ts: Date.now(), total: scoreResult.total, grade: scoreResult.grade, breakdown: scoreResult.breakdown });
    // Keep last 20 entries per project
    if (history[project].length > 20) history[project] = history[project].slice(-20);
    try { fs.writeFileSync(SCORE_HISTORY_FILE, JSON.stringify(history, null, 2)); } catch { }
}
function getDimAttempts(project, dim) {
    const history = loadScoreHistory();
    const entries = history[project] || [];
    if (entries.length < 2) return 0;
    const last = entries[entries.length - 1];
    const prev = entries[entries.length - 2];
    if (!last.breakdown || !prev.breakdown) return 0;
    // If score for this dim hasn't improved between last 2 entries
    return (last.breakdown[dim] || 0) <= (prev.breakdown[dim] || 0) ? 1 : 0;
}

function recordDimUsage(paneIdx, dim) {
    const key = `P${paneIdx}:${dim}`;
    const data = loadDimCooldown();
    data[key] = Date.now();
    // Prune old entries (>1hr)
    for (const k of Object.keys(data)) { if (Date.now() - data[k] > 3600000) delete data[k]; }
    saveDimCooldown(data);
}

async function generateScoreTargetedTask(pane, scoreResult) {
    // 1. Sort dimensions by score (lowest first)
    const sorted = Object.entries(scoreResult.breakdown)
        .sort(([, a], [, b]) => a - b);

    // 2. Always pick the LOWEST scoring dim that is NOT maxed (10) and NOT on cooldown
    let selectedDim = null;
    let selectedScore = 0;
    for (const [dim, score] of sorted) {
        if (score >= 10) continue; // Already maxed
        if (!isDimOnCooldown(pane.idx, dim)) {
            selectedDim = dim;
            selectedScore = score;
            break;
        }
    }
    // Fallback: if all dims on cooldown, pick absolute lowest
    if (!selectedDim) {
        selectedDim = sorted[0][0];
        selectedScore = sorted[0][1];
    }
    recordDimUsage(pane.idx, selectedDim);

    const weakestDim = selectedDim;
    const weakestScore = selectedScore;
    let taskCmd = '';
    const proj = pane.project;

    // ═══ 4-TIER BINH PHÁP SMART DISPATCH (風林火山) ═══
    // Mapped from BINH_PHAP_MASTER.md DNA FUSION v4.0
    const totalScore = scoreResult.total;
    const stuckAttempts = getDimAttempts(proj, weakestDim);

    let tier, tierCmd;
    if (stuckAttempts >= 3) {
        // TIER 2: 行軍 Ch.9 (Hành Quân) - Recon & Root Cause
        // 近而靜者恃其險 - Hidden errors require deep reconnaissance
        tier = 'TIER2-HÀNH-QUÂN';
        tierCmd = `/cook "HÀNH QUÂN DEBUG (${proj}): Điểm ${weakestDim} kẹt ${stuckAttempts} lần. Tôn chỉ: Tìm Root Cause trước khi fix. Trinh sát log lỗi, tái hiện, phân tích hypothesis, sau đó dứt điểm."`;
        log(`P${pane.idx}: 🔴 TIER 2 → HÀNH QUÂN DEBUG (${weakestDim} stuck ${stuckAttempts}x)`);
    } else if (totalScore < 60) {
        // TIER 1: 侵掠如火 (Mạnh như LỬA - Complex Rewrite)
        // 兵無常勢，水無常形 - Total attack to establish the foundation
        tier = 'TIER1-LỬA-CÔNG';
        tierCmd = `/cook "LỬA CÔNG BOOTSTRAP (${proj}): Tái cấu trúc toàn diện. Setup vững chắc 100/100 (Build/Test Xanh). Không ngần ngại đập đi xây lại chuẩn mực."`;
        log(`P${pane.idx}: 🚀 TIER 1 → LỬA CÔNG BOOTSTRAP (score ${totalScore} < 60)`);
    } else if (totalScore < 85) {
        // TIER 3: 徐如林 (Lặng như RỪNG - Targeted Strategy)
        // 避實擊虛 - Avoid strong, hit weak points
        tier = 'TIER3-RỪNG-CHIẾN';
        tierCmd = `/cook "RỪNG CHIẾN LƯỢC (${proj}): Đánh thẳng điểm yếu ${weakestDim} (${weakestScore}→10), bỏ qua phần khác. Dứt điểm 1 mục tiêu gọn gàng. Verify test pass."`;
        log(`P${pane.idx}: ⚔️ TIER 3 → RỪNG CHIẾN LƯỢC (score ${totalScore}, dim ${weakestDim}=${weakestScore})`);
    } else {
        // TIER 4: 疾如風 (Nhanh như GIÓ - Polish)
        // 兵貴勝不貴久 - Speed and perfection
        tier = 'TIER4-GIÓ-POLISH';
        tierCmd = `/cook "GIÓ POLISH (${proj}): Tút tát thần tốc ${weakestDim} lên điểm tuyệt đối 10. Hoàn thiện final touch. Build/Test phải Xanh 100%."`;
        log(`P${pane.idx}: 🌪️ TIER 4 → GIÓ POLISH (score ${totalScore} ≥ 85, dim ${weakestDim}=${weakestScore})`);
    }

    taskCmd = tierCmd;
    log(`P${pane.idx}: 🎯 ${tier} | Score: ${totalScore} | Weakest: ${weakestDim}=${weakestScore} | for ${proj}`);
    dedup.recordTask(taskCmd, pane.project, pane.idx, `${tier}: ${weakestDim}`);

    return taskCmd;
}

// ══════════════════════════════════════════════════
// PANE STATE DETECTOR
// ══════════════════════════════════════════════════

// 🛡️ DYNAMIC COOLDOWN — based on task complexity
// Simple tasks (/cook, /fix, /test, /debug): 60s
// Complex tasks (/bootstrap, /plan:hard, /plan:parallel): 180s
const SIMPLE_COOLDOWN_MS = 60000;
const COMPLEX_COOLDOWN_MS = 180000;
const lastInjection = {}; // paneIdx → { ts, type: 'simple'|'complex' }

function getCooldownForTask(taskCmd) {
    // Complex commands need more time to show progress
    const isComplex = /\/(bootstrap|plan:hard|plan:parallel|review:codebase)/.test(taskCmd);
    return isComplex ? COMPLEX_COOLDOWN_MS : SIMPLE_COOLDOWN_MS;
}

function isInCooldown(paneIdx) {
    const last = lastInjection[paneIdx];
    if (!last) return false;
    const elapsed = Date.now() - last.ts;
    const cooldownMs = last.type === 'complex' ? COMPLEX_COOLDOWN_MS : SIMPLE_COOLDOWN_MS;
    if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        log(`P${paneIdx}: 🛡️ COOLDOWN (${last.type}) — ${remaining}s remaining, SKIP injection`);
        return true;
    }
    return false;
}

function recordInjection(paneIdx, taskCmd) {
    const type = /\/(bootstrap|plan:hard|plan:parallel|review:codebase)/.test(taskCmd) ? 'complex' : 'simple';
    lastInjection[paneIdx] = { ts: Date.now(), type };
    log(`P${paneIdx}: 📝 Recorded ${type} injection, cooldown=${type === 'complex' ? '180s' : '60s'}`);
}

function detectPaneState(output) {
    if (!output || output.includes('Pane is dead')) return 'DEAD';
    // 🦞 Robust CRASHED check: accounts for tmux wrapping the prompt, or "Resume this session" text from CC CLI crashing.
    if (/macbookprom1@/.test(output) || /Resume this session with:/.test(output) || /zsh: command not found/.test(output) || /zsh: no such file or directory/.test(output) || /bash-3\.2\$/.test(output)) return 'CRASHED';
    // 🦞 NEW IDLE TEST: If the prompt is totally empty and waiting for input, it is 100% IDLE.
    // The visual prompt looks like:
    // ────────────────────────────────────────────
    // ❯ 
    // ────────────────────────────────────────────
    if (/(›|❯)\s*\n[─━]+/.test(output)) return 'IDLE';

    // 🦞 Detect low context BEFORE it hits 0% and crashes. CC CLI shows "Context left until auto-compact: X%"
    if (/Context limit reached/.test(output)) return 'CONTEXT_LIMIT';
    if (/Context left until auto-compact: ([0-9]|1[0-5])%/.test(output)) return 'LOW_CONTEXT';
    if (/rate-limit-options|You've hit your limit/.test(output)) return 'RATE_LIMITED';
    if (/(›|❯)\s*(git (push|commit|add)|queued messages|Press up to edit)/.test(output)) return 'PENDING';
    if (/(›|❯)\s*\/(cook|bootstrap|plan|debug) /.test(output)) return 'STUCK_PROMPT';
    // ClaudeKit interactive prompts (validation, options menu, submit answers)
    if (/Enter to select|↑\/↓ to navigate|Esc to cancel|Yes \(Recommended\)|Type something|Submit answers|Review your answers|Ready to submit/.test(output)) return 'INTERACTIVE';

    // Explicit LOW_CONTEXT string
    if (/Context left until auto-compact: 0%/.test(output)) return 'LOW_CONTEXT';

    // 🏭 FIX: CC CLI idle patterns — bypass on, cooked (finished), or just ❯ prompt
    // Fresh boot: shows `try "how do I log an error?"` or `try "fix typecheck errors"`
    // 🔴 CRITICAL: Check WORKING FIRST before IDLE to prevent blind injection
    // Note: removed past-tense words like Sautéed/Crunched/Cogitated as they indicate it FINISHED working
    if (/(Whisking|Bloviating|Churning|Crystallizing|Sprouting|Deciphering|Prestidigitating|Puttering|Nesting|Crafting|Warping|Flowing|Sock-hopping|Building|Zigzagging|Quantumizing|Enchanting|Discombobulating|Smooshing|Spiraling|Explore agents|Running \d|Perambulating|Hashing|Processing|Unfurling|thinking|Moseying|Waddling|Jitterbugging|Flummoxing|Swooping|Hatching|Searching for)/i.test(output)) return 'WORKING';
    if (/Running…|Waiting…|Bash\(|Read\(|Write\(|fullstack-developer\(|planner\(|debugger\(|tester\(|code-reviewer\(|researcher\(|hook error|background tasks/i.test(output)) return 'WORKING';
    if (/(›|❯)\s*[Tt]ry "/.test(output) && /bypass permissions on/.test(output)) return 'IDLE';
    if (/bypass permissions on/.test(output) && !/Searching|Running|Explore|Read \d|Smooshing|Whisking|Bloviating|Churning|Building|Prestidigitating|Flowing|Crafting|Spiraling|Nesting|Puttering|Zigzagging|Perambulating|Hashing|Processing|Unfurling|thinking|thought for|Running…|Waiting…|Bash\(/.test(output)) return 'IDLE';
    if (/Cooked for \d/.test(output)) return 'IDLE';
    if (/Crunched for \d/.test(output)) return 'IDLE';
    if (/Choreographed for \d/.test(output)) return 'IDLE';
    if (/Sautéed for \d/.test(output)) return 'IDLE';
    if (/\w+ed for \d+[ms]/.test(output) && /bypass permissions on/.test(output) && /❯/.test(output)) return 'IDLE';
    if (/❯\s*$/.test(output)) return 'IDLE';
    return 'ACTIVE';
}

// ══════════════════════════════════════════════════
// MAIN LOOP
// ══════════════════════════════════════════════════
async function checkAllPanes() {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    log(`\n=== ${ts} VIBE CHECK ===`);

    // --- 1. AUTO-BOOTSTRAP NEW PROJECTS FROM INTAKE ---
    try {
        const tasksDir = path.join(__dirname, '..', 'tasks');
        if (fs.existsSync(tasksDir)) {
            const files = fs.readdirSync(tasksDir).filter(f => f.startsWith('INTAKE_') && f.endsWith('.json'));
            for (const file of files) {
                log(`📥 INTAKE DETECTED: ${file} — Bootstrapping project...`);
                try {
                    const filePath = path.join(tasksDir, file);
                    const intakeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    if (!global.bootstrapProject) {
                        const bs = require('../lib/project-bootstrapper');
                        global.bootstrapProject = bs.bootstrapProject;
                    }

                    const result = global.bootstrapProject(intakeData);
                    if (result.success) {
                        log(`✨ BOOTSTRAP SUCCESS: ${result.projectDir}`);
                        const doneDir = path.join(tasksDir, 'done');
                        if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir);
                        fs.renameSync(filePath, path.join(doneDir, file));
                    } else {
                        log(`🔴 BOOTSTRAP FAILED: ${result.errors.join(' | ')}`);
                        fs.renameSync(filePath, filePath + '.failed');
                    }
                } catch (err) {
                    log(`🔴 BOOTSTRAP CRASHED: ${err.message}`);
                }
            }
        }
    } catch (err) {
        log(`Warning: Intake scanner error - ${err.message}`);
    }

    // CTO health — check own process (vibe-factory-monitor)
    try {
        const cto = execSync('pgrep -f "vibe-factory-monitor" 2>/dev/null').toString().trim();
        log(`CTO: ${cto ? '✅' : '❌'}`);
    } catch { log('CTO: ✅ (self)'); }

    // DashScope API health (apps/anthropic format)
    const dsKey = process.env.DASHSCOPE_API_KEY || 'sk-sp-652cd51db1774704a992863926cd1f67';
    try {
        execSync(`curl -s -o /dev/null -w "%{http_code}" --max-time 8 -X POST https://coding-intl.dashscope.aliyuncs.com/apps/anthropic/v1/messages -H "x-api-key: ${dsKey}" -H "anthropic-version: 2023-06-01" -H "Content-Type: application/json" -d '{"model":"qwen3.5-plus","max_tokens":1,"messages":[{"role":"user","content":"ping"}]}' 2>/dev/null | grep -q 200`, { timeout: 12000 });
        log('DASHSCOPE: ✅');
    } catch { log('DASHSCOPE: ⚠️ slow/timeout (non-blocking)'); }

    for (const pane of PANES) {
        const output = tmuxCapture(pane.idx);
        const regexState = detectPaneState(output);

        // 🛡️ LLM GUARD GATE — validate regex state before action
        let state = regexState;
        try {
            if (!global.llmPerception) {
                const lp = require('../lib/llm-perception');
                global.llmPerception = lp;
            }

            // 🦞 HARD BYPASS: Do not ask the LLM if we confidently know it's crashed.
            // The LLM often hallucinates the shell prompt as an acceptable IDLE state.
            if (['CRASHED', 'DEAD'].includes(regexState)) {
                state = regexState;
                log(`P${pane.idx}: ⚡ Regex confident: ${state} — bypassing LLM guard`);
            } else if (['IDLE', 'PENDING'].includes(regexState)) {
                const guard = await global.llmPerception.guardCheck(output, regexState, pane.project, pane.idx);
                if (!guard.agree && guard.correctedState) {
                    state = guard.correctedState;
                }
                if (!guard.shouldAct) {
                    log(`P${pane.idx}: 🛡️ GUARD: ${regexState} → SKIP (${guard.reason})`);
                    continue;
                }
            }
        } catch (e) {
            // Guard failed → use regex state (safe fallback)
        }

        switch (state) {
            case 'DEAD':
                log(`P${pane.idx}: 💀 DEAD — respawning with --continue`);
                try { execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && unset CLAUDE_CONFIG_DIR && unset CLAUDE_AUTOCOMPACT_PCT_OVERRIDE && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL && /Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions --continue"`); } catch { }
                // Will inject task next cycle after bootlog(`P${pane.idx}: ✅ Respawned, task will inject next cycle`);
                break;

            case 'CRASHED':
                log(`P${pane.idx}: 🔴 CRASHED — respawn-pane -k with --continue`);
                try {
                    execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && unset CLAUDE_CONFIG_DIR && unset CLAUDE_AUTOCOMPACT_PCT_OVERRIDE && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL && unset CLAUDECODE && /Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions --continue"`);
                } catch { }
                break;

            case 'CONTEXT_LIMIT': {
                // Check if context is truly at 0% — if so, respawn fresh (compact won't help)
                const ctxOutput = tmuxCapture(pane.idx, 5);
                if (/0% remaining/.test(ctxOutput) || /Context low \(0%/.test(ctxOutput)) {
                    log(`P${pane.idx}: 🔴 CONTEXT 0% — /compact won't help. RESPAWNING FRESH...`);
                    try {
                        execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && unset CLAUDE_CONFIG_DIR && unset CLAUDE_AUTOCOMPACT_PCT_OVERRIDE && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL && unset CLAUDECODE && /Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions"`);
                    } catch { }
                    lastInjection[pane.idx] = Date.now();
                } else {
                    log(`P${pane.idx}: 🔴 CONTEXT LIMIT REACHED — sending /compact`);
                    tmuxSendKeys(pane.idx, 'Escape');
                    await sleep(300);
                    execSync(`tmux send-keys -t ${SESSION}.${pane.idx} 'C-u' '/compact' Enter 2>/dev/null || true`);
                    lastInjection[pane.idx] = Date.now();
                }
                break;
            }

            case 'LOW_CONTEXT': {
                const lowCtxOut = tmuxCapture(pane.idx, 5);
                if (/0% remaining/.test(lowCtxOut)) {
                    log(`P${pane.idx}: 🟡 LOW CONTEXT 0% — RESPAWNING FRESH...`);
                    try {
                        execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && unset CLAUDE_CONFIG_DIR && unset CLAUDE_AUTOCOMPACT_PCT_OVERRIDE && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL && unset CLAUDECODE && /Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions"`);
                    } catch { }
                    lastInjection[pane.idx] = Date.now();
                } else {
                    log(`P${pane.idx}: 🟡 LOW CONTEXT — letting CC CLI finish (no restart)`);
                }
                break;
            }

            case 'RATE_LIMITED':
                log(`P${pane.idx}: 🔶 RATE LIMITED — selecting "Stop and wait"`);
                tmuxSendKeys(pane.idx, 'Enter');
                break;

            case 'PENDING':
                log(`P${pane.idx}: 🔵 PENDING — sending Escape+Enter`);
                tmuxSendKeys(pane.idx, 'Escape');
                await sleep(300);
                tmuxSendKeys(pane.idx, 'Enter');
                break;

            case 'STUCK_PROMPT':
                log(`P${pane.idx}: ⚠️ STUCK TEXT IN PROMPT — sending Enter`);
                tmuxSendKeys(pane.idx, 'Enter');
                break;

            case 'INTERACTIVE': {
                // Smart auto-answer based on prompt context
                const output = tmuxCapture(pane.idx, 15);
                if (/Submit answers|Review your answers|Ready to submit/.test(output)) {
                    // Git commit / review prompt → Submit (option 1)
                    log(`P${pane.idx}: 🟣 INTERACTIVE (Submit) — auto-selecting option 1`);
                    tmuxSendKeys(pane.idx, '1');
                } else if (/Validation|approve as-is/.test(output)) {
                    // ClaudeKit validation → Skip validation (option 2)
                    log(`P${pane.idx}: 🟣 INTERACTIVE (Validation) — auto-selecting option 2 (implement)`);
                    tmuxSendKeys(pane.idx, '2');
                } else {
                    // Generic interactive → Enter to proceed
                    log(`P${pane.idx}: 🟣 INTERACTIVE (Generic) — sending Enter`);
                    tmuxSendKeys(pane.idx, 'Enter');
                }
                await sleep(500);
                tmuxSendKeys(pane.idx, 'Enter');
                break;
            }

            case 'IDLE': {
                // 🛡️ COOLDOWN CHECK — skip if recently injected
                if (isInCooldown(pane.idx)) break;

                // 🦞 PRE-FLIGHT CONTEXT CHECK: Prevent starting massive tasks with low battery
                const ctxMatch = output.match(/Context left until auto-compact: (\d+)%/);
                if (ctxMatch) {
                    const ctx = parseInt(ctxMatch[1], 10);
                    if (ctx <= 30) {
                        log(`P${pane.idx}: 🟡 PRE-FLIGHT BLOCKED (Context ${ctx}% <= 30%). Restarting fresh...`);
                        try {
                            execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && unset CLAUDE_CONFIG_DIR && unset CLAUDE_AUTOCOMPACT_PCT_OVERRIDE && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL && unset CLAUDECODE && /Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions"`);
                        } catch { }
                        lastInjection[pane.idx] = Date.now();
                        break;
                    }
                }

                // 🏭 BINH PHÁP SCANNER: Round-robin chapter → gen task → inject
                log(`P${pane.idx}: ⏸️ IDLE — BINH PHÁP SCANNER...`);

                // --- SCORE CALCULATION ---
                if (!global.calculateProjectScore) {
                    try {
                        const scoreModule = require('../lib/project-score-calculator');
                        global.calculateProjectScore = scoreModule.calculateProjectScore;
                        log(`Loaded Project Score Calculator`);
                    } catch (e) {
                        log(`Warning: Could not load score calculator: ${e.message}`);
                        global.calculateProjectScore = () => ({ total: 0, grade: 'F' });
                    }
                }

                const scoreResult = global.calculateProjectScore(pane.dir);
                recordScore(pane.project, scoreResult); // Track score history
                const isGradeS = scoreResult.grade === 'S';

                const intel = scanCodebase(pane);
                log(`P${pane.idx}: 📊 ${pane.project} | Score: ${scoreResult.total}/100 (${scoreResult.grade}) | git=${intel.gitStatus}, config=${intel.fileCount}`);

                if (isGradeS) {
                    log(`P${pane.idx}: 🏆 RaaS AGI READY (Grade S) — Generating Handover Package for ${pane.project}`);
                    try {
                        if (!global.generateHandoverPackage) {
                            const hm = require('../lib/handover-generator');
                            global.generateHandoverPackage = hm.generateHandoverPackage;
                        }
                        const result = global.generateHandoverPackage(pane.dir, pane.project, scoreResult);
                        log(`P${pane.idx}: 📦 HANDOVER GENERATED: ${result.files.length} docs → ${result.outputDir}`);
                    } catch (e) {
                        log(`P${pane.idx}: ⚠️ Handover generation failed: ${e.message}`);
                    }
                    break;
                }

                // 🏭 VIBE CODING FACTORY: Pipeline-First Priority
                let cookCmd = null;

                try {
                    if (!global.factoryPipeline) {
                        global.factoryPipeline = require('../lib/factory-pipeline');
                        log('🏭 Factory Pipeline loaded');
                    }

                    const activePipeline = global.factoryPipeline.getActivePipeline(pane.project, pane.idx);
                    if (activePipeline) {
                        // Advance to next stage or get current command
                        // Needs to be handled properly: if we are here, pane is IDLE. 
                        // It means previous stage completed (or just started).
                        // Tell pipeline to advance.
                        const result = global.factoryPipeline.advanceStage(activePipeline.id);
                        if (result.advanced) {
                            cookCmd = `${result.command} --auto`;
                            log(`P${pane.idx}: 🏭 PIPELINE [${activePipeline.currentStage} → ${result.nextStage}] | ${result.toyota}`);
                        } else if (result.completed) {
                            log(`P${pane.idx}: 🎉 PIPELINE COMPLETED! All 5 stages shipped.`);
                        } else {
                            // Couldn't advance (or already active but pane is idle? Maybe retry)
                            const cmd = global.factoryPipeline.getCurrentCommand(activePipeline.id);
                            if (cmd) {
                                cookCmd = `${cmd.command} --auto`;
                                log(`P${pane.idx}: 🏭 PIPELINE RETRY [${cmd.stage}] | ${cmd.toyota}`);
                            }
                        }
                    }
                } catch (e) {
                    log(`P${pane.idx}: ⚠️ Factory Pipeline error: ${e.message}`);
                }

                // ═══ 🧠 CTO VISION: LLM-FIRST DECISION ENGINE ═══
                // --- 📋 EXTERNAL TASK QUEUE CHECK ---
                if (!cookCmd) {
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const tasksDir = '/Users/macbookprom1/mekong-cli/tasks';
                        if (fs.existsSync(tasksDir)) {
                            const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.txt'));
                            if (files.length > 0) {
                                // Match logic: find files specifically meant for this pane
                                const myTasks = files.filter(f => {
                                    const n = f.toLowerCase();
                                    const isP0 = pane.project === 'mekong-cli';
                                    const isP1 = pane.project === 'well';
                                    const isP2 = pane.project === 'algo-trader';

                                    const hasP0 = n.includes('mekong') || n.includes('p0');
                                    const hasP1 = n.includes('well') || n.includes('p1');
                                    const hasP2 = n.includes('algo') || n.includes('p2');

                                    if (isP0 && hasP0) return true;
                                    if (isP1 && hasP1) return true;
                                    if (isP2 && hasP2) return true;

                                    // If no specific routing indicator exists, default to P0
                                    if (isP0 && !hasP0 && !hasP1 && !hasP2) return true;

                                    return false;
                                });

                                if (myTasks.length > 0) {
                                    myTasks.sort((a, b) => {
                                        const w = f => f.startsWith('CRITICAL') ? 3 : f.startsWith('HIGH') ? 2 : 1;
                                        return w(b) - w(a);
                                    });
                                    const taskFile = myTasks[0];
                                    const content = fs.readFileSync(path.join(tasksDir, taskFile), 'utf8');

                                    // Binh Phap Standard Rule 3: Use ClaudeKit commands!
                                    // Escape the content so it survives tmux bash injection
                                    const safeContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').slice(0, 1500);
                                    cookCmd = `/cook "EXTERNAL TASK: ${taskFile}\\n${safeContent}" --auto`;

                                    const procDir = path.join(tasksDir, 'processed');
                                    if (!fs.existsSync(procDir)) fs.mkdirSync(procDir);
                                    fs.renameSync(path.join(tasksDir, taskFile), path.join(procDir, taskFile));
                                    log(`P${pane.idx}: �� DISPATCHED task: ${taskFile}`);
                                }
                            }
                        }
                    } catch (e) {
                        log(`P${pane.idx}: ⚠️ Task Queue error: ${e.message}`);
                    }
                }
                // Antigravity Brain Transfer — read CC CLI output, understand, decide
                if (!cookCmd) {
                    try {
                        if (!global.llmPerception) {
                            global.llmPerception = require('../lib/llm-perception');
                            log('🧠 LLM Perception Layer loaded');
                        }

                        // Step 1: Read 30 lines of CC CLI output for context
                        const fullOutput = tmuxCapture(pane.idx, 30);

                        // Step 2: LLM Guard — quick state check via Gemini
                        if (global.llmPerception.shouldSpendTokens(pane.idx)) {
                            const guard = await global.llmPerception.guardCheck(fullOutput, state, pane.project, pane.idx);

                            if (!guard.shouldAct) {
                                log(`P${pane.idx}: 🧠 GUARD: Don't act — ${guard.reason}`);
                                break;
                            }

                            // Error detected → /debug
                            if (guard.correctedState === 'error' || guard.correctedState === 'ERROR') {
                                cookCmd = `/debug "${pane.project}: ${guard.reason.slice(0, 80)}"`;
                                log(`P${pane.idx}: 🧠 GUARD → DEBUG: ${guard.reason}`);
                            }
                            // Stuck → /bootstrap UNSTUCK
                            else if (guard.correctedState === 'stuck' || guard.correctedState === 'STUCK') {
                                cookCmd = `/cook "${pane.project}: UNSTUCK — ${guard.reason.slice(0, 80)}"`;
                                log(`P${pane.idx}: 🧠 GUARD → UNSTUCK: ${guard.reason}`);
                            }
                        }

                        // Step 3: If guard didn't set cookCmd, use LLM Perception for smart task
                        if (!cookCmd) {
                            const perception = await global.llmPerception.perceivePaneWithLLM(fullOutput, pane.project, pane.idx);
                            cookCmd = global.llmPerception.buildSmartPrompt(perception, pane.project);
                            if (cookCmd) {
                                cookCmd += ' --auto';
                                log(`P${pane.idx}: 🧠 LLM VISION: ${cookCmd.slice(0, 80)}...`);
                            }
                        }
                    } catch (e) {
                        log(`P${pane.idx}: ⚠️ LLM Vision failed (${e.message}) → score fallback`);
                    }

                    // Step 4: Fallback — Score-based Binh Pháp (last resort)
                    if (!cookCmd) {
                        log(`P${pane.idx}: ⏸️ LLM did not suggest a command. Using score fallback...`);
                        cookCmd = await generateScoreTargetedTask(pane, scoreResult);
                    }
                }

                // 🛡️ UNIFIED INJECT GATE — cooldown 3min is the guard
                if (cookCmd) {
                    log(`P${pane.idx}: 🚀 INJECTING: ${cookCmd.slice(0, 100)}...`);
                    tmuxSendBuffer(pane.idx, cookCmd);
                    recordInjection(pane.idx, cookCmd); // 🛡️ Start dynamic cooldown
                }
                break;
            }

            case 'WORKING':
                log(`P${pane.idx}: ✅ WORKING`);
                break;

            default:
                log(`P${pane.idx}: 🔵 ACTIVE`);
        }
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════
log('🏭 VIBE CODING FACTORY v2026.3.2 STARTED');
log(`Interval: ${CHECK_INTERVAL_MS / 1000}s | Panes: ${PANES.length}`);

// ✅ 1. CONFIG VALIDATE GATE (始計 Ch.1 - 多算勝)
try {
    require('../config.js');
    log('✅ Config Validate: OK');
} catch (configErr) {
    log(`❌ FATAL: Config validation failed: ${configErr.message}`);
    process.exit(1);
}

// ✅ 2. SECRETS (Default injected if missing from bash triggers)
if (!process.env.DASHSCOPE_API_KEY) {
    process.env.DASHSCOPE_API_KEY = 'sk-sp-652cd51db1774704a992863926cd1f67';
    log('⚠️ Injected missing DASHSCOPE_API_KEY env var automatically');
}
log('✅ Secrets Check: OK');

// Run immediately
checkAllPanes();

// Then loop
setInterval(checkAllPanes, CHECK_INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => { log('🏭 VIBE FACTORY stopped'); process.exit(0); });
process.on('SIGTERM', () => { log('🏭 VIBE FACTORY stopped'); process.exit(0); });
