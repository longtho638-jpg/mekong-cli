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

let intervalRef = null;
let _questionLoopCount = 0; // 🧠 QUESTION loop detector (module-level to avoid 'state' TDZ)

const SCAN_RESULT_FILE = path.join(__dirname, '..', '.cto-scan-state.json');
const MAX_FIX_CYCLES = 3;
const MAX_FIXES_PER_SCAN = 3;  // 🔒 Ch.6 虛實: focus force on fewer targets
// 🔒 Ch.2 作戰: 日費千金 — Phase-aware intervals (v2: 九變 adaptive speed)
const SCAN_INTERVAL_MS = 45000;   // 45s — scan phase: check đủ thư thả
const FIX_INTERVAL_MS = 15000;    // 15s — fix/verify: phản xạ nhanh, dispatch liên tục
const DEFAULT_INTERVAL_MS = 45000; // 45s — fallback

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
    intervalRef = setTimeout(async () => {
      try {
        // Guards
        if (!isBrainAlive()) { log('AUTO-CTO DEBUG: isBrainAlive() failed'); scheduleNext(); return; }
        if (isOverheating()) { log('AUTO-CTO DEBUG: isOverheating() failed'); scheduleNext(); return; }

        // Check if queue has pending tasks — don't flood
        const tasks = fs.readdirSync(config.WATCH_DIR).filter(f => config.TASK_PATTERN.test(f));
        if (tasks.length > 0) { log('AUTO-CTO DEBUG: filesystem tasks pending'); scheduleNext(); return; }

        if (!isQueueEmpty()) { log('AUTO-CTO DEBUG: memory queue pending'); scheduleNext(); return; }

        // 🧠 LLM VISION: 知己知彼 — Use gemini-3-flash to READ CC CLI output
        // Replaces fragile regex patterns that caused "blind CTO" bugs
        try {
          const paneOutput = require('child_process').execSync(
            `tmux capture-pane -t tom_hum_brain -p -S -30 2>/dev/null`,
            { encoding: 'utf-8', timeout: 3000 }
          );
          const { interpretState } = require('./llm-interpreter');
          const llmResult = await interpretState(paneOutput);

          // Reset question loop counter on non-QUESTION state
          if (llmResult.state !== 'question') _questionLoopCount = 0;

          if (llmResult.state === 'busy') {
            log(`[LLM-VISION] CC CLI BUSY: ${llmResult.summary} (confidence: ${llmResult.confidence})`);
            scheduleNext(); return;
          }
          if (llmResult.state === 'question') {
            log(`[LLM-VISION] CC CLI has QUESTION: ${llmResult.summary}`);
            // 🧠 AUTO-APPROVE with loop detection
            _questionLoopCount++;
            if (llmResult.confidence >= 0.8) {
              if (_questionLoopCount >= 3) {
                // 🚨 LOOP DETECTED: 3+ consecutive QUESTIONs → CC CLI stuck in TUI menu
                log(`[LLM-VISION] LOOP BREAK: ${_questionLoopCount} consecutive QUESTIONs — sending Escape to exit menu`);
                try {
                  require('child_process').execSync(`tmux send-keys -t tom_hum_brain:0.0 Escape`, { timeout: 2000 });
                } catch (e) { }
                _questionLoopCount = 0;
              } else {
                log(`[LLM-VISION] AUTO-APPROVE: Sending Enter (confidence: ${llmResult.confidence}, attempt ${_questionLoopCount})`);
                try {
                  require('child_process').execSync(`tmux send-keys -t tom_hum_brain:0.0 Enter`, { timeout: 2000 });
                } catch (e) { }
              }
              const { clearCache } = require('./llm-interpreter');
              clearCache();
            }
            scheduleNext(); return;
          }
          if (llmResult.state === 'error') {
            log(`[LLM-VISION] CC CLI ERROR: ${llmResult.summary} — recommendation: ${llmResult.recommendation}`);
            scheduleNext(); return;
          }
          if (llmResult.state !== 'idle' && llmResult.state !== 'complete' && llmResult.state !== 'unknown') {
            log(`[LLM-VISION] CC CLI state: ${llmResult.state} — ${llmResult.summary}`);
            scheduleNext(); return;
          }
          // LLM says idle/complete — proceed to scan/fix/verify
          if (llmResult.state !== 'unknown') {
            log(`[LLM-VISION] CC CLI ${llmResult.state.toUpperCase()}: ${llmResult.summary}`);
          }

          // Fallback: also check for basic prompt presence
          if (llmResult.state === 'unknown') {
            // LLM failed — use basic regex fallback
            const hasIdlePrompt = paneOutput.includes('❯') || paneOutput.trim().split('\n').slice(-5).some(l => /^>\s*$/.test(l.trim()));
            if (!hasIdlePrompt) {
              log(`[LLM-VISION] FALLBACK: No idle prompt detected`);
              scheduleNext(); return;
            }
          }
        } catch (e) { log(`[LLM-VISION] Capture failed: ${e.message}`); scheduleNext(); return; }

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
            handleVerify(state, project, projectDir);
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
    // Level 6: Strategic Autonomy — proactive improvement when GREEN
    const dispatched = await tryStrategicMission(state, project, projectDir);
    if (!dispatched) {
      log(`AUTO-CTO [軍形 GREEN]: ${project} — ALL CLEAR ✅ Advancing to next project`);
      advanceProject(state);
    } else {
      log(`AUTO-CTO [軍形 GREEN → 始計]: ${project} — Strategic mission dispatched. Advancing.`);
      advanceProject(state);
    }
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
  const prompt = webIntel ? basePrompt + '\n' + webIntel : basePrompt;

  // 🦞 RE-ENABLED 2026-02-24: Auto-fix for WellNexus zero-bug target
  fs.writeFileSync(path.join(config.WATCH_DIR, filename), prompt);
  log(`AUTO-CTO [謀攻 FIX]: Dispatched fix for ${error.type} — ${error.file || error.message} → ${filename}${webIntel ? ' [+WEB INTEL]' : ''}`);
  state.fixIndex++;
  saveState(state);
}

function handleVerify(state, project, projectDir) {
  log(`AUTO-CTO [軍形 VERIFY]: Re-scanning ${project}...`);

  const errors = scanProject(projectDir);

  if (errors === null || errors.length === 0) {
    log(`AUTO-CTO [軍形 GREEN]: ${project} — CLEAN after ${state.cycle} cycle(s) ✅`);
    advanceProject(state);
    return;
  }

  if (state.cycle >= MAX_FIX_CYCLES) {
    log(`AUTO-CTO [走為上]: ${project} — still ${errors.length} error(s) after ${MAX_FIX_CYCLES} cycles. SKIPPING.`);
    // Log blockers for human review
    for (const e of errors.slice(0, 3)) {
      log(`  BLOCKER: [${e.type}] ${e.file || ''} — ${e.message}`);
    }
    advanceProject(state);
    return;
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

module.exports = { startAutoCTO, stopAutoCTO };
