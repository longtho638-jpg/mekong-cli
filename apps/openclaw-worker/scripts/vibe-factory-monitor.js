#!/usr/bin/env node
/**
 * 🏭 VIBE CODING FACTORY MONITOR v1
 * 
 * Thay thế night-monitor.sh (generic task injection) bằng
 * AGI-level codebase-aware task generation.
 * 
 * Flow cho mỗi pane:
 *   1) Quét codebase (git status, recent commits, TODOs, build status)
 *   2) Gửi context cho LLM (qua Antigravity Proxy) để gen /cook task chính xác
 *   3) Inject task vào CC CLI qua tmux buffer (an toàn, không crash)
 *   4) Monitor tiến độ, auto-Enter khi kẹt, auto-restart khi crash
 * 
 * Binh Pháp: 始計 (scan) → 謀攻 (plan) → 軍爭 (execute) → 九變 (adapt)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ══════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════
const SESSION = 'tom_hum:brain';
const LOG_FILE = path.join(process.env.HOME, 'tom_hum_vibe.log');
const PROXY_PORT = 9191;
const CHECK_INTERVAL_MS = 90_000; // 90s (smarter = less frequent)
const FALLBACK_MODEL = 'gemini-3-pro';

const PANES = [
    { idx: 0, project: 'mekong-cli', dir: path.join(process.env.HOME, 'mekong-cli'), focus: 'AGI agentic skills + ClaudeKit commands for all business domains' },
    { idx: 1, project: 'well', dir: path.join(process.env.HOME, 'mekong-cli/apps/well'), focus: 'RaaS platform, i18n, Supabase, PayOS integration' },
    { idx: 2, project: 'algo-trader', dir: path.join(process.env.HOME, 'mekong-cli/apps/algo-trader'), focus: 'Cross-exchange arbitrage engine (Binance/OKX/Bybit)' },
    { idx: 3, project: 'apex-os', dir: path.join(process.env.HOME, 'mekong-cli/apps/apex-os'), focus: 'SaaS-to-RaaS transformation, crypto zero-fee exchange' },
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
    const tmpFile = `/tmp/vibe_task_p${paneIdx}.txt`;
    fs.writeFileSync(tmpFile, text);
    try {
        execSync(`tmux load-buffer ${tmpFile}`);
        execSync(`tmux paste-buffer -t ${SESSION}.${paneIdx}`);
        execSync('sleep 0.3');
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
// BINH PHAP OPEN-SOURCE MAP
// ══════════════════════════════════════════════════
const BINH_PHAP_MAP = [
    { chapter: 'Ch.1 始計 Kế Sách (Planning)', repos: 'google/A2UI, anthropics/claude-code' },
    { chapter: 'Ch.2 作戰 Tác Chiến (Resources)', repos: 'upstash/qstash, trigger-dev/trigger.dev' },
    { chapter: 'Ch.3 謀攻 Mưu Công (Win W/O Fight)', repos: 'n8n-io/n8n, langchain-ai/langgraph' },
    { chapter: 'Ch.4 軍形 Quân Hình (CI/CD Gates)', repos: 'google/zx, biomejs/biome' },
    { chapter: 'Ch.5 兵勢 Binh Thế (Momentum)', repos: 'vercel/ai, huggingface/transformers.js' },
    { chapter: 'Ch.6 虛實 Hư Thực (Smart Routing)', repos: 'BerriAI/litellm, portkey-ai/gateway' },
    { chapter: 'Ch.7 軍爭 Quân Tranh (Execution)', repos: 'railway/nixpacks, pulumi/pulumi' },
    { chapter: 'Ch.8 九變 Cửu Biến (Adaptation)', repos: 'temporal-io/temporal, inngest/inngest' },
    { chapter: 'Ch.9 行軍 Hành Quân (Observability)', repos: 'grafana/grafana, highlight/highlight' },
    { chapter: 'Ch.10 地形 Địa Hình (Architecture)', repos: 'electron/electron, nicegui/nicegui' },
    { chapter: 'Ch.11 九地 Cửu Địa (Recovery)', repos: 'netdata/netdata, louislam/uptime-kuma' },
    { chapter: 'Ch.12 火攻 Hỏa Công (Disruption)', repos: 'cal-com/cal.com, formbricks/formbricks' },
    { chapter: 'Ch.13 用間 Dụng Gián (Intelligence)', repos: 'mem0ai/mem0, qdrant/qdrant' }
];

const dedup = require('../lib/task-dedup-registry.js');

// ══════════════════════════════════════════════════
// LLM TASK GENERATOR (Binh Pháp Strategic Scanner)
// NEVER returns null — always produces a /plan:hard task
// ══════════════════════════════════════════════════
async function generateScoreTargetedTask(pane, scoreResult) {
    // 1. Sort dimensions by score (lowest first)
    const sorted = Object.entries(scoreResult.breakdown)
        .sort(([, a], [, b]) => a - b);

    // 2. Each pane targets a DIFFERENT weak dimension (P0=weakest, P1=2nd, etc.)
    const dimIndex = Math.min(pane.idx, sorted.length - 1);
    const [weakestDim, weakestScore] = sorted[dimIndex];
    let taskCmd = '';
    const proj = pane.project;

    // Map dimension to SPECIFIC, MEASURABLE tasks with verification steps
    switch (weakestDim) {
        case 'planning':
            taskCmd = `/cook "PLANNING ${proj}: 1/ Create docs/plan.md with project overview, architecture, acceptance criteria. 2/ Create CONTRIBUTING.md with dev setup steps. 3/ Verify: cat docs/plan.md | wc -l shows >30 lines."`;
            break;
        case 'resources':
            taskCmd = `/cook "RESOURCES ${proj}: 1/ npm outdated — update critical deps. 2/ npm audit fix. 3/ Commit package-lock.json. 4/ Verify: npm audit shows 0 critical, npm ls --depth=0 clean."`;
            break;
        case 'ci_cd':
            taskCmd = `/cook "CI/CD ${proj}: 1/ Create .github/workflows/ci.yml: lint + typecheck + test + build jobs. 2/ Add missing npm scripts. 3/ Verify: cat .github/workflows/ci.yml shows 4 job names."`;
            break;
        case 'build':
            taskCmd = `/cook "BUILD ${proj}: 1/ npm run build — fix ALL errors. 2/ Add build script if missing. 3/ Fix TS compilation errors. 4/ Verify: npm run build exits 0."`;
            break;
        case 'tests':
            taskCmd = `/cook "TESTS ${proj}: 1/ npm test — fix failing tests. 2/ Write 3+ unit tests for core modules if <3 test files. 3/ Verify: npm test exits 0, find . -name '*.test.*' | wc -l shows >=3."`;
            break;
        case 'security':
            taskCmd = `/cook "SECURITY ${proj}: 1/ npm audit fix. 2/ Create .env.example if .env exists. 3/ grep secrets in src/. 4/ Verify: npm audit shows 0 critical/high."`;
            break;
        case 'performance':
            taskCmd = `/cook "PERFORMANCE ${proj}: 1/ find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn — split largest file >300 lines. 2/ Remove dead exports. 3/ Verify: no src file >300 lines."`;
            break;
        case 'typescript':
            taskCmd = `/cook "TYPESCRIPT ${proj}: 1/ Set strict:true in tsconfig.json. 2/ npx tsc --noEmit — fix errors. 3/ Replace any with proper types. 4/ Verify: npx tsc --noEmit exits 0."`;
            break;
        case 'production':
            taskCmd = `/cook "PRODUCTION ${proj}: 1/ git add -A && git status. 2/ git commit -m 'chore: cleanup'. 3/ Ensure .gitignore covers node_modules,.env,dist. 4/ Verify: git status shows clean tree."`;
            break;
        case 'docs':
            taskCmd = `/cook "DOCS ${proj}: 1/ README.md: add description, install, usage, architecture (>50 lines). 2/ Create CLAUDE.md with project context. 3/ JSDoc top 3 functions. 4/ Verify: wc -l README.md shows >50."`;
            break;
        default:
            taskCmd = `/cook "GENERAL ${proj}: npm run build && npm test. Fix errors. git add -A && git commit."`;
    }

    log(`P${pane.idx}: 🎯 TARGET[${dimIndex}] ${weakestDim.toUpperCase()} (Score: ${weakestScore}) for ${proj}`);

    const finalCmd = `${taskCmd} --auto`;
    dedup.recordTask(finalCmd, pane.project, pane.idx, `Targeting: ${weakestDim}`);

    return finalCmd;
}

// ══════════════════════════════════════════════════
// PANE STATE DETECTOR
// ══════════════════════════════════════════════════

// 🛡️ INJECTION COOLDOWN — prevent duplicate task injection
const INJECTION_COOLDOWN_MS = 180000; // 3 minutes
const lastInjection = {}; // paneIdx → timestamp

function isInCooldown(paneIdx) {
    const last = lastInjection[paneIdx];
    if (!last) return false;
    const elapsed = Date.now() - last;
    if (elapsed < INJECTION_COOLDOWN_MS) {
        const remaining = Math.ceil((INJECTION_COOLDOWN_MS - elapsed) / 1000);
        log(`P${paneIdx}: 🛡️ COOLDOWN — ${remaining}s remaining, SKIP injection`);
        return true;
    }
    return false;
}

function recordInjection(paneIdx) {
    lastInjection[paneIdx] = Date.now();
}

function detectPaneState(output) {
    if (!output || output.includes('Pane is dead')) return 'DEAD';
    if (/macbookprom1@.*%/.test(output) || /zsh: command not found/.test(output) || /zsh: no such file or directory/.test(output) || /bash-3\.2\$/.test(output)) return 'CRASHED';
    if (/Context low.*[0-5]% remaining/.test(output)) return 'LOW_CONTEXT';
    if (/rate-limit-options|You've hit your limit/.test(output)) return 'RATE_LIMITED';
    if (/❯ git (push|commit|add)|queued messages|Press up to edit/.test(output)) return 'PENDING';
    // 🏭 FIX: CC CLI idle patterns — bypass on, cooked (finished), or just ❯ prompt
    // Fresh boot: shows `try "how do I log an error?"` or `try "fix typecheck errors"`
    if (/(›|❯)\s*[Tt]ry "/.test(output) && /bypass permissions on/.test(output)) return 'IDLE';
    if (/bypass permissions on/.test(output) && !/Searching|Running|Explore|Read \d|Smooshing|Whisking|Bloviating|Churning|Building|Prestidigitating|Flowing|Crafting|Spiraling|Nesting|Puttering|Zigzagging|Perambulating|Hashing/.test(output)) return 'IDLE';
    if (/Cooked for \d/.test(output)) return 'IDLE';
    if (/Crunched for \d/.test(output)) return 'IDLE';
    if (/Choreographed for \d/.test(output)) return 'IDLE';
    if (/Sautéed for \d/.test(output)) return 'IDLE';
    if (/\w+ed for \d+[ms]/.test(output) && /bypass permissions on/.test(output) && /❯/.test(output)) return 'IDLE';
    if (/❯\s*$/.test(output)) return 'IDLE';
    if (/(Whisking|Bloviating|Churning|Crystallizing|Sprouting|Deciphering|Prestidigitating|Puttering|Nesting|Crafting|Crunched|Warping|Flowing|Sock-hopping|Building|Sautéed|Zigzagging|Quantumizing|Cogitated|Enchanting|Discombobulating|Smooshing|Spiraling|Explore agents|Running \d|Perambulating|Hashing)/i.test(output)) return 'WORKING';
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

    // CTO health
    try {
        const cto = execSync('pgrep -f task-watcher 2>/dev/null').toString().trim();
        log(`CTO: ${cto ? '✅' : '❌'}`);
    } catch { log('CTO: ❌'); }

    // Proxy health (Tôm Hùm self-healer handles restart)
    try {
        execSync('curl -sf http://localhost:9191/health 2>/dev/null', { timeout: 3000 });
        log('PROXY: ✅');
    } catch { log('PROXY: ❌ — restart needed'); }

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
            // Only guard-check actionable states (DEAD, CRASHED, IDLE, PENDING)
            // Skip guard for WORKING/ACTIVE (no action needed anyway)
            if (['DEAD', 'CRASHED', 'IDLE', 'PENDING'].includes(regexState)) {
                const guard = await global.llmPerception.guardCheck(output, regexState, pane.project, pane.idx);
                if (!guard.agree && guard.correctedState) {
                    state = guard.correctedState;
                }
                if (!guard.shouldAct) {
                    log(`P${pane.idx}: 🛡️ GUARD: ${regexState} → SKIP (${guard.reason})`);
                    continue; // Skip this pane entirely
                }
            }
        } catch (e) {
            // Guard failed → use regex state (safe fallback)
        }

        switch (state) {
            case 'DEAD':
                log(`P${pane.idx}: 💀 DEAD — respawning`);
                try { execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && claude --dangerously-skip-permissions"`); } catch { }
                // Will inject task next cycle after bootlog(`P${pane.idx}: ✅ Respawned, task will inject next cycle`);
                break;

            case 'CRASHED':
                log(`P${pane.idx}: 🔴 CRASHED — restarting CC CLI`);
                try {
                    execSync(`tmux send-keys -t ${SESSION}.${pane.idx} "cd ${pane.dir} && claude --dangerously-skip-permissions" Enter`);
                } catch { }
                break;

            case 'LOW_CONTEXT':
                log(`P${pane.idx}: 🟡 LOW CONTEXT — fresh restart`);
                try { execSync(`tmux respawn-pane -k -t ${SESSION}.${pane.idx} "cd ${pane.dir} && claude --dangerously-skip-permissions"`); } catch { }
                break;

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

            case 'IDLE': {
                // 🛡️ COOLDOWN CHECK — skip if recently injected
                if (isInCooldown(pane.idx)) break;

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

                // --- 🏭 TPS: PRODUCTION BOARD → LLM → BINH PHÁP ---
                // 1. Check Production Board for queued Work Orders (only if no pipeline active)
                if (!cookCmd) {
                    try {
                        if (!global.productionBoard) {
                            global.productionBoard = require('../lib/production-board');
                            log('🏭 Production Board loaded');
                        }
                        // Mark previous WO as done if pane was working
                        const activeWO = global.productionBoard.getActiveByPane(pane.idx);
                        if (activeWO) {
                            global.productionBoard.markDone(activeWO.id);
                            log(`P${pane.idx}: ✅ WO ${activeWO.id} DONE — "${activeWO.what.slice(0, 40)}"`);
                        }
                        // Get next queued WO
                        const nextWO = global.productionBoard.getNextQueued(pane.project);
                        if (nextWO) {
                            global.productionBoard.assignToPane(nextWO.id, pane.idx);
                            cookCmd = nextWO.how || `/cook "${nextWO.what}"`;
                            log(`P${pane.idx}: 🏭 WO ${nextWO.id} ASSIGNED — "${nextWO.what.slice(0, 50)}" (takt: ${nextWO.taktTime}m)`);
                        }
                    } catch (e) {
                        log(`P${pane.idx}: ⚠️ Production Board unavailable (${e.message})`);
                    }

                    // 2. Fallback: LLM Perception smart prompt
                    if (!cookCmd) {
                        try {
                            if (!global.llmPerception) {
                                global.llmPerception = require('../lib/llm-perception');
                                log('🧠 LLM Perception Layer loaded');
                            }
                            const perception = await global.llmPerception.perceivePaneWithLLM(output, pane.project, pane.idx);
                            cookCmd = global.llmPerception.buildSmartPrompt(perception, pane.project);
                            if (cookCmd) log(`P${pane.idx}: 🧠 LLM PROMPT: ${cookCmd.slice(0, 80)}...`);
                        } catch (e) {
                            log(`P${pane.idx}: ⚠️ LLM fallback → regex mode (${e.message})`);
                        }
                    }

                    // 3. Fallback: Binh Pháp generic scanner
                    if (!cookCmd) {
                        cookCmd = await generateScoreTargetedTask(pane, scoreResult);
                    }
                }

                // 🛡️ UNIFIED INJECT GATE — cooldown 3min is the guard
                if (cookCmd) {
                    log(`P${pane.idx}: 🚀 INJECTING: ${cookCmd.slice(0, 100)}...`);
                    tmuxSendBuffer(pane.idx, cookCmd);
                    recordInjection(pane.idx); // 🛡️ Start cooldown 3min
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
log('🏭 VIBE CODING FACTORY v1 STARTED');
log(`Interval: ${CHECK_INTERVAL_MS / 1000}s | Panes: ${PANES.length} | Proxy: localhost:${PROXY_PORT}`);

// Run immediately
checkAllPanes();

// Then loop
setInterval(checkAllPanes, CHECK_INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => { log('🏭 VIBE FACTORY stopped'); process.exit(0); });
process.on('SIGTERM', () => { log('🏭 VIBE FACTORY stopped'); process.exit(0); });
