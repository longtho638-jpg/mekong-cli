/**
 * Aider Bridge — Self-healing via Aider CLI
 *
 * Routes LLM calls through Antigravity Proxy (port 9191).
 * Attempts automated code fixes before falling back to CC CLI mission dispatch.
 *
 * Binh Pháp: Ch.3 謀攻 — Fix at source before escalating.
 */

'use strict';

const { spawn, execSync } = require('child_process');
const { log } = require('./brain-logger');
const { isSafeToScan } = require('./m1-cooling-daemon');

const AIDER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes hard limit
const MAX_AFFECTED_FILES = 5;
const PROXY_BASE_URL = 'http://localhost:9191';
const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_MAX_ATTEMPTS = 2;

/**
 * Check if Aider CLI is installed and available on PATH.
 * @returns {boolean}
 */
function isAiderAvailable() {
  try {
    execSync('which aider', { encoding: 'utf-8', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract source file paths from error output (excludes node_modules and .claude).
 * @param {string} errorLog
 * @returns {string[]}
 */
function extractAffectedFiles(errorLog) {
  const filePatterns = [
    /(?:src|lib|apps|components|pages|utils)\/[\w\-./]+\.\w+/g,
    /[\w\-]+\.(?:js|ts|tsx|jsx|py)/g,
  ];
  const files = new Set();
  for (const pattern of filePatterns) {
    const matches = errorLog.match(pattern) || [];
    for (const m of matches) {
      if (!m.includes('node_modules') && !m.includes('.claude') && !m.includes('.git')) {
        files.add(m);
      }
    }
  }
  return [...files].slice(0, MAX_AFFECTED_FILES);
}

/**
 * Run Aider CLI as child process with hard timeout.
 * @param {string} projectDir
 * @param {string} errorSummary
 * @param {string[]} files
 * @returns {Promise<{ exitCode: number, output: string }>}
 */
function runAider(projectDir, errorSummary, files) {
  return new Promise((resolve) => {
    const args = [
      '--message', `Fix: ${errorSummary}`,
      '--openai-api-base', PROXY_BASE_URL,
      '--model', DEFAULT_MODEL,
      '--auto-commits',
      '--yes',
      '--no-browser',
      ...files.flatMap((f) => ['--file', f]),
    ];

    let output = '';

    const proc = spawn('aider', args, {
      cwd: projectDir,
      env: { ...process.env, OPENAI_API_BASE: PROXY_BASE_URL },
    });

    const timer = setTimeout(() => {
      log('[AIDER] Timeout reached, terminating process');
      proc.kill('SIGTERM');
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch (_) {} }, 5000);
    }, AIDER_TIMEOUT_MS);

    proc.stdout?.on('data', (d) => { output += d.toString(); });
    proc.stderr?.on('data', (d) => { output += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 0, output: output.slice(-2000) });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      log(`[AIDER] Process error: ${err.message}`);
      resolve({ exitCode: 1, output: err.message });
    });
  });
}

/**
 * Attempt to fix errors using Aider CLI.
 *
 * @param {object} opts
 * @param {string} opts.projectDir  - Absolute path to project root
 * @param {string} opts.errorLog    - Raw error output from build/lint/test
 * @param {string} opts.testCmd     - Verification command (e.g. 'npm run build')
 * @param {number} [opts.maxAttempts=2]
 * @returns {Promise<{ success: boolean, attempts: number, duration: number, reason?: string, diff?: string }>}
 */
async function tryAiderFix({ projectDir, errorLog, testCmd, maxAttempts = DEFAULT_MAX_ATTEMPTS }) {
  if (!isAiderAvailable()) {
    log('[AIDER] Not installed — skipping self-heal');
    return { success: false, attempts: 0, duration: 0, reason: 'not_installed' };
  }

  if (!isSafeToScan()) {
    log('[AIDER] M1 thermal guard active — skipping self-heal');
    return { success: false, attempts: 0, duration: 0, reason: 'overheating' };
  }

  const affectedFiles = extractAffectedFiles(errorLog);
  if (affectedFiles.length === 0) {
    log('[AIDER] No source files detected in error log — skipping');
    return { success: false, attempts: 0, duration: 0, reason: 'no_files' };
  }

  const errorSummary = errorLog.slice(0, 2000).replace(/\n/g, ' ');
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log(`[AIDER] Attempt ${attempt}/${maxAttempts} — ${affectedFiles.length} file(s): ${affectedFiles.join(', ')}`);

    const result = await runAider(projectDir, errorSummary, affectedFiles);

    if (result.exitCode === 0) {
      try {
        execSync(testCmd, { cwd: projectDir, encoding: 'utf-8', timeout: 120000 });
        const duration = Date.now() - startTime;
        log(`[AIDER] Fix verified in ${duration}ms after ${attempt} attempt(s)`);
        return { success: true, attempts: attempt, duration, diff: result.output };
      } catch {
        log(`[AIDER] Applied but verification failed (attempt ${attempt})`);
      }
    } else {
      log(`[AIDER] Aider exited ${result.exitCode} (attempt ${attempt})`);
    }
  }

  const duration = Date.now() - startTime;
  log(`[AIDER] Self-heal exhausted after ${maxAttempts} attempt(s) — falling back to mission dispatch`);
  return { success: false, attempts: maxAttempts, duration, reason: 'max_attempts' };
}

module.exports = { tryAiderFix, isAiderAvailable, extractAffectedFiles };
