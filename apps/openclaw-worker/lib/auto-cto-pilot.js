/**
 * Auto-CTO Pilot v4 — 始計→謀攻→軍形 Goal-Driven Task Generation + Level 6 Strategic Autonomy
 *
 * 3-Phase cycle per project (aligned with BINH_PHAP_MASTER.md):
 *   Phase 1: 始計 SCAN — run build/lint/test, detect REAL issues
 *   Phase 2: 謀攻 PLAN — assess ROI, only cook critical/high severity
 *   Phase 3: 軍形 VERIFY — re-scan, GREEN → advance, RED → retry (max 3 cycles)
 *
 * Binh Pháp Principles:
 *   Ch.2 作戰: 日費千金 — Don't burn tokens on rapid-fire cycles (120s interval)
 *   Ch.3 謀攻: 上兵伐謀 — Plan before cook, strict idle guard
 *   DNA #3 Micro-Niche: Ship 1 pain, reject if not actionable
 *   Ch.8 九變: 有所不爭 — Skip low-value issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');
const { log, isBrainAlive } = require('./brain-process-manager');
const { isQueueEmpty } = require('./task-queue');
const { isOverheating, isSafeToScan } = require('./m1-cooling-daemon');
const { tryStrategicMission } = require('./strategic-brain');
const { scanRevenueHealth, generateRevenueMission } = require('./revenue-health-scanner');
const { generateEconomicMission } = require('./clawwork-integration');
const { dispatchDueTradingMissions } = require('./trading-cadence-scheduler');

let intervalRef = null;
const _paneQuestionCounts = new Map(); // 🧠 Per-pane question loop tracking for P0-P9

// 🔒 Mission dedup: prevent re-dispatching same error within 30min
const _dispatchedMissions = new Map(); // key → timestamp
const MISSION_DEDUP_TTL_MS = 30 * 60 * 1000; // 30min

function isMissionDuplicate(errorKey) {
  const lastSent = _dispatchedMissions.get(errorKey);
  if (!lastSent) return false;
  if (Date.now() - lastSent < MISSION_DEDUP_TTL_MS) return true;
  _dispatchedMissions.delete(errorKey); // expired
  return false;
}

function markMissionDispatched(errorKey) {
  _dispatchedMissions.set(errorKey, Date.now());
}

const SCAN_RESULT_FILE = path.join(__dirname, '..', '.cto-scan-state.json');
const MAX_FIX_CYCLES = 3;
const MAX_FIXES_PER_SCAN = 3;  // 🔒 Ch.6 虛實: focus force on fewer targets
// 🔒 Ch.2 作戰: Balanced speed — fast enough to detect idle, slow enough to not spam
const SCAN_INTERVAL_MS = 60000;    // 60s — dispatch only when pane truly idle
const FIX_INTERVAL_MS = 15000;     // 15s — fix/verify: phản xạ nhanh
const DEFAULT_INTERVAL_MS = 60000; // 60s — match scan speed

// --- BUG #11: Per-project consecutive failure tracking ---
const projectFailureCount = new Map();
const MAX_CONSECUTIVE_FAILURES = 3;

function onProjectMissionFailed(projectName) {
  const count = (projectFailureCount.get(projectName) || 0) + 1;
  projectFailureCount.set(projectName, count);
  if (count >= MAX_CONSECUTIVE_FAILURES) {
    log(`[AUTO-CTO] ${projectName}: ${count} consecutive failures, skipping for this cycle`);
    projectFailureCount.set(projectName, 0);
    return true; // Signal to skip this project
  }
  return false;
}

function onProjectMissionSuccess(projectName) {
  projectFailureCount.set(projectName, 0);
}

// --- State Management ---

function loadState() {
  try {
    if (fs.existsSync(SCAN_RESULT_FILE)) {
      return JSON.parse(fs.readFileSync(SCAN_RESULT_FILE, 'utf-8'));
    }
  } catch (e) { }
  return { currentProjectIdx: 0, phase: 'scan', cycle: 0, errors: [], fixIndex: 0 };
}

function saveState(state) {
  try {
    const tempFile = `${SCAN_RESULT_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2));
    fs.renameSync(tempFile, SCAN_RESULT_FILE);
  } catch (e) { }
}

// --- Phase 1: 始計 SCAN — Detect real issues ---

function scanProject(projectDir) {
  const errors = [];
  const projectName = path.basename(projectDir);

  // Check if project has package.json
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    log(`AUTO-CTO [始計]: ${projectName} — no package.json, skipping`);
    return null; // Not a valid project
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const scripts = pkg.scripts || {};

  // BUILD check
  if (scripts.build) {
    try {
      execSync('npm run build 2>&1', { cwd: projectDir, encoding: 'utf-8', timeout: 120000 });
      log(`AUTO-CTO [始計]: ${projectName} BUILD ✅ (Exit Code 0)`);
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const buildErrors = parseBuildErrors(output, projectName);

      if (buildErrors.length === 0) {
        buildErrors.push({
          type: 'build',
          severity: 'critical',
          file: 'package.json',
          message: `Build command failed with exit code ${e.status}. Output snippet: ${output.slice(0, 200).replace(/\n/g, ' ')}...`,
          project: projectName
        });
      }

      errors.push(...buildErrors);
      log(`AUTO-CTO [始計]: ${projectName} BUILD ❌ — Failed with exit code ${e.status}. Found ${buildErrors.length} error(s).`);
    }
  }

  // LINT check (only if build passes or no build script)
  if (scripts.lint && errors.length === 0) {
    try {
      execSync('npm run lint 2>&1', { cwd: projectDir, encoding: 'utf-8', timeout: 60000 });
      log(`AUTO-CTO [始計]: ${projectName} LINT ✅ (Exit Code 0)`);
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const lintErrors = parseLintErrors(output, projectName);

      if (lintErrors.length === 0) {
        lintErrors.push({
          type: 'lint',
          severity: 'medium',
          file: 'package.json',
          message: `Lint command failed with exit code ${e.status}. Output snippet: ${output.slice(0, 200).replace(/\n/g, ' ')}...`,
          rule: 'general-lint-failure',
          project: projectName
        });
      }

      errors.push(...lintErrors);
      log(`AUTO-CTO [始計]: ${projectName} LINT ❌ — Failed with exit code ${e.status}. Found ${lintErrors.length} error(s).`);
    }
  }

  // TEST check (only if build + lint pass)
  if (scripts.test && errors.length === 0) {
    try {
      execSync('npm test 2>&1', { cwd: projectDir, encoding: 'utf-8', timeout: 120000 });
      log(`AUTO-CTO [始計]: ${projectName} TEST ✅ (Exit Code 0)`);
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const testErrors = parseTestErrors(output, projectName);

      if (testErrors.length === 0) {
        testErrors.push({
          type: 'test',
          severity: 'medium',
          file: 'package.json',
          message: `Test command failed with exit code ${e.status}. Output snippet: ${output.slice(0, 200).replace(/\n/g, ' ')}...`,
          project: projectName
        });
      }

      errors.push(...testErrors);
      log(`AUTO-CTO [始計]: ${projectName} TEST ❌ — Failed with exit code ${e.status}. Found ${testErrors.length} error(s).`);
    }
  }

  return errors;
}

// --- Error Parsers ---

function parseBuildErrors(output, project) {
  const errors = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // TypeScript errors: src/file.ts(10,5): error TS2345: ...
    const tsMatch = line.match(/^(.+\.tsx?)\((\d+),\d+\):\s*error\s+(TS\d+):\s*(.+)/);
    if (tsMatch) {
      errors.push({
        type: 'build',
        severity: 'critical',
        file: tsMatch[1],
        line: parseInt(tsMatch[2]),
        code: tsMatch[3],
        message: tsMatch[4].trim(),
        project
      });
      continue;
    }

    // Next.js / generic build errors
    const nextMatch = line.match(/^(?:Error|error):\s*(.+)/i);
    if (nextMatch && !line.includes('node_modules')) {
      errors.push({
        type: 'build',
        severity: 'critical',
        file: null,
        message: nextMatch[1].trim(),
        project
      });
    }
  }

  // Deduplicate by file+code
  const seen = new Set();
  return errors.filter(e => {
    if (e.file && (e.file.includes('.claude/') || e.file.includes('node_modules/'))) return false;
    const key = `${e.file}:${e.code || e.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_FIXES_PER_SCAN);
}

function parseLintErrors(output, project) {
  const errors = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // ESLint: src/file.ts:10:5  error  Description  rule-name
    const eslintMatch = line.match(/^\s*(.+\.\w+):(\d+):\d+\s+error\s+(.+?)\s{2,}(.+)/);
    if (eslintMatch) {
      errors.push({
        type: 'lint',
        severity: 'medium',
        file: eslintMatch[1].trim(),
        line: parseInt(eslintMatch[2]),
        message: eslintMatch[3].trim(),
        rule: eslintMatch[4].trim(),
        project
      });
    }
  }

  // Deduplicate by rule (fix all instances of same rule at once)
  const seen = new Set();
  return errors.filter(e => {
    if (e.file && (e.file.includes('.claude/') || e.file.includes('node_modules/'))) return false;
    if (seen.has(e.rule)) return false;
    seen.add(e.rule);
    return true;
  }).slice(0, MAX_FIXES_PER_SCAN);
}

function parseTestErrors(output, project) {
  const errors = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Jest/Vitest: FAIL src/file.test.ts
    const failMatch = line.match(/^\s*(?:FAIL|✕|×)\s+(.+)/);
    if (failMatch) {
      errors.push({
        type: 'test',
        severity: 'medium',
        file: failMatch[1].trim(),
        message: `Test suite failed: ${failMatch[1].trim()}`,
        project
      });
    }
  }

  // 🔒 FILTER: Only client app code — skip .claude/ (ClaudeKit internal) and node_modules/
  return errors
    .filter(e => !e.file.includes('.claude/') && !e.file.includes('node_modules/'))
    .slice(0, MAX_FIXES_PER_SCAN);
}

// --- Phase 2: 謀攻 FIX — Generate specific fix mission ---

function generateFixMission(error, project) {
  let prompt;

  switch (error.type) {
    case 'build':
      if (error.file) {
        prompt = `Fix build error in ${error.file}${error.line ? ` line ${error.line}` : ''}: ${error.code || ''} ${error.message}. Run npm run build after fixing to verify.`;
      } else {
        prompt = `Fix build error: ${error.message}. Run npm run build after fixing to verify.`;
      }
      break;

    case 'lint':
      prompt = `Fix lint error "${error.rule}" in ${error.file}: ${error.message}. Fix ALL instances of this rule in the file. Run npm run lint after fixing.`;
      break;

    case 'test':
      prompt = `Fix failing test: ${error.file}. Analyze the test failure, fix the source code or test. Run npm test after fixing.`;
      break;

    default:
      prompt = `Fix: ${error.message}`;
  }

  // Wrap with Vietnamese + safety constraints
  const fullPrompt = `/cook "Trả lời bằng TIẾNG VIỆT. ${prompt} Chỉ sửa TỐI ĐA 5 file mỗi mission. CRITICAL: DO NOT run git commit, git push, or /check-and-commit. The CI/CD gate handles git operations." --auto`;

  const severity = error.severity === 'critical' ? 'HIGH' : 'MEDIUM';
  const filename = `${severity}_mission_${project.replace(/-/g, '_')}_fix_${error.type}_${Date.now()}.txt`;

  return { prompt: fullPrompt, filename };
}

// --- Main Loop (九變 v2: Adaptive Speed) ---

function getPhaseInterval(phase) {
  return (phase === 'fix' || phase === 'verify') ? FIX_INTERVAL_MS : SCAN_INTERVAL_MS;
}

function startAutoCTO() {
  let currentPhase = 'scan';

  function scheduleNext() {
    const interval = getPhaseInterval(currentPhase);
    // 🦞 FIX 2026-02-26: Clear existing timeout before scheduling next to prevent interval drift/overlap
    if (intervalRef) clearTimeout(intervalRef);

    intervalRef = setTimeout(async () => {
      try {
        // Guards
        if (!isBrainAlive()) { log('AUTO-CTO DEBUG: isBrainAlive() failed'); scheduleNext(); return; }
        if (isOverheating()) { log('AUTO-CTO DEBUG: isOverheating() failed'); scheduleNext(); return; }

        // 🦞🦞🦞 DISPATCH FIRST — NO LLM DELAY! Fast regex-only idle check
        log(`🦞 DISPATCH-CHECK: ${fs.readdirSync(config.WATCH_DIR).filter(f => config.TASK_PATTERN.test(f)).length} tasks in queue`);
        // P0 = mekong-cli, P1 = well/wellnexus, P2 = algo-trader, P3-P9 = overflow/overflow/overflow/overflow/overflow/overflow/overflow
        const tasks = fs.readdirSync(config.WATCH_DIR).filter(f => config.TASK_PATTERN.test(f));
        if (tasks.length > 0) {
          const sorted = tasks.sort((a, b) => {
            const aCrit = a.startsWith('CRITICAL') ? 0 : 1;
            const bCrit = b.startsWith('CRITICAL') ? 0 : 1;
            if (aCrit !== bCrit) return aCrit - bCrit;
            return fs.statSync(path.join(config.WATCH_DIR, a)).mtimeMs - fs.statSync(path.join(config.WATCH_DIR, b)).mtimeMs;
          });

          function getTargetPane(filename) {
            const lower = filename.toLowerCase();
            // P0: mekong-cli core (fallback to early projects or openclaw-worker)
            if (/openclaw|brain|cto|factory/.test(lower)) return 0;
            // P1: apps/well
            if (/well|wellnexus/.test(lower)) return 1;
            // P2: mekong-cli core packages
            if (/vibe|core|package|mekong-cli/.test(lower)) return 2;
            // P3: sophia-ai-factory
            if (/sophia/.test(lower)) return 3;
            // P4: OPUS STRATEGIC LAYER - Must only receive high complexity / strategic tasks
            if (/strategic|binh_phap|roiaas|architecture|10x|complex|opus/i.test(lower)) return 4;
            // P5: algo-trader
            if (/algo.?trader|algotrader|trading/.test(lower)) return 5;

            // Fallback assignment based on file hash if no keywords match 
            // Distribute specifically between 0, 1, 2, 3, 5 (NEVER default to 4/Opus)
            const hash = filename.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const safeIds = [0, 1, 2, 3, 5];
            return safeIds[hash % safeIds.length];
          }

          let dispatched = 0;
          const dispatching = new Set();

          for (const taskFile of sorted) {
            const targetIdx = getTargetPane(taskFile);
            if (dispatching.has(targetIdx)) continue;

            const pane = `${config.TMUX_SESSION}:0.${targetIdx}`;
            try {
              const paneCheck = execSync(`tmux capture-pane -t ${pane} -p 2>/dev/null`, { encoding: 'utf-8', timeout: 8000 });
              const pLines = paneCheck.split('\n').filter(l => l.trim());
              const tail5 = pLines.slice(-5).join('\n');
              const hasPrompt = /❯/.test(tail5);
              const isBusy = /Cooking|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Churning|Orbiting|thinking|Compacting|Ebbing|Hatching|queued messages|Press up to edit/i.test(tail5);
              const isIdle = hasPrompt && !isBusy;

              if (isIdle) {
                const taskPath = path.join(config.WATCH_DIR, taskFile);
                const taskContent = fs.readFileSync(taskPath, 'utf-8').trim();
                const firstLine = taskContent.split('\n')[0].trim();
                const command = firstLine.startsWith('/') ? firstLine : `/cook ${firstLine}`;

                const MODEL_POOL = {
                  0: 'qwen3.5-plus',              // P0: openclaw
                  1: 'qwen3.5-plus',              // P1: well
                  2: 'qwen3.5-plus',              // P2: core
                  3: 'qwen3.5-plus',              // P3: sophia
                  4: 'claude-opus-4-6',           // P4: strategic
                  5: 'qwen3.5-plus'               // P5: algo-trader
                };
                const paneModel = MODEL_POOL[targetIdx] || MODEL_POOL[0];

                log(`🦞 DISPATCHING: "${taskFile}" → P${targetIdx} [${paneModel}]`);
                log(`🦞 COMMAND: ${command.slice(0, 100)}`);

                // Model set in settings.json — skip /model to save API calls
                execSync(`tmux send-keys -t ${pane} "${command.replace(/"/g, '\\"')}"`, { timeout: 8000 });
                execSync(`tmux send-keys -t ${pane} Enter`, { timeout: 3000 });

                const doneDir = path.join(config.WATCH_DIR, '..', 'tasks-done');
                if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });
                fs.renameSync(taskPath, path.join(doneDir, `${Date.now()}_${taskFile}`));
                log(`🦞 DISPATCHED + ARCHIVED: ${taskFile} → P${targetIdx}`);
                dispatched++;
                dispatching.add(targetIdx);
              }
            } catch (dispatchErr) {
              log(`AUTO-CTO DISPATCH P${targetIdx} ERROR: ${dispatchErr.message}`);
            }
          }

          if (dispatched > 0) {
            log(`🦞 DISPATCHED ${dispatched} task(s) — skipping LLM Vision this cycle`);
            scheduleNext(); return;
          }
          log(`AUTO-CTO: ${tasks.length} tasks pending, all target panes busy — falling through to LLM Vision`);
        }

        // 🧠 LLM VISION: 知己知彼 — Use gemini-3-flash to READ CC CLI output
        // Only runs when NO tasks were dispatched (all panes busy or queue empty)
        // Expanded from 3 to 10 panes (P0-P9) for 10-model pool support
        let isApiBusy = false;
        const TOTAL_PANES = 10; // P0-P9 for 10-model rotation
        try {
          const { interpretState, clearCache } = require('./llm-interpreter');
          for (let pIdx = 0; pIdx < TOTAL_PANES; pIdx++) {
            try {
              const paneOutput = require('child_process').execSync(
                `tmux capture-pane -t tom_hum:0.${pIdx} -p -S -50 2>/dev/null`,
                { encoding: 'utf-8', timeout: 3000 }
              );

              // 🩺 AUTO-RESPAWN: Only trigger if shell prompt in LAST 3 lines AND no CC CLI running
              const lastLines = paneOutput.trim().split('\n').slice(-3).join(' ');
              const hasCCCLI = /❯|bypass permissions|✻|Cooking|Brewing|Frosting|Moonwalking|Concocting|Sautéing|thinking|Hatching|Ebbing/i.test(lastLines);
              const isShellPrompt = /[$%]\s*$/.test(lastLines) && !hasCCCLI;

              if (isShellPrompt) {
                log(`[🩺 RESPAWN][P${pIdx}] Shell-only detected — auto-restarting CC CLI`);
                try {
                  require('child_process').execSync(
                    `tmux send-keys -t tom_hum:0.${pIdx} "unset CLAUDE_AUTOCOMPACT_PCT_OVERRIDE && claude --dangerously-skip-permissions --continue"`,
                    { timeout: 8000 }
                  );
                  require('child_process').execSync(
                    `tmux send-keys -t tom_hum:0.${pIdx} Enter`,
                    { timeout: 3000 }
                  );
                } catch (e) { log(`[🩺 RESPAWN][P${pIdx}] restart failed: ${e.message}`); }
                isApiBusy = true;
                continue; // Skip LLM interpretation for this pane
              }

              const llmResult = await interpretState(paneOutput);

              // Reset question count for this pane if not in question state
              if (llmResult.state !== 'question') {
                _paneQuestionCounts.set(pIdx, 0);
              }

              if (llmResult.state === 'busy') {
                log(`[LLM-VISION][P${pIdx}] CC CLI BUSY: ${llmResult.summary}`);
                isApiBusy = true;
              } else if (llmResult.state === 'question') {
                log(`[LLM-VISION][P${pIdx}] CC CLI QUESTION: ${llmResult.summary}`);
                const currentCount = (_paneQuestionCounts.get(pIdx) || 0) + 1;
                _paneQuestionCounts.set(pIdx, currentCount);

                if (llmResult.confidence >= 0.8) {
                  if (currentCount >= 3) {
                    log(`[LLM-VISION][P${pIdx}] LOOP BREAK: ${currentCount} questions — sending Escape`);
                    try { require('child_process').execSync(`tmux send-keys -t tom_hum:0.${pIdx} Escape`, { timeout: 2000 }); } catch (e) { }
                    _paneQuestionCounts.set(pIdx, 0);
                  } else {
                    log(`[LLM-VISION][P${pIdx}] AUTO-APPROVE: Sending Enter`);
                    try { require('child_process').execSync(`tmux send-keys -t tom_hum:0.${pIdx} Enter`, { timeout: 2000 }); } catch (e) { }
                  }
                  clearCache();
                }
                isApiBusy = true;
              } else if (llmResult.state === 'error') {
                log(`[LLM-VISION][P${pIdx}] CC CLI ERROR: ${llmResult.summary}`);
                isApiBusy = true;
              } else if (llmResult.state !== 'idle' && llmResult.state !== 'complete' && llmResult.state !== 'unknown') {
                log(`[LLM-VISION][P${pIdx}] CC CLI state: ${llmResult.state}`);
                isApiBusy = true;
              } else if (llmResult.state === 'unknown') {
                const hasIdlePrompt = paneOutput.includes('❯') || paneOutput.includes('%') || paneOutput.trim().split('\n').slice(-5).some(l => /^>\s*$/.test(l.trim()));
                if (!hasIdlePrompt) {
                  log(`[LLM-VISION][P${pIdx}] FALLBACK: No idle prompt detected`);
                  isApiBusy = true;
                }
              }
            } catch (innerE) {
              log(`[LLM-VISION][P${pIdx}] Capture failed: ${innerE.message}`);
              isApiBusy = true;
            }
          }
        } catch (e) {
          log(`[LLM-VISION] Fatal error during capture: ${e.message}`);
          isApiBusy = true;
        }

        // Old dispatch block removed — now runs BEFORE LLM Vision (line 342)

        if (isApiBusy) {
          scheduleNext(); return;
        }

        if (!isQueueEmpty()) { log('AUTO-CTO DEBUG: memory queue pending'); scheduleNext(); return; }

        const state = loadState();
        currentPhase = state.phase;
        const project = config.PROJECTS[state.currentProjectIdx];
        if (!project) {
          state.currentProjectIdx = 0;
          saveState(state);
          scheduleNext();
          return;
        }

        let projectDir = path.join(config.MEKONG_DIR, project);
        if (!fs.existsSync(projectDir)) {
          projectDir = path.join(config.MEKONG_DIR, 'apps', project);
        }
        if (!fs.existsSync(projectDir)) {
          // Fallback: use mission-dispatcher's routing table
          const { detectProjectDir } = require('./mission-dispatcher');
          projectDir = detectProjectDir(project);
        }
        if (!fs.existsSync(projectDir)) {
          log(`AUTO-CTO: Bỏ qua ${project} — không tìm thấy`);
          advanceProject(state);
          scheduleNext();
          return;
        }

        // --- Phase Router ---
        switch (state.phase) {
          case 'scan':
            if (!isSafeToScan()) {
              log(`AUTO-CTO [🧊]: Bỏ qua scan — hệ thống quá nóng.`);
              scheduleNext();
              return;
            }
            await handleScan(state, project, projectDir);
            break;
          case 'fix':
            await handleFix(state, project);
            break;
          case 'verify':
            await handleVerify(state, project, projectDir);
            break;
          default:
            state.phase = 'scan';
            saveState(state);
        }
        currentPhase = state.phase;
      } catch (e) {
        log(`AUTO-CTO error: ${e.message}`);
      }
      scheduleNext();
    }, interval);
  }

  log(`AUTO-CTO [九變 v2]: Phản xạ thích ứng — scan ${SCAN_INTERVAL_MS / 1000}s, fix/verify ${FIX_INTERVAL_MS / 1000}s`);
  scheduleNext();
}

async function handleScan(state, project, projectDir) {
  log(`AUTO-CTO [始計 SCAN]: Scanning ${project} (cycle ${state.cycle + 1}/${MAX_FIX_CYCLES})...`);

  const errors = scanProject(projectDir);

  if (errors === null) {
    // Not a valid project (no package.json)
    advanceProject(state);
    return;
  }

  if (errors.length === 0) {
    // 軍形 GREEN — project is clean!
    // 作戰 Revenue Health: scan pipeline khi project GREEN
    const revHealth = scanRevenueHealth();
    if (revHealth && !revHealth.healthy && revHealth.issues.length > 0) {
      const issue = revHealth.issues[0];
      const { prompt, filename } = generateRevenueMission(issue);
      fs.writeFileSync(path.join(config.WATCH_DIR, filename), prompt);
      log(`AUTO-CTO [作戰 REVENUE]: Dispatched revenue fix — ${issue.module}: ${issue.message}`);
      advanceProject(state);
      return;
    }
    // 🏢 TRADING COMPANY: algo-trader GREEN → check trading cadence schedule
    if (project === 'algo-trader') {
      const tradingDispatched = dispatchDueTradingMissions();
      if (tradingDispatched > 0) {
        log(`AUTO-CTO [🏢 TRADING COMPANY]: ${tradingDispatched} cadence mission(s) dispatched`);
        advanceProject(state);
        return;
      }
    }

    // 🚀 GREEN PATH: Open Source RaaS AGI — đích đến của mọi dự án
    // Khi project GREEN, đẩy hướng Open Source + RaaS AGI thay vì idle
    const RAAS_COOLDOWN_MS = 30 * 60 * 1000; // 30 phút giữa các lần dispatch cùng project
    const raasStateFile = path.join(__dirname, '..', `.raas-last-${project}.json`);
    let raasRecentlyDispatched = false;
    try {
      if (fs.existsSync(raasStateFile)) {
        const last = JSON.parse(fs.readFileSync(raasStateFile, 'utf-8'));
        raasRecentlyDispatched = (Date.now() - last.ts) < RAAS_COOLDOWN_MS;
      }
    } catch (e) { /* ignore */ }

    if (!raasRecentlyDispatched) {
      // Project-specific Open Source RaaS AGI missions
      const RAAS_MISSIONS = {
        'mekong-cli': '/cook "始計 Open Source RaaS Hub: audit secrets → .env.example, README cho contributors, MIT LICENSE, npm audit fix, CI/CD pipeline cho open-source, ánh xạ binh_phap_master.md 13 chương vào kiến trúc. Target: production-ready open-source RaaS AGI CTO brain." --auto',
        'algo-trader': '/cook "始計 Open Source AGI Trading Bot: audit credentials → .env.example, document AGI strategies trong README, clean tests, error handling missing env vars, security audit cho open-source RaaS marketplace release." --auto',
        'well': '/cook "始計 Open Source Health Platform: audit Supabase keys, i18n vi/en hoàn chỉnh, PayOS integration docs, zero console errors, README cho RaaS open-source health platform release." --auto',
        '84tea': '/cook "始計 Open Source F&B Platform: audit secrets, menu system docs, PWA optimization, README open-source contribution guide cho RaaS F&B vertical." --auto',
      };
      const mission = RAAS_MISSIONS[project];
      if (mission) {
        const filename = `HIGH_mission_${project}_open_source_raas_${Date.now()}.txt`;
        fs.writeFileSync(path.join(config.WATCH_DIR, filename), `${project}: ${mission}`);
        fs.writeFileSync(raasStateFile, JSON.stringify({ ts: Date.now(), project }));
        log(`AUTO-CTO [🚀 OPEN SOURCE RaaS AGI]: ${project} GREEN → Dispatched open-source preparation mission`);
      } else {
        log(`AUTO-CTO [軍形 GREEN]: ${project} — ALL CLEAR ✅ (no RaaS mission defined)`);
      }
    } else {
      log(`AUTO-CTO [軍形 GREEN]: ${project} — RaaS mission recently dispatched, cooldown active ⏳`);
    }
    advanceProject(state);
    return;
  }

  // Issues found — move to fix phase
  log(`AUTO-CTO [始計]: ${project} — ${errors.length} issue(s) found. Entering FIX phase.`);
  state.phase = 'fix';
  state.errors = errors;
  state.fixIndex = 0;
  state.cycle++;
  saveState(state);
}

async function handleFix(state, project) {
  // 🦞 FIX 2026-02-24: Don't generate fix missions when queue is busy — prevents flooding
  if (!isQueueEmpty()) {
    log(`AUTO-CTO [謀攻]: ${project} — queue busy, skipping fix generation this cycle.`);
    return;
  }
  if (state.fixIndex >= state.errors.length) {
    // All fixes dispatched — move to verify
    log(`AUTO-CTO [謀攻]: ${project} — all ${state.errors.length} fixes dispatched. Entering VERIFY phase.`);
    state.phase = 'verify';
    saveState(state);
    return;
  }

  const error = state.errors[state.fixIndex];

  // 🔍 WEB RESEARCH: Search internet for best solution before dispatching fix
  let webIntel = '';
  if (error.severity === 'critical' || error.type === 'build') {
    // Primary: Gemini Search Grounding (real-time Google Search via Gemini)
    try {
      const { researchErrorWithGemini } = require('./gemini-agentic');
      const intel = await researchErrorWithGemini(error.message, project);
      if (intel) {
        webIntel = intel;
        log(`AUTO-CTO [用間 GEMINI SEARCH]: Found grounded intel for ${error.type} error`);
      }
    } catch (e) {
      log(`AUTO-CTO [用間]: Gemini grounding failed: ${e.message}`);
    }
    // Fallback: DuckDuckGo web-researcher
    if (!webIntel) {
      try {
        const { researchError } = require('./web-researcher');
        const intel = await researchError(error.message, project);
        if (intel) {
          webIntel = intel;
          log(`AUTO-CTO [用間 DDG FALLBACK]: Found web intel for ${error.type} error`);
        }
      } catch (e) { }
    }
  }

  const { prompt: basePrompt, filename } = generateFixMission(error, project);

  // 🔒 Dedup: skip if same error was dispatched within 30min
  const dedupKey = `${error.file || error.message}:${error.code || error.type}`;
  if (isMissionDuplicate(dedupKey)) {
    log(`AUTO-CTO [謀攻 SKIP]: ${project} — mission for "${dedupKey}" already dispatched recently. Skipping.`);
    state.fixIndex++;
    saveState(state);
    return;
  }

  const prompt = webIntel ? basePrompt + '\n' + webIntel : basePrompt;

  fs.writeFileSync(path.join(config.WATCH_DIR, filename), prompt);
  markMissionDispatched(dedupKey);
  log(`AUTO-CTO [謀攻 FIX]: Dispatched fix for ${error.type} — ${error.file || error.message} → ${filename}${webIntel ? ' [+WEB INTEL]' : ''}`);
  state.fixIndex++;
  saveState(state);
}

async function handleVerify(state, project, projectDir) {
  log(`AUTO-CTO [軍形 VERIFY]: Re-scanning ${project}...`);

  let errors = scanProject(projectDir);

  if (errors === null || errors.length === 0) {
    log(`AUTO-CTO [軍形 GREEN]: ${project} — CLEAN after ${state.cycle} cycle(s) ✅`);
    onProjectMissionSuccess(project); // BUG #11: reset failure count on success
    advanceProject(state);
    return;
  }

  if (state.cycle >= MAX_FIX_CYCLES) {
    log(`AUTO-CTO [走為上]: ${project} — still ${errors.length} error(s) after ${MAX_FIX_CYCLES} cycles. SKIPPING.`);
    // Log blockers for human review
    for (const e of errors.slice(0, 3)) {
      log(`  BLOCKER: [${e.type}] ${e.file || ''} — ${e.message}`);
    }
    // BUG #11: track consecutive failure — skip project if too many
    const shouldSkip = onProjectMissionFailed(project);
    if (shouldSkip) {
      log(`AUTO-CTO [BUG#11]: ${project} — max consecutive failures reached, force-advancing.`);
    }
    advanceProject(state);
    return;
  }

  // 🔧 Aider self-heal: attempt auto-fix before escalating to mission dispatch
  try {
    const { tryAiderFix, isAiderAvailable } = require('./aider-bridge');
    if (isAiderAvailable()) {
      const errorSummary = errors.map((e) => `${e.file || ''}: ${e.message}`).join('\n');
      const aiderResult = await tryAiderFix({
        projectDir,
        errorLog: errorSummary,
        testCmd: 'npm run build',
      });
      if (aiderResult.success) {
        log(`AUTO-CTO [軍形 AIDER]: ${project} — Aider auto-fixed in ${aiderResult.duration}ms. Re-verifying...`);
        const recheck = scanProject(projectDir);
        if (recheck === null || recheck.length === 0) {
          log(`AUTO-CTO [軍形 GREEN]: ${project} — CLEAN after Aider fix ✅`);
          onProjectMissionSuccess(project);
          advanceProject(state);
          return;
        }
        errors = recheck; // update remaining errors before mission dispatch
        log(`AUTO-CTO [軍形 AIDER]: ${project} — ${errors.length} error(s) remain after Aider fix, dispatching missions`);
      } else {
        log(`AUTO-CTO [軍形 AIDER]: ${project} — self-heal skipped (${aiderResult.reason}), falling back to mission dispatch`);
      }
    }
  } catch (aiderErr) {
    log(`AUTO-CTO [軍形 AIDER]: error — ${aiderErr.message}`);
  }

  // More issues — back to fix phase
  log(`AUTO-CTO [軍形 RED]: ${project} — ${errors.length} remaining. Back to FIX (cycle ${state.cycle}/${MAX_FIX_CYCLES}).`);
  state.phase = 'fix';
  state.errors = errors;
  state.fixIndex = 0;
  saveState(state);
}

function advanceProject(state) {
  state.currentProjectIdx = (state.currentProjectIdx + 1) % config.PROJECTS.length;
  state.phase = 'scan';
  state.cycle = 0;
  state.errors = [];
  state.fixIndex = 0;
  saveState(state);
}

function stopAutoCTO() {
  if (intervalRef) {
    clearTimeout(intervalRef);
    intervalRef = null;
  }
}

module.exports = { startAutoCTO, stopAutoCTO, onProjectMissionFailed, onProjectMissionSuccess };
