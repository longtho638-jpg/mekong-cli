#!/usr/bin/env node
/**
 * 🏭 VIBE CODING FACTORY MONITOR v1
 * 
 * Thay thế night-monitor.sh (generic task injection) bằng
 * AGI-level codebase-aware task generation.
 * 
 * Flow cho mỗi pane:
 *   1) Quét codebase (git status, recent commits, TODOs, build status)
 *   2) Chọn task từ TASK_POOLS (round-robin) hoặc smart git detection
 *   3) Inject task vào CC CLI qua tmux buffer (an toàn, không crash)
 *   4) Monitor tiến độ, auto-Enter khi kẹt, auto-restart khi crash
 *
 * Binh Pháp: 始計 (scan) → 謀攻 (plan) → 軍爭 (execute) → 九變 (adapt)
 * NO LLM CALLS — pure regex + pool + smart detection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════
const SESSION = 'tom_hum:0'; // MUST be 0 since window name might change dynamically (e.g. 2.1.71)
const LOG_FILE = path.join(process.env.HOME, 'tom_hum_cto.log');
const CHECK_INTERVAL_MS = process.env.VIBE_INTERVAL || 30_000;

// Auto-detect panes from tmux (fallback to static config)
function buildPanesConfig() {
    const staticPanes = [
        { idx: 0, project: 'mekong-cli', dir: path.join(process.env.HOME, 'mekong-cli'), focus: 'Core packages, vibe SDK, scripts, infra tooling' },
        { idx: 1, project: 'sophia-ai-factory', dir: path.join(process.env.HOME, 'mekong-cli/apps/sophia-ai-factory'), focus: 'Sophia AI Video Factory' },
        { idx: 2, project: 'well', dir: path.join(process.env.HOME, 'mekong-cli/apps/well'), focus: 'RaaS platform, i18n, Supabase, PayOS' },
        { idx: 3, project: 'algo-trader', dir: path.join(process.env.HOME, 'mekong-cli/apps/algo-trader'), focus: 'Cross-exchange arbitrage engine' },
        { idx: 4, project: 'strategic', dir: path.join(process.env.HOME, 'mekong-cli'), focus: '⭐ OPUS 4.6 STRATEGIC', isOpus: true },
    ];
    // Validate panes actually exist in tmux
    try {
        const tmuxPanes = execSync(`tmux list-panes -t ${SESSION} -F "#{pane_index}" 2>/dev/null`, { encoding: 'utf-8' }).trim().split('\n');
        const validIdxs = new Set(tmuxPanes.map(Number));
        return staticPanes.filter(p => validIdxs.has(p.idx));
    } catch {
        return staticPanes;
    }
}
const PANES = buildPanesConfig();

// ══════════════════════════════════════════════════
// TASK_POOLS — hardcoded per project (thay thế LLM Vision)
// Mỗi project có pool tasks xoay vòng, không cần gọi LLM
// ══════════════════════════════════════════════════
const TASK_POOLS = {
    'well': [
        '/cook "Well: PayOS webhook — verify signature validation, idempotency key, retry logic, error response codes" --auto',
        '/cook "Well: Supabase RLS — audit all tables have row-level security policies, test with anon/auth roles" --auto',
        '/cook "Well: i18n audit — grep t() calls vs vi.ts/en.ts, fix missing keys, verify no raw strings in JSX" --auto',
        '/cook "Well: Auth flow — login/register/forgot-password, session refresh, protected route guards, error states" --auto',
        '/cook "Well: Error boundary — add React error boundaries for all route segments, fallback UI, error logging" --auto',
    ],
    'sophia-ai-factory': [
        '/cook "Sophia: Video pipeline — ffmpeg transcoding errors, timeout handling, retry logic, progress tracking" --auto',
        '/cook "Sophia: Campaign template — fix broken variables, preview mode, mobile responsive, edge cases" --auto',
        '/cook "Sophia: Deploy fix — TypeScript strict mode, build errors, verify Vercel deploy passes clean" --auto',
        '/cook "Sophia: AI service test — verify all AI endpoints respond, error handling, rate limit graceful degradation" --auto',
    ],
    'algo-trader': [
        '/cook "Algo-Trader: WebSocket reconnect — auto-reconnect on disconnect, exponential backoff, state recovery" --auto',
        '/cook "Algo-Trader: Order book sync — stale data detection, depth snapshot recovery, latency tracking" --auto',
        '/cook "Algo-Trader: API key rotate — secure key storage, rotation script, per-exchange rate limit tracking" --auto',
        '/cook "Algo-Trader: Exchange engine perf — spread calculation edge cases, slippage protection, benchmark latency" --auto',
    ],
    'mekong-cli': [
        '/cook "Mekong-CLI: Vibe SDK types — Pydantic models, type hints on all public methods, mypy clean" --auto',
        '/cook "Mekong-CLI: CI pipeline — fix pytest failures, flaky test detection, verify GitHub Actions green" --auto',
        '/cook "Mekong-CLI: Pytest fix — run full test suite, fix broken tests, ensure 100% pass rate" --auto',
        '/cook "Mekong-CLI: Agent module audit — fix imports in git_agent/file_agent/shell_agent, error handling" --auto',
    ],
};
const taskPoolCounters = {}; // project → index for round-robin

function getNextPoolTask(project) {
    const pool = TASK_POOLS[project];
    if (!pool || pool.length === 0) return null;
    if (!taskPoolCounters[project]) taskPoolCounters[project] = 0;
    const idx = taskPoolCounters[project] % pool.length;
    taskPoolCounters[project]++;
    return pool[idx];
}

// ══════════════════════════════════════════════════
// 🧠 SMART TASK FROM REALITY — scan project state, return specific task
// Priority: test fail > build error > dirty files > TODO cleanup > null (fallback to pool)
// ══════════════════════════════════════════════════
function smartTaskFromReality(pane) {
    const { dir, project } = pane;

    // 1) npm test — highest priority: failing tests = broken product
    try {
        const testOut = execSync('npm test 2>&1 | tail -10', {
            cwd: dir, encoding: 'utf-8', timeout: 30000
        }).trim();
        // Detect test failures (jest/vitest patterns)
        if (/FAIL|failing|failed|✕|×|Error:|AssertionError/i.test(testOut)) {
            const failSnippet = testOut.split('\n').filter(l => /FAIL|✕|Error/i.test(l)).slice(0, 3).join('; ');
            log(`P${pane.idx}: 🧠 REALITY: npm test FAILED — ${failSnippet.slice(0, 80)}`);
            return `/debug "${project}: Test failures detected. Analyze: ${failSnippet.slice(0, 200).replace(/"/g, '\\"')}. Fix source code, run npm test to verify." --auto`;
        }
    } catch (e) {
        // npm test exit code != 0 means failure
        const stderr = (e.stderr || e.stdout || '').trim();
        if (stderr && !/missing script|ERR!.*test/.test(stderr)) {
            const snippet = stderr.split('\n').slice(-5).join('; ').slice(0, 200).replace(/"/g, '\\"');
            log(`P${pane.idx}: 🧠 REALITY: npm test CRASHED — ${snippet.slice(0, 80)}`);
            return `/debug "${project}: Tests crashed. Error: ${snippet}. Fix and verify with npm test." --auto`;
        }
    }

    // 2) git diff --stat — detect uncommitted changes that need attention
    try {
        const diffStat = execSync('git diff --stat 2>/dev/null', {
            cwd: dir, encoding: 'utf-8', timeout: 5000
        }).trim();
        if (diffStat) {
            const changedFiles = diffStat.split('\n').filter(l => l.includes('|')).map(l => l.split('|')[0].trim()).slice(0, 5);
            const codeFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx|py)$/.test(f));
            if (codeFiles.length > 0) {
                const fileList = codeFiles.join(', ');
                log(`P${pane.idx}: 🧠 REALITY: git diff has ${codeFiles.length} changed files — ${fileList.slice(0, 80)}`);
                return `/cook "${project}: Uncommitted changes in ${fileList}. Review changes, run build/test, fix any errors, commit if clean." --auto`;
            }
        }
    } catch { }

    // 3) git status --porcelain — untracked/staged files
    try {
        const gs = execSync('git status --porcelain 2>/dev/null | head -5', {
            cwd: dir, encoding: 'utf-8', timeout: 5000
        }).trim();
        if (gs) {
            const dirtyFiles = gs.split('\n').filter(Boolean).map(l => l.trim().slice(3));
            const codeFiles = dirtyFiles.filter(f => /\.(ts|tsx|py|js|jsx)$/.test(f));
            if (codeFiles.length > 0) {
                const fileList = codeFiles.slice(0, 3).join(', ');
                log(`P${pane.idx}: 🧠 REALITY: dirty files — ${fileList}`);
                return `/cook "${project}: Dirty files: ${fileList}. Run build/test, fix errors, commit if clean." --auto`;
            }
        }
    } catch { }

    // 4) TODO/FIXME count — if excessive, clean up
    try {
        const todoOut = execSync('grep -rc "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.claude 2>/dev/null | awk -F: \'{s+=$2} END {print s}\'', {
            cwd: dir, encoding: 'utf-8', timeout: 5000
        }).trim();
        const todoCount = parseInt(todoOut) || 0;
        if (todoCount > 10) {
            log(`P${pane.idx}: 🧠 REALITY: ${todoCount} TODOs found — cleaning`);
            return `/cook "${project}: ${todoCount} TODO/FIXME found. Clean up top 10 most critical TODOs, resolve or remove stale ones. Run build after." --auto`;
        }
    } catch { }

    // Nothing actionable found → return null, fallback to TASK_POOLS
    return null;
}

// Legacy wrapper (kept for backward compat if referenced elsewhere)
function getSmartTask(pane) { return smartTaskFromReality(pane); }

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

// 🧠 Detect REAL project from tmux pane's actual working directory
function detectRealProject(paneIdx) {
    try {
        const panePath = execSync(`tmux display-message -t ${SESSION}.${paneIdx} -p '#{pane_current_path}' 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim();
        if (!panePath) return null;
        // Extract project name from path
        const match = panePath.match(/\/apps\/([^\/]+)/);
        if (match) return { project: match[1], dir: panePath };
        // Root mekong-cli
        if (panePath.endsWith('/mekong-cli') || panePath.includes('/mekong-cli/packages')) return { project: 'mekong-cli', dir: panePath };
        return { project: path.basename(panePath), dir: panePath };
    } catch { return null; }
}

// 🔧 CENTRALIZED RESPAWN — uses -c flag for reliable cwd (fixes P0 wrong-project bug)
function respawnPane(paneIdx, dir, flags = '') {
    // 🔒 IRON GUARD: P0 = Chủ Tịch pane — CẤM respawn
    if (paneIdx === 0) {
        log(`P0: 🔒 IRON GUARD — BLOCKED respawnPane (Chủ Tịch pane protected)`);
        return false;
    }
    const realDir = detectRealProject(paneIdx)?.dir || dir;
    // P5 (paneIdx 4) is legally bound to Opus 4.6
    const isOpus = paneIdx === 4;
    const prefix = isOpus ? 'CLAUDE_CONFIG_DIR=~/.claude-opus ' : '';
    const cmd = `${prefix}/Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions${flags ? ' ' + flags : ''}`;
    try {
        execSync(`tmux respawn-pane -k -t ${SESSION}.${paneIdx} -c '${realDir}' '${cmd}'`);
        return true;
    } catch { return false; }
}

function tmuxSendBuffer(paneIdx, text) {
    // 🔒 IRON GUARD: P0 = Chủ Tịch pane — TUYỆT ĐỐI CẤM auto-inject
    if (paneIdx === 0) {
        log(`P0: 🔒 IRON GUARD — BLOCKED tmuxSendBuffer (Chủ Tịch pane protected)`);
        return false;
    }
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
    // 🔒 IRON GUARD: P0 = Chủ Tịch pane — CẤM send keys
    if (paneIdx === 0) return;
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
// SCORE HISTORY TRACKER (lightweight, no LLM)
// ══════════════════════════════════════════════════
const SCORE_HISTORY_FILE = '/tmp/vibe-score-history.json';

function recordScore(project, scoreResult) {
    try {
        const history = JSON.parse(fs.readFileSync(SCORE_HISTORY_FILE, 'utf-8'));
        if (!history[project]) history[project] = [];
        history[project].push({ ts: Date.now(), total: scoreResult.total, grade: scoreResult.grade });
        if (history[project].length > 20) history[project] = history[project].slice(-20);
        fs.writeFileSync(SCORE_HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch { }
}

// ══════════════════════════════════════════════════
// PANE STATE DETECTOR
// ══════════════════════════════════════════════════

// ══════════════════════════════════════════════════
// 🏭 PROGRESS TRACKING — track injected task, check completion before new inject
// ══════════════════════════════════════════════════
const paneProgress = {}; // paneIdx → { task, injectedAt, completed }

function isPaneTaskComplete(paneIdx, output) {
    const progress = paneProgress[paneIdx];
    if (!progress || progress.completed) return true; // No pending task or already done

    // CC CLI completion indicators: "Cooked for", "Worked for", "Crunched for", etc.
    const completionPattern = /(?:Cooked|Worked|Crunched|Sautéed|Choreographed|Cogitated)\s+for\s+\d/i;
    if (completionPattern.test(output)) {
        const elapsed = Math.round((Date.now() - progress.injectedAt) / 1000);
        log(`P${paneIdx}: ✅ TASK COMPLETED (${elapsed}s) — ${progress.task.slice(0, 60)}...`);
        progress.completed = true;
        return true;
    }

    const elapsed = Math.round((Date.now() - progress.injectedAt) / 1000);
    log(`P${paneIdx}: ⏳ TASK IN PROGRESS (${elapsed}s) — waiting for completion`);
    return false;
}

function trackInjectedTask(paneIdx, taskCmd) {
    paneProgress[paneIdx] = { task: taskCmd, injectedAt: Date.now(), completed: false };
}

// 🛡️ COOLDOWN — 300s unified (tránh inject liên tục gây context cháy)
const SIMPLE_COOLDOWN_MS = 300000;
const COMPLEX_COOLDOWN_MS = 300000;
const lastInjection = {}; // paneIdx → { ts, type: 'simple'|'complex' }

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
    log(`P${paneIdx}: 📝 Recorded ${type} injection, cooldown=300s`);
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
    // 🔴 MODEL_UNAVAILABLE: CC CLI says model doesn't exist or no access
    if (/issue with the selected model|model.*not exist|not have access to it|Run \/model to pick/.test(output)) return 'MODEL_UNAVAILABLE';
    if (/rate-limit-options|You've hit your limit|API Error: 429|"code":"throttling"|quota exceeded|AccountQuotaExceeded|TooManyRequests|exceeded the.*usage quota|Retrying in \d+ seconds/.test(output)) return 'RATE_LIMITED';
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

    // 🛡️ SYSTEM RAM GUARD: Prevent SSD drowning (Swap files)
    try {
        const memInfo = execSync('top -l 1 | grep PhysMem', { encoding: 'utf-8' });
        const usedMatch = memInfo.match(/(\d+)G used/);
        if (usedMatch) {
            const usedG = parseInt(usedMatch[1]);
            if (usedG >= 14) { // > 14GB of 16GB
                log(`🚨 RAM CRITICAL: ${usedG}GB used. Force compacting IDLE panes...`);
                for (const p of PANES) {
                    if (p.idx === 0) continue; // P0 = Chủ Tịch pane, SKIP auto-compact
                    const out = tmuxCapture(p.idx, 5);
                    if (/❯\s*$/.test(out) && !out.includes('Cooking')) {
                        tmuxSendKeys(p.idx, 'Escape');
                        execSync(`tmux send-keys -t ${SESSION}.${p.idx} '/compact' Enter 2>/dev/null || true`);
                    }
                }
            }
        }
    } catch (e) { }

    for (const pane of PANES) {
        // P0 = Chủ Tịch pane — SKIP auto-inject/compact, chỉ Chủ Tịch ra lệnh trực tiếp
        if (pane.idx === 0) {
            log(`P0: 👑 CHỦ TỊCH PANE — SKIP auto-inject`);
            continue;
        }
        // 🧠 DYNAMIC PROJECT DETECTION — override static config with real tmux path
        const realProject = detectRealProject(pane.idx);
        if (realProject && realProject.project !== pane.project) {
            log(`P${pane.idx}: 🔄 PROJECT SYNC: config=${pane.project} → actual=${realProject.project}`);
            pane.project = realProject.project;
            pane.dir = realProject.dir;
        }

        const output = tmuxCapture(pane.idx);
        const regexState = detectPaneState(output);

        // 🛡️ STATE = regex-only (no LLM guard — CTO không gọi LLM)
        const state = regexState;

        switch (state) {
            case 'DEAD':
                log(`P${pane.idx}: 💀 DEAD — respawning with --continue`);
                respawnPane(pane.idx, pane.dir, '--continue');
                // Will inject task next cycle after boot
                log(`P${pane.idx}: ✅ Respawned, task will inject next cycle`);
                break;

            case 'CRASHED':
                log(`P${pane.idx}: 🔴 CRASHED — respawn-pane -k with --continue`);
                respawnPane(pane.idx, pane.dir, '--continue');
                break;

            case 'MODEL_UNAVAILABLE': {
                // Model not available on current provider → switch model for THIS pane only
                // Read current settings to find available fallback model
                log(`P${pane.idx}: 🔶 MODEL_UNAVAILABLE — switching to fallback model`);
                try {
                    const settingsPath = path.join(process.env.HOME, '.claude/settings.json');
                    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
                    const currentModel = settings.env?.ANTHROPIC_MODEL || settings.model || '';
                    const baseUrl = settings.env?.ANTHROPIC_BASE_URL || '';

                    // Pick fallback based on provider
                    let fallbackModel = 'qwen-plus'; // safe default on most providers
                    if (baseUrl.includes('siliconflow')) fallbackModel = 'Qwen/Qwen3-Coder-Plus';
                    else if (baseUrl.includes('bytepluses')) fallbackModel = 'kimi-k2.5';
                    else if (baseUrl.includes('dashscope')) fallbackModel = 'qwen3-coder-plus';

                    if (currentModel !== fallbackModel) {
                        settings.env.ANTHROPIC_MODEL = fallbackModel;
                        settings.model = fallbackModel;
                        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                        log(`P${pane.idx}: 📝 Model switched: ${currentModel} → ${fallbackModel}`);
                    }
                } catch (e) {
                    log(`P${pane.idx}: ⚠️ Settings update failed: ${e.message}`);
                }
                // Respawn only this pane (not all panes)
                respawnPane(pane.idx, pane.dir);
                lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
                break;
            }

            case 'CONTEXT_LIMIT': {
                // Check if context is truly at 0% — if so, respawn fresh (compact won't help)
                const ctxOutput = tmuxCapture(pane.idx, 5);
                if (/0% remaining/.test(ctxOutput) || /Context low \(0%/.test(ctxOutput)) {
                    log(`P${pane.idx}: 🔴 CONTEXT 0% — /compact won't help. RESPAWNING FRESH...`);
                    respawnPane(pane.idx, pane.dir);
                    lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
                } else {
                    log(`P${pane.idx}: 🔴 CONTEXT LIMIT REACHED — sending /compact`);
                    tmuxSendKeys(pane.idx, 'Escape');
                    await sleep(300);
                    execSync(`tmux send-keys -t ${SESSION}.${pane.idx} 'C-u' '/compact' Enter 2>/dev/null || true`);
                    lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
                }
                break;
            }

            case 'LOW_CONTEXT': {
                const lowCtxOut = tmuxCapture(pane.idx, 5);
                if (/0% remaining/.test(lowCtxOut)) {
                    log(`P${pane.idx}: 🟡 LOW CONTEXT 0% — RESPAWNING FRESH...`);
                    respawnPane(pane.idx, pane.dir);
                    lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
                } else {
                    log(`P${pane.idx}: 🟡 LOW CONTEXT — letting CC CLI finish (no restart)`);
                }
                break;
            }

            case 'RATE_LIMITED': {
                // Rate limited — respawn pane to reset session (no provider rotation needed)
                log(`P${pane.idx}: 🔶 RATE LIMITED — respawning pane to reset`);
                respawnPane(pane.idx, pane.dir);
                break;
            }

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

                // 🏭 PROGRESS CHECK — if previous task not completed, don't inject new one
                if (!isPaneTaskComplete(pane.idx, output)) break;

                // 🦞 PRE-FLIGHT CONTEXT CHECK
                const ctxMatch = output.match(/Context left until auto-compact: (\d+)%/);
                if (ctxMatch) {
                    const ctx = parseInt(ctxMatch[1], 10);
                    if (ctx <= 45) {
                        log(`P${pane.idx}: 🟡 AGGRESSIVE STABILITY: Context ${ctx}% <= 45%. Compacting...`);
                        tmuxSendKeys(pane.idx, 'Escape');
                        await sleep(300);
                        execSync(`tmux send-keys -t ${SESSION}.${pane.idx} 'C-u' '/compact' Enter 2>/dev/null || true`);
                        lastInjection[pane.idx] = { ts: Date.now(), type: 'simple' };
                        break;
                    }
                }

                // 🏭 REALITY SCANNER: scan real state → gen task → inject
                log(`P${pane.idx}: ⏸️ IDLE — REALITY SCANNER...`);

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
                recordScore(pane.project, scoreResult);
                const isGradeS = scoreResult.grade === 'S';

                const intel = scanCodebase(pane);
                log(`P${pane.idx}: 📊 ${pane.project} | Score: ${scoreResult.total}/100 (${scoreResult.grade}) | git=${intel.gitStatus}, todos=${intel.todoCount}`);

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
                        const result = global.factoryPipeline.advanceStage(activePipeline.id);
                        if (result.advanced) {
                            cookCmd = `${result.command} --auto`;
                            log(`P${pane.idx}: 🏭 PIPELINE [${activePipeline.currentStage} → ${result.nextStage}] | ${result.toyota}`);
                        } else if (result.completed) {
                            log(`P${pane.idx}: 🎉 PIPELINE COMPLETED! All 5 stages shipped.`);
                        } else {
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

                // ═══ 🧠 SMART DISPATCH: REALITY → EXTERNAL QUEUE → POOL FALLBACK ═══

                // --- Step 1: 🧠 REALITY SCAN — real project state drives task selection ---
                if (!cookCmd) {
                    const realityTask = smartTaskFromReality(pane);
                    if (realityTask) {
                        cookCmd = realityTask;
                        log(`P${pane.idx}: 🧠 REALITY TASK: ${cookCmd.slice(0, 80)}...`);
                    }
                }

                // --- Step 2: 📋 EXTERNAL TASK QUEUE CHECK ---
                if (!cookCmd) {
                    try {
                        const tasksDir = '/Users/macbookprom1/mekong-cli/tasks';
                        if (fs.existsSync(tasksDir)) {
                            const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.txt'));
                            if (files.length > 0) {
                                const myTasks = files.filter(f => {
                                    const n = f.toLowerCase();
                                    const isP0 = pane.project === 'openclaw-worker';
                                    const isP1 = pane.project === 'well';
                                    const isP2 = pane.project === 'mekong-cli';
                                    const isP3 = pane.project === 'sophia-ai-factory';
                                    const isP4 = pane.isOpus;
                                    const isP5 = pane.project === 'algo-trader';

                                    const hasP0 = n.includes('openclaw') || n.includes('brain') || n.includes('cto');
                                    const hasP1 = n.includes('well') || n.includes('wellnexus');
                                    const hasP2 = n.includes('mekong') || n.includes('vibe') || n.includes('core');
                                    const hasP3 = n.includes('sophia');
                                    const hasP4 = n.includes('strategic') || n.includes('roiaas') || n.includes('binh_phap') || n.includes('10x') || n.includes('opus');
                                    const hasP5 = n.includes('algo') || n.includes('trading');

                                    if (isP0 && hasP0) return true;
                                    if (isP1 && hasP1) return true;
                                    if (isP2 && hasP2) return true;
                                    if (isP3 && hasP3) return true;
                                    if (isP4 && hasP4) return true;
                                    if (isP5 && hasP5) return true;

                                    // NEVER default unmatched tasks to P4 (Opus)
                                    if (isP0 && !hasP0 && !hasP1 && !hasP2 && !hasP3 && !hasP4 && !hasP5) return true;

                                    return false;
                                });

                                if (myTasks.length > 0) {
                                    myTasks.sort((a, b) => {
                                        const w = f => f.startsWith('CRITICAL') ? 3 : f.startsWith('HIGH') ? 2 : 1;
                                        return w(b) - w(a);
                                    });
                                    const taskFile = myTasks[0];
                                    const content = fs.readFileSync(path.join(tasksDir, taskFile), 'utf8');

                                    const safeContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').slice(0, 1500);
                                    cookCmd = `/cook "EXTERNAL TASK: ${taskFile}\\n${safeContent}" --auto`;

                                    const procDir = path.join(tasksDir, 'processed');
                                    if (!fs.existsSync(procDir)) fs.mkdirSync(procDir);
                                    fs.renameSync(path.join(tasksDir, taskFile), path.join(procDir, taskFile));
                                    log(`P${pane.idx}: 📬 DISPATCHED task: ${taskFile}`);
                                }
                            }
                        }
                    } catch (e) {
                        log(`P${pane.idx}: ⚠️ Task Queue error: ${e.message}`);
                    }
                }
                // --- Step 3: 🏭 POOL FALLBACK — round-robin hardcoded tasks ---
                if (!cookCmd) {
                    const poolTask = getNextPoolTask(pane.project);
                    if (poolTask) {
                        cookCmd = poolTask;
                        log(`P${pane.idx}: 🏭 POOL FALLBACK: ${cookCmd.slice(0, 80)}...`);
                    } else {
                        log(`P${pane.idx}: ⏸️ No tasks for ${pane.project}. Skipping injection.`);
                    }
                }

                // 🛡️ UNIFIED INJECT GATE — cooldown + command prefix guard
                if (cookCmd && !cookCmd.startsWith('/')) {
                    log(`P${pane.idx}: ⛔ BLOCKED raw text → wrapping with /cook prefix`);
                    cookCmd = `/cook "${cookCmd.replace(/"/g, '\\"')}" --auto`;
                }
                if (cookCmd) {
                    log(`P${pane.idx}: 🚀 INJECTING: ${cookCmd.slice(0, 100)}...`);
                    tmuxSendBuffer(pane.idx, cookCmd);
                    recordInjection(pane.idx, cookCmd);
                    trackInjectedTask(pane.idx, cookCmd); // 🏭 Track for progress check
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

log('✅ CTO: No LLM calls needed — pure regex + pool + smart detection');

// Run immediately
checkAllPanes();

// Then loop
setInterval(checkAllPanes, CHECK_INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => { log('🏭 VIBE FACTORY stopped'); process.exit(0); });
process.on('SIGTERM', () => { log('🏭 VIBE FACTORY stopped'); process.exit(0); });
