/**
 * Auto-CTO Pilot v3 — 始計→謀攻→軍形 Goal-Driven Task Generation
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
const { log, isBrainAlive } = require('./brain-tmux');
const { isQueueEmpty } = require('./task-queue');
const { isOverheating } = require('./m1-cooling-daemon');

let intervalRef = null;

const SCAN_RESULT_FILE = path.join(__dirname, '..', '.cto-scan-state.json');
const MAX_FIX_CYCLES = 3;
const MAX_FIXES_PER_SCAN = 3;  // 🔒 Ch.6 虛實: focus force on fewer targets
// 🔒 Ch.2 作戰: 日費千金 — 120s interval prevents 98% ABORT waste
const CHECK_INTERVAL_MS = 120000; // 120s — one deliberate check per 2 minutes

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
  try { fs.writeFileSync(SCAN_RESULT_FILE, JSON.stringify(state, null, 2)); } catch (e) { }
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
      log(`AUTO-CTO [始計]: ${projectName} BUILD ✅`);
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const buildErrors = parseBuildErrors(output, projectName);
      errors.push(...buildErrors);
      log(`AUTO-CTO [始計]: ${projectName} BUILD ❌ — ${buildErrors.length} error(s)`);
    }
  }

  // LINT check (only if build passes or no build script)
  if (scripts.lint && errors.length === 0) {
    try {
      execSync('npm run lint 2>&1', { cwd: projectDir, encoding: 'utf-8', timeout: 60000 });
      log(`AUTO-CTO [始計]: ${projectName} LINT ✅`);
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const lintErrors = parseLintErrors(output, projectName);
      errors.push(...lintErrors);
      log(`AUTO-CTO [始計]: ${projectName} LINT ❌ — ${lintErrors.length} error(s)`);
    }
  }

  // TEST check (only if build + lint pass)
  if (scripts.test && errors.length === 0) {
    try {
      execSync('npm test 2>&1', { cwd: projectDir, encoding: 'utf-8', timeout: 120000 });
      log(`AUTO-CTO [始計]: ${projectName} TEST ✅`);
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const testErrors = parseTestErrors(output, projectName);
      errors.push(...testErrors);
      log(`AUTO-CTO [始計]: ${projectName} TEST ❌ — ${testErrors.length} error(s)`);
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

// --- Main Loop ---

function startAutoCTO() {
  intervalRef = setInterval(() => {
    try {
      // Guards
      if (!isBrainAlive()) return;
      if (isOverheating()) return;

      // Check if queue has pending tasks — don't flood
      const tasks = fs.readdirSync(config.WATCH_DIR).filter(f => config.TASK_PATTERN.test(f));
      if (tasks.length > 0) return; // Queue not empty — wait

      if (!isQueueEmpty()) return; // Still processing — wait

      // 🔒 Ch.3 謀攻: 知己知彼 — STRICT idle guard
      // Scan FULL pane output — CC CLI renders ❯ near top, rest is blank lines
      try {
        const paneOutput = require('child_process').execSync(
          `tmux capture-pane -t tom_hum_brain -p 2>/dev/null`,
          { encoding: 'utf-8', timeout: 3000 }
        );
        // BUSY: any processing indicator = WAIT
        const busyPatterns = [/Thinking/i, /Orbiting/i, /Saut[eé]ing/i, /Frolicking/i,
          /Cooking/i, /Crunching/i, /Marinating/i, /Fermenting/i, /Calculating/i,
          /Compacting/i, /Simmering/i, /Steaming/i, /Vibing/i, /Toasting/i,
          /Photosynthesizing/i, /Braising/i, /Reducing/i, /Blanching/i,
          /Sketching/i, /Initializing/i, /Running/i, /Waiting/i,
          /tool uses/i, /ctrl\+o/i, /thought for/i];
        if (busyPatterns.some(p => p.test(paneOutput))) {
          return; // CC CLI still busy — 有所不爭
        }
        // STRICT: must see prompt "❯" ANYWHERE in pane = truly idle
        if (!paneOutput.includes('❯')) {
          return; // No prompt visible — CC CLI not ready
        }
      } catch (e) { return; /* tmux not available — DON'T proceed blindly */ }

      const state = loadState();
      const project = config.PROJECTS[state.currentProjectIdx];
      if (!project) {
        state.currentProjectIdx = 0;
        saveState(state);
        return;
      }

      const projectDir = path.join(config.MEKONG_DIR, 'apps', project);
      if (!fs.existsSync(projectDir)) {
        log(`AUTO-CTO: Skipping ${project} — not found`);
        advanceProject(state);
        return;
      }

      // --- Phase Router ---
      switch (state.phase) {
        case 'scan':
          handleScan(state, project, projectDir);
          break;

        case 'fix':
          handleFix(state, project);
          break;

        case 'verify':
          handleVerify(state, project, projectDir);
          break;

        default:
          state.phase = 'scan';
          saveState(state);
      }
    } catch (e) {
      log(`AUTO-CTO error: ${e.message}`);
    }
  }, CHECK_INTERVAL_MS);
}

function handleScan(state, project, projectDir) {
  log(`AUTO-CTO [始計 SCAN]: Scanning ${project} (cycle ${state.cycle + 1}/${MAX_FIX_CYCLES})...`);

  const errors = scanProject(projectDir);

  if (errors === null) {
    // Not a valid project (no package.json)
    advanceProject(state);
    return;
  }

  if (errors.length === 0) {
    // 軍形 GREEN — project is clean!
    log(`AUTO-CTO [軍形 GREEN]: ${project} — ALL CLEAR ✅ Advancing to next project`);
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

function handleFix(state, project) {
  if (state.fixIndex >= state.errors.length) {
    // All fixes dispatched — move to verify
    log(`AUTO-CTO [謀攻]: ${project} — all ${state.errors.length} fixes dispatched. Entering VERIFY phase.`);
    state.phase = 'verify';
    saveState(state);
    return;
  }

  const error = state.errors[state.fixIndex];
  const { prompt, filename } = generateFixMission(error, project);

  // Write mission file
  fs.writeFileSync(path.join(config.WATCH_DIR, filename), prompt);
  log(`AUTO-CTO [謀攻 FIX ${state.fixIndex + 1}/${state.errors.length}]: ${error.type} — ${error.file || error.message}`);

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
    clearInterval(intervalRef);
    intervalRef = null;
  }
}

module.exports = { startAutoCTO, stopAutoCTO };
