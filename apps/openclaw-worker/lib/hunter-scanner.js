const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');

// Hunter Scanner Module v2
// Scans for: TODO, FIXME, console.log, @ts-ignore, secrets, outdated deps, build health
// Generates: Priority-scored mission content object

function log(msg) {
    const ts = new Date().toISOString().slice(11, 19);
    const line = `[${ts}] [hunter] ${msg}\n`;
    try { fs.appendFileSync(config.LOG_FILE, line); } catch (_) { }
}

// 🧬 FIX: Removed /g flag — .test() with /g mutates lastIndex causing false negatives on alternating calls
const PATTERNS = [
  { name: 'TECH_DEBT', regex: /\/\/\s*(TODO|FIXME):/, type: 'SIMPLE', pane: 'WORKER', limit: 10 },
  { name: 'CONSOLE_LOG', regex: /console\.(log|warn|error)/, type: 'SIMPLE', pane: 'WORKER', limit: 20 },
  { name: 'TYPE_SAFETY', regex: /(@ts-ignore|: any)/, type: 'SIMPLE', pane: 'WORKER', limit: 15 },
  { name: 'SECURITY_RISK', regex: /(password|api_key|secret)\s*=/i, type: 'COMPLEX', pane: 'THINKER', limit: 5 }
];

function scanProject(dir, options = {}) {
  const issues = [];
  const maxIssues = options.maxIssues || 50;

  function walk(currentDir) {
    if (issues.length >= maxIssues) return;

    let files;
    try {
      files = fs.readdirSync(currentDir);
    } catch (e) { return; }

    for (const file of files) {
      if (issues.length >= maxIssues) return;
      if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === 'build' || file === '.next') continue;

      const filePath = path.join(currentDir, file);
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch (e) { continue; }

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        let content;
        try { content = fs.readFileSync(filePath, 'utf8'); } catch (e) { continue; }
        PATTERNS.forEach(pat => {
          const match = pat.regex.exec(content);
          if (match) {
            const curTypeCount = issues.filter(i => i.pattern === pat.name).length;
            if (curTypeCount < (pat.limit || 10)) {
              // 🧬 FIX: Use match.index for accurate line counting
              const lineNum = (content.substring(0, match.index).match(/\n/g) || []).length + 1;
              issues.push({
                file: filePath.replace(dir, ''),
                pattern: pat.name,
                type: pat.type,
                pane: pat.pane,
                line: lineNum
              });
            }
          }
        });
      }
    }
  }

  walk(dir);
  return issues;
}

// Gemini Flash Verification (The Beggar Strategy) — uses proxy-client (Anthropic format)
async function verifyIssueWithGemini(fileContent, pattern, filePath) {
  try {
    const { callLLM } = require('./proxy-client');
    const result = await callLLM({
      system: "You are a Senior Code Auditor. Verify if the code snippet contains a REAL issue. Return JSON: { isReal: boolean, severity: 'low'|'high', fixSuggestion: string }",
      user: `Pattern: ${pattern}\nFile: ${filePath}\n\nCode snippet:\n${fileContent.slice(0, 2000)}`,
      maxTokens: 200,
      timeoutMs: 10000,
    });

    if (!result) return { isReal: true, note: "Verification skipped (LLM returned null)" };

    // Parse JSON from content (handle markdown wrapping)
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { isReal: true, note: `Verification skipped: ${e.message}` };
  }
}

async function generateHunterMission(project, projectDir) {
  const issues = scanProject(projectDir);

  if (issues.length === 0) return null;

  // Pick the most critical or frequent issue type
  const counts = issues.reduce((acc, i) => { acc[i.pattern] = (acc[i.pattern] || 0) + 1; return acc; }, {});

  // Priority: SECURITY > TYPE_SAFETY > TECH_DEBT > CONSOLE_LOG
  let selectedPattern = 'CONSOLE_LOG';
  if (counts['SECURITY_RISK'] > 0) selectedPattern = 'SECURITY_RISK';
  else if (counts['TYPE_SAFETY'] > 0) selectedPattern = 'TYPE_SAFETY';
  else if (counts['TECH_DEBT'] > 0) selectedPattern = 'TECH_DEBT';

  const targetIssues = issues.filter(i => i.pattern === selectedPattern);
  const topIssue = targetIssues[0];

  // VERIFICATION STEP (The Beggar Strategy)
  // Read file content and verify with Gemini Flash
  try {
    const content = require('fs').readFileSync(path.join(projectDir, topIssue.file), 'utf8');
    const verification = await verifyIssueWithGemini(content, selectedPattern, topIssue.file);

    if (!verification.isReal) {
      log(`🙈 False positive detected in ${topIssue.file} (Gemini Check)`);
      return null;
    }
    log(`🎯 Target Verified: ${topIssue.file} (${verification.severity})`);
  } catch (e) {
    log(`Read error: ${e.message}`);
  }

  const targetFile = topIssue.file;
  const complexity = topIssue.type;

  const missionContent = `COMPLEXITY: ${complexity}
TIMEOUT: 20
PROJECT: ${project}

/cook "HUNTER AGENT: ${selectedPattern} cleanup. Trả lời bằng TIẾNG VIỆT.
Found ${targetIssues.length} issues of type ${selectedPattern}.
Target Verified by Gemini Flash: ${targetFile}.
Task:
1. Scan ${targetFile} and fix ${selectedPattern}.
2. Scan other files if possible within timeout.
3. Verify fixes (build/lint).
4. Report: FIXED_COUNT, REMAINING_COUNT." --auto
`;

  return { content: missionContent, pattern: selectedPattern };
}

/**
 * Check build health for a project directory.
 * @param {string} dir - Project directory
 * @returns {{ healthy: boolean, error: string|null }}
 */
function checkBuildHealth(dir) {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return { healthy: true, error: null };

    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (!pkg.scripts || !pkg.scripts.build) return { healthy: true, error: null };

        execSync('npm run build --silent 2>&1', { cwd: dir, timeout: 60000, stdio: 'pipe' });
        return { healthy: true, error: null };
    } catch (e) {
        const errMsg = (e.stderr || e.stdout || e.message || '').toString().slice(0, 200);
        return { healthy: false, error: errMsg };
    }
}

/**
 * Calculate priority score for a set of issues.
 * Higher score = more urgent.
 * @param {{ pattern: string }[]} issues
 * @returns {number} - Score 0-100
 */
function calculatePriorityScore(issues) {
    const weights = {
        SECURITY_RISK: 30,
        TYPE_SAFETY: 20,
        TECH_DEBT: 15,
        CONSOLE_LOG: 10,
    };

    let score = 0;
    const counts = issues.reduce((acc, i) => { acc[i.pattern] = (acc[i.pattern] || 0) + 1; return acc; }, {});

    for (const [pattern, count] of Object.entries(counts)) {
        const weight = weights[pattern] || 5;
        score += Math.min(count * weight, 40); // Cap contribution per type
    }

    return Math.min(score, 100);
}

/**
 * Full project health analysis — combines scan + build + priority.
 * @param {string} project - Project name
 * @param {string} projectDir - Project directory
 * @returns {{ issues: Array, buildHealth: object, priorityScore: number }}
 */
function analyzeProjectHealth(project, projectDir) {
    const issues = scanProject(projectDir);
    const buildHealth = checkBuildHealth(projectDir);
    const priorityScore = calculatePriorityScore(issues);

    log(`${project}: ${issues.length} issues, build:${buildHealth.healthy ? '✅' : '❌'}, priority:${priorityScore}/100`);

    return { issues, buildHealth, priorityScore };
}

module.exports = { scanProject, generateHunterMission, checkBuildHealth, calculatePriorityScore, analyzeProjectHealth };
